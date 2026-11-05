import aTsv from './data/a.tsv?raw'
import bTsv from './data/b.tsv?raw'
import cTsv from './data/c.tsv?raw'
import dTsv from './data/d.tsv?raw'
import eTsv from './data/e.tsv?raw'
export interface EcoEntry {
  eco: string
  name: string
  plies: number
}

function normSan(san: string): string {
  return san.replace(/[+#!?]/g, '')
}

function pgnToKey(pgn: string): string {
  const tokens = pgn
    .replace(/\d+\.(\.\.)?/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normSan)
  return tokens.join(' ')
}

function parseTsv(tsv: string, map: Map<string, EcoEntry>) {
  const lines = tsv.split('\n')
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const [eco, name, pgn] = line.split('\t')
    if (!eco || !pgn) continue
    const key = pgnToKey(pgn)
    map.set(key, { eco, name, plies: key.split(' ').length })
  }
}

let lookup: Map<string, EcoEntry> | null = null
let maxPlies = 0

function getLookup(): Map<string, EcoEntry> {
  if (lookup) return lookup
  lookup = new Map()
  for (const tsv of [aTsv, bTsv, cTsv, dTsv, eTsv]) parseTsv(tsv, lookup)
  for (const e of lookup.values()) maxPlies = Math.max(maxPlies, e.plies)
  return lookup
}

export interface OpeningMatch {
  eco: string
  name: string
  lastBookPly: number // 0-based btw
}

// given the full SAN move list of a game return the deepest opening match
export function detectOpening(sanMoves: string[]): OpeningMatch | null {
  const map = getLookup()
  const norm = sanMoves.map(normSan)
  const limit = Math.min(norm.length, maxPlies)
  let best: EcoEntry | null = null
  let bestLen = 0
  for (let len = limit; len >= 1; len--) {
    const key = norm.slice(0, len).join(' ')
    const hit = map.get(key)
    if (hit) {
      best = hit
      bestLen = len
      break
    }
  }
  if (!best) return null
  return { eco: best.eco, name: best.name, lastBookPly: bestLen - 1 }
}