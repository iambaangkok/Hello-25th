// The Figure: an abstract person built only from sharp rectangles, ~5 heads tall, short bob, no
// face features. Walks in side profile facing right; turns to face the screen to wave (an instant
// cut). Drawn in a 100×160 viewBox and sized by its container's height.
import { useId } from 'react'
import type { Outfit } from './outfit.ts'

// Where the player puts it: centred horizontally, this tall and this far above the bottom edge.
export const FIGURE_HEIGHT_VH = 20
export const FIGURE_BOTTOM_VH = 10

export type FigureProps = {
  outfit: Outfit
  phase: number // walk cycle angle in radians; one full turn = two steps
  gait: number // 0 stand, 1 walk, 2 light run; fractional while easing (see gait.ts)
  waving: boolean
  time: number // seconds, drives the idle breathing and the wave
}

export function Figure(props: FigureProps) {
  return props.waving ? <Front {...props} /> : <Side {...props} />
}

type Pt = [number, number]

const THIGH = 28
const SHIN = 28
const UPPER = 21
const FORE = 19

// Angles are radians from straight down; positive swings forward (+x).
const limb = (from: Pt, len: number, angle: number): Pt => [
  from[0] + len * Math.sin(angle),
  from[1] + len * Math.cos(angle),
]

// The first `frac` (0–1) of a two-segment limb a→b→c, by length.
function partOf(a: Pt, b: Pt, c: Pt, frac: number): Pt[] {
  const d1 = Math.hypot(b[0] - a[0], b[1] - a[1])
  const d2 = Math.hypot(c[0] - b[0], c[1] - b[1])
  const want = (d1 + d2) * Math.max(0, Math.min(1, frac))
  if (want <= d1) {
    const k = want / d1
    return [a, [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]]
  }
  const k = (want - d1) / d2
  return [a, b, [b[0] + (c[0] - b[0]) * k, b[1] + (c[1] - b[1]) * k]]
}

// A limb as square-capped segments: every segment reads as a rectangle, joints overlap squarely.
function Segs({ points, width, color }: { points: Pt[]; width: number; color: string }) {
  return (
    <>
      {points.slice(1).map(([x2, y2], i) => (
        <line key={i} x1={points[i][0]} y1={points[i][1]} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="square" />
      ))}
    </>
  )
}

const sleeveOf = (o: Outfit) =>
  o.outer !== 'none' || o.inner === 'blouse' || o.inner === 'longsleeve' ? 1 : o.inner === 'tshirt' ? 0.4 : 0
const sleeveColorOf = (o: Outfit, innerFill: string) => (o.outer !== 'none' ? o.outerColor : innerFill)
// Short bob hangs to y 33 (just past halfway); chin-length bob to y 37.
const hairEndOf = (o: Outfit) => (o.hairStyle === 'shortbob' ? 33 : 37)
const coatEndOf = (o: Outfit) => (o.outer === 'coat' ? 128 : o.outer === 'cardigan' ? 100 : 94)
const skirtEndOf = (o: Outfit) => 98 + o.length * 44

// Horizontal stripes for a two-colour inner, in user space so sleeves stay level too.
function useInnerFill(o: Outfit) {
  const id = useId().replace(/:/g, '')
  const defs = (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width={4} height={6}>
        <rect width={4} height={3} fill={o.innerColor} />
        <rect y={3} width={4} height={3} fill={o.innerColor2} />
      </pattern>
    </defs>
  )
  return { defs, fill: o.striped ? `url(#${id})` : o.innerColor }
}

function Shoe({ x, y, o, w }: { x: number; y: number; o: Outfit; w: number }) {
  if (o.shoes === 'slipper') return <rect x={x} y={y + 1} width={w} height={2.5} fill={o.shoeColor} />
  if (o.shoes === 'slipper2')
    return (
      <>
        <rect x={x} y={y + 1.5} width={w} height={2} fill={o.shoeColor2} />
        <rect x={x + w * 0.3} y={y - 1.5} width={w * 0.6} height={3} fill={o.shoeColor} />
      </>
    )
  return (
    <>
      <rect x={x} y={y - 4} width={w} height={6} fill={o.shoeColor} />
      <rect x={x} y={y + 1.5} width={w} height={2.5} fill={o.shoeColor2} />
    </>
  )
}

