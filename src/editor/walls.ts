import { isValidRoom } from '#/geometry/overlap.ts'
import { decorationKind, paramValue } from '#/decoration/catalog.ts'
import type { DecorationConfig, Point } from '#/types.ts'

// Decoration kinds a wall item can mount onto the face of, not just room walls.
const MOUNT_WALLS = new Set(['half_wall', 'fireplace_wall'])

// Nearest face of any free-standing wall decoration (half wall, fireplace
// wall), with the rotation that makes a wall item face out of it toward where
// it was dragged. Null when there are none. Compared against snapToWall so a
// shelf lands on whichever is nearer — the room wall or a divider's face.
export function snapToWallFace(
  p: Point,
  decorations: DecorationConfig[],
): { point: Point; rotation: number; dist: number } | null {
  let best: { point: Point; rotation: number; dist: number } | null = null
  for (const d of decorations) {
    if (!MOUNT_WALLS.has(d.kind)) continue
    const kind = decorationKind(d.kind)
    if (!kind) continue
    const W = paramValue(kind, d.params, 'width', d.variant)
    const D = paramValue(kind, d.params, 'depth', d.variant)
    const r = ((d.rotation ?? 0) * Math.PI) / 180
    const cos = Math.cos(r)
    const sin = Math.sin(r)
    const toWorld = (lx: number, ly: number): Point => [
      d.position[0] + lx * cos - ly * sin,
      d.position[1] + lx * sin + ly * cos,
    ]
    // The two long faces, at local y = +/- D/2.
    for (const side of [1, -1] as const) {
      const a = toWorld(-W / 2, (side * D) / 2)
      const b = toWorld(W / 2, (side * D) / 2)
      const abx = b[0] - a[0]
      const aby = b[1] - a[1]
      const len2 = abx * abx + aby * aby || 1
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2))
      const q: Point = [a[0] + abx * t, a[1] + aby * t]
      const dist = Math.hypot(p[0] - q[0], p[1] - q[1])
      if (best && dist >= best.dist) continue
      // Face out toward the dragged point, so the shelf sits on that side.
      let nx = p[0] - q[0]
      let ny = p[1] - q[1]
      const nl = Math.hypot(nx, ny) || 1
      nx /= nl
      ny /= nl
      const rotation = ((((Math.atan2(ny, nx) * 180) / Math.PI + 90) % 360) + 360) % 360
      best = {
        point: [Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100],
        rotation: Math.round(rotation),
        dist,
      }
    }
  }
  return best
}

// Nearest point on the polygon's outline, and the rotation that makes a
// wall item face into the room from there.
export function snapToWall(p: Point, points: Point[]): { point: Point; rotation: number; dist: number } {
  const n = points.length
  let best = { dist: Infinity, point: p, rotation: 0 }
  const ccw = isValidRoom(points, []) && signedAreaOf(points) > 0
  for (let i = 0; i < n; i++) {
    const a = points[i]
    const b = points[(i + 1) % n]
    const abx = b[0] - a[0]
    const aby = b[1] - a[1]
    const len2 = abx * abx + aby * aby || 1
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2))
    const q: Point = [a[0] + abx * t, a[1] + aby * t]
    const dist = Math.hypot(p[0] - q[0], p[1] - q[1])
    if (dist < best.dist) {
      // Inward normal: left of the edge on a counter clockwise polygon.
      const len = Math.sqrt(len2)
      const nx = ((ccw ? -aby : aby) / len) * 1
      const ny = ((ccw ? abx : -abx) / len) * 1
      // The wall model faces plan -y at rotation 0, so it faces the normal at angle(n) + 90.
      const rotation = ((((Math.atan2(ny, nx) * 180) / Math.PI + 90) % 360) + 360) % 360
      best = {
        dist,
        point: [Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100],
        rotation: Math.round(rotation),
      }
    }
  }
  return best
}

function signedAreaOf(points: Point[]) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}
