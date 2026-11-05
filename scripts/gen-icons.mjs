import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
const root = new URL('..', import.meta.url)

const ORANGE_SLICE = `
<circle cx="32" cy="32" r="32" fill="#ff7a18"/>
<circle cx="32" cy="32" r="26" fill="#ffc46b"/>
<g stroke="#ffe9c7" stroke-width="2" stroke-linecap="round">
  <line x1="32" y1="32" x2="32" y2="8"/><line x1="32" y1="32" x2="49" y2="15"/>
  <line x1="32" y1="32" x2="56" y2="32"/><line x1="32" y1="32" x2="49" y2="49"/>
  <line x1="32" y1="32" x2="32" y2="56"/><line x1="32" y1="32" x2="15" y2="49"/>
  <line x1="32" y1="32" x2="8" y2="32"/><line x1="32" y1="32" x2="15" y2="15"/>
</g>
<g fill="#ffb347">
  <path d="M32 11 a21 21 0 0 1 14.85 6.15 L32 32 Z"/>
  <path d="M53 32 a21 21 0 0 1 -6.15 14.85 L32 32 Z"/>
  <path d="M32 53 a21 21 0 0 1 -14.85 -6.15 L32 32 Z"/>
  <path d="M11 32 a21 21 0 0 1 6.15 -14.85 L32 32 Z"/>
</g>`

function cburnettWhiteRook() {
  const css = readFileSync(new URL('node_modules/chessground/assets/chessground.cburnett.css', root), 'utf8')
  const m = css.match(/piece\.rook\.white\s*\{[^}]*url\('data:image\/svg\+xml;base64,([^']+)'/)
  if (!m) throw new Error('cburnett white rook not found in chessground assets')
  return Buffer.from(m[1], 'base64').toString('utf8')
}

const rook = cburnettWhiteRook()
const rookInner = rook.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const SCALE = 0.72
const tx = (64 - 45 * SCALE) / 2
const ty = (64 - 45 * SCALE) / 2 - 1
const composed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
${ORANGE_SLICE}
<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${SCALE})">${rookInner}</g>
</svg>`

mkdirSync(new URL('public/icons/', root), { recursive: true })

for (const size of [192, 512]) {
  const png = new Resvg(composed, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(new URL(`public/icons/icon-${size}.png`, root), png)
  console.log(`icon-${size}.png  ${png.length} bytes`)
}

writeFileSync(new URL('public/icons/icon.svg', root), composed)
console.log('icon.svg written (Orang orange-slice + cburnett white rook)')