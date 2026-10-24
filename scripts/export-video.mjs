#!/usr/bin/env node
// Renders the MV to an mp4, frame by frame, from the player's dev-only `?export` mode (see
// useExport in src/Player.tsx): headless Chromium draws each moment, ffmpeg encodes it, the song
// is laid under it. Run from the repo root; needs ffmpeg and Playwright's Chromium.
//
//   pnpm export                      desktop: 1920×1080, as a 1920×1080 browser window shows it
//   pnpm export --preset reel        9:16 1080×1920, as a 360×640 phone screen shows it (×3)
//   pnpm export --size 1280x720 --scale 1 --fps 60 --from 4.4 --to 40 --out clip.mp4
//
// --from / --to are seconds of the video: the intro ("Thank you 24th...") runs from 0, the song
// from 4.4 (so --from 4.4 starts on the song), and the End screen holds for a few seconds after it.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const PRESETS = {
  desktop: { size: '1920x1080', scale: 1 },
  reel: { size: '1080x1920', scale: 3 },
}
const END_HOLD = 3 // seconds of the End screen after the song
const WARM_UP = 1.5 // seconds drawn before a worker's first frame, so CSS animations in flight are mid-way

const { values: args } = parseArgs({
  options: {
    preset: { type: 'string', default: 'desktop' },
    size: { type: 'string' }, // output pixels, WxH
    scale: { type: 'string' }, // device pixels per CSS pixel: the page lays out at size ÷ scale
    fps: { type: 'string', default: '30' },
    from: { type: 'string', default: '0' },
    to: { type: 'string' },
    out: { type: 'string' },
    workers: { type: 'string', default: '6' },
  },
})
const preset = PRESETS[args.preset]
if (!preset) throw new Error(`--preset is one of ${Object.keys(PRESETS).join(', ')}`)
const [width, height] = (args.size ?? preset.size).split('x').map(Number)
const scale = Number(args.scale ?? (args.size ? 1 : preset.scale))
const fps = Number(args.fps)
const out = args.out ?? `exports/hello25-${args.size ?? args.preset}.mp4`

const run = (cmd, argv, stdin) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: [stdin ? 'pipe' : 'ignore', 'ignore', 'inherit'] })
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
    if (stdin) stdin(p.stdin)
  })

const server = await createServer({ logLevel: 'warn', server: { port: 5390 } })
await server.listen()
const url = `${server.resolvedUrls.local[0]}?export`
// Playwright's own Chromium if it's installed, else the newest headless shell in its cache
// (`playwright install` doesn't support every distro).
const cache = join(homedir(), '.cache/ms-playwright')
const shells = existsSync(cache) ? (await readdir(cache)).filter((d) => d.startsWith('chromium_headless_shell-')).sort() : []
const cached = shells.length && join(cache, shells.at(-1), 'chrome-headless-shell-linux64/chrome-headless-shell')
const browser = await chromium.launch({ executablePath: existsSync(chromium.executablePath()) || !cached ? undefined : cached })
const work = await mkdtemp(join(tmpdir(), 'hello25-export-'))

try {
  const viewport = { width: Math.round(width / scale), height: Math.round(height / scale) }
  const open = async () => {
    const page = await browser.newPage({ viewport, deviceScaleFactor: scale })
    await page.goto(url)
    // The hook re-registers once the audio's metadata gives the song's real length.
    await page.waitForFunction(() => window.hello25Export && document.querySelector('audio').readyState >= 1)
    await page.waitForTimeout(200)
    await page.evaluate(() => document.fonts.ready)
    return page
  }

  const first = await open()
  const { duration, intro } = await first.evaluate(() => window.hello25Export)
  const from = Number(args.from)
  const to = Math.min(Number(args.to ?? Infinity), intro + duration + END_HOLD)
  const frames = Math.round((to - from) * fps)
  const workers = Math.max(1, Math.min(Number(args.workers), Math.ceil(frames / (fps * 5))))
  console.log(`${width}×${height} (${viewport.width}×${viewport.height} ×${scale}), ${fps} fps, ` +
    `${from}–${to.toFixed(2)} s: ${frames} frames on ${workers} workers`)

  // Each worker draws a run of frames into its own segment; they're joined without re-encoding.
  let done = 0
  const progress = setInterval(() => process.stdout.write(`\r${done}/${frames} frames`), 1000)
  const segment = async (w) => {
    const page = w === 0 ? first : await open()
    const start = Math.floor((frames * w) / workers)
    const end = Math.floor((frames * (w + 1)) / workers)
    const at = (i) => from + i / fps
    for (let i = Math.floor(start - WARM_UP * fps); i < start; i++) {
      if (at(i) >= 0) await page.evaluate((t) => window.hello25Export.frame(t), at(i))
    }
    const file = join(work, `${w}.mp4`)
    await run('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', file], async (stdin) => {
      for (let i = start; i < end; i++) {
        await page.evaluate((t) => window.hello25Export.frame(t), at(i))
        const png = await page.screenshot({ type: 'png' })
        if (!stdin.write(png)) await new Promise((r) => stdin.once('drain', r))
        done++
      }
      stdin.end()
    })
    return file
  }
  const files = await Promise.all(Array.from({ length: workers }, (_, w) => segment(w)))
  clearInterval(progress)
  console.log(`\r${frames}/${frames} frames`)

  // The song starts `intro` seconds into the video: delay it, or trim it when starting past that.
  const list = join(work, 'list.txt')
  await writeFile(list, files.map((f) => `file '${f}'`).join('\n'))
  const lead = intro - from
  const audio = lead >= 0 ? `adelay=${Math.round(lead * 1000)}:all=1` : `atrim=start=${-lead},asetpts=PTS-STARTPTS`
  await mkdir('exports', { recursive: true })
  await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', 'assets/hello.m4a',
    '-filter_complex', `[1:a]${audio}[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac',
    '-b:a', '192k', '-t', (to - from).toFixed(3), '-movflags', '+faststart', out])
  console.log(`→ ${out}`)
} finally {
  await browser.close()
  await server.close()
  await rm(work, { recursive: true, force: true })
}
