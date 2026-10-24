// The Wardrobe (12 Month keyframes) and the gait keyframes, edited in the timing tool and saved to
// src/data/wardrobe.json. Both the timing tool's preview and the player read the Figure from here.
import { GAIT_EASE, GAIT_VALUE, RUN_SPM, WALK_SPM, stepsPerMinute, type Gait } from './gait.ts'
import { DEFAULT_OUTFIT, type Outfit } from './outfit.ts'
import type { Timing } from './timing.ts'

// What changes at a Month marker.
export type MonthKey = { background: string; outfit: Outfit }

// A gait change. Tied to a Month marker (`month` set — moves with it) or free at `t` seconds.
export type GaitKey = { month: number | null; t: number; gait: Gait; ease: number }

// Version 2: pants `length` 0 is bikini-short (it was shorts, i.e. 0.3 of the leg).
export const WARDROBE_VERSION = 2

export type Wardrobe = {
  version?: number
  months: MonthKey[] // November → October
  gaits: GaitKey[]
  walkSpm: number
  runSpm: number
}

const HAIR = { hair: DEFAULT_OUTFIT.hair, hairStyle: DEFAULT_OUTFIT.hairStyle, skin: DEFAULT_OUTFIT.skin }
const month = (background: string, outfit: Partial<Outfit>): MonthKey => ({
  background,
  outfit: { ...DEFAULT_OUTFIT, ...outfit, ...HAIR },
})

// Draft palette: seasonal, Northern hemisphere. Meant to be edited.
export const DEFAULT_WARDROBE: Wardrobe = {
  months: [
    month('#8c4a2f', { inner: 'turtleneck', innerColor: '#e9d8a6', outer: 'cardigan', outerColor: '#a15c38', bottomColor: '#3a2e2a', length: 1, width: 0.5, shoes: 'runner', shoeColor: '#f4f1ea', shoeColor2: '#8c4a2f', bag: 'bigside', bagColor: '#5e3a24' }),
    month('#1d3557', { inner: 'longsleeve', innerColor: '#f4f1ea', outer: 'puffer', outerColor: '#9b2226', bottomColor: '#22223b', length: 1, width: 0.3, shoes: 'runner', shoeColor: '#ffffff', shoeColor2: '#9b2226', bag: 'none', scarf: true, scarfColor: '#f4f1ea' }),
    month('#e7ecef', { inner: 'longsleeve', innerColor: '#e63946', striped: true, innerColor2: '#f4f1ea', outer: 'coat', outerColor: '#274c77', bottomColor: '#1b1b1e', length: 1, width: 0.3, shoes: 'runner', shoeColor: '#1b1b1e', shoeColor2: '#e63946', bag: 'side', bagColor: '#6c584c', scarf: true, scarfColor: '#e9c46a' }),
    month('#c9ada7', { inner: 'longsleeve', innerColor: '#f2e9e4', outer: 'coat', outerColor: '#4a4e69', bottomColor: '#22223b', length: 1, width: 0.6, shoes: 'slipper2', shoeColor: '#22223b', shoeColor2: '#f2e9e4', bag: 'none' }),
    month('#9ad1d4', { inner: 'blouse', innerColor: '#ffffff', outer: 'cardigan', outerColor: '#f7c8d0', bottomColor: '#4361ee', length: 1, width: 0.4, shoes: 'runner', shoeColor: '#ffffff', shoeColor2: '#4361ee', bag: 'backpack', bagColor: '#f4a261' }),
    month('#f7c8d0', { inner: 'dress', innerColor: '#fefae0', outer: 'jacket', outerColor: '#6d9dc5', length: 0.7, shoes: 'slipper2', shoeColor: '#fefae0', shoeColor2: '#6d9dc5', bag: 'side', bagColor: '#bc6c25' }),
    month('#a7c957', { inner: 'tshirt', innerColor: '#f4f1ea', outer: 'vest', outerColor: '#386641', bottomColor: '#6a994e', length: 0.86, width: 0.5, shoes: 'runner', shoeColor: '#ffffff', shoeColor2: '#386641', bag: 'none' }),
    month('#577590', { inner: 'tshirt', innerColor: '#f9c74f', outer: 'none', bottomColor: '#277da1', length: 1, width: 0.7, shoes: 'slipper', shoeColor: '#f9c74f', bag: 'side', bagColor: '#f3722c' }),
    month('#43aa8b', { inner: 'tank', innerColor: '#ffffff', striped: true, innerColor2: '#277da1', outer: 'none', bottomColor: '#f4f1ea', length: 0.44, width: 0.5, shoes: 'slipper2', shoeColor: '#ffffff', shoeColor2: '#277da1', bag: 'none', hat: 'bucket', hatColor: '#fefae0', hatDots: true, hatDotColor: '#277da1' }),
    month('#f9844a', { inner: 'strap', innerColor: '#fefae0', outer: 'none', bottomColor: '#264653', length: 0.4, width: 0.6, shoes: 'slipper', shoeColor: '#264653', bag: 'side', bagColor: '#e9c46a', hat: 'cap', hatColor: '#264653' }),
    month('#e9c46a', { inner: 'dress', innerColor: '#2a9d8f', outer: 'none', length: 0.6, shoes: 'runner', shoeColor: '#ffffff', shoeColor2: '#2a9d8f', bag: 'none' }),
    month('#bc4749', { inner: 'tshirt', innerColor: '#f4f1ea', outer: 'jacket', outerColor: '#283618', bottomColor: '#1b1b1e', length: 1, width: 0.3, shoes: 'runner', shoeColor: '#ffffff', shoeColor2: '#bc4749', bag: 'side', bagColor: '#dda15e' }),
  ],
  gaits: [
    { month: 1, t: 0, gait: 'walk', ease: GAIT_EASE },
    { month: 5, t: 0, gait: 'run', ease: GAIT_EASE },
    { month: 7, t: 0, gait: 'walk', ease: GAIT_EASE },
    { month: 11, t: 0, gait: 'run', ease: GAIT_EASE },
  ],
  walkSpm: WALK_SPM,
  runSpm: RUN_SPM,
  version: WARDROBE_VERSION,
}

