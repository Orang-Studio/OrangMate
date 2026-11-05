import { useStore } from '../store'
const COOP_COEP_PRESENT =
  typeof window !== 'undefined' && (window as any).crossOriginIsolated === true

export function Settings() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)

  return (
    <div className="mx-auto w-full max-w-xl p-4">
      <h2 className="mb-3 text-sm uppercase tracking-wide text-ink-100">Settings</h2>
      <div className="panel divide-y divide-ink-800">
        {/* depth */}
        <Row label="Engine depth" hint="Higher = more accurate, slower. Default 16.">
          <div className="flex items-center gap-2">
            <button
              className="btn"
              onClick={() => setSettings({ depth: Math.max(8, settings.depth - 1) })}
            >
              −
            </button>
            <span className="mono w-8 text-center tabular-nums">{settings.depth}</span>
            <button
              className="btn"
              onClick={() => setSettings({ depth: Math.min(28, settings.depth + 1) })}
            >
              +
            </button>
          </div>
        </Row>

        {/* auto flip */}
        <Row label="Auto-flip board" hint="Orient the board to the side to move.">
          <Toggle on={settings.autoFlip} onClick={() => setSettings({ autoFlip: !settings.autoFlip })} />
        </Row>

        {/* board theme */}
        <Row label="Board theme" hint="Square palette.">
          <Segmented
            value={settings.boardTheme}
            options={['slate', 'green', 'ink']}
            onChange={(v) => setSettings({ boardTheme: v as any })}
          />
        </Row>

        {/* piece set */}
        <Row label="Piece set" hint="Open-source sets (GPL).">
          <Segmented
            value={settings.pieceSet}
            options={['cburnett', 'merida']}
            onChange={(v) => setSettings({ pieceSet: v as any })}
          />
        </Row>

        {/* threads */}
        <Row
          label="Multi-threading"
          hint={
            COOP_COEP_PRESENT
              ? 'Cross-origin isolation present - threading available.'
              : 'Requires COOP/COEP headers (not present). Stays single-threaded.'
          }
        >
          <Toggle
            on={settings.threads > 1}
            disabled={!COOP_COEP_PRESENT}
            onClick={() =>
              setSettings({ threads: settings.threads > 1 ? 1 : navigator.hardwareConcurrency || 2 })
            }
          />
        </Row>

        {/* online features */}
        <Row
          label="Online features"
          hint="Opening explorer & tablebase via lichess APIs. Sends only board positions; off by default."
        >
          <Toggle
            on={settings.onlineFeatures}
            onClick={() => setSettings({ onlineFeatures: !settings.onlineFeatures })}
          />
        </Row>
      </div>
      <p className="mt-3 text-2xs text-ink-400">
        Move-classification thresholds live in <span className="mono">src/analysis/config.ts</span>{' '}
        and are tunable in code.
      </p>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-3">
      <div className="min-w-0">
        <div className="text-sm text-ink-100">{label}</div>
        <div className="text-2xs text-ink-400">{hint}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      className={'btn ' + (on ? 'btn-accent' : '')}
      onClick={onClick}
      disabled={disabled}
      style={{ minWidth: 56 }}
    >
      {on ? 'On' : 'Off'}
    </button>
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex">
      {options.map((o) => (
        <button
          key={o}
          className={'btn ' + (o === value ? 'btn-accent' : '')}
          onClick={() => onChange(o)}
          style={{ marginLeft: -1 }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}