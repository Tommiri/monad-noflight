export interface Point {
  x: number
  y: number
}

export interface Airport {
  name: string
  position: Point
  direction: number
}

export interface Aircraft {
  id: string
  name: string
  position: Point
  direction: number
  speed: number
  destination: string
}

export interface NoPlaneState {
  bbox: [Point, Point]
  airports: Airport[]
  aircrafts: Aircraft[]
}

export interface GameInstance {
  gameState: string
  owner: string
  status: string
  createdAt: Date
  gameType: string
  entityId: string
}

export type ErrType = 'Forbidden' | 'Internal Server Error' | 'Bad Request'

export interface Messages {
  'sub-game': {
    id: string
  }
  'game-instance': {
    gameState: string
    status: string
    reason: string
    createdAt: Date
    gameType: string
    entityId: string
  }
  'run-command': {
    gameId: string
    payload: unknown
  }
  success: {
    message: string
  }
  failure: {
    reason: ErrType
    desc?: string
  }
}

export type AllowedActions = keyof Messages
export type AllowedPayload<K extends AllowedActions> = Messages[K]
export type Message<K extends AllowedActions> = K extends AllowedActions ? [K, AllowedPayload<K>] : never
export type AnyMessage = Message<AllowedActions>
