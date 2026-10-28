import { colorValue, decorationVariant, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'
import type { ReactNode } from 'react'

// A straight flight of stairs, anchored to the floor either way: `up` rises
// from the floor into the room; `down` has its top step flush with the floor
// and descends below it, as the head of a stairwell. Treads sit on two
// stringers with a riser closing the front of each step; a handrail on slim
// balusters can be turned on for the left side, the right, or neither. Tread
// depth and the overall size are the sliders; the step count follows the rise.
export default function StairsModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const M = (slot: string) => <Material color={c(slot)} material={m(slot)} />

  const down = (decorationVariant(kind, item.variant)?.id ?? 'up') === 'down'
  const dir = down ? -1 : 1
  const w = p('width')
  const tread = p('tread')
  const rise = Math.max(0.2, p('rise'))
  const n = Math.max(2, Math.round(rise / 0.18)) // ~18 cm risers
  const riser = rise / n
  const run = n * tread
  const slope = Math.atan2(riser, tread)
  const railLen = Math.hypot(run, rise)
  const treadT = 0.045
  const side = w / 2 - 0.03
  const showRisers = p('risers') > 0.5

  // Top surface of tread i, with the lowest tread flush on the floor. Up: the
  // first tread sits on the floor and each next rises a riser. Down: the top
  // tread is on the floor and each next drops a riser below it.
  const topY = (i: number) => dir * i * riser
  const midY = (topY(0) + topY(n - 1)) / 2

  const steps: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    steps.push(
      <Panel key={`t${i}`} size={[w, treadT, tread]} radius={0.012} position={[0, topY(i) - treadT / 2, -(i + 0.5) * tread]}>
        {M('steps')}
      </Panel>,
    )
    // The riser closing the front of the drop below each tread. Going up, the
    // floor-level first tread needs none; going down, every tread has one.
    // The riser closes the vertical drop between two treads: at the front of
    // tread i going up, at its back (= front of the next, lower tread) going down.
    const riserY = down ? -(i + 0.5) * riser : (i - 0.5) * riser
    const riserZ = down ? -(i + 1) * tread : -i * tread
    if ((down || i >= 1) && showRisers) {
      steps.push(
        <Panel key={`r${i}`} size={[w - 0.01, riser + treadT, 0.035]} radius={0.004} position={[0, riserY, riserZ]}>
          {M('risers')}
        </Panel>,
      )
    }
  }

  const stringers = [-1, 1].map(s => (
    <Panel
      key={`s${s}`}
      size={[0.04, 0.18, railLen]}
      radius={0.01}
      position={[s * side, midY - 0.08, -run / 2]}
      rotation={[dir * slope, 0, 0]}
    >
      {M('stringer')}
    </Panel>
  ))

  // A free vertical offset so the whole flight can be slid up or down to seat
  // it on the floor or drop it into a stairwell.
  const elev = p('elevation')

  return (
    <group position={[0, elev, 0]}>
      {steps}
      {stringers}
    </group>
  )
}
