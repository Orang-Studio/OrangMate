import { useStore } from '../store'
function formatEta(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return 'almost done'
  const s = Math.round(ms / 1000)
  if (s < 60) return `~${s}s left`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `~${m}m ${rem.toString().padStart(2, '0')}s left`
}

export function ProgressOverlay() {
  const analyzing = useStore((s) => s.analyzing)
  const progress = useStore((s) => s.progress)
  const cancel = useStore((s) => s.cancel)
  if (!analyzing) return null
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0
  const eta =
    progress?.phase === 'analyzing' && progress.etaMs !== undefined
      ? formatEta(progress.etaMs)
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4">
      <div className="panel w-full max-w-md p-5">
        <div className="mb-1 text-sm uppercase tracking-wide text-ink-100">Analyzing game</div>
        <div className="mono mb-3 text-2xs text-ink-300">
          {progress?.message ?? 'Starting engine…'}
        </div>
        <div className="h-3 w-full border border-ink-600 bg-ink-900">
          <div className="h-full bg-orange-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mono mt-1 flex justify-between text-2xs tabular-nums text-ink-300">
          <span>{eta ?? ' '}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}