// Brings a saved Wardrobe up to date: fills Outfit fields added since (e.g. the scarf) from the
// defaults and converts older values.
export const withDefaults = (wardrobe: Wardrobe): Wardrobe => {
  const old = (wardrobe.version ?? 1) < 2
  return {
    ...DEFAULT_WARDROBE,
    ...wardrobe,
    version: WARDROBE_VERSION,
    months: wardrobe.months.map((m) => ({ ...m, outfit: migrate({ ...DEFAULT_OUTFIT, ...m.outfit }, old) })),
  }
}

const migrate = (o: Outfit, oldLength: boolean): Outfit => {
  // `bag` was a yes/no before the bag types.
  const bag = o.bag as Outfit['bag'] | boolean
  // The bucket hat was briefly called a bowl hat.
  const out: Outfit = {
    ...o,
    bag: typeof bag === 'boolean' ? (bag ? 'side' : 'none') : bag,
    hat: (o.hat as string) === 'bowl' ? 'bucket' : o.hat,
  }
  // Pants length used to start at shorts (0.3 of the leg); a dress's length is unchanged.
  return oldLength && out.inner !== 'dress' ? { ...out, length: Math.round((0.3 + out.length * 0.7) * 100) / 100 } : out
}

// When a gait keyframe happens: on its Month's marker if tied, else its own time.
export const gaitTime = (key: GaitKey, timing: Timing) =>
  key.month !== null ? (timing.months[key.month] ?? key.t) : key.t

const smooth = (x: number) => x * x * (3 - 2 * x)

// The shown gait (0 stand … 2 run) over the song: starts standing; each keyframe eases from
// wherever the gait is at its time to its target over its own ease seconds.
export function gaitAt(wardrobe: Wardrobe, timing: Timing, t: number): number {
  const keys = wardrobe.gaits
    .map((key) => ({ at: gaitTime(key, timing), to: GAIT_VALUE[key.gait], ease: key.ease }))
    .sort((a, b) => a.at - b.at)
  let value = 0
  for (const [i, key] of keys.entries()) {
    if (key.at > t) break
    // A later keyframe can interrupt this one mid-ease; it eases on from where this one got to.
    const until = Math.min(t, keys[i + 1]?.at ?? Infinity)
    const k = key.ease <= 0 ? 1 : smooth(Math.min(1, (until - key.at) / key.ease))
    value += (key.to - value) * k
  }
  return value
}

const SAMPLE_HZ = 100

// Gait and walk-cycle phase at any time, seekable: the phase (π per step) is integrated once over
// the whole song, then looked up.
export function gaitTrack(wardrobe: Wardrobe, timing: Timing, duration: number) {
  const n = Math.ceil(duration * SAMPLE_HZ) + 2
  const phases = new Float64Array(n)
  let prev = gaitAt(wardrobe, timing, 0)
  for (let i = 1; i < n; i++) {
    const g = gaitAt(wardrobe, timing, i / SAMPLE_HZ)
    const spm = stepsPerMinute((prev + g) / 2, wardrobe.walkSpm, wardrobe.runSpm)
    phases[i] = phases[i - 1] + (spm / 60) * Math.PI / SAMPLE_HZ
    prev = g
  }
  return (t: number) => {
    const x = Math.max(0, Math.min(n - 1.001, t * SAMPLE_HZ))
    const i = Math.floor(x)
    return { gait: gaitAt(wardrobe, timing, t), phase: phases[i] + (phases[i + 1] - phases[i]) * (x - i) }
  }
}
