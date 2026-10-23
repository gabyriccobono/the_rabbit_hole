/* =====================================================================
   THE RABBIT HOLE: collage stars
   Makes a different hand-made-looking star for every ending.
   The same ending always gets the same star. To use your own picture
   for an ending instead, add  star: "stars/your-file.png"  to that
   ending in paths.js.
   ===================================================================== */

window.RabbitStars = (() => {
  'use strict';

  const PAPER = '#fbf7ee';

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
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

  const pick = (r, list) => list[Math.floor(r() * list.length)];

  /* ---------- shapes ---------- */

  function starPoints(n, R, ratio, rot, r, wobble) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n;
      const rad = (i % 2 ? R * ratio : R) * (1 + (r() - 0.5) * wobble);
      const da = (r() - 0.5) * wobble * 0.35;
      pts.push([Math.cos(a + da) * rad, Math.sin(a + da) * rad]);
    }
    return pts;
  }

  // Break each edge into small pieces and nudge them, for a torn or hand-cut edge
  function roughen(pts, seg, amp, r) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const len = Math.hypot(nx, ny) || 1;
      for (let s = 0; s < seg; s++) {
        const t = s / seg;
        let x = a[0] + (b[0] - a[0]) * t;
        let y = a[1] + (b[1] - a[1]) * t;
        if (s > 0) {
          const k = (r() - 0.5) * amp;
          x += (nx / len) * k;
          y += (ny / len) * k;
        }
        out.push([x, y]);
      }
    }
    return out;
  }

  const scale = (pts, k) => pts.map(([x, y]) => [x * k, y * k]);

  function trace(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }

  // White cut-out border with a soft shadow, like a sticker on a collage
  function sticker(ctx, pts, w, color = PAPER) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = w * 1.6;
    ctx.shadowOffsetY = w * 0.6;
    trace(ctx, pts);
    ctx.lineJoin = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function shadowFill(ctx, pts, fill, blur) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = blur * 0.4;
    trace(ctx, pts);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function grain(ctx, pts, R, r, amount) {
    ctx.save();
    trace(ctx, pts);
    ctx.clip();
    for (let k = 0; k < amount; k++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.12)';
      const s = 0.6 + r() * 1.8;
      ctx.fillRect((r() - 0.5) * 2.2 * R, (r() - 0.5) * 2.2 * R, s, s);
    }
    ctx.restore();
  }

  function newsprint(ctx, pts, R, r) {
    const letters = 'abcdefghilmnoprstuvwy';
    ctx.save();
    trace(ctx, pts);
    ctx.clip();
    ctx.rotate((r() - 0.5) * 0.5);
    ctx.fillStyle = 'rgba(38,32,26,0.72)';
    const size = Math.max(5, R * 0.055);
    ctx.font = `${size}px Georgia, "Times New Roman", serif`;
    for (let y = -R * 1.1; y < R * 1.1; y += size * 1.25) {
      let line = '';
      while (line.length < 90) {
        const len = 2 + Math.floor(r() * 7);
        let w = '';
        for (let i = 0; i < len; i++) w += letters[Math.floor(r() * letters.length)];
        line += (r() < 0.1 ? w[0].toUpperCase() + w.slice(1) : w) + ' ';
      }
      ctx.fillText(line, -R * 1.2, y);
    }
    if (r() < 0.7) {
      ctx.font = `bold ${size * 2.4}px Georgia, serif`;
      ctx.fillText(pick(r, ['Il', 'The', 'Ar', 'Up', 'Sun', 'Of']), (r() - 0.5) * R * 0.8, (r() - 0.3) * R * 0.6);
    }
    ctx.restore();
  }

  function hatch(ctx, pts, R, r, color, angle, gap, width, alpha) {
    ctx.save();
    trace(ctx, pts);
    ctx.clip();
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let y = -R * 1.3; y < R * 1.3; y += gap * (0.7 + r() * 0.6)) {
      ctx.globalAlpha = alpha * (0.6 + r() * 0.5);
      ctx.lineWidth = width * (0.6 + r() * 0.8);
      ctx.beginPath();
      ctx.moveTo(-R * 1.3, y + (r() - 0.5) * 3);
      ctx.lineTo(R * 1.3, y + (r() - 0.5) * 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function scribbleOutline(ctx, pts, color, width, passes, r) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let p = 0; p < passes; p++) {
      ctx.globalAlpha = 0.55 + r() * 0.4;
      ctx.lineWidth = width * (0.7 + r() * 0.6);
      trace(ctx, pts.map(([x, y]) => [x + (r() - 0.5) * width * 1.4, y + (r() - 0.5) * width * 1.4]));
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- styles (one per look in your references) ---------- */

  const STYLES = {
    // Torn paper layers with newsprint (stars 4)
    torn(ctx, R, r) {
      const pal = pick(r, [
        ['#e9dfcc', '#e8b52c'], ['#c8414f', '#e57fae'], ['#3f6fb6', '#6fb3c7'], ['#d9cbb0', '#d0603f'], ['#2f5d4e', '#e9c46a']
      ]);
      const n = pick(r, [5, 6, 6, 7]);
      const base = starPoints(n, R, 0.44 + r() * 0.1, r() * Math.PI, r, 0.16);
      const outer = roughen(base, 9, R * 0.06, r);
      shadowFill(ctx, outer, pal[0], R * 0.06);
      grain(ctx, outer, R, r, 900);
      const mid = roughen(scale(base, 0.76), 9, R * 0.05, r);
      trace(ctx, mid);
      ctx.fillStyle = '#efe8d8';
      ctx.fill();
      newsprint(ctx, mid, R, r);
      const inner = roughen(scale(base, 0.46), 6, R * 0.02, r);
      shadowFill(ctx, inner, pal[1], R * 0.03);
      grain(ctx, inner, R, r, 500);
    },

    // Painted sunburst with a glowing middle (stars 3)
    sunburst(ctx, R, r) {
      const pal = pick(r, [['#e8628a', '#f39a2b'], ['#f2c230', '#f08a3a'], ['#e0483c', '#f7b02e'], ['#8fc3ea', '#f6e27a']]);
      const n = 8 + Math.floor(r() * 3);
      const pts = roughen(starPoints(n, R, 0.3 + r() * 0.12, r() * Math.PI, r, 0.3), 4, R * 0.03, r);
      sticker(ctx, pts, R * 0.07);
      trace(ctx, pts);
      ctx.fillStyle = pal[0];
      ctx.fill();
      ctx.save();
      trace(ctx, pts);
      ctx.clip();
      for (let k = 0; k < 40; k++) {
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = r() < 0.5 ? '#ffffff' : '#7a1e3a';
        ctx.beginPath();
        ctx.arc((r() - 0.5) * 2 * R, (r() - 0.5) * 2 * R, R * (0.04 + r() * 0.12), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.55);
      g.addColorStop(0, pal[1]);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.restore();
      grain(ctx, pts, R, r, 700);
    },

    // Crayon-filled star (stars 2)
    crayon(ctx, R, r) {
      const color = pick(r, ['#e23b2e', '#f4c430', '#7cc6ea', '#ef8fc8', '#f2a33a']);
      const n = pick(r, [5, 5, 5, 8, 9]);
      const pts = roughen(starPoints(n, R, n > 6 ? 0.36 : 0.45 + r() * 0.08, r() * Math.PI, r, 0.22), 6, R * 0.03, r);
      sticker(ctx, pts, R * 0.07);
      const a = r() * Math.PI;
      hatch(ctx, pts, R, r, color, a, 3.2, 3, 0.85);
      hatch(ctx, pts, R, r, color, a + 0.5 + r(), 4.5, 2.4, 0.6);
      scribbleOutline(ctx, pts, color, 2.6, 2, r);
    },

    // Hollow star drawn in marker on a paper cut-out (stars 2)
    outline(ctx, R, r) {
      const color = pick(r, ['#1d2c7a', '#f2b51f', '#c22d3a', '#1f6f5c']);
      const base = starPoints(5, R * 0.92, 0.42 + r() * 0.08, r() * Math.PI, r, 0.25);
      const cut = roughen(scale(base, 1.12), 5, R * 0.05, r);
      sticker(ctx, cut, R * 0.04);
      grain(ctx, cut, R, r, 500);
      scribbleOutline(ctx, base, color, R * 0.045, 3, r);
    },

    // Black woodcut stamp with speckles (stars 1, top left)
    stamp(ctx, R, r) {
      const base = starPoints(5, R, 0.42 + r() * 0.08, r() * Math.PI, r, 0.18);
      const pts = roughen(base, 7, R * 0.04, r);
      sticker(ctx, pts, R * 0.07);
      trace(ctx, pts);
      ctx.fillStyle = '#141414';
      ctx.fill();
      ctx.save();
      trace(ctx, pts);
      ctx.clip();
      for (let k = 0; k < 2600; k++) {
        const x = (r() - 0.5) * 2 * R, y = (r() - 0.5) * 2 * R;
        if (r() < 0.55) continue;
        ctx.fillStyle = `rgba(245,240,230,${0.25 + r() * 0.6})`;
        ctx.fillRect(x, y, 1 + r() * 1.6, 1 + r() * 1.6);
      }
      ctx.restore();
      scribbleOutline(ctx, roughen(scale(base, 0.58), 5, R * 0.03, r), '#f3eee4', R * 0.05, 2, r);
    },

    // Wobbly star with a little face (stars 1)
    face(ctx, R, r) {
      const sleepy = r() < 0.45;
      const fill = sleepy ? pick(r, ['#dcc7a0', '#e8d6b0']) : pick(r, ['#f2c230', '#f6cf3e']);
      const n = sleepy ? 5 : pick(r, [6, 7, 8]);
      const pts = roughen(starPoints(n, R, sleepy ? 0.5 : 0.52, r() * Math.PI, r, 0.28), 4, R * 0.025, r);
      sticker(ctx, pts, R * 0.06);
      trace(ctx, pts);
      ctx.fillStyle = fill;
      ctx.fill();
      grain(ctx, pts, R, r, 900);
      ctx.save();
      ctx.strokeStyle = '#3b2a1a';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.5, R * 0.022);
      const ex = R * 0.13, ey = -R * 0.06;
      if (sleepy) {
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.arc(s * ex, ey, R * 0.06, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(0, ey + R * 0.03);
        ctx.lineTo(-R * 0.02, ey + R * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, ey + R * 0.2, R * 0.04, 0, Math.PI);
        ctx.stroke();
      } else {
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * ex, ey - R * 0.04);
          ctx.lineTo(s * ex, ey + R * 0.02);
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.arc(0, ey + R * 0.04, R * 0.15, 0.18 * Math.PI, 0.82 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = 'rgba(232,96,120,0.45)';
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.arc(s * R * 0.2, ey + R * 0.1, R * 0.045, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();
    },

    // Star with a spiral (stars 1)
    spiral(ctx, R, r) {
      const pal = pick(r, [['#4b2d74', '#e6d84a'], ['#4d5ca8', '#232a5a'], ['#2f7f86', '#f2e7c9'], ['#b8336a', '#fbd96b']]);
      const n = pick(r, [5, 5, 6]);
      const pts = roughen(starPoints(n, R, 0.45 + r() * 0.1, r() * Math.PI, r, 0.35), 4, R * 0.03, r);
      sticker(ctx, pts, R * 0.06);
      trace(ctx, pts);
      ctx.fillStyle = pal[0];
      ctx.fill();
      ctx.save();
      trace(ctx, pts);
      ctx.clip();
      ctx.strokeStyle = pal[1];
      ctx.lineCap = 'round';
      ctx.lineWidth = R * 0.07;
      ctx.beginPath();
      const turns = 3 + r() * 2;
      for (let t = 0; t < Math.PI * 2 * turns; t += 0.08) {
        const rad = (t / (Math.PI * 2 * turns)) * R * 0.95;
        const x = Math.cos(t) * rad, y = Math.sin(t) * rad;
        t ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      grain(ctx, pts, R, r, 600);
    },

    // Chrome or bronze pin (stars 1)
    metal(ctx, R, r) {
      const bronze = r() < 0.5;
      const pts = starPoints(5, R * 0.95, 0.5, r() * Math.PI, r, 0.08);
      const g = ctx.createLinearGradient(-R, -R, R, R);
      if (bronze) {
        g.addColorStop(0, '#d8b77a'); g.addColorStop(0.45, '#7a5e33'); g.addColorStop(0.7, '#b8955a'); g.addColorStop(1, '#4e3b1f');
      } else {
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#9a9ca3'); g.addColorStop(0.55, '#f2f2f4'); g.addColorStop(0.8, '#55575d'); g.addColorStop(1, '#c9cacf');
      }
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = R * 0.08;
      ctx.shadowOffsetY = R * 0.04;
      trace(ctx, pts);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = R * 0.12;
      ctx.strokeStyle = g;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      trace(ctx, scale(pts, 0.82));
      ctx.lineWidth = R * 0.02;
      ctx.strokeStyle = bronze ? 'rgba(60,40,15,0.5)' : 'rgba(255,255,255,0.7)';
      ctx.stroke();
      if (bronze) {
        ctx.fillStyle = 'rgba(50,34,12,0.55)';
        for (let k = 0; k < 9; k++) {
          const a = r() * Math.PI * 2, d = r() * R * 0.45;
          const x = Math.cos(a) * d, y = Math.sin(a) * d;
          ctx.save();
          ctx.translate(x, y);
          trace(ctx, starPoints(5, R * 0.06, 0.45, r(), r, 0));
          ctx.fill();
          ctx.restore();
        }
      } else {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-R * 0.18, -R * 0.2, R * 0.09, R * 0.035, -0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },

    // Colored-pencil star drawn on paper (stars 1, bottom)
    pencil(ctx, R, r) {
      const base = starPoints(5, R * 0.9, 0.38 + r() * 0.1, r() * Math.PI, r, 0.35);
      const cut = roughen(scale(base, 1.12), 5, R * 0.04, r);
      sticker(ctx, cut, R * 0.03);
      const colors = ['#e2473a', '#3a6fd8', '#f2b12a', '#47a35b', '#d65fb0'];
      colors.forEach((c, i) => {
        if (r() < 0.75) hatch(ctx, base, R, r, c, r() * Math.PI, 7 + i, 1.4, 0.45);
      });
      scribbleOutline(ctx, base, pick(r, colors), 1.8, 2, r);
      scribbleOutline(ctx, base, pick(r, colors), 1.4, 1, r);
    }
  };

  const ORDER = ['torn', 'sunburst', 'crayon', 'face', 'stamp', 'spiral', 'outline', 'metal', 'pencil'];
  const cache = new Map();

  // Draw a star for an ending id. "index" spreads the styles evenly across endings.
  function make(id, index, size = 360) {
    const key = id + '|' + size;
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const r = rng(hashStr(id));
    const style = ORDER[(index >= 0 ? index : hashStr(id)) % ORDER.length];
    ctx.translate(size / 2, size / 2);
    ctx.rotate((r() - 0.5) * 0.6);
    STYLES[style](ctx, size * 0.4, r);
    cache.set(key, c);
    return c;
  }

  return { make };
})();
