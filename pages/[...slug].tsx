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
import Image from 'next/image'

import supabaseClient from '../client'
import { Coordinates, Payload, User, DroppedWord } from '../types'
import { getRandomColor, getRandomColors, getRandomUniqueColor } from '../lib/RandomColor'

import Cursor from '../components/Cursor'
import Loader from '../components/Loader'
import Users from '../components/Users'
import Onboarding from '../components/Onboarding'
import WordList from '../components/WordList'
import PoemBoard from '../components/PoemBoard'

const MAX_ROOM_USERS = 50
const X_THRESHOLD = 25
const Y_THRESHOLD = 35
const MAX_EVENTS_PER_SECOND = 10
const userId = nanoid()

const Room: NextPage = () => {
  const router = useRouter()
  const localColorBackup = getRandomColor()

  const usersRef = useRef<{ [key: string]: User }>({})
  const messageChannelRef = useRef<RealtimeChannel>()
  const mousePositionRef = useRef<Coordinates>()
  const [mousePosition, _setMousePosition] = useState<Coordinates>()

  const [isInitialStateSynced, setIsInitialStateSynced] = useState<boolean>(false)
  const [roomId, setRoomId] = useState<undefined | string>(undefined)
  const [users, setUsers] = useState<{ [key: string]: User }>({})
  const [onboarded, setOnboarded] = useState(false)
  const [droppedWords, setDroppedWords] = useState<DroppedWord[]>([])

  const setMousePosition = (coordinates: Coordinates) => {
    mousePositionRef.current = coordinates
    _setMousePosition(coordinates)
  }

  const mapInitialUsers = (userChannel: RealtimeChannel, roomId: string) => {
    const state = userChannel.presenceState()
    const _users = state[roomId]

    if (!_users) return
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

  const handleWordDrop = async (newWord: DroppedWord) => {
    setDroppedWords((prevWords) => {
      const existingWord = prevWords.find((word) => word.id === newWord.id)

      if (existingWord) {
        return prevWords.map((word) => (word.id === newWord.id ? newWord : word))
      }

      return [...prevWords, newWord]
    })

    await supabaseClient.from('words').upsert([{ ...newWord, room_id: roomId }])

    if (messageChannelRef.current) {
      messageChannelRef.current
        .send({
          type: 'broadcast',
          event: 'WORD',
          payload: newWord,
        })
        .catch(() => {})
    }
  }

  const handleWordRemove = async (word: DroppedWord) => {
    setDroppedWords((prevWords) => prevWords.filter((w) => w.id !== word.id))

    await supabaseClient.from('words').delete().eq('id', word.id)

    if (messageChannelRef.current) {
      messageChannelRef.current
        .send({
          type: 'broadcast',
          event: 'WORD-DELETE',
          payload: { ...word, x: undefined, y: undefined },
        })
        .catch(() => {})
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

          if (slugRoomId && slugRoomId in state && state[slugRoomId].length < MAX_ROOM_USERS) {
            newRoomId = slugRoomId
          }

          if (!newRoomId) {
            const [mostVacantRoomId, users] =
              Object.entries(state).sort(([, a], [, b]) => a.length - b.length)[0] ?? []

            if (users && users.length < MAX_ROOM_USERS) {
              newRoomId = mostVacantRoomId
            }
          }

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

    messageChannelRef.current = messageChannel

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
      messageChannel.unsubscribe()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isInitialStateSynced])

  useEffect(() => {
    if (!roomId || !isInitialStateSynced) return

    const messageChannel = supabaseClient.channel(`chat_messages:${roomId}`)

    messageChannel.on(
      REALTIME_LISTEN_TYPES.BROADCAST,
      { event: 'WORD' },
      (payload: Payload<DroppedWord>) => {
        setDroppedWords((prevWords) => {
          const newWord = payload.payload!
          const existingWord = prevWords.find((word) => word.id === newWord.id)

          if (existingWord) {
            return prevWords.map((word) => (word.id === newWord.id ? newWord : word))
          }

          return [...prevWords, newWord]
        })
      }
    )

    messageChannel.on(
      REALTIME_LISTEN_TYPES.BROADCAST,
      { event: 'WORD-DELETE' },
      (payload: Payload<DroppedWord>) => {
        setDroppedWords((prevWords) => prevWords.filter((w) => w.id !== payload.payload!.id))
      }
    )

    return () => {
      messageChannel.unsubscribe()
    }
  }, [roomId, isInitialStateSynced])

  useEffect(() => {
    if (!roomId || !isInitialStateSynced) return

    const fetchDroppedWords = async () => {
      const { data } = await supabaseClient.from('words').select('*').eq('room_id', roomId)

      const words = data as DroppedWord[]
      if (words) {
        setDroppedWords(words)
      }
    }

    fetchDroppedWords()
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
      <div className="flex w-full justify-end z-20">
        <Users users={users} />
      </div>

      <PoemBoard
        droppedWords={droppedWords}
        handleWordDrop={handleWordDrop}
        handleWordRemove={handleWordRemove}
      />

      <div className="fixed top-0 left-0 right-0 h-16 z-10">
        <WordList direction="horizontal" reverse={true} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 z-10">
        <WordList direction="horizontal" reverse={false} />
      </div>

      <div className="fixed top-0 bottom-0 left-0 w-16 z-10">
        <WordList direction="verticalLeft" reverse={false} />
      </div>

      <div className="fixed top-0 bottom-0 right-0 w-16 z-10">
        <WordList direction="verticalRight" reverse={true} />
      </div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 -z-10">
        <Image src="/logo.svg" alt="Advocate Logo" width="100" height="100" />
      </div>

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
