// The ending's crowd: still copies of her around the waving Figure, appearing with "Hello 25th!".
// Edited in the crowd editor (crowd.html) and saved to src/data/crowd.json.
import type { Pose } from './pose.ts'

// x is the centre as % of the screen width; y (gap below the feet) and height are % of its height.
export type CrowdMember = { month: number; x: number; y: number; height: number; flip: boolean; pose: Pose }
export type Crowd = { members: CrowdMember[] }

// Drawn back to front: the higher up the screen, the further away.
export const backToFront = <T extends { y: number }>(items: T[]) => [...items].sort((a, b) => b.y - a.y)
