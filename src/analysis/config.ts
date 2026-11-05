// move-classification thresholds here so they're easy to tune in one place.
export type Classification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'miss'
  | 'mistake'
  | 'blunder'
  | 'forced'

// Quality ladder thresholds. Our win% (0..100) is the same
// quantity scaled by 100, so wpl = winBefore - winAfter maps 1:1 onto the
// chess.com bands below:
//   0.00        -> Best
//   0.00 - 0.02 -> Excellent
//   0.02 - 0.05 -> Good
//   0.05 - 0.10 -> Inaccuracy
//   0.10 - 0.20 -> Mistake
//   0.20 - 1.00 -> Blunder
export const WPL = {
  best: 0.0, // played move == engine #1 (or wpl ~ 0)
  excellentMax: 2, // wpl < 2  -> excellent
  goodMax: 5, // wpl < 5  -> good
  inaccuracyMax: 10, // 5..10   -> inaccuracy (?!)
  mistakeMax: 20, // 10..20  -> mistake (?)
  // >= 20 -> blunder (??)
} as const

export const MISS = {
  // the engine's best move offered at least this win%
  minWinBefore: 60,
  // ...and the played move dropped you to about equal or worse
  maxWinAfter: 50,
  // ...by at least an inaccuracy-sized amount
  minWpl: WPL.goodMax,
} as const

export const BEST_EPS = 0.6
export const BRILLIANT = {
  // material the mover must be giving up for it to count as a sac
  minSacPawns: 2.5,
  // position must stay at least this good for the mover afterwards (win %)
  minWinAfter: 48,
  // and the played move must be (near-)best
  maxWplForBrilliant: 2,
  // "not already completely winning": if the best *non*-sacrificial alternative
  // (MultiPV #2) already wins this comfortably, the sac earns no brilliance.
  maxAlreadyWinning: 90,
} as const

export const GREAT = {
  secondBestGap: 10,
} as const

// centipawn clamp for the win% model.
export const CP_CLAMP = 1000

// standard piece values  for material / sacrifice detection.
export const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3.25,
  r: 5,
  q: 9,
  k: 0,
}

export interface ClassMeta {
  label: string
  glyph: string // short annotation glyph
  color: string
  // order for report-card listing
  order: number
}

export const CLASS_META: Record<Classification, ClassMeta> = {
  brilliant: { label: 'Brilliant', glyph: '!!', color: '#22c1bd', order: 0 },
  great: { label: 'Great', glyph: '!', color: '#3b82f6', order: 1 },
  best: { label: 'Best', glyph: '★', color: '#22c55e', order: 2 },
  excellent: { label: 'Excellent', glyph: '✓', color: '#7dd87d', order: 3 },
  good: { label: 'Good', glyph: '·', color: '#9aa0a6', order: 4 },
  book: { label: 'Book', glyph: '📖', color: '#7b7b7b', order: 5 },
  inaccuracy: { label: 'Inaccuracy', glyph: '?!', color: '#e6b800', order: 6 },
  miss: { label: 'Miss', glyph: '✗', color: '#cf6b4b', order: 7 },
  mistake: { label: 'Mistake', glyph: '?', color: '#e07b1f', order: 8 },
  blunder: { label: 'Blunder', glyph: '??', color: '#e5484d', order: 9 },
  forced: { label: 'Forced', glyph: '→', color: '#6b7280', order: 10 },
}
export const DEFAULT_DEPTH = 16
export const MULTIPV = 2