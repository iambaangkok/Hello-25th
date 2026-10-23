# Record the Timing with a tap-along timing tool

Type: task
Status: closed
Assignee: iambaangkok
Blocked by: 01

## Question

Build a dev-only timing tool page: plays `assets/hello.m4a`, shows the next Line, one key marks
"next Line starts now", another marks "next Month starts now", with undo/restart; exports a timing
JSON (start time per Line incl. `♪` Lines, start time per Month 1–12). The human then taps through
the song and hands back the JSON. Resolved when the timing file is committed to the repo.

## Resolution

Timing recorded and committed at `src/data/timing.json`: `{ lines[35], months[12], rapid, wave }`
(seconds). October 163.48 s, Rapid change (fastest) 175.97 s, Wave 199.29 s; audio ends 227.6 s.
- Tool: `pnpm dev` → http://localhost:5173/hello25/timing.html (dev-only, not in the build). Space taps
  Lines; Months / Rapid change / Wave are rows (M sets the selected row, type, nudge, optional snap to
  a Line — free by default); Z undoes anything; Save writes the JSON via a dev-server endpoint.
- Shared modules for the player: `src/lyrics.ts` (35 Lines with Verse + `♪` flag; `{no translation}`
  → empty English) and `src/timing.ts` (`Timing` type, `MONTH_NAMES`, `indexAt`).
- November is pinned at 0 s. Month starts are free times, not snapped to Lines.
- Surfaced the closing sequence (Rapid change → Wave, see CONTEXT.md), now in the map's Notes.
