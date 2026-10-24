# Build the player

Type: task
Status: open
Assignee: iambaangkok
Blocked by: 01

## Question

Build the MV page against `src/data/timing.json` and `src/data/wardrobe.json` (draft Wardrobe; the
Figure's gait + phase come from `gaitTrack` in `src/wardrobe.ts`): Start screen → tap plays + fullscreen; tap pauses/resumes; three-Tier Lines synced to
audio time; `♪` breaks; per-Month background; the Figure (`src/Figure.tsx`, 20vh tall, 10vh up) driven by gait keyframes (stand → walk / light run, eased; `src/gait.ts`); Timeline with Verse and
Month Dots that seek; the closing Rapid change and Wave (CONTEXT.md) driven by the `rapid` / `wave`
marks; End screen with tap-to-replay; no scrollbars/borders; `noindex`. Pick a heavy,
thick bold font for all text (e.g. Noto Sans JP at 800–900; no text selectable) and propose transitions; the human reviews on the deployed URL.

## Progress

Built, awaiting the human's review: `src/Player.tsx` (page) + `src/mv.ts` (pure: Line / Month at a
time, Rapid change, Timeline Dots), reading `src/data/timing.json` + `wardrobe.json`. Checked in
headless Chromium at 1600×900 and 390×844 (start, Lines, Months, run, Rapid change, Wave, End).

Proposals for the fog, to settle on review:
- **Transitions** — Lines fade up over 0.25 s (no fade out); Month background fades 0.4 s in OKLab,
  computed from the song time (no CSS transition — that could restart/reverse mid-fade, the likely
  flicker); cuts during the Rapid change; Outfit changes are cuts.
- **Opening** (human's call) — blank November colour; the first tap goes fullscreen, a small
  "Thank you 24th..." (reading size) fades in, holds, fades out (4.4 s), then the scene fades in
  over 1.2 s as the song starts. The tap also does a muted play/pause to unlock the audio.
- **End screen** — Figure keeps waving in October's Outfit (October colour) under "Hello 25th!".
- **Typography** — Noto Sans JP 900 (Google Fonts, `display=block`); Romaji `min(6.8vw, 8vh)`,
  Japanese / English `min(5.4vw, 6.2vh)`, English at 70 % opacity; soft text shadow for light colours.
- **Timeline** — press or drag anywhere to seek; a press on a Dot snaps to it. Always shown while
  paused; while playing, shown on pointer move and hidden (with the cursor) 2.5 s after. Month Dots
  larger than Verse Dots; hover shows the name; the played part of the line is brighter.
- **Rapid change** (human's call) — cycles the Months in order from October, 2 → 14 flicks/s
  (smoothstep) up to `rapid` (end of "Tobidashite ne!"), then one Month per beat, landing on
  October on the beat nearest 1 s before `wave`. Beat grid measured from the audio: 154 BPM, first
  beat 0.146 s (`BPM` / `FIRST_BEAT` in `src/timing.ts`).
- **Lyrics** sit a little above the vertical centre (top 14vh → above the Figure).
- Space / Enter also play / pause.
- **Lyrics** (human's call) — 80 % of the earlier sizes, aligned left at the Timeline's start (8vw).
- **Step rates** (human's call) — on the beat: light run 154 steps/min, walk 77 (half).
- **Suggested colours** — `src/data/wardrobe-suggested.json`, previewed at
  `/hello25/timing-suggested.html` (own draft; "Save to repo" adopts it). Story backgrounds per Month
  plus one film grade (lifted blacks, cream whites, −18 % chroma, teal shadows, warm highlights) over
  every clothing and background colour; garments, skin and hair untouched.
- **Lyrics corridor** (human's call) — left-aligned inside a column shifted 6vw right of centre (left `max(5vw, 66vw − 60vh)`, right `max(5vw, 54vw − 60vh)`
  in from each side), wrapping at its right edge; Japanese / English at 70 % (`min(3vw, 3.5vh)`,
  13 px floor).
- **Font loading** — Noto Sans JP comes in ~120 subsets fetched on first use, so a Line's ō / ī or a
  new kanji could be invisible while it showed (`display=block`). Now every character the MV uses is
  loaded up front (`document.fonts.load`) and `display=swap` as a fallback.
- **End screen** — "Hello 25th!" letters cycle red / yellow / grass green / light blue / pink / white
  with a hard drop shadow.
- **Vivid colours** — `src/data/wardrobe-vivid.json` at `/hello25/timing-suggested.html?set=vivid`
  (after City the Animation: saturated, high-key, whites pure, darks a vivid indigo).
- **Macrons** — Noto Sans JP's own ī keeps the dot and its macrons sit off-centre. Default is now
  Noto Sans (Latin) + Noto Sans JP (Japanese). Ten checked choices in `src/fonts.ts`, tried in dev
  with `?font=<key>`: noto, mplus, zenmaru, murecho, zenkaku, dela, nunito, rubik, poppins, inter.
- **Hello 25th mark** (human's call) — new optional `hello` mark in the Timing, set in the timing
  tool after the Wave; "Hello 25th!" fades in there, centred on screen, replacing the Lines, and
  stays through the End screen. Unset → it appears when the audio ends.
- **Hello 25th Dot** (human's call) — the `hello` mark is a Dot on the Timeline (larger, ringed).
- **Font** settled (human's call): Noto Sans + Noto Sans JP; the dev `?font=` switch stays for now.
- The ending's crowd split out into [Pose the ending's crowd](07-ending-crowd.md).
- **Glass backgrounds** (experiment, dev `?bg=glass`) — per Month, a 16:9 crop of one of four oil
  paintings, blurred live, under a wash of the Month's colour, plus a sheen. `src/data/glass.json`
  (crops + shared blur / wash / saturation / sheen) tuned in `/hello25/glass.html`; reduced
  paintings in `src/assets/paintings` from `scripts/glass-backgrounds.py` (`--pick` re-picks crops by
  colour). Originals in `assets/paintings` (~15 MB) — not yet decided whether to commit them.
- **Glass, baked** — the live blur drew the whole painting at crop scale (a ~5× screen-wide layer)
  and re-blurred it every frame of a fade or flick: the lag. The MV now cross-fades pre-baked crops
  (`src/assets/glass/NN.jpg`, 960×540, ~170 KB total, `--bake`); the editor keeps the live blur and
  its Save re-bakes. Steady 16.7 ms frames through a Month change and the Rapid change peak
  (headless Chromium).
- **Glass is the default** (human's call); originals in `assets/paintings` stay out of git
  (`.gitignore`) — the script falls back to the reduced copies.
- **Head** — title "Hello"; favicon (32, 192) and apple-touch-icon in `public/`: "25" as on the
  End screen (white 2, red 5, hard shadow), transparent, trimmed to fill the square (human's call).
- **Run → Wave** (human's call) — timed from `wave`: eases to a stop (−0.8 → −0.2 s), turns to face
  the screen by narrowing to a sliver and widening (−0.2 → +0.1 s), then raises the arm from her
  side into the wave (+0.1 → +0.6 s). `waveTransition` in mv.ts, `raiseToWave` in pose.ts.
