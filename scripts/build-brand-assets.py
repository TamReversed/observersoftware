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

# --- The mark: two families of threads start on opposite edges of the left tip, cross into a lattice,
# sweep around the coral pupil as eyelids, and meet at the right corner, where one coral line leaves.
# Chosen from Higgsfield (Recraft) concept B, redrawn here as clean strokes so it scales and stays editable.
# Two families of threads start on opposite edges of the left tip, cross into a lattice, sweep around the
# coral pupil as eyelids, and meet at the right corner, where one coral line leaves.
T=(6.0,50.0); R=(150.0,50.0); PUPIL=(103.0,50.0)
def family(n, sign, h_out=33.0, h_in=17.8, run=31.0, drop=15.5):
    """n curves; sign=+1 upper lids (start on the lower-left edge), -1 lower lids."""
    out=[]
    for i in range(n):
        t=i/(n-1) if n>1 else 0
        sx=T[0]+run*t; sy=T[1]+sign*drop*t           # start point along the opposite edge
        h=h_out+(h_in-h_out)*t; ay=50-sign*h; ax=97+3*t
        seg1=((sx,sy),(sx+(ax-sx)*0.42, sy-sign*(h+ (sy-50)*sign)*0.70),(ax-24,ay),(ax,ay))
        seg2=((ax,ay),(ax+21,ay),(R[0]-17,50-sign*(2.2+2.2*(1-t))),R)
        out.append((seg1,seg2))
    return out
def curves(n): return family(n,1)+family(n,-1)
def path_d(n):
    d=''
    for s1,s2 in curves(n):
        d+='M%.2f %.2f'%s1[0]+'C'+' '.join('%.2f %.2f'%p for p in s1[1:])+'C'+' '.join('%.2f %.2f'%p for p in s2[1:])
    return d
def bez(p0,p1,p2,p3,n=40):
    return [tuple((1-t)**3*p0[k]+3*(1-t)**2*t*p1[k]+3*(1-t)*t*t*p2[k]+t**3*p3[k] for k in (0,1)) for t in [j/n for j in range(n+1)]]
VARIANTS={'full':dict(n=7,stroke=1.5,pupil=14.0,line=2.6,x1=196),
          'standard':dict(n=4,stroke=2.7,pupil=13.5,line=3.4,x1=176),
          'small':dict(n=1,stroke=6.5,pupil=13.0,line=6.0,x1=172)}
def svg_inner(kind, text='#ECE8E4', accent='#E0565B'):
    v=VARIANTS[kind]
    return (f'<path d="{path_d(v["n"])}" stroke="{text}" stroke-width="{v["stroke"]}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
            f'<path d="M{R[0]-1} 50H{v["x1"]}" stroke="{accent}" stroke-width="{v["line"]}"/>'
            f'<circle cx="{PUPIL[0]}" cy="50" r="{v["pupil"]}" fill="{accent}"/>')
def viewbox(kind):
    v=VARIANTS[kind]; pad=v['stroke']/2+1; return (2, 50-33-pad, v['x1']-2+2, 2*(33+pad))

def mark_svg_file(kind, bg=None):
    x, y, w, h = viewbox(kind)
    rect = f'<rect x="{x}" y="{y:.1f}" width="{w}" height="{h:.1f}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y:.1f} {w} {h:.1f}" fill="none" role="img" aria-label="Observer">'
            f'{rect}{svg_inner(kind, TEXT, ACCENT)}</svg>\n')

def write(path, text):
    with open(path, 'w') as f:
        f.write(text)

# --- mark (standard weight for normal sizes, full weight for large display use)
write(f'{OUT}/observer-mark.svg', mark_svg_file('standard'))
write(f'{OUT}/observer-mark-full.svg', mark_svg_file('full'))

# --- favicon: the simplified mark on a ground tile, so it reads on any tab colour
fx, fy, fw, fh = viewbox('small')
fs = 56 / fw
write('public/favicon.svg',
      f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" fill="{GROUND}"/>'
      f'<g transform="translate({4 - fx * fs:.2f} {32 - (fy + fh / 2) * fs:.2f}) scale({fs:.4f})">{svg_inner("small", TEXT, ACCENT)}</g></svg>\n')

# --- wordmark: mark + "Observer" as real glyph paths
font = TTFont(FONT)
gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
upm = font['head'].unitsPerEm
mx, my, mw, mh = viewbox('standard')
ms = 54 / mh                      # mark is 54 units tall inside the 64-unit lockup
mark_w = mw * ms
size = 34.0
scale = size / upm
baseline = 43.0
x = round(mark_w + 14, 1)
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
      f'<g transform="translate({-mx * ms:.2f} {32 - (my + mh / 2) * ms:.2f}) scale({ms:.4f})">{svg_inner("standard", TEXT, ACCENT)}</g>'
      f'<path fill="{TEXT}" d="{"".join(paths)}"/></svg>\n')

