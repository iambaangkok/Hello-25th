import { MARK_NAMES, MONTH_NAMES, type Timing } from '../timing.ts'
import { DEFAULT_WARDROBE, type Wardrobe } from '../wardrobe.ts'

// What the timing tool edits. `months` holds every mark in MARK_NAMES order: 12 Months, then
// Rapid change, Wave and Hello 25th.
export type Draft = { lines: number[]; months: (number | null)[]; wardrobe: Wardrobe }

export const EMPTY: Draft = {
  lines: [],
  months: [0, ...Array<null>(MARK_NAMES.length - 1).fill(null)],
  wardrobe: DEFAULT_WARDROBE,
}

export function fromTiming(timing: Timing, wardrobe = DEFAULT_WARDROBE): Draft {
  const months = [...EMPTY.months]
  timing.months.forEach((t, i) => (months[i] = t))
  months[MONTH_NAMES.length] = timing.rapid ?? null
  months[MONTH_NAMES.length + 1] = timing.wave ?? null
  months[MONTH_NAMES.length + 2] = timing.hello ?? null
  return { lines: [...timing.lines], months, wardrobe }
}
