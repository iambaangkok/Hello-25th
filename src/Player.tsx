import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import audioUrl from '../assets/hello.m4a'
import { FIGURE_BOTTOM_VH, FIGURE_HEIGHT_VH, Figure } from './Figure.tsx'
import { FONTS, fontStack } from './fonts.ts'
import { Glass } from './Glass.tsx'
import { GLASS } from './glass.ts'
import { HelloTwentyFifth } from './Hello.tsx'
import { backToFront, type Crowd, type CrowdMember } from './crowd.ts'
import crowdJson from './data/crowd.json'
import { LINES } from './lyrics.ts'
import { raiseToWave } from './pose.ts'
import { WAVING, momentAt, rapidChange, timelineDots } from './mv.ts'
import { MONTH_NAMES, type Timing } from './timing.ts'
import { gaitTrack, withDefaults, type Wardrobe } from './wardrobe.ts'
import timingJson from './data/timing.json'
import wardrobeJson from './data/wardrobe.json'
import wardrobeFilm from './data/wardrobe-suggested.json'
import wardrobeVivid from './data/wardrobe-vivid.json'

// The MV: a blank page → the first tap fades "Thank you 24th..." in and out →
// the scene fades in as the song starts → Lines, Months and the Figure follow the audio → Rapid
// change → Wave → End screen. Tapping anywhere pauses / resumes; the End screen's tap replays.

const TIMING = timingJson as Timing
// In dev, `?wardrobe=vivid` or `?wardrobe=film` plays a suggested set instead (dropped from builds).
const SUGGESTED: Record<string, unknown> = { vivid: wardrobeVivid, film: wardrobeFilm }
const pick = import.meta.env.DEV ? SUGGESTED[new URLSearchParams(location.search).get('wardrobe') ?? ''] : undefined
const WARDROBE = withDefaults((pick ?? wardrobeJson) as Wardrobe)
// In dev, `?font=<key>` tries another font (see fonts.ts); builds use the first, linked in index.html.
const FONT = (import.meta.env.DEV && FONTS.find((f) => f.key === new URLSearchParams(location.search).get('font'))) || FONTS[0]
const COLOURS = WARDROBE.months.map((m) => m.background)
const CROWD = (crowdJson as Crowd).members
const FONT_TEXT = [...new Set(['Thank you 24th... Hello 25th!', ...LINES.flatMap((l) => [l.japanese, l.romaji, l.english])].join(''))].join('')
const DURATION_FALLBACK = 227.6
// During playback the Timeline and cursor hide this long after the pointer last moved.
const IDLE_MS = 2500

type Stage = 'blank' | 'intro' | 'playing' | 'paused' | 'end'

