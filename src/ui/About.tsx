export function About() {
  return (
    <div className="mx-auto w-full max-w-2xl p-4 text-sm leading-relaxed text-ink-100">
      <h2 className="mb-3 text-sm uppercase tracking-wide">About OrangMate</h2>

      <div className="panel space-y-4 p-4 text-ink-100">
        <p>
          <strong>OrangMate</strong> is a fully client-side chess game reviewer, part of the Orang
          ecosystem. It runs the Stockfish engine in your browser via WebAssembly and produces a
          move-by-move review with classifications, accuracy, an eval graph, and opening detection.
        </p>

        <Section title="No affiliation">
          OrangMate is an independent tool. It is{' '}
          <strong>not affiliated with, endorsed by, or connected to Chess.com or Lichess</strong>.
          “Chess.com” and “Lichess” are trademarks of their respective owners. The move-classification
          labels (Brilliant, Great, Best, …) are an independent heuristic approximation and are{' '}
          <em>not</em> Chess.com’s proprietary algorithm.
        </Section>

        <Section title="Privacy">
          Every PGN and its analysis are processed and stored{' '}
          <strong>locally in your browser</strong> (IndexedDB). Nothing is uploaded to any server. If
          you enable optional online features, only board positions (FENs) are sent to lichess’s
          public opening-explorer / tablebase APIs - never your identity.
        </Section>

        <Section title="Open source & licenses">
          OrangMate is licensed under the <strong>GNU GPL v3</strong>. It bundles and distributes
          GPL-licensed components - <strong>Stockfish</strong> (GPLv3) and the{' '}
          <strong>chessground</strong> board with the <strong>cburnett</strong> piece set (GPL). Their
          full license texts and source links are listed in{' '}
          <span className="mono">CREDITS.md</span> in the repository. Opening data comes from the
          lichess <span className="mono">chess-openings</span> dataset (public domain / CC0).
          <div className="mt-2">
            <button className="btn inline-block cursor-default opacity-60">To be opensourced</button>
          </div>
        </Section>

        <Section title="Warranty">
          Provided “as is”, without warranty of any kind. The analysis may be inaccurate; classification
          heuristics are approximate. Use at your own risk. This is not legal advice - review licenses
          before any commercial use.
        </Section>
      </div>

      <p className="mt-4 text-center text-2xs text-ink-400">
        OrangMate · mate.oranges.lt · Orang-Studio
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-2xs font-semibold uppercase tracking-wide text-orange-400">{title}</h3>
      <p className="text-ink-100">{children}</p>
    </div>
  )
}