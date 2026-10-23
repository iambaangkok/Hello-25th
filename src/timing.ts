// Timing: start time (seconds of audio) of every Line and every Month.
// `lines[i]` is the start of LINES[i]; `months[0]` is November, `months[11]` October.
// Rapid change: from October's start the Outfits and backgrounds flick through, speeding up to
// their fastest at `rapid`, then slowing to land on October's ~1 s before `wave`. At `wave` the
// Figure stops walking and waves at the screen until the audio ends.
export type Timing = {
  lines: number[]
  months: number[]
  rapid?: number
  wave?: number
}

export const MONTH_NAMES = [
  'November', 'December', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September', 'October',
] as const

// What the timing tool marks, in order: the 12 Months, then the fastest Rapid change and the Wave.
export const MARK_NAMES = [...MONTH_NAMES, 'Rapid change', 'Wave'] as const

// Index of the last start at or before `t`, or -1 if `t` is before the first.
// Unset (null) starts are skipped.
export function indexAt(starts: (number | null)[], t: number): number {
  let found = -1
  starts.forEach((start, i) => {
    if (start !== null && start <= t) found = i
  })
  return found
}
