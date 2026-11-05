import type { GameAnalysis } from '../lib/types'
import { CLASS_META, type Classification } from '../analysis/config'
import { ClassBadge } from './ClassBadge'
const ROW_ORDER: Classification[] = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'miss',
  'mistake',
  'blunder',
  'forced',
]

export function ReportCard({ analysis }: { analysis: GameAnalysis }) {
  const { white, black, opening } = analysis
  return (
    <div className="panel">
      {/* accuracy header */}
      <div className="grid grid-cols-2 border-b border-ink-700">
        <AccuracyCell label={white.name} value={white.accuracy} side="white" />
        <AccuracyCell label={black.name} value={black.accuracy} side="black" />
      </div>

      {opening && (
        <div className="border-b border-ink-700 px-3 py-2 text-2xs text-ink-300">
          <span className="mono text-orange-400">{opening.eco}</span>{' '}
          <span className="text-ink-100">{opening.name}</span>
        </div>
      )}

      {/* classification breakdown */}
      <div className="divide-y divide-ink-800">
        {ROW_ORDER.map((cls) => {
          const w = white.counts[cls]
          const b = black.counts[cls]
          if (w === 0 && b === 0) return null
          return (
            <div key={cls} className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="mono px-3 py-1 text-right text-sm tabular-nums">{w}</div>
              <div className="flex items-center justify-center gap-1.5 px-2 py-1">
                <ClassBadge cls={cls} size={15} />
                <span className="text-2xs" style={{ color: CLASS_META[cls].color }}>
                  {CLASS_META[cls].label}
                </span>
              </div>
              <div className="mono px-3 py-1 text-left text-sm tabular-nums">{b}</div>
            </div>
          )
        })}
      </div>

      {/* apcl foot */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-ink-700 text-2xs text-ink-300">
        <div className="mono px-3 py-1.5 text-right tabular-nums">{white.acpl}</div>
        <div className="px-2 py-1.5 uppercase tracking-wide">ACPL</div>
        <div className="mono px-3 py-1.5 text-left tabular-nums">{black.acpl}</div>
      </div>
    </div>
  )
}

function AccuracyCell({
  label,
  value,
  side,
}: {
  label: string
  value: number
  side: 'white' | 'black'
}) {
  return (
    <div className={'px-3 py-3 ' + (side === 'white' ? 'border-r border-ink-700' : '')}>
      <div className="flex items-center gap-1.5 text-2xs text-ink-300 uppercase tracking-wide">
        <span
          className="inline-block w-2.5 h-2.5 border border-ink-400"
          style={{ background: side === 'white' ? '#e7e5e1' : '#0f0f0f' }}
        />
        <span className="truncate">{label}</span>
      </div>
      <div className="mono mt-1 text-2xl font-semibold tabular-nums text-orange-400">
        {value.toFixed(1)}
        <span className="text-sm text-ink-300">%</span>
      </div>
      <div className="text-2xs text-ink-400 uppercase tracking-wide">Accuracy</div>
    </div>
  )
}