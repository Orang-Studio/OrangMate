import { winPct, type Score } from '../analysis/winPct'
export interface WhiteEval {
  whitePct: number
  label: string
  mate: boolean
}

export function whiteEval(scoreAfterMover: Score, moverWhite: boolean): WhiteEval {
  if ('mate' in scoreAfterMover) {
    const whiteMate = moverWhite ? scoreAfterMover.mate : -scoreAfterMover.mate
    return {
      whitePct: whiteMate >= 0 ? 100 : 0,
      label: (whiteMate >= 0 ? 'M' : '-M') + Math.abs(whiteMate),
      mate: true,
    }
  }
  const whiteCp = moverWhite ? scoreAfterMover.cp : -scoreAfterMover.cp
  const pawns = whiteCp / 100
  const label = (pawns >= 0 ? '+' : '') + pawns.toFixed(2)
  return { whitePct: winPct({ cp: whiteCp }), label, mate: false }
}

// eval for the very start of the game
export const START_EVAL: WhiteEval = { whitePct: 50, label: '+0.00', mate: false }