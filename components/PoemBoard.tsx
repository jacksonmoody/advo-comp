import { useRef, Ref } from 'react'
import { useDrop } from 'react-dnd'
import type { DroppedWord } from '../types'

const PoemBoard = ({
  droppedWords,
  handleWordDrop,
  handleWordRemove,
}: {
  droppedWords: DroppedWord[]
  handleWordDrop: (newWord: DroppedWord) => Promise<void>
  handleWordRemove: (word: DroppedWord) => Promise<void>
}) => {
  const dropAreaRef = useRef<HTMLDivElement>()

  const [, drop] = useDrop(
    () => ({
      accept: 'WORD',
      drop: (item: { word: string }, monitor) => handleDrop(item, monitor),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [droppedWords]
  )

  const handleDrop = (item: { word: string }, monitor: any) => {
    const clientOffset = monitor.getClientOffset()
    const dropAreaRect = dropAreaRef.current?.getBoundingClientRect()

    if (clientOffset && dropAreaRect) {
      const x = clientOffset.x - dropAreaRect.left
      const y = clientOffset.y - dropAreaRect.top

      const newWord: DroppedWord = {
        id: Date.now(),
        word: item.word,
        x,
        y,
      }

      handleWordDrop(newWord)
    }
  }

  return (
    <div ref={drop(dropAreaRef) as Ref<HTMLDivElement>} className="relative w-full h-full">
      {droppedWords.map((word) => (
        <p
          key={word.id}
          onClick={() => handleWordRemove(word)}
          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 text-xl hover:bg-red-50"
          style={{ left: word.x, top: word.y }}
        >
          {word.word}
        </p>
      ))}
    </div>
  )
}

export default PoemBoard
