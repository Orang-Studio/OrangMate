import { useRef, useState } from 'react'
import { useStore } from '../store'
import { parsePgn } from '../lib/chessUtil'
const SAMPLE_PGN = `[Event "Immortal Game"]
[Site "London"]
[Date "1851.06.21"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]
1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5
8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8
15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6
21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`

export function PgnInput() {
  const analyze = useStore((s) => s.analyze)
  const analyzing = useStore((s) => s.analyzing)
  const [text, setText] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setText(content)
    setLocalError(null)
  }

  const validateAndRun = () => {
    setLocalError(null)
    const pgn = text.trim()
    if (!pgn) {
      setLocalError('Paste a PGN or upload a .pgn file first.')
      return
    }
    try {
      parsePgn(pgn) // surface parse errors before spinning up engine
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Invalid PGN.')
      return
    }
    analyze(pgn)
  }

  return (
    <div className="panel p-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm uppercase tracking-wide text-ink-100">Review a game</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Upload .pgn
          </button>
          <button
            className="btn"
            onClick={() => {
              setText(SAMPLE_PGN)
              setLocalError(null)
            }}
          >
            Sample
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pgn,text/plain"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </div>
      <textarea
        className="mono w-full h-48 bg-ink-900 border border-ink-600 p-3 text-xs text-ink-100 resize-y focus:border-orange-500"
        placeholder={'Paste PGN here…\n\n[Event "…"]\n1. e4 e5 2. Nf3 …'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
      {localError && (
        <div className="mt-2 border border-cls-blunder/60 bg-cls-blunder/10 px-3 py-2 text-xs text-cls-blunder">
          {localError}
        </div>
      )}
      <div className="mt-3 flex items-center justify-end">
        <button className="btn btn-accent" onClick={validateAndRun} disabled={analyzing}>
          {analyzing ? 'Analyzing…' : 'Analyze game'}
        </button>
      </div>
    </div>
  )
}