function Arm({ points, o, innerFill }: { points: Pt[]; o: Outfit; innerFill: string }) {
  const sleeve = sleeveOf(o)
  return (
    <g>
      <Segs points={points} width={6} color={o.skin} />
      {sleeve > 0 && (
        <Segs points={partOf(points[0], points[1], points[2], sleeve * 0.92)} width={8} color={sleeveColorOf(o, innerFill)} />
      )}
    </g>
  )
}

function Side({ outfit: o, phase, gait, time }: FigureProps) {
  const HIP: Pt = [50, 92]
  const SHOULDER: Pt = [50, 46]
  // Stand → walk scales the stride up from nothing; walk → run blends walk values into run values.
  const walkAmt = Math.min(1, Math.max(0, gait))
  const runAmt = Math.min(1, Math.max(0, gait - 1))
  const mix = (walk: number, run: number) => walk + (run - walk) * runAmt
  const swing = mix(0.45, 0.75) * walkAmt
  const kneeMax = mix(0.7, 1.5) * walkAmt
  // Standing still: a slow breathing bob instead of the step bob.
  const bob = -mix(1.5, 4) * walkAmt * Math.abs(Math.sin(phase)) + (1 - walkAmt) * 0.6 * Math.sin(time * 2.4)
  const lean = mix(0.03, 0.12) * walkAmt

  const leg = (p: number) => {
    const thigh = swing * Math.sin(p)
    const knee = kneeMax * Math.max(0, Math.cos(p))
    const k = limb(HIP, THIGH, thigh)
    return { k, f: limb(k, SHIN, thigh - knee), footAngle: (thigh - knee) * 0.4 }
  }
  const arm = (p: number): Pt[] => {
    const upper = -swing * 0.9 * Math.sin(p)
    const elbow = mix(0.15 + (0.1 + 0.2 * Math.max(0, -Math.sin(p))) * walkAmt, 1.4)
    const e = limb(SHOULDER, UPPER, upper)
    return [SHOULDER, e, limb(e, FORE, upper + elbow)]
  }

  const dress = o.inner === 'dress'
  const { defs, fill: innerFill } = useInnerFill(o)
  const torsoTop = o.inner === 'strap' ? 47 : 43
  const coatEnd = coatEndOf(o)
  const skirtEnd = skirtEndOf(o)

  const drawLeg = (l: ReturnType<typeof leg>) => (
    <g>
      <Segs points={[HIP, l.k, l.f]} width={7} color={o.skin} />
      {!dress && <Segs points={partOf(HIP, l.k, l.f, 0.3 + o.length * 0.7)} width={9 + o.width * 9} color={o.bottomColor} />}
      <g transform={`translate(${l.f[0]} ${l.f[1] + 3}) rotate(${(-l.footAngle * 180) / Math.PI})`}>
        <Shoe x={-5} y={0} o={o} w={15} />
      </g>
    </g>
  )

  return (
    <svg viewBox="0 0 100 160" className="h-full w-auto overflow-visible" shapeRendering="crispEdges">
      {defs}
      <g transform={`translate(0 ${bob}) rotate(${(lean * 180) / Math.PI} 50 92)`}>
        <Arm points={arm(phase + Math.PI)} o={o} innerFill={innerFill} />
        {drawLeg(leg(phase + Math.PI))}
        {drawLeg(leg(phase))}
        {/* torso */}
        <rect x={40} y={40} width={20} height={10} fill={o.skin} />
        <rect x={39} y={torsoTop} width={22} height={94 - torsoTop} fill={innerFill} />
        {o.inner === 'blouse' && <rect x={53} y={42} width={7} height={4} fill="#fff" opacity={0.8} />}
        {dress && <rect x={38 - o.width * 6} y={82} width={24 + o.width * 12} height={skirtEnd - 82} fill={innerFill} />}
        {!dress && <rect x={39} y={84} width={22} height={10} fill={o.bottomColor} />}
        {o.outer !== 'none' && (
          <rect x={o.outer === 'coat' ? 36 : 38} y={42} width={o.outer === 'coat' ? 21 : 18} height={coatEnd - 42} fill={o.outerColor} />
        )}
        {o.bag && (
          <>
            <Segs points={[[44, 45], [36, 84]]} width={2} color={o.bagColor} />
            <rect x={28} y={84} width={14} height={12} fill={o.bagColor} />
          </>
        )}
        <Arm points={arm(phase)} o={o} innerFill={innerFill} />
        {/* head: neck, face, then the bob — crown + fringe in front, back hanging toward the jaw */}
        <rect x={46} y={32} width={8} height={10} fill={o.skin} />
        <rect x={45} y={16} width={15} height={18} fill={o.skin} />
        <rect x={40} y={11} width={21} height={8} fill={o.hair} />
        <rect x={52} y={11} width={9} height={11} fill={o.hair} />
        <rect x={40} y={11} width={10} height={hairEndOf(o) - 11} fill={o.hair} />
      </g>
    </svg>
  )
}

