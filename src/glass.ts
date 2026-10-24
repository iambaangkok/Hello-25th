// Glass backgrounds: each Month shows a 16:9 crop of an oil painting through frosted glass — the
// crop blurred, a wash of the Month's colour over it, and a soft sheen. Crops and the shared
// settings live in src/data/glass.json, tuned in the glass editor (glass.html). The MV shows the
// crops baked (blurred and saturated) by scripts/glass-backgrounds.py --bake, which the editor's
// Save runs: a live blur of a whole painting is too heavy to fade and flick.
import glassJson from './data/glass.json'

// A crop: the painting's file name, its left / top edge and its width as fractions of the painting
// (the height follows from 16:9).
export type GlassCrop = { painting: string; x: number; y: number; w: number }

export type GlassSettings = {
  blur: number // % of the screen height
  wash: number // 0–1 opacity of the Month's colour over the painting
  saturation: number // 1 = as painted
  sheen: number // 0–1 strength of the diagonal highlight
}

export type Glass = GlassSettings & { months: GlassCrop[] }

export const GLASS = glassJson as Glass

// The baked Months, November first.
export const BAKED = Object.entries(
  import.meta.glob<string>('./assets/glass/*.jpg', { eager: true, query: '?url', import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)
