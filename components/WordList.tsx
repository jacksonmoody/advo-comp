import { useMemo } from 'react'
import { words } from '../lib/words'
import { shuffleArray } from '../lib/shuffle'

export default function WordList() {
  const shuffledWords = useMemo(() => shuffleArray(words), [])

  return (
    <div className="w-full overflow-hidden bg-white py-4">
      <div className="flex animate-scroll">
        {shuffledWords.map((word, index) => (
          <span className="flex-shrink-0 mx-8 text-xl whitespace-nowrap" key={index}>
            {word}
          </span>
        ))}
      </div>
    </div>
  )
}
