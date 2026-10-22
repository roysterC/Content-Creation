"""Find dead stretches: frames where almost nothing moves for >= --min seconds.
Usage: python3 tools/check_motion.py video.mp4 [--min 0.8]   (also reports the loop seam)"""
import argparse, subprocess
import numpy as np
a = argparse.ArgumentParser(); a.add_argument('video'); a.add_argument('--min', type=float, default=0.8); a.add_argument('--fps', type=float, default=30)
o = a.parse_args()
w, h = 216, 384
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', o.video, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
v = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(v, axis=0)).mean((1, 2))
runs, s = [], None
for i, x in enumerate(list(d) + [1e9]):
    if x < 0.05:
        s = i if s is None else s
    else:
        if s is not None and (i - s) / o.fps >= o.min:
            runs.append((s, i))
        s = None
print(f'{len(v)} frames, median motion {np.median(d):.2f}')
print('static holds:', [(a_, b_, round((b_ - a_) / o.fps, 1)) for a_, b_ in runs] or 'none')
print(f'loop seam (last→first frame diff): {np.abs(v[-1] - v[0]).mean():.2f}')
