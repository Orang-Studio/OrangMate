import { writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const root = new URL('..', import.meta.url)
async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res
}

async function fetchOpenings() {
  mkdirSync(new URL('src/openings/data/', root), { recursive: true })
  for (const f of ['a', 'b', 'c', 'd', 'e']) {
    const res = await get(
      `https://raw.githubusercontent.com/lichess-org/chess-openings/master/${f}.tsv`
    )
    const text = await res.text()
    writeFileSync(new URL(`src/openings/data/${f}.tsv`, root), text)
    console.log(`openings/${f}.tsv  ${text.split('\n').length} lines`)
  }
}

async function fetchMerida() {
  const map = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' }
  let css =
    '/* Merida piece set (GPL, from lichess lila). Scoped to override the\n' +
    '   default cburnett set when [data-pieces="merida"] is set on a parent. */\n'
  for (const color of ['w', 'b']) {
    for (const p of ['P', 'N', 'B', 'R', 'Q', 'K']) {
      const res = await get(
        `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/merida/${color}${p}.svg`
      )
      const b64 = Buffer.from(await res.arrayBuffer()).toString('base64')
      const cn = color === 'w' ? 'white' : 'black'
      css += `[data-pieces="merida"] .cg-wrap piece.${map[p]}.${cn}{background-image:url('data:image/svg+xml;base64,${b64}');}\n`
    }
  }
  writeFileSync(new URL('src/ui/pieces-merida.css', root), css)
  console.log(`pieces-merida.css  ${css.length} bytes`)
}

await fetchOpenings()
await fetchMerida()
// regenerate icons too
execFileSync('node', ['scripts/gen-icons.mjs'], { cwd: new URL('.', root).pathname, stdio: 'inherit' })
console.log('Done. Engine: cp node_modules/stockfish/src/stockfish-18-lite-single.* public/engine/')