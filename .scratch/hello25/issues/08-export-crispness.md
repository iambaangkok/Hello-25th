# Make the exported video as crisp as the web version

Type: research
Status: open
Assignee:
Blocked by: —

## Question

`pnpm export` (scripts/export-video.mjs, the player's dev-only `?export` mode) renders and plays,
but the user finds the result way less crisp than the MV in a browser. Where is the sharpness lost,
and what fixes it?

Suspects, unverified:
- 4:2:0 chroma subsampling (`-pix_fmt yuv420p`) smearing white/colour edges on text and the Figure.
  Try `yuv444p` / an RGB lossless master to see if the frames themselves are crisp.
- The encode: `-crf 16 -preset medium` — compare against a lossless or a PNG frame straight from
  `page.screenshot`.
- Headless shell rendering: font antialiasing/hinting and SVG rasterising differ from desktop Chrome
  (and it's a cached Chromium 1228 driven by playwright-core 1.60).
- The player viewing it: scaling a 1080p file into a smaller window, or an upload re-encode.
- `deviceScaleFactor`: desktop renders at ×1 — a ×2 render downscaled may look closer to a HiDPI
  screen.

Start by comparing one raw screenshot PNG against the same frame decoded from the mp4.

## Also seen

- The full desktop export took 29 minutes for 7050 frames on 8 workers. The full reel export hasn't
  been run to the end yet (the user cancelled it, since the desktop one already looked too
  compressed).
