import type { Classification } from '../analysis/config'
import type { Score } from '../analysis/winPct'
export type Color = 'white' | 'black'

// one analysed ply.
export interface MoveAnalysis {
  ply: number // 0-based index into the move list
  moveNumber: number // chess move number
  color: Color // who made move
  san: string // SAN of played move
  uci: string // UCI of played move
  fenBefore: string // position before move
  fenAfter: string // position after move
  classification: Classification
  winBefore: number // win% of best move in position
  winAfter: number // win% after the move actually played
  cpLoss: number // centipawn loss (>= 0)
  accuracy: number // 0..100
  bestMoveUci: string | null // engine's #1 move in fenBefore
  bestMoveSan: string | null
  bestLineSan: string[]
  evalAfterWhiteCp: number // eval after move, White's perspective
  scoreAfter: Score // engine score after move
  inBook: boolean
}

export interface PlayerReport {
  color: Color
  name: string
  accuracy: number
  acpl: number
  counts: Record<Classification, number>
}

export interface OpeningInfo {
  eco: string
  name: string
  lastBookPly: number // last 0-based ply
}

export interface GameMeta {
  white: string
  black: string
  result: string
  date: string
  event?: string
  site?: string
}

export interface GameAnalysis {
  id?: string
  createdAt: number
  depth: number
  pgn: string
  meta: GameMeta
  opening: OpeningInfo | null
  moves: MoveAnalysis[]
  white: PlayerReport
  black: PlayerReport
}

export interface ProgressEvent {
  done: number
  total: number
  phase: 'parsing' | 'analyzing' | 'classifying' | 'done'
  message: string
  etaMs?: number // estimated time remaining, milliseconds
}