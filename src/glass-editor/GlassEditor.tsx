import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { FIGURE_BOTTOM_VH, FIGURE_HEIGHT_VH, Figure } from '../Figure.tsx'
import { GLASS, type Glass as GlassData, type GlassCrop, type GlassSettings } from '../glass.ts'
import { LiveGlass } from './LiveGlass.tsx'
import { PAINTINGS, cropHeight, paintingOf } from './paintings.ts'
import { LINES } from '../lyrics.ts'
import { MONTH_NAMES, indexAt, type Timing } from '../timing.ts'
import { withDefaults, type Wardrobe } from '../wardrobe.ts'
import timingJson from '../data/timing.json'
import wardrobeJson from '../data/wardrobe.json'

// Dev-only editor for the glass backgrounds, served at /hello25/glass.html by `pnpm dev`. Pick a
// Month, pick its painting, drag the crop on the painting (corner handle resizes); the blur, wash,
// saturation and sheen are shared by every Month. Saves to src/data/glass.json and re-bakes the
// images the MV shows (scripts/glass-backgrounds.py --bake).

const WARDROBE = withDefaults(wardrobeJson as Wardrobe)
const TIMING = timingJson as Timing
const STORAGE_KEY = 'hello25.glass-editor.draft'
const UNDO_LIMIT = 300

const load = (): GlassData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as GlassData
  } catch {
    // fall through to the committed glass
  }
  return GLASS
}

const r4 = (v: number) => Math.round(v * 10000) / 10000

// Keeps a crop inside its painting.
function clamp(crop: GlassCrop): GlassCrop {
  const w = Math.min(1, Math.max(0.03, crop.w))
  const h = cropHeight({ ...crop, w })
  // A crop taller than the painting is shrunk until it fits.
  const fit = h > 1 ? w / h : w
  const fh = cropHeight({ ...crop, w: fit })
  return {
    ...crop,
    w: r4(fit),
    x: r4(Math.min(1 - fit, Math.max(0, crop.x))),
    y: r4(Math.min(1 - fh, Math.max(0, crop.y))),
  }
}

// The first Line sung in a Month, to preview the lyrics over its glass.
const lineIn = (month: number) => LINES[Math.max(0, indexAt(TIMING.lines, (TIMING.months[month] ?? 0) + 3))]

type Drag = { kind: 'move' | 'resize'; from: [number, number]; start: GlassCrop; box: DOMRect }

