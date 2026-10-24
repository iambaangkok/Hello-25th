// The Figure: an abstract person built only from sharp rectangles, ~5 heads tall, short hair, no
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

// A vest has no sleeves, so the inner's sleeves show through it.
const sleevedOuter = (o: Outfit) => o.outer !== 'none' && o.outer !== 'vest'
const sleeveOf = (o: Outfit) =>
  sleevedOuter(o) || o.inner === 'blouse' || o.inner === 'longsleeve' || o.inner === 'turtleneck'
    ? 1
    : o.inner === 'tshirt'
      ? 0.4
      : 0
const sleeveColorOf = (o: Outfit, innerFill: string) => (sleevedOuter(o) ? o.outerColor : innerFill)
// Short bob hangs to y 33 (just past halfway); chin-length bob to y 37.
const hairEndOf = (o: Outfit) => (o.hairStyle === 'shortbob' ? 33 : 37)
// Where the inner starts: sleeved inners cover the shoulders; only the strap top, tank and
// (sleeveless) dress leave them bare.
const torsoTopOf = (o: Outfit) => (o.inner === 'strap' ? 47 : o.inner === 'tank' || o.inner === 'dress' ? 44 : 40)
const COAT_END: Record<Outfit['outer'], number> = { none: 0, jacket: 94, cardigan: 100, coat: 128, vest: 90, puffer: 102 }
const coatEndOf = (o: Outfit) => COAT_END[o.outer]
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

// A puffer's quilting: thin dark seams across a panel.
function Quilt({ x, y, width, end }: { x: number; y: number; width: number; end: number }) {
  const seams = []
  for (let sy = y + 8; sy < end - 3; sy += 8) seams.push(<rect key={sy} x={x} y={sy} width={width} height={1.2} fill="#000" opacity={0.18} />)
  return <>{seams}</>
}

// What sits on the neck, drawn over it: turtleneck collar, puffer collar, then the scarf wrap.
function Neckwear({ o, x, width, innerFill, tailX }: { o: Outfit; x: number; width: number; innerFill: string; tailX: number }) {
  return (
    <>
      {o.inner === 'turtleneck' && <rect x={x + 1} y={35} width={width - 2} height={9} fill={innerFill} />}
      {o.outer === 'puffer' && <rect x={x} y={37} width={width} height={6} fill={o.outerColor} />}
      {o.scarf && (
        <>
          <rect x={x - 1} y={36} width={width + 2} height={7} fill={o.scarfColor} />
          <rect x={tailX} y={42} width={5} height={18} fill={o.scarfColor} />
          <rect x={tailX} y={57} width={5} height={1.5} fill="#000" opacity={0.2} />
        </>
      )}
    </>
  )
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
        <Segs
          points={partOf(points[0], points[1], points[2], sleeve * 0.92)}
          width={o.outer === 'puffer' ? 11 : 8}
          color={sleeveColorOf(o, innerFill)}
        />
      )}
    </g>
  )
}

// Side-view hair, facing right: crown + fringe in front, the back by style. `swing` (degrees) sways
// a ponytail or pigtail with the steps.
function SideHair({ o, swing }: { o: Outfit; swing: number }) {
  const h = o.hair
  if (o.hairStyle === 'ponytail')
    return (
      <>
        {/* short tail gathered low at the nape */}
        <g transform={`rotate(${swing} 40 28)`}>
          <rect x={35} y={25} width={7} height={6} fill={h} />
          <rect x={34} y={29} width={6} height={9} fill={h} />
        </g>
        <rect x={40} y={11} width={21} height={8} fill={h} />
        <rect x={55} y={11} width={6} height={9} fill={h} />
        <rect x={40} y={11} width={9} height={19} fill={h} />
        {/* side bang: a long strand down the side of the face */}
        <rect x={50} y={15} width={4} height={20} fill={h} />
      </>
    )
  if (o.hairStyle === 'pigtails')
    return (
      <>
        <g transform={`rotate(${swing} 43 24)`}>
          <rect x={37} y={22} width={8} height={11} fill={h} />
        </g>
        <rect x={40} y={11} width={21} height={8} fill={h} />
        <rect x={52} y={11} width={9} height={11} fill={h} />
        <rect x={40} y={11} width={10} height={16} fill={h} />
      </>
    )
  return (
    <>
      <rect x={40} y={11} width={21} height={8} fill={h} />
      <rect x={52} y={11} width={9} height={11} fill={h} />
      <rect x={40} y={11} width={10} height={hairEndOf(o) - 11} fill={h} />
    </>
  )
}

