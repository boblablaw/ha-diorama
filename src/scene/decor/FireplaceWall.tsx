import { colorValue, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'

// A full-height painted-brick chimney breast that doubles as a room divider,
// with a firebox set off toward one end. The wall is built as brick around a
// rectangular opening; the recess is lined with brick on its sides, head and
// base (the frame pieces themselves) and closed by a dark block set back from
// the front by a share of the wall's depth — so you look into a brick recess
// with a dark back, the depth of which is the "firebox depth" slider.
export default function FireplaceWallModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const M = (slot: string) => <Material color={c(slot)} material={m(slot)} />

  const W = p('width')
  const H = p('height')
  const D = p('depth')
  const off = p('offset') // -1 left .. 1 right
  const fbDepth = Math.min(D - 0.06, Math.max(0.05, p('firebox_depth') * D))

  const fbW = Math.min(1.0, W * 0.42)
  const fbH = Math.min(0.72, H * 0.4)
  const fbBottom = 0.12
  const fbTop = fbBottom + fbH
  const fbMidY = (fbBottom + fbTop) / 2
  const fbX = off * Math.max(0, W / 2 - fbW / 2 - 0.12)
  const fbL = fbX - fbW / 2
  const fbR = fbX + fbW / 2
  const leftW = fbL + W / 2
  const rightW = W / 2 - fbR
  const backZ = -D / 2

  // The dark block that forms the back of the recess, sitting behind a thin
  // brick cap so the wall stays solid brick when seen from behind.
  const darkDepth = Math.max(0.02, D - fbDepth - 0.03)

  return (
    <group>
      {/* Brick around the opening: a column each side, a band over and under. */}
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
      {/* Thin brick cap closing the opening at the very back. */}
      <Panel size={[fbW, fbH, 0.03]} radius={0.004} position={[fbX, fbMidY, backZ + 0.015]}>
        {M('brick')}
      </Panel>
      {/* The dark firebox block, its front set back from the wall face by the
          firebox depth. */}
      <Panel size={[fbW - 0.01, fbH - 0.01, darkDepth]} radius={0.006} position={[fbX, fbMidY, backZ + 0.03 + darkDepth / 2]}>
        {M('firebox')}
      </Panel>
    </group>
  )
}
