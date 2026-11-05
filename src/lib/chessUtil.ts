import { Chess, type Move } from 'chess.js'
import type { GameMeta } from './types'

export interface ParsedGame {
  meta: GameMeta
  moves: Move[]
  sanList: string[]
  startFen: string
}

export class PgnError extends Error {}
export function parsePgn(pgn: string): ParsedGame {
  const chess = new Chess()
  try {
    chess.loadPgn(pgn, { strict: false })
  } catch (e) {
    throw new PgnError(e instanceof Error ? e.message : 'Could not parse PGN')
  }
  const moves = chess.history({ verbose: true }) as Move[]
  if (moves.length === 0) {
    throw new PgnError('No moves found in PGN.')
  }
  const h = chess.getHeaders()
  const meta: GameMeta = {
    white: h.White || 'White',
    black: h.Black || 'Black',
    result: h.Result || '*',
    date: h.Date || h.UTCDate || '',
    event: h.Event,
    site: h.Site,
  }
  return {
    meta,
    moves,
    sanList: moves.map((m) => m.san),
    startFen: moves[0].before,
  }
}

const FILES = 'abcdefgh'
export function applyUciMoves(fen: string, uci: string[]): string | null {
  const chess = new Chess(fen)
  for (const u of uci) {
    const from = u.slice(0, 2)
    const to = u.slice(2, 4)
    const promotion = u.length > 4 ? u[4] : undefined
    try {
      const ok = chess.move({ from, to, promotion })
      if (!ok) return null
    } catch {
      return null
    }
  }
  return chess.fen()
}

export interface TerminalState {
  isTerminal: boolean
  isCheckmate: boolean
  isDraw: boolean
}

export function terminalState(fen: string): TerminalState {
  const chess = new Chess(fen)
  const isCheckmate = chess.isCheckmate()
  const isDraw = chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()
  return { isTerminal: isCheckmate || isDraw, isCheckmate, isDraw }
}

export function legalMoveCount(fen: string): number {
  return new Chess(fen).moves().length
}
export function uciLineToSan(fen: string, uciLine: string[], max = 8): string[] {
  const chess = new Chess(fen)
  const out: string[] = []
  for (const u of uciLine.slice(0, max)) {
    try {
      const m = chess.move({
        from: u.slice(0, 2),
        to: u.slice(2, 4),
        promotion: u.length > 4 ? u[4] : undefined,
      })
      if (!m) break
      out.push(m.san)
    } catch {
      break
    }
  }
  return out
}

// SAN of a UCI move in a given position
export function uciToSan(fen: string, uci: string | null): string | null {
  if (!uci) return null
  const chess = new Chess(fen)
  try {
    const m = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    })
    return m ? m.san : null
  } catch {
    return null
  }
}

export { FILES }