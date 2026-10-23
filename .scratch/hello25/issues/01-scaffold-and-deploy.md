# Scaffold the hello25 app and its deploy path

Type: task
Status: open
Assignee: iambaangkok

## Question

How does code in this repo reach https://www.iambaangkok.dev/hello25/? Scaffold a minimal Vite +
React + TS app (mirroring `../interlocking-problem`: `base: '/hello25/'`, build → `dist/hello25/`,
`wrangler.jsonc` Worker `hello25` on route `www.iambaangkok.dev/hello25*`) and get a placeholder page
live. Decide the deploy mechanism: `wrangler deploy` from this machine (no remote needed — likely
fastest) vs a Git remote + Cloudflare Git integration like block-grid-editor. HITL where Cloudflare
login/dashboard steps are needed. Record the live URL and deploy command.
