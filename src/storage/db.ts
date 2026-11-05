import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GameAnalysis } from '../lib/types'
export interface GameSummary {
  id: string
  createdAt: number
  white: string
  black: string
  result: string
  date: string
  whiteAccuracy: number
  blackAccuracy: number
  opening: string | null
  plies: number
  depth: number
}

interface OrangMateDB extends DBSchema {
  games: {
    key: string
    value: GameAnalysis & { id: string }
    indexes: { 'by-createdAt': number }
  }
}

const DB_NAME = 'orangmate'
const DB_VERSION = 1
let dbPromise: Promise<IDBPDatabase<OrangMateDB>> | null = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB<OrangMateDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const store = database.createObjectStore('games', { keyPath: 'id' })
        store.createIndex('by-createdAt', 'createdAt')
      },
    })
  }
  return dbPromise
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export async function saveGame(analysis: GameAnalysis): Promise<string> {
  const id = analysis.id ?? uuid()
  const record = { ...analysis, id }
  await (await db()).put('games', record)
  return id
}

export async function getGame(id: string): Promise<GameAnalysis | undefined> {
  return (await db()).get('games', id)
}

export async function deleteGame(id: string): Promise<void> {
  await (await db()).delete('games', id)
}

export async function clearAllGames(): Promise<void> {
  await (await db()).clear('games')
}

function toSummary(g: GameAnalysis & { id: string }): GameSummary {
  return {
    id: g.id,
    createdAt: g.createdAt,
    white: g.meta.white,
    black: g.meta.black,
    result: g.meta.result,
    date: g.meta.date,
    whiteAccuracy: g.white.accuracy,
    blackAccuracy: g.black.accuracy,
    opening: g.opening ? `${g.opening.eco} ${g.opening.name}` : null,
    plies: g.moves.length,
    depth: g.depth,
  }
}

export async function listGames(): Promise<GameSummary[]> {
  const all = await (await db()).getAllFromIndex('games', 'by-createdAt')
  return all.reverse().map(toSummary)
}