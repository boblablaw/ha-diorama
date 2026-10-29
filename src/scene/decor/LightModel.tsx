import { colorValue, decorationVariant, materialValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import FlushLight from '#/scene/decor/CeilingLights.tsx'
import DeskLamp from '#/scene/decor/DeskLamps.tsx'
import { DESK_LAMPS } from '#/scene/decor/deskLampSpecs.ts'
import FloorLamp from '#/scene/decor/FloorLamps.tsx'
import { FLOOR_LAMPS } from '#/scene/decor/floorLampSpecs.ts'
import { BaseMaterial, ShadeMaterial, type LightState } from '#/scene/decor/lightMaterials.tsx'
import Pendant from '#/scene/decor/Pendants.tsx'
import { PENDANTS } from '#/scene/decor/pendantSpecs.ts'
import TableLamp from '#/scene/decor/TableLamps.tsx'
import { TABLE_LAMPS } from '#/scene/decor/tableLampSpecs.ts'
import WallLamp from '#/scene/decor/WallLamps.tsx'
import { WALL_LAMPS } from '#/scene/decor/wallLampSpecs.ts'
import { FloatingShelf } from '#/scene/decor/Storage.tsx'
import { Rod, Tube } from '#/scene/decor/parts.tsx'
import { Vector3 } from 'three'
import { LAMP_SHADOW_MAP_PX, LAMP_SHADOW_RADIUS } from '#/constants.ts'
import { CEILING_HEIGHT_M, LAMP_KEY_SHARE, LAMP_OUTPUT, LAMP_THROUGH_SHARE, LIGHT_POINT_INTENSITY } from '#/theme.ts'
import type { DecorationConfig } from '#/types.ts'

import { useEased } from '#/scene/decor/ease.ts'
import { useWarmed } from '#/scene/warm.ts'
import { useLayoutEffect, useRef } from 'react'
import type { BufferGeometry, Camera, Group, Mesh, PointLight, RectAreaLight } from 'three'
import type { ItemState } from '#/scene/decor/state.ts'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

// Rect area lights need their uniform tables built once, and they only
// light standard materials, which is what every model here uses.
RectAreaLightUniformsLib.init()

type Props = {
  kind: DecorationKind
  item: DecorationConfig
  state: ItemState | null
}

// Smooth, chunky shapes: squashed spheres, capsules and domes, matte
// surfaces. Segment counts stay low so the silhouettes read as simple.
const SEG = 32

function Glow({
  state,
  at,
  spread = 0,
  output = 1,
}: {
  state: LightState | null
  // Where the bulb is, inside the shade rather than on the frame that holds
  // it: a floor lamp lights from the middle of its shade, not from its mast.
  at: [number, number, number]
  spread?: number
  // What this kind of lamp puts out, against the rest of them.
  output?: number
}) {
  const lit = useEased(state?.on ? (state.level ?? 1) : 0, 9)
  const [r, g, b] = state?.glow ?? [1, 1, 1]
  // The lights stay mounted while the lamp is off but are hidden, which
  // takes them out of the scene's light count. A light that is counted
  // costs every material a share of its shader and its uniforms on every
  // frame, at nothing as much as at full, and a flat of dark lamps was
  // paying more for them than for everything it drew. Switching one does
  // change the count and has the shaders built again, so they are shown or
  // hidden only once those are ready, and the frame that shows them does
  // not stall.
  const dark = lit < 0.01
  // Close to linear with the level: a lamp at a third still lights the
  // room around it, and still casts, instead of fading away first.
  const total = dark ? 0 : LIGHT_POINT_INTENSITY * output * (0.25 + 0.75 * lit) * lit
  // What the bulb is heading for, so the lamps that may cast are ranked by
  // where they will be and not by where the fade has got to. Ranked by the
  // moment's intensity, a lamp coming on stood behind every lamp already
  // on until it was nearly full, and its shadows arrived only then.
  const level = state?.on ? (state.level ?? 1) : 0
  const rank = LIGHT_POINT_INTENSITY * output * (0.25 + 0.75 * level) * level * LAMP_KEY_SHARE
  // The bulb asks for its shadow from the first frame it is lit. Which
  // lamps cast is settled on every draw, within the budget, so that has the
  // last word, see `balance`. It is only ever switched on here: switching
  // it off while the lamp is lit would change the count of shadows behind
  // the back of what hands them out.
  const strip = useRef<RectAreaLight>(null)
  const bulb = useRef<PointLight>(null)
  const through = useRef<PointLight>(null)
  const latestRank = useRef(rank)
  useLayoutEffect(() => {
    latestRank.current = rank
  })
  const shown = useWarmed(!dark, on => {
    for (const light of [strip.current, bulb.current, through.current]) if (light) light.visible = on
    if (on && bulb.current && latestRank.current > 0) bulb.current.castShadow = true
  })
  // A strip is a line of light, not a point. A rect area light is one
  // continuous source, so the wash along a long strip is even instead of
  // beading wherever a point happens to sit.
  if (spread > 0.4) {
    return (
      <rectAreaLight
        ref={strip}
        position={[at[0], at[1] - 0.02, at[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={spread}
        height={0.06}
        color={[r, g, b]}
        intensity={total * 4}
        visible={shown}
      />
    )
  }
  return (
    <>
      {/* The bulb. What the shade stops on its way out lands as a shadow of
          whatever stands around the lamp. */}
      <pointLight
        ref={bulb}
        position={at}
        color={[r, g, b]}
        intensity={total * LAMP_KEY_SHARE}
        distance={7}
        decay={1.15}
        visible={shown}
        userData={{ rank }}
        shadow-mapSize={[LAMP_SHADOW_MAP_PX, LAMP_SHADOW_MAP_PX]}
        shadow-radius={LAMP_SHADOW_RADIUS}
        // Small offsets: a big one pushes the sample past a thin top or
        // panel and lets the light through the middle of it.
        shadow-bias={-0.0012}
        shadow-normalBias={0.008}
        shadow-camera-near={0.05}
        shadow-camera-far={9}
      />
      {/* What comes through the shade itself. Parchment and opal glass are
          not walls: they glow, so this part reaches past the shade and casts
          nothing. */}
      <pointLight
        ref={through}
        position={at}
        color={[r, g, b]}
        intensity={total * LAMP_THROUGH_SHARE}
        distance={6}
        decay={1.25}
        visible={shown}
        userData={{ through: true }}
      />
    </>
  )
}

// A lamp's own parts are left out of its own bulb's shadows, so the lamp
// never darkens itself or throws its stand across the room around it. They
// still cast for the sun and for every other lamp. Three asks no one which
// light a part should cast for, so the part is drawn as nothing while the
// shadow of its own bulb is drawn.
function ownShadowless(group: Group) {
  const lights: PointLight[] = []
  group.traverse(object => {
    if ((object as PointLight).isPointLight && !object.userData.through) lights.push(object as PointLight)
  })
  // The bulb stays mounted while the lamp is off, so its camera is the same
  // for as long as the lamp is.
  const camera = lights[0]?.shadow.camera
  if (!camera) return
  let held = 0
  group.traverse(object => {
    const mesh = object as Mesh
    if (!mesh.isMesh || mesh.userData.ownShadowless) return
    mesh.userData.ownShadowless = true
    mesh.onBeforeShadow = (_r, _o, _c, shadowCamera: Camera, geometry: BufferGeometry) => {
      if (shadowCamera !== camera) return
      held = geometry.drawRange.count
      geometry.drawRange.count = 0
    }
    mesh.onAfterShadow = (_r, _o, _c, shadowCamera: Camera, geometry: BufferGeometry) => {
      if (shadowCamera === camera) geometry.drawRange.count = held
    }
  })
}

export default function LightModel({ kind, item, state }: Props) {
  const own = useRef<Group>(null)
  // Again after every render, for the parts a new style or size brings.
  useLayoutEffect(() => {
    if (own.current) ownShadowless(own.current)
  })
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const m = (slot: string) => materialValue(kind, slot, item.variant)
  const size = p('size')
  let body: React.ReactNode
  let glowAt: [number, number, number] = [0, 1, 0]
  // How far the light is spread along the item, for a strip.
  let glowSpread = 0
  switch (kind.id) {
    case 'light_ceiling': {
      const style = decorationVariant(kind, item.variant)?.id ?? 'focus'
      const r = size / 2
      if (style !== 'focus') {
        const drop = style === 'dome' ? r * 0.45 : style === 'drum' ? 0.14 : 0.12
        glowAt = [0, CEILING_HEIGHT_M - drop - 0.05, 0]
        body = <FlushLight style={style} r={r} drop={drop} c={c} m={m} state={state} />
        break
      }
      // A plain round focus in the ceiling, ten centimeters across.
      glowAt = [0, CEILING_HEIGHT_M - r - 0.05, 0]
      body = (
        <group>
          <mesh position={[0, CEILING_HEIGHT_M - 0.006, 0]}>
            <cylinderGeometry args={[r, r, 0.012, SEG * 2]} />
            <BaseMaterial color={c('rim')} material={m('rim')} />
          </mesh>
          <mesh position={[0, CEILING_HEIGHT_M - 0.014, 0]} userData={{ transmits: true }}>
            <cylinderGeometry args={[r * 0.88, r * 0.88, 0.006, SEG * 2]} />
            <ShadeMaterial color={c('focus')} material={m('focus')} state={state} />
          </mesh>
        </group>
      )
      break
    }
    case 'light_pendant': {
      const style = decorationVariant(kind, item.variant)?.id ?? 'nagoya'
      const spec = PENDANTS[style] ?? PENDANTS.nagoya
      const k = size / spec.diameter
      const top = CEILING_HEIGHT_M - p('cord')
      glowAt = [0, top - spec.glow * k, 0]
      body = <Pendant style={style} k={k} top={top} c={c} m={m} state={state} />
      break
    }
    case 'light_floor': {
      const style = decorationVariant(kind, item.variant)?.id ?? 'tmm'
      const spec = FLOOR_LAMPS[style] ?? FLOOR_LAMPS.tmm
      // The width scales the whole lamp, and the height and depth lengthen
      // parts of it.
      const k = size / spec.size
      const up = Math.max(p('height') / k - spec.height, -spec.shrink)
      const out = Math.max(p('depth') / k - spec.depth, -spec.thin)
      glowAt = [(spec.glow[0] - spec.offset) * k, (spec.glow[1] + spec.rise * up) * k, spec.glow[2] * k]
      body = <FloorLamp style={style} k={k} up={up} out={out} c={c} m={m} state={state} />
      break
    }
    case 'light_table': {
      const style = decorationVariant(kind, item.variant)?.id ?? 'cestita'
      const spec = TABLE_LAMPS[style] ?? TABLE_LAMPS.cestita
      const k = size / spec.size
      const up = Math.max(p('height') / k - spec.height, -spec.shrink)
      glowAt = [0, (spec.glow + spec.rise * up) * k, 0]
      body = <TableLamp style={style} k={k} up={up} c={c} m={m} state={state} />
      break
    }
    case 'light_desk': {
      const style = decorationVariant(kind, item.variant)?.id ?? 'balanced_arm'
      const spec = DESK_LAMPS[style] ?? DESK_LAMPS.balanced_arm
      const k = size / spec.size
      const up = Math.max(p('height') / k - spec.height, -spec.shrink)
      // The light is out over the desk, in front of the lamp's middle.
      glowAt = [0, (spec.glow[0] + spec.rise[0] * up) * k, (spec.glow[1] + spec.rise[1] * up) * k]
      body = <DeskLamp style={style} k={k} up={up} c={c} m={m} state={state} />
      break
    }
    case 'light_wall': {
      const style = decorationVariant(kind, item.variant)?.id ?? 'tmm'
      const spec = WALL_LAMPS[style] ?? WALL_LAMPS.tmm
      const k = size / spec.size
      const up = Math.max(p('tall') / k - spec.height, -spec.shrink)
      const out = Math.max(p('depth') / k - spec.depth, -spec.thin)
      // Hung by its middle, out from the wall along z.
      const height = p('height')
      glowAt = [spec.glow[0] * k, height + (spec.glow[1] + spec.rise * up) * k, (spec.glow[2] + spec.reach * out) * k]
      body = (
        <group position={[0, height, 0]}>
          <WallLamp style={style} k={k} up={up} out={out} c={c} m={m} state={state} />
        </group>
      )
      break
    }
    case 'shelf_led': {
      // A floating Lakka board with an LED tube under its front edge, washing
      // down the wall. The board follows the shelf colour; the LED glows and
      // casts with the light's state.
      const w = p('width')
      const d = p('depth')
      const height = p('height')
      const front = d - 0.05
      // The Slab board sits on y in [0, 0.05] from the group origin, so its
      // underside is y = 0. The tube (radius 0.009) is lifted so its top edge
      // sits just inside the board, leaving a glowing line flush under it with
      // no gap.
      const ledR = 0.009
      glowAt = [0, height - 0.02, front]
      glowSpread = w
      const shelfFill = (slot: string) => <BaseMaterial color={c(slot)} material={m(slot)} />
      body = (
        <group position={[0, height, 0]}>
          <FloatingShelf w={w} d={d} M={shelfFill} />
          {/* The LED tube tucked up under the front of the board. */}
          <mesh position={[0, -ledR + 0.006, front]} rotation={[0, 0, Math.PI / 2]} userData={{ transmits: true }}>
            <capsuleGeometry args={[ledR, Math.max(w - 0.05, 0.05), 6, 16]} />
            <ShadeMaterial color={c('led')} material={m('led')} state={state} />
          </mesh>
        </group>
      )
      break
    }
    case 'light_strip':
    case 'light_strip_ceiling':
    case 'light_strip_wall': {
      // An aluminium channel with a frosted diffuser under it. Lights place
      // themselves, so the ceiling one goes up against the ceiling and the
      // other two take their own height. The wall one stands off the wall
      // on its channel instead of sinking into it.
      const length = p('length')
      const height = kind.id === 'light_strip_ceiling' ? CEILING_HEIGHT_M - 0.046 : p('height')
      const z = kind.id === 'light_strip_wall' ? 0.016 : 0
      // The light comes from just under the diffuser, so the channel above
      // it never shades the strip's own wash.
      glowAt = [0, height + 0.005, z]
      glowSpread = length
      body = (
        <group>
          <mesh position={[0, height + 0.035, z]}>
            <boxGeometry args={[length, 0.022, 0.03]} />
            <BaseMaterial color={c('channel')} material={m('channel')} />
          </mesh>
          <mesh position={[0, height + 0.018, z]} rotation={[0, 0, Math.PI / 2]} userData={{ transmits: true }}>
            <capsuleGeometry args={[0.016, Math.max(length - 0.032, 0.05), 8, 20]} />
            <ShadeMaterial color={c('diffuser')} material={m('diffuser')} state={state} />
          </mesh>
        </group>
      )
      break
    }
    case 'string_lights': {
      // A run of patio string lights: a cord that sags between its ends in a
      // shallow catenary, with evenly spaced bulbs hanging just below it that
      // glow with the light's state. Length, height and sag are the sliders.
      const L = p('length')
      const height = p('height')
      const sag = p('sag')
      const n = Math.max(3, Math.round(L / 0.35)) // bulbs
      const segs = Math.max(12, n * 2)
      const yAt = (x: number) => height - sag * (1 - ((2 * x) / L) ** 2)
      const cable: [number, number, number][] = Array.from({ length: segs + 1 }, (_, i) => {
        const x = -L / 2 + (L * i) / segs
        return [x, yAt(x), 0]
      })
      glowAt = [0, height - sag - 0.02, 0]
      glowSpread = L
      const bulbR = 0.028
      body = (
        <group>
          <Tube points={cable} radius={0.004}>
            <BaseMaterial color={c('cord')} material={m('cord')} />
          </Tube>
          {Array.from({ length: n }, (_, i) => {
            const x = -L / 2 + (L * (i + 0.5)) / n
            const y = yAt(x)
            return (
              <group key={i}>
                {/* The socket collar on the cord. */}
                <mesh position={[x, y - 0.01, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.02, 8]} />
                  <BaseMaterial color={c('cord')} material={m('cord')} />
                </mesh>
                {/* The hanging bulb. */}
                <mesh position={[x, y - 0.035, 0]} userData={{ transmits: true }}>
                  <sphereGeometry args={[bulbR, 12, 10]} />
                  <ShadeMaterial color={c('bulb')} material={m('bulb')} state={state} />
                </mesh>
              </group>
            )
          })}
        </group>
      )
      break
    }
    case 'light_chandelier': {
      // A mid-century brass "mobile": a canopy and downrod to a hub, from which
      // slim arms radiate at mixed up and down angles, each ending in an opal
      // globe that glows with the light's state.
      const k = p('size') / 0.9 // size is the arm span across
      const cord = p('cord')
      const ceil = CEILING_HEIGHT_M
      const hubY = ceil - cord
      const globeR = 0.052 * k
      const armR = 0.0075 * k
      glowAt = [0, hubY, 0]
      const brass = (slot = 'arms') => <BaseMaterial color={c(slot)} material={m(slot)} />
      // Each arm: azimuth round the circle, rise (up +, down -) and length.
      // Evenly spaced round the circle and all the same length, with the tilt
      // alternating up and down so it still reads as a mobile.
      const arms: [number, number, number][] = [
        [0, 22, 0.4],
        [60, -18, 0.4],
        [120, 22, 0.4],
        [180, -18, 0.4],
        [240, 22, 0.4],
        [300, -18, 0.4],
      ]
      const hub = new Vector3(0, hubY, 0)
      body = (
        <group>
          {/* Canopy against the ceiling. */}
          <mesh position={[0, ceil - 0.02, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.04, SEG]} />
            {brass('canopy')}
          </mesh>
          {/* Downrod to the hub. */}
          <mesh position={[0, (ceil + hubY) / 2, 0]}>
            <cylinderGeometry args={[armR, armR, Math.max(ceil - hubY, 0.001), SEG]} />
            {brass()}
          </mesh>
          {/* Hub and the little nub beneath it. */}
          <mesh position={[0, hubY, 0]}>
            <sphereGeometry args={[0.03 * k, SEG, SEG / 2]} />
            {brass()}
          </mesh>
          <mesh position={[0, hubY - 0.032 * k, 0]}>
            <sphereGeometry args={[0.018 * k, SEG, SEG / 2]} />
            {brass()}
          </mesh>
          {arms.map(([az, rise, len], i) => {
            const a = (az * Math.PI) / 180
            const r = (rise * Math.PI) / 180
            const dir = new Vector3(Math.sin(a) * Math.cos(r), Math.sin(r), Math.cos(a) * Math.cos(r))
            const end = hub.clone().addScaledVector(dir, len * k)
            return (
              <group key={i}>
                <Rod from={hub} to={end} r={armR}>
                  {brass()}
                </Rod>
                <mesh position={end.toArray()} userData={{ transmits: true }}>
                  <sphereGeometry args={[globeR, SEG, SEG / 2]} />
                  <ShadeMaterial color={c('globe')} material={m('globe')} state={state} />
                </mesh>
              </group>
            )
          })}
        </group>
      )
      break
    }
    case 'updown_light': {
      // A Govee outdoor up/down wall light: a ribbed dark box on the wall that
      // throws light from the top and bottom, with an RGB strip down each of
      // its two sides. All four emitters glow and cast with the light's state.
      const h = p('size') // the fixture's height
      const height = p('height') // where its middle sits on the wall
      const w = Math.min(0.11, h * 0.5)
      const d = Math.min(0.09, h * 0.42)
      glowAt = [0, height, d + 0.03]
      body = (
        <group position={[0, height, 0]}>
          {/* The ribbed metal body, stood off the wall along z. */}
          <mesh position={[0, 0, d / 2]}>
            <boxGeometry args={[w, h, d]} />
            <BaseMaterial color={c('body')} material={m('body')} />
          </mesh>
          {/* The up and down beams, open at the top and bottom. */}
          {[1, -1].map(s => (
            <mesh key={`beam${s}`} position={[0, s * (h / 2 - 0.004), d / 2]} userData={{ transmits: true }}>
              <boxGeometry args={[w * 0.72, 0.01, d * 0.72]} />
              <ShadeMaterial color={c('beam')} material={m('beam')} state={state} />
            </mesh>
          ))}
          {/* An RGB strip down each side. */}
          {[1, -1].map(s => (
            <mesh key={`strip${s}`} position={[s * (w / 2 + 0.001), 0, d / 2]} userData={{ transmits: true }}>
              <boxGeometry args={[0.006, h * 0.8, d * 0.5]} />
              <ShadeMaterial color={c('strip')} material={m('strip')} state={state} />
            </mesh>
          ))}
        </group>
      )
      break
    }
    default:
      body = null
  }

  return (
    <group ref={own}>
      {body}
      <Glow state={state} at={glowAt} spread={glowSpread} output={LAMP_OUTPUT[kind.id] ?? 1} />
    </group>
  )
}
