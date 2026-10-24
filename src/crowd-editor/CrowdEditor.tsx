import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { backToFront, type Crowd, type CrowdMember } from '../crowd.ts'
import { FIGURE_BOTTOM_VH, FIGURE_HEIGHT_VH, Figure } from '../Figure.tsx'
import { HelloTwentyFifth } from '../Hello.tsx'
import { POSES, dragLimb, jointsOnScreen, wavePose, type Limb, type Pose } from '../pose.ts'
import { MONTH_NAMES } from '../timing.ts'
import { withDefaults, type Wardrobe } from '../wardrobe.ts'
import crowdJson from '../data/crowd.json'
import wardrobeJson from '../data/wardrobe.json'

// Dev-only editor for the ending's crowd, served at /hello25/crowd.html by `pnpm dev`. The stage is
// the ending as it plays on a 16:9 screen: October's colour, "Hello 25th!", the waving Figure (not
// editable) and the crowd. Click a copy to select it, drag it to move, drag the round handles to
// bend elbows / hands / knees / feet; the panel sets everything else.

const WARDROBE = withDefaults(wardrobeJson as Wardrobe)
const STORAGE_KEY = 'hello25.crowd-editor.draft'
const UNDO_LIMIT = 300

const load = (): Crowd => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as Crowd
  } catch {
    // fall through to the committed crowd
  }
  return crowdJson as Crowd
}

const clone = <T,>(v: T): T => structuredClone(v)
const round = (v: number) => Math.round(v * 10) / 10

type Drag =
  | { kind: 'move'; index: number; from: [number, number]; start: [number, number] }
  | { kind: 'joint'; index: number; limb: 'arms' | 'legs'; side: number; joint: 1 | 2; box: HTMLElement }

