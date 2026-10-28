import { colorValue, decorationVariant, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Material, Panel } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'
import type { ReactNode } from 'react'

type Props = { kind: DecorationKind; item: DecorationConfig }

// A straight flight of stairs. The `up` style rises away from the origin into
// the room; `down` drops below it, as the head of a stairwell. Treads and
// risers run between two stringers, with a plain handrail and newel posts on
// each side. The tread depth and the overall size are the sliders: the number
// of steps follows the total rise at a comfortable riser height.
export default function StairsModel({ kind, item }: Props) {
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
  const treadT = 0.04
  const riserT = 0.03
  const side = w / 2 - 0.03
  const railH = 0.9

  const steps: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    const topY = dir * (i + 1) * riser
    const zMid = -(i + 0.5) * tread
    steps.push(
      <Panel key={`t${i}`} size={[w, treadT, tread]} radius={0.01} position={[0, topY - treadT / 2, zMid]}>
        {M('steps')}
      </Panel>,
    )
    steps.push(
      <Panel
        key={`r${i}`}
        size={[w, riser, riserT]}
        radius={0.004}
        position={[0, dir * (i + 0.5) * riser, -(i + 1) * tread + riserT / 2]}
      >
        {M('risers')}
      </Panel>,
    )
  }

  const stringers = [-1, 1].map(s => (
    <Panel
      key={`s${s}`}
      size={[0.04, 0.16, railLen]}
      radius={0.01}
      position={[s * side, (dir * rise) / 2 - 0.02, -run / 2]}
      rotation={[dir * slope, 0, 0]}
    >
      {M('stringer')}
    </Panel>
  ))

  const rails = [-1, 1].flatMap(s => [
    <Panel
      key={`rb${s}`}
      size={[0.04, 0.05, railLen]}
      radius={0.015}
      position={[s * side, (dir * rise) / 2 + railH, -run / 2]}
      rotation={[dir * slope, 0, 0]}
    >
      {M('rail')}
    </Panel>,
    <Panel
      key={`pf${s}`}
      size={[0.04, railH, 0.04]}
      radius={0.01}
      position={[s * side, railH / 2, -tread * 0.3]}
    >
      {M('posts')}
    </Panel>,
    <Panel
      key={`pb${s}`}
      size={[0.04, railH, 0.04]}
      radius={0.01}
      position={[s * side, dir * rise + railH / 2, -run + tread * 0.3]}
    >
      {M('posts')}
    </Panel>,
  ])

  return (
    <group>
      {steps}
      {stringers}
      {rails}
    </group>
  )
}
