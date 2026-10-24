#!/usr/bin/env python3
"""Glass backgrounds. Run from the repo root; needs ffmpeg (plain Python, no numpy).

  python3 scripts/glass-backgrounds.py          copies assets/paintings/*.jpg, reduced, to
                                                src/assets/paintings/ (what the site ships) and
                                                writes their sizes to src/data/paintings.json
  python3 scripts/glass-backgrounds.py --pick   also picks, for each Month, the 16:9 crop whose
                                                colour is closest to its background colour and
                                                writes them to src/data/glass.json (keeping the
                                                blur / wash settings). Fine-tune in glass.html.
  python3 scripts/glass-backgrounds.py --bake   bakes each Month's crop, blurred and saturated as
                                                set in glass.json, to src/assets/glass/NN.jpg —
                                                what the MV shows (a live blur of a whole painting
                                                is too heavy to fade and flick). The glass
                                                editor's Save runs this.
"""
import glob, json, os, subprocess, sys

PAINTINGS = sorted(p for p in glob.glob('assets/paintings/*.jpg'))
SHIP_DIR = 'src/assets/paintings'
SHIP_W = 1600                    # shipped width; crops are blurred, so this is plenty
GRID_W = 96                      # analysis grid width (height follows the image's aspect)
SIZES = [0.18, 0.26, 0.36, 0.5, 0.7, 1.0]   # crop widths as a fraction of the painting's width
STEPS = 14                       # crop positions per axis
BAKE_DIR = 'src/assets/glass'
BAKE_W, BAKE_H = 960, 540        # blurred, so this is plenty for a full screen
SETTINGS = {'blur': 3.3, 'wash': 0.38, 'saturation': 1.15, 'sheen': 0.16}  # defaults for a new glass.json
# Hand-picked crops where no painting has enough of the colour for the search to find:
# month index → (painting, x, y, width) as fractions of the painting; height follows 16:9.
OVERRIDES = {
    8: ('beauty-adorned-purple-pink-generative-ai.jpg', 0.80, 0.0, 0.20),  # July violet: the lavender spires
}


def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def oklab(r, g, b):
    r, g, b = lin(r / 255), lin(g / 255), lin(b / 255)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s)


def hex_lab(h): return oklab(*(int(h[i:i + 2], 16) for i in (1, 3, 5)))


def size_of(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout
    w, h = map(int, out.strip().split(','))
    return w, h


def grid(path):
    """The painting as a GRID_W-wide grid of OKLab pixels, plus integral images for window means."""
    w, h = size_of(path)
    gh = round(GRID_W * h / w)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={GRID_W}:{gh}', '-f', 'rawvideo',
                          '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    px = [oklab(raw[i], raw[i + 1], raw[i + 2]) for i in range(0, len(raw), 3)]
    # integral images of L, a, b and of squared deviation proxies (L² + a² + b²)
    chans = [[p[k] for p in px] for k in range(3)] + [[p[0] ** 2 + p[1] ** 2 + p[2] ** 2 for p in px]]
    ints = []
    for ch in chans:
        it = [[0.0] * (GRID_W + 1) for _ in range(gh + 1)]
        for y in range(gh):
            row = 0.0
            for x in range(GRID_W):
                row += ch[y * GRID_W + x]
                it[y + 1][x + 1] = it[y][x + 1] + row
        ints.append(it)
    return {'path': path, 'w': w, 'h': h, 'gw': GRID_W, 'gh': gh, 'ints': ints}


def window_stats(g, x0, y0, x1, y1):
    n = (x1 - x0) * (y1 - y0)
    s = [it[y1][x1] - it[y0][x1] - it[y1][x0] + it[y0][x0] for it in g['ints']]
    mean = (s[0] / n, s[1] / n, s[2] / n)
    spread = max(0.0, s[3] / n - sum(m * m for m in mean)) ** 0.5
    return mean, spread


def candidates(g):
    """Every 16:9 window (in grid cells) with its mean colour and spread."""
    out = []
    for frac in SIZES:
        cw = max(4, round(g['gw'] * frac))
        ch = round(cw * 9 / 16 * (g['w'] / g['gw']) / (g['h'] / g['gh']))
        if ch > g['gh']:
            ch = g['gh']
            cw = round(ch * 16 / 9 * (g['h'] / g['gh']) / (g['w'] / g['gw']))
        for i in range(STEPS):
            for j in range(STEPS):
                x0 = round((g['gw'] - cw) * i / (STEPS - 1))
                y0 = round((g['gh'] - ch) * j / (STEPS - 1))
                mean, spread = window_stats(g, x0, y0, x0 + cw, y0 + ch)
                out.append({'g': g, 'box': (x0, y0, cw, ch), 'mean': mean, 'spread': spread})
    return out


def iou(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ix = max(0, min(ax + aw, bx + bw) - max(ax, bx))
    iy = max(0, min(ay + ah, by + bh) - max(ay, by))
    inter = ix * iy
    return inter / (aw * ah + bw * bh - inter)


def score(c, target, picked):
    L, A, B = c['mean']
    tL, tA, tB = target
    # Hue and chroma matter most (the colour wash fixes lightness); a busy crop blurs to mud.
    d = (0.6 * (L - tL) ** 2 + (A - tA) ** 2 + (B - tB) ** 2) ** 0.5 + 0.12 * c['spread']
    # Don't hand two Months the same patch of the same painting.
    for p in picked:
        if p['g'] is c['g'] and iou(p['box'], c['box']) > 0.35:
            d += 0.05
    return d


def ship():
    os.makedirs(SHIP_DIR, exist_ok=True)
    sizes = {}
    for path in PAINTINGS:
        name = os.path.basename(path)
        out = f'{SHIP_DIR}/{name}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vf', f'scale={SHIP_W}:-2', '-q:v', '5', out], check=True)
        sizes[name] = list(size_of(out))
        print(f'{name}: {os.path.getsize(out) // 1024} KB')
    json.dump(sizes, open('src/data/paintings.json', 'w'), indent=2)
    open('src/data/paintings.json', 'a').write('\n')


