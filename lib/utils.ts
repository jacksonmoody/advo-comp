export function getRandomElements<T>(array: T[]): T[] {
  const k = 100
  const n = array.length

  if (n <= k) {
    return shuffleArray(array.slice())
  }

  const reservoir: T[] = []

  for (let i = 0; i < k; i++) {
    reservoir[i] = array[i]
  }

  for (let i = k; i < n; i++) {
    const j = getRandomInt(0, i)
    if (j < k) {
      reservoir[j] = array[i]
    }
  }

  return reservoir
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i)
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
