// per move and per game accuracy (Lichess formula) plus ACPL
// Accuracy for a single move from win% before/after
export function moveAccuracy(winBefore: number, winAfter: number): number {
  const wpl = Math.max(0, winBefore - winAfter)
  const acc = 103.1668 * Math.exp(-0.04354 * wpl) - 3.1669
  return Math.max(0, Math.min(100, acc))
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 100
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function harmonicMean(xs: number[]): number {
  if (xs.length === 0) return 100
  const denom = xs.reduce((a, b) => a + 1 / Math.max(b, 1e-6), 0)
  return xs.length / denom
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length
  return Math.sqrt(v)
}

function weightedMean(accs: number[], winSeq: number[]): number {
  if (accs.length === 0) return 100
  const weights: number[] = []
  const windowSize = Math.max(2, Math.ceil(winSeq.length / 10))
  for (let i = 0; i < accs.length; i++) {
    const start = Math.max(0, i - windowSize)
    const end = Math.min(winSeq.length, i + windowSize + 1)
    const w = Math.max(0.5, stdev(winSeq.slice(start, end)))
    weights.push(w)
  }
  const total = weights.reduce((a, b) => a + b, 0)
  if (total === 0) return mean(accs)
  return accs.reduce((sum, a, i) => sum + a * weights[i], 0) / total
}

export function gameAccuracy(moveAccs: number[], winSeq: number[]): number {
  if (moveAccs.length === 0) return 100
  const w = weightedMean(moveAccs, winSeq)
  const h = harmonicMean(moveAccs)
  return Math.max(0, Math.min(100, (w + h) / 2))
}

// average centipawn loss across a player's moves.
export function acpl(cpLosses: number[]): number {
  if (cpLosses.length === 0) return 0
  return Math.round(mean(cpLosses))
}
