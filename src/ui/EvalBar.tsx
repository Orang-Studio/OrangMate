import type { WhiteEval } from '../lib/evalFormat'

interface Props {
  evalInfo: WhiteEval
  flipped: boolean
}

// Vertical eval bar: white fills from the bottom (or top when flipped).
export function EvalBar({ evalInfo, flipped }: Props) {
  const whiteFrac = Math.max(0, Math.min(100, evalInfo.whitePct))
  // White portion height
  const whiteStyle = { height: `${whiteFrac}%` }
  const whiteOnTop = flipped
  const labelOnWhiteSide = evalInfo.whitePct >= 50

  return (
    <div className="relative w-7 h-full panel select-none overflow-hidden" data-testid="evalbar">
      {/* base is black; white block drawn on the appropriate end */}
      <div className="absolute inset-0 bg-ink-950" />
      <div
        className="absolute left-0 right-0 bg-[#e7e5e1]"
        style={{
          ...whiteStyle,
          [whiteOnTop ? 'top' : 'bottom']: 0,
          transition: 'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      {/* midline */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-orange-500/60" />
      {/* eval label */}
      <div
        className={
          'mono absolute left-0 right-0 text-center text-[9px] font-semibold ' +
          (labelOnWhiteSide ? 'text-ink-900' : 'text-ink-100')
        }
        style={{ [labelOnWhiteSide === !whiteOnTop ? 'bottom' : 'top']: 2 }}
      >
        {evalInfo.label}
      </div>
    </div>
  )
}