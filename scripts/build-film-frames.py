#!/usr/bin/env python3
"""Encodes the hero film into scroll-scrub frame sequences (v2: motion-equalised).

Usage (repo root):  /tmp/venv/bin/python scripts/build-film-frames.py refs/raw/hero-film.mp4 [frames]

Why not just take every Nth video frame?
  1. The generator's 24 fps output drops one frame every second (25 fps conformed to 24), so one
     frame pair per second moves twice as far as its neighbours. A fixed-rate sample turns that into a
     visible hitch. Here every output frame is placed at equal VISUAL change, and positions that fall
     between two source frames are blended, so the hitch disappears.
  2. The last ~2.5 s of the film barely changes, which would be dead scroll. Equal-change sampling
     compresses that tail automatically.
  3. The coral line only appears near the end. It gets its own stretch of scroll (the "beam" range) so
     it is on screen long enough to register.

Writes public/assets/film/{desktop,mobile}/f_###.webp, posters, and manifest.json (frame count,
chapter thresholds, outro timing) which the page script reads.
"""
import glob, json, os, shutil, subprocess, sys, time
from functools import lru_cache
import numpy as np
from PIL import Image, ImageFilter

src = sys.argv[1]
N = int(sys.argv[2]) if len(sys.argv) > 2 else 220
OUT = 'public/assets/film'
TMP = '/tmp/film_raw'
MAIN_SHARE = 0.82          # share of output frames spent before the coral line appears
HOLD_FROM = 0.90           # scroll fraction where the film holds its last frame while the page takes over
CHAPTERS = [0, 0.22, 0.46, 0.68]  # scroll fractions where headlines 1-4 begin (tuned to the film content)
FLOOR = 1.0                # minimum "visual weight" per source step, so slow parts still get frames
DESKTOP_W, DESKTOP_Q = 1600, 70
MOBILE_W, MOBILE_Q = 640, 62


def neutralise(im):
    """Pull gold tones toward neutral warm white; coral (hue ~0) is untouched."""
    h, s, v = im.convert('HSV').split()
    mask = h.point(lambda x: 255 if 14 <= x <= 46 else 0).filter(ImageFilter.GaussianBlur(6))
    s2 = Image.composite(s.point(lambda x: int(x * 0.35)), s, mask)
    return Image.merge('HSV', (h, s2, v)).convert('RGB')


shutil.rmtree(TMP, ignore_errors=True); os.makedirs(TMP)
for d in ('desktop', 'mobile'):
    shutil.rmtree(f'{OUT}/{d}', ignore_errors=True); os.makedirs(f'{OUT}/{d}')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, f'{TMP}/f_%03d.png'], check=True)
files = sorted(glob.glob(f'{TMP}/f_*.png'))
nsrc = len(files)

# --- measure the film (small grayscale + coral detection)
small = []
coral = []
for f in files:
    im = Image.open(f).convert('RGB').resize((480, 270), Image.BILINEAR)
    a = np.asarray(im).astype(np.int16)
    small.append(a.mean(axis=2).astype(np.float32))
    coral.append(((a[..., 0] - a[..., 1] > 40) & (a[..., 0] - a[..., 2] > 30)).mean() * 100)
small = np.array(small)
diff = np.abs(np.diff(small, axis=0)).mean(axis=(1, 2))      # change between source frame i and i+1
beam_start = int(np.argmax(np.array(coral) > 0.05)) - 3      # a few frames before the line shows
beam_start = max(10, beam_start)
last = nsrc - 1
print(f'source frames {nsrc}; coral line appears at frame {beam_start + 3} ({(beam_start + 3) / 24:.1f}s)')

# --- positions (fractional source-frame indexes) for each output frame
weight = np.maximum(diff, FLOOR)
cum = np.concatenate([[0], np.cumsum(weight[:beam_start])])
n_main = int(round(N * MAIN_SHARE))
n_beam = N - n_main
targets = np.linspace(0, cum[-1], n_main, endpoint=False)
main_pos = np.interp(targets, cum, np.arange(beam_start + 1))
beam_pos = np.linspace(beam_start, last, n_beam)
positions = np.concatenate([main_pos, beam_pos])
positions[-1] = last


@lru_cache(maxsize=4)
def frame(i):
    return neutralise(Image.open(files[i]).convert('RGB'))


sizes = {'desktop': 0, 'mobile': 0}
for k, pos in enumerate(positions, 1):
    f0 = int(np.floor(pos)); a = float(pos - f0)
    im = frame(f0) if (a < 0.03 or f0 >= last) else Image.blend(frame(f0), frame(f0 + 1), a)
    w, h = im.size
    d = im.resize((DESKTOP_W, round(DESKTOP_W * h / w)), Image.LANCZOS)
    d.save(f'{OUT}/desktop/f_{k:03d}.webp', quality=DESKTOP_Q, method=6)
    cw = round(h * 4 / 5)                      # centre-safe 4:5 crop for phones
    m = im.crop(((w - cw) // 2, 0, (w + cw) // 2, h)).resize((MOBILE_W, round(MOBILE_W * h / cw)), Image.LANCZOS)
    m.save(f'{OUT}/mobile/f_{k:03d}.webp', quality=MOBILE_Q, method=6)

shutil.copy(f'{OUT}/desktop/f_001.webp', f'{OUT}/poster-start.webp')
shutil.copy(f'{OUT}/desktop/f_{N:03d}.webp', f'{OUT}/poster-end.webp')
shutil.copy(f'{OUT}/mobile/f_001.webp', f'{OUT}/poster-start-mobile.webp')
shutil.copy(f'{OUT}/mobile/f_{N:03d}.webp', f'{OUT}/poster-end-mobile.webp')
json.dump({
    'count': N, 'desktop': '/assets/film/desktop/f_{n}.webp', 'mobile': '/assets/film/mobile/f_{n}.webp', 'pad': 3,
    'v': int(time.time()), 'holdFrom': HOLD_FROM, 'chapters': CHAPTERS, 'outroStart': HOLD_FROM
}, open(f'{OUT}/manifest.json', 'w'), indent=2)
size = lambda d: sum(os.path.getsize(p) for p in glob.glob(f'{OUT}/{d}/*')) / 1e6
print(f'{N} frames: desktop {size("desktop"):.1f} MB, mobile {size("mobile"):.1f} MB; coral range starts at output frame {n_main + 1}')
