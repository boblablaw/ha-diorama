import { colorValue, decorationVariant, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'
import type { ReactNode } from 'react'

// A straight flight of stairs, anchored to the floor either way: `up` rises
// from the floor into the room; `down` has its top step flush with the floor
// and descends below it, as the head of a stairwell. Treads sit on two
// stringers, overhang the step below with a front nosing, and an optional
// riser tucks up under each tread between the stringers. Tread depth and the
// overall size are the sliders; the step count follows the rise.
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
  // Stringers sit just outside the treads, inner face flush with the tread
  // edge, so the tread ends meet them instead of poking through.
  const stringerT = 0.04
  const side = w / 2 + stringerT / 2
  const showRisers = p('risers') > 0.5

  // Top surface of tread i. Both ways the floor is the landing at y = 0 and the
  // first tread is one riser off it. Up: the first tread is one riser above the
  // floor and each next climbs a riser. Down: the first tread is one riser below
  // the floor and each next drops further, so the top riser's top is flush with
  // the floor.
  const topY = (i: number) => dir * (i + 1) * riser

  // The tread overhangs the riser below it by a small nosing, toward the
  // front (the low, +z end), so the step reads as a step and not a wall.
  const nose = 0.03
  // Risers run the full width, their ends buried in the stringers.
  const riserW = w + 0.01

  const steps: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    // Panels are seated from their base, so a tread of height treadT whose top
    // surface sits at topY(i) starts at topY(i) - treadT.
    steps.push(
      <Panel
        key={`t${i}`}
        size={[w, treadT, tread + nose]}
        radius={0.012}
        // The nosing overhangs toward the drop, which is the front (+z) going up
        // and the back (-z) going down, so it follows the flight either way.
        position={[0, topY(i) - treadT, -(i + 0.5) * tread + (dir * nose) / 2]}
      >
        {M('steps')}
      </Panel>,
    )
    // The riser closing the drop below each tread. Its base stands on the top
    // of the step below — the floor for the first up tread (topY(i - dir)) — and
    // it rises a riser's height to the underside of this tread, so every step,
    // the first included, closes with no gap and nothing pokes above the nosing.
    const riserY = topY(i - dir)
    const riserZ = down ? -(i + 1) * tread : -i * tread
    if (showRisers) {
      steps.push(
        <Panel key={`r${i}`} size={[riserW, Math.max(riser - treadT, 0.02), 0.03]} radius={0.004} position={[0, riserY, riserZ]}>
          {M('risers')}
        </Panel>,
      )
    }
  }

  // The flight finishes against the floor landing with a full riser. Up: it
  // closes the open back of the top tread, rising to the floor above. Down: it
  // closes the front of the first tread, its top flush with the floor it drops
  // from.
  if (showRisers) {
    const topBase = down ? topY(0) : topY(n - 1)
    const topZ = down ? 0 : -n * tread
    steps.push(
      <Panel key="rtop" size={[riserW, riser, 0.03]} radius={0.004} position={[0, topBase, topZ]}>
        {M('risers')}
      </Panel>,
    )
  }

  // Each stringer is a sloped board running alongside the treads. Up: the
  // diagonal runs from the floor at the front to the top tread at the back, a
  // riser below the tread tops. Down: the treads hang below the floor, so the
  // diagonal drops one riser to line up with them.
  const stringerH = 0.18
  const stringerDrop = down ? riser : 0
  const stringers = [-1, 1].map(s => (
    <Panel
      key={`s${s}`}
      size={[stringerT, stringerH, railLen]}
      radius={0.01}
      position={[
        s * side,
        (dir * rise) / 2 - stringerDrop - (stringerH / 2) * Math.cos(slope),
        -run / 2 - ((dir * stringerH) / 2) * Math.sin(slope),
      ]}
      rotation={[dir * slope, 0, 0]}
    >
      {M('stringer')}
    </Panel>
  ))

  // The 'elevation' (Raise / lower) param is applied to the whole piece by
  // standHeight, so the flight can be seated on the floor or dropped into a
  // stairwell without anything extra here.
  return (
    <group>
      {steps}
      {stringers}
    </group>
  )
}
