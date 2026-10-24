import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import audioUrl from '../../assets/hello.m4a'
import { LINES } from '../lyrics.ts'
import { MARK_NAMES, MONTH_NAMES, indexAt, type Timing } from '../timing.ts'
import { GAIT_EASE } from '../gait.ts'
import { DEFAULT_WARDROBE, withDefaults, type Wardrobe } from '../wardrobe.ts'
import { EMPTY, fromTiming, type Draft } from './draft.ts'
import { WardrobeEditor } from './WardrobeEditor.tsx'

// Dev-only tap-along tool for recording the Timing. Served at /hello25/timing.html by `pnpm dev`;
// not part of the build. Lines are tapped along with the song; Months are set one row at a time
// (tap M, type a time, nudge, or snap to a Line start), then the Rapid change, the Wave and when
// "Hello 25th!" appears.
// Below them, the Wardrobe and gait keyframes are edited against the song with a live Figure.
// A variant (e.g. timing-suggested.html) keeps its own draft and starts from its own data.


const STORAGE_KEY = 'hello25.timing-tool.draft'
const LEGACY_TAPS_KEY = 'hello25.timing-tool.taps'
const LATENCY_KEY = 'hello25.timing-tool.latency'
const UNDO_LIMIT = 500

// A run of edits to the same field within this long is one undo step.
const COALESCE_MS = 1000

