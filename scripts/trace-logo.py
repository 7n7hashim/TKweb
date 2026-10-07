"""Trace Blu's raster logo (1080px Instagram post) into SVG paths.
Marching squares at iso 0.5 on two scalar fields (white-ness, gold-ness), RDP simplification,
evenodd fill so counters (b, e, a) come out as holes."""
import numpy as np, json, sys
from PIL import Image, ImageFilter

SRC = sys.argv[1]
im = Image.open(SRC).convert('RGB').filter(ImageFilter.GaussianBlur(0.7))
a = np.asarray(im).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
Y = 0.299 * R + 0.587 * G + 0.114 * B   # luma is stored at full res; chroma is 4:2:0 in the JPEG
white = np.clip((Y - 35) / (255 - 35), 0, 1)   # navy Y=35, white Y=255

gold = np.clip((Y - 35) / (151 - 35), 0, 1)     # navy Y=35, gold Y=151 (white also passes; split by position later)

def march(f, iso=0.5):
    H, W = f.shape
    segs = []
    v = f
    for y in range(H - 1):
        row0, row1 = v[y], v[y + 1]
        for x in range(W - 1):
            tl, tr, br, bl = row0[x], row0[x + 1], row1[x + 1], row1[x]
            idx = (tl > iso) << 3 | (tr > iso) << 2 | (br > iso) << 1 | (bl > iso)
            if idx == 0 or idx == 15:
                continue
            def interp(p1, p2, v1, v2):
                t = (iso - v1) / (v2 - v1) if v2 != v1 else 0.5
                return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]))
            T = interp((x, y), (x + 1, y), tl, tr)
            Rr = interp((x + 1, y), (x + 1, y + 1), tr, br)
            Bb = interp((x, y + 1), (x + 1, y + 1), bl, br)
            L = interp((x, y), (x, y + 1), tl, bl)
            c = {1: [(L, Bb)], 2: [(Bb, Rr)], 3: [(L, Rr)], 4: [(T, Rr)], 5: [(L, T), (Bb, Rr)],
                 6: [(T, Bb)], 7: [(L, T)], 8: [(L, T)], 9: [(T, Bb)], 10: [(T, Rr), (L, Bb)],
                 11: [(T, Rr)], 12: [(L, Rr)], 13: [(Bb, Rr)], 14: [(L, Bb)]}[idx]
            segs.extend(c)
    return segs

def join(segs):
    key = lambda p: (round(p[0], 4), round(p[1], 4))
    adj = {}
    for a_, b_ in segs:
        adj.setdefault(key(a_), []).append(key(b_))
        adj.setdefault(key(b_), []).append(key(a_))
    used = set()
    loops = []
    for start in list(adj):
        if start in used: continue
        loop = [start]; used.add(start)
        prev, cur = None, start
        while True:
            nxt = [n for n in adj[cur] if n != prev and n not in used]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            used.add(cur); loop.append(cur)
        if len(loop) > 8:
            loops.append(loop)
    return loops

def rdp(pts, eps):
    if len(pts) < 3: return pts
    p = np.array(pts)
    s, e = p[0], p[-1]
    d = e - s
    n = np.hypot(*d)
    if n == 0:
        dist = np.hypot(*(p - s).T)
    else:
        dist = np.abs(d[0] * (p[:, 1] - s[1]) - d[1] * (p[:, 0] - s[0])) / n
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]

def simplify_closed(loop, eps):
    # split the ring at its farthest point pair for stable RDP on closed curves
    p = np.array(loop)
    i0 = 0
    i1 = int(np.argmax(np.hypot(*(p - p[0]).T)))
    a_ = rdp(loop[i0:i1 + 1], eps)
    b_ = rdp(loop[i1:] + [loop[0]], eps)
    return a_[:-1] + b_[:-1]

def area(loop):
    p = np.array(loop)
    return 0.5 * abs(np.dot(p[:, 0], np.roll(p[:, 1], 1)) - np.dot(p[:, 1], np.roll(p[:, 0], 1)))

out = {}
for name, field in (('white', white), ('gold', gold)):
    loops = join(march(field))
    res = []
    for lp in loops:
        if area(lp) < 30: continue
        s = simplify_closed(lp, 0.35)
        xs = [q[0] for q in s]; ys = [q[1] for q in s]
        res.append({'pts': [[float(q[0]), float(q[1])] for q in s], 'bbox': [float(min(xs)), float(min(ys)), float(max(xs)), float(max(ys))], 'area': float(area(lp))})
    out[name] = res
    print(name, len(res), 'loops')
json.dump(out, open(sys.argv[2], 'w'))
