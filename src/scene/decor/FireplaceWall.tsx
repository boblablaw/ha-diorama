import { colorValue, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'
import type { ReactNode } from 'react'

// A full-height painted-brick chimney breast that doubles as a room divider,
// with a firebox set off toward one end, a chunky wood mantel over it and a
// lower side shelf, and a raised hearth. Seen from both sides, so the brick
// coursing and the mantel run through. Width, height, depth and where the
// firebox sits are the sliders.
export default function FireplaceWallModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const M = (slot: string) => <Material color={c(slot)} material={m(slot)} />

  const W = p('width')
  const H = p('height')
  const D = p('depth')
  const off = p('offset') // -1 left .. 1 right, where the firebox sits

  const fbW = Math.min(1.0, W * 0.42)
  const fbH = Math.min(0.72, H * 0.4)
  const hearthH = 0.1
  const fbX = off * Math.max(0, W / 2 - fbW / 2 - 0.15)
  const mantelY = hearthH + fbH + 0.16

  // Horizontal mortar courses on both faces, to read as coursed brick.
  const courses: ReactNode[] = []
  const n = Math.max(6, Math.round(H / 0.095))
  for (let k = 1; k < n; k++) {
    const y = (k * H) / n
    for (const z of [D / 2, -D / 2]) {
      courses.push(
        <Panel key={`c${k}:${z}`} size={[W, 0.012, 0.012]} radius={0.004} position={[0, y, z]}>
          {M('mortar')}
        </Panel>,
      )
    }
  }

  return (
    <group>
      {/* The brick mass. */}
      <Panel size={[W, H, D]} radius={0.015} position={[0, H / 2, 0]}>
        {M('brick')}
      </Panel>
      {courses}
      {/* The firebox, a dark recess set into the front just above the hearth. */}
      <Panel size={[fbW, fbH, 0.2]} radius={0.01} position={[fbX, hearthH + fbH / 2, D / 2 - 0.08]}>
        {M('firebox')}
      </Panel>
      {/* The raised hearth in front of it. */}
      <Panel size={[fbW + 0.3, hearthH, 0.4]} radius={0.01} position={[fbX, hearthH / 2, D / 2 + 0.2]}>
        {M('hearth')}
      </Panel>
      {/* The chunky mantel beam over the firebox, running through the wall. */}
      <Panel size={[fbW + 0.5, 0.14, D + 0.16]} radius={0.02} position={[fbX, mantelY, 0]}>
        {M('mantel')}
      </Panel>
      {/* A lower floating side shelf to one side, the short arm of the L. */}
      <Panel size={[W * 0.32, 0.06, 0.24]} radius={0.01} position={[fbX - (fbW / 2 + W * 0.18), mantelY - 0.28, D / 2 + 0.02]}>
        {M('mantel')}
      </Panel>
    </group>
  )
}
