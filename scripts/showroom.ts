// Writes showroom.yaml, a card that shows every decoration in the catalog:
// one room per kind, its styles side by side along x, and the rooms stacked
// along y and wrapped into columns so the floor stays roughly square. Every
// item is at its style's default size and colors. Run it with
// `pnpm showroom` after any change to the catalog.
import { DECORATION_KINDS, footprint } from '#/decoration/catalog.ts'
import { snapToWall } from '#/editor/walls.ts'
import { writeFileSync } from 'node:fs'

// Room between items and round them, between rooms, and how tall a column
// of rooms gets before the next one starts.
const PAD = 0.5
const GAP = 0.4
const TALL = 30

const r2 = (v: number) => Math.round(v * 100) / 100
const rooms: string[] = []
const decorations: string[] = []
let y = 0
let left = 0
let widest = 0
// Lay the rooms out family by family so every light sits with the other
// lights, every seat with the other seats, and so on, instead of in the
// catalog's own order. The sort is stable, so within a family the kinds keep
// that order. Families run alphabetically; 'other' is pushed to the end so the
// odds and ends don't split the named groups.
const byFamily = [...DECORATION_KINDS].sort((a, b) => {
  const rank = (f: string) => (f === 'other' ? '~' : f)
  return rank(a.family).localeCompare(rank(b.family))
})
for (const kind of byFamily) {
  const styles = kind.variants?.map(v => v.id) ?? [undefined]
  const sizes = styles.map(v => footprint(kind, undefined, v))
  const width = sizes.reduce((s, [w]) => s + w + PAD, PAD)
  const depth = Math.max(1.4, ...sizes.map(([, d]) => d + 2 * PAD))
  if (y + depth > TALL && y > 0) {
    left += widest + 1
    widest = 0
    y = 0
  }
  widest = Math.max(widest, width)
  const points: [number, number][] = [
    [r2(left), r2(y)],
    [r2(left + width), r2(y)],
    [r2(left + width), r2(y + depth)],
    [r2(left), r2(y + depth)],
  ]
  rooms.push(`  - id: ${kind.id}`, `    name: ${JSON.stringify(kind.label)}`, '    points:')
  for (const [px, py] of points) rooms.push(`      - [${px}, ${py}]`)
  let x = left + PAD
  styles.forEach((style, i) => {
    const [w] = sizes[i]
    let position: [number, number] = [r2(x + w / 2), r2(y + depth / 2)]
    let rotation = 0
    // A wall item hangs on the room's back wall, facing into it.
    if (kind.mount === 'wall') {
      const snapped = snapToWall([position[0], y], points)
      position = snapped.point
      rotation = snapped.rotation
    }
    decorations.push(
      `  - id: ${kind.id}${style ? `_${style}` : ''}`,
      `    kind: ${kind.id}`,
      `    room: ${kind.id}`,
      `    position: [${position[0]}, ${position[1]}]`,
    )
    if (rotation) decorations.push(`    rotation: ${rotation}`)
    if (style) decorations.push(`    variant: ${style}`)
    x += w + PAD
  })
  y += depth + GAP
}

const yaml = [
  'type: custom:diorama-card',
  'grid_options:',
  '  columns: full',
  'rooms:',
  ...rooms,
  'decorations:',
  ...decorations,
  '',
].join('\n')
writeFileSync(new URL('../showroom.yaml', import.meta.url), yaml)
