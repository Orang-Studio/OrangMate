import { PIECE_VALUE } from './config'
export function materialBalance(fen: string, pov: 'w' | 'b'): number {
  const placement = fen.split(' ')[0]
  let white = 0
  let black = 0
  for (const ch of placement) {
    const lower = ch.toLowerCase()
    if (lower in PIECE_VALUE) {
      const v = PIECE_VALUE[lower]
      if (ch === ch.toUpperCase()) white += v
      else black += v
    }
  }
  const diff = white - black
  return pov === 'w' ? diff : -diff
}

export function sideToMove(fen: string): 'w' | 'b' { return (fen.split(' ')[1] as 'w' | 'b') || 'w'}