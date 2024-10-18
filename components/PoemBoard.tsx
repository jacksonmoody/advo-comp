import { useRef, LegacyRef, SetStateAction, Dispatch } from 'react'
import { useDrop } from 'react-dnd'
import type { DroppedWord } from '../types'

const PoemBoard = ({
  droppedWords,
  setDroppedWords,
}: {
  droppedWords: DroppedWord[]
  setDroppedWords: Dispatch<SetStateAction<DroppedWord[]>>
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

      setDroppedWords((prevWords) => [...prevWords, newWord])
    }
  }

  const handleRemove = (id: number) => {
    setDroppedWords((prevWords) => prevWords.filter((word) => word.id !== id))
  }

  return (
    <div ref={drop(dropAreaRef) as LegacyRef<HTMLDivElement>} className="relative w-full h-full">
      {droppedWords.map((word) => (
        <div
          key={word.id}
          onClick={() => handleRemove(word.id)}
          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 text-xl"
          style={{ left: word.x, top: word.y }}
          title="Click to Remove"
        >
          {word.word}
        </div>
      ))}
    </div>
  )
}

export default PoemBoard
