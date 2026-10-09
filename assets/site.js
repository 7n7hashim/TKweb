/* Shared behaviour for every page (minified to site.min.js — see CLAUDE.md) */
(() => {
  /* navigator.webdriver: screenshot tooling — render final state, no motion */
  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver;
  if (reduceMotion) document.documentElement.classList.add('no-anim');

  /* Video autoplay: under reduced motion / screenshot tooling show the poster; otherwise
     kick muted inline playback explicitly — the autoplay attribute alone is unreliable
     across browsers, but a muted play() from script is permitted without a user gesture. */
  document.querySelectorAll('video[autoplay]').forEach((v) => {
    if (reduceMotion) {
      v.removeAttribute('autoplay');
      try { v.pause(); v.currentTime = 0; } catch (e) {}
      return;
    }
    v.muted = true; // required for gesture-free playback
    const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    tryPlay();
    v.addEventListener('canplay', tryPlay, { once: true });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) tryPlay(); }),
        { threshold: 0.25 }
      );
      io.observe(v);
    }
  });

  /* Scroll reveals */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-revealed'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* Three Promises — the line draws itself, and each photo reveals only once the line reaches it */
  const vSection = document.querySelector('[data-values-scroll]');
  if (vSection) {
    const line = vSection.querySelector('[data-values-line]');
    const blocks = Array.from(vSection.querySelectorAll('[data-values-block]'));
    const dots = Array.from(vSection.querySelectorAll('[data-values-dot]'));
    const endDot = vSection.querySelector('[data-values-dot-end]');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const lineEnd = 0.94; // scroll fraction at which the line finishes drawing

    let len = 0;
    let measured = false;
    // Fraction of the line's length at which it arrives at each photo (fallback until measured from geometry)
    let anchors = blocks.map((_, i) => [0.28, 0.56, 0.82][i] ?? 0.5);

    const svg = line && line.ownerSVGElement;

    // Walk the path and find the length-fraction of the point nearest a coordinate (viewBox units).
    const nearestFraction = (px, py) => {
      let best = Infinity;
      let bestLen = 0;
      const N = 800;
      for (let i = 0; i <= N; i++) {
        const l = (len * i) / N;
        const pt = line.getPointAtLength(l);
        const d = (pt.x - px) * (pt.x - px) + (pt.y - py) * (pt.y - py);
        if (d < best) { best = d; bestLen = l; }
      }
      return bestLen / len;
    };

    // The exact edge of each photo the line is meant to arrive at (its leading edge).
    const attachPoint = (b) => {
      const photo = b.querySelector('.values-photo') || b;
      const r = b.getBoundingClientRect();
      const x0 = r.left + photo.offsetLeft;
      const y0 = r.top + photo.offsetTop;
      const w = photo.offsetWidth;
      const h = photo.offsetHeight;
      switch (b.dataset.attach) {
        case 'center': return [x0 + w / 2, y0 + h / 2];
        case 'topleft': return [x0, y0];
        case 'topright': return [x0 + w, y0];
        case 'bottomleft': return [x0, y0 + h];
        case 'bottom': return [x0 + w / 2, y0 + h];
        case 'top': return [x0 + w / 2, y0];
        case 'left': return [x0, y0 + h / 2];
        case 'right': return [x0 + w, y0 + h / 2];
        default: return [x0 + w / 2, y0 + h / 2];
      }
    };

    const measure = () => {
      if (measured || !line || !svg) return;
      const L = line.getTotalLength();
      if (!L) return;
      len = L;
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
      const sr = svg.getBoundingClientRect();
      if (!sr.width || !sr.height) return; // stage not laid out yet — try again later
      // Convert each photo's leading edge into the SVG's viewBox space, then to a length-fraction.
      // Snap each anchor dot onto that exact point so the marks always sit on the photo corners.
      anchors = blocks.map((b, i) => {
        const [ax, ay] = attachPoint(b);
        const vx = ((ax - sr.left) / sr.width) * 1440;
        const vy = ((ay - sr.top) / sr.height) * 900;
        if (dots[i]) {
          dots[i].setAttribute('cx', String(vx));
          dots[i].setAttribute('cy', String(vy));
        }
        return nearestFraction(vx, vy);
      });
      measured = true;
    };

    const drawLine = (frac) => {
      if (line && len) line.style.strokeDashoffset = String(len * (1 - Math.min(Math.max(frac, 0), 1)));
    };
    const revealAll = () => {
      measure();
      drawLine(1);
      blocks.forEach((b) => b.classList.add('is-revealed'));
      dots.forEach((d) => d.classList.add('is-on'));
      if (endDot) endDot.classList.add('is-on');
    };

    /* Desktop: pin the stage, draw the line to scroll, reveal each photo the moment the line reaches it */
    let scrubBound = false;
    let ticking = false;
    const update = () => {
      ticking = false;
      const total = vSection.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-vSection.getBoundingClientRect().top, 0), Math.max(total, 0));
      const p = total > 0 ? scrolled / total : 0;
      const lineFrac = Math.min(p / lineEnd, 1);
      drawLine(lineFrac);
      // Fully reversible: reveal once the line reaches a photo, hide again once it retracts past it.
      // Each anchor dot lights up in the same instant as its photo; the terminus dot marks completion.
      blocks.forEach((b, i) => {
        const on = lineFrac >= anchors[i];
        b.classList.toggle('is-revealed', on);
        if (dots[i]) dots[i].classList.toggle('is-on', on);
      });
      if (endDot) endDot.classList.toggle('is-on', lineFrac >= 0.995);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    const bindScrub = () => {
      if (scrubBound) return;
      scrubBound = true;
      measure();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    };
    const unbindScrub = () => {
      if (!scrubBound) return;
      scrubBound = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };

    /* Mobile (motion on): the three promises stack, and a thin architectural line is inked
       down their left margin as you scroll. Each photo is wiped in from that line the moment
       the ink reaches it; its node lights and a short connector draws across to the card, with
       the heading + copy staggering in — the desktop line-draw language, tuned to one column. */
    const mspine = vSection.querySelector('[data-values-mspine]');
    const mnodes = Array.from(vSection.querySelectorAll('[data-values-mnode]'));
    let mAnchors = [];
    let mBound = false, mTick = false, mLineMax = 0;

    // Photo centre of a block, in the canvas's coordinate space (both share the same
    // positioned ancestor, so the fraction stays stable while the page scrolls).
    const photoCentre = (b) => {
      const photo = b.querySelector('.values-photo') || b;
      return b.offsetTop + photo.offsetTop + photo.offsetHeight / 2;
    };
    const measureSpine = () => {
      if (!mspine || blocks.length < 2) return false;
      const y0 = photoCentre(blocks[0]);
      const h = photoCentre(blocks[blocks.length - 1]) - y0;
      if (h <= 0) return false;
      mspine.style.top = y0 + 'px';
      mspine.style.height = h + 'px';
      mAnchors = blocks.map((b) => (photoCentre(b) - y0) / h);
      mnodes.forEach((n, i) => { if (mAnchors[i] != null) n.style.top = (mAnchors[i] * h) + 'px'; });
      return true;
    };

    const mUpdate = () => {
      mTick = false;
      if (!mspine) return;
      const r = mspine.getBoundingClientRect();
      if (!r.height) return;
      const readY = window.innerHeight * 0.72;         // reveal line sits low, so cards ink in as they rise
      const raw = (readY - r.top) / r.height;           // unclamped: negative until the spine is reached
      const draw = Math.min(Math.max(raw, 0), 1);
      if (draw > mLineMax) mLineMax = draw;             // latch: the inked line only grows, never retracts
      mspine.style.setProperty('--mline', mLineMax.toFixed(4));
      blocks.forEach((b, i) => {
        if (raw >= mAnchors[i]) {                        // latch: once a promise inks in, it stays revealed
          b.classList.add('is-revealed');
          if (mnodes[i]) mnodes[i].classList.add('is-on');
        }
      });
    };
    const mOnScroll = () => { if (!mTick) { mTick = true; requestAnimationFrame(mUpdate); } };
    const mOnResize = () => { measureSpine(); mOnScroll(); };

    const bindMobileSpine = () => {
      if (mBound) return;
      mBound = true;
      vSection.classList.add('values-mspine-on');
      const ok = measureSpine();
      window.addEventListener('scroll', mOnScroll, { passive: true });
      window.addEventListener('resize', mOnResize);
      // Heights depend on image aspect-ratio boxes; re-measure once layout has settled.
      requestAnimationFrame(() => { measureSpine(); mUpdate(); });
      if (ok) mUpdate();
    };
    const unbindMobileSpine = () => {
      if (!mBound) return;
      mBound = false;
      vSection.classList.remove('values-mspine-on');
      window.removeEventListener('scroll', mOnScroll);
      window.removeEventListener('resize', mOnResize);
    };

    const apply = () => {
      unbindScrub();
      unbindMobileSpine();
      if (reduceMotion) {
        vSection.classList.add('values-static');
        revealAll();
        if (!desktop.matches) measureSpine(); // place the static spine's nodes on mobile
      } else if (desktop.matches) {
        vSection.classList.remove('values-static');
        bindScrub();
      } else {
        vSection.classList.add('values-static');
        bindMobileSpine();
      }
    };
    apply();
    if (!reduceMotion) desktop.addEventListener('change', apply);
  }

  /* Why us — pinned stage. The incoming photo rises from the bottom of the
     viewport (emerging from behind the topic bar), lands in its slot and physically pushes
     the previous photo up and away; the copy moves in the same instant. Everything is a
     pure function of scroll progress, so scrolling back reverses it exactly. */
  const wSection = document.querySelector('[data-why-scroll]');
  if (wSection) {
    const topics = Array.from(wSection.querySelectorAll('[data-why-topic]'));
    const medias = topics.map((t) => t.querySelector('.why-media'));
    const bodies = topics.map((t) => t.querySelector('.why-body'));
    const barItems = Array.from(wSection.querySelectorAll('[data-why-go]'));
    const railCur = wSection.querySelector('[data-why-current]');
    const hint = wSection.querySelector('[data-why-hint]');
    const N = topics.length;
    const desktop = window.matchMedia('(min-width: 1024px)');

    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const smooth = (t) => t * t * (3 - 2 * t);

    /* Transition k (topic k-1 → k) plays over the scroll window [e_k - dur, e_k]. */
    const start = 0.06;
    const end = 0.92;
    const step = N > 1 ? (end - start) / (N - 1) : 1;
    const dur = step * 0.62;
    const trans = (k, p) => easeInOut(clamp01((p - (start + step * k - dur)) / dur));

    /* Geometry: S0 = how far below its slot a card starts (just off the bottom of the
       viewport); contactY = the travel remaining when it touches the card above it. */
    let S0 = 0;
    let contactY = 0;
    const measure = () => {
      const m = medias[0];
      if (!m || !m.offsetHeight) return;
      S0 = window.innerHeight - m.offsetTop + 28;
      contactY = m.offsetHeight + 26;
    };

    const render = (p) => {
      let T = 0;
      for (let k = 1; k < N; k++) T += trans(k, p);
      for (let i = 0; i < N; i++) {
        const fIn = i === 0 ? 1 : trans(i, p);
        const fOut = i === N - 1 ? 0 : trans(i + 1, p);
        const ms = medias[i].style;
        const bs = bodies[i].style;
        if (fOut > 0) {
          /* the next card is rising: rest until it makes contact, then be pushed up and away */
          const cyNext = S0 * (1 - fOut);
          const fc = 1 - contactY / S0; /* fOut at the instant of contact */
          ms.setProperty('--cy', Math.min(cyNext - contactY, 0).toFixed(1) + 'px');
          ms.setProperty('--co', (1 - smooth(clamp01((fOut - fc) / (0.94 - fc)))).toFixed(3));
          const g = smooth(clamp01((fOut - 0.12) / 0.55));
          bs.setProperty('--to', (1 - g).toFixed(3));
          bs.setProperty('--ty', (-26 * g).toFixed(1) + 'px');
        } else {
          /* rising from the bottom of the viewport into (or resting in) the slot */
          ms.setProperty('--cy', (S0 * (1 - fIn)).toFixed(1) + 'px');
          ms.setProperty('--co', '1');
          const a = smooth(clamp01((fIn - 0.35) / 0.55));
          bs.setProperty('--to', a.toFixed(3));
          bs.setProperty('--ty', (30 * (1 - a)).toFixed(1) + 'px');
        }
      }
      const idx = Math.max(0, Math.min(N - 1, Math.round(T)));
      barItems.forEach((b, i) => b.classList.toggle('is-on', i === idx));
      if (railCur) railCur.textContent = String(idx + 1).padStart(2, '0');
      if (hint) hint.style.opacity = (1 - smooth(clamp01(p / 0.1))).toFixed(3);
    };
    const clearVars = () => {
      topics.forEach((t, i) => {
        ['--cy', '--co'].forEach((v) => medias[i].style.removeProperty(v));
        ['--to', '--ty'].forEach((v) => bodies[i].style.removeProperty(v));
      });
      if (hint) hint.style.removeProperty('opacity');
    };

    let scrubBound = false;
    let ticking = false;
    const update = () => {
      ticking = false;
      const total = wSection.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-wSection.getBoundingClientRect().top, 0), Math.max(total, 0));
      render(total > 0 ? scrolled / total : 0);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    const bindScrub = () => {
      if (scrubBound) return;
      scrubBound = true;
      measure();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      update();
    };
    const unbindScrub = () => {
      if (!scrubBound) return;
      scrubBound = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };

    /* Topic bar: jump to the middle of a topic's resting hold */
    const goTo = (i) => {
      const total = wSection.offsetHeight - window.innerHeight;
      const holdStart = i === 0 ? 0 : start + step * i;
      const holdEnd = i === N - 1 ? 1 : start + step * (i + 1) - dur;
      const top = wSection.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.round(top + ((holdStart + holdEnd) / 2) * total), behavior: 'smooth' });
    };
    barItems.forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.whyGo))));

    let whyIO = null;
    const bindMobileReveal = () => {
      if ('IntersectionObserver' in window) {
        whyIO = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                whyIO.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
        );
        topics.forEach((t) => whyIO.observe(t));
      } else {
        topics.forEach((t) => t.classList.add('is-in'));
      }
    };
    const unbindMobileReveal = () => {
      if (whyIO) {
        whyIO.disconnect();
        whyIO = null;
      }
    };

    const applyWhy = () => {
      unbindScrub();
      unbindMobileReveal();
      if (reduceMotion) {
        wSection.classList.add('why-static');
        clearVars();
        topics.forEach((t) => t.classList.add('is-in'));
      } else if (desktop.matches) {
        wSection.classList.remove('why-static');
        topics.forEach((t) => t.classList.remove('is-in'));
        bindScrub();
      } else {
        wSection.classList.add('why-static');
        clearVars();
        bindMobileReveal();
      }
    };
    applyWhy();
    if (!reduceMotion) desktop.addEventListener('change', applyWhy);
  }


  /* Buying off-plan — a build clip scrubbed by scroll, drawn frame-by-frame on a
     canvas. Same pinned-stage pattern as the sections above: progress is a pure
     function of scroll, so scrubbing back reverses the build exactly. Frames are
     pre-extracted WebP stills (see extract-frames.mjs), so there is no video-seek
     stutter and no HTTP Range dependency. */
  const bSection = document.querySelector('[data-build-scroll]');
  if (bSection) {
    const canvas = bSection.querySelector('.build-canvas');
    const wrap = bSection.querySelector('.build-frame-wrap');
    const overlay = bSection.querySelector('.build-overlay');
    const caps = Array.from(bSection.querySelectorAll('[data-build-cap]'));
    const bar = bSection.querySelector('.build-progress-bar');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const SRC_FRAMES = 120;
    // Desktop scrubs a subsampled set (not all 120): 80 frames over a 340vh scroll is ~42px
    // of scroll per frame — visually continuous — while cutting a third of the payload and the
    // request burst. Mobile scrubs a lighter set still. Both stream in progressively (frame 0
    // paints first, the rest follow), so the section is usable the instant it is reached.
    const DESKTOP_FRAMES = 80;
    const MOBILE_FRAMES = 40;

    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
    const frameURL = (i) => `brand_assets/build-frames/frame-${String(i).padStart(3, '0')}.webp`;
    // Evenly pick n source-frame numbers across the full clip (always includes 0 and last).
    const sampleIndices = (n) =>
      Array.from({ length: n }, (_, i) => Math.round((i * (SRC_FRAMES - 1)) / (n - 1)));

    // alpha:true so an undrawn canvas is transparent and the poster underneath shows through
    // (never a black flash) until the first frame is decoded and painted over it.
    const ctx = canvas.getContext('2d', { alpha: true });
    let frames = [];    // Image objects for the active set (parallel to its source indices)
    let count = 0;      // number of frames in the active set
    let dpr = 1;
    let lastIdx = -1;

    const sizeCanvas = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      lastIdx = -1; // force a redraw at the new size
    };

    const isReady = (img) => !!(img && img.complete && img.naturalWidth);
    // The frame for idx may not have loaded yet (frames stream in). Fall back to the nearest
    // frame that IS ready so the scrub keeps moving instead of freezing on a stale frame —
    // as the exact frames arrive, subsequent redraws sharpen to them.
    const nearestReady = (idx) => {
      if (isReady(frames[idx])) return idx;
      for (let d = 1; d < count; d++) {
        if (idx - d >= 0 && isReady(frames[idx - d])) return idx - d;
        if (idx + d < count && isReady(frames[idx + d])) return idx + d;
      }
      return -1;
    };
    const drawFrame = (idx) => {
      if (!canvas.width) return false;
      const use = nearestReady(idx);
      if (use < 0) return false;
      const img = frames[use];
      const cw = canvas.width, ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
      let dw, dh;
      if (ir > cr) { dh = ch; dw = ch * ir; } else { dw = cw; dh = cw / ir; }
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return true;
    };

    const render = (p) => {
      p = clamp01(p);
      const idx = count ? Math.round(p * (count - 1)) : 0;
      if (idx !== lastIdx) { drawFrame(idx); lastIdx = idx; }
      // entrance: frame fades + settles over the first slice
      const intro = smooth(p / 0.05);
      if (wrap) {
        wrap.style.setProperty('--build-fo', (0.4 + 0.6 * intro).toFixed(3));
        wrap.style.setProperty('--build-fs', (0.972 + 0.028 * intro).toFixed(4));
        wrap.style.setProperty('--build-fy', ((1 - intro) * 26 + (6 - 12 * p)).toFixed(1) + 'px');
      }
      // headline fades out as the build begins
      if (overlay) {
        const ho = 1 - smooth(p / 0.1);
        overlay.style.setProperty('--build-ho', ho.toFixed(3));
        overlay.style.setProperty('--build-hy', (-22 * (1 - ho)).toFixed(1) + 'px');
      }
      // captions: the active stage is signalled by colour + weight (.is-on), so the
      // opacity only breathes within a high, always-readable band — inactive stages
      // never wash out. Outer ends stay fully lit at p=0 (Foundation) and p=1 (Finished).
      const seg = p * caps.length;
      caps.forEach((c, i) => {
        const d = seg < i ? i - seg : (seg > i + 1 ? seg - (i + 1) : 0);
        const on = clamp01(1 - d / 0.4);
        c.style.opacity = (0.82 + 0.18 * smooth(on)).toFixed(3);
        c.classList.toggle('is-on', on > 0.6);
      });
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };

    let scrubBound = false, ticking = false;
    const update = () => {
      ticking = false;
      const total = bSection.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-bSection.getBoundingClientRect().top, 0), Math.max(total, 0));
      render(total > 0 ? scrolled / total : 0);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const onResize = () => { sizeCanvas(); onScroll(); };
    const bindScrub = () => {
      if (scrubBound) return;
      scrubBound = true;
      sizeCanvas();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      update();
    };
    const unbindScrub = () => {
      if (!scrubBound) return;
      scrubBound = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };

    // Load a frame set progressively. Resolves the moment the FIRST frame is ready so the
    // scrub can bind and paint immediately — the rest keep streaming in and repaint live if
    // they happen to be the frame currently on screen. `loadedKey` lets a breakpoint change
    // reuse an already-loaded set instead of re-fetching it. Frame 0 loads first so the
    // opening paint (progress ≈ 0) is always a valid image, never a blank canvas.
    let loadedKey = null;
    const preload = (idxList, key) => new Promise((resolve) => {
      count = idxList.length;
      frames = new Array(count);
      lastIdx = -1;
      loadedKey = key;
      let resolved = false;
      const settle = (i) => {
        // repaint the current scroll position with the best frame available so far, so the
        // visible frame sharpens toward the exact one as neighbouring frames stream in
        drawFrame(lastIdx < 0 ? 0 : lastIdx);
        if (i === 0 && !resolved) { resolved = true; resolve(); }
      };
      const load = (i) => {
        const img = new Image();
        img.decoding = 'async';
        const done = () => settle(i);
        // decode explicitly so drawImage always has a ready bitmap — Safari otherwise paints
        // a freshly-loaded, not-yet-decoded image as blank onto the canvas (a frozen frame)
        img.onload = () => { if (img.decode) img.decode().then(done, done); else done(); };
        img.onerror = done;
        frames[i] = img;
        img.src = frameURL(idxList[i]);
      };
      load(0);
      for (let i = 1; i < count; i++) load(i);
    });

    const setMode = (m) => {
      bSection.classList.remove('build-mode-scrub', 'build-mode-static');
      bSection.classList.add(m);
    };
    // Strip any inline styles render() left behind so the collapsed layout's CSS wins
    // (matters when the viewport changes from the pinned mode to a collapsed one).
    const clearScrubInline = () => {
      caps.forEach((c) => { c.style.removeProperty('opacity'); c.classList.remove('is-on'); });
      if (overlay) { overlay.style.removeProperty('--build-ho'); overlay.style.removeProperty('--build-hy'); }
      if (wrap) ['--build-fo', '--build-fs', '--build-fy'].forEach((v) => wrap.style.removeProperty(v));
      if (bar) bar.style.removeProperty('transform');
    };

    // Begin a scrub for the current breakpoint. Desktop loads its full set immediately
    // (unchanged); mobile defers the load until the section is ~1.5 screens away.
    let nearObserver = null;
    const startScrub = (idxList, key, lazy) => {
      const go = () => {
        const ready = (loadedKey === key) ? Promise.resolve() : preload(idxList, key);
        ready.then(() => { sizeCanvas(); bindScrub(); });
      };
      if (!lazy || !('IntersectionObserver' in window)) { go(); return; }
      nearObserver = new IntersectionObserver((entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) { obs.disconnect(); nearObserver = null; go(); }
      }, { rootMargin: '150% 0px' });
      nearObserver.observe(bSection);
    };

    const apply = () => {
      unbindScrub();
      if (nearObserver) { nearObserver.disconnect(); nearObserver = null; }
      if (reduceMotion) {
        // reduced motion / screenshot tooling: static finished-home still in normal flow
        clearScrubInline();
        setMode('build-mode-static');
      } else if (desktop.matches) {
        // Lazy on desktop too: the ~120-frame set no longer fires at page load competing
        // with the hero — it warms only once the section is ~1.5 screens away, so first
        // paint stays light and the scrub is ready by the time it's reached.
        setMode('build-mode-scrub');
        startScrub(sampleIndices(DESKTOP_FRAMES), 'desktop', true);
      } else {
        // mobile + motion: same pinned scrub, tuned lighter and lazy-loaded
        setMode('build-mode-scrub');
        startScrub(sampleIndices(MOBILE_FRAMES), 'mobile', true);
      }
    };
    apply();
    if (!reduceMotion) desktop.addEventListener('change', apply);
  }

  /* Our Projects — native horizontal showcase. Arrow buttons + drag scroll the track;
     each card glides in the moment it enters the track's viewport. Pure horizontal scroll,
     so it stays one screen tall and reverses naturally. */
  const pTrack = document.querySelector('[data-proj-track]');
  if (pTrack) {
    const prevBtn = document.querySelector('[data-proj-prev]');
    const nextBtn = document.querySelector('[data-proj-next]');
    const cards = Array.from(pTrack.querySelectorAll('.proj-card'));

    const cardStep = () => {
      const first = cards[0];
      const gap = parseFloat(getComputedStyle(pTrack).columnGap) || 26;
      return first ? first.getBoundingClientRect().width + gap : pTrack.clientWidth * 0.8;
    };

    let arrowTick = false;
    const updateArrows = () => {
      arrowTick = false;
      const max = pTrack.scrollWidth - pTrack.clientWidth;
      if (prevBtn) prevBtn.disabled = pTrack.scrollLeft <= 6;
      if (nextBtn) nextBtn.disabled = pTrack.scrollLeft >= max - 6;
      const idle = max <= 6;
      if (prevBtn) prevBtn.classList.toggle('is-idle', idle);
      if (nextBtn) nextBtn.classList.toggle('is-idle', idle);
    };
    const onTrackScroll = () => {
      if (!arrowTick) { arrowTick = true; requestAnimationFrame(updateArrows); }
    };

    /* rAF-driven smooth scroll — reliable across browsers (native smooth scrollBy fights
       scroll-snap in some engines) and honours reduced motion. */
    let scrollAnim = null;
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const scrollByStep = (delta) => {
      const max = pTrack.scrollWidth - pTrack.clientWidth;
      const from = pTrack.scrollLeft;
      const to = Math.max(0, Math.min(from + delta, max));
      const dist = to - from;
      if (Math.abs(dist) < 1) return;
      if (scrollAnim) cancelAnimationFrame(scrollAnim);
      if (reduceMotion) { pTrack.scrollLeft = to; return; }
      const dur = 520;
      const t0 = performance.now();
      const stepFrame = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        pTrack.scrollLeft = from + dist * easeInOut(p);
        if (p < 1) scrollAnim = requestAnimationFrame(stepFrame);
      };
      scrollAnim = requestAnimationFrame(stepFrame);
    };

    if (prevBtn) prevBtn.addEventListener('click', () => scrollByStep(-cardStep()));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollByStep(cardStep()));
    pTrack.addEventListener('scroll', onTrackScroll, { passive: true });
    window.addEventListener('resize', onTrackScroll);
    updateArrows();

    /* Drag-to-scroll (mouse only — touch already scrolls natively). Only counts as a drag
       past a small threshold, so a click still opens the card. */
    if (!reduceMotion) {
      let down = false, startX = 0, startLeft = 0, moved = false;
      pTrack.style.cursor = 'grab';
      pTrack.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (scrollAnim) cancelAnimationFrame(scrollAnim);
        down = true; moved = false; startX = e.clientX; startLeft = pTrack.scrollLeft;
        pTrack.style.cursor = 'grabbing';
      });
      pTrack.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 6) moved = true;
        pTrack.scrollLeft = startLeft - dx;
      });
      const endDrag = () => { down = false; pTrack.style.cursor = 'grab'; };
      pTrack.addEventListener('pointerup', endDrag);
      pTrack.addEventListener('pointerleave', endDrag);
      pTrack.addEventListener('click', (e) => { if (moved) { e.preventDefault(); } }, true);
    }

    /* Glide-in reveal, driven by the section entering the (vertical) viewport — NOT by
       horizontal track scroll. So the moment the carousel is reached, the visible cards
       cascade in together, and the off-screen cards are revealed too (ready in their final
       state the instant they're scrolled to). Nothing stays hidden waiting for interaction. */
    if (reduceMotion || !('IntersectionObserver' in window)) {
      cards.forEach((c) => c.classList.add('is-in'));
    } else {
      pTrack.classList.add('is-armed');
      cards.forEach((c, i) => c.style.setProperty('--proj-delay', (i % 3) * 90 + 'ms'));
      const io = new IntersectionObserver(
        (entries, obs) => {
          if (entries.some((e) => e.isIntersecting)) {
            cards.forEach((c) => c.classList.add('is-in'));
            obs.disconnect();
          }
        },
        { threshold: 0.18 }
      );
      io.observe(pTrack);
    }
  }

  /* Properties — filter the grid by purpose (all / sale / rent / development), location, type and
     minimum bedrooms without a reload. Cards carry data-purpose, data-location, data-type and
     data-beds (generated by build-pages.mjs). The filters read from and write to the URL
     (?purpose=&location=&type=&beds=), so footer location links, service links and the back
     button all land on the right results. Guarded by the form, so other pages are a no-op. */
  const search = document.querySelector('[data-search]');
  if (search) {
    const purposeBtns = Array.from(search.querySelectorAll('[data-purpose]'));
    const selects = Array.from(search.querySelectorAll('[data-filter]'));
    const grid = document.querySelector('[data-dev-grid]');
    const cards = grid ? Array.from(grid.querySelectorAll('[data-dev-card]')) : [];
    const countEl = document.querySelector('[data-results-count]');
    const emptyEl = document.querySelector('[data-results-empty]');
    const clearBtns = document.querySelectorAll('[data-results-clear]');
    const state = { purpose: 'all', location: 'all', type: 'all', beds: '0' };
    const LABEL = { sale: 'for sale', rent: 'to let', development: 'new developments' };

    const apply = (animate) => {
      purposeBtns.forEach((b) => {
        const on = b.dataset.purpose === state.purpose;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      selects.forEach((sel) => { sel.value = state[sel.dataset.filter]; });
      let shown = 0;
      cards.forEach((card) => {
        const d = card.dataset;
        const match = (state.purpose === 'all' || d.purpose === state.purpose) &&
          (state.location === 'all' || d.location === state.location) &&
          (state.type === 'all' || d.type === state.type) &&
          (Number(d.beds || 0) >= Number(state.beds));
        card.classList.toggle('is-hidden', !match);
        card.classList.remove('just-in');
        if (match) {
          shown++;
          card.classList.add('is-revealed'); // never leave a filtered-in card waiting on the scroll reveal
          if (animate && !reduceMotion) { void card.offsetWidth; card.classList.add('just-in'); }
        }
      });
      const filtered = state.purpose !== 'all' || state.location !== 'all' || state.type !== 'all' || state.beds !== '0';
      if (countEl) {
        const what = state.purpose === 'all' ? 'listings' : LABEL[state.purpose];
        const loc = state.location !== 'all' ? selects.find((x) => x.dataset.filter === 'location') : null;
        const where = loc ? ` in ${loc.options[loc.selectedIndex].text}` : '';
        countEl.innerHTML = filtered
          ? `Showing <b>${shown}</b> of ${cards.length} ${what === 'listings' ? 'listings' : `— ${what}`}${where}`
          : `Showing all <b>${cards.length}</b> listings`;
      }
      if (emptyEl) emptyEl.hidden = shown !== 0;
      clearBtns.forEach((b) => { if (b.closest('.results-bar')) b.hidden = !filtered; });
      const params = new URLSearchParams();
      Object.entries(state).forEach(([k, v]) => { if (v !== 'all' && v !== '0') params.set(k, v); });
      const qs = params.toString();
      history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    };

    const fromUrl = new URLSearchParams(window.location.search);
    Object.keys(state).forEach((k) => {
      const v = fromUrl.get(k);
      if (!v) return;
      if (k === 'purpose' && !purposeBtns.some((b) => b.dataset.purpose === v)) return;
      const sel = selects.find((x) => x.dataset.filter === k);
      if (sel && !Array.from(sel.options).some((o) => o.value === v)) return;
      state[k] = v;
    });
    purposeBtns.forEach((b) => b.addEventListener('click', () => { state.purpose = b.dataset.purpose; apply(true); }));
    selects.forEach((sel) => sel.addEventListener('change', () => { state[sel.dataset.filter] = sel.value; apply(true); }));
    clearBtns.forEach((b) => b.addEventListener('click', () => {
      Object.assign(state, { purpose: 'all', location: 'all', type: 'all', beds: '0' }); apply(true);
    }));
    search.addEventListener('submit', (e) => e.preventDefault());
    apply(false);
  }

  /* Floor plans — tabs over the plan panels; a unit row's "Floor plan" link opens its tab. */
  const plans = document.querySelector('[data-plans]');
  if (plans) {
    const tabs = Array.from(plans.querySelectorAll('[data-plan-tab]'));
    const show = (key, focus) => {
      tabs.forEach((t) => {
        const on = t.dataset.planTab === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
        if (on && focus) t.focus();
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(t.dataset.planTab));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        show(n.dataset.planTab, true);
      });
    });
    document.querySelectorAll('[data-plan-go]').forEach((a) => a.addEventListener('click', () => show(a.dataset.planGo)));
  }

  /* Mobile navigation */
  const navToggle = document.getElementById('nav-toggle');
  const navPanel = document.getElementById('nav-panel');
  if (navToggle && navPanel) {
    navToggle.addEventListener('click', () => {
      const open = navPanel.classList.toggle('hidden') === false;
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* Enquiry modal — a short form that opens over a page and hands the message to WhatsApp.
     One trigger type ([data-enquire-open]); data-mode="viewing" turns it into a viewing booking
     with a date and a time of day. The modal is built once and injected. The trigger is a
     progressive-enhancement link (falls back to contact.html without JS). The "home" options are
     read from the page's own unit rows, so they always match the listing. The number comes from
     <meta name="whatsapp">, written by build-pages.mjs from BRAND in site-data.mjs. */
  const waMeta = document.querySelector('meta[name="whatsapp"]');
  const WA_NUMBER = waMeta ? waMeta.content : '';
  const openWhatsApp = (text) => {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    // 'noopener' as a window feature makes open() return null, which would trip the fallback below
    // even when the tab opened; cut the opener link by hand instead.
    const win = window.open(url, '_blank');
    if (win) win.opener = null;
    else window.location.href = url; // pop-up blocked: go in this tab
  };
  const enquireOpeners = document.querySelectorAll('[data-enquire-open]');
  if (enquireOpeners.length) {
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const homes = Array.from(new Set(Array.from(document.querySelectorAll('[data-residence]')).map((el) => el.dataset.residence)));
    const wrap = document.createElement('div');
    wrap.className = 'enquire';
    wrap.hidden = true;
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="enquire-overlay" data-enquire-close></div>' +
      '<div class="enquire-dialog" role="dialog" aria-modal="true" aria-labelledby="enquire-title">' +
        '<button type="button" class="enquire-x" data-enquire-close aria-label="Close the form">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<p class="enquire-eyebrow" data-enq-eyebrow>Enquiry</p>' +
        '<h2 class="enquire-title" id="enquire-title"><span data-enq-verb>Ask about</span> <span data-dev-name></span></h2>' +
        '<p class="enquire-sub">WhatsApp opens with your message written out. Nothing is sent until you press send there.</p>' +
        '<form class="enquire-form" data-enquire-form novalidate>' +
          '<div class="field"><label for="enq-name">Your name</label><input id="enq-name" name="name" type="text" autocomplete="name" required></div>' +
          '<div class="field"><label for="enq-dev">Property</label><input id="enq-dev" name="development" type="text" data-dev-field readonly></div>' +
          '<div class="field" data-viewing-field hidden><label for="enq-date">Preferred date</label><input id="enq-date" name="date" type="date"></div>' +
          '<div class="field" data-viewing-field hidden><label for="enq-time">Time of day</label>' +
            '<select id="enq-time" name="time"><option>Morning</option><option>Midday</option><option>Afternoon</option><option>Evening</option></select></div>' +
          (homes.length ? '<div class="field field-full"><label for="enq-res">Which home <span>(optional)</span></label>' +
            '<select id="enq-res" name="residence">' +
              '<option value="">Not sure yet</option>' +
              homes.map((h) => `<option>${esc(h)}</option>`).join('') +
            '</select></div>' : '') +
          '<div class="field field-full"><label for="enq-msg">Question <span>(optional)</span></label><textarea id="enq-msg" name="message" rows="4" placeholder="Is it still available? Anything you would like to know?"></textarea></div>' +
          '<div class="enquire-actions">' +
            '<button type="button" class="enquire-cancel" data-enquire-close>Close</button>' +
            '<button type="submit" class="enquire-submit">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z"/></svg>' +
              'Open in WhatsApp</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(wrap);

    const dialog = wrap.querySelector('.enquire-dialog');
    const form = wrap.querySelector('[data-enquire-form]');
    const devNames = wrap.querySelectorAll('[data-dev-name]');
    const viewingFields = wrap.querySelectorAll('[data-viewing-field]');
    const verb = wrap.querySelector('[data-enq-verb]');
    const eyebrow = wrap.querySelector('[data-enq-eyebrow]');
    const dateField = wrap.querySelector('#enq-date');
    if (dateField) dateField.min = new Date().toISOString().slice(0, 10);
    let mode = 'enquiry';
    const devField = wrap.querySelector('[data-dev-field]');
    const resField = wrap.querySelector('#enq-res');
    let lastFocus = null;

    const setDev = (name) => {
      devNames.forEach((el) => (el.textContent = name || 'a listing'));
      if (devField) devField.value = name || '';
    };
    setDev(enquireOpeners[0].getAttribute('data-development') || '');

    const finishClose = () => { wrap.hidden = true; dialog.removeEventListener('transitionend', finishClose); };
    const open = (opener) => {
      if (opener && opener.dataset.development) setDev(opener.dataset.development);
      mode = (opener && opener.dataset.mode) || 'enquiry';
      const viewing = mode === 'viewing';
      viewingFields.forEach((f) => (f.hidden = !viewing));
      if (verb) verb.textContent = viewing ? 'Book a viewing of' : 'Ask about';
      if (eyebrow) eyebrow.textContent = viewing ? 'Book a viewing' : 'Enquiry';
      /* A unit-row trigger arrives with its home already chosen. */
      if (resField) resField.value = (opener && opener.dataset.residence) || '';
      lastFocus = opener || document.activeElement;
      wrap.hidden = false;
      void wrap.offsetWidth; // reflow so the fade-and-scale plays
      wrap.classList.add('is-open');
      wrap.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const first = wrap.querySelector('#enq-name');
      if (first) first.focus();
    };
    const close = () => {
      if (wrap.hidden) return;
      wrap.classList.remove('is-open');
      wrap.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (reduceMotion) finishClose();
      else dialog.addEventListener('transitionend', finishClose);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    enquireOpeners.forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(b); }));
    wrap.querySelectorAll('[data-enquire-close]').forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wrap.hidden) close(); });

    /* keep Tab focus inside the dialog while it is open */
    wrap.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const items = Array.from(wrap.querySelectorAll('button, input, select, textarea, a[href]'))
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const name = String(d.get('name') || '').trim();
      const home = String(d.get('residence') || '').trim();
      const msg = String(d.get('message') || '').trim();
      const what = `${d.get('development') || 'one of your properties'}${home ? ` (${home})` : ''}`;
      let text = `Hello${name ? `, this is ${name}` : ''}. `;
      if (mode === 'viewing') {
        const date = String(d.get('date') || '').trim();
        const when = date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
        text += `I'd like to book a viewing of ${what}${when ? ` on ${when}` : ''}, ${String(d.get('time') || 'any time').toLowerCase()} if possible.`;
      } else {
        text += `I'm interested in ${what}.`;
      }
      openWhatsApp(text + (msg ? `\n\n${msg}` : ''));
      close();
    });
  }

  /* Shared image lightbox — one instance serves every residence gallery and
     amenity shot on the page. Built on first open, then reused. Follows the
     enquiry modal's idiom above: [hidden] + .is-open, scroll lock, Escape,
     focus trap, focus restore. */
  const lightbox = (() => {
    let wrap = null, dialog = null, imgEl = null, countEl = null;
    let items = [], index = 0, lastFocus = null;

    const render = () => {
      const item = items[index];
      if (!item) return;
      imgEl.src = item.src;
      imgEl.alt = item.alt || '';
      countEl.textContent = `${index + 1} / ${items.length}`;
      const multiple = items.length > 1;
      wrap.querySelectorAll('.lbox-arrow').forEach((a) => (a.hidden = !multiple));
    };

    const step = (delta) => {
      if (!items.length) return;
      index = (index + delta + items.length) % items.length;
      render();
    };

    const finishClose = () => {
      wrap.hidden = true;
      dialog.removeEventListener('transitionend', finishClose);
    };

    const close = () => {
      if (!wrap || wrap.hidden) return;
      wrap.classList.remove('is-open');
      wrap.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (reduceMotion) finishClose();
      else dialog.addEventListener('transitionend', finishClose);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    const build = () => {
      wrap = document.createElement('div');
      wrap.className = 'lbox';
      wrap.hidden = true;
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML =
        '<div class="lbox-overlay" data-lbox-close></div>' +
        '<div class="lbox-dialog" role="dialog" aria-modal="true" aria-label="Image viewer">' +
          '<button type="button" class="lbox-x" data-lbox-close aria-label="Close image viewer">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          '</button>' +
          '<div class="lbox-stage">' +
            '<img class="lbox-img" alt="">' +
            '<button type="button" class="lbox-arrow lbox-prev" data-lbox-prev aria-label="Previous image">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>' +
            '</button>' +
            '<button type="button" class="lbox-arrow lbox-next" data-lbox-next aria-label="Next image">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>' +
            '</button>' +
          '</div>' +
          '<p class="lbox-count" aria-live="polite"></p>' +
        '</div>';
      document.body.appendChild(wrap);

      dialog = wrap.querySelector('.lbox-dialog');
      imgEl = wrap.querySelector('.lbox-img');
      countEl = wrap.querySelector('.lbox-count');

      wrap.querySelectorAll('[data-lbox-close]').forEach((b) => b.addEventListener('click', close));
      wrap.querySelector('[data-lbox-prev]').addEventListener('click', () => step(-1));
      wrap.querySelector('[data-lbox-next]').addEventListener('click', () => step(1));

      document.addEventListener('keydown', (e) => {
        if (!wrap || wrap.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === 'ArrowRight') step(1);
      });

      /* keep Tab focus inside the dialog while it is open */
      wrap.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusables = Array.from(wrap.querySelectorAll('button'))
          .filter((el) => !el.hidden && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    };

    return {
      open(list, startIndex, opener) {
        if (!list || !list.length) return;
        if (!wrap) build();
        items = list;
        index = Math.max(0, Math.min(startIndex || 0, list.length - 1));
        lastFocus = opener || document.activeElement;
        render();
        wrap.hidden = false;
        void wrap.offsetWidth; // reflow so the fade-and-scale plays
        wrap.classList.add('is-open');
        wrap.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        wrap.querySelector('.lbox-x').focus();
      },
    };
  })();

  /* Residence galleries — a crossfading carousel, one per residence type.
     Every lookup is scoped to its own root, so a page can carry several
     (unlike the single-instance [data-proj-track] scroller above). */
  document.querySelectorAll('[data-gallery]').forEach((root) => {
    const slides = Array.from(root.querySelectorAll('.res-slide'));
    if (slides.length < 1) return;

    const barFill = root.querySelector('[data-gallery-bar] span');
    const status = root.querySelector('[data-gallery-status]');
    const frame = root.querySelector('.res-frame');
    let index = slides.findIndex((s) => s.classList.contains('is-active'));
    if (index < 0) index = 0;

    const shots = slides.map((s) => ({ src: s.currentSrc || s.src, alt: s.alt }));

    const setIndex = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      if (barFill) barFill.style.transform = `scaleX(${(index + 1) / slides.length})`;
      if (status) status.textContent = `Image ${index + 1} of ${slides.length}`;
    };

    setIndex(index);

    const prev = root.querySelector('[data-gallery-prev]');
    const next = root.querySelector('[data-gallery-next]');
    /* Wrap around rather than disabling, so the controls never look broken. */
    if (prev) prev.addEventListener('click', () => setIndex(index - 1));
    if (next) next.addEventListener('click', () => setIndex(index + 1));

    const full = root.querySelector('[data-gallery-full]');
    if (full) full.addEventListener('click', () => lightbox.open(shots, index, full));

    /* Arrow keys once focus is anywhere inside the gallery */
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setIndex(index + 1); }
    });

    /* Swipe. Touch only — a mouse has the arrows. */
    if (frame) {
      let startX = 0, startY = 0, tracking = false;
      frame.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        tracking = true; startX = e.clientX; startY = e.clientY;
      }, { passive: true });
      frame.addEventListener('pointerup', (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - startX;
        /* ignore mostly-vertical gestures so page scrolling still works */
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(e.clientY - startY)) return;
        setIndex(index + (dx < 0 ? 1 : -1));
      }, { passive: true });
      frame.addEventListener('pointercancel', () => { tracking = false; }, { passive: true });
    }
  });

  /* Amenities — a tablist that swaps the panel below in place. Same state idiom
     as the developments filter above, upgraded to full tab semantics. */
  const amenityTabs = document.querySelector('[data-amenity-tabs]');
  if (amenityTabs) {
    const tabs = Array.from(amenityTabs.querySelectorAll('[role="tab"]'));
    const stage = document.querySelector('[data-amenity-stage]');
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

    /* Panels differ in height; without a floor the page jolts on every switch. */
    const setStageFloor = () => {
      if (!stage) return;
      stage.style.minHeight = '';
      let tallest = 0;
      panels.forEach((p, i) => {
        if (!p || tabs[i].classList.contains('is-active')) return;
        p.style.display = 'grid';
        tallest = Math.max(tallest, p.offsetHeight);
        p.style.display = '';
      });
      const active = panels[tabs.findIndex((t) => t.classList.contains('is-active'))];
      if (active) tallest = Math.max(tallest, active.offsetHeight);
      stage.style.minHeight = tallest ? `${tallest}px` : '';
    };

    const activate = (i, moveFocus) => {
      tabs.forEach((tab, n) => {
        const on = n === i;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        if (panels[n]) panels[n].classList.toggle('is-active', on);
      });
      if (moveFocus) tabs[i].focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i, false));
      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        let target = null;
        if (e.key === 'ArrowRight') target = i === last ? 0 : i + 1;
        else if (e.key === 'ArrowLeft') target = i === 0 ? last : i - 1;
        else if (e.key === 'Home') target = 0;
        else if (e.key === 'End') target = last;
        if (target === null) return;
        e.preventDefault();
        activate(target, true);
      });
    });

    /* Ensure exactly one tab is active, even if the markup drifts. */
    const initial = Math.max(0, tabs.findIndex((t) => t.classList.contains('is-active')));
    activate(initial, false);

    setStageFloor();
    window.addEventListener('load', setStageFloor);
    let floorTick;
    window.addEventListener('resize', () => {
      clearTimeout(floorTick);
      floorTick = setTimeout(setStageFloor, 180);
    });
  }

  /* Amenity shots open in the shared lightbox, grouped by their panel so the
     arrows step through that amenity's images only. */
  document.querySelectorAll('.amen-mosaic').forEach((mosaic) => {
    const shots = Array.from(mosaic.querySelectorAll('[data-lightbox]'));
    const list = shots.map((b) => {
      const img = b.querySelector('img');
      return { src: img ? img.src : '', alt: img ? img.alt : '' };
    });
    shots.forEach((b, i) => b.addEventListener('click', () => lightbox.open(list, i, b)));
  });

  /* Location map — gentle parallax on the aerial image as it scrolls through
     the viewport. Transform only; skipped entirely under reduced motion. */
  const locImg = document.querySelector('[data-parallax]');
  if (locImg && !reduceMotion) {
    const frame = locImg.closest('.loc-map') || locImg.parentElement;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = frame.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.bottom < -80 || r.top > vh + 80) return; // off-screen: don't bother
      /* -1 (frame entering from bottom) .. 1 (leaving past top) */
      const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      const shift = Math.max(-1, Math.min(1, progress)) * -26; // px, within the 9% overscan
      locImg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* FAQ accordion — independent items, smooth via the CSS grid-rows technique.
     Buttons carry aria-expanded; answers are aria-hidden when closed. */
  document.querySelectorAll('[data-faq]').forEach((root) => {
    const items = Array.from(root.querySelectorAll('.faq-item'));
    items.forEach((item) => {
      const btn = item.querySelector('[data-faq-toggle]');
      const panel = item.querySelector('.faq-a');
      if (!btn || !panel) return;
      const setOpen = (open) => {
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      };
      setOpen(item.classList.contains('is-open'));
      btn.addEventListener('click', () => setOpen(!item.classList.contains('is-open')));
    });
  });

  /* Stat count-ups — each number eases from 0 to its target once the analytics
     grid scrolls into view. Under reduced motion the final figures show at once. */
  const fmtNum = (n, dp = 0) =>
    dp > 0
      ? n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })
      : Math.round(n).toLocaleString('en-US');
  const dpOf = (el) => Number(el.getAttribute('data-decimals')) || 0;
  document.querySelectorAll('[data-countup]').forEach((group) => {
    const nums = Array.from(group.querySelectorAll('[data-count]'));
    if (!nums.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      nums.forEach((el) => (el.textContent = fmtNum(parseFloat(el.getAttribute('data-count')), dpOf(el))));
      return;
    }
    nums.forEach((el) => (el.textContent = fmtNum(0, dpOf(el))));
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const duration = 1500;
      nums.forEach((el) => {
        const target = parseFloat(el.getAttribute('data-count'));
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          el.textContent = fmtNum(target * eased, dpOf(el));
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = fmtNum(target);
        };
        requestAnimationFrame(tick);
      });
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } }),
      { threshold: 0.35 }
    );
    io.observe(group);
  });

  /* Footer year */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Contact form — no backend: write the message out for WhatsApp. Links such as
     contact.html?intent=viewing&listing=ocean-house pre-fill the form. */
  const form = document.getElementById('contact-form');
  if (form) {
    const intentSel = form.querySelector('#intent');
    const listingSel = form.querySelector('#listing');
    const viewingOnly = form.querySelector('[data-viewing-only]');
    const whenField = form.querySelector('#when');
    if (whenField) whenField.min = new Date().toISOString().slice(0, 10);
    const syncViewing = () => { if (viewingOnly) viewingOnly.hidden = intentSel.value !== 'viewing'; };
    const q = new URLSearchParams(window.location.search);
    if (q.get('intent') && Array.from(intentSel.options).some((o) => o.value === q.get('intent'))) intentSel.value = q.get('intent');
    if (q.get('listing') && Array.from(listingSel.options).some((o) => o.value === q.get('listing'))) listingSel.value = q.get('listing');
    syncViewing();
    intentSel.addEventListener('change', syncViewing);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const intentText = intentSel.value ? intentSel.options[intentSel.selectedIndex].text : '';
      const listing = listingSel.value ? listingSel.options[listingSel.selectedIndex].text : '';
      const when = String(data.get('when') || '').trim();
      const msg = String(data.get('message') || '').trim();
      const parts = [`Hello${name ? `, this is ${name}` : ''}.`];
      if (intentText) parts.push(`I'd like to ${intentText.charAt(0).toLowerCase() + intentText.slice(1)}.`);
      if (listing) parts.push(`Property: ${listing}.`);
      if (when && intentSel.value === 'viewing') parts.push(`Preferred date: ${new Date(`${when}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.`);
      openWhatsApp(parts.join(' ') + (msg ? `\n\n${msg}` : ''));
    });
  }
})();
