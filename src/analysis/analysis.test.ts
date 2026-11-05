import { describe, expect, it } from 'vitest'
import { winPct, scoreToWhiteCp } from './winPct'
import { moveAccuracy, gameAccuracy, acpl } from './accuracy'
import { classifyMove, type ClassifyInput } from './classify'
import { materialBalance } from './material'

describe('winPct', () => {
  it('is 50% at equal', () => {
    expect(winPct({ cp: 0 })).toBeCloseTo(50, 5)
  })
  it('rises with advantage and is symmetric', () => {
    expect(winPct({ cp: 300 })).toBeGreaterThan(70)
    expect(winPct({ cp: 300 }) + winPct({ cp: -300 })).toBeCloseTo(100, 4)
  })
  it('treats mate as 100/0', () => {
    expect(winPct({ mate: 3 })).toBe(100)
    expect(winPct({ mate: -2 })).toBe(0)
  })
})

describe('scoreToWhiteCp', () => {
  it('flips perspective for black to move', () => {
    expect(scoreToWhiteCp({ cp: 120 }, true)).toBe(120)
    expect(scoreToWhiteCp({ cp: 120 }, false)).toBe(-120)
  })
})

describe('accuracy', () => {
  it('is ~100 for a perfect move', () => {
    expect(moveAccuracy(60, 60)).toBeGreaterThan(99)
  })
  it('drops for a blunder', () => {
    expect(moveAccuracy(70, 40)).toBeLessThan(40)
  })
  it('game accuracy bounded 0..100', () => {
    const a = gameAccuracy([100, 90, 80], [50, 55, 60])
    expect(a).toBeGreaterThan(0)
    expect(a).toBeLessThanOrEqual(100)
  })
  it('acpl averages', () => {
    expect(acpl([10, 20, 30])).toBe(20)
  })
})

describe('materialBalance', () => {
  it('is 0 at start', () => {
    expect(materialBalance('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'w')).toBe(0)
  })
  it('counts a missing black knight as +3 for white', () => {
    expect(materialBalance('r1bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'w')).toBe(3)
  })
})

const base: ClassifyInput = {
  fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  fenAfter: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  playedUci: 'e2e4',
  bestUci: 'e2e4',
  bestScore: { cp: 30 },
  secondScore: { cp: 25 },
  scoreAfterMover: { cp: 30 },
  legalMoveCount: 20,
  inBook: false,
  opponentPv: [],
  applyMoves: () => null,
}

describe('classifyMove', () => {
  it('labels the engine move as best', () => {
    expect(classifyMove(base).classification).toBe('best')
  })
  it('respects book override', () => {
    expect(classifyMove({ ...base, inBook: true }).classification).toBe('book')
  })
  it('labels a big win drop as blunder', () => {
    const r = classifyMove({
      ...base,
      playedUci: 'a2a3',
      scoreAfterMover: { cp: -400 },
    })
    expect(r.classification).toBe('blunder')
  })
  it('labels a small drop as inaccuracy', () => {
    const r = classifyMove({
      ...base,
      playedUci: 'a2a3',
      bestScore: { cp: 100 },
      scoreAfterMover: { cp: 40 }, // ~7% wpl
    })
    expect(r.classification).toBe('inaccuracy')
  })
  it('flags the only good move as great', () => {
    const r = classifyMove({
      ...base,
      bestScore: { cp: 200 },
      secondScore: { cp: -300 }, // alternative is much worse
      scoreAfterMover: { cp: 200 },
    })
    expect(r.classification).toBe('great')
  })
  it('flags a missed winning chance as miss', () => {
    const r = classifyMove({
      ...base,
      playedUci: 'a2a3',
      bestScore: { cp: 300 }, // ~73% win available
      secondScore: { cp: 250 },
      scoreAfterMover: { cp: 0 }, // let it slip to equal
    })
    expect(r.classification).toBe('miss')
  })
  it('flags single legal move as forced', () => {
    expect(classifyMove({ ...base, legalMoveCount: 1 }).classification).toBe('forced')
  })
})