export default function CrowdEditor() {
  const [crowd, setCrowd] = useState<Crowd>(load)
  const latest = useRef(crowd)
  const history = useRef<Crowd[]>([])
  const [selected, setSelected] = useState(0)
  const [status, setStatus] = useState('')
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(crowd)), [crowd])

  // Every change goes through here so Z can undo it. `record` false continues the current drag
  // without adding another undo step.
  const change = useCallback((update: (prev: Crowd) => Crowd, record = true) => {
    const prev = latest.current
    const next = update(prev)
    if (record) history.current = [...history.current.slice(-UNDO_LIMIT), prev]
    latest.current = next
    setCrowd(next)
  }, [])

  const undo = useCallback(() => {
    const prev = history.current.pop()
    if (!prev) return
    latest.current = prev
    setCrowd(prev)
  }, [])

  const setMember = useCallback(
    (index: number, patch: (m: CrowdMember) => CrowdMember, record = true) =>
      change((prev) => ({ members: prev.members.map((m, i) => (i === index ? patch(clone(m)) : m)) }), record),
    [change],
  )

  const member = crowd.members[selected] as CrowdMember | undefined

  const add = () => {
    const base: CrowdMember = member
      ? { ...clone(member), x: Math.min(95, member.x + 5) }
      : { month: 11, x: 50, y: 20, height: 18, flip: false, pose: clone(POSES.stand) }
    change((prev) => ({ members: [...prev.members, base] }))
    setSelected(crowd.members.length)
  }
  const remove = useCallback(() => {
    if (!latest.current.members[selected]) return
    change((prev) => ({ members: prev.members.filter((_, i) => i !== selected) }))
    setSelected((i) => Math.max(0, i - 1))
  }, [change, selected])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      const nudge = (dx: number, dy: number) =>
        setMember(selected, (m) => ({ ...m, x: round(m.x + dx), y: round(m.y + dy) }))
      const actions: Record<string, () => void> = {
        KeyZ: undo,
        Delete: remove,
        Backspace: remove,
        ArrowLeft: () => nudge(-0.5, 0),
        ArrowRight: () => nudge(0.5, 0),
        ArrowUp: () => nudge(0, 0.5),
        ArrowDown: () => nudge(0, -0.5),
      }
      const action = actions[e.code]
      if (!action) return
      e.preventDefault()
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, remove, setMember, selected])

  const startMove = (e: ReactPointerEvent, index: number) => {
    e.stopPropagation()
    setSelected(index)
    const m = latest.current.members[index]
    drag.current = { kind: 'move', index, from: [e.clientX, e.clientY], start: [m.x, m.y] }
    stage.current?.setPointerCapture(e.pointerId)
    change((prev) => prev) // one undo step for the whole drag
  }

  const startJoint = (e: ReactPointerEvent, index: number, limb: 'arms' | 'legs', side: number, joint: 1 | 2) => {
    e.stopPropagation()
    const box = (e.currentTarget as HTMLElement).closest<HTMLElement>('[data-member]')
    if (!box) return
    drag.current = { kind: 'joint', index, limb, side, joint, box }
    stage.current?.setPointerCapture(e.pointerId)
    change((prev) => prev)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    const rect = stage.current?.getBoundingClientRect()
    if (!d || !rect) return
    if (d.kind === 'move') {
      const dx = ((e.clientX - d.from[0]) / rect.width) * 100
      const dy = (-(e.clientY - d.from[1]) / rect.height) * 100
      setMember(d.index, (m) => ({ ...m, x: round(d.start[0] + dx), y: round(d.start[1] + dy) }), false)
      return
    }
    // Pointer → the Figure's viewBox (mirrored back if the copy is flipped).
    const box = d.box.getBoundingClientRect()
    const m = latest.current.members[d.index]
    let vx = ((e.clientX - box.left) / box.width) * 100
    const vy = ((e.clientY - box.top) / box.height) * 160
    if (m.flip) vx = 100 - vx
    const next = dragLimb(m.pose, d.limb, d.side, d.joint, [vx, vy])
    setMember(
      d.index,
      (mm) => {
        mm.pose[d.limb][d.side] = next.map(Math.round) as Limb
        return mm
      },
      false,
    )
  }

  const endDrag = () => (drag.current = null)

  const save = async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}__data/crowd`, {
      method: 'POST',
      body: JSON.stringify(latest.current, null, 2) + '\n',
    })
    setStatus(res.ok ? `Saved to src/data/crowd.json at ${new Date().toLocaleTimeString()}` : `Save failed: ${res.status}`)
  }
  const loadFromRepo = async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}__data/crowd`)
    if (!res.ok) return setStatus('No src/data/crowd.json yet')
    const loaded = (await res.json()) as Crowd
    change(() => loaded)
    setSelected(0)
    setStatus('Loaded src/data/crowd.json (Z to undo)')
  }

  const october = WARDROBE.months[11]
  const button = 'rounded bg-neutral-700 px-3 py-1 hover:bg-neutral-600 disabled:opacity-30'

  return (
    <main className="flex h-full gap-4 overflow-auto bg-neutral-950 p-4 font-sans text-white" style={{ fontWeight: 500 }}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">Crowd editor</h1>
          <button onClick={add} className={button}>{member ? 'Duplicate' : 'Add'}</button>
          <button onClick={remove} disabled={!member} className={button}>Delete</button>
          <button onClick={undo} className={button}>Undo (Z)</button>
          <button onClick={save} className="rounded bg-amber-400 px-3 py-1 font-bold text-black">Save to repo</button>
          <button onClick={loadFromRepo} className={button}>Load from repo</button>
          <span className="text-sm text-neutral-400">{status}</span>
        </header>
        <p className="text-sm text-neutral-400">
          Click a copy to select · drag it to move · drag the round handles to bend (inner = elbow / knee,
          outer = hand / foot) · arrows nudge · Delete removes · Z undoes. Higher up = further back.
        </p>

        {/* The ending on a 16:9 screen; positions are % of this box, as vw / vh in the MV. */}
        <div
          ref={stage}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerDown={() => setSelected(-1)}
          className="relative w-full overflow-hidden select-none"
          style={{ aspectRatio: '16 / 9', background: october.background, containerType: 'size', fontFamily: '"Noto Sans", "Noto Sans JP", sans-serif', fontWeight: 900 }}
        >
          <div className="absolute inset-x-[5%] top-[14%] bottom-[30%] flex items-center justify-center text-white">
            <HelloTwentyFifth size="min(11cqw,14cqh)" />
          </div>
          {backToFront([
            ...crowd.members.map((m, index) => ({ ...m, index })),
            { index: -1, y: FIGURE_BOTTOM_VH, x: 50, height: FIGURE_HEIGHT_VH, flip: false, month: 11, pose: wavePose(0) },
          ]).map((m) => (
            <div
              key={m.index}
              data-member={m.index}
              onPointerDown={m.index >= 0 ? (e) => startMove(e, m.index) : undefined}
              className={`absolute ${m.index >= 0 ? 'cursor-move' : 'pointer-events-none'}`}
              style={{
                left: `${m.x}%`,
                bottom: `${m.y}%`,
                height: `${m.height}%`,
                aspectRatio: '100 / 160',
                transform: `translateX(-50%)${m.flip ? ' scaleX(-1)' : ''}`,
                outline: m.index === selected ? '2px dashed rgb(255 255 255 / 0.8)' : undefined,
              }}
            >
              <Figure outfit={WARDROBE.months[m.month].outfit} phase={0} gait={0} waving={false} time={0} pose={m.pose} />
              {m.index === selected && <Handles pose={m.pose} onDown={(limb, side, joint, e) => startJoint(e, m.index, limb, side, joint)} />}
            </div>
          ))}
        </div>
      </div>

      <aside className="w-80 shrink-0 space-y-3 text-sm">
        {member ? (
          <MemberPanel member={member} onChange={(patch, record) => setMember(selected, patch, record)} />
        ) : (
          <p className="text-neutral-400">Select a copy on the stage, or press Add.</p>
        )}
        <p className="text-neutral-400">{crowd.members.length} in the crowd</p>
      </aside>
    </main>
  )
}

