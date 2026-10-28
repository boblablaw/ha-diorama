import { colorValue, paramValue, type DecorationKind } from '#/decoration/catalog.ts'
import type { DecorationConfig } from '#/types.ts'
import { useMemo } from 'react'
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'

// A plain brick wall / room divider: a single slab painted with a running-bond
// brick texture (red bricks, mortar joints) that tiles to the wall's size, so
// the coursing stays crisp at any width or height and costs one mesh. Width,
// height and depth are the sliders. (A firebox inset comes later.)
export default function FireplaceWallModel({ kind, item }: { kind: DecorationKind; item: DecorationConfig }) {
  const c = (slot: string) => colorValue(kind, item.colors, slot, item.variant)
  const p = (id: string) => paramValue(kind, item.params, id, item.variant)

  const W = p('width')
  const H = p('height')
  const D = p('depth')
  const brick = c('brick')
  const mortar = c('mortar')

  const texture = useMemo(() => {
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
    const joint = 6 // mortar joint in px
    g.fillStyle = brick
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0
      for (let x = -bw; x < px + bw; x += bw) {
        g.fillRect(x + off + joint / 2, r * bh + joint / 2, bw - joint, bh - joint)
      }
    }
    const t = new CanvasTexture(cv)
    t.wrapS = t.wrapT = RepeatWrapping
    t.colorSpace = SRGBColorSpace
    return t
  }, [brick, mortar])

  // One tile ≈ 4 bricks wide by 8 courses tall, so bricks read ~24 cm × ~10 cm.
  texture.repeat.set(Math.max(1, Math.round(W / 0.95)), Math.max(1, Math.round(H / 0.8)))

  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.95 }), [])
  material.map = texture
  material.needsUpdate = true

  return (
    <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[W, H, D]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
