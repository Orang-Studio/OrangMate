import { useEffect, useRef } from 'react'
import type { MoveAnalysis } from '../lib/types'
import { CLASS_META } from '../analysis/config'
import { ClassBadge } from './ClassBadge'
interface Props {
  moves: MoveAnalysis[]
  currentPly: number
  onSelect: (ply: number) => void
}

function MoveCell({
  move,
  active,
  onSelect,
}: {
  move: MoveAnalysis | undefined
  active: boolean
  onSelect: (ply: number) => void
}) {
  if (!move) return <div className="flex-1" />
  return (
    <button
      onClick={() => onSelect(move.ply)}
      className={
        'flex-1 flex items-center gap-1.5 px-2 py-1 text-left text-sm border-l border-ink-700 ' +
        (active ? 'bg-orange-500/15 text-orange-300' : 'hover:bg-ink-750')
      }
      style={active ? { boxShadow: 'inset 2px 0 0 #f97316' } : undefined}
    >
      <span className="mono tabular-nums" style={{ color: CLASS_META[move.classification].color }}>
        {move.san}
      </span>
      <span className="ml-auto shrink-0">
        <ClassBadge cls={move.classification} size={14} />
      </span>
    </button>
  )
}

export function MoveList({ moves, currentPly, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const rows: { no: number; white?: MoveAnalysis; black?: MoveAnalysis }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ no: Math.floor(i / 2) + 1, white: moves[i], black: moves[i + 1] })
  }

  // Keep active move visible WITHIN list only
  useEffect(() => {
    const container = ref.current
    const el = container?.querySelector('[data-active="true"]') as HTMLElement | null
    if (!container || !el) return
    const cr = container.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    if (er.top < cr.top) container.scrollTop += er.top - cr.top
    else if (er.bottom > cr.bottom) container.scrollTop += er.bottom - cr.bottom
  }, [currentPly])

  return (
    <div ref={ref} className="overflow-y-auto h-full">
      {rows.map((r) => (
        <div
          key={r.no}
          className="flex items-stretch border-b border-ink-800"
          data-active={r.white?.ply === currentPly || r.black?.ply === currentPly}
        >
          <div className="mono w-9 shrink-0 px-2 py-1 text-2xs text-ink-300 self-center text-right tabular-nums">
            {r.no}
          </div>
          <MoveCell move={r.white} active={r.white?.ply === currentPly} onSelect={onSelect} />
          <MoveCell move={r.black} active={r.black?.ply === currentPly} onSelect={onSelect} />
        </div>
      ))}
    </div>
  )
}