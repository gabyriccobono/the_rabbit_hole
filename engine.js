/* =====================================================================
   THE RABBIT HOLE: engine
   You don't need to edit this file. Questions live in paths.js and the
   look lives in style.css. The timings below are safe to tweak.
   ===================================================================== */

(() => {
  'use strict';

  const SETTINGS = {
    typeSpeed: 32,         // ms per letter for the first question
    detailSpeed: 9,        // ms per letter for longer "detail" text
    optionTypeSpeed: 16,   // ms per letter for the answers
    endingTypeSpeed: 30,   // ms per letter for the star message
    branchDelay: 150,      // ms between each answer line starting
    lineDuration: 750,     // ms for one line to draw itself
    flightDuration: 1200,  // ms for the camera to fly to the next box
    endingPause: 700,      // ms between finishing the text and the star appearing
    narrowBreakpoint: 760  // below this width, branches stack downward
  };

  const ENDING_MESSAGE = 'You are one star closer to reconnecting with your childhood self.';
  const STORAGE_KEY = 'rabbitHole.stars';

  const PATHS = window.PATHS || {};
  const ROOT = 'start';
  const COORD_OFFSET = { x: 2048, y: 1536 };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;

  const $ = (s) => document.querySelector(s);
  const viewport = $('#viewport');
  const world = $('#world');
  const wires = $('#wires');
  const nodesLayer = $('#nodes');
  const welcome = $('#welcome');
  const welcomeTitle = $('#welcome-title');
  const enterBtn = $('#enter');
  const starCount = $('#star-count');
  const starCountText = $('#star-count-text');
  const resetBtn = $('#reset-stars');
  const hudBottom = $('#hud-bottom');
  const trail = $('#trail');
  const readout = $('#readout');
  const clock = $('#clock');
  const canvas = $('#space');
  const ctx = canvas.getContext('2d');

  let levels = [];      // the path you're on: one entry per open box
  let epoch = 0;        // bumps whenever navigation changes, cancelling old animations
  let camTween = 0;
  let warp = 0;
  let locked = false;   // true once an ending is reached
  let skipTyping = false;
  let narrow = window.innerWidth < SETTINGS.narrowBreakpoint;
  const cam = { x: 0, y: 0, s: 1 };

  /* ---------- small helpers ---------- */

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const dur = (ms, instant) => (instant || reduceMotion ? 0 : ms);
  const short = (t) => (t.length > 26 ? t.slice(0, 24).trimEnd() + '…' : t);
  const pad2 = (n) => String(n).padStart(2, '0');

  function getNode(id) {
    const n = PATHS[id];
    if (!n) return { text: `Missing box "${id}". Check paths.js.`, detail: '', options: [], star: '' };
    return {
      text: String(n.text ?? id),
      detail: n.detail ? String(n.detail) : '',
      options: Array.isArray(n.options) ? n.options.filter((x) => typeof x === 'string') : [],
      star: typeof n.star === 'string' ? n.star : ''
    };
  }

  function coordText(x, y) {
    return `x: ${Math.round(x + COORD_OFFSET.x)}  y: ${Math.round(y + COORD_OFFSET.y)}`;
  }

  /* ---------- endings and stars ---------- */

  // Every box with no options is an ending; number them in tree order
  const ENDINGS = (() => {
    const list = [];
    const seen = new Set();
    const walk = (id) => {
      if (seen.has(id)) return;
      seen.add(id);
      const n = getNode(id);
      if (!n.options.length) list.push(id);
      n.options.forEach(walk);
    };
    walk(ROOT);
    return list;
  })();

  function loadEarned() {
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(v) ? v.filter((id) => ENDINGS.includes(id)) : [];
    } catch (e) {
      return [];
    }
  }
  function saveEarned() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(earned)); } catch (e) { /* storage blocked */ }
  }
  let earned = loadEarned();
  let freshStar = null;

  const imageCache = new Map();
  function starImage(id) {
    const custom = getNode(id).star;
    if (custom) {
      let img = imageCache.get(custom);
      if (!img) {
        img = new Image();
        img.src = custom;
        imageCache.set(custom, img);
      }
      if (img.complete && img.naturalWidth) return img;
    }
    return window.RabbitStars.make(id, ENDINGS.indexOf(id));
  }

  function updateStarCount() {
    starCount.hidden = earned.length === 0;
    starCountText.textContent = `${earned.length} of ${ENDINGS.length} stars collected`;
    resetBtn.textContent = 'Reset';
    resetBtn.dataset.armed = '';
  }

  resetBtn.addEventListener('click', () => {
    if (!resetBtn.dataset.armed) {
      resetBtn.dataset.armed = '1';
      resetBtn.textContent = 'Click again to clear your stars';
      return;
    }
    earned = [];
    floaters.length = 0;
    saveEarned();
    updateStarCount();
  });

  /* ---------- optical centering for pill buttons ---------- */

  // Fonts put uneven invisible space above and below letters. Measure the
  // real letter shapes and nudge the text so the gaps to the outline match.
  const measureCtx = document.createElement('canvas').getContext('2d');
  function centerPillText(btn) {
    const cs = getComputedStyle(btn);
    const size = parseFloat(cs.fontSize);
    measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = measureCtx.measureText(btn.textContent.trim());
    if (!m.fontBoundingBoxAscent) return;
    // The line is a whole number of pixels tall; the baseline sits half the
    // leftover space below its top
    const dpr = window.devicePixelRatio || 1;
    const snap = (v) => Math.round(v * dpr) / dpr;
    const line = snap(size);
    const baseline = (line - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    const inkMiddle = baseline + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
    // Whole pixels, so the outline and the letters line up on the screen grid
    const pad = snap(size * 0.6);
    const nudge = snap(line / 2 - inkMiddle);
    btn.style.setProperty('--lh', line + 'px');
    btn.style.setProperty('--pt', pad + nudge + 'px');
    btn.style.setProperty('--pb', pad - nudge + 'px');
  }

  /* ---------- typing ---------- */

  function typeText(el, text, speed, instant, myEpoch) {
    if (instant || reduceMotion || !speed) {
      el.textContent = text;
      return Promise.resolve();
    }
    el.textContent = '';
    const spans = Array.from(text, (ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      return s;
    });
    el.append(...spans);
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    const stop = speed >= 20 ? 5 : 3;

    return new Promise((resolve) => {
      let i = 0;
      const finish = () => {
        caret.remove();
        el.textContent = text;
        resolve();
      };
      const step = () => {
        if (myEpoch !== undefined && myEpoch !== epoch) return finish();
        if (!el.isConnected) return resolve();
        if (skipTyping) return finish();
        spans[i].classList.add('on');
        spans[i].after(caret);
        const prev = spans[i].textContent;
        i++;
        if (i >= spans.length) return setTimeout(finish, 260);
        const pause = /[,.?!:;]/.test(prev) ? stop : prev === ' ' ? 0.7 : 1;
        setTimeout(step, speed * pause * (0.55 + Math.random() * 0.9));
      };
      step();
    });
  }

  /* ---------- boxes ---------- */

  function makeNodeEl(data, kind) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'node ' + kind;
    el.setAttribute('aria-label', data.detail ? `${data.text}. ${data.detail}` : data.text);

    const coord = document.createElement('span');
    coord.className = 'coord';
    coord.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'node-text';
    const detail = document.createElement('span');
    detail.className = 'node-detail';
    detail.hidden = true;

    el.append(coord, text, detail);
    el.addEventListener('click', () => el._action && el._action());
    el.addEventListener('animationend', (e) => {
      if (e.target === el) el.classList.remove('appear', 'entering');
    });
    return el;
  }

  function setRect(el, r) {
    el.style.left = Math.round(r.x) + 'px';
    el.style.top = Math.round(r.y) + 'px';
    el.style.width = r.w + 'px';
  }

  const measureCache = new Map();
  function measure(data, kind, w) {
    const key = [kind, w, narrow, data.text, data.detail].join('|');
    if (measureCache.has(key)) return measureCache.get(key);
    const el = makeNodeEl(data, kind + ' measuring');
    el.style.width = w + 'px';
    el.style.left = '-20000px';
    el.style.top = '0px';
    el.querySelector('.node-text').textContent = data.text;
    if (kind.includes('focus') && data.detail) {
      const d = el.querySelector('.node-detail');
      d.hidden = false;
      d.textContent = data.detail;
    }
    nodesLayer.appendChild(el);
    const h = el.offsetHeight;
    el.remove();
    measureCache.set(key, h);
    return h;
  }

  const optWidth = () => (narrow ? 280 : 338);
  function focusWidth(data) {
    if (narrow) return 320;
    if (data.detail.length > 420) return 780;
    return data.text.length > 34 || data.detail ? 666 : 390;
  }

  /* ---------- deeper hover ---------- */

  function scrambleCoord(el) {
    const coord = el.querySelector('.coord');
    const real = coord.dataset.real || coord.textContent;
    coord.dataset.real = real;
    let n = 0;
    clearInterval(coord._t);
    coord._t = setInterval(() => {
      n++;
      coord.textContent = n > 7 ? real : real.replace(/\d/g, () => Math.floor(Math.random() * 10));
      if (n > 7) clearInterval(coord._t);
    }, 45);
  }

  function addHover(el) {
    if (!canHover || reduceMotion) return;
    el.addEventListener('pointerenter', () => {
      if (el.classList.contains('focus')) return;
      el._wire && el._wire.classList.add('hot');
      scrambleCoord(el);
    });
    el.addEventListener('pointermove', (e) => {
      if (el.classList.contains('focus')) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      el.style.setProperty('--rx', ((px - 0.5) * 7).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((0.5 - py) * 7).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', () => {
      el._wire && el._wire.classList.remove('hot');
      ['--mx', '--my', '--rx', '--ry'].forEach((p) => el.style.removeProperty(p));
    });
  }

  /* ---------- layout (positions match the Figma frames) ---------- */

  // Where branch lines leave a box
  function origin(L) {
    return narrow
      ? { x: L.x + 24, y: L.y + L.h, dx: 0, dy: 1 }
      : { x: L.x + L.w, y: L.y + L.h / 2, dx: 1, dy: 0 };
  }

  function slotsFor(n) {
    const R = (dy) => ({ kind: 'R', dy });
    const T = { kind: 'T' }, B = { kind: 'B' }, LL = { kind: 'LL' }, UL = { kind: 'UL' };
    switch (n) {
      case 0: return [];
      case 1: return [R(0)];
      case 2: return [R(-130), R(130)];
      case 3: return [R(-259), R(0), R(259)];
      case 4: return [R(-259), R(0), R(259), B];
      case 5: return [T, R(-259), R(0), R(259), B];
      case 6: return [T, R(-259), R(0), R(259), B, LL];
      case 7: return [T, R(-259), R(0), R(259), B, LL, UL];
      default: return Array.from({ length: n }, (_, i) => R((i - (n - 1) / 2) * 150));
    }
  }

  function layoutOptions(data, rect) {
    const w = optWidth();
    const kids = data.options.map((id) => {
      const d = getNode(id);
      return { id, data: d, h: measure(d, 'option', w) };
    });

    if (narrow) {
      let y = rect.y + rect.h + 56;
      return kids.map((k) => {
        const box = { x: rect.x + 44, y, w, h: k.h };
        y += k.h + 22;
        return { ...k, box, attach: { x: box.x, y: box.y + k.h / 2 }, normal: { x: -1, y: 0 }, dy: 0 };
      });
    }

    const A = { x: rect.x + rect.w, y: rect.y + rect.h / 2 };
    const slots = slotsFor(kids.length);
    return kids.map((k, i) => {
      const s = slots[i];
      const h = k.h;
      let box, attach, normal;
      if (s.kind === 'R') {
        box = { x: A.x + 334, y: A.y + s.dy - h / 2, w, h };
        attach = { x: box.x, y: A.y + s.dy };
        normal = { x: -1, y: 0 };
      } else if (s.kind === 'T') {
        box = { x: A.x - 164, y: A.y - 360 - h / 2, w, h };
        attach = { x: box.x + 228, y: box.y + h };
        normal = { x: 0, y: 1 };
      } else if (s.kind === 'B') {
        box = { x: A.x - 164, y: A.y + 360 - h / 2, w, h };
        attach = { x: box.x + 228, y: box.y };
        normal = { x: 0, y: -1 };
      } else if (s.kind === 'LL') {
        box = { x: A.x - 574, y: A.y + 290 - h / 2, w, h };
        attach = { x: box.x + 169, y: box.y };
        normal = { x: 0, y: -1 };
      } else {
        box = { x: A.x - 574, y: A.y - 290 - h / 2, w, h };
        attach = { x: box.x + 169, y: box.y + h };
        normal = { x: 0, y: 1 };
      }
      return { ...k, box, attach, normal, dy: box.y + h / 2 - A.y };
    });
  }

  function levelBBox(L) {
    let x0 = L.x, y0 = L.y - 30, x1 = L.x + L.w, y1 = L.y + L.h;
    const boxes = L.layout.map((it) => it.box);
    if (L.endRect) boxes.push(L.endRect);
    boxes.forEach((box) => {
      x0 = Math.min(x0, box.x);
      y0 = Math.min(y0, box.y - 30);
      x1 = Math.max(x1, box.x + box.w);
      y1 = Math.max(y1, box.y + box.h);
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ---------- lines ---------- */

  function curvePath(a, ad, b, bn) {
    const k = Math.min(Math.hypot(b.x - a.x, b.y - a.y) * 0.5, 320);
    return `M${a.x} ${a.y} C${a.x + ad.x * k} ${a.y + ad.y * k} ${b.x + bn.x * k} ${b.y + bn.y * k} ${b.x} ${b.y}`;
  }

  function makeWire(d, cls, markerAt) {
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'wire ' + (cls || ''));
    const mk = (c) => {
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('class', c);
      p.setAttribute('d', d);
      return p;
    };
    const halo = mk('halo');
    const core = mk('core');
    const spark = mk('spark');
    spark.setAttribute('pathLength', '100');
    g.append(halo, core, spark);
    if (markerAt) {
      const m = document.createElementNS(SVGNS, 'rect');
      m.setAttribute('class', 'marker');
      m.setAttribute('x', markerAt.x - 3.5);
      m.setAttribute('y', markerAt.y - 3.5);
      m.setAttribute('width', 7);
      m.setAttribute('height', 7);
      g.append(m);
    }
    wires.appendChild(g);
    const len = core.getTotalLength() + 2;
    [halo, core].forEach((p) => {
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    return g;
  }

  function drawWire(g, ms) {
    if (g._drawn) return;
    g._drawn = true;
    const paths = g.querySelectorAll('.halo, .core');
    const settle = () => {
      g.classList.add('drawn');
      paths.forEach((p) => {
        p.style.transition = '';
        p.style.strokeDasharray = '';
        p.style.strokeDashoffset = '';
      });
    };
    if (!ms) return settle();
    g.getBoundingClientRect();
    paths.forEach((p) => {
      p.style.transition = `stroke-dashoffset ${ms}ms cubic-bezier(.65,0,.35,1)`;
      p.style.strokeDashoffset = '0';
    });
    setTimeout(settle, ms + 40);
  }

  function removeEl(el, instant) {
    if (!el) return;
    if (instant || reduceMotion) return el.remove();
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 500);
  }

  /* ---------- options ---------- */

  function createOptionEl(L, i) {
    const it = L.layout[i];
    const el = makeNodeEl(it.data, 'option pending');
    setRect(el, it.box);
    el.querySelector('.coord').textContent = coordText(it.box.x, it.box.y);
    el._action = () => {
      const li = levels.indexOf(L);
      if (li >= 0) choose(li, i);
    };
    addHover(el);
    nodesLayer.appendChild(el);
    return el;
  }

  function makeOption(L, i) {
    const it = L.layout[i];
    const a = origin(L);
    const o = { ...it, el: createOptionEl(L, i), revealed: false };
    o.wire = makeWire(curvePath(a, { x: a.dx, y: a.dy }, it.attach, it.normal), '', it.attach);
    o.el._wire = o.wire;
    o.reveal = (instant) => {
      if (o.revealed) return;
      o.revealed = true;
      const ms = dur(SETTINGS.lineDuration, instant);
      drawWire(o.wire, ms);
      const show = () => {
        const el = o.el;
        if (!el.isConnected || !el.classList.contains('pending')) return;
        el.classList.remove('pending');
        const t = el.querySelector('.node-text');
        if (ms) {
          el.classList.add('appear');
          typeText(t, o.data.text, SETTINGS.optionTypeSpeed, false);
        } else {
          t.textContent = o.data.text;
        }
      };
      if (ms) setTimeout(show, ms * 0.55);
      else show();
    };
    return o;
  }

  /* ---------- the ending: lock the path and award a star ---------- */

  function buildEnding(L) {
    const panel = document.createElement('div');
    panel.className = 'ending pending';
    panel.setAttribute('role', 'status');

    const starWrap = document.createElement('div');
    starWrap.className = 'ending-star';
    const img = starImage(L.id);
    if (img instanceof HTMLCanvasElement) {
      // The background reuses the original canvas, so the panel gets a copy
      const copy = document.createElement('canvas');
      copy.width = img.width;
      copy.height = img.height;
      copy.getContext('2d').drawImage(img, 0, 0);
      starWrap.append(copy);
    } else {
      starWrap.append(img.cloneNode());
    }

    const msg = document.createElement('p');
    msg.className = 'ending-msg';
    msg.textContent = ENDING_MESSAGE;

    const meta = document.createElement('p');
    meta.className = 'ending-meta';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill ending-btn';
    btn.textContent = 'Return to the surface';
    btn.addEventListener('click', () => surface({ force: true }));

    panel.append(starWrap, msg, meta, btn);

    const w = narrow ? 300 : 440;
    panel.style.width = w + 'px';
    panel.style.left = '-20000px';
    nodesLayer.appendChild(panel);
    centerPillText(btn);
    const h = panel.offsetHeight;

    let rect;
    if (narrow) {
      rect = { x: L.x + 10, y: L.y + L.h + 70, w, h };
    } else {
      const cy = L.y + L.h / 2;
      rect = { x: L.x + L.w + 150, y: cy - 150, w, h };
    }
    setRect(panel, rect);
    return { panel, rect, msg, meta };
  }

  async function revealEnding(L, instant, myEpoch) {
    const { panel, msg, meta } = L.ending;
    const rect = L.endRect;
    const a = origin(L);
    const b = narrow
      ? { x: rect.x + rect.w / 2, y: rect.y + 20 }
      : { x: rect.x + rect.w / 2 - 110, y: rect.y + 150 };
    const wire = makeWire(curvePath(a, { x: a.dx, y: a.dy }, b, narrow ? { x: 0, y: -1 } : { x: -1, y: 0 }), 'trunk');
    L.endWire = wire;
    drawWire(wire, dur(SETTINGS.lineDuration, instant));
    await wait(dur(SETTINGS.lineDuration * 0.8, instant));
    if (myEpoch !== epoch) return;

    const isNew = !earned.includes(L.id);
    if (isNew) {
      earned.push(L.id);
      saveEarned();
      freshStar = L.id;
    }
    const number = ENDINGS.indexOf(L.id) + 1;
    meta.textContent = isNew
      ? `Star ${pad2(number)} of ${ENDINGS.length}  ·  ${earned.length} collected`
      : `Star ${pad2(number)} of ${ENDINGS.length}  ·  already in your sky`;

    panel.classList.remove('pending');
    if (!instant && !reduceMotion) panel.classList.add('popping');
    const msgText = msg.textContent;
    await typeText(msg, msgText, SETTINGS.endingTypeSpeed, instant, myEpoch);
    if (myEpoch !== epoch) return;
    panel.classList.add('done');
  }

  function lock(on) {
    locked = on;
    document.body.classList.toggle('locked', on);
  }

  /* ---------- camera ---------- */

  function margins() {
    return narrow ? { t: 84, b: 140, l: 16, r: 16 } : { t: 104, b: 116, l: 56, r: 56 };
  }

  function fitCamera(b) {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const m = margins();
    const aw = Math.max(100, vw - m.l - m.r);
    const ah = Math.max(100, vh - m.t - m.b);
    let s = Math.min(1, aw / b.w, ah / b.h);
    s = Math.max(s, narrow ? 0.7 : 0.4);
    let cx = b.x + b.w / 2;
    let cy = b.y + b.h / 2;
    if (b.w * s > aw) cx = b.x + aw / (2 * s);
    if (b.h * s > ah) cy = b.y + ah / (2 * s);
    return { x: cx - (m.l - m.r) / (2 * s), y: cy - (m.t - m.b) / (2 * s), s };
  }

  function applyCam() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    // Whole-pixel offsets keep outlines and text crisp and evenly spaced
    world.style.transform = `translate(${Math.round(vw / 2 - cam.x * cam.s)}px, ${Math.round(vh / 2 - cam.y * cam.s)}px) scale(${cam.s})`;
  }

  function tweenCamera(to, ms, dip) {
    const id = ++camTween;
    const from = { ...cam };
    if (!ms) {
      Object.assign(cam, to);
      applyCam();
      return Promise.resolve();
    }
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        if (id !== camTween) return resolve();
        const t = Math.min(1, (now - t0) / ms);
        const e = ease(t);
        cam.x = lerp(from.x, to.x, e);
        cam.y = lerp(from.y, to.y, e);
        cam.s = lerp(from.s, to.s, e) * (dip ? 1 - 0.16 * Math.sin(Math.PI * t) : 1);
        applyCam();
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  function recenter() {
    const L = levels[levels.length - 1];
    if (L) tweenCamera(fitCamera(levelBBox(L)), dur(800), false);
  }

  function runWarp() {
    if (reduceMotion) return;
    const t0 = performance.now(), ms = 1700;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      warp = Math.sin(Math.PI * t) * (1 - t * 0.3);
      if (t < 1) requestAnimationFrame(step);
      else warp = 0;
    };
    requestAnimationFrame(step);
  }

  /* ---------- navigation ---------- */

  async function enterLevel(L, { instant = false, myEpoch, dip = false, isRoot = false }) {
    L.layout = layoutOptions(L.data, L);
    const isEnd = !L.data.options.length;
    if (isEnd) {
      L.ending = buildEnding(L);
      L.endRect = L.ending.rect;
    }
    tweenCamera(fitCamera(levelBBox(L)), dur(SETTINGS.flightDuration, instant), dip);
    renderTrail();
    skipTyping = false;

    const textEl = L.el.querySelector('.node-text');
    if (isRoot) {
      await wait(dur(450, instant));
      if (myEpoch !== epoch) return;
      await typeText(textEl, L.data.text, SETTINGS.typeSpeed, instant, myEpoch);
    } else {
      await wait(dur(SETTINGS.flightDuration * 0.75, instant));
    }
    if (myEpoch !== epoch) return;

    if (L.data.detail) {
      const d = L.el.querySelector('.node-detail');
      d.hidden = false;
      await typeText(d, L.data.detail, SETTINGS.detailSpeed, instant, myEpoch);
      if (myEpoch !== epoch) return;
    }
    skipTyping = false;

    if (isEnd) {
      await wait(dur(SETTINGS.endingPause, instant));
      if (myEpoch !== epoch) return;
      await revealEnding(L, instant, myEpoch);
      return;
    }

    L.options = L.layout.map((_, i) => makeOption(L, i));
    for (let i = 0; i < L.options.length; i++) {
      const ms = dur(SETTINGS.branchDelay, instant);
      if (i && ms) await wait(ms);
      if (myEpoch !== epoch) return;
      L.options[i].reveal(instant);
    }
  }

  async function startJourney({ instant = false, push = true } = {}) {
    const myEpoch = ++epoch;
    clearWorld();
    lock(false);
    welcome.classList.add('leaving');
    welcome.setAttribute('inert', '');
    hudBottom.classList.add('on');

    const data = getNode(ROOT);
    const w = focusWidth(data);
    const h = measure(data, 'focus root', w);
    const rect = { x: 0, y: -h / 2, w, h };
    const el = makeNodeEl(data, 'focus root current' + (instant || reduceMotion ? '' : ' entering'));
    setRect(el, rect);
    el.querySelector('.coord').textContent = coordText(rect.x, rect.y);
    nodesLayer.appendChild(el);

    const L = { id: ROOT, data, el, ...rect, options: [], layout: [], chosen: null, trunk: null };
    el._action = () => onFocusClick(L);
    levels = [L];
    if (push) pushHash();
    await enterLevel(L, { instant, myEpoch, isRoot: true });
  }

  async function choose(li, oi, { instant = false, push = true } = {}) {
    if (li < 0 || li >= levels.length) return;
    if (locked && !instant) return;
    const myEpoch = ++epoch;
    if (li < levels.length - 1) truncate(li, instant);
    const L = levels[li];
    L.options.forEach((p) => p.reveal(true));
    const o = L.options[oi];
    if (!o) return;

    L.chosen = oi;
    L.options.forEach((p, i) => {
      if (i === oi) return;
      p.el.classList.add('ghost');
      p.wire.classList.add('ghost');
    });
    o.wire.classList.remove('hot');
    o.wire.classList.add('gone');
    L.el.classList.remove('current');
    L.el.classList.add('past');

    // Where the chosen box flies to
    const data = o.data;
    if (!data.options.length) lock(true);
    const w = focusWidth(data);
    const h = measure(data, 'focus', w);
    let rect;
    if (narrow) {
      const bottom = Math.max(L.y + L.h, ...L.options.map((p) => p.box.y + p.box.h));
      rect = { x: L.x, y: bottom + 96, w, h };
    } else {
      const right = Math.max(L.x + L.w, ...L.options.map((p) => p.box.x + p.box.w));
      const rel = layoutOptions(data, { x: 0, y: 0, w, h });
      const relMin = Math.min(0, ...rel.map((r) => r.box.x));
      const cy = L.y + L.h / 2 + clamp(o.dy * 0.4, -180, 180);
      rect = { x: right + 240 - relMin, y: cy - h / 2, w, h };
    }

    const el = o.el;
    if (instant || reduceMotion) el.classList.add('no-anim');
    el.classList.remove('option', 'pending', 'appear', 'ghost');
    el.classList.add('focus', 'current');
    ['--mx', '--my', '--rx', '--ry'].forEach((p) => el.style.removeProperty(p));
    el.querySelector('.node-text').textContent = data.text;
    setRect(el, rect);
    const coord = el.querySelector('.coord');
    coord.textContent = coordText(rect.x, rect.y);
    delete coord.dataset.real;
    if (instant || reduceMotion) setTimeout(() => el.classList.remove('no-anim'), 60);

    const N = { id: o.id, data, el, ...rect, options: [], layout: [], chosen: null, trunk: null };
    const a = origin(L);
    const b = narrow ? { x: rect.x + 24, y: rect.y } : { x: rect.x, y: rect.y + h / 2 };
    N.trunk = makeWire(curvePath(a, { x: a.dx, y: a.dy }, b, narrow ? { x: 0, y: -1 } : { x: -1, y: 0 }), 'trunk');
    drawWire(N.trunk, dur(SETTINGS.flightDuration * 0.9, instant));
    el._action = () => onFocusClick(N);

    levels.push(N);
    if (push) pushHash();
    await enterLevel(N, { instant, myEpoch, dip: true });
  }

  // Remove everything after level li and make level li's choices live again
  function truncate(li, instant) {
    for (let j = levels.length - 1; j > li; j--) {
      const M = levels[j];
      M.options.forEach((o) => {
        removeEl(o.el, instant);
        removeEl(o.wire, instant);
      });
      removeEl(M.el, instant);
      removeEl(M.trunk, instant);
    }
    levels.length = li + 1;

    const L = levels[li];
    L.el.classList.remove('past');
    L.el.classList.add('current');
    L.options.forEach((o) => {
      o.el.classList.remove('ghost');
      o.wire.classList.remove('ghost', 'gone');
    });
    if (L.chosen != null) {
      const o = L.options[L.chosen];
      o.el = createOptionEl(L, L.chosen);
      o.el._wire = o.wire;
      o.el.classList.remove('pending');
      o.el.querySelector('.node-text').textContent = o.data.text;
      if (!instant && !reduceMotion) o.el.classList.add('appear');
    }
    L.chosen = null;
  }

  function goTo(li, { push = true } = {}) {
    if (locked) return;
    if (li < 0) return surface({ push });
    if (li >= levels.length - 1) return recenter();
    epoch++;
    truncate(li, false);
    tweenCamera(fitCamera(levelBBox(levels[li])), dur(SETTINGS.flightDuration), true);
    renderTrail();
    if (push) pushHash();
  }

  function onFocusClick(L) {
    const i = levels.indexOf(L);
    if (i === levels.length - 1) {
      skipTyping = true;
      recenter();
    } else if (i >= 0) {
      goTo(i);
    }
  }

  function back() {
    if (locked) return;
    if (levels.length <= 1) surface();
    else goTo(levels.length - 2);
  }

  function surface({ push = true, force = false } = {}) {
    if (locked && !force) return;
    epoch++;
    lock(false);
    clearWorld();
    levels = [];
    renderTrail();
    hudBottom.classList.remove('on');
    welcome.classList.remove('leaving');
    welcome.removeAttribute('inert');
    tweenCamera({ x: 0, y: 0, s: 1 }, dur(900), false);
    runWarp();
    if (push) clearHash();
    updateStarCount();
    if (freshStar) {
      spawnFloater(freshStar, true);
      freshStar = null;
    }
    typeText(welcomeTitle, 'WELCOME', 85, false);
  }

  function clearWorld() {
    nodesLayer.replaceChildren();
    wires.replaceChildren();
  }

  // Rebuild a whole path at once (used for links and resizing)
  async function rebuild(ids) {
    await startJourney({ instant: true, push: false });
    for (let i = 1; i < ids.length; i++) {
      const L = levels[i - 1];
      const oi = L.layout.findIndex((it) => it.id === ids[i]);
      if (oi < 0) break;
      await choose(i - 1, oi, { instant: true, push: false });
    }
  }

  /* ---------- address bar (so the browser's back button works) ---------- */

  const currentHash = () => '#' + levels.map((l) => l.id).join('.');

  function pushHash() {
    const h = currentHash();
    if (location.hash === h) return;
    try { history.pushState(null, '', h); } catch (e) { /* not allowed here */ }
  }

  function clearHash() {
    try { if (location.hash) history.pushState(null, '', location.pathname + location.search); } catch (e) { /* not allowed here */ }
  }

  function parseHash() {
    let raw = '';
    try { raw = decodeURIComponent(location.hash.slice(1)); } catch (e) { return null; }
    if (!raw) return null;
    const ids = raw.split('.');
    if (ids[0] !== ROOT) return null;
    const out = [ROOT];
    for (let i = 1; i < ids.length; i++) {
      if (!getNode(out[i - 1]).options.includes(ids[i])) break;
      out.push(ids[i]);
    }
    return out;
  }

  window.addEventListener('popstate', () => {
    if (locked) {
      // No backtracking from an ending: put the address back
      try { history.pushState(null, '', currentHash()); } catch (e) { /* not allowed here */ }
      return;
    }
    const ids = parseHash();
    if (!ids) {
      if (levels.length) surface({ push: false });
      return;
    }
    const cur = levels.map((l) => l.id);
    const prefixOf = (a, b) => a.every((id, i) => b[i] === id);
    if (ids.length === cur.length && prefixOf(ids, cur)) return;
    if (cur.length && ids.length < cur.length && prefixOf(ids, cur)) return goTo(ids.length - 1, { push: false });
    if (cur.length && ids.length === cur.length + 1 && prefixOf(cur, ids)) {
      const L = levels[levels.length - 1];
      const oi = L.options.findIndex((o) => o.id === ids[ids.length - 1]);
      if (oi >= 0) return choose(levels.length - 1, oi, { push: false });
    }
    rebuild(ids);
  });

  /* ---------- HUD ---------- */

  function renderTrail() {
    trail.replaceChildren();
    levels.forEach((L, i) => {
      if (i) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '/';
        trail.append(sep);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'crumb';
      b.textContent = short(L.data.text);
      b.title = L.data.text;
      if (i === levels.length - 1) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', () => goTo(i));
      trail.append(b);
    });
    trail.scrollLeft = trail.scrollWidth;
  }

  function tick() {
    const d = new Date();
    const date = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    const h = d.getHours();
    const time = `${h % 12 || 12}:${pad2(d.getMinutes())}${h >= 12 ? 'pm' : 'am'}`;
    const a = document.createElement('span');
    a.textContent = date;
    const b = document.createElement('span');
    b.textContent = time;
    clock.replaceChildren(a, b);
  }

  $('#back').addEventListener('click', back);
  $('#center').addEventListener('click', recenter);
  $('#surface').addEventListener('click', () => surface());

  window.addEventListener('keydown', (e) => {
    if (!levels.length || locked) return;
    if (e.key === 'Escape' || (e.key === 'Backspace' && !e.target.closest('input, textarea'))) {
      e.preventDefault();
      back();
    }
  });

  /* ---------- drag to look around, scroll to zoom ---------- */

  let drag = null;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.node, .ending') || !levels.length) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('dragging');
    camTween++;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    cam.x -= (e.clientX - drag.x) / cam.s;
    cam.y -= (e.clientY - drag.y) / cam.s;
    drag.x = e.clientX;
    drag.y = e.clientY;
    applyCam();
  });
  const endDrag = (e) => {
    if (drag && e.pointerId === drag.id) {
      drag = null;
      viewport.classList.remove('dragging');
    }
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  viewport.addEventListener('wheel', (e) => {
    if (!levels.length) return;
    e.preventDefault();
    camTween++;
    const px = e.clientX - viewport.clientWidth / 2;
    const py = e.clientY - viewport.clientHeight / 2;
    const wx = cam.x + px / cam.s;
    const wy = cam.y + py / cam.s;
    const ns = clamp(cam.s * Math.exp(-e.deltaY * 0.0015), 0.15, 1.6);
    cam.s = ns;
    cam.x = wx - px / ns;
    cam.y = wy - py / ns;
    applyCam();
  }, { passive: false });

  /* ---------- the endless background ---------- */

  const INK = getComputedStyle(document.documentElement).getPropertyValue('--space-ink').trim() || '245, 245, 247';
  const MONO = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace';
  const LAYERS = [
    { i: 0, depth: 0.08, tile: 300, alpha: 0.16, size: 1.5, labels: false },
    { i: 1, depth: 0.22, tile: 480, alpha: 0.28, size: 2.2, labels: true },
    { i: 2, depth: 0.45, tile: 760, alpha: 0.34, size: 3, labels: true }
  ];
  const tileCache = new Map();

  function hash3(a, b, c) {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function rng(seed) {
    let a = seed;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function tilePoints(layer, ix, iy) {
    const key = layer.i + ':' + ix + ':' + iy;
    let pts = tileCache.get(key);
    if (pts) return pts;
    const r = rng(hash3(ix, iy, layer.i + 7));
    const n = 1 + Math.floor(r() * 3);
    pts = [];
    for (let k = 0; k < n; k++) {
      pts.push({
        x: (ix + r()) * layer.tile,
        y: (iy + r()) * layer.tile,
        ph: r() * Math.PI * 2,
        label: r() < 0.2,
        right: r() < 0.55,
        down: r() < 0.4
      });
    }
    if (tileCache.size > 5000) tileCache.clear();
    tileCache.set(key, pts);
    return pts;
  }

  /* Collected stars drift around the background */
  const floaters = [];
  function spawnFloater(id, fresh) {
    const idx = ENDINGS.indexOf(id);
    const r = rng(hash3(idx + 11, id.length, 3));
    // Golden-ratio spacing keeps stars spread out and starting on screen
    const spread = (v) => 0.12 + 0.76 * (v % 1);
    floaters.push({
      id,
      fx: spread(idx * 0.618034 + 0.31), fy: spread(idx * 0.381966 + 0.17),
      vx: (r() - 0.5) * 0.012, vy: (r() - 0.5) * 0.01,
      rot: r() * Math.PI * 2, vr: (r() - 0.5) * 0.25,
      size: 64 + r() * 56,
      depth: 0.02 + r() * 0.05,
      born: fresh ? performance.now() : -1
    });
  }
  earned.forEach((id) => spawnFloater(id, false));

  function drawFloaters(W, H, now, dt) {
    const inJourney = levels.length > 0;
    const span = { w: W + 240, h: H + 240 };
    for (const f of floaters) {
      if (!reduceMotion) {
        f.fx = (f.fx + f.vx * dt + 1) % 1;
        f.fy = (f.fy + f.vy * dt + 1) % 1;
        f.rot += f.vr * dt;
      }
      let x = (((f.fx * span.w - cam.x * f.depth) % span.w) + span.w) % span.w - 120;
      let y = (((f.fy * span.h - cam.y * f.depth) % span.h) + span.h) % span.h - 120;
      let size = f.size;
      let alpha = inJourney ? 0.5 : 0.95;
      if (f.born >= 0) {
        const t = clamp((now - f.born) / 1800, 0, 1);
        const e = ease(t);
        x = lerp(W / 2, x, e);
        y = lerp(H / 2, y, e);
        size = lerp(Math.min(W, H) * 0.42, size, e);
        alpha = lerp(1, alpha, e);
        if (t >= 1) f.born = -1;
      }
      const img = starImage(f.id);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(f.rot);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawGrid(W, H) {
    let g = 240;
    while (g * cam.s < 90) g *= 2;
    const s = cam.s;
    const left = cam.x - W / 2 / s, top = cam.y - H / 2 / s;
    ctx.strokeStyle = `rgba(${INK}, 0.08)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = Math.floor(left / g) * g; gx < left + W / s + g; gx += g) {
      for (let gy = Math.floor(top / g) * g; gy < top + H / s + g; gy += g) {
        const X = (gx - cam.x) * s + W / 2, Y = (gy - cam.y) * s + H / 2;
        ctx.moveTo(X - 4, Y); ctx.lineTo(X + 4, Y);
        ctx.moveTo(X, Y - 4); ctx.lineTo(X, Y + 4);
      }
    }
    ctx.stroke();
  }

  function drawSpace(now, dt) {
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    const t = reduceMotion ? 0 : now / 1000;
    drawGrid(W, H);

    for (const L of LAYERS) {
      const k = lerp(1, cam.s, L.depth) * (1 + warp * (1.2 + L.depth * 5));
      const ox = cam.x * L.depth + t * 5 * (L.i + 1);
      const oy = cam.y * L.depth + t * 1.5;
      const ix0 = Math.floor((ox - W / 2 / k) / L.tile) - 1, ix1 = Math.floor((ox + W / 2 / k) / L.tile) + 1;
      const iy0 = Math.floor((oy - H / 2 / k) / L.tile) - 1, iy1 = Math.floor((oy + H / 2 / k) / L.tile) + 1;
      const sx = (p) => (p.x + Math.sin(t * 0.3 + p.ph) * 10 - ox) * k + W / 2;
      const sy = (p) => (p.y + Math.cos(t * 0.23 + p.ph) * 10 - oy) * k + H / 2;

      ctx.strokeStyle = `rgba(${INK}, ${L.alpha * 0.42})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iy = iy0; iy <= iy1; iy++) {
          const pts = tilePoints(L, ix, iy);
          const a = pts[0];
          for (let j = 1; j < pts.length; j++) { ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(pts[j]), sy(pts[j])); }
          if (a.right) { const b = tilePoints(L, ix + 1, iy)[0]; ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(b), sy(b)); }
          if (a.down) { const nb = tilePoints(L, ix, iy + 1); const b = nb[nb.length - 1]; ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(b), sy(b)); }
        }
      }
      ctx.stroke();

      ctx.fillStyle = `rgba(${INK}, ${L.alpha})`;
      ctx.font = `9px ${MONO}`;
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iy = iy0; iy <= iy1; iy++) {
          for (const p of tilePoints(L, ix, iy)) {
            const X = sx(p), Y = sy(p);
            if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue;
            ctx.fillRect(X - L.size / 2, Y - L.size / 2, L.size, L.size);
            if (L.labels && p.label) ctx.fillText(`x: ${Math.round(p.x + 1200)} y: ${Math.round(p.y + 900)}`, X + 6, Y - 5);
          }
        }
      }
    }

    drawFloaters(W, H, now, dt);
  }

  let lastReadout = '';
  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    drawSpace(now, dt);
    if (levels.length) {
      const text = `x ${String(Math.round(cam.x + COORD_OFFSET.x)).padStart(5)}   y ${String(Math.round(cam.y + COORD_OFFSET.y)).padStart(5)}   zoom ${cam.s.toFixed(2)}   depth ${pad2(levels.length)}`;
      if (text !== lastReadout) {
        readout.textContent = text;
        lastReadout = text;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- start ---------- */

  let resizeTimer;
  window.addEventListener('resize', () => {
    resizeCanvas();
    applyCam();
    document.querySelectorAll('.pill').forEach(centerPillText);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const n = window.innerWidth < SETTINGS.narrowBreakpoint;
      if (n !== narrow) {
        narrow = n;
        document.body.classList.toggle('narrow', narrow);
        measureCache.clear();
        if (levels.length) rebuild(levels.map((l) => l.id));
      } else if (levels.length) {
        recenter();
      }
    }, 160);
  });

  document.body.classList.toggle('narrow', narrow);
  resizeCanvas();
  applyCam();
  tick();
  setInterval(tick, 10000);
  updateStarCount();
  requestAnimationFrame(frame);

  if (canHover && !reduceMotion) {
    enterBtn.addEventListener('pointermove', (e) => {
      const r = enterBtn.getBoundingClientRect();
      enterBtn.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      enterBtn.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
    });
  }

  const fontsReady = document.fonts
    ? Promise.allSettled([
        document.fonts.load('700 34px "Omnium"'),
        document.fonts.load('400 34px "Omnium"'),
        document.fonts.load('34px "Audiowide"'),
        document.fonts.load('10px "JetBrains Mono"')
      ])
    : Promise.resolve();

  enterBtn.addEventListener('click', async () => {
    await fontsReady;
    runWarp();
    startJourney();
  });

  // If a font arrives late, re-measure so boxes and buttons fit the real letters
  if (document.fonts) {
    document.fonts.addEventListener('loadingdone', () => {
      measureCache.clear();
      document.querySelectorAll('.pill').forEach(centerPillText);
    });
  }

  fontsReady.then(() => {
    measureCache.clear();
    centerPillText(enterBtn);
    const ids = parseHash();
    if (ids) rebuild(ids);
    else typeText(welcomeTitle, 'WELCOME', 85, false);
  });
})();
