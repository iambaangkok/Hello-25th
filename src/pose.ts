// The Figure's skeleton and an explicit Pose for it: what the crowd editor sets joint by joint and
// the Figure draws. All in the Figure's 100×160 viewBox.

export type Pt = [number, number]

export const THIGH = 28
export const SHIN = 28
export const UPPER = 21
export const FORE = 19

// Angles are radians from straight down; positive swings toward +x.
export const limb = (from: Pt, len: number, angle: number): Pt => [
  from[0] + len * Math.sin(angle),
  from[1] + len * Math.cos(angle),
]

// One limb, in degrees: the upper arm / thigh angle, then the bend at the elbow / knee.
export type Limb = [number, number]

// side — facing right (+x). Index 0 is the near limb, 1 the far one. Angles from straight down,
//   positive swings forward; elbow bend positive lifts the forearm forward, knee bend positive
//   folds the shin back.
// front — facing the screen. Index 0 is the viewer's left limb, 1 the right. Angles and bends are
//   positive outward, away from the body.
// lean — degrees, positive tips forward (side) or clockwise (front).
export type Pose = {
  view: 'side' | 'front'
  lean: number
  arms: [Limb, Limb]
  legs: [Limb, Limb]
}

const SIDE_SHOULDER: Pt = [50, 46]
const SIDE_HIP: Pt = [50, 92]
const FRONT_SHOULDERS: [Pt, Pt] = [[37, 46], [63, 46]]
const FRONT_HIPS: [Pt, Pt] = [[44, 90], [56, 90]]

const rad = (deg: number) => (deg * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
// Viewer's-left limbs point outward toward −x.
const outward = (pose: Pose, i: number) => (pose.view === 'front' && i === 0 ? -1 : 1)

export const leanPivot = (pose: Pose): Pt => (pose.view === 'side' ? SIDE_HIP : [50, 150])

// Shoulder → elbow → hand, before the lean.
export function armPoints(pose: Pose, i: number): Pt[] {
  const [upper, bend] = pose.arms[i]
  const s = outward(pose, i)
  const shoulder = pose.view === 'side' ? SIDE_SHOULDER : FRONT_SHOULDERS[i]
  const elbow = limb(shoulder, UPPER, s * rad(upper))
  return [shoulder, elbow, limb(elbow, FORE, s * rad(upper + bend))]
}

// Hip → knee → foot, before the lean.
export function legPoints(pose: Pose, i: number): Pt[] {
  const [thigh, bend] = pose.legs[i]
  const s = outward(pose, i)
  const hip = pose.view === 'side' ? SIDE_HIP : FRONT_HIPS[i]
  const knee = limb(hip, THIGH, s * rad(thigh))
  const shin = pose.view === 'side' ? thigh - bend : thigh + bend
  return [hip, knee, limb(knee, SHIN, s * rad(shin))]
}

// The shin's angle in radians, for tilting the shoe (side view).
export const shinAngle = (pose: Pose, i: number) => rad(pose.legs[i][0] - pose.legs[i][1])

const rotate = ([x, y]: Pt, [cx, cy]: Pt, r: number): Pt => [
  cx + (x - cx) * Math.cos(r) - (y - cy) * Math.sin(r),
  cy + (x - cx) * Math.sin(r) + (y - cy) * Math.cos(r),
]

// Where each joint is drawn, lean included: for the editor's handles.
export function jointsOnScreen(pose: Pose): { arms: Pt[][]; legs: Pt[][] } {
  const r = rad(pose.lean)
  const pivot = leanPivot(pose)
  const lean = (points: Pt[]) => points.map((p) => rotate(p, pivot, r))
  return { arms: [0, 1].map((i) => lean(armPoints(pose, i))), legs: [0, 1].map((i) => lean(legPoints(pose, i))) }
}

const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

// Dragging a joint handle to `to` (viewBox coordinates, lean included): the new Limb. `joint` 1 is
// the elbow / knee (sets the upper angle), 2 the hand / foot (sets the bend).
export function dragLimb(pose: Pose, kind: 'arms' | 'legs', i: number, joint: 1 | 2, to: Pt): Limb {
  const [x, y] = rotate(to, leanPivot(pose), -rad(pose.lean))
  const points = kind === 'arms' ? armPoints(pose, i) : legPoints(pose, i)
  const [px, py] = points[joint - 1]
  const s = outward(pose, i)
  const absolute = s * deg(Math.atan2(x - px, y - py))
  const [upper] = pose[kind][i]
  if (joint === 1) return [wrap(absolute), pose[kind][i][1]]
  const sideLeg = kind === 'legs' && pose.view === 'side'
  return [upper, wrap(sideLeg ? upper - absolute : absolute - upper)]
}

export const POSES: Record<string, Pose> = {
  stand: { view: 'side', lean: 0, arms: [[4, 12], [-4, 12]], legs: [[0, 0], [0, 0]] },
  walk: { view: 'side', lean: 2, arms: [[-22, 18], [22, 22]], legs: [[24, 20], [-18, 0]] },
  run: { view: 'side', lean: 7, arms: [[-40, 80], [40, 80]], legs: [[40, 70], [-30, 30]] },
  jump: { view: 'side', lean: 4, arms: [[150, 10], [140, 10]], legs: [[30, 80], [10, 60]] },
  'front stand': { view: 'front', lean: 0, arms: [[8, 0], [8, 0]], legs: [[2, 0], [2, 0]] },
  wave: { view: 'front', lean: 0, arms: [[130, 50], [-5, 2]], legs: [[2, 0], [2, 0]] },
  cheer: { view: 'front', lean: 0, arms: [[150, 10], [150, 10]], legs: [[8, 0], [8, 0]] },
  'hands on hips': { view: 'front', lean: 0, arms: [[35, -110], [35, -110]], legs: [[6, 0], [6, 0]] },
}

// The main Figure's wave: the left arm raised, its forearm rocking from the elbow; a slight sway.
export function wavePose(time: number): Pose {
  return {
    view: 'front',
    lean: Math.sin(time * 4.5) * 0.8,
    arms: [[129.6, 50.4 - 25.8 * Math.sin(time * 9)], [-4.6, 2.3]],
    legs: [[0, 0], [0, 0]],
  }
}
