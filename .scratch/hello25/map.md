# Map: hello25 — birthday MV for "Hello" (Furui Riho)

Label: wayfinder:map

## Destination

The MV is live and playable at **https://www.iambaangkok.dev/hello25/** by **25 Oct 2026** (her 25th
birthday), streamed from a desktop in true fullscreen.

## Notes

- **Execution is in scope** (overrides wayfinder's plan-only default): tickets build and ship, not
  just decide. Hard deadline — prefer the smallest thing that works; polish later.
- Domain language: [CONTEXT.md](../../CONTEXT.md). Read it first.
- Hosting mirrors `../interlocking-problem` (block-grid-editor): pnpm, Vite, React, TypeScript,
  Tailwind; static build served by a Cloudflare Worker with Static Assets (assets-only) on route
  `www.iambaangkok.dev/hello25*`, so Vite `base` = `/hello25/` and build → `dist/hello25/`.
- Audio: `assets/hello.m4a` (AAC 160k, 227.6 s, extracted losslessly from the MP4).
- Lyrics: `assets/lyrics.md`, `lyrics-romanji.md`, `lyrics-en-translation.md` — 44 lines each,
  line-aligned; romaji/English typos already fixed.
- Settled while charting (no ticket):
  - Tap/click starts and stops; the first tap also enters fullscreen. No borders/scrollbars/chrome.
    Phones need only look right, not true fullscreen.
  - One Line at a time, three Tiers centred (Japanese / **Romaji** / English — see CONTEXT.md).
    `♪` Lines show a note symbol. Empty English stays blank.
  - Verse = blank-line block. Timeline = thin white line + white Dots at Verse and Month starts.
  - 12 Months, November → October; Month starts are hand-marked, not an even split.
  - Figure: sharp-rectangle abstract person, 20vh tall, 10vh up, centred; walks side-on, turns to
    face the screen to wave. Outfit and background change per Month; gait (stand / walk / light run)
    changes at gait keyframes, on Month markers or free.
  - Start screen "Thank you 24th..." + play icon. End screen "Hello 25th!" on October; tap replays.
  - Closing (see CONTEXT.md **Rapid change** / **Wave**): from October's start the Outfits and colours
    flick through, accelerating to fastest at the `rapid` mark, then decelerating to land on October
    ~1 s before the `wave` mark; the Figure walks that last second, then stops and waves until the
    audio ends.
  - Unlisted: not linked anywhere, `noindex`. No password.
  - No text is selectable (`user-select: none` globally). Lyrics and screen text use a big, heavy,
    thick bold font.
- Skills: `/grilling` when a decision is unclear.

## Decisions so far

<!-- one line per resolved ticket: [title](issues/NN-slug.md) — gist -->

- [Scaffold the hello25 app and its deploy path](issues/01-scaffold-and-deploy.md) — live; push to `master` deploys via Cloudflare Git integration.
- [Record the Timing with a tap-along timing tool](issues/02-timing-tool.md) — `src/data/timing.json` committed (35 Lines, 12 Months, `rapid`, `wave`); re-record via `/hello25/timing.html` in dev.
- [Prototype the Figure and its walk cycle](issues/03-figure-prototype.md) — sharp-rectangle SVG Figure in `src/Figure.tsx`; stand / walk 80 / light run 140 steps/min, eased; front-facing wave; gait + Outfit keyframes go into the timing tool.
- [Edit the Month keyframes and gait keyframes in the timing tool](issues/04-wardrobe-picker.md) — `src/data/wardrobe.json` committed (12 Months + gait keyframes, version 2); the Figure gained ponytail / pigtails, turtleneck, vest, puffer, scarf, bag types, bucket hat / cap; `gaitTrack` in `src/wardrobe.ts` drives the player.
- [Pose the ending's crowd](issues/07-ending-crowd.md) — 11 posed copies in `src/data/crowd.json`, fading in with "Hello 25th!" at the `hello` mark; edited in `/hello25/crowd.html` (Figure takes an explicit `pose`).
- [Build the player](issues/05-player.md) — live MV: blank start + intro, Lines in a right-of-centre corridor, glass painting backgrounds, beat-locked Rapid change, run → turn → Wave, "Hello 25th!" with the crowd, seekable Timeline, fullscreen button; settled the transitions, typography (Noto Sans + Noto Sans JP), Timeline visibility and Rapid change tuning.
- [Integrate the real Timing, Wardrobe and Figure, and ship](issues/06-integrate-and-ship.md) — shipped and signed off after a live watch-through.

## Not yet specified

Nothing — the destination is reached. Follow-up after it: video export (`pnpm export`, desktop 1080p and
9:16 reel) is built but looks soft — [Make the exported video as crisp as the web version](issues/08-export-crispness.md).

## Out of scope

- **Access control** (password / Cloudflare Access) — ruled out: unlisted is enough, friction for her.
