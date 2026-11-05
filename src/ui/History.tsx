import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAllGames, deleteGame, getGame, listGames, type GameSummary } from '../storage/db'
import { useStore } from '../store'
export function History() {
  const [games, setGames] = useState<GameSummary[]>([])
  const [loading, setLoading] = useState(true)
  const loadAnalysis = useStore((s) => s.loadAnalysis)
  const navigate = useNavigate()
  const refresh = () => {
    setLoading(true)
    listGames()
      .then(setGames)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const open = async (id: string) => {
    const g = await getGame(id)
    if (g) {
      loadAnalysis(g)
      navigate('/review')
    }
  }

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteGame(id)
    refresh()
  }

  const clearAll = async () => {
    if (!confirm('Delete all saved reviews? This cannot be undone.')) return
    await clearAllGames()
    refresh()
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wide text-ink-100">Saved reviews</h2>
        {games.length > 0 && (
          <button className="btn" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-2xs uppercase tracking-wide text-ink-300">Loading…</div>
      ) : games.length === 0 ? (
        <div className="panel p-6 text-center text-sm text-ink-300">
          No saved reviews yet. Analyze a game and it will appear here - stored locally in your
          browser.
        </div>
      ) : (
        <div className="panel divide-y divide-ink-800">
          {games.map((g) => (
            <div
              key={g.id}
              onClick={() => open(g.id)}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-ink-750"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">
                  <span className="text-ink-100">{g.white}</span>
                  <span className="text-ink-400"> vs </span>
                  <span className="text-ink-100">{g.black}</span>
                </div>
                <div className="mono text-2xs text-ink-300">
                  {g.opening ?? 'Unknown opening'} · {g.plies} plies · d{g.depth}
                </div>
              </div>
              <div className="mono text-right text-2xs tabular-nums shrink-0">
                <div className="text-orange-400">
                  {g.whiteAccuracy.toFixed(1)} / {g.blackAccuracy.toFixed(1)}%
                </div>
                <div className="text-ink-400">{g.result}</div>
              </div>
              <button className="btn shrink-0" onClick={(e) => remove(g.id, e)} title="Delete">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}