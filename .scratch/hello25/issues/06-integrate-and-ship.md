# Integrate the real Timing, Wardrobe and Figure, and ship

Type: task
Status: closed
Blocked by: 02, 04, 05

## Question

Wire the committed Timing JSON, Wardrobe + gait keyframes and Figure renderer into the player, deploy to
https://www.iambaangkok.dev/hello25/, and do a full watch-through with the human in desktop
fullscreen (plus a phone sanity check). Resolved when the human signs off on the live MV.

## Resolution

**Shipped.** The integration happened while building the player: it reads the committed
`timing.json`, `wardrobe.json`, `crowd.json` and `glass.json` and draws the Figure from
`src/Figure.tsx`. Live at https://www.iambaangkok.dev/hello25/ (pushed `b3aa9a3`); the human
watched it through on the live site and signed off. A phone check wasn't reported separately.
