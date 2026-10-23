# Scaffold the hello25 app and its deploy path

Type: task
Status: closed
Assignee: iambaangkok

## Question

How does code in this repo reach https://www.iambaangkok.dev/hello25/? Scaffold a minimal Vite +
React + TS app (mirroring `../interlocking-problem`: `base: '/hello25/'`, build → `dist/hello25/`,
`wrangler.jsonc` Worker `hello25` on route `www.iambaangkok.dev/hello25*`) and get a placeholder page
live. Decide the deploy mechanism: `wrangler deploy` from this machine (no remote needed — likely
fastest) vs a Git remote + Cloudflare Git integration like block-grid-editor. HITL where Cloudflare
login/dashboard steps are needed. Record the live URL and deploy command.

## Resolution

Live at https://www.iambaangkok.dev/hello25/ (placeholder "Thank you 24th...").
- **Deploy = Cloudflare Git integration**: Worker `hello25` builds from
  `github.com/iambaangkok/Hello-25th` (`git@github.com:iambaangkok/Hello-25th.git`); every push to
  `master` builds (`pnpm build`) and deploys (`npx wrangler deploy`). No local wrangler login needed.
- `master` is production — push only what should go live.
- Scaffold: Vite + React + TS + Tailwind, `base: '/hello25/'` → `dist/hello25/`, assets-only Worker on
  route `www.iambaangkok.dev/hello25*` (see `wrangler.jsonc`, `CLAUDE.md`). `noindex` meta in `index.html`.
