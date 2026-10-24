import { useEffect } from 'react'
import { GlassOverlay } from '../Glass.tsx'
import type { GlassCrop, GlassSettings } from '../glass.ts'
import { PAINTINGS, cropHeight, paintingOf } from './paintings.ts'

// The editor's glass, blurred live so every setting shows at once (the MV shows it baked). The crop
// covers the box (centred, 16:9, like `cover`), with the painting continuing past it so the blurred
// edges stay full. Sizes use container units, so it works at any preview size.
export function LiveGlass({ crop, wash, settings }: { crop: GlassCrop; wash: string; settings: GlassSettings }) {
  useEffect(() => {
    for (const p of PAINTINGS) new Image().src = p.url
  }, [])
  const painting = paintingOf(crop.painting)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ containerType: 'size' }}>
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: 'max(100cqw, calc(100cqh * 16 / 9))',
          aspectRatio: '16 / 9',
          transform: 'translate(-50%, -50%)',
          filter: `blur(${settings.blur}cqh) saturate(${settings.saturation})`,
        }}
      >
        <img
          src={painting.url}
          alt=""
          draggable={false}
          className="absolute max-w-none"
          style={{
            width: `${100 / crop.w}%`,
            left: `${(-crop.x / crop.w) * 100}%`,
            top: `${(-crop.y / cropHeight(crop)) * 100}%`,
          }}
        />
      </div>
      <GlassOverlay wash={wash} settings={settings} />
    </div>
  )
}
