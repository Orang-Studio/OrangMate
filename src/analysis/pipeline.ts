import { UciEngine, type PositionEval } from '../engine/uci'
import {
  applyUciMoves,
  legalMoveCount,
  parsePgn,
  terminalState,
  uciToSan,
  uciLineToSan,
} from '../lib/chessUtil'
import type { GameAnalysis, MoveAnalysis, PlayerReport, ProgressEvent } from '../lib/types'
import { CLASS_META, type Classification } from './config'
import { acpl as computeAcpl, gameAccuracy, moveAccuracy } from './accuracy'
import { classifyMove } from './classify'
import { detectOpening } from '../openings/eco'
import { CP_CLAMP } from './config'
import { negate, scoreToWhiteCp, winPct, type Score } from './winPct'

// map score to a centipawn number for ACPL
function scoreCp(score: Score): number {
  if ('mate' in score) return score.mate > 0 ? CP_CLAMP + 1000 : -(CP_CLAMP + 1000)
  return score.cp
}

function resolveEval(raw: PositionEval, fen: string): { score: Score; pv: string[]; second: Score | null; best: string | null } {
  if (raw.lines.length > 0) {
    return {
      score: raw.lines[0].score,
      pv: raw.lines[0].pv,
      second: raw.lines[1]?.score ?? null,
      best: raw.bestMove ?? raw.lines[0].pv[0] ?? null,
    }
  }
  const term = terminalState(fen)
  if (term.isCheckmate) {
    // side to move is mated.
    return { score: { mate: 0 }, pv: [], second: null, best: null }
  }
  return { score: { cp: 0 }, pv: [], second: null, best: null }
}

function emptyCounts(): Record<Classification, number> {
  const c = {} as Record<Classification, number>
  for (const k of Object.keys(CLASS_META) as Classification[]) c[k] = 0
  return c
}

export interface AnalyzeOptions {
  depth: number
  multipv?: number
  threads?: number
  onProgress?: (p: ProgressEvent) => void
  signal?: AbortSignal
}

export async function analyzeGame(pgn: string, opts: AnalyzeOptions): Promise<GameAnalysis> {
  const { depth, onProgress, signal } = opts
  const report = (p: ProgressEvent) => onProgress?.(p)
  report({ done: 0, total: 1, phase: 'parsing', message: 'Parsing PGN…' })
  const game = parsePgn(pgn)
  const moves = game.moves
  const opening = detectOpening(game.sanList)
  // positions to evaluate.
  const positionFens = [moves[0].before, ...moves.map((m) => m.after)]
  const total = positionFens.length
  const engine = new UciEngine()
  await engine.init({ multipv: opts.multipv ?? 2, threads: opts.threads })
  engine.newGame()
  const evals: ReturnType<typeof resolveEval>[] = []
  const RATE_WINDOW = 8
  const recentMs: number[] = []
  try {
    for (let i = 0; i < positionFens.length; i++) {
      if (signal?.aborted) throw new DOMException('Analysis aborted', 'AbortError')
      const term = terminalState(positionFens[i])
      let raw: PositionEval
      if (term.isTerminal) {
        raw = { lines: [], bestMove: null }
      } else {
        const t0 = Date.now()
        raw = await engine.analyse(positionFens[i], depth)
        recentMs.push(Date.now() - t0)
        if (recentMs.length > RATE_WINDOW) recentMs.shift()
      }
      evals.push(resolveEval(raw, positionFens[i]))

      const doneCount = i + 1
      const remaining = total - doneCount
      // positions/sec from the rolling window of real search times
      const avgMs = recentMs.length ? recentMs.reduce((a, b) => a + b, 0) / recentMs.length : 0
      const pps = avgMs > 0 ? 1000 / avgMs : 0
      const etaMs = pps > 0 ? Math.round((remaining / pps) * 1000) : undefined
      report({
        done: doneCount,
        total,
        phase: 'analyzing',
        message:
          `Analyzing position ${doneCount}/${total}` +
          (pps > 0 ? ` · ${pps.toFixed(1)} pos/s` : ''),
        etaMs,
      })
    }
  } finally {
    engine.dispose()
  }

  report({ done: total, total, phase: 'classifying', message: 'Classifying moves…' })
  const analyses: MoveAnalysis[] = []
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i]
    const moverWhite = m.color === 'w'
    const before = evals[i]
    const after = evals[i + 1]
    const scoreAfterMover = negate(after.score)
    const inBook = opening ? i <= opening.lastBookPly : false
    const result = classifyMove({
      fenBefore: m.before,
      fenAfter: m.after,
      playedUci: m.lan,
      bestUci: before.best,
      bestScore: before.score,
      secondScore: before.second,
      scoreAfterMover,
      legalMoveCount: legalMoveCount(m.before),
      inBook,
      opponentPv: after.pv,
      applyMoves: applyUciMoves,
    })

    const bestCp = scoreCp(before.score)
    const playedCp = scoreCp(scoreAfterMover)
    const cpLoss = Math.max(0, Math.min(CP_CLAMP, bestCp - playedCp))
    const accuracy = moveAccuracy(result.winBefore, result.winAfter)
    analyses.push({
      ply: i,
      moveNumber: Math.floor(i / 2) + 1,
      color: moverWhite ? 'white' : 'black',
      san: m.san,
      uci: m.lan,
      fenBefore: m.before,
      fenAfter: m.after,
      classification: result.classification,
      winBefore: result.winBefore,
      winAfter: result.winAfter,
      cpLoss,
      accuracy,
      bestMoveUci: before.best,
      bestMoveSan: uciToSan(m.before, before.best),
      bestLineSan: uciLineToSan(m.before, before.pv, 8),
      evalAfterWhiteCp: scoreToWhiteCp(scoreAfterMover, moverWhite),
      scoreAfter: scoreAfterMover,
      inBook,
    })
  }

  const white = buildReport('white', game.meta.white, analyses)
  const black = buildReport('black', game.meta.black, analyses)
  report({ done: total, total, phase: 'done', message: 'Done' })
  return {
    createdAt: Date.now(),
    depth,
    pgn,
    meta: game.meta,
    opening,
    moves: analyses,
    white,
    black,
  }
}
function buildReport(color: 'white' | 'black', name: string, moves: MoveAnalysis[]): PlayerReport {
  const own = moves.filter((m) => m.color === color)
  const counts = emptyCounts()
  for (const m of own) counts[m.classification]++
  const accs = own.map((m) => m.accuracy)
  const winSeq = own.map((m) => m.winBefore)
  const accuracy = Math.round(gameAccuracy(accs, winSeq) * 10) / 10
  const acpl = computeAcpl(own.map((m) => m.cpLoss))
  return { color, name, accuracy, acpl, counts }
}

export { winPct }