import { useEffect, useState, useRef, ReactElement } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { nanoid } from 'nanoid'
import cloneDeep from 'lodash.clonedeep'
import throttle from 'lodash.throttle'
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimeChannelSendResponse,
} from '@supabase/supabase-js'

import supabaseClient from '../client'
import { Coordinates, Payload, User } from '../types'
import { getRandomColor, getRandomColors, getRandomUniqueColor } from '../lib/RandomColor'

import Cursor from '../components/Cursor'
import Loader from '../components/Loader'
import Users from '../components/Users'
import Onboarding from '../components/Onboarding'
import WordList from '../components/WordList'

const MAX_ROOM_USERS = 50
const X_THRESHOLD = 25
const Y_THRESHOLD = 35
const MAX_EVENTS_PER_SECOND = 10
const userId = nanoid()

const Room: NextPage = () => {
  const router = useRouter()
  const localColorBackup = getRandomColor()

  const usersRef = useRef<{ [key: string]: User }>({})
  const mousePositionRef = useRef<Coordinates>()

  //  Manage the refs with a state so that the UI re-renders
  const [mousePosition, _setMousePosition] = useState<Coordinates>()

  const [isInitialStateSynced, setIsInitialStateSynced] = useState<boolean>(false)
  const [roomId, setRoomId] = useState<undefined | string>(undefined)
  const [users, setUsers] = useState<{ [key: string]: User }>({})
  const [onboarded, setOnboarded] = useState(false)

  const setMousePosition = (coordinates: Coordinates) => {
    mousePositionRef.current = coordinates
    _setMousePosition(coordinates)
  }

  const mapInitialUsers = (userChannel: RealtimeChannel, roomId: string) => {
    const state = userChannel.presenceState()
    const _users = state[roomId]

    if (!_users) return

    // Deconflict duplicate colours
    const colors = Object.keys(usersRef.current).length === 0 ? getRandomColors(_users.length) : []

    if (_users) {
      setUsers((existingUsers) => {
        const updatedUsers = _users.reduce(
          (acc: { [key: string]: User }, { user_id: userId }: any, index: number) => {
            const userColors = Object.values(usersRef.current).map((user: any) => user.color)
            const color = colors.length > 0 ? colors[index] : getRandomUniqueColor(userColors)

            acc[userId] = existingUsers[userId] || {
              x: 0,
              y: 0,
              color: color.bg,
              hue: color.hue,
            }
            return acc
          },
          {}
        )
        usersRef.current = updatedUsers
        return updatedUsers
      })
    }
  }

  useEffect(() => {
    let onboarded
    if (localStorage.getItem('onboarded') === null) {
      localStorage.setItem('onboarded', 'false')
    }
    onboarded = localStorage.getItem('onboarded') === 'true'
    setOnboarded(onboarded)
  }, [])

  useEffect(() => {
    let roomChannel: RealtimeChannel

    const { slug } = router.query
    const slugRoomId = Array.isArray(slug) ? slug[0] : undefined

    if (!roomId) {
      roomChannel = supabaseClient.channel('rooms')

      roomChannel
        .on(REALTIME_LISTEN_TYPES.PRESENCE, { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC }, () => {
          let newRoomId
          const state = roomChannel.presenceState()

          // User attempting to navigate directly to an existing room with users
          if (slugRoomId && slugRoomId in state && state[slugRoomId].length < MAX_ROOM_USERS) {
            newRoomId = slugRoomId
          }

          // User will be assigned an existing room with the fewest users
          if (!newRoomId) {
            const [mostVacantRoomId, users] =
              Object.entries(state).sort(([, a], [, b]) => a.length - b.length)[0] ?? []

            if (users && users.length < MAX_ROOM_USERS) {
              newRoomId = mostVacantRoomId
            }
          }

          // Generate an id if no existing rooms are available
          setRoomId(newRoomId ?? nanoid())
        })
        .subscribe()
    } else {
      roomChannel = supabaseClient.channel('rooms', { config: { presence: { key: roomId } } })
      roomChannel.on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
        () => {
          setIsInitialStateSynced(true)
          mapInitialUsers(roomChannel, roomId)
        }
      )
      roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          const resp: RealtimeChannelSendResponse = await roomChannel.track({ user_id: userId })

          if (resp === 'ok') {
            router.push(`/${roomId}`)
          } else {
            router.push(`/`)
          }
        }
      })
    }

    return () => {
      roomChannel && supabaseClient.removeChannel(roomChannel)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  useEffect(() => {
    if (!roomId || !isInitialStateSynced) return

    let setMouseEvent: (e: MouseEvent) => void = () => {}

    const messageChannel = supabaseClient.channel(`chat_messages:${roomId}`)

    // Listen for cursor positions from other users in the room
    messageChannel.on(
      REALTIME_LISTEN_TYPES.BROADCAST,
      { event: 'POS' },
      (payload: Payload<{ user_id: string } & Coordinates>) => {
        setUsers((users) => {
          const userId = payload!.payload!.user_id
          const existingUser = users[userId]

          if (existingUser) {
            const x =
              (payload?.payload?.x ?? 0) - X_THRESHOLD > window.innerWidth
                ? window.innerWidth - X_THRESHOLD
                : payload?.payload?.x
            const y =
              (payload?.payload?.y ?? 0 - Y_THRESHOLD) > window.innerHeight
                ? window.innerHeight - Y_THRESHOLD
                : payload?.payload?.y

            users[userId] = { ...existingUser, ...{ x, y } }
            users = cloneDeep(users)
          }

          return users
        })
      }
    )

    messageChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        const sendMouseBroadcast = throttle(({ x, y }) => {
          messageChannel
            .send({
              type: 'broadcast',
              event: 'POS',
              payload: { user_id: userId, x, y },
            })
            .catch(() => {})
        }, 1000 / MAX_EVENTS_PER_SECOND)

        setMouseEvent = (e: MouseEvent) => {
          const [x, y] = [e.clientX, e.clientY]
          sendMouseBroadcast({ x, y })
          setMousePosition({ x, y })
        }
        window.addEventListener('mousemove', setMouseEvent)
      }
    })

    return () => {
      window.removeEventListener('mousemove', setMouseEvent)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isInitialStateSynced])

  if (!roomId) {
    return <Loader />
  }

  if (!onboarded) {
    return <Onboarding setOnboarded={setOnboarded} />
  }

  return (
    <div
      className={[
        'h-screen w-screen p-4 flex flex-col justify-between relative',
        'max-h-screen max-w-screen overflow-hidden',
      ].join(' ')}
    >
      <div
        className="absolute h-full w-full left-0 top-0 pointer-events-none"
        style={{
          opacity: 0.1,
          backgroundSize: '16px 16px',
          backgroundImage:
            'linear-gradient(to right, gray 1px, transparent 1px),\n    linear-gradient(to bottom, gray 1px, transparent 1px)',
        }}
      />
      <div className="flex flex-col h-full justify-between">
        <div className="flex justify-between">
          <Users users={users} />
        </div>
      </div>

      <WordList />

      {Object.entries(users).reduce((acc, [userId, data]) => {
        const { x, y, color, hue } = data
        if (x && y) {
          acc.push(<Cursor key={userId} x={x} y={y} color={color} hue={hue} />)
        }
        return acc
      }, [] as ReactElement[])}

      {/* Cursor for local client: Shouldn't show the cursor itself, only the text bubble */}
      {Number.isInteger(mousePosition?.x) && Number.isInteger(mousePosition?.y) && (
        <Cursor
          isLocalClient
          x={mousePosition?.x}
          y={mousePosition?.y}
          color={users[userId]?.color ?? localColorBackup.bg}
          hue={users[userId]?.hue ?? localColorBackup.hue}
        />
      )}
    </div>
  )
}

export default Room
