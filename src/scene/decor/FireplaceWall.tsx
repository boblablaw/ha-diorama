import { colorValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import type { DecorationConfig } from '#/types.ts'
import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// A brick wall / room divider. The front and back faces carry a running-bond
// brick texture that tiles continuously across the whole wall; the top, bottom
// and ends are a flat brick colour (no mortar lines). An optional firebox cuts
// a recess into the front: the wall is built as brick around the opening and a
// dark block sits at the back of it, set in by the firebox-depth share of the
// wall's depth. Everything is sized by the sliders.
const TILE_W = 0.95 // ~4 bricks wide
const TILE_H = 0.8 // ~8 courses tall

export default function FireplaceWallModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)

  const W = p('width')
  const H = p('height')
  const D = p('depth')
  const brick = c('brick')
  const mortar = c('mortar')
  const firebox = c('firebox')

  const baseTex = useMemo(() => {
    const px = 256
    const cv = document.createElement('canvas')
    cv.width = px
    cv.height = px
    const g = cv.getContext('2d')!
    g.fillStyle = mortar
    g.fillRect(0, 0, px, px)
    const cols = 4
    const rows = 8
    const bw = px / cols
    const bh = px / rows
    const joint = 6
    g.fillStyle = brick
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0
      for (let x = -bw; x < px + bw; x += bw) {
        g.fillRect(x + off + joint / 2, r * bh + joint / 2, bw - joint, bh - joint)
      }
    }
    return new CanvasTexture(cv)
  }, [brick, mortar])

  // A texture clone showing the slice of the wall-wide brick grid that covers
  // the region [x0,x1] x [y0,y1], so coursing stays continuous across pieces.
  const faceTex = (x0: number, x1: number, y0: number, y1: number) => {
    const t = baseTex.clone()
    t.needsUpdate = true
    t.wrapS = t.wrapT = RepeatWrapping
    t.colorSpace = SRGBColorSpace
    t.repeat.set((x1 - x0) / TILE_W, (y1 - y0) / TILE_H)
    t.offset.set((x0 + W / 2) / TILE_W, y0 / TILE_H)
    return t
  }

  // A brick box for a region: brick texture on front/back, flat brick colour on
  // the top, bottom and ends.
  const brickBox = (key: string, x0: number, x1: number, y0: number, y1: number) => {
    const tf = faceTex(x0, x1, y0, y1)
    return (
      <mesh key={key} position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[x1 - x0, y1 - y0, D]} />
        <meshStandardMaterial attach="material-0" color={brick} roughness={0.95} />
        <meshStandardMaterial attach="material-1" color={brick} roughness={0.95} />
        <meshStandardMaterial attach="material-2" color={brick} roughness={0.95} />
        <meshStandardMaterial attach="material-3" color={brick} roughness={0.95} />
        <meshStandardMaterial attach="material-4" map={tf} roughness={0.95} />
        <meshStandardMaterial attach="material-5" map={tf} roughness={0.95} />
      </mesh>
    )
  }

  if (p('firebox') <= 0.5) {
    return <group>{brickBox('wall', -W / 2, W / 2, 0, H)}</group>
  }

  // Firebox opening.
  const fbW = Math.min(Math.max(p('fb_width') * W, 0.3), W - 0.3)
  const fbH = Math.min(Math.max(p('fb_height') * H, 0.3), H - 0.3)
  const fbBottom = 0.12
  const fbTop = fbBottom + fbH
  const fbX = p('offset') * Math.max(0, W / 2 - fbW / 2 - 0.12)
  const fbL = fbX - fbW / 2
  const fbR = fbX + fbW / 2
  const leftW = fbL + W / 2
  const rightW = W / 2 - fbR
  const fbDepth = Math.min(Math.max(p('fb_depth') * D, 0.05), D - 0.04)

  return (
    <group>
      {leftW > 0.01 && brickBox('L', -W / 2, fbL, 0, H)}
      {rightW > 0.01 && brickBox('R', fbR, W / 2, 0, H)}
      {brickBox('T', fbL, fbR, fbTop, H)}
      {fbBottom > 0.01 && brickBox('B', fbL, fbR, 0, fbBottom)}
      {/* The dark firebox block at the back of the opening, its front set in
          from the wall face by the firebox depth. */}
      <mesh position={[fbX, (fbBottom + fbTop) / 2, -fbDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[fbW - 0.02, fbH - 0.02, D - fbDepth]} />
        <meshStandardMaterial color={firebox} roughness={0.9} />
      </mesh>
    </group>
  )
}
