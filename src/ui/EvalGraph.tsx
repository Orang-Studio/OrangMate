import { useMemo, useRef, useState } from 'react'
import type { MoveAnalysis } from '../lib/types'
import { CLASS_META, type Classification } from '../analysis/config'
interface Props {
  moves: MoveAnalysis[]
  currentPly: number // -1..n-1
  onSelect: (ply: number) => void
}

const W = 1000
const H = 200
const CLAMP = 600 // cp range shown before flat-lining
const MARK: Set<Classification> = new Set([
  'brilliant',
  'great',
  'inaccuracy',
  'miss',
  'mistake',
  'blunder',
])

export function EvalGraph({ moves, currentPly, onSelect }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const lastPly = useRef<number>(-1)
  const n = moves.length
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W)
  const y = (cp: number) => {
    const c = Math.max(-CLAMP, Math.min(CLAMP, cp))
    return H / 2 - (c / CLAMP) * (H / 2 - 6)
  }

  const { linePath, areaPath } = useMemo(() => {
    if (n === 0) return { linePath: '', areaPath: '' }
    const pts = moves.map((m, i) => `${x(i)},${y(m.evalAfterWhiteCp)}`)
    const line = 'M' + pts.join(' L')
    const area = `M${x(0)},${H / 2} L` + pts.join(' L') + ` L${x(n - 1)},${H / 2} Z`
    return { linePath: line, areaPath: area }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves])

  const plyFromClientX = (clientX: number): number => {
    const rect = svgRef.current!.getBoundingClientRect()
    const frac = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))))
  }

  // pointer events unify mouse + touch
  const onPointerDown = (e: React.PointerEvent) => {
    if (n === 0) return
    dragging.current = true
    svgRef.current?.setPointerCapture(e.pointerId)
    const ply = plyFromClientX(e.clientX)
    lastPly.current = ply
    setHover(ply)
    onSelect(ply)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (n === 0) return
    const ply = plyFromClientX(e.clientX)
    setHover(ply)
    if (dragging.current && ply !== lastPly.current) {
      lastPly.current = ply
      onSelect(ply) // scrub the board while held
    }
  }
  const endDrag = (e: React.PointerEvent) => {
    dragging.current = false
    try {
      svgRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const activePly = hover ?? currentPly
  const hoverMove = hover !== null ? moves[hover] : null

  return (
    <div className="relative w-full panel">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-28 block cursor-pointer select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          if (!dragging.current) setHover(null)
        }}
      >
        {/* zero line */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#444444" strokeWidth={1} />
        {/* area + line */}
        <path d={areaPath} fill="#f97316" fillOpacity={0.12} />
        <path d={linePath} fill="none" stroke="#f97316" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {/* classification markers */}
        {moves.map((m, i) =>
          MARK.has(m.classification) ? (
            <rect
              key={i}
              x={x(i) - 5}
              y={y(m.evalAfterWhiteCp) - 5}
              width={10}
              height={10}
              fill={CLASS_META[m.classification].color}
              vectorEffect="non-scaling-stroke"
            />
          ) : null
        )}
        {/* current/hover guide */}
        {activePly >= 0 && activePly < n && (
          <line
            x1={x(activePly)}
            y1={0}
            x2={x(activePly)}
            y2={H}
            stroke="#e7e5e1"
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {hoverMove && (
        <div className="mono pointer-events-none absolute top-1 left-1 panel px-2 py-0.5 text-2xs">
          {hoverMove.moveNumber}
          {hoverMove.color === 'white' ? '.' : '…'} {hoverMove.san} ·{' '}
          <span style={{ color: CLASS_META[hoverMove.classification].color }}>
            {CLASS_META[hoverMove.classification].label}
          </span>
        </div>
      )}
    </div>
  )
}