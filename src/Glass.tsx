import { useEffect } from 'react'
import { BAKED, type GlassSettings } from './glass.ts'

type Props = {
  month: number
  from?: number | null // the Month fading out underneath while `fade` < 1
  fade?: number
  wash: string // the Month's colour
  settings: GlassSettings
}

// Glass behind everything: the Month's baked painting crop (the previous one underneath while it
// fades in), then the colour wash and the sheen. Plain images cross-fading, so it stays smooth.
export function Glass({ month, from = null, fade = 1, wash, settings }: Props) {
  useEffect(() => {
    for (const url of BAKED) new Image().src = url
  }, [])
  const image = 'absolute inset-0 h-full w-full object-cover'
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {from !== null && <img src={BAKED[from]} alt="" className={image} />}
      <img src={BAKED[month]} alt="" className={image} style={{ opacity: from !== null ? fade : 1, willChange: 'opacity' }} />
      <GlassOverlay wash={wash} settings={settings} />
    </div>
  )
}

// The colour wash and the diagonal sheen over a pane.
export function GlassOverlay({ wash, settings }: { wash: string; settings: GlassSettings }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: wash, opacity: settings.wash }} />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, rgb(255 255 255 / ${settings.sheen}), rgb(255 255 255 / 0) 45%, rgb(255 255 255 / ${settings.sheen * 0.4}))`,
        }}
      />
    </>
  )
}
