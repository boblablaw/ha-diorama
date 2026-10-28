import { colorValue, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'
import type { ReactNode } from 'react'

// A plain brick wall / room divider: a mortar-coloured slab faced with brick
// courses in a running bond, the thin gaps between the bricks reading as the
// mortar. Bricks are proud of both faces, so the coursing shows from either
// side. Width, height and depth are the sliders. (A firebox inset comes later.)
export default function FireplaceWallModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const M = (slot: string) => <Material color={c(slot)} material={m(slot)} />
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)

  const W = p('width')
  const H = p('height')
  const D = p('depth')

  const gap = 0.012 // mortar joint
  const brickFull = 0.24 // nominal brick length including a joint
  const rows = Math.max(3, Math.round(H / 0.097))
  const courseH = H / rows
  const brickH = Math.max(0.03, courseH - gap)
  const brickD = D + 0.02 // proud of both faces, so joints read as recesses

  const bricks: ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    const cy = r * courseH + courseH / 2
    const shift = r % 2 ? brickFull / 2 : 0
    for (let bx = -W / 2 - shift + brickFull / 2; bx - brickFull / 2 < W / 2; bx += brickFull) {
      const left = Math.max(-W / 2, bx - (brickFull - gap) / 2)
      const right = Math.min(W / 2, bx + (brickFull - gap) / 2)
      const bw = right - left
      if (bw < 0.03) continue
      bricks.push(
        <mesh key={`${r}:${bx.toFixed(2)}`} position={[(left + right) / 2, cy, 0]} castShadow receiveShadow>
          <boxGeometry args={[bw, brickH, brickD]} />
          {M('brick')}
        </mesh>,
      )
    }
  }

  return (
    <group>
      {/* The mortar sits behind, showing through the joints between bricks. */}
      <Panel size={[W, H, D]} radius={0.01} position={[0, H / 2, 0]}>
        {M('mortar')}
      </Panel>
      {bricks}
    </group>
  )
}
