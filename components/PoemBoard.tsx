import { useDrop } from 'react-dnd'

export default function Bucket() {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'WORD',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }))

  return <div ref={drop} className={`w-full h-full z-0 ${isOver ? 'opacity-50' : 'opacity-100'}`} />
}
