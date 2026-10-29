// The showroom card on its own, without Home Assistant, for checking how the
// whole catalog holds up at once and how fast it draws. Served by the dev
// server, never built into the card:
//
//   http://localhost:5173/src/dev/showroom.html
//
// window.probe() returns the last second's frame times and what the renderer
// drew on the last frame, for reading from the console.
import type { CardConfig, DeviceConfig, HomeAssistant } from '#/types.ts'
import { decorationKind } from '#/decoration/catalog.ts'
import yaml from '../../showroom.yaml?raw'
import { Scene } from 'three'

// showroom.yaml is written by scripts/showroom.ts in a fixed shape: lists of
// maps whose values are scalars or flat lists of numbers. That is all this
// reads.
function parse(text: string): CardConfig {
  const config: Record<string, unknown> = {}
  let list: Record<string, unknown>[] | null = null
  let item: Record<string, unknown> | null = null
  let key = ''
  const scalar = (raw: string): unknown => {
    const v = raw.trim()
    if (v.startsWith('[')) return v.slice(1, -1).split(',').map(Number)
    if (v.startsWith('"')) return JSON.parse(v)
    const n = Number(v)
    return v !== '' && Number.isFinite(n) ? n : v
  }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const indent = line.length - line.trimStart().length
    const body = line.trim()
    if (indent === 0) {
      const [k, v] = body.split(/:\s?(.*)/)
      if (v) config[k] = scalar(v)
      else {
        list = []
        config[k] = list
      }
    } else if (indent === 2 && body.startsWith('- ')) {
      item = {}
      list!.push(item)
      const [k, v] = body.slice(2).split(/:\s?(.*)/)
      if (v) item[k] = scalar(v)
      else item[k] = []
      key = k
    } else if (indent === 4) {
      const [k, v] = body.split(/:\s?(.*)/)
      item![k] = v ? scalar(v) : undefined
      key = k
    } else if (indent === 6) {
      // A nested block under the indent-4 key: either a list of `- item` lines
      // (like a room's points) or a map of `key: value` lines (like params).
      // The first child decides which.
      if (body.startsWith('- ')) {
        if (!Array.isArray(item![key])) item![key] = []
        ;(item![key] as unknown[]).push(scalar(body.slice(2)))
      } else {
        const [k, v] = body.split(/:\s?(.*)/)
        if (typeof item![key] !== 'object' || item![key] === null) item![key] = {}
        ;(item![key] as Record<string, unknown>)[k] = scalar(v)
      }
    }
  }
  return config as unknown as CardConfig
}

// Three builds its renderer's methods in the constructor, so the draw calls
// are counted at the context instead, and frames are timed from the page's
// own animation frames, which stretch when a frame runs long.
const info = { frames: [] as number[], calls: 0, lastCalls: 0, shadowPasses: 0, lastShadowPasses: 0 }
const getContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
  const gl = (getContext as (this: HTMLCanvasElement, ...a: unknown[]) => unknown).call(this, type, ...rest)
  if (gl instanceof WebGL2RenderingContext && !(gl as unknown as { probed?: boolean }).probed) {
    ;(gl as unknown as { probed?: boolean }).probed = true
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'] as const) {
      const draw = gl[name] as (...a: unknown[]) => void
      ;(gl as unknown as Record<string, unknown>)[name] = function (...a: unknown[]) {
        info.calls++
        return draw.apply(gl, a)
      }
    }
    // Each shadow map is drawn into its own framebuffer before the screen.
    const bind = gl.bindFramebuffer
    gl.bindFramebuffer = function (target: number, fb: WebGLFramebuffer | null) {
      if (fb) info.shadowPasses++
      return bind.call(gl, target, fb)
    }
  }
  return gl
} as typeof HTMLCanvasElement.prototype.getContext
// The scene, caught on its way through the shadow watcher, and how long the
// page's own frame callbacks ran, which is the JavaScript share of a frame.
const traverse = Scene.prototype.traverseVisible
Scene.prototype.traverseVisible = function (callback) {
  ;(window as unknown as Record<string, unknown>).scene = this
  return traverse.call(this, callback)
}
const raf = window.requestAnimationFrame.bind(window)
let script = 0
let lastScript = 0
window.requestAnimationFrame = callback =>
  raf(time => {
    const start = performance.now()
    callback(time)
    script += performance.now() - start
  })
