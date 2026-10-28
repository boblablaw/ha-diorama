import { colorValue, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'

// A plain flat wall / room divider: one solid slab in a single colour. Width,
// height and depth are the sliders, and the one colour slot paints it.
export default function WallModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const W = p('width')
  const H = p('height')
  const D = p('depth')
  return (
    <Panel size={[W, H, D]} radius={0.01} position={[0, H / 2, 0]}>
      <Material color={c('wall')} material={m('wall')} />
    </Panel>
  )
}
