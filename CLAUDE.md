# CLAUDE.md — working agreement for hello25

Domain language (Line / Tier / Month / Figure / Outfit / Wardrobe / Timing) lives in
[CONTEXT.md](CONTEXT.md). The plan is the wayfinder map at [.scratch/hello25/map.md](.scratch/hello25/map.md).

## Commands

- `pnpm dev` — dev server at http://localhost:5173/hello25/
- `pnpm build` — `tsc -b && vite build` → `dist/hello25/` · `pnpm lint` — oxlint

## Deploy notes

Served from a **subpath**. Cloudflare Worker with Static Assets (assets-only, [wrangler.jsonc](wrangler.jsonc))
on route `www.iambaangkok.dev/hello25*`. The route keeps the path prefix, so Vite `base` is
`/hello25/` and the build lands in `dist/hello25/` while wrangler serves `dist/`. Don't change one
without the other. Unlisted: `noindex` meta in [index.html](index.html), linked from nowhere.
