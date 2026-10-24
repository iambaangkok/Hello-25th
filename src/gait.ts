// The Figure's gait: stand, walk or light run. Gait keyframes switch between them; the shown gait
// eases toward the target, so it is a number — 0 stand, 1 walk, 2 light run, fractional mid-ease.
export type Gait = 'stand' | 'walk' | 'run'

export const GAIT_VALUE: Record<Gait, number> = { stand: 0, walk: 1, run: 2 }

// Step rates on the song's beat (154 BPM — see BPM in timing.ts): light run one step per beat,
// walk one step every two. Plus the default time to ease a whole gait step.
export const WALK_SPM = 77
export const RUN_SPM = 154
export const GAIT_EASE = 0.8

// Steps per minute at an eased gait value: stand → walk ramps up from 0, walk → run blends.
export function stepsPerMinute(gait: number, walk = WALK_SPM, run = RUN_SPM): number {
  return gait <= 1 ? walk * Math.max(0, gait) : walk + (run - walk) * Math.min(1, gait - 1)
}
