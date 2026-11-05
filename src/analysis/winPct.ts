import { CP_CLAMP } from './config'
// engine score from the perspective of the side to move
export type Score = { cp: number } | { mate: number }
export function isMate(s: Score): s is { mate: number } {
  return 'mate' in s
}

// Win probability 0..100
export function winPct(score: Score): number {
  if (isMate(score)) {
    return score.mate > 0 ? 100 : 0
  }
  const cp = Math.max(-CP_CLAMP, Math.min(CP_CLAMP, score.cp))
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

// convert a score to centipawns from White's perspective for the eval bar/graph
export function scoreToWhiteCp(score: Score, whiteToMove: boolean): number {
  if (isMate(score)) {
    // represent mate as large bounded cp so graph/bar stay sane
    const signed = score.mate > 0 ? 1 : -1
    const fromMover = signed * (CP_CLAMP + 1000)
    return whiteToMove ? fromMover : -fromMover
  }
  return whiteToMove ? score.cp : -score.cp
}

// flip a score to the opponent's perspective..
export function negate(score: Score): Score { return isMate(score) ? { mate: -score.mate } : { cp: -score.cp }}