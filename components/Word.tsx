import { useDrag } from 'react-dnd'

export default function Word({ word }: { word: string }) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: 'WORD',
      item: { word },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    []
  )
  return (
    <div ref={dragRef} className={`bg-white cursor-move select-none opacity-${opacity * 100}`}>
      {word}
    </div>
  )
}
