import { useMemo } from 'react'
import { nouns, adjectives, verbs } from '../lib/words'
import { getRandomElements } from '../lib/utils'
import Word from './Word'

export default function WordList({
  wordType,
  direction = 'horizontal',
  reverse = false,
}: {
  wordType: string
  direction?: string
  reverse?: boolean
}) {
  let words: string[] = []
  const conjugate = require('conjugate')

  switch (wordType) {
    case 'nouns':
      words = nouns
      break
    case 'adjectives':
      words = adjectives
      break
    case 'verbs-1':
      words = verbs.map((verb) => conjugate('I', verb))
      break
    case 'verbs-2':
      words = verbs.map((verb) => conjugate('he', verb))
      break
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledWords = useMemo(() => getRandomElements(words), [])

  let animationClass = ''
  if (direction === 'horizontal') {
    animationClass = reverse ? 'animate-scrollXReverse' : 'animate-scrollX'
  } else {
    animationClass = reverse ? 'animate-scrollYReverse' : 'animate-scrollY'
  }

  const flexDirection = direction === 'horizontal' ? 'flex-row' : 'flex-col'

  return (
    <div
      className={`${direction === 'horizontal' ? 'w-full' : 'h-full'} overflow-hidden bg-white ${
        direction === 'horizontal' ? 'py-4' : 'px-4'
      }`}
    >
      <div className={`flex ${flexDirection} ${animationClass}`}>
        {shuffledWords.map((word, index) => (
          <span
            className={`flex-shrink-0 ${
              direction === 'horizontal' ? 'mx-8' : 'my-12'
            } text-xl whitespace-nowrap ${
              direction === 'verticalLeft' ? 'transform -rotate-90 origin-left' : ''
            } ${direction === 'verticalRight' ? 'transform rotate-90 origin-left' : ''}`}
            key={index}
          >
            <Word word={word} />
          </span>
        ))}
      </div>
    </div>
  )
}
