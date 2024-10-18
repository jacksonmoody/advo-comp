export interface Coordinates {
  x: number | undefined
  y: number | undefined
}

export interface Payload<T> {
  type: string
  event: string
  payload?: T
}

export interface User extends Coordinates {
  color: string
  hue: string
}
export interface DroppedWord {
  id: number
  word: string
  x: number
  y: number
}