// Front-view hair: the bob's straight fringe and sides, or the shorter tied styles.
function FrontHair({ o }: { o: Outfit }) {
  const h = o.hair
  if (o.hairStyle === 'ponytail')
    return (
      <>
        {/* the low tail peeks out behind one side, below the ear */}
        <rect x={59} y={26} width={5} height={9} fill={h} />
        <rect x={39} y={11} width={22} height={7} fill={h} />
        {/* side-swept fringe, then the side bangs framing the face */}
        <rect x={39} y={11} width={14} height={10} fill={h} />
        <rect x={40} y={14} width={4} height={21} fill={h} />
        <rect x={56} y={14} width={4} height={21} fill={h} />
      </>
    )
  if (o.hairStyle === 'pigtails')
    return (
      <>
        <rect x={39} y={11} width={22} height={11} fill={h} />
        <rect x={39} y={11} width={4} height={15} fill={h} />
        <rect x={57} y={11} width={4} height={15} fill={h} />
        {/* two short tufts low at the sides */}
        <rect x={32} y={22} width={8} height={10} fill={h} />
        <rect x={60} y={22} width={8} height={10} fill={h} />
      </>
    )
  return (
    <>
      <rect x={39} y={11} width={22} height={11} fill={h} />
      <rect x={39} y={11} width={5} height={hairEndOf(o) - 11} fill={h} />
      <rect x={56} y={11} width={5} height={hairEndOf(o) - 11} fill={h} />
    </>
  )
}

// Hats sit over the hair, plain rectangles like the rest of her. Side view faces right, so the
// cap's peak points forward (+x); from the front the peak is a darker band across the brow.
function Hat({ o, front }: { o: Outfit; front: boolean }) {
  const c = o.hatColor
  // Left edge of the bucket hat's crown: centred on the head in each view.
  const x = front ? 39 : 40
  if (o.hat === 'bucket')
    return (
      <>
        {/* low flat-topped crown with a band; the brim's flat middle, then each side tilted down */}
        <rect x={x} y={6} width={22} height={11} fill={c} />
        {o.hatDots &&
          [[3, 7.5], [10, 7.5], [17, 7.5], [6.5, 10.5], [13.5, 10.5]].map(([dx, y]) => (
            <rect key={`${dx},${y}`} x={x + dx} y={y} width={2.5} height={2.5} fill={o.hatDotColor} />
          ))}
        <rect x={x} y={13} width={22} height={2.5} fill="#000" opacity={0.15} />
        <rect x={x} y={15} width={22} height={3} fill={c} />
        <rect x={x - 6} y={15} width={7} height={3} fill={c} transform={`rotate(-28 ${x + 1} 15)`} />
        <rect x={x + 21} y={15} width={7} height={3} fill={c} transform={`rotate(28 ${x + 21} 15)`} />
      </>
    )
  if (o.hat === 'cap')
    return front ? (
      <>
        <rect x={39} y={6} width={22} height={9} fill={c} />
        <rect x={38} y={9} width={24} height={6} fill={c} />
        <rect x={40} y={14} width={20} height={4} fill={c} />
        <rect x={40} y={14} width={20} height={4} fill="#000" opacity={0.18} />
      </>
    ) : (
      <>
        <rect x={40} y={7} width={20} height={9} fill={c} />
        <rect x={39} y={10} width={22} height={6} fill={c} />
        <rect x={58} y={14} width={11} height={3} fill={c} />
      </>
    )
  return null
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
  const torsoTop = torsoTopOf(o)
  const coatEnd = coatEndOf(o)
  const skirtEnd = skirtEndOf(o)

  const drawLeg = (l: ReturnType<typeof leg>) => (
    <g>
      <Segs points={[HIP, l.k, l.f]} width={7} color={o.skin} />
      {/* length 0 leaves only the band at the hip: bikini-short */}
      {!dress && o.length > 0.02 && (
        <Segs points={partOf(HIP, l.k, l.f, o.length)} width={9 + o.width * 9} color={o.bottomColor} />
      )}
      <g transform={`translate(${l.f[0]} ${l.f[1] + 3}) rotate(${(-l.footAngle * 180) / Math.PI})`}>
        <Shoe x={-5} y={0} o={o} w={15} />
      </g>
    </g>
  )

  return (
    <svg viewBox="0 0 100 160" className="h-full w-auto overflow-visible" shapeRendering="geometricPrecision">
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
        {o.outer === 'puffer' ? (
          <>
            <rect x={35} y={40} width={27} height={coatEnd - 40} fill={o.outerColor} />
            <Quilt x={35} y={40} width={27} end={coatEnd} />
          </>
        ) : o.outer === 'vest' ? (
          <rect x={38} y={43} width={17} height={coatEnd - 43} fill={o.outerColor} />
        ) : (
          o.outer !== 'none' && (
            <rect x={o.outer === 'coat' ? 36 : 38} y={40} width={o.outer === 'coat' ? 21 : 18} height={coatEnd - 40} fill={o.outerColor} />
          )
        )}
        {o.bag === 'side' && (
          <>
            <Segs points={[[44, 45], [36, 84]]} width={2} color={o.bagColor} />
            <rect x={28} y={84} width={14} height={12} fill={o.bagColor} />
          </>
        )}
        {o.bag === 'bigside' && (
          <>
            <Segs points={[[45, 45], [34, 82]]} width={3.5} color={o.bagColor} />
            <rect x={24} y={82} width={19} height={16} fill={o.bagColor} />
            <rect x={24} y={82} width={19} height={4} fill="#000" opacity={0.15} />
          </>
        )}
        {o.bag === 'backpack' && (
          <>
            {/* pack on the back, flap darker; the near strap runs down over the shoulder */}
            <rect x={27} y={45} width={13} height={33} fill={o.bagColor} />
            <rect x={27} y={45} width={13} height={9} fill="#000" opacity={0.15} />
            <rect x={29} y={64} width={9} height={10} fill="#000" opacity={0.1} />
            <rect x={43} y={41} width={4} height={30} fill={o.bagColor} />
          </>
        )}
        <Arm points={arm(phase)} o={o} innerFill={innerFill} />
        {/* head: neck, what's on it, face, then the hair */}
        <rect x={46} y={32} width={8} height={10} fill={o.skin} />
        <Neckwear o={o} x={44} width={12} innerFill={innerFill} tailX={53} />
        <rect x={45} y={16} width={15} height={18} fill={o.skin} />
        {/* tails bounce twice a cycle and trail further back the faster she goes */}
        <SideHair o={o} swing={8 * walkAmt * Math.sin(phase * 2) + 120 * lean} />
        <Hat o={o} front={false} />
      </g>
    </svg>
  )
}

