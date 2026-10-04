#!/usr/bin/env python3
"""Turns raw Higgsfield generations (refs/raw/assets/*.png) into web-ready files in public/assets.

Run from the repo root:  /tmp/venv/bin/python scripts/build-site-assets.py
Needs pillow and /tmp/Geist-SemiBold.ttf (override with FONT=...).
"""
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAW = 'refs/raw/assets'
PUB = 'public/assets'
GROUND, TEXT, MUTED, ACCENT = (18, 17, 19), (236, 232, 228), (163, 158, 153), (224, 86, 91)
FONT = os.environ.get('FONT', '/tmp/Geist-SemiBold.ttf')

def out(sub):
    os.makedirs(f'{PUB}/{sub}', exist_ok=True)
    return f'{PUB}/{sub}'

def cover(im, w, h):
    """Centre-crop to the target aspect, then resize."""
    tw = im.height * w / h
    if tw <= im.width:
        l = (im.width - tw) / 2
        box = (l, 0, l + tw, im.height)
    else:
        th = im.width * h / w
        t = (im.height - th) / 2
        box = (0, t, im.width, t + th)
    return im.crop(tuple(round(v) for v in box)).resize((w, h), Image.LANCZOS)

def neutralise(im):
    """Pull gold/yellow tones (hue ~20-65 deg) toward neutral warm white; coral (hue ~0) is untouched."""
    h, s, v = im.convert('HSV').split()
    mask = h.point(lambda x: 255 if 14 <= x <= 46 else 0).filter(ImageFilter.GaussianBlur(6))
    s2 = Image.composite(s.point(lambda x: int(x * 0.35)), s, mask)
    return Image.merge('HSV', (h, s2, v)).convert('RGB')

def load(name):
    im = Image.open(f'{RAW}/{name}.png').convert('RGB')
    # UI mockups are already on-palette; art gets the neutral grade
    return im if name.startswith(('datadragon', 'tableflow')) else neutralise(im)

# --- OG cards 1200x630 with the title baked into the empty left third
OG = {'home': 'Software shaped by real work.', 'work': 'Work', 'products': 'Products',
      'blog': 'Insights', 'contact': 'Start a conversation.'}
for page, title in OG.items():
    im = cover(load(f'og-{page}'), 1200, 630)
    d = ImageDraw.Draw(im)
    f_title, f_small = ImageFont.truetype(FONT, 66), ImageFont.truetype(FONT, 26)
    words, lines, cur = title.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f_title) > 470 and cur:
            lines.append(cur); cur = w
        else:
            cur = t
    lines.append(cur)
    y = 315 - (len(lines) * 74) / 2
    for ln in lines:
        d.text((64, y), ln, font=f_title, fill=TEXT); y += 74
    d.text((64, 54), 'Observer', font=f_small, fill=MUTED)
    d.rectangle([64, 575, 112, 577], fill=ACCENT)
    im.save(f'{out("og")}/og-{page}.jpg', quality=86, optimize=True)

# --- case studies 1600x1000 (16:10)
for name in [n[5:-4] for n in os.listdir(RAW) if n.startswith('work-')]:
    cover(load(f'work-{name}'), 1600, 1000).save(f'{out("work")}/{name}.webp', quality=80, method=6)

# --- blog covers 1600x900
for name in [n[5:-4] for n in os.listdir(RAW) if n.startswith('blog-')]:
    cover(load(f'blog-{name}'), 1600, 900).save(f'{out("blog")}/{name}.webp', quality=80, method=6)

# --- team placeholders (fixed filenames, owner replaces) 1200x1500
for src, dst in (('team-founder', 'founder'), ('team-01', 'team-01'), ('team-02', 'team-02')):
    cover(load(src), 1200, 1500).save(f'{out("team")}/{dst}.jpg', quality=84, optimize=True)

# --- product screenshot placeholders (fixed filenames, owner replaces) 1600x1000 PNG
for prod in ('datadragon', 'tableflow'):
    for i in (1, 2, 3):
        # flat UI mockups compress well as a 256-colour PNG (about a quarter of the size, no visible loss)
        cover(load(f'{prod}-0{i}'), 1600, 1000).quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(f'{out("products")}/{prod}-0{i}.png', optimize=True)

# --- plates, diagram, state art
for p in ('plate-haze', 'plate-curve'):
    cover(load(p), 1920, 1080).save(f'{out("plates")}/{p[6:]}.webp', quality=78, method=6)
# practice panels (Consulting: the tangle, Products: the resolved line), made by scripts in refs/raw/practices
for name in ('consulting', 'products'):
    cover(load(f'plate-{name}'), 2400, 1810).save(f'{out("plates")}/{name}.webp', quality=80, method=6)
cover(load('diagram-engagement'), 2400, 1029).save(f'{out("diagrams")}/engagement.webp', quality=82, method=6)
for s in ('404', 'offline'):
    cover(load(f'state-{s}'), 1000, 1000).save(f'{out("states")}/{s}.webp', quality=80, method=6)

# --- hero art (first screen; dissolves into the film on scroll)
cover(load('hero-art-4k'), 4096, 2323).save(f'{out("film")}/hero-art.webp', quality=82, method=6)
cover(load('hero-art-mobile-4k'), 1440, 1800).save(f'{out("film")}/hero-art-mobile.webp', quality=82, method=6)

# --- fingerprint the placeholders so the site can tell when the owner has replaced one
ph = {}
for rel in ('team/founder.jpg', 'team/team-01.jpg', 'team/team-02.jpg',
            *[f'products/{p}-0{i}.png' for p in ('datadragon', 'tableflow') for i in (1, 2, 3)]):
    ph[rel] = os.path.getsize(f'{PUB}/{rel}')
json.dump(ph, open(f'{PUB}/placeholders.json', 'w'), indent=2)
print('done')
