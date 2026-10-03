#!/usr/bin/env python3
"""Builds the Observer brand set (SVG mark, wordmark, favicons, app icons, manifest).

Needs: python3 with fonttools + pillow, and /tmp/Geist-SemiBold.ttf (or pass FONT=path).
Run from the repo root:  /tmp/venv/bin/python scripts/build-brand-assets.py
"""
import json, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image, ImageDraw

GROUND, TEXT, ACCENT = '#121113', '#ECE8E4', '#E0565B'
FONT = os.environ.get('FONT', '/tmp/Geist-SemiBold.ttf')
OUT = 'public/assets/brand'
os.makedirs(OUT, exist_ok=True)

HEX = 'M32 4l24.25 14v28L32 60 7.75 46V18z'
EYE = 'M14 32C22 21.5 42 21.5 50 32 42 42.5 22 42.5 14 32z'

def mark_svg(stroke=TEXT, pupil=ACCENT, hex_w=2.5, eye_w=2, r=4.6):
    return (f'<path d="{HEX}" stroke="{stroke}" stroke-width="{hex_w}" stroke-linejoin="miter"/>'
            f'<path d="{EYE}" stroke="{stroke}" stroke-width="{eye_w}" stroke-linejoin="round"/>'
            f'<circle cx="32" cy="32" r="{r}" fill="{pupil}"/>')

def write(path, text):
    with open(path, 'w') as f:
        f.write(text)

# --- mark
write(f'{OUT}/observer-mark.svg',
      f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" role="img" aria-label="Observer">{mark_svg()}</svg>\n')

# --- favicon (simplified, on ground tile so it reads on any tab colour)
write('public/favicon.svg',
      f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" fill="{GROUND}"/>'
      f'<g transform="translate(6.4 6.4) scale(0.8)">{mark_svg(hex_w=4.5, eye_w=4, r=7)}</g></svg>\n')

# --- wordmark: mark + "Observer" as real glyph paths
font = TTFont(FONT)
gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
upm = font['head'].unitsPerEm
size = 34.0
scale = size / upm
baseline = 43.0
x = 80.0
tracking = -0.01 * size
paths = []
for ch in 'Observer':
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
    paths.append(pen.getCommands())
    x += hmtx[g][0] * scale + tracking
width = round(x + 2, 1)
write(f'{OUT}/observer-wordmark.svg',
      f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 64" fill="none" role="img" aria-label="Observer">'
      f'{mark_svg()}<path fill="{TEXT}" d="{"".join(paths)}"/></svg>\n')

# --- raster icons (PIL, supersampled)
def hexpts(s, ox, oy):
    pts = [(32, 4), (56.25, 18), (56.25, 46), (32, 60), (7.75, 46), (7.75, 18)]
    return [(ox + px * s, oy + py * s) for px, py in pts]

def bez(p0, p1, p2, p3, n=48):
    out = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out

def render(n, frac, simple=False, ss=8):
    N = n * ss
    img = Image.new('RGB', (N, N), GROUND)
    d = ImageDraw.Draw(img)
    box = N * frac
    s = box / 64.0
    ox = oy = (N - box) / 2
    hw, ew, r = (4.5, 4, 7) if simple else (2.5, 2, 4.6)
    d.polygon(hexpts(s, ox, oy), outline=TEXT, width=max(1, round(hw * s)))
    P = lambda x, y: (ox + x * s, oy + y * s)
    pts = bez(P(14, 32), P(22, 21.5), P(42, 21.5), P(50, 32)) + bez(P(50, 32), P(42, 42.5), P(22, 42.5), P(14, 32))
    w = max(1, round(ew * s))
    d.line(pts, fill=TEXT, width=w, joint='curve')
    for px, py in pts[::6]:
        d.ellipse([px - w / 2, py - w / 2, px + w / 2, py + w / 2], fill=TEXT)
    cx, cy = P(32, 32)
    d.ellipse([cx - r * s, cy - r * s, cx + r * s, cy + r * s], fill=ACCENT)
    return img.resize((n, n), Image.LANCZOS)

pub = 'public'
render(16, 0.9, True).save(f'{pub}/favicon-16.png')
render(32, 0.9, True).save(f'{pub}/favicon-32.png')
render(48, 0.9, True).save('/tmp/favicon-48.png')
Image.open(f'{pub}/favicon-32.png').save(f'{pub}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[Image.open(f'{pub}/favicon-16.png'), Image.open('/tmp/favicon-48.png')])
render(180, 0.7).save(f'{pub}/apple-touch-icon.png')
render(192, 0.72).save(f'{pub}/icon-192.png')
render(512, 0.72).save(f'{pub}/icon-512.png')
render(512, 0.58).save(f'{pub}/icon-512-maskable.png')  # mark inside the 80% safe zone

write(f'{pub}/site.webmanifest', json.dumps({
    'name': 'Observer', 'short_name': 'Observer',
    'description': 'Software shaped by real work.',
    'start_url': '/', 'display': 'standalone',
    'background_color': GROUND, 'theme_color': GROUND,
    'icons': [
        {'src': '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
        {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
        {'src': '/icon-512-maskable.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ]}, indent=2) + '\n')
print('brand assets written; wordmark width', width)
