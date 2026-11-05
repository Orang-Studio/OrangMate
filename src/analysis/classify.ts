import {
  BEST_EPS,
  BRILLIANT,
  Classification,
  GREAT,
  MISS,
  WPL,
} from './config'
import { materialBalance, sideToMove } from './material'
import { winPct, type Score } from './winPct'
export interface ClassifyInput {
  fenBefore: string
  fenAfter: string // after the played move
  playedUci: string
  bestUci: string | null
  // MultiPV at fenBefore, mover's perspective
  bestScore: Score // line #1
  secondScore: Score | null // line #2
  scoreAfterMover: Score
  legalMoveCount: number
  inBook: boolean
  opponentPv: string[]
  applyMoves: (fen: string, uci: string[]) => string | null
}

export interface ClassifyResult {
  classification: Classification
  winBefore: number
  winAfter: number
  wpl: number
}

function isSacrifice(input: ClassifyInput): boolean {
  const moverSide = sideToMove(input.fenBefore)
  const matBefore = materialBalance(input.fenBefore, moverSide)
  // walk up to 4 plies of the opponent's principal variation.
  const window = input.opponentPv.slice(0, 4)
  let minMat = materialBalance(input.fenAfter, moverSide)
  let fen = input.fenAfter
  for (let i = 0; i < window.length; i++) {
    const next = input.applyMoves(fen, [window[i]])
    if (!next) break
    fen = next
    const mat = materialBalance(fen, moverSide)
    if (mat < minMat) minMat = mat
  }
  return matBefore - minMat >= BRILLIANT.minSacPawns
}

export function classifyMove(input: ClassifyInput): ClassifyResult {
  const winBefore = winPct(input.bestScore)
  const winAfter = winPct(input.scoreAfterMover)
  const wpl = Math.max(0, winBefore - winAfter)

  // book overrides quality labels
  if (input.inBook) {
    return { classification: 'book', winBefore, winAfter, wpl }
  }

  // only one legal move
  if (input.legalMoveCount <= 1) {
    return { classification: 'forced', winBefore, winAfter, wpl }
  }

  const playedIsBest =
    (input.bestUci !== null && input.playedUci === input.bestUci) || wpl <= BEST_EPS
  const alreadyWinning =
    input.secondScore !== null &&
    winPct(input.secondScore) >= BRILLIANT.maxAlreadyWinning
  if (
    playedIsBest &&
    wpl <= BRILLIANT.maxWplForBrilliant &&
    winAfter >= BRILLIANT.minWinAfter &&
    !alreadyWinning &&
    isSacrifice(input)
  ) {
    return { classification: 'brilliant', winBefore, winAfter, wpl }
  }
  if (playedIsBest && input.secondScore) {
    const secondWin = winPct(input.secondScore)
    if (winBefore - secondWin >= GREAT.secondBestGap) {
      return { classification: 'great', winBefore, winAfter, wpl }
    }
  }
  if (
    winBefore >= MISS.minWinBefore &&
    winAfter <= MISS.maxWinAfter &&
    wpl >= MISS.minWpl
  ) {
    return { classification: 'miss', winBefore, winAfter, wpl }
  }

  // quality ladder by win-percent-lost.
  let classification: Classification
  if (input.bestUci !== null && input.playedUci === input.bestUci) classification = 'best'
  else if (wpl < WPL.excellentMax) classification = 'excellent'
  else if (wpl < WPL.goodMax) classification = 'good'
  else if (wpl < WPL.inaccuracyMax) classification = 'inaccuracy'
  else if (wpl < WPL.mistakeMax) classification = 'mistake'
  else classification = 'blunder'
  return { classification, winBefore, winAfter, wpl }
}