export default function GlassEditor() {
  const [glass, setGlass] = useState<GlassData>(load)
  const latest = useRef(glass)
  const history = useRef<GlassData[]>([])
  const [month, setMonth] = useState(0)
  const [status, setStatus] = useState('')
  const drag = useRef<Drag | null>(null)

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(glass)), [glass])

  // `record` false continues a drag or slide without another undo step.
  const change = useCallback((update: (prev: GlassData) => GlassData, record = true) => {
    const prev = latest.current
    if (record) history.current = [...history.current.slice(-UNDO_LIMIT), prev]
    latest.current = update(prev)
    setGlass(latest.current)
  }, [])

  const undo = useCallback(() => {
    const prev = history.current.pop()
    if (!prev) return
    latest.current = prev
    setGlass(prev)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'KeyZ') undo()
      if (e.code === 'ArrowLeft') setMonth((m) => (m + 11) % 12)
      if (e.code === 'ArrowRight') setMonth((m) => (m + 1) % 12)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  const setCrop = (crop: GlassCrop, record = true) =>
    change((prev) => ({ ...prev, months: prev.months.map((c, i) => (i === month ? clamp(crop) : c)) }), record)
  const setSetting = (key: keyof GlassSettings, value: number, record = false) =>
    change((prev) => ({ ...prev, [key]: value }), record)

  const crop = glass.months[month]
  const painting = paintingOf(crop.painting)
  const colour = WARDROBE.months[month].background

  const startDrag = (e: ReactPointerEvent, kind: Drag['kind']) => {
    e.stopPropagation()
    const box = (e.currentTarget.closest('[data-painting]') as HTMLElement).getBoundingClientRect()
    drag.current = { kind, from: [e.clientX, e.clientY], start: crop, box }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    change((prev) => prev)
  }
  const onDrag = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.from[0]) / d.box.width
    const dy = (e.clientY - d.from[1]) / d.box.height
    if (d.kind === 'move') setCrop({ ...d.start, x: d.start.x + dx, y: d.start.y + dy }, false)
    else setCrop({ ...d.start, w: d.start.w + dx }, false)
  }
  const endDrag = () => (drag.current = null)

  const save = async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}__data/glass`, {
      method: 'POST',
      body: JSON.stringify(latest.current, null, 2) + '\n',
    })
    setStatus(res.ok ? `Saved to src/data/glass.json and baked at ${new Date().toLocaleTimeString()}` : `Save failed: ${res.status} ${await res.text()}`)
  }
  const loadFromRepo = async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}__data/glass`)
    if (!res.ok) return setStatus('No src/data/glass.json yet')
    const loaded = (await res.json()) as GlassData
    change(() => loaded)
    setStatus('Loaded src/data/glass.json (Z to undo)')
  }

  const button = 'rounded bg-neutral-700 px-3 py-1 hover:bg-neutral-600'
  const line = lineIn(month)
  const h = cropHeight(crop)

  return (
    <main className="flex h-full gap-4 overflow-auto bg-neutral-950 p-4 font-sans text-white" style={{ fontWeight: 500 }}>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">Glass editor</h1>
          <button onClick={undo} className={button}>Undo (Z)</button>
          <button onClick={save} className="rounded bg-amber-400 px-3 py-1 font-bold text-black">Save to repo</button>
          <button onClick={loadFromRepo} className={button}>Load from repo</button>
          <span className="text-sm text-neutral-400">{status}</span>
        </header>

        {/* The Month as it plays on a 16:9 screen */}
        <div
          className="relative w-full overflow-hidden text-white"
          style={{ aspectRatio: '16 / 9', background: colour, containerType: 'size', fontFamily: '"Noto Sans", "Noto Sans JP", sans-serif', fontWeight: 900 }}
        >
          <LiveGlass crop={crop} wash={colour} settings={glass} />
          <div
            className="absolute flex flex-col items-start justify-center gap-[1cqh] leading-tight"
            style={{ left: '26%', right: '20%', top: '14%', bottom: '30%', textShadow: '0 0.04em 0.18em rgb(0 0 0 / 0.35)' }}
          >
            <p style={{ fontSize: '3.5cqh' }}>{line.japanese}</p>
            <p style={{ fontSize: '6.4cqh' }}>{line.romaji}</p>
            <p style={{ fontSize: '3.5cqh', opacity: 0.7 }}>{line.english}</p>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ height: `${FIGURE_HEIGHT_VH}%`, bottom: `${FIGURE_BOTTOM_VH}%`, aspectRatio: '100 / 160' }}
          >
            <Figure outfit={WARDROBE.months[month].outfit} phase={0.8} gait={1} waving={false} time={0} />
          </div>
        </div>

        {/* Every Month at a glance; click to edit, ← → to step */}
        <div className="grid grid-cols-6 gap-2">
          {glass.months.map((c, i) => (
            <button
              key={i}
              onClick={() => setMonth(i)}
              className={`relative overflow-hidden rounded text-left ${i === month ? 'outline outline-2 outline-amber-400' : ''}`}
              style={{ aspectRatio: '16 / 9', background: WARDROBE.months[i].background }}
            >
              <LiveGlass crop={c} wash={WARDROBE.months[i].background} settings={glass} />
              <span className="absolute top-1 left-1.5 text-xs font-bold drop-shadow">{MONTH_NAMES[i]}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="w-[26rem] shrink-0 space-y-4 text-sm">
        <section className="space-y-2">
          <h2 className="font-bold">All Months</h2>
          <Slider label="blur (% height)" min={0} max={12} step={0.1} value={glass.blur} onStart={() => change((p) => p)} onChange={(v) => setSetting('blur', v)} />
          <Slider label="colour wash" min={0} max={1} step={0.01} value={glass.wash} onStart={() => change((p) => p)} onChange={(v) => setSetting('wash', v)} />
          <Slider label="saturation" min={0.5} max={2} step={0.01} value={glass.saturation} onStart={() => change((p) => p)} onChange={(v) => setSetting('saturation', v)} />
          <Slider label="sheen" min={0} max={0.5} step={0.01} value={glass.sheen} onStart={() => change((p) => p)} onChange={(v) => setSetting('sheen', v)} />
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">
            {MONTH_NAMES[month]} <span className="ml-1 inline-block size-3 rounded-sm align-middle" style={{ background: colour }} />
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {PAINTINGS.map((p) => (
              <button
                key={p.name}
                title={p.name}
                onClick={() => setCrop({ ...crop, painting: p.name })}
                className={`overflow-hidden rounded ${p.name === crop.painting ? 'outline outline-2 outline-amber-400' : 'opacity-70 hover:opacity-100'}`}
              >
                <img src={p.url} alt="" className="aspect-video w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>

          {/* The painting with the crop: drag inside to move, the corner to resize */}
          <div data-painting className="relative w-full select-none" style={{ aspectRatio: `${painting.w} / ${painting.h}` }}>
            <img src={painting.url} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
            <div className="absolute inset-0 bg-black/45" />
            <div
              onPointerDown={(e) => startDrag(e, 'move')}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="absolute cursor-move outline outline-2 outline-white"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${h * 100}%`,
                backgroundImage: `url(${painting.url})`,
                backgroundSize: `${100 / crop.w}% auto`,
                backgroundPosition: `${crop.w < 1 ? (crop.x / (1 - crop.w)) * 100 : 0}% ${h < 1 ? (crop.y / (1 - h)) * 100 : 0}%`,
              }}
            >
              <span
                onPointerDown={(e) => startDrag(e, 'resize')}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-sm border-2 border-black/60 bg-white"
              />
            </div>
          </div>
          <Slider label="crop width" min={0.03} max={1} step={0.005} value={crop.w} onStart={() => change((p) => p)} onChange={(v) => setCrop({ ...crop, w: v }, false)} />
          <Slider label="crop x" min={0} max={1} step={0.005} value={crop.x} onStart={() => change((p) => p)} onChange={(v) => setCrop({ ...crop, x: v }, false)} />
          <Slider label="crop y" min={0} max={1} step={0.005} value={crop.y} onStart={() => change((p) => p)} onChange={(v) => setCrop({ ...crop, y: v }, false)} />
          <p className="text-neutral-400">Lyrics shown: the first Line of {MONTH_NAMES[month]}. Z undoes · ← → step Months.</p>
        </section>
      </aside>
    </main>
  )
}

type SliderProps = { label: string; min: number; max: number; step: number; value: number; onStart: () => void; onChange: (v: number) => void }

// Pressing a slider records one undo step; dragging it doesn't add more.
function Slider({ label, min, max, step, value, onStart, onChange }: SliderProps) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-28 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onPointerDown={onStart} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
      <input type="number" min={min} max={max} step={step} value={value} onFocus={onStart} onChange={(e) => onChange(Number(e.target.value))} className="w-16 rounded bg-neutral-800 px-1" />
    </label>
  )
}
