import { useEffect, useRef, useState } from 'react'
import { UciEngine } from '../engine/uci'
import { whiteEval, type WhiteEval } from '../lib/evalFormat'
import { sideToMove } from '../analysis/material'
import { terminalState } from '../lib/chessUtil'

export interface LiveEval {
  fen: string
  info: WhiteEval
}

// A lightweight, separate engine instance for evaluating positions the user explores during review
export function useLiveEngine() {
  const engineRef = useRef<UciEngine | null>(null)
  const initing = useRef<Promise<void> | null>(null)
  const pending = useRef<{ fen: string; depth: number } | null>(null)
  const running = useRef(false)
  const [result, setResult] = useState<LiveEval | null>(null)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(
    () => () => {
      engineRef.current?.dispose()
      engineRef.current = null
    },
    []
  )

  async function ensure() {
    if (engineRef.current?.initialised) return
    if (!initing.current) {
      const e = new UciEngine()
      engineRef.current = e
      initing.current = e.init({ multipv: 1 })
    }
    await initing.current
  }

  async function pump() {
    if (running.current) return
    running.current = true
    setEvaluating(true)
    try {
      while (pending.current) {
        const job = pending.current
        pending.current = null
        // terminal positions return no engine line - resolve them directly so the mate sends bar to the mated side
        const term = terminalState(job.fen)
        if (term.isTerminal) {
          const stmWhite = sideToMove(job.fen) === 'w'
          const info = term.isCheckmate
            ? { whitePct: stmWhite ? 0 : 100, label: '#', mate: true }
            : { whitePct: 50, label: '½', mate: false }
          if (!pending.current) setResult({ fen: job.fen, info })
          continue
        }
        const res = await engineRef.current!.analyse(job.fen, job.depth)
        const top = res.lines[0]
        // only publish if nothing newer has been queued meanwhile
        if (top && !pending.current) {
          setResult({ fen: job.fen, info: whiteEval(top.score, sideToMove(job.fen) === 'w') })
        }
      }
    } finally {
      running.current = false
      setEvaluating(false)
    }
  }

  async function evaluate(fen: string, depth = 14) {
    await ensure()
    pending.current = { fen, depth }
    if (running.current) engineRef.current?.stop() // cut the current search short
    else pump()
  }

  function clear() {
    pending.current = null
    setResult(null)
  }

  return { evaluate, clear, result, evaluating }
}