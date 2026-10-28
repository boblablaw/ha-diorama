import { colorValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import type { DecorationConfig } from '#/types.ts'
import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// A brick wall / room divider. Front and back faces carry a running-bond brick
// texture that tiles continuously; the top, bottom and ends are flat brick.
// An optional firebox recesses into the FRONT only, by the firebox-depth share
// of the wall's depth — a solid brick back slab stays behind it, so the back
// reads solid. Pushed to an end the side column vanishes, so it opens as a
// corner firebox (cut along both the front and the side).
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

  const faceTex = (x0: number, x1: number, y0: number, y1: number) => {
    const t = baseTex.clone()
    t.needsUpdate = true
    t.wrapS = t.wrapT = RepeatWrapping
    t.colorSpace = SRGBColorSpace
    t.repeat.set((x1 - x0) / TILE_W, (y1 - y0) / TILE_H)
    t.offset.set((x0 + W / 2) / TILE_W, y0 / TILE_H)
    return t
  }

  // Texture for an end (the +x/-x faces, height × depth): same course height as
  // the front so the brick lines line up, a slice of bricks across the depth.
  const endTex = (y0: number, y1: number, dz: number) => {
    const t = baseTex.clone()
    t.needsUpdate = true
    t.wrapS = t.wrapT = RepeatWrapping
    t.colorSpace = SRGBColorSpace
    t.repeat.set(Math.max(0.25, dz / TILE_W), (y1 - y0) / TILE_H)
    t.offset.set(0, y0 / TILE_H)
    return t
  }

  // A brick box for a region of the wall: brick texture on the front/back and
  // the ends (so the side edges show bricks + mortar), flat brick on the top
  // and bottom. `zc`/`dz` place it in depth.
  const brickBox = (key: string, x0: number, x1: number, y0: number, y1: number, zc: number, dz: number) => {
    const tf = faceTex(x0, x1, y0, y1)
    const te = endTex(y0, y1, dz)
    return (
      <mesh key={key} position={[(x0 + x1) / 2, (y0 + y1) / 2, zc]} castShadow receiveShadow>
        <boxGeometry args={[x1 - x0, y1 - y0, dz]} />
        <meshStandardMaterial attach="material-0" map={te} roughness={0.95} />
        <meshStandardMaterial attach="material-1" map={te} roughness={0.95} />
        <meshStandardMaterial attach="material-2" color={brick} roughness={0.95} />
        <meshStandardMaterial attach="material-3" color={brick} roughness={0.95} />
        <meshStandardMaterial attach="material-4" map={tf} roughness={0.95} />
        <meshStandardMaterial attach="material-5" map={tf} roughness={0.95} />
      </mesh>
    )
  }

  if (p('firebox') <= 0.5) {
    return <group>{brickBox('wall', -W / 2, W / 2, 0, H, 0, D)}</group>
  }

  const fbW = Math.min(Math.max(p('fb_width') * W, 0.3), W)
  const fbH = Math.min(Math.max(p('fb_height') * H, 0.3), H - 0.2)
  const fbBottom = 0.12
  const fbTop = fbBottom + fbH
  const fbX = p('offset') * Math.max(0, W / 2 - fbW / 2) // can reach the ends
  const fbL = fbX - fbW / 2
  const fbR = fbX + fbW / 2
  const leftW = fbL + W / 2
  const rightW = W / 2 - fbR
  const fbDepth = Math.min(Math.max(p('fb_depth') * D, 0.05), D)

  const frontDepth = fbDepth
  const backDepth = Math.max(0, D - fbDepth)
  const frontZc = D / 2 - frontDepth / 2
  // Overlap the back slab slightly into the front layer to avoid a coplanar seam.
  const backD = backDepth + 0.02
  const backZc = -D / 2 + backD / 2

  return (
    <group>
      {/* Solid brick back slab across the whole wall, so the back stays brick. */}
      {backDepth > 0.01 && brickBox('back', -W / 2, W / 2, 0, H, backZc, backD)}
      {/* Front brick frame around the opening (depth = firebox depth). */}
      {leftW > 0.01 && brickBox('fl', -W / 2, fbL, 0, H, frontZc, frontDepth)}
      {rightW > 0.01 && brickBox('fr', fbR, W / 2, 0, H, frontZc, frontDepth)}
      {brickBox('ft', fbL, fbR, fbTop, H, frontZc, frontDepth)}
      {fbBottom > 0.01 && brickBox('fb', fbL, fbR, 0, fbBottom, frontZc, frontDepth)}
      {/* Dark back of the recess, just in front of the back slab. */}
      <mesh position={[fbX, (fbBottom + fbTop) / 2, D / 2 - fbDepth + 0.03]} castShadow receiveShadow>
        <boxGeometry args={[fbW - 0.02, fbH - 0.02, 0.04]} />
        <meshStandardMaterial color={firebox} roughness={0.9} />
      </mesh>
    </group>
  )
}