function Front({ outfit: o, time }: FigureProps) {
  const dress = o.inner === 'dress'
  const { defs, fill: innerFill } = useInnerFill(o)
  const torsoTop = torsoTopOf(o)
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
  const pantLen = 6 + o.length * 52

  return (
    <svg viewBox="0 0 100 160" className="h-full w-auto overflow-visible" shapeRendering="geometricPrecision">
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
        {(o.inner === 'tank' || o.inner === 'dress') && (
          <>
            <rect x={40} y={40} width={5} height={5} fill={innerFill} />
            <rect x={55} y={40} width={5} height={5} fill={innerFill} />
          </>
        )}
        {o.inner === 'blouse' && <rect x={45} y={42} width={10} height={4} fill="#fff" opacity={0.8} />}
        {dress && <rect x={35 - o.width * 6} y={82} width={30 + o.width * 12} height={skirtEnd - 82} fill={innerFill} />}
        {!dress && <rect x={37} y={84} width={26} height={10} fill={o.bottomColor} />}
        {o.outer === 'puffer' ? (
          <>
            <rect x={34} y={40} width={32} height={coatEnd - 40} fill={o.outerColor} />
            <Quilt x={34} y={40} width={32} end={coatEnd} />
            <rect x={49.5} y={42} width={1} height={coatEnd - 42} fill="#000" opacity={0.25} />
          </>
        ) : o.outer === 'vest' ? (
          <>
            <rect x={37} y={43} width={10} height={coatEnd - 43} fill={o.outerColor} />
            <rect x={53} y={43} width={10} height={coatEnd - 43} fill={o.outerColor} />
          </>
        ) : (
          o.outer !== 'none' && (
            <>
              <rect x={o.outer === 'coat' ? 34 : 36} y={40} width={o.outer === 'coat' ? 13 : 11} height={coatEnd - 40} fill={o.outerColor} />
              <rect x={53} y={40} width={o.outer === 'coat' ? 13 : 11} height={coatEnd - 40} fill={o.outerColor} />
            </>
          )
        )}
        {o.bag === 'side' && (
          <>
            <Segs points={[[41, 44], [66, 86]]} width={2} color={o.bagColor} />
            <rect x={62} y={84} width={14} height={12} fill={o.bagColor} />
          </>
        )}
        {o.bag === 'bigside' && (
          <>
            <Segs points={[[41, 44], [68, 84]]} width={3.5} color={o.bagColor} />
            <rect x={62} y={82} width={19} height={16} fill={o.bagColor} />
            <rect x={62} y={82} width={19} height={4} fill="#000" opacity={0.15} />
          </>
        )}
        {o.bag === 'backpack' && (
          <>
            {/* from the front only the two shoulder straps show */}
            <rect x={41} y={41} width={4} height={30} fill={o.bagColor} />
            <rect x={55} y={41} width={4} height={30} fill={o.bagColor} />
          </>
        )}
        {/* head: neck, what's on it, face, then the hair */}
        <rect x={46} y={32} width={8} height={10} fill={o.skin} />
        <Neckwear o={o} x={43} width={14} innerFill={innerFill} tailX={51} />
        <rect x={42} y={16} width={16} height={18} fill={o.skin} />
        <FrontHair o={o} />
        <Hat o={o} front />
        <Arm points={wave} o={o} innerFill={innerFill} />
      </g>
    </svg>
  )
}
