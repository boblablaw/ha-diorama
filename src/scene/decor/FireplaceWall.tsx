import { colorValue, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'

// A full-height painted-brick chimney breast that doubles as a room divider,
// with a firebox set off toward one end. The wall is built as brick around a
// rectangular opening, and the firebox is a dark recess set back into it by a
// share of the wall's depth. Seen from both sides, so the opening is closed
// off at the back. Width, height, depth, firebox offset and firebox depth are
// the sliders.
export default function FireplaceWallModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const M = (slot: string) => <Material color={c(slot)} material={m(slot)} />

  const W = p('width')
  const H = p('height')
  const D = p('depth')
  const off = p('offset') // -1 left .. 1 right
  const fbDepth = Math.min(D - 0.04, Math.max(0.05, p('firebox_depth') * D))

  const fbW = Math.min(1.0, W * 0.42)
  const fbH = Math.min(0.72, H * 0.4)
  const fbBottom = 0.12
  const fbTop = fbBottom + fbH
  const fbX = off * Math.max(0, W / 2 - fbW / 2 - 0.12)
  const fbL = fbX - fbW / 2
  const fbR = fbX + fbW / 2
  const leftW = fbL + W / 2
  const rightW = W / 2 - fbR
  const frontZ = D / 2
  const backZ = -D / 2
  const cavityZ = frontZ - fbDepth // the dark back of the firebox
  const t = 0.04

  return (
    <group>
      {/* The brick, built around the firebox opening: a column each side, a
          band over it and a band under it. */}
      {leftW > 0.01 && (
        <Panel size={[leftW, H, D]} radius={0.015} position={[-W / 2 + leftW / 2, H / 2, 0]}>
          {M('brick')}
        </Panel>
      )}
      {rightW > 0.01 && (
        <Panel size={[rightW, H, D]} radius={0.015} position={[W / 2 - rightW / 2, H / 2, 0]}>
          {M('brick')}
        </Panel>
      )}
      <Panel size={[fbW, H - fbTop, D]} radius={0.012} position={[fbX, (fbTop + H) / 2, 0]}>
        {M('brick')}
      </Panel>
      <Panel size={[fbW, fbBottom, D]} radius={0.008} position={[fbX, fbBottom / 2, 0]}>
        {M('brick')}
      </Panel>
      {/* Close the opening off at the back so the divider reads solid there. */}
      <Panel size={[fbW, fbH, t]} radius={0.004} position={[fbX, (fbBottom + fbTop) / 2, backZ + t / 2]}>
        {M('brick')}
      </Panel>
      {/* The firebox cavity: a dark back set in from the front by the depth,
          with dark sides, top and floor lining the recess. */}
      <Panel size={[fbW, fbH, t]} radius={0.004} position={[fbX, (fbBottom + fbTop) / 2, cavityZ + t / 2]}>
        {M('firebox')}
      </Panel>
      {[fbL + t / 2, fbR - t / 2].map(x => (
        <Panel key={x} size={[t, fbH, fbDepth]} radius={0.004} position={[x, (fbBottom + fbTop) / 2, cavityZ + fbDepth / 2]}>
          {M('firebox')}
        </Panel>
      ))}
      <Panel size={[fbW, t, fbDepth]} radius={0.004} position={[fbX, fbTop - t / 2, cavityZ + fbDepth / 2]}>
        {M('firebox')}
      </Panel>
      <Panel size={[fbW, t, fbDepth]} radius={0.004} position={[fbX, fbBottom + t / 2, cavityZ + fbDepth / 2]}>
        {M('firebox')}
      </Panel>
    </group>
  )
}
