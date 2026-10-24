// What the MV shows at a moment of the song: which Line, which Month's Wardrobe (including the
// closing Rapid change), the background colour, and whether the Figure waves. Pure functions of
// the Timing and time, so seeking and pausing can never leave a fade half-done or reversed.
import { LINES } from './lyrics.ts'
import { BPM, FIRST_BEAT, indexAt, type Timing } from './timing.ts'

// Rapid change, first part: flicks accelerate from SLOW_RATE at October's start to FAST_RATE
// (Months per second) at the `rapid` mark. Then it changes on every beat instead, landing on
// October on the beat nearest LAND_BEFORE_WAVE before the Wave; the Figure walks that last stretch.
const SLOW_RATE = 2
const FAST_RATE = 14
export const LAND_BEFORE_WAVE = 1
// A Month's background fades in over this long from its marker (outside the Rapid change).
const FADE = 0.4

const OCTOBER = 11
const STEP = 1 / 120
const BEAT = 60 / BPM

const smooth = (x: number) => x * x * (3 - 2 * x)
const beatIndex = (t: number) => Math.floor((t - FIRST_BEAT) / BEAT)
const mod12 = (n: number) => ((n % 12) + 12) % 12

export function rapidChange(timing: Timing) {
  const start = timing.months[OCTOBER]
  const { rapid: peak, wave } = timing
  if (start === undefined || peak === undefined || wave === undefined) return null
  // Land on a beat: the one nearest a second before the Wave.
  const landBeat = Math.round((wave - LAND_BEFORE_WAVE - FIRST_BEAT) / BEAT)
  const land = FIRST_BEAT + landBeat * BEAT
  if (!(start < peak && peak < land)) return null

  // Flicks counted since October's start while accelerating.
  const counts = [0]
  for (let t = start; t < peak; t += STEP) {
    const rate = SLOW_RATE + (FAST_RATE - SLOW_RATE) * smooth((t + STEP / 2 - start) / (peak - start))
    counts.push(counts[counts.length - 1] + rate * STEP)
  }

  return {
    start,
    land,
    // The Month shown at `t` while flicking, or null outside the Rapid change.
    monthAt(t: number): number | null {
      if (t < start || t >= land) return null
      if (t < peak) {
        const x = (t - start) / STEP
        const i = Math.min(counts.length - 2, Math.floor(x))
        return mod12(OCTOBER + Math.floor(counts[i] + (counts[i + 1] - counts[i]) * (x - i)))
      }
      // On the beat: count down the beats left so the landing beat is October.
      return mod12(OCTOBER - (landBeat - beatIndex(t)))
    },
  }
}

// Running into the Wave, timed from the `wave` mark: she slows to a stop, turns to face the screen
// (narrowing to a sliver and widening again), then raises her arm into the wave.
const SETTLE = [-0.8, -0.2] // light run → standing
const TURN = [-0.2, 0.1] // side → facing the screen
const RAISE = [0.1, 0.6] // arms down → waving

export type WaveTransition = {
  settle: number // 0 moving as keyed … 1 standing still
  squash: number // horizontal scale during the turn (1 outside it)
  front: boolean // facing the screen
  raise: number // 0 arms down … 1 waving
}

export const WAVING: WaveTransition = { settle: 1, squash: 1, front: true, raise: 1 }

const span = (t: number, [from, to]: number[]) => Math.min(1, Math.max(0, (t - from) / (to - from)))

export function waveTransition(timing: Timing, t: number): WaveTransition {
  if (timing.wave === undefined) return { settle: 0, squash: 1, front: false, raise: 0 }
  const since = t - timing.wave
  const turn = span(since, TURN)
  return {
    settle: smooth(span(since, SETTLE)),
    squash: Math.max(0.06, Math.abs(Math.cos(turn * Math.PI))),
    front: turn >= 0.5,
    raise: smooth(span(since, RAISE)),
  }
}

export type Moment = {
  line: number // index into LINES, -1 before the first
  month: number // whose Outfit to show
  background: string
  fadeFrom: number | null // the Month fading out underneath, while `fade` < 1
  fade: number // 0 → 1 over the fade-in from the previous Month
  wave: WaveTransition
  hello: boolean // "Hello 25th!" shows (and the Lines give way to it)
}

export function momentAt(timing: Timing, rapid: ReturnType<typeof rapidChange>, colours: string[], t: number): Moment {
  const flick = rapid?.monthAt(t) ?? null
  const month = flick ?? Math.max(0, indexAt(timing.months, t))
  // Fade in from the previous Month just after a marker; the Rapid change cuts.
  const since = t - (timing.months[month] ?? 0)
  const fading = flick === null && month > 0 && since >= 0 && since < FADE
  return {
    line: indexAt(timing.lines, t),
    month,
    background: fading ? mixOklab(colours[month - 1], colours[month], smooth(since / FADE)) : colours[month],
    fadeFrom: fading ? month - 1 : null,
    fade: fading ? smooth(since / FADE) : 1,
    wave: waveTransition(timing, t),
    hello: timing.hello !== undefined && t >= timing.hello,
  }
}

// Timeline Dots: the start of every Verse (its first Line) and every Month, and "Hello 25th!".
export function timelineDots(timing: Timing) {
  const verses = LINES.flatMap((line, i) =>
    timing.lines[i] !== undefined && line.verse !== LINES[i - 1]?.verse ? [timing.lines[i]] : [],
  )
  return { verses, months: timing.months, hello: timing.hello }
}

// Mixes two #rrggbb colours in OKLab, which keeps the midway colours bright instead of muddy.
function mixOklab(from: string, to: string, k: number): string {
  const a = toOklab(from)
  const b = toOklab(to)
  return fromOklab(a.map((v, i) => v + (b[i] - v) * k) as Vec3)
}

type Vec3 = [number, number, number]
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function toOklab(hex: string): Vec3 {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function fromOklab([L, A, B]: Vec3): string {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return `rgb(${rgb.map((c) => Math.round(255 * Math.min(1, Math.max(0, toGamma(c))))).join(' ')})`
}
