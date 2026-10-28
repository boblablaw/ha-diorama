import { colorValue, decorationVariant, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'
import type { ReactNode } from 'react'

// A straight flight of stairs. The `up` style rises away from the origin into
// the room; `down` drops below it, as the head of a stairwell. Treads sit on
// two stringers with a riser closing the front of each step; a handrail on
// slim balusters can be turned on for the left side, the right, or neither.
// Tread depth and the overall size are the sliders; the step count follows
// the total rise at a comfortable riser.
export default function StairsModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const M = (slot: string) => <Material color={c(slot)} material={m(slot)} />

  const down = (decorationVariant(kind, item.variant)?.id ?? 'up') === 'down'
  const dir = down ? -1 : 1 // +1 rises, -1 descends
  const w = p('width')
  const tread = p('tread')
  const rise = Math.max(0.2, p('rise'))
  const n = Math.max(2, Math.round(rise / 0.18)) // ~18 cm risers
  const riser = rise / n
  const run = n * tread
  const slope = Math.atan2(riser, tread)
  const railLen = Math.hypot(run, rise)
  const treadT = 0.045
  const riserT = 0.02
  const side = w / 2 - 0.03
  const railH = 0.9 // handrail height above the tread nosings

  const treadTop = (i: number) => dir * (i + 1) * riser

  // Treads and the riser that closes the front of each one.
  const steps: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    steps.push(
      <Panel key={`t${i}`} size={[w, treadT, tread]} radius={0.012} position={[0, treadTop(i) - (dir * treadT) / 2, -(i + 0.5) * tread]}>
        {M('steps')}
      </Panel>,
    )
    // Riser at the front edge of tread i, from the step below up to this tread.
    steps.push(
      <Panel
        key={`r${i}`}
        size={[w - 0.02, riser, riserT]}
        radius={0.003}
        position={[0, dir * (i + 0.5) * riser, -i * tread + riserT / 2]}
      >
        {M('risers')}
      </Panel>,
    )
  }

  // Two stringers carrying the steps, one each side, sloped along the flight.
  const stringers = [-1, 1].map(s => (
    <Panel
      key={`s${s}`}
      size={[0.04, 0.17, railLen]}
      radius={0.01}
      position={[s * side, (dir * rise) / 2 - 0.05, -run / 2]}
      rotation={[dir * slope, 0, 0]}
    >
      {M('stringer')}
    </Panel>
  ))

  // A handrail is a sloped top rail on a baluster at each step, plus a newel
  // at the foot and the head. One is drawn per enabled side.
  const railing = (s: number): ReactNode => (
    <group key={`rail${s}`}>
      <Panel
        size={[0.045, 0.05, railLen]}
        radius={0.018}
        position={[s * side, dir * (rise / 2 + riser / 2) + railH, -run / 2]}
        rotation={[dir * slope, 0, 0]}
      >
        {M('rail')}
      </Panel>
      {Array.from({ length: n }, (_, i) => (
        <Panel
          key={`bal${i}`}
          size={[0.028, railH, 0.028]}
          radius={0.008}
          position={[s * side, treadTop(i) + railH / 2, -(i + 0.5) * tread]}
        >
          {M('posts')}
        </Panel>
      ))}
      {/* Stouter newel posts at the foot and the head. */}
      <Panel size={[0.06, railH + Math.abs(treadTop(0)) + 0.05, 0.06]} radius={0.01} position={[s * side, dir * (railH / 2), -0.04]}>
        {M('posts')}
      </Panel>
      <Panel
        size={[0.06, railH + 0.1, 0.06]}
        radius={0.01}
        position={[s * side, treadTop(n - 1) + (railH + 0.1) / 2 - 0.05, -run + 0.04]}
      >
        {M('posts')}
      </Panel>
    </group>
  )

  const rails: ReactNode[] = []
  if (p('rail_left') > 0.5) rails.push(railing(-1))
  if (p('rail_right') > 0.5) rails.push(railing(1))

  return (
    <group>
      {steps}
      {stringers}
      {rails}
    </group>
  )
}