const round = (t: number) => Math.round(t * 1000) / 1000
const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`

// Accepts "47.58" (seconds) or "0:47.58" (m:ss).
function parseTime(text: string): number | null {
  const m = text.trim().match(/^(?:(\d+):)?(\d+(?:\.\d*)?)$/)
  if (!m) return null
  return round(Number(m[1] ?? 0) * 60 + Number(m[2]))
}

function loadDraft(storageKey: string, initial?: () => Draft): Draft {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const draft = JSON.parse(saved) as Draft
      // Drafts from before the Rapid change and Wave marks have only 12 slots.
      const months = [...draft.months, ...EMPTY.months.slice(draft.months.length)]
      // Drafts from before the Wardrobe have none.
      return { ...draft, months, wardrobe: draft.wardrobe ? withDefaults(draft.wardrobe) : DEFAULT_WARDROBE }
    }
    if (initial) return initial()
    // Earlier version of this tool stored a flat tap log.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_TAPS_KEY) ?? '[]') as { kind: string; t: number }[]
    const of = (kind: string) => legacy.filter((tap) => tap.kind === kind).map((tap) => round(tap.t))
    return fromTiming({ lines: of('line'), months: [0, ...of('month')] })
  } catch {
    return EMPTY
  }
}

// Months must start in order; a row earlier than the one before it is flagged.
const outOfOrder = (months: (number | null)[], i: number) => {
  const t = months[i]
  if (t === null) return false
  return months.slice(0, i).some((prev) => prev !== null && prev >= t)
}

type Props = {
  title?: string
  storageKey?: string
  // The draft to start from when this variant has none saved yet.
  initial?: () => Draft
}

export default function TimingTool({ title = 'Timing tool', storageKey = STORAGE_KEY, initial }: Props) {
  const audio = useRef<HTMLAudioElement>(null)
  const [draft, setDraftState] = useState<Draft>(() => loadDraft(storageKey, initial))
  const latest = useRef(draft)
  const history = useRef<Draft[]>([])
  const [selected, setSelected] = useState(() => Math.max(1, draft.months.findIndex((t) => t === null)))
  const [now, setNow] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [latencyMs, setLatencyMs] = useState(() => Number(localStorage.getItem(LATENCY_KEY) ?? 0))
  const [status, setStatus] = useState('')
  const [duration, setDuration] = useState(0)
  const lastChange = useRef({ key: '', at: 0 })

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(draft)), [storageKey, draft])
  useEffect(() => localStorage.setItem(LATENCY_KEY, String(latencyMs)), [latencyMs])

  // Every change goes through here so Z can undo it, whether it touched Lines or Months.
  // Kept outside a state updater so StrictMode's double-invoke can't record a change twice.
  // Edits sharing a `coalesce` key in quick succession (dragging a colour) undo as one.
  const change = useCallback((update: (prev: Draft) => Draft, coalesce = '') => {
    const prev = latest.current
    const next = update(prev)
    if (next === prev) return
    const at = Date.now()
    const merge = coalesce !== '' && lastChange.current.key === coalesce && at - lastChange.current.at < COALESCE_MS
    lastChange.current = { key: coalesce, at }
    if (!merge) history.current = [...history.current.slice(-UNDO_LIMIT), prev]
    latest.current = next
    setDraftState(next)
  }, [])

  const undo = useCallback(() => {
    const prev = history.current.pop()
    if (!prev) return
    latest.current = prev
    setDraftState(prev)
  }, [])

  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (audio.current) setNow(audio.current.currentTime)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const playhead = useCallback(
    () => Math.max(0, (audio.current?.currentTime ?? 0) - latencyMs / 1000),
    [latencyMs],
  )

  // A Line tap replaces every later Line tap, so seeking back and re-tapping fixes a section.
  const tapLine = useCallback(() => {
    const t = round(playhead())
    change((prev) => {
      const kept = prev.lines.filter((start) => start < t)
      if (kept.length >= LINES.length) return prev
      return { ...prev, lines: [...kept, t] }
    })
  }, [change, playhead])

  const setMonth = useCallback(
    (i: number, t: number | null) =>
      change((prev) => {
        if (prev.months[i] === t) return prev
        const months = [...prev.months]
        months[i] = t === null ? null : Math.max(0, round(t))
        return { ...prev, months }
      }),
    [change],
  )

  // M: the selected Month starts now, then move on to the next Month.
  const tapMonth = useCallback(() => {
    setMonth(selected, playhead())
    setSelected((i) => Math.min(MARK_NAMES.length - 1, i + 1))
  }, [selected, setMonth, playhead])

  const togglePlay = useCallback(() => {
    const el = audio.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }, [])

  const seekTo = useCallback((t: number, play = false) => {
    const el = audio.current
    if (!el) return
    el.currentTime = Math.max(0, t)
    if (play) void el.play()
  }, [])

  const seek = useCallback((delta: number) => seekTo((audio.current?.currentTime ?? 0) + delta), [seekTo])

  const changeWardrobe = useCallback(
    (update: (prev: Wardrobe) => Wardrobe, coalesce?: string) =>
      change((prev) => ({ ...prev, wardrobe: update(prev.wardrobe) }), coalesce),
    [change],
  )

  // G: a free walk keyframe at the playhead.
  const addGait = useCallback(
    () =>
      changeWardrobe((prev) => ({
        ...prev,
        gaits: [...prev.gaits, { month: null, t: round(playhead()), gait: 'walk', ease: GAIT_EASE }],
      })),
    [changeWardrobe, playhead],
  )

  const restart = () => {
    if (!confirm('Clear all Lines and Months and restart? The Wardrobe is kept. (Z can undo)')) return
    seekTo(0)
    audio.current?.pause()
    change((prev) => ({ ...EMPTY, wardrobe: prev.wardrobe }))
    setSelected(1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      const actions: Record<string, () => void> = {
        Space: tapLine,
        KeyM: tapMonth,
        KeyG: addGait,
        Backspace: undo,
        KeyZ: undo,
        KeyP: togglePlay,
        Enter: togglePlay,
        ArrowLeft: () => seek(-5),
        ArrowRight: () => seek(5),
        ArrowUp: () => setSelected((i) => Math.max(1, i - 1)),
        ArrowDown: () => setSelected((i) => Math.min(MARK_NAMES.length - 1, i + 1)),
        KeyS: () => setRate((r) => (r === 1 ? 0.75 : r === 0.75 ? 0.5 : 1)),
      }
      const action = actions[e.code]
      if (!action || e.repeat) return
      e.preventDefault()
      // Keep Space/Enter from also activating whatever control was last clicked.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tapLine, tapMonth, addGait, undo, togglePlay, seek])

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate
  }, [rate])

  const setMonthsCount = draft.months.filter((t) => t !== null).length
  const ordered = draft.months.every((_, i) => !outOfOrder(draft.months, i))
  const complete = draft.lines.length === LINES.length && setMonthsCount === MARK_NAMES.length && ordered
  const [rapid, wave, hello] = draft.months.slice(MONTH_NAMES.length)
  // Memoised so the Wardrobe preview's gait track is only rebuilt when the marks change.
  const timing: Timing = useMemo(
    () => ({
      lines: draft.lines,
      months: draft.months.slice(0, MONTH_NAMES.length).filter((t): t is number => t !== null),
      ...(rapid !== null && { rapid }),
      ...(wave !== null && { wave }),
      ...(hello !== null && { hello }),
    }),
    [draft.lines, draft.months, rapid, wave, hello],
  )
  const json = JSON.stringify(timing, null, 2) + '\n'
  const wardrobeJson = JSON.stringify(draft.wardrobe, null, 2) + '\n'
  const current = indexAt(draft.lines, now)
  const month = indexAt(draft.months, now)
  const next = draft.lines.length

  const save = async () => {
    if (!complete && !confirm('Timing is incomplete or Months are out of order. Save anyway?')) return
    const post = (name: string, body: string) =>
      fetch(`${import.meta.env.BASE_URL}__data/${name}`, { method: 'POST', body })
    const [a, b] = await Promise.all([post('timing', json), post('wardrobe', wardrobeJson)])
    setStatus(
      a.ok && b.ok
        ? `Saved src/data/timing.json + wardrobe.json at ${new Date().toLocaleTimeString()}`
        : `Save failed: ${a.status} / ${b.status}`,
    )
  }

  const loadFromRepo = async () => {
    const get = (name: string) => fetch(`${import.meta.env.BASE_URL}__data/${name}`)
    const [a, b] = await Promise.all([get('timing'), get('wardrobe')])
    if (!a.ok) return setStatus('No src/data/timing.json yet')
    const wardrobe = b.ok ? withDefaults((await b.json()) as Wardrobe) : latest.current.wardrobe
    const loaded = fromTiming((await a.json()) as Timing, wardrobe)
    change(() => loaded)
    setStatus(`Loaded src/data/timing.json${b.ok ? ' + wardrobe.json' : ''} (Z to undo)`)
  }

  const download = (name: string, body: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
    a.download = name
    a.click()
  }

  // Either file: a Wardrobe has `gaits`, a Timing has `lines`.
  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Timing | Wardrobe
      if ('gaits' in data) change((prev) => ({ ...prev, wardrobe: withDefaults(data) }))
      else change((prev) => fromTiming(data, prev.wardrobe))
      setStatus(`Imported ${file.name} (Z to undo)`)
    } catch (err) {
      setStatus(`Import failed: ${String(err)}`)
    }
  }

  return (
    <main className="flex h-full flex-col gap-4 overflow-auto bg-neutral-950 p-6 font-sans text-white" style={{ fontWeight: 500 }}>
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-bold">{title}</h1>
        <audio
          ref={audio}
          src={audioUrl}
          controls
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        <span className="tabular-nums">
          {fmt(now)} · {rate}× · {playing ? 'playing' : 'paused'}
        </span>
        <label className="flex items-center gap-2">
          latency comp (ms)
          <input
            type="number"
            step={10}
            value={latencyMs}
            onChange={(e) => setLatencyMs(Number(e.target.value))}
            className="w-20 rounded bg-neutral-800 px-2 py-1"
          />
        </label>
      </header>

      <p className="text-sm text-neutral-400">
        <b>Space</b> next Line starts · <b>M</b> selected Month starts now (then selects the next) ·{' '}
        <b>↑ ↓</b> select Month · <b>Z / Backspace</b> undo any change · <b>P / Enter</b> play/pause ·{' '}
        <b>G</b> gait keyframe at the playhead · <b>← →</b> seek 5 s · <b>S</b> speed 1 / 0.75 / 0.5 · a Line tap replaces later Line taps, so
        seek back and re-tap to fix a section.
      </p>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-neutral-900 p-4">
          <h2 className="text-sm text-neutral-400">Now (from recorded timing)</h2>
          <p className="text-lg">{month >= 0 ? `${month + 1}: ${MARK_NAMES[month]}` : '—'}</p>
          <LineView index={current} />
        </div>
        <div className="rounded-lg bg-neutral-900 p-4 outline outline-2 outline-amber-400">
          <h2 className="text-sm text-neutral-400">Next taps</h2>
          <p className="text-lg">
            M sets: {selected + 1}: {MARK_NAMES[selected]}
          </p>
          <LineView index={next < LINES.length ? next : -1} label="Space" />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <span>
          Lines {draft.lines.length}/{LINES.length} · Months {setMonthsCount}/{MARK_NAMES.length}{' '}
          {!ordered && <b className="text-red-400">Months out of order</b>}{' '}
          {complete && <b className="text-green-400">complete</b>}
        </span>
        <button onClick={save} className="rounded bg-amber-400 px-3 py-1 font-bold text-black">
          Save to repo
        </button>
        <button onClick={loadFromRepo} className="rounded bg-neutral-700 px-3 py-1">
          Load from repo
        </button>
        <button onClick={() => download('timing.json', json)} className="rounded bg-neutral-700 px-3 py-1">
          Download timing
        </button>
        <button onClick={() => download('wardrobe.json', wardrobeJson)} className="rounded bg-neutral-700 px-3 py-1">
          Download wardrobe
        </button>
        <label className="cursor-pointer rounded bg-neutral-700 px-3 py-1">
          Import JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importJson(file)
              e.target.value = ''
            }}
          />
        </label>
        <button onClick={restart} className="rounded bg-red-800 px-3 py-1">
          Restart
        </button>
        <span className="text-sm text-neutral-400">{status}</span>
      </section>

      <WardrobeEditor
        wardrobe={draft.wardrobe}
        timing={timing}
        now={now}
        playing={playing}
        duration={duration}
        playhead={playhead}
        onChange={changeWardrobe}
        onAddGait={addGait}
        onPlay={(t) => seekTo(t, true)}
      />

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-bold">Months, Rapid change, Wave, Hello 25th</h2>
          <ol className="space-y-1 text-sm tabular-nums">
            {MARK_NAMES.map((name, i) => (
              <MonthRow
                key={name}
                index={i}
                start={draft.months[i]}
                selected={i === selected}
                current={i === month}
                invalid={outOfOrder(draft.months, i)}
                lineStarts={draft.lines}
                onSelect={() => setSelected(i)}
                onSet={(t) => setMonth(i, t)}
                onNow={() => setMonth(i, playhead())}
                onPlay={(t) => seekTo(t, true)}
              />
            ))}
          </ol>
        </div>

        <div>
          <h2 className="mb-2 font-bold">Lines</h2>
          <ol className="grid grid-cols-[auto_auto_1fr] gap-x-4 text-sm tabular-nums">
            {LINES.map((line, i) => (
              <li key={i} className={`contents ${i === current ? 'text-amber-300' : i >= next ? 'text-neutral-500' : ''}`}>
                <span>{i + 1}</span>
                <button
                  className="text-left underline-offset-2 hover:underline"
                  onClick={() => draft.lines[i] !== undefined && seekTo(draft.lines[i])}
                >
                  {draft.lines[i] !== undefined ? fmt(draft.lines[i]) : '—'}
                </button>
                <span>
                  {line.verse !== LINES[i - 1]?.verse && '¶ '}
                  {line.romaji}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  )
}

type MonthRowProps = {
  index: number
  start: number | null
  selected: boolean
  current: boolean
  invalid: boolean
  lineStarts: number[]
  onSelect: () => void
  onSet: (t: number | null) => void
  onNow: () => void
  onPlay: (t: number) => void
}

function MonthRow({ index, start, selected, current, invalid, lineStarts, onSelect, onSet, onNow, onPlay }: MonthRowProps) {
  const pinned = index === 0
  const atLine = start === null ? -1 : indexAt(lineStarts, start + 0.0005)
  const line = LINES[atLine]
  const button = 'rounded bg-neutral-800 px-2 py-0.5 hover:bg-neutral-700 disabled:opacity-30'

  return (
    <li
      onClick={pinned ? undefined : onSelect}
      className={`flex flex-wrap items-center gap-2 rounded px-2 py-1 ${
        selected ? 'bg-amber-400/15 outline outline-1 outline-amber-400' : ''
      } ${current ? 'text-amber-300' : ''} ${pinned ? '' : 'cursor-pointer'}`}
    >
      <span className="w-28">
        {index + 1}. {MARK_NAMES[index]}
      </span>
      <input
        // Remount when the value changes elsewhere (tap, nudge, undo) so the field shows it.
        key={start ?? 'unset'}
        defaultValue={start === null ? '' : fmt(start)}
        placeholder="m:ss.xx"
        disabled={pinned}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        onBlur={(e) => {
          const text = e.currentTarget.value
          const t = text.trim() === '' ? null : parseTime(text)
          if (t !== null || text.trim() === '') onSet(t)
          else e.currentTarget.value = start === null ? '' : fmt(start)
        }}
        className={`w-24 rounded bg-neutral-800 px-2 py-0.5 ${invalid ? 'text-red-400 outline outline-1 outline-red-500' : ''}`}
      />
      {!pinned && (
        <>
          <button className={button} onClick={onNow} title="Set to the playhead">
            now
          </button>
          <button className={button} disabled={start === null} onClick={() => start !== null && onSet(start - 0.1)}>
            −0.1
          </button>
          <button className={button} disabled={start === null} onClick={() => start !== null && onSet(start + 0.1)}>
            +0.1
          </button>
          <select
            // Free (no snap) by default; shows a Line only when the start sits exactly on it.
            value={start !== null && lineStarts[atLine] === start ? atLine : 'free'}
            onChange={(e) => e.target.value !== 'free' && onSet(lineStarts[Number(e.target.value)])}
            className="w-32 rounded bg-neutral-800 px-1 py-0.5"
            title="Start this Month exactly where a Line starts"
          >
            <option value="free">free (no snap)</option>
            {lineStarts.map((t, i) => (
              <option key={i} value={i}>
                {i + 1} · {fmt(t)} · {LINES[i].romaji}
              </option>
            ))}
          </select>
          <button className={button} disabled={start === null} onClick={() => onSet(null)}>
            clear
          </button>
        </>
      )}
      <button className={button} disabled={start === null} onClick={() => start !== null && onPlay(Math.max(0, start - 2))} title="Play from 2 s before">
        ▶
      </button>
      <span className="text-neutral-400">
        {line ? `at Line ${atLine + 1}: ${line.romaji}` : start === null ? 'not set' : 'before Line 1'}
      </span>
    </li>
  )
}

function LineView({ index, label }: { index: number; label?: string }) {
  const line = LINES[index]
  if (!line) return <p className="mt-2 text-neutral-500">—</p>
  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm text-neutral-400">
        {label && `${label}: `}Line {index + 1} · Verse {line.verse + 1}
      </p>
      <p className="text-xl">{line.japanese}</p>
      <p className="text-2xl font-bold">{line.romaji}</p>
      <p className="text-neutral-400">{line.english}</p>
    </div>
  )
}
