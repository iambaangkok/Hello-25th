// The reduced paintings the glass editor crops (made by scripts/glass-backgrounds.py).
import type { GlassCrop } from '../glass.ts'
import paintingSizes from '../data/paintings.json'

const urls = import.meta.glob<string>('../assets/paintings/*.jpg', { eager: true, query: '?url', import: 'default' })
export const PAINTINGS = Object.entries(paintingSizes as Record<string, number[]>).map(([name, [w, h]]) => ({
  name,
  url: urls[`../assets/paintings/${name}`],
  w,
  h,
}))

export const paintingOf = (name: string) => PAINTINGS.find((p) => p.name === name) ?? PAINTINGS[0]

// The crop's height as a fraction of its painting.
export const cropHeight = (crop: GlassCrop) => {
  const p = paintingOf(crop.painting)
  return ((crop.w * p.w * 9) / 16) / p.h
}
