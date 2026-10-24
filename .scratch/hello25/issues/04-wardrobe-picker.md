# Edit the Month keyframes and gait keyframes in the timing tool

Type: task
Status: closed
Assignee: iambaangkok
Blocked by: 03

## Question

Extend the timing tool (not a separate picker) so everything the MV changes over the song is
edited there, against the song and with the Figure previewed live, and
saved into `src/data/timing.json` (or a sibling Wardrobe JSON). The Figure is `src/Figure.tsx`,
Outfit fields `src/outfit.ts`, gait values `src/gait.ts`:

- **Month keyframes** — one per Month, sitting on that Month's marker (November → October). Each
  holds the **background colour** and the full **Outfit**: inner (incl. long-sleeve, dress),
  striped + second colour, outer, bottom colour / length / leg width, shoes + two colours, bag,
  hair colour and hair style (bob / short bob), skin. HSL or colour pickers; draft palette
  pre-filled; hair defaults to the same all year. This is the **Wardrobe**; the Rapid change flicks
  through these same 12.
- **Gait keyframes** — each switches the Figure to **stand**, **walk** or **light run** with its
  own **ease** (seconds, default 0.8). Its time is either **tied to a Month marker** (moves with it)
  or **free** — set by hand / tapped / nudged like the other marks. Often but not always on a Month
  marker. The song starts in stand; the Wave keeps its own `wave` mark.
- **Song-wide** — walk and light-run step rates (default 80 / 140 steps/min, on the song's beat).

Add / delete / undo; autosave to localStorage; export / import JSON. The human edits everything and
the result is committed. Resolved when the Wardrobe + gait keyframes JSON is committed.

## Resolution

**Wardrobe recorded** in `src/data/wardrobe.json` (version 2): 12 Month keyframes edited by the
human, gait keyframes (walk from 1.3 s, light run from 2:00), step rates walk 77 / light run 146.

The timing tool now has a Wardrobe + gait keyframes section
with a live Figure preview (follows the playhead while playing, shows the edited Month while
paused). `src/wardrobe.ts` holds the `Wardrobe` / `GaitKey` types, a seasonal draft palette
(`DEFAULT_WARDROBE`) and `gaitTrack(wardrobe, timing, duration)` → `(t) => { gait, phase }`
(seekable; the player reuses it). Saved alongside the Timing to `src/data/wardrobe.json`
(seeded with the draft) via the dev `__data/<name>` endpoint. Z undo (colour drags coalesce),
G adds a free gait keyframe, tie/untie to a Month, copy Outfit from a Month, hair → all Months,
download / import JSON.

Added on request: hair styles **ponytail** (short, with side bangs) and **pigtails** (short tufts),
both swaying with the steps; inner **turtleneck**; outers **vest** (sleeveless) and **puffer**
(quilted, thicker sleeves, collar); **scarf** accessory beside the bag. The Figure is now
anti-aliased (`shapeRendering="geometricPrecision"`) — still rectangles, no jagged edges. Older
saved Wardrobes are filled in from the defaults (`withDefaults`).
Bags are now a type: none / side / bigside (bigger bag, thicker strap) / backpack. Pants `length`
0 is now bikini-short (only the hip band); the Wardrobe carries `version: 2` and older saves are
converted on load (old 0 = shorts → 0.3).
Hats: none / bucket (low flat-topped crown, band, brim tilting down at both sides — plain rectangles; optional dots, `hatDotColor`) / cap (peak forward), with `hatColor`.