def pick():
    colours = [m['background'] for m in json.load(open('src/data/wardrobe.json'))['months']]
    grids = [grid(p) for p in PAINTINGS]
    pool = [c for g in grids for c in candidates(g)]
    picks, record = [], []
    for month, colour in enumerate(colours):
        if month in OVERRIDES:
            name, fx, fy, fw = OVERRIDES[month]
            g = next(g for g in grids if os.path.basename(g['path']) == name)
            fh = fw * 9 / 16 * g['w'] / g['h']
            picks.append({'g': g, 'box': (round(fx * g['gw']), round(fy * g['gh']), round(fw * g['gw']), round(fh * g['gh']))})
        else:
            best = min(pool, key=lambda c: score(c, hex_lab(colour), picks))
            picks.append(best)
            g = best['g']
            x0, y0, cw, ch = best['box']
            fx, fy, fw, fh = x0 / g['gw'], y0 / g['gh'], cw / g['gw'], ch / g['gh']
        record.append({'painting': os.path.basename(g['path']), 'x': round(fx, 4), 'y': round(fy, 4), 'w': round(fw, 4)})
        print(f"{month + 1:2d} {colour} ← {os.path.basename(g['path'])} crop {fx:.2f},{fy:.2f} {fw:.2f}×{fh:.2f}")
    path = 'src/data/glass.json'
    settings = {k: v for k, v in json.load(open(path)).items() if k != 'months'} if os.path.exists(path) else SETTINGS
    json.dump({**settings, 'months': record}, open(path, 'w'), indent=2)
    open(path, 'a').write('\n')


def bake():
    glass = json.load(open('src/data/glass.json'))
    os.makedirs(BAKE_DIR, exist_ok=True)
    for month, crop in enumerate(glass['months']):
        # The full-size original if it's here, else the shipped copy.
        src = f"assets/paintings/{crop['painting']}"
        if not os.path.exists(src):
            src = f"{SHIP_DIR}/{crop['painting']}"
        w, h = size_of(src)
        cw = crop['w'] * w
        ch = cw * 9 / 16
        cx, cy = crop['x'] * w, crop['y'] * h
        k = BAKE_W / cw                                   # source px → baked px
        sigma = glass['blur'] / 100 * BAKE_H              # blur is % of the screen height
        # Blur a margin around the crop too, so its edges blur into real paint, then trim it off.
        m = 3 * sigma / k
        ex, ey = max(0, cx - m), max(0, cy - m)
        ew, eh = min(w, cx + cw + m) - ex, min(h, cy + ch + m) - ey
        sw, sh = round(ew * k), round(eh * k)
        out = f'{BAKE_DIR}/{month + 1:02d}.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf',
                        f"crop={round(ew)}:{round(eh)}:{round(ex)}:{round(ey)},scale={sw}:{sh},"
                        f"gblur=sigma={sigma:.2f},eq=saturation={glass['saturation']},"
                        f"crop={BAKE_W}:{BAKE_H}:{min(sw - BAKE_W, round((cx - ex) * k))}:{min(sh - BAKE_H, round((cy - ey) * k))}",
                        '-q:v', '3', out], check=True)
    print(f'baked {len(glass["months"])} Months to {BAKE_DIR}/ (blur {glass["blur"]}%, saturation {glass["saturation"]})')


if __name__ == '__main__':
    if sys.argv[1:] != ['--bake']:
        ship()
        if '--pick' in sys.argv:
            pick()
    bake()
