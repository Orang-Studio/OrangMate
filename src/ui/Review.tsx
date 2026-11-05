import { useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { useStore } from '../store'
import { Board } from './Board'
import { EvalBar } from './EvalBar'
import { EvalGraph } from './EvalGraph'
import { MoveList } from './MoveList'
import { ReportCard } from './ReportCard'
import { ClassBadge } from './ClassBadge'
import { START_EVAL, whiteEval, type WhiteEval } from '../lib/evalFormat'
import { CLASS_META } from '../analysis/config'
import { useLiveEngine } from './useLiveEngine'
interface VarMove {
  san: string
  uci: string
  fen: string
  color: 'white' | 'black'
}
interface Variation {
  startPly: number
  line: VarMove[]
}

// format SAN principal variation with move numbers
function formatPv(sans: string[], startMoveNumber: number, startWhite: boolean): string {
  let out = ''
  let n = startMoveNumber
  let white = startWhite
  sans.forEach((s, i) => {
    if (white) {
      out += `${n}.${s} `
    } else {
      out += (i === 0 ? `${n}...${s} ` : `${s} `)
      n++
    }
    white = !white
  })
  return out.trim()
}

export function Review() {
  const analysis = useStore((s) => s.analysis)!
  const ply = useStore((s) => s.ply)
  const flipped = useStore((s) => s.flipped)
  const settings = useStore((s) => s.settings)
  const { goto, first, prev, next, last, flip } = useStore.getState()
  const moves = analysis.moves
  const [variation, setVariation] = useState<Variation | null>(null)
  const live = useLiveEngine()
  const inVar = !!(variation && variation.line.length > 0)
  const varTip = inVar ? variation!.line[variation!.line.length - 1] : null
  const current = ply >= 0 ? moves[ply] : null
  const mainFen = current ? current.fenAfter : moves[0].fenBefore
  const fen = varTip ? varTip.fen : mainFen
  const lastMove = varTip ? varTip.uci : current ? current.uci : null
  // engine line is for move you're looking at: the best line in the
  // position THAT move was played from (current.fenBefore)
  const lineSource = current ?? moves[0]
  const bestMove = !inVar ? lineSource.bestMoveUci : null
  const mark = !inVar && current ? { square: current.uci.slice(2, 4), cls: current.classification } : null
  let evalInfo: WhiteEval
  if (inVar) {
    evalInfo = live.result
      ? live.result.info
      : { whitePct: 50, label: live.evaluating ? '…' : '·', mate: false }
  } else {
    evalInfo = current ? whiteEval(current.scoreAfter, current.color === 'white') : START_EVAL
  }

  const inCheck = useMemo(() => {
    try {
      return new Chess(fen).inCheck()
    } catch {
      return false
    }
  }, [fen])

  // evaluate the branch tip whenever it changes
  useEffect(() => {
    if (varTip) live.evaluate(varTip.fen, Math.min(settings.depth, 16))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varTip?.fen])

  const exitVar = () => {
    setVariation(null)
    live.clear()
  }

  const onUserMove = (orig: string, dest: string) => {
    const chess = new Chess(fen)
    let mv
    try {
      mv = chess.move({ from: orig, to: dest, promotion: 'q' })
    } catch {
      return
    }
    if (!mv) return
    const entry: VarMove = {
      san: mv.san,
      uci: mv.lan,
      fen: chess.fen(),
      color: mv.color === 'w' ? 'white' : 'black',
    }
    setVariation((v) =>
      v && v.line.length > 0 ? { ...v, line: [...v.line, entry] } : { startPly: ply, line: [entry] }
    )
  }

  // navigation always discards the branch first
  const nav = {
    first: () => {
      exitVar()
      first()
    },
    last: () => {
      exitVar()
      last()
    },
    next: () => {
      if (inVar) return // no forward inside their branch
      next()
    },
    prev: () => {
      if (inVar) {
        setVariation((v) => {
          if (!v) return null
          const line = v.line.slice(0, -1)
          return line.length ? { ...v, line } : null
        })
        return
      }
      prev()
    },
    goto: (p: number) => {
      exitVar()
      goto(p)
    },
  }

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          nav.prev()
          break
        case 'ArrowRight':
          e.preventDefault()
          nav.next()
          break
        case 'ArrowUp':
        case 'Home':
          e.preventDefault()
          nav.first()
          break
        case 'ArrowDown':
        case 'End':
          e.preventDefault()
          nav.last()
          break
        case 'Escape':
          if (inVar) exitVar()
          break
        case 'f':
        case 'F':
          flip()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pvText =
    !inVar && lineSource.bestLineSan?.length
      ? formatPv(lineSource.bestLineSan, lineSource.moveNumber, lineSource.color === 'white')
      : ''

  return (
    <div className="mx-auto w-full max-w-6xl p-3 lg:p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-3">
        {/* eval bar + board + controls */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <EvalBar evalInfo={evalInfo} flipped={flipped} />
            <div className="flex-1 panel p-2">
              <Board
                fen={fen}
                orientation={flipped ? 'black' : 'white'}
                lastMove={lastMove}
                check={inCheck}
                bestMove={bestMove}
                mark={mark}
                movable
                onMove={onUserMove}
              />
            </div>
          </div>

          {/* variation banner */}
          {inVar && (
            <div className="panel flex items-center gap-2 p-2 text-2xs">
              <span className="shrink-0 bg-orange-500 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-ink-900">
                Variation
              </span>
              <span className="mono min-w-0 flex-1 truncate text-ink-200">
                {variation!.line.map((m) => m.san).join(' ')}
              </span>
              <button className="btn shrink-0" onClick={exitVar} title="Discard variation (Esc)">
                Exit line
              </button>
            </div>
          )}

          {/* current move + engine line + nav */}
          <div className="panel p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {inVar ? (
                  <div className="text-2xs uppercase tracking-wide text-ink-300">
                    Exploring · {live.evaluating ? 'evaluating…' : 'your move'}
                  </div>
                ) : current ? (
                  <>
                    <ClassBadge cls={current.classification} size={22} />
                    <div className="min-w-0">
                      <div className="mono text-sm">
                        {current.moveNumber}
                        {current.color === 'white' ? '.' : '…'} {current.san}{' '}
                        <span style={{ color: CLASS_META[current.classification].color }}>
                          {CLASS_META[current.classification].label}
                        </span>
                      </div>
                      {current.bestMoveSan &&
                        current.classification !== 'best' &&
                        current.classification !== 'book' && (
                          <div className="text-2xs text-ink-300">
                            Best was <span className="mono text-cls-best">{current.bestMoveSan}</span>{' '}
                            · <span className="mono">-{current.cpLoss}cp</span>
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="text-2xs uppercase tracking-wide text-ink-300">
                    Starting position
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="btn" onClick={nav.first} title="First (Home)">⏮</button>
                <button className="btn" onClick={nav.prev} title="Previous (←)">◀</button>
                <button className="btn" onClick={nav.next} title="Next (→)" disabled={inVar}>▶</button>
                <button className="btn" onClick={nav.last} title="Last (End)">⏭</button>
                <button className="btn" onClick={flip} title="Flip (F)">⇅</button>
              </div>
            </div>
            {/* engine line for move */}
            {pvText && (
              <div className="mono mt-2 border-t border-ink-800 pt-2 text-2xs text-ink-300">
                <span className="text-cls-great">Engine line </span>
                {pvText}
              </div>
            )}
          </div>
        </div>

        {/* report card + move list */}
        <div className="flex flex-col gap-3 min-h-0">
          <ReportCard analysis={analysis} />
          <div className="panel min-h-0 flex-1" style={{ maxHeight: 360 }}>
            <div className="border-b border-ink-700 px-3 py-1.5 text-2xs uppercase tracking-wide text-ink-300">
              Moves · depth {settings.depth}
            </div>
            <div style={{ height: 320 }}>
              <MoveList moves={moves} currentPly={inVar ? -2 : ply} onSelect={nav.goto} />
            </div>
          </div>
        </div>
      </div>

      {/* eval graph */}
      <div className="mt-3">
        <EvalGraph moves={moves} currentPly={inVar ? -2 : ply} onSelect={nav.goto} />
      </div>

      <p className="mt-2 text-center text-2xs text-ink-500">
        Drag a piece to explore a line · it’s evaluated live and discarded when you step back.
      </p>
    </div>
  )
}