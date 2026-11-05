import type { Score } from '../analysis/winPct'
export const ENGINE_URL = '/engine/stockfish-18-lite-single.js'

export interface PvLine {
  multipv: number // 1-based rank
  depth: number
  score: Score // from side-to-move's perspective
  pv: string[] // uci moves
}

export interface PositionEval {
  lines: PvLine[] // index 0 is best
  bestMove: string | null // uci of engine's chosen move
}

type Pending = {
  resolve: (e: PositionEval) => void
  reject: (err: Error) => void
  byPv: Map<number, PvLine>
}

function parseScore(tokens: string[], i: number): Score | null {
  const kind = tokens[i + 1]
  const val = parseInt(tokens[i + 2], 10)
  if (Number.isNaN(val)) return null
  if (kind === 'cp') return { cp: val }
  if (kind === 'mate') return { mate: val }
  return null
}

export class UciEngine {
  private worker: Worker | null = null
  private ready = false
  private pending: Pending | null = null
  private multipv = 2
  private onLine: ((line: string) => void) | null = null
  async init(opts: { multipv?: number; threads?: number } = {}): Promise<void> {
    if (this.worker) return
    this.multipv = opts.multipv ?? 2
    this.worker = new Worker(ENGINE_URL)
    this.worker.onmessage = (ev: MessageEvent) => this.handle(String(ev.data))
    this.worker.onerror = (ev) => {
      this.pending?.reject(new Error('Engine worker error: ' + ev.message))
    }

    await this.handshake()
    this.send('setoption name MultiPV value ' + this.multipv)
    if (opts.threads && opts.threads > 1) {
      this.send('setoption name Threads value ' + opts.threads)
    }
    this.send('setoption name UCI_AnalyseMode value true')
    await this.isReady()
    this.ready = true
  }

  private handshake(): Promise<void> {
    return new Promise((resolve) => {
      const prev = this.onLine
      this.onLine = (line) => {
        if (line.includes('uciok')) {
          this.onLine = prev
          resolve()
        }
      }
      this.send('uci')
    })
  }

  isReady(): Promise<void> {
    return new Promise((resolve) => {
      const prev = this.onLine
      this.onLine = (line) => {
        if (line.includes('readyok')) {
          this.onLine = prev
          resolve()
        }
      }
      this.send('isready')
    })
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd)
  }

  private handle(line: string) {
    this.onLine?.(line)

    if (!this.pending) return
    const p = this.pending

    if (line.startsWith('info ')) {
      const tokens = line.split(/\s+/)
      if (tokens.includes('lowerbound') || tokens.includes('upperbound')) return
      let multipv = 1
      let depth = 0
      let score: Score | null = null
      let pv: string[] = []
      for (let i = 1; i < tokens.length; i++) {
        const t = tokens[i]
        if (t === 'multipv') multipv = parseInt(tokens[i + 1], 10)
        else if (t === 'depth') depth = parseInt(tokens[i + 1], 10)
        else if (t === 'score') score = parseScore(tokens, i)
        else if (t === 'pv') {
          pv = tokens.slice(i + 1)
          break
        }
      }
      if (score && pv.length > 0) {
        const existing = p.byPv.get(multipv)
        if (!existing || depth >= existing.depth) {
          p.byPv.set(multipv, { multipv, depth, score, pv })
        }
      }
      return
    }

    if (line.startsWith('bestmove')) {
      const bestMove = line.split(/\s+/)[1] ?? null
      const lines = [...p.byPv.values()].sort((a, b) => a.multipv - b.multipv)
      this.pending = null
      p.resolve({ lines, bestMove: bestMove === '(none)' ? null : bestMove })
    }
  }

  analyse(fen: string, depth: number): Promise<PositionEval> {
    if (!this.worker) return Promise.reject(new Error('Engine not initialised'))
    if (this.pending) return Promise.reject(new Error('Engine busy'))
    return new Promise<PositionEval>((resolve, reject) => {
      this.pending = { resolve, reject, byPv: new Map() }
      this.send('position fen ' + fen)
      this.send('go depth ' + depth)
    })
  }

  stop() {
    this.send('stop')
  }

  newGame() {
    this.send('ucinewgame')
  }

  dispose() {
    try {this.send('quit')} catch { /* ignore */ }
    this.worker?.terminate()
    this.worker = null
    this.ready = false
    this.pending = null
  }

  get initialised() {
    return this.ready
  }
}