export default function Player() {
  const audio = useRef<HTMLAudioElement>(null)
  const [stage, setStage] = useState<Stage>('blank')
  const [now, setNow] = useState(0)
  const [duration, setDuration] = useState(DURATION_FALLBACK)
  const [active, setActive] = useState(true)
  const idle = useRef<number>(undefined)

  const rapid = useMemo(() => rapidChange(TIMING), [])
  const track = useMemo(() => gaitTrack(WARDROBE, TIMING, duration), [duration])
  const dots = useMemo(() => timelineDots(TIMING), [])

  // Japanese web fonts arrive in ~120 subset files, each fetched the first time one of its characters
  // is drawn — too late for a Line that shows for a few seconds (a new kanji would be missing). Fetch
  // every subset the MV uses up front, while the page is still blank.
  useEffect(() => {
    const preload = () => {
      for (const family of FONT.families) {
        void document.fonts?.load(`${FONT.weight} 1em "${family}"`, FONT_TEXT).catch(() => {})
      }
    }
    if (FONT === FONTS[0]) return preload() // its stylesheet is linked in index.html
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${FONT.google}&display=swap`
    link.onload = preload
    document.head.append(link)
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

  const wake = useCallback(() => {
    setActive(true)
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => setActive(false), IDLE_MS)
  }, [])

  const play = useCallback(() => {
    void audio.current?.play()
    setStage('playing')
  }, [])

  const tap = useCallback(() => {
    const el = audio.current
    if (!el || stage === 'intro') return
    if (stage === 'blank') {
      // The song starts after the intro, outside this tap; a muted play/pause now unlocks the
      // audio on browsers that only allow playback from a tap.
      el.muted = true
      el.play()
        .then(() => {
          el.pause()
          el.currentTime = 0
        })
        .catch(() => {})
        .finally(() => (el.muted = false))
      setStage('intro')
      // The controls (the fullscreen button) step aside for the intro until the pointer moves.
      window.clearTimeout(idle.current)
      setActive(false)
      return
    } else if (stage === 'end') {
      el.currentTime = 0
      play()
    } else if (el.paused) {
      play()
    } else {
      el.pause()
      setStage('paused')
    }
    wake()
  }, [stage, play, wake])

  const seek = (t: number) => {
    const el = audio.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(duration - 0.05, t))
    if (stage === 'end') play()
    wake()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      e.preventDefault()
      tap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tap])

  const before = stage === 'blank' || stage === 'intro'
  const moment = momentAt(TIMING, rapid, COLOURS, now)
  const month = before ? 0 : stage === 'end' ? 11 : moment.month
  const background = before ? COLOURS[0] : stage === 'end' ? COLOURS[11] : moment.background
  const fadeFrom = before || stage === 'end' ? null : moment.fadeFrom
  const { gait, phase } = track(now)
  // Running into the Wave (see mv.ts); the End screen keeps her waving.
  const wave = stage === 'end' ? WAVING : moment.wave
  const hello = stage === 'end' || ((stage === 'playing' || stage === 'paused') && moment.hello)
  const line = (stage === 'playing' || stage === 'paused') && !hello ? LINES[moment.line] : undefined

  return (
    <main
      onPointerDown={tap}
      onPointerMove={wake}
      className="relative h-full w-full overflow-hidden text-white"
      style={{
        background,
        fontFamily: fontStack(FONT),
        fontWeight: FONT.weight,
        cursor: stage === 'playing' && !active ? 'none' : 'default',
      }}
    >
      <audio
        ref={audio}
        src={audioUrl}
        preload="auto"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setStage('end')}
      />

      {/* The Month's painting through frosted glass (see glass.ts); the flat colour shows until it loads */}
      <Glass month={month} from={fadeFrom} fade={moment.fade} wash={background} settings={GLASS} />

      {stage === 'intro' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="animate-intro text-[clamp(18px,2.6vmin,34px)]" onAnimationEnd={play}>
            Thank you 24th...
          </p>
        </div>
      )}

      {!before && (
        // Mounts once the song starts, so the scene fades in with it.
        <div className="animate-scene absolute inset-0" style={{ textShadow: '0 0.04em 0.18em rgb(0 0 0 / 0.35)' }}>
          {/* Lyrics sit a little above the vertical centre, clear of the Figure, in a corridor shifted
              a little right of centre so the left-aligned text leans toward her: aligned left within
              it, wrapping before its right edge */}
          <div
            className="absolute right-[max(5vw,calc(54vw-60vh))] left-[max(5vw,calc(66vw-60vh))] flex items-center text-left"
            style={{ top: '14vh', bottom: `${FIGURE_BOTTOM_VH + FIGURE_HEIGHT_VH}vh` }}
          >
            {line && <LineView key={moment.line} line={line} />}
          </div>

          {hello && (
            // Centred on the screen (not in the Lyrics' corridor), fading in at the `hello` mark.
            <div
              className="animate-scene absolute inset-x-[5vw] flex items-center justify-center"
              style={{ top: '14vh', bottom: `${FIGURE_BOTTOM_VH + FIGURE_HEIGHT_VH}vh` }}
            >
              <HelloTwentyFifth />
            </div>
          )}

          {/* The crowd arrives with "Hello 25th!": copies higher up stand behind her, lower ones in front */}
          {hello && <CrowdLayer members={CROWD.filter((m) => m.y >= FIGURE_BOTTOM_VH)} />}

          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              height: `${FIGURE_HEIGHT_VH}vh`,
              bottom: `${FIGURE_BOTTOM_VH}vh`,
              aspectRatio: '100 / 160',
              transform: `scaleX(${wave.squash})`,
            }}
          >
            <Figure
              outfit={WARDROBE.months[month].outfit}
              phase={phase}
              gait={gait * (1 - wave.settle)}
              waving={false}
              time={now}
              pose={wave.front ? raiseToWave(now, wave.raise) : undefined}
            />
          </div>

          {hello && <CrowdLayer members={CROWD.filter((m) => m.y < FIGURE_BOTTOM_VH)} />}

          <Timeline now={now} duration={duration} dots={dots} visible={stage === 'paused' || active} onSeek={seek} />
        </div>
      )}
      <FullscreenButton visible={stage === 'blank' || stage === 'paused' || active} />
    </main>
  )
}

// Bottom right, past the Timeline's end: enters / leaves fullscreen. Shown on the blank page, then
// with the Timeline (pointer moved, or paused). Hidden where fullscreen isn't available (iPhone).
function FullscreenButton({ visible }: { visible: boolean }) {
  const [full, setFull] = useState(() => document.fullscreenElement !== null)
  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  if (!document.fullscreenEnabled) return null
  const toggle = () =>
    void (full ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})
  // Corner brackets pointing out (enter) or in (leave).
  const corners = full
    ? 'M3 7h4V3 M13 3v4h4 M17 13h-4v4 M7 17v-4H3'
    : 'M3 7V3h4 M13 3h4v4 M17 13v4h-4 M7 17H3v-4'
  return (
    <button
      title={full ? 'Leave fullscreen' : 'Fullscreen'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={toggle}
      className="absolute right-[2.5vw] bottom-[3vh] flex size-8 items-center justify-center transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', filter: 'drop-shadow(0 1px 3px rgb(0 0 0 / 0.35))' }}
    >
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="white" strokeWidth={2} strokeLinecap="square">
        <path d={corners} />
      </svg>
    </button>
  )
}

// Still copies of her, each in its own Month's Outfit and pose, fading in together.
function CrowdLayer({ members }: { members: CrowdMember[] }) {
  return (
    <div className="animate-scene pointer-events-none absolute inset-0">
      {backToFront(members).map((m, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${m.x}vw`,
            bottom: `${m.y}vh`,
            height: `${m.height}vh`,
            aspectRatio: '100 / 160',
            transform: `translateX(-50%)${m.flip ? ' scaleX(-1)' : ''}`,
          }}
        >
          <Figure outfit={WARDROBE.months[m.month].outfit} phase={0} gait={0} waving={false} time={0} pose={m.pose} />
        </div>
      ))}
    </div>
  )
}

