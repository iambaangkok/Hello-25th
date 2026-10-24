import { useMemo, useState } from 'react'
import { FIGURE_HEIGHT_VH, Figure } from '../Figure.tsx'
import type { Gait } from '../gait.ts'
import { BAGS, HAIR_STYLES, HATS, INNERS, OUTERS, SHOES, type Outfit } from '../outfit.ts'
import { MONTH_NAMES, indexAt, type Timing } from '../timing.ts'
import { gaitTime, gaitTrack, type GaitKey, type Wardrobe } from '../wardrobe.ts'

// The Wardrobe (Month keyframes) and gait keyframes, with the Figure previewed live. Edits go
// through `onChange`; `coalesce` merges a run of edits to one field (e.g. dragging a colour) into
// a single undo step.

const GAITS: Gait[] = ['stand', 'walk', 'run']
const GAIT_LABEL: Record<Gait, string> = { stand: 'stand', walk: 'walk', run: 'light run' }

const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`
const round = (t: number) => Math.round(t * 1000) / 1000
const button = 'rounded bg-neutral-800 px-2 py-0.5 hover:bg-neutral-700 disabled:opacity-30'
const field = 'rounded bg-neutral-800 px-1 py-0.5'

type Props = {
  wardrobe: Wardrobe
  timing: Timing
  now: number
  playing: boolean
  duration: number
  playhead: () => number
  onChange: (update: (prev: Wardrobe) => Wardrobe, coalesce?: string) => void
  onAddGait: () => void
  onPlay: (t: number) => void
}

export function WardrobeEditor({ wardrobe, timing, now, playing, duration, playhead, onChange, onAddGait, onPlay }: Props) {
  const [editing, setEditing] = useState(0)
  const track = useMemo(() => gaitTrack(wardrobe, timing, duration || 240), [wardrobe, timing, duration])
  const playheadMonth = Math.max(0, indexAt(timing.months, now))
  // While playing, the preview follows the song; while paused it shows the Month being edited.
  const shown = playing ? playheadMonth : editing
  const { gait, phase } = track(now)
  const waving = timing.wave !== undefined && now >= timing.wave

  const setOutfit = <K extends keyof Outfit>(key: K, value: Outfit[K]) =>
    onChange(
      (prev) => ({
        ...prev,
        months: prev.months.map((m, i) => (i === editing ? { ...m, outfit: { ...m.outfit, [key]: value } } : m)),
      }),
      `${editing}.${key}`,
    )
  const setBackground = (background: string) =>
    onChange(
      (prev) => ({ ...prev, months: prev.months.map((m, i) => (i === editing ? { ...m, background } : m)) }),
      `${editing}.background`,
    )
  // Copy the whole Outfit (not the background) from another Month.
  const copyFrom = (from: number) =>
    onChange((prev) => ({
      ...prev,
      months: prev.months.map((m, i) => (i === editing ? { ...m, outfit: { ...prev.months[from].outfit } } : m)),
    }))
  // Hair defaults to the same all year: push this Month's hair to every Month.
  const hairToAll = () =>
    onChange((prev) => {
      const { hair, hairStyle, skin } = prev.months[editing].outfit
      return { ...prev, months: prev.months.map((m) => ({ ...m, outfit: { ...m.outfit, hair, hairStyle, skin } })) }
    })

  const setGait = (i: number, patch: Partial<GaitKey>, coalesce?: string) =>
    onChange((prev) => ({ ...prev, gaits: prev.gaits.map((g, j) => (j === i ? { ...g, ...patch } : g)) }), coalesce)
  const deleteGait = (i: number) => onChange((prev) => ({ ...prev, gaits: prev.gaits.filter((_, j) => j !== i) }))

  const o = wardrobe.months[editing].outfit
  const order = wardrobe.gaits
    .map((key, i) => ({ key, i, at: gaitTime(key, timing) }))
    .sort((a, b) => a.at - b.at)
  const activeGait = indexAt(order.map((k) => k.at), now)

  return (
    <section className="grid items-start gap-6 lg:grid-cols-[auto_1fr_1fr]">
      <div
        className="relative h-[60vh] w-[34vh] overflow-hidden rounded-lg"
        style={{ background: wardrobe.months[shown].background }}
      >
        <span className="absolute top-2 left-2 rounded bg-black/40 px-2 text-sm">
          {MONTH_NAMES[shown]} · {playing ? 'following playhead' : 'editing'} · gait {gait.toFixed(2)}
        </span>
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ height: `${FIGURE_HEIGHT_VH * 1.5}vh`, aspectRatio: '100 / 160', bottom: '8vh' }}
        >
          <Figure outfit={wardrobe.months[shown].outfit} phase={phase} gait={gait} waving={waving} time={now} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-bold">Wardrobe (Month keyframes)</h2>
        <ol className="mb-3 flex flex-wrap gap-1 text-sm">
          {MONTH_NAMES.map((name, i) => (
            <li key={name}>
              <button
                onClick={() => setEditing(i)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 ${i === editing ? 'outline outline-2 outline-amber-400' : ''} ${
                  i === playheadMonth ? 'text-amber-300' : ''
                }`}
              >
                <span className="inline-block size-3 rounded-sm" style={{ background: wardrobe.months[i].background }} />
                {name.slice(0, 3)}
              </button>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
          <span>background</span>
          <Colour value={wardrobe.months[editing].background} onChange={setBackground} />
          <span>inner</span>
          <span className="flex flex-wrap items-center gap-2">
            <Pick value={o.inner} options={INNERS} onChange={(v) => setOutfit('inner', v)} />
            <Colour value={o.innerColor} onChange={(v) => setOutfit('innerColor', v)} />
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={o.striped} onChange={(e) => setOutfit('striped', e.target.checked)} />
              striped
            </label>
            {o.striped && <Colour value={o.innerColor2} onChange={(v) => setOutfit('innerColor2', v)} />}
          </span>
          <span>outer</span>
          <span className="flex items-center gap-2">
            <Pick value={o.outer} options={OUTERS} onChange={(v) => setOutfit('outer', v)} />
            {o.outer !== 'none' && <Colour value={o.outerColor} onChange={(v) => setOutfit('outerColor', v)} />}
          </span>
          <span>bottom</span>
          <span className="flex flex-wrap items-center gap-2">
            {o.inner !== 'dress' && <Colour value={o.bottomColor} onChange={(v) => setOutfit('bottomColor', v)} />}
            <Slider label="length" value={o.length} onChange={(v) => setOutfit('length', v)} />
            {o.inner !== 'dress' && <Slider label="width" value={o.width} onChange={(v) => setOutfit('width', v)} />}
          </span>
          <span>shoes</span>
          <span className="flex items-center gap-2">
            <Pick value={o.shoes} options={SHOES} onChange={(v) => setOutfit('shoes', v)} />
            <Colour value={o.shoeColor} onChange={(v) => setOutfit('shoeColor', v)} />
            {o.shoes !== 'slipper' && <Colour value={o.shoeColor2} onChange={(v) => setOutfit('shoeColor2', v)} />}
          </span>
          <span>accessories</span>
          <span className="flex items-center gap-2">
            bag <Pick value={o.bag} options={BAGS} onChange={(v) => setOutfit('bag', v)} />
            {o.bag !== 'none' && <Colour value={o.bagColor} onChange={(v) => setOutfit('bagColor', v)} />}
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={o.scarf} onChange={(e) => setOutfit('scarf', e.target.checked)} />
              scarf
            </label>
            {o.scarf && <Colour value={o.scarfColor} onChange={(v) => setOutfit('scarfColor', v)} />}
            hat <Pick value={o.hat} options={HATS} onChange={(v) => setOutfit('hat', v)} />
            {o.hat !== 'none' && <Colour value={o.hatColor} onChange={(v) => setOutfit('hatColor', v)} />}
            {o.hat === 'bucket' && (
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={o.hatDots} onChange={(e) => setOutfit('hatDots', e.target.checked)} />
                dots
              </label>
            )}
            {o.hat === 'bucket' && o.hatDots && <Colour value={o.hatDotColor} onChange={(v) => setOutfit('hatDotColor', v)} />}
          </span>
          <span>hair</span>
          <span className="flex items-center gap-2">
            <Colour value={o.hair} onChange={(v) => setOutfit('hair', v)} />
            <Pick value={o.hairStyle} options={HAIR_STYLES} onChange={(v) => setOutfit('hairStyle', v)} />
            skin <Colour value={o.skin} onChange={(v) => setOutfit('skin', v)} />
            <button className={button} onClick={hairToAll} title="Copy hair colour, style and skin to every Month">
              to all Months
            </button>
          </span>
          <span>copy</span>
          <select value="" onChange={(e) => e.target.value !== '' && copyFrom(Number(e.target.value))} className={`${field} w-48`}>
            <option value="">Outfit from another Month…</option>
            {MONTH_NAMES.map((name, i) => i !== editing && <option key={name} value={i}>{name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-bold">Gait keyframes</h2>
        <p className="mb-2 text-sm text-neutral-400">
          The song starts in stand. <b>G</b> adds a free keyframe at the playhead. Tied keyframes move with their Month.
        </p>
        <ol className="space-y-1 text-sm tabular-nums">
          {order.map(({ key, i, at }, n) => (
            <li key={i} className={`flex flex-wrap items-center gap-2 rounded px-2 py-1 ${n === activeGait ? 'text-amber-300' : ''}`}>
              <select
                value={key.month ?? 'free'}
                onChange={(e) =>
                  setGait(i, e.target.value === 'free' ? { month: null, t: at } : { month: Number(e.target.value) })
                }
                className={`${field} w-28`}
              >
                <option value="free">free</option>
                {MONTH_NAMES.map((name, m) => <option key={name} value={m}>@ {name}</option>)}
              </select>
              <input
                key={`${i}:${at}`}
                defaultValue={fmt(at)}
                disabled={key.month !== null}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                onBlur={(e) => {
                  const m = e.currentTarget.value.trim().match(/^(?:(\d+):)?(\d+(?:\.\d*)?)$/)
                  if (m) setGait(i, { t: round(Number(m[1] ?? 0) * 60 + Number(m[2])) })
                  else e.currentTarget.value = fmt(at)
                }}
                className={`${field} w-20 disabled:opacity-50`}
              />
              {key.month === null && (
                <>
                  <button className={button} onClick={() => setGait(i, { t: round(playhead()) })}>now</button>
                  <button className={button} onClick={() => setGait(i, { t: round(Math.max(0, at - 0.1)) })}>−0.1</button>
                  <button className={button} onClick={() => setGait(i, { t: round(at + 0.1) })}>+0.1</button>
                </>
              )}
              <select value={key.gait} onChange={(e) => setGait(i, { gait: e.target.value as Gait })} className={field}>
                {GAITS.map((g) => <option key={g} value={g}>{GAIT_LABEL[g]}</option>)}
              </select>
              <label className="flex items-center gap-1">
                ease
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={key.ease}
                  onChange={(e) => setGait(i, { ease: Math.max(0, Number(e.target.value)) }, `gait${i}.ease`)}
                  className={`${field} w-16`}
                />
                s
              </label>
              <button className={button} onClick={() => onPlay(Math.max(0, at - 2))} title="Play from 2 s before">▶</button>
              <button className={button} onClick={() => deleteGait(i)}>delete</button>
            </li>
          ))}
        </ol>
        <button onClick={onAddGait} className={`${button} mt-2`}>+ gait keyframe at playhead</button>

        <h2 className="mt-4 mb-2 font-bold">Step rates (steps/min)</h2>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            walk
            <input
              type="number"
              value={wardrobe.walkSpm}
              onChange={(e) => onChange((prev) => ({ ...prev, walkSpm: Number(e.target.value) }), 'walkSpm')}
              className={`${field} w-16`}
            />
          </label>
          <label className="flex items-center gap-1">
            light run
            <input
              type="number"
              value={wardrobe.runSpm}
              onChange={(e) => onChange((prev) => ({ ...prev, runSpm: Number(e.target.value) }), 'runSpm')}
              className={`${field} w-16`}
            />
          </label>
        </div>
      </div>
    </section>
  )
}

function Colour({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-10 cursor-pointer rounded bg-transparent" />
  )
}

function Pick<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={field}>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1">
      {label}
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-24" />
    </label>
  )
}
