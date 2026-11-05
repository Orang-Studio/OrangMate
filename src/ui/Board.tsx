import { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import type { Api } from 'chessground/api'
import type { Color, Key } from 'chessground/types'
import type { DrawShape } from 'chessground/draw'
import { CLASS_META, type Classification } from '../analysis/config'

interface Props {
  fen: string
  orientation: Color
  lastMove?: string | null
  check?: boolean
  bestMove?: string | null
  mark?: { square: string; cls: Classification } | null
  movable?: boolean
  onMove?: (orig: string, dest: string) => void
}

// map for chessground's movable.dests
function computeDests(fen: string): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>()
  try {
    const chess = new Chess(fen)
    for (const m of chess.moves({ verbose: true })) {
      const arr = dests.get(m.from as Key) ?? []
      arr.push(m.to as Key)
      dests.set(m.from as Key, arr)
    }
  } catch {
    /* ignore */
  }
  return dests
}

function badgeSvg(cls: Classification): string {
  const meta = CLASS_META[cls]
  const fontSize = meta.glyph.length > 1 ? 22 : 28
  return (
    `<rect x="52" y="2" width="46" height="46" fill="${meta.color}"/>` +
    `<text x="75" y="27" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="'JetBrains Mono', monospace" font-weight="700" ` +
    `font-size="${fontSize}" fill="#0f0f0f">${meta.glyph}</text>`
  )
}

// thin react wrapper around chessground
export function Board({ fen, orientation, lastMove, check, bestMove, mark, movable, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const api = useRef<Api | null>(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove
  useEffect(() => {
    if (!ref.current) return
    api.current = Chessground(ref.current, {
      fen,
      orientation,
      viewOnly: false,
      coordinates: true,
      animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      drawable: { enabled: false, visible: true },
      movable: { free: false, color: undefined, dests: new Map(), showDests: true },
      events: {
        move: (orig, dest) => onMoveRef.current?.(orig as string, dest as string),
      },
    })
    return () => {
      api.current?.destroy()
      api.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const lm: Key[] | undefined =
      lastMove && lastMove.length >= 4
        ? [lastMove.slice(0, 2) as Key, lastMove.slice(2, 4) as Key]
        : undefined
    const turn: Color = fen.split(' ')[1] === 'b' ? 'black' : 'white'
    api.current?.set({
      fen,
      orientation,
      lastMove: lm,
      check: check ? true : undefined,
      turnColor: turn,
      movable: {
        free: false,
        color: movable ? turn : undefined,
        dests: movable ? computeDests(fen) : new Map(),
        showDests: true,
      },
    })

    const shapes: DrawShape[] = []
    if (bestMove && bestMove.length >= 4) {
      shapes.push({ orig: bestMove.slice(0, 2) as Key, dest: bestMove.slice(2, 4) as Key, brush: 'green' })
    }
    if (mark) {
      shapes.push({ orig: mark.square as Key, customSvg: { html: badgeSvg(mark.cls) } })
    }
    api.current?.setShapes(shapes)
  }, [fen, orientation, lastMove, check, bestMove, mark, movable])

  return (
    <div className="relative w-full aspect-square">
      <div ref={ref} className="w-full h-full" />
    </div>
  )
}