function LineView({ line }: { line: (typeof LINES)[number] }) {
  if (line.instrumental) return <p className="animate-line text-[min(12.8vw,16vh)]">♪</p>
  return (
    <div className="animate-line flex flex-col items-start gap-[1vh] leading-tight">
      <p className="text-[max(13px,min(3vw,3.5vh))]" lang="ja">{line.japanese}</p>
      <p className="text-[min(5.4vw,6.4vh)]">{line.romaji}</p>
      <p className="min-h-[1.25em] text-[max(13px,min(3vw,3.5vh))] opacity-70">{line.english}</p>
    </div>
  )
}

type TimelineProps = {
  now: number
  duration: number
  dots: { verses: number[]; months: number[]; hello?: number }
  visible: boolean
  onSeek: (t: number) => void
}

// A thin white line for the song: press or drag anywhere on it to seek. Dots mark each Verse and
// Month start; a press on a Dot jumps exactly there (and can still drag on from it).
function Timeline({ now, duration, dots, visible, onSeek }: TimelineProps) {
  const bar = useRef<HTMLDivElement>(null)
  const at = (t: number) => `${(100 * t) / duration}%`
  const seekTo = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect()
    if (r) onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration)
  }
  const dot = (t: number, size: string, title: string) => (
    <span
      key={`${title}${t}`}
      title={title}
      data-t={t}
      className="absolute top-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{ left: at(t) }}
    >
      <span className={`${size} pointer-events-none rounded-full bg-white`} />
    </span>
  )
  return (
    <div
      ref={bar}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        const onDot = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('[data-t]') : null
        if (onDot) onSeek(Number(onDot.dataset.t))
        else seekTo(e.clientX)
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && seekTo(e.clientX)}
      className="absolute right-[max(8vw,calc(2.5vw+44px))] bottom-[3vh] left-[8vw] h-8 cursor-pointer touch-none transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/50" />
      <div className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-white" style={{ width: at(now) }} />
      {dots.verses.map((t, i) => dot(t, 'size-1.5', `Verse ${i + 1}`))}
      {dots.months.map((t, i) => dot(t, 'size-2.5', MONTH_NAMES[i]))}
      {dots.hello !== undefined && dot(dots.hello, 'size-3.5 ring-2 ring-white/50', 'Hello 25th')}
    </div>
  )
}
