import { dir } from 'console'
import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { GameInstance, Message, NoPlaneState } from './types'
import { normalizeHeading } from './utils/math'
import { message } from './utils/message'

const frontend_base = 'noflight.monad.fi'
const backend_base = 'noflight.monad.fi/backend'

// 1st steps - solution
/* const generateCommands = (gameState: NoPlaneState) => {
  const { aircrafts, airports } = gameState

  const commands: string[] = []

  // Airport is straight ahead
  // Returning an empty string array == keep same heading 
  return commands
} */

// Turning - solution
/* const generateCommands = (gameState: NoPlaneState) => {
  const { aircrafts, airports } = gameState

  const commands: string[] = []

  for (const { id, direction, position } of aircrafts) {
    const aircraftY: number = Math.floor(position.y)
    const airportY: number = airports[0].position.y
    const isEqualY: boolean = aircraftY >= airportY - 10
    
    let heading: number = direction

    if (heading > 50) {
      heading -= 20
      commands.push(`HEAD ${id} ${normalizeHeading(heading)}`)
    }

    if (isEqualY && heading > 0) {
      heading -= heading > 10 ? 20 : 10
      commands.push(`HEAD ${id} ${normalizeHeading(heading)}`)
    }

  }
  
  return commands
} */

// Loop Around - solution
/* const generateCommands = (gameState: NoPlaneState) => {
  const { aircrafts, airports } = gameState

  const commands: string[] = []

  for (const { id, direction, position } of aircrafts) {
    const aircraftX: number = Math.floor(position.x)
    const airportX: number = airports[0].position.x
    const isEqualX: boolean = aircraftX <= airportX

    let heading: number = direction

    if (heading === 180) {
      heading += 10
      commands.push(`HEAD ${id} ${normalizeHeading(heading)}`)
    }

    if (isEqualX && heading > 0) {
      heading -= heading > 10 ? 20 : 10
      commands.push(`HEAD ${id} ${normalizeHeading(heading)}`)
    }
  }

  return commands
}
 */

// Multiplane - solution
const generateCommands = (gameState: NoPlaneState) => {
  const { aircrafts, airports } = gameState

  const commands: string[] = []

  for (const { id, direction, position } of aircrafts) {
    const aircraftX: number = Math.floor(position.x)
    const airportX: number = airports[0].position.x
    const isEqualX: boolean = aircraftX >= airportX - 20

    let heading: number = direction

    if (aircraftX === -60 && heading === 0) {
      heading += 20
      commands.push(`HEAD ${id} ${normalizeHeading(heading)}`)
    }

    if (isEqualX && heading < 90) {
      heading += heading < 80 ? 20 : 10
      commands.push(`HEAD ${id} ${normalizeHeading(heading)}`)
      continue
    }
  }

  return commands
}

const createGame = async (levelId: string, token: string) => {
  const res = await fetch(`https://${backend_base}/api/levels/${levelId}`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  })

  if (!res.ok) {
    console.error(`Couldn't create game: ${res.statusText} - ${await res.text()}`)
    return null
  }

  return res.json() as any as GameInstance // Can be made safer
}

const main = async () => {
  const token = process.env['TOKEN'] ?? ''
  const levelId = process.env['LEVEL_ID'] ?? ''

  const game = await createGame(levelId, token)
  if (!game) return

  const url = `https://${frontend_base}/?id=${game.entityId}`
  console.log(`Game at ${url}`)
  await open(url)
  await new Promise((f) => setTimeout(f, 2000))

  const ws = new WebSocket(`wss://${backend_base}/${token}/`)

  ws.addEventListener('open', () => {
    ws.send(message('sub-game', { id: game.entityId }))
  })

  ws.addEventListener('message', ({ data }) => {
    const [action, payload] = JSON.parse(data.toString()) as Message<'game-instance'>

    if (action !== 'game-instance') {
      console.log([action, payload])
      return
    }

    // New game tick arrived!
    const gameState = JSON.parse(payload['gameState']) as NoPlaneState
    const commands = generateCommands(gameState)
    // console.log(commands)*

    setTimeout(() => {
      ws.send(message('run-command', { gameId: game.entityId, payload: commands }))
    }, 100)
  })
}

await main()
