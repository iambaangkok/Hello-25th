# Build the player

Type: task
Status: open
Blocked by: 01

## Question

Build the MV page against `src/data/timing.json` and `src/data/wardrobe.json` (draft Wardrobe; the
Figure's gait + phase come from `gaitTrack` in `src/wardrobe.ts`): Start screen → tap plays + fullscreen; tap pauses/resumes; three-Tier Lines synced to
audio time; `♪` breaks; per-Month background; the Figure (`src/Figure.tsx`, 20vh tall, 10vh up) driven by gait keyframes (stand → walk / light run, eased; `src/gait.ts`); Timeline with Verse and
Month Dots that seek; the closing Rapid change and Wave (CONTEXT.md) driven by the `rapid` / `wave`
marks; End screen with tap-to-replay; no scrollbars/borders; `noindex`. Pick a heavy,
thick bold font for all text (e.g. Noto Sans JP at 800–900; no text selectable) and propose transitions; the human reviews on the deployed URL.
