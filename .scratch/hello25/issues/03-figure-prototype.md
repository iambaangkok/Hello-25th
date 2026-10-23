# Prototype the Figure and its walk cycle

Type: prototype
Status: closed
Assignee: iambaangkok
Blocked by: 01

## Question

How should the Figure look and move? Rough, reactable prototype of a small simple-shapes person
(short hair) walking in place, wearing a sample Outfit drawn from the CONTEXT.md option set
(inner incl. dress, outer, bottom with length/width, shoes, bag). Settle proportions, walk vs light
run, gait speed, a **wave** at the screen (the closing pose — see CONTEXT.md **Wave**), and the rendering approach (SVG vs Canvas) the player will reuse. Link the
prototype as an asset.

## Resolution

**Rectangles, side walk, front wave** (variant A of three; B front-facing chibi SVG and C pixel
Canvas sprite lost). Real renderer: `src/Figure.tsx` (`<Figure outfit phase gait waving time />`),
with `src/outfit.ts` (Outfit type, options, draft `DEFAULT_OUTFIT`) and `src/gait.ts`.
Prototype (all three variants + control panel): branch `prototype/figure`, `figure-prototype.html`.

- **Look:** abstract, built only from sharp rectangles (no rounded corners), ~5 heads tall, no face
  features. Short **bob** (chin length) or **shortbob** (a little shorter, ends just above the jaw).
- **Rendering:** SVG, 100×160 viewBox, sized by its container's height.
- **Placement:** 20vh tall, 10vh above the bottom edge, centred horizontally.
- **Outfit options added:** `longsleeve` inner; `striped` inner (horizontal stripes of
  `innerColor` + `innerColor2`, also on sleeves and dress); `hairStyle` bob / shortbob.
- **Gait:** **stand** (still, slow breathing bob — the song starts here), **walk** 80 steps/min,
  **light run** 140 steps/min (both on the song's beat), side profile facing right. Switching gait
  eases stride and step rate over ~0.8 s (per keyframe). The shown gait is a number: 0 stand,
  1 walk, 2 run, fractional mid-ease.
- **Wave:** the Figure faces the screen, raises one arm and rocks the forearm, slight sway. The
  turn from side to front is an instant cut for now.
- **Surfaced:** gait changes are keyframes — often on a Month marker (tied to it) but also free at
  any time; Outfit and background change only at Month markers. All of it is edited in the timing
  tool → rewrote the Wardrobe picker ticket as
  [Edit the Month keyframes and gait keyframes in the timing tool](04-wardrobe-picker.md).