const JOINTS: { limb: 'arms' | 'legs'; joint: 1 | 2 }[] = [
  { limb: 'arms', joint: 1 },
  { limb: 'arms', joint: 2 },
  { limb: 'legs', joint: 1 },
  { limb: 'legs', joint: 2 },
]

// Round handles on the selected copy's elbows, hands, knees and feet; near / left limbs amber,
// far / right limbs cyan.
function Handles({ pose, onDown }: { pose: Pose; onDown: (limb: 'arms' | 'legs', side: number, joint: 1 | 2, e: ReactPointerEvent) => void }) {
  const joints = jointsOnScreen(pose)
  return (
    <>
      {[0, 1].flatMap((side) =>
        JOINTS.map(({ limb, joint }) => {
          const [x, y] = joints[limb][side][joint]
          return (
            <span
              key={`${side}${limb}${joint}`}
              onPointerDown={(e) => onDown(limb, side, joint, e)}
              title={`${limb === 'arms' ? (joint === 1 ? 'elbow' : 'hand') : joint === 1 ? 'knee' : 'foot'}`}
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-black/60"
              style={{ left: `${x}%`, top: `${(y / 160) * 100}%`, background: side === 0 ? '#fbbf24' : '#22d3ee' }}
            />
          )
        }),
      )}
    </>
  )
}

type PanelProps = {
  member: CrowdMember
  onChange: (patch: (m: CrowdMember) => CrowdMember, record?: boolean) => void
}

function MemberPanel({ member: m, onChange }: PanelProps) {
  const field = 'rounded bg-neutral-800 px-1 py-0.5'
  const names =
    m.pose.view === 'side'
      ? { arms: ['near arm', 'far arm'], legs: ['near leg', 'far leg'] }
      : { arms: ['left arm', 'right arm'], legs: ['left leg', 'right leg'] }
  // Sliders change continuously: pressing one records the undo step, its changes don't.
  const mark = () => onChange((mm) => mm)
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        Month
        <select value={m.month} onChange={(e) => onChange((mm) => ({ ...mm, month: Number(e.target.value) }))} className={field}>
          {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
        </select>
        <span className="inline-block size-4 rounded-sm" style={{ background: WARDROBE.months[m.month].background }} />
      </label>
      <label className="flex items-center gap-2">
        Pose preset
        <select
          value=""
          onChange={(e) => e.target.value && onChange((mm) => ({ ...mm, pose: clone(POSES[e.target.value]) }))}
          className={field}
        >
          <option value="">apply…</option>
          {Object.keys(POSES).map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-4">
        <span>facing {m.pose.view === 'side' ? 'sideways' : 'the screen'}</span>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={m.flip} onChange={(e) => onChange((mm) => ({ ...mm, flip: e.target.checked }))} />
          mirror
        </label>
      </div>
      <Slider label="x %" min={0} max={100} step={0.5} value={m.x} onPointerDown={mark} onChange={(v) => onChange((mm) => ({ ...mm, x: v }), false)} />
      <Slider label="y %" min={-10} max={70} step={0.5} value={m.y} onPointerDown={mark} onChange={(v) => onChange((mm) => ({ ...mm, y: v }), false)} />
      <Slider label="height %" min={4} max={60} step={0.5} value={m.height} onPointerDown={mark} onChange={(v) => onChange((mm) => ({ ...mm, height: v }), false)} />
      <Slider label="lean °" min={-60} max={60} step={1} value={m.pose.lean} onPointerDown={mark} onChange={(v) => onChange((mm) => ({ ...mm, pose: { ...mm.pose, lean: v } }), false)} />
      {(['arms', 'legs'] as const).flatMap((limb) =>
        [0, 1].map((side) => (
          <fieldset key={`${limb}${side}`} className="rounded border border-neutral-800 p-2">
            <legend className="px-1 text-neutral-400">{names[limb][side]}</legend>
            {[0, 1].map((k) => (
              <Slider
                key={k}
                label={k === 0 ? (limb === 'arms' ? 'shoulder °' : 'hip °') : limb === 'arms' ? 'elbow °' : 'knee °'}
                min={-180}
                max={180}
                step={1}
                value={m.pose[limb][side][k]}
                onPointerDown={mark}
                onChange={(v) =>
                  onChange((mm) => {
                    mm.pose[limb][side][k] = v
                    return mm
                  }, false)
                }
              />
            ))}
          </fieldset>
        )),
      )}
    </div>
  )
}

type SliderProps = {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  onPointerDown: () => void
}

function Slider({ label, min, max, step, value, onChange, onPointerDown }: SliderProps) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onPointerDown}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <input
        type="number"
        step={step}
        value={value}
        onFocus={onPointerDown}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 rounded bg-neutral-800 px-1"
      />
    </label>
  )
}
