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
  - Figure small, centred horizontally, near the bottom; Outfit and background change per Month.
  - Start screen "Thank you 24th..." + play icon. End screen "Hello 25th!" on October; tap replays.
  - Closing (see CONTEXT.md **Rapid change** / **Wave**): from October's start the Outfits and colours
    flick through, accelerating to fastest at the `rapid` mark, then decelerating to land on October
    ~1 s before the `wave` mark; the Figure walks that last second, then stops and waves until the
    audio ends.
  - Unlisted: not linked anywhere, `noindex`. No password.
  - No text is selectable (`user-select: none` globally). Lyrics and screen text use a big, heavy,
    thick bold font.
- Skills: `/prototype` for the Figure ticket; `/grilling` when a decision is unclear.

## Decisions so far

<!-- one line per resolved ticket: [title](issues/NN-slug.md) — gist -->

- [Scaffold the hello25 app and its deploy path](issues/01-scaffold-and-deploy.md) — live; push to `master` deploys via Cloudflare Git integration.
- [Record the Timing with a tap-along timing tool](issues/02-timing-tool.md) — `src/data/timing.json` committed (35 Lines, 12 Months, `rapid`, `wave`); re-record via `/hello25/timing.html` in dev.

## Not yet specified

- **Transitions** — how a Month change looks (hard cut vs colour fade) and how Lines enter/leave
  (fade, duration, overlap). Likely settled while reviewing the built player.
- **Figure pacing** — whether walk speed follows the song's tempo, and what the Figure does on the
  Start and End screens and during Instrumental breaks.
- **Typography** — which heavy Japanese/Latin font (must be thick/bold — see Notes) and exact sizes;
  likely chosen in the player build, then tuned by eye.
- **Portrait/mobile tuning** — sizing of Tiers and Figure on a narrow screen.
- **Timeline visibility** — always shown vs appearing on mouse move during playback.
- **Rapid change tuning** — the flick order (cycle the Months in order? shuffle?), the slowest and
  fastest flick rates and the easing curve, and whether colours cut or blend. The waving pose
  itself belongs with the Figure prototype.

## Out of scope

- **Video export** of the MV — wanted later; for now a screen recording does the job. A future effort.
- **Access control** (password / Cloudflare Access) — ruled out: unlisted is enough, friction for her.