function Front({ outfit: o, time }: FigureProps) {
  const dress = o.inner === 'dress'
  const { defs, fill: innerFill } = useInnerFill(o)
  const torsoTop = o.inner === 'strap' ? 47 : 43
  const coatEnd = coatEndOf(o)
  const skirtEnd = skirtEndOf(o)
  const sway = Math.sin(time * 4.5) * 0.8

  // Waving arm (viewer's left): upper arm raised out to the side, forearm rocking from the elbow.
  const shoulderL: Pt = [37, 46]
  const elbowL = limb(shoulderL, UPPER, -Math.PI * 0.72)
  const wave: Pt[] = [shoulderL, elbowL, limb(elbowL, FORE, Math.PI + 0.45 * Math.sin(time * 9))]
  const shoulderR: Pt = [63, 46]
  const elbowR = limb(shoulderR, UPPER, -0.08)
  const hang: Pt[] = [shoulderR, elbowR, limb(elbowR, FORE, -0.04)]

  const pantW = 9 + o.width * 6
  const pantLen = 6 + (0.3 + o.length * 0.7) * 52

  return (
    <svg viewBox="0 0 100 160" className="h-full w-auto overflow-visible" shapeRendering="crispEdges">
      {defs}
      <g transform={`rotate(${sway} 50 150)`}>
        {[44, 56].map((cx) => (
          <g key={cx}>
            <rect x={cx - 3.5} y={90} width={7} height={57} fill={o.skin} />
            {!dress && <rect x={cx - pantW / 2} y={88} width={pantW} height={pantLen} fill={o.bottomColor} />}
            <Shoe x={cx - 5} y={148} o={o} w={10} />
          </g>
        ))}
        <Arm points={hang} o={o} innerFill={innerFill} />
        {/* torso */}
        <rect x={38} y={40} width={24} height={10} fill={o.skin} />
        <rect x={37} y={torsoTop} width={26} height={94 - torsoTop} fill={innerFill} />
        {o.inner === 'strap' && (
          <>
            <rect x={41} y={40} width={2} height={8} fill={innerFill} />
            <rect x={57} y={40} width={2} height={8} fill={innerFill} />
          </>
        )}
        {o.inner === 'blouse' && <rect x={45} y={42} width={10} height={4} fill="#fff" opacity={0.8} />}
        {dress && <rect x={35 - o.width * 6} y={82} width={30 + o.width * 12} height={skirtEnd - 82} fill={innerFill} />}
        {!dress && <rect x={37} y={84} width={26} height={10} fill={o.bottomColor} />}
        {o.outer !== 'none' && (
          <>
            <rect x={o.outer === 'coat' ? 34 : 36} y={42} width={o.outer === 'coat' ? 13 : 11} height={coatEnd - 42} fill={o.outerColor} />
            <rect x={53} y={42} width={o.outer === 'coat' ? 13 : 11} height={coatEnd - 42} fill={o.outerColor} />
          </>
        )}
        {o.bag && (
          <>
            <Segs points={[[41, 44], [66, 86]]} width={2} color={o.bagColor} />
            <rect x={62} y={84} width={14} height={12} fill={o.bagColor} />
          </>
        )}
        {/* head: neck, face, the bob — crown with a straight fringe, sides hanging toward the jaw */}
        <rect x={46} y={32} width={8} height={10} fill={o.skin} />
        <rect x={42} y={16} width={16} height={18} fill={o.skin} />
        <rect x={39} y={11} width={22} height={11} fill={o.hair} />
        <rect x={39} y={11} width={5} height={hairEndOf(o) - 11} fill={o.hair} />
        <rect x={56} y={11} width={5} height={hairEndOf(o) - 11} fill={o.hair} />
        <Arm points={wave} o={o} innerFill={innerFill} />
      </g>
    </svg>
  )
}
