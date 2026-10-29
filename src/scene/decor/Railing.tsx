import { colorValue, decorationVariant, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import { Bar, Material, Panel, SEG } from '#/scene/decor/parts.tsx'
import type { DecorationConfig } from '#/types.ts'
import { useEffect, useMemo, type ReactNode } from 'react'
import { LatheGeometry, Vector2 } from 'three'

// A classic turned baluster, as a lathe profile: beads, a vase belly, a neck
// and an upper bulb between end blocks. Radius as a fraction of the widest
// turning, at a height fraction from base to top.
const TURNED: [number, number][] = [
  [0.0, 0.85],
  [0.06, 0.85],
  [0.08, 0.5],
  [0.14, 0.42],
  [0.2, 0.62],
  [0.26, 0.5],
  [0.34, 1.0],
  [0.44, 0.78],
  [0.52, 0.42],
  [0.6, 0.5],
  [0.68, 0.82],
  [0.76, 0.5],
  [0.82, 0.4],
  [0.9, 0.6],
  [0.95, 0.85],
  [1.0, 0.85],
]

// A straight run of guard railing along its length, centred on the origin and
// standing on the floor. Styles: indoor with a rounded wood handrail on slim
// round metal posts and balusters; indoor with turned wood balusters; and an
// outdoor deck one in square wood. The indoor styles can cap either end post
// with a round ball finial.
export default function RailingModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const M = (slot: string) => <Material color={c(slot)} material={m(slot)} />

  const style = decorationVariant(kind, item.variant)?.id ?? 'indoor'
  const outdoor = style === 'outdoor'
  const turned = style === 'turned'
  const L = p('length')
  const h = p('height')

  // Dimensions per style, in metres.
  const postT = outdoor ? 0.09 : turned ? 0.06 : 0.045 // post side / diameter
  const railH = outdoor ? 0.05 : 0.045 // top rail height
  const railD = outdoor ? 0.09 : 0.05 // rail depth (along z)
  const botY = outdoor ? 0.08 : 0.03 // bottom rail base off the floor
  const botH = outdoor ? 0.045 : 0.03 // bottom rail height
  const balT = outdoor ? 0.03 : turned ? 0.045 : 0.016 // baluster side / diameter
  const gap = turned ? 0.085 : 0.1 // clear space between balusters

  const balBottom = botY + botH
  const balH = h - railH - balBottom

  // One shared lathe geometry for every turned baluster.
  const spindle = useMemo(() => {
    if (!turned) return null
    const maxR = balT / 2
    return new LatheGeometry(
      TURNED.map(([y, r]) => new Vector2(r * maxR, y * balH)),
      SEG,
    )
  }, [turned, balT, balH])
  useEffect(() => () => spindle?.dispose(), [spindle])

  const nodes: ReactNode[] = []

  // Posts at both ends and spaced so no bay is wider than maxSpan.
  const maxSpan = outdoor ? 1.7 : 2.2
  const bays = Math.max(1, Math.ceil(L / maxSpan))
  for (let i = 0; i <= bays; i++) {
    const x = -L / 2 + (L * i) / bays
    nodes.push(
      outdoor ? (
        <Panel key={`p${i}`} size={[postT, h, postT]} radius={0.006} position={[x, 0, 0]}>
          {M('posts')}
        </Panel>
      ) : (
        <Bar key={`p${i}`} length={h} radius={postT / 2} position={[x, h / 2, 0]}>
          {M('posts')}
        </Bar>
      ),
    )
  }

  // A round ball finial on either end post, for the indoor styles.
  const ballR = postT * 0.75
  if (!outdoor && p('finial_left') > 0.5)
    nodes.push(
      <mesh key="fl" position={[-L / 2, h + ballR * 0.6, 0]}>
        <sphereGeometry args={[ballR, SEG, SEG / 2]} />
        {M('posts')}
      </mesh>,
    )
  if (!outdoor && p('finial_right') > 0.5)
    nodes.push(
      <mesh key="fr" position={[L / 2, h + ballR * 0.6, 0]}>
        <sphereGeometry args={[ballR, SEG, SEG / 2]} />
        {M('posts')}
      </mesh>,
    )

  // Top rail along the whole run, sitting flush with the top of the posts.
  nodes.push(
    outdoor ? (
      <Panel key="toprail" size={[L, railH, railD]} radius={0.01} position={[0, h - railH, 0]}>
        {M('rail')}
      </Panel>
    ) : (
      <Bar key="toprail" length={L} radius={railH / 2} position={[0, h - railH / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        {M('rail')}
      </Bar>
    ),
  )

  // A slim bottom rail the balusters stand on.
  nodes.push(
    <Panel key="botrail" size={[L, botH, outdoor ? railD : 0.035]} radius={0.006} position={[0, botY, 0]}>
      {M('rail')}
    </Panel>,
  )

  // Balusters evenly filling the bays between the bottom rail and the top rail,
  // inset a little from the end posts.
  const pitch = balT + gap
  const cells = Math.max(2, Math.round((L - postT) / pitch))
  const step = (L - postT) / cells
  for (let i = 0; i < cells; i++) {
    const x = -L / 2 + postT / 2 + step * (i + 0.5)
    nodes.push(
      turned ? (
        <mesh key={`b${i}`} geometry={spindle!} position={[x, balBottom, 0]} castShadow>
          {M('balusters')}
        </mesh>
      ) : outdoor ? (
        <Panel key={`b${i}`} size={[balT, balH, balT]} radius={0.004} position={[x, balBottom, 0]}>
          {M('balusters')}
        </Panel>
      ) : (
        <Bar key={`b${i}`} length={balH} radius={balT / 2} position={[x, balBottom + balH / 2, 0]}>
          {M('balusters')}
        </Bar>
      ),
    )
  }

  return <group>{nodes}</group>
}