let previous = performance.now()
const tick = () => {
  const now = performance.now()
  info.frames.push(now - previous)
  previous = now
  if (info.frames.length > 240) info.frames.shift()
  info.lastCalls = info.calls
  lastScript = script
  script = 0
  info.calls = 0
  info.lastShadowPasses = info.shadowPasses
  info.shadowPasses = 0
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
;(window as unknown as Record<string, unknown>).probe = () => {
  const frames = [...info.frames].sort((a, b) => a - b)
  const mean = frames.reduce((s, f) => s + f, 0) / (frames.length || 1)
  return {
    mean: Math.round(mean * 10) / 10,
    p95: Math.round((frames[Math.floor(frames.length * 0.95)] ?? 0) * 10) / 10,
    calls: info.lastCalls,
    script: Math.round(lastScript * 10) / 10,
    framebufferBinds: info.lastShadowPasses,
  }
}

await import('#/main.tsx')

const config = parse(yaml)

// There is no Home Assistant here, so nothing is bound to an entity and every
// device shows its "off" look. To exercise the lit states, bind each
// controllable decoration to a mock device and drive them all from one button.
// Only families that actually show a state are wired — furniture and plants
// have nothing to switch.
const ACTIVE = new Set(['light', 'cover', 'media', 'climate', 'kitchen', 'laundry', 'bathroom', 'security', 'utility'])
const DOMAIN: Record<string, string> = { light: 'light', cover: 'cover', media: 'media_player', climate: 'climate', security: 'binary_sensor' }
const mockDevices: DeviceConfig[] = (config.decorations ?? [])
  .filter(d => ACTIVE.has(decorationKind(d.kind)?.family ?? ''))
  .map(d => {
    const family = decorationKind(d.kind)?.family ?? ''
    return { entity_id: `${DOMAIN[family] ?? 'switch'}.demo_${d.id}`, room: d.room, position: d.position, decorations: [d.id] }
  })
config.devices = [...(config.devices ?? []), ...mockDevices]

const statesFor = (on: boolean): Record<string, unknown> => {
  const states: Record<string, unknown> = {}
  for (const dev of mockDevices) {
    const cover = dev.entity_id.startsWith('cover.')
    states[dev.entity_id] = {
      entity_id: dev.entity_id,
      state: cover ? (on ? 'open' : 'closed') : on ? 'on' : 'off',
      attributes: { brightness: on ? 255 : 1, current_position: on ? 100 : 0, color_temp_kelvin: 2700 },
    }
  }
  return states
}

const hass = {
  states: statesFor(false),
  callService: () => Promise.resolve(),
  themes: { darkMode: false },
} as unknown as HomeAssistant
const card = document.createElement('diorama-card') as HTMLElement & {
  setConfig: (c: CardConfig) => void
  hass: HomeAssistant
}
card.style.cssText = 'display:block;width:100vw;height:100vh'
card.setConfig({ ...config, aspect_ratio: `${innerWidth} / ${innerHeight}` } as CardConfig)
card.hass = hass
document.body.appendChild(card)

// One button toggles every mock device on and off together, so the lit look of
// lights, covers and appliances can be checked without Home Assistant.
let lit = false
const toggle = document.createElement('button')
toggle.textContent = 'Lights: off'
toggle.style.cssText =
  'position:fixed;top:12px;left:12px;z-index:10;padding:8px 14px;border:0;border-radius:8px;' +
  'font:600 13px system-ui;background:#1f6feb;color:#fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4)'
toggle.onclick = () => {
  lit = !lit
  toggle.textContent = lit ? 'Lights: on' : 'Lights: off'
  card.hass = { ...hass, states: statesFor(lit) } as HomeAssistant
}
document.body.appendChild(toggle)