# --- animated wordmark (home page nav): the mark draws itself once. Threads run from the left tip to the right
# corner, the pupil lights, then the coral line fires. Pure CSS inside the SVG, so it works as an <img>;
# with reduced motion it is simply the finished logo.
def animated_wordmark():
    v = VARIANTS['standard']
    threads = []
    for k, (s1, s2) in enumerate(curves(v['n'])):
        d = 'M%.2f %.2f' % s1[0] + 'C' + ' '.join('%.2f %.2f' % p for p in s1[1:]) + 'C' + ' '.join('%.2f %.2f' % p for p in s2[1:])
        n = v['n']
        delay = 0.05 + 0.09 * (k % n) + (0.045 if k >= n else 0)   # upper and lower families interleave
        threads.append(f'<path class="t" pathLength="1" d="{d}" style="animation-delay:{delay:.2f}s"/>')
    css = ('.t{fill:none;stroke:' + TEXT + ';stroke-width:' + str(v['stroke']) + ';stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:draw .85s cubic-bezier(.22,1,.36,1) forwards}'
           '.p{transform-box:fill-box;transform-origin:center;transform:scale(0);opacity:0;animation:light .5s cubic-bezier(.22,1,.36,1) .75s forwards}'
           '.l{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);opacity:0;animation:fire .45s cubic-bezier(.22,1,.36,1) 1.1s forwards}'
           '@keyframes draw{to{stroke-dashoffset:0}}'
           '@keyframes light{60%{transform:scale(1.18);opacity:1}to{transform:scale(1);opacity:1}}'
           '@keyframes fire{from{opacity:1}to{transform:scaleX(1);opacity:1}}'
           '@media (prefers-reduced-motion:reduce){.t{animation:none;stroke-dashoffset:0}.p{animation:none;transform:none;opacity:1}.l{animation:none;transform:none;opacity:1}}')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 64" fill="none" role="img" aria-label="Observer"><style>{css}</style>'
            f'<g transform="translate({-mx * ms:.2f} {32 - (my + mh / 2) * ms:.2f}) scale({ms:.4f})">'
            f'{"".join(threads)}'
            f'<path class="l" d="M{R[0] - 1} 50H{v["x1"]}" stroke="{ACCENT}" stroke-width="{v["line"]}"/>'
            f'<circle class="p" cx="{PUPIL[0]}" cy="50" r="{v["pupil"]}" fill="{ACCENT}"/></g>'
            f'<path fill="{TEXT}" d="{"".join(paths)}"/></svg>\n')

write(f'{OUT}/observer-wordmark-animated.svg', animated_wordmark())

# --- raster icons (PIL, supersampled): the mark centred on a ground tile
def render(n, frac, kind='standard', ss=8):
    N = n * ss
    img = Image.new('RGB', (N, N), GROUND)
    d = ImageDraw.Draw(img)
    v = VARIANTS[kind]
    vx, vy, vw, vh = viewbox(kind)
    s = N * frac / vw
    ox = (N - vw * s) / 2 - vx * s
    oy = N / 2 - 50 * s
    P = lambda p: (ox + p[0] * s, oy + p[1] * s)
    w = max(1, round(v['stroke'] * s))
    for s1, s2 in curves(v['n']):
        pts = [P(p) for p in bez(*s1) + bez(*s2)]
        d.line(pts, fill=TEXT, width=w, joint='curve')
        for px, py in (pts[0], pts[-1]):
            d.ellipse([px - w / 2, py - w / 2, px + w / 2, py + w / 2], fill=TEXT)
    lw = max(1, round(v['line'] * s))
    a, b = P((R[0] - 1, 50)), P((v['x1'], 50))
    d.rectangle([a[0], a[1] - lw / 2, b[0], b[1] + lw / 2], fill=ACCENT)
    cx, cy = P(PUPIL); r = v['pupil'] * s
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ACCENT)
    return img.resize((n, n), Image.LANCZOS)

pub = 'public'
render(16, 0.94, 'small').save(f'{pub}/favicon-16.png')
render(32, 0.92, 'small').save(f'{pub}/favicon-32.png')
render(48, 0.9, 'small').save('/tmp/favicon-48.png')
Image.open(f'{pub}/favicon-32.png').save(f'{pub}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[Image.open(f'{pub}/favicon-16.png'), Image.open('/tmp/favicon-48.png')])
render(180, 0.78).save(f'{pub}/apple-touch-icon.png')
render(192, 0.8).save(f'{pub}/icon-192.png')
render(512, 0.8).save(f'{pub}/icon-512.png')
render(512, 0.62).save(f'{pub}/icon-512-maskable.png')  # mark inside the 80% safe zone
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
