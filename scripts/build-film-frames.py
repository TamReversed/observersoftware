#!/usr/bin/env python3
"""Encodes the hero film into scroll-scrub frame sequences.

Usage (repo root):  /tmp/venv/bin/python scripts/build-film-frames.py refs/raw/hero-film.mp4 [fps]
Writes public/assets/film/{desktop,mobile}/f_###.webp, poster-start/end.webp, manifest.json.
"""
import glob, json, os, shutil, subprocess, sys, time
from PIL import Image, ImageFilter

src = sys.argv[1]
fps = int(sys.argv[2]) if len(sys.argv) > 2 else 10
OUT = 'public/assets/film'
TMP = '/tmp/film_raw'

def neutralise(im):
    """Pull gold tones toward neutral warm white; coral (hue ~0) is untouched."""
    h, s, v = im.convert('HSV').split()
    mask = h.point(lambda x: 255 if 14 <= x <= 46 else 0).filter(ImageFilter.GaussianBlur(6))
    s2 = Image.composite(s.point(lambda x: int(x * 0.35)), s, mask)
    return Image.merge('HSV', (h, s2, v)).convert('RGB')

shutil.rmtree(TMP, ignore_errors=True); os.makedirs(TMP)
for d in ('desktop', 'mobile'):
    shutil.rmtree(f'{OUT}/{d}', ignore_errors=True); os.makedirs(f'{OUT}/{d}')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', f'fps={fps}', f'{TMP}/f_%03d.png'], check=True)

frames = sorted(glob.glob(f'{TMP}/f_*.png'))
for i, f in enumerate(frames, 1):
    im = neutralise(Image.open(f).convert('RGB'))
    w, h = im.size
    im.resize((1600, round(1600 * h / w)), Image.LANCZOS).save(f'{OUT}/desktop/f_{i:03d}.webp', quality=72, method=6)
    cw = round(h * 4 / 5)                      # centre-safe 4:5 crop for phones
    m = im.crop(((w - cw) // 2, 0, (w + cw) // 2, h))
    m.resize((720, round(720 * h / cw)), Image.LANCZOS).save(f'{OUT}/mobile/f_{i:03d}.webp', quality=68, method=6)

shutil.copy(f'{OUT}/desktop/f_001.webp', f'{OUT}/poster-start.webp')
shutil.copy(f'{OUT}/desktop/f_{len(frames):03d}.webp', f'{OUT}/poster-end.webp')
shutil.copy(f'{OUT}/mobile/f_001.webp', f'{OUT}/poster-start-mobile.webp')
shutil.copy(f'{OUT}/mobile/f_{len(frames):03d}.webp', f'{OUT}/poster-end-mobile.webp')
json.dump({'count': len(frames), 'desktop': '/assets/film/desktop/f_{n}.webp', 'mobile': '/assets/film/mobile/f_{n}.webp', 'pad': 3, 'v': int(time.time())},
          open(f'{OUT}/manifest.json', 'w'), indent=2)
size = lambda d: sum(os.path.getsize(p) for p in glob.glob(f'{OUT}/{d}/*')) / 1e6
print(f'{len(frames)} frames: desktop {size("desktop"):.1f} MB, mobile {size("mobile"):.1f} MB')
