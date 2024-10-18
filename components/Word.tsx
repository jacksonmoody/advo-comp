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
    <div ref={dragRef} style={{ opacity }}>
      {word}
    </div>
  )
}
