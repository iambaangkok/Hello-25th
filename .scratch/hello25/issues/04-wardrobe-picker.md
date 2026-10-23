# Edit the Month keyframes and gait keyframes in the timing tool

Type: task
Status: open
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
