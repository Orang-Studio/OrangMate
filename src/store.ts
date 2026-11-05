import { create } from 'zustand'
import { analyzeGame } from './analysis/pipeline'
import { saveGame } from './storage/db'
import { DEFAULT_DEPTH } from './analysis/config'
import type { GameAnalysis, ProgressEvent } from './lib/types'
export type PieceSet = 'cburnett' | 'merida'
export type BoardTheme = 'slate' | 'green' | 'ink'

export interface Settings {
  depth: number
  autoFlip: boolean
  pieceSet: PieceSet
  boardTheme: BoardTheme
  threads: number // 1 = single-threaded
  onlineFeatures: boolean
}

const SETTINGS_KEY = 'orangmate.settings'

function loadSettings(): Settings {
  const def: Settings = {
    depth: DEFAULT_DEPTH,
    autoFlip: false,
    pieceSet: 'cburnett',
    boardTheme: 'slate',
    threads: 1,
    onlineFeatures: false,
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...def, ...JSON.parse(raw) } : def
  } catch {
    return def
  }
}

function persistSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

interface AppState {
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void

  analysis: GameAnalysis | null
  // -1 start position; 0..n-1 = after the move at that ply
  ply: number
  flipped: boolean
  analyzing: boolean
  progress: ProgressEvent | null
  error: string | null
  abort: AbortController | null

  analyze: (pgn: string) => Promise<void>
  cancel: () => void
  loadAnalysis: (a: GameAnalysis) => void
  goto: (ply: number) => void
  first: () => void
  prev: () => void
  next: () => void
  last: () => void
  flip: () => void
}

export const useStore = create<AppState>((set, get) => ({
  settings: loadSettings(),
  setSettings: (patch) =>
    set((s) => {
      const settings = { ...s.settings, ...patch }
      persistSettings(settings)
      return { settings }
    }),

  analysis: null,
  ply: -1,
  flipped: false,
  analyzing: false,
  progress: null,
  error: null,
  abort: null,

  analyze: async (pgn) => {
    const { settings } = get()
    const abort = new AbortController()
    set({ analyzing: true, error: null, progress: null, abort })
    try {
      const analysis = await analyzeGame(pgn, {
        depth: settings.depth,
        threads: settings.threads,
        signal: abort.signal,
        onProgress: (p) => set({ progress: p }),
      })
      // Auto-orient to the side that the result viewer cares about least
      set({
        analysis,
        ply: -1,
        flipped: settings.autoFlip ? false : false,
        analyzing: false,
        abort: null,
      })
      try {
        const id = await saveGame(analysis)
        set((s) => ({ analysis: s.analysis ? { ...s.analysis, id } : s.analysis }))
      } catch {
        /* saving is best effort */
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        set({ analyzing: false, abort: null, progress: null })
      } else {
        set({
          analyzing: false,
          abort: null,
          error: e instanceof Error ? e.message : 'Analysis failed',
        })
      }
    }
  },

  cancel: () => {
    get().abort?.abort()
  },

  loadAnalysis: (a) => set({ analysis: a, ply: -1, flipped: false, error: null }),
  goto: (ply) => {
    const a = get().analysis
    if (!a) return
    const max = a.moves.length - 1
    set({ ply: Math.max(-1, Math.min(max, ply)) })
  },
  first: () => set({ ply: -1 }),
  prev: () => set((s) => ({ ply: Math.max(-1, s.ply - 1) })),
  next: () =>
    set((s) => ({
      ply: s.analysis ? Math.min(s.analysis.moves.length - 1, s.ply + 1) : s.ply,
    })),
  last: () => set((s) => ({ ply: s.analysis ? s.analysis.moves.length - 1 : -1 })),
  flip: () => set((s) => ({ flipped: !s.flipped })),
}))