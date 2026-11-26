/* Last Seed effect library (procedural, canvas 2D). No images: every effect is drawn each frame, so it scales to any screen.
   LSFX.play(name, x, y, opts) → draws on a full-screen canvas over `opts.host` (default: #overlay or body).
   opts: size (px, roughly the hit's scale), col (main colour), dir (1 = travels right, -1 = left), delay (ms), speed (multiplier)
   Effects: impact, shatter, flameFan, fireball, runeCircle, starStorm, goldTunnel, blackout, speedPanel, ringWave, emberRise, iceLance */
(function () {
  const TAU = Math.PI * 2, cl = t => Math.max(0, Math.min(1, t)), ease = t => 1 - Math.pow(1 - t, 3), easeIn = t => t * t * t, rnd = (a, b) => a + Math.random() * (b - a);
  const hex = (c, a) => { c = String(c).replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const n = parseInt(c, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  const hsl = (h, a, l) => `hsla(${h % 360},100%,${l || 62}%,${a})`;
  let cv = null, cx = null, list = [], raf = 0, dpr = 1, host = null;
  function ensure(h) {
    h = h || document.getElementById('overlay') || document.body;
    if (cv && cv.isConnected && host === h) return; if (cv) cv.remove(); host = h;
    cv = document.createElement('canvas'); cv.className = 'lsfx';
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60';
    h.appendChild(cv); cx = cv.getContext('2d'); size();
  }
  function size() { if (!cv) return; dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  addEventListener('resize', size);
  function tick(now) {
    raf = 0; if (!cv) return; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
    // under-layers (blackouts, panels) first, then everything else
    list.sort((a, b) => (a.z || 0) - (b.z || 0));
    list = list.filter(e => { const t = (now - e.t0) / e.dur; if (t >= 1) return false; if (t >= 0) { cx.save(); try { e.draw(cx, t, (now - e.t0) / 1000); } catch (err) { if (!e._w) { e._w = 1; console.warn('LSFX draw', err.message); } } cx.restore(); } return true; });
    if (list.length) raf = requestAnimationFrame(tick); else { cv.remove(); cv = null; }
  }
  function add(e, o) { ensure(o && o.host); const sp = (o && o.speed) || (window.__LS && window.__LS.speed) || 1; e.dur *= sp; e.t0 = performance.now() + ((o && o.delay) || 0) * sp; list.push(e); if (!raf) raf = requestAnimationFrame(tick); }
  const reduced = () => document.body.classList.contains('reduce') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const glowDot = (c, x, y, r, inner, outer) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, inner); g.addColorStop(1, outer); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const star5 = (c, x, y, r, rot) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); };
  // flame colour along a 0 (white-hot) → 1 (dark red smoke) ramp
  const flame = (k, a) => { const s = [[255, 255, 236], [255, 230, 110], [255, 150, 40], [235, 60, 20], [110, 20, 20]], f = cl(k) * (s.length - 1), i = Math.min(s.length - 2, f | 0), u = f - i, A = s[i], B = s[i + 1]; return `rgba(${A[0] + (B[0] - A[0]) * u | 0},${A[1] + (B[1] - A[1]) * u | 0},${A[2] + (B[2] - A[2]) * u | 0},${a})`; };

  const FX = {
    // white-hot hit: long tapered light beams, a coloured ring, pixel debris
    impact(x, y, o) {
      const S = o.size || 220, col = o.col || '#ff3d5a', n = o.n || 14;
      const beams = [...Array(n)].map((_, i) => ({ a: i / n * TAU + rnd(-.18, .18), l: rnd(1.4, 2.8), w: rnd(.04, .1) }));
      const bits = [...Array(26)].map(() => ({ a: rnd(0, TAU), v: rnd(.8, 2.2), s: rnd(3, 9), c: Math.random() < .5 ? '#fff' : col }));
      add({ dur: 560, draw(c, t) {
        const e = ease(t), f = 1 - t; c.globalCompositeOperation = 'lighter';
        for (const b of beams) { const L = S * b.l * (.3 + e * .7), W = S * b.w * f, a = b.a, px = -Math.sin(a), py = Math.cos(a);
          const g = c.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L); g.addColorStop(0, `rgba(255,255,255,${f})`); g.addColorStop(.5, hex(col, .6 * f)); g.addColorStop(1, hex(col, 0));
          c.fillStyle = g; c.beginPath(); c.moveTo(x + px * W, y + py * W); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.lineTo(x - px * W, y - py * W); c.closePath(); c.fill(); }
        glowDot(c, x, y, S * (.35 + e * .45), `rgba(255,255,255,${.95 * f})`, 'rgba(255,255,255,0)');
        c.beginPath(); c.arc(x, y, S * (.4 + e * 1.1), 0, TAU); c.strokeStyle = hex(col, .3 * f); c.lineWidth = Math.max(4, S * .08 * f); c.stroke(); c.strokeStyle = hex(col, .9 * f); c.lineWidth = Math.max(1.5, S * .025 * f); c.stroke();
        for (const p of bits) { const d = S * p.v * e; c.fillStyle = p.c === '#fff' ? `rgba(255,255,255,${f})` : hex(p.c, f); c.fillRect(x + Math.cos(p.a) * d - p.s / 2, y + Math.sin(p.a) * d - p.s / 2, p.s, p.s); }
      } }, o);
      if (!reduced()) FX.ringWave(x, y, Object.assign({}, o, { size: S * 1.3, col, delay: (o.delay || 0) + 60 }));
    },
    // ice breaking apart: glassy shards fly along `dir`, glitter trail and a pale streak
    shatter(x, y, o) {
      const S = o.size || 200, dir = o.dir || 1, col = o.col || '#9fe6ff';
      const sh = [...Array(28)].map(() => { const a = (dir > 0 ? 0 : Math.PI) + rnd(-.85, .85); return { a, v: S * rnd(1.4, 4), r: rnd(0, TAU), vr: rnd(-9, 9), w: S * rnd(.05, .16), h: S * rnd(.12, .34), k: rnd(.6, 1) }; });
      const gl = [...Array(60)].map(() => ({ a: (dir > 0 ? 0 : Math.PI) + rnd(-.5, .5), v: S * rnd(.8, 3.4), s: rnd(1, 3.5), tw: rnd(0, TAU) }));
      add({ dur: 900, draw(c, t, sec) {
        const f = 1 - easeIn(t), e = ease(t); c.globalCompositeOperation = 'lighter';
        // the streak
        if (t < .5) { const k = 1 - t / .5, L = S * 3.4 * ease(t / .5); const g = c.createLinearGradient(x, y, x + dir * L, y); g.addColorStop(0, `rgba(255,255,255,${.0})`); g.addColorStop(.6, hex(col, .55 * k)); g.addColorStop(1, `rgba(255,255,255,${.9 * k})`); c.strokeStyle = g; c.lineWidth = S * .06 * k + 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * L, y - L * .05); c.stroke(); }
        for (const p of sh) { const d = p.v * e, px = x + Math.cos(p.a) * d, py = y + Math.sin(p.a) * d + S * 1.2 * t * t, r = p.r + p.vr * sec;
          c.save(); c.translate(px, py); c.rotate(r); const g = c.createLinearGradient(0, -p.h / 2, 0, p.h / 2); g.addColorStop(0, `rgba(255,255,255,${.95 * f * p.k})`); g.addColorStop(.5, hex(col, .7 * f * p.k)); g.addColorStop(1, hex('#3a7bd5', .5 * f * p.k));
          c.fillStyle = g; c.beginPath(); c.moveTo(0, -p.h / 2); c.lineTo(p.w / 2, p.h * .1); c.lineTo(0, p.h / 2); c.lineTo(-p.w / 2, -p.h * .05); c.closePath(); c.fill();
          c.strokeStyle = `rgba(255,255,255,${.8 * f})`; c.lineWidth = 1; c.stroke(); c.restore(); }
        for (const p of gl) { const d = p.v * e, al = f * (.5 + .5 * Math.sin(p.tw + sec * 30)); c.fillStyle = `rgba(220,250,255,${al})`; c.fillRect(x + Math.cos(p.a) * d, y + Math.sin(p.a) * d + S * .4 * t * t, p.s, p.s); }
        if (t < .25) glowDot(c, x, y, S * .7, `rgba(255,255,255,${(1 - t / .25) * .9})`, hex(col, 0));
      } }, o);
    },
    // a sweeping fan of flame: puffs laid along an arc that bloom white → orange → smoke, embers flicking off
    flameFan(x, y, o) {
      const S = o.size || 240, dir = o.dir || 1, a0 = dir > 0 ? -1.5 : Math.PI + 1.5, sw = dir > 0 ? 2.1 : -2.1, R = S * 1.05;
      const puffs = [...Array(80)].map((_, i) => { const u = i / 79; return { u, a: a0 + sw * u, r: R * rnd(.5, 1.1), s: S * rnd(.18, .36) * (1 - Math.abs(u - .55) * .6), j: rnd(-.1, .1) }; });
      const em = [...Array(40)].map(() => ({ u: Math.random(), v: rnd(.4, 1.2), s: rnd(1.5, 4) }));
      add({ dur: 760, draw(c, t) {
        const head = ease(cl(t / .35)); c.globalCompositeOperation = 'lighter';
        for (const p of puffs) { if (p.u > head) continue; const age = cl((t - p.u * .35) / .65), a = p.a + p.j, px = x + Math.cos(a) * p.r, py = y + Math.sin(a) * p.r - age * S * .25, r = p.s * (.6 + age * 1.3);
          glowDot(c, px, py, r, flame(age * .85, Math.min(1, (1 - age) * 1.25)), flame(age * .85 + .25, 0)); }
        for (const p of em) { if (p.u > head) continue; const a = a0 + sw * p.u, age = cl((t - p.u * .35) / .65), d = R * (1 + age * p.v * .8); c.fillStyle = flame(.3 + age * .4, 1 - age); c.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d - age * S * .5, p.s, p.s); }
      } }, o);
    },
    // a rolling fire explosion: layered churning blobs, a white-hot core, a ground scorch and black flecks
    fireball(x, y, o) {
      const S = o.size || 300, gy = o.ground != null ? o.ground : y + S * .55;
      const blobs = [...Array(40)].map(() => ({ a: rnd(0, TAU), d: rnd(0, .55), s: rnd(.22, .48), w: rnd(-1.5, 1.5), k: rnd(0, .35) }));
      const fl = [...Array(36)].map(() => ({ a: rnd(-Math.PI, 0) + rnd(-.3, .3), v: rnd(.6, 1.7), s: rnd(2, 6), dark: Math.random() < .5 }));
      add({ dur: 1150, draw(c, t, sec) {
        const e = ease(cl(t / .45)), f = t < .55 ? 1 : 1 - (t - .55) / .45, R = S * (.35 + e * .75);
        // ground scorch / light pool
        c.globalCompositeOperation = 'lighter'; c.save(); c.translate(x, gy); c.scale(1, .22); glowDot(c, 0, 0, R * 1.6, flame(.2, .55 * f), flame(.5, 0)); c.restore();
        c.globalCompositeOperation = 'source-over';
        for (const pass of [0, 1, 2]) for (const b of blobs) { const a = b.a + b.w * sec * .6, d = R * b.d * (1.15 - pass * .3), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .85 - t * S * .18 - pass * R * .05, r = R * b.s * (1.05 - pass * .28) * (1 + .15 * Math.sin(sec * 8 + b.a + pass));
          const k = [.78, .5, .25][pass] + t * .35 + b.k * .3; glowDot(c, px, py, r, flame(k, (pass ? .8 : .55) * f), flame(k + .12, 0)); }
        c.globalCompositeOperation = 'lighter';
        glowDot(c, x, y - t * S * .12, R * .42 * (1 - t * .7), `rgba(255,250,220,${.8 * f})`, 'rgba(255,200,90,0)');
        c.globalCompositeOperation = 'source-over';
        for (const p of fl) { const d = S * p.v * ease(t), px = x + Math.cos(p.a) * d, py = y + Math.sin(p.a) * d + S * .9 * t * t; c.fillStyle = p.dark ? `rgba(30,10,8,${f})` : flame(.25, f); c.fillRect(px, py, p.s, p.s); }
      } }, o);
      if (!reduced()) FX.ringWave(x, y, { size: S * 1.5, col: '#ffb347', delay: (o.delay || 0) + 40, host: o.host, speed: o.speed });
    },
    // a summoning circle on the floor: two counter-turning rings, runes, a star, a soft column of light
    runeCircle(x, y, o) {
      const S = o.size || 220, col = o.col || '#5fb6ff', hold = o.hold || 1;
      const runes = [...Array(18)].map(() => [...Array(3)].map(() => [rnd(-1, 1), rnd(-1, 1)]));
      add({ dur: 1500 * hold, draw(c, t, sec) {
        const inn = ease(cl(t / .2)), f = t < .75 ? 1 : 1 - (t - .75) / .25, R = S * (.5 + .5 * inn);
        c.globalCompositeOperation = 'lighter'; c.save(); c.translate(x, y); c.scale(1, .3);
        glowDot(c, 0, 0, R * 1.15, hex(col, .35 * f), hex(col, 0));
        c.strokeStyle = hex(col, .3 * f); c.lineWidth = 10; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke(); c.lineWidth = 7; c.beginPath(); c.arc(0, 0, R * .55, 0, TAU); c.stroke();
        c.strokeStyle = hex(col, .95 * f); c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R * .9, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, R * .55, 0, TAU); c.stroke();
        // ticks on the outer band, turning
        c.save(); c.rotate(sec * .8); c.beginPath(); for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; c.moveTo(Math.cos(a) * R * .9, Math.sin(a) * R * .9); c.lineTo(Math.cos(a) * R * (i % 4 ? .94 : .99), Math.sin(a) * R * (i % 4 ? .94 : .99)); } c.stroke(); c.restore();
        // runes between the rings, counter-turning
        c.save(); c.rotate(-sec * .5); c.lineWidth = 1.6; c.beginPath(); runes.forEach((g, i) => { const a = i / runes.length * TAU, rx = Math.cos(a) * R * .725, ry = Math.sin(a) * R * .725, k = R * .06; g.forEach((p, j) => { const px = rx + p[0] * k, py = ry + p[1] * k; j ? c.lineTo(px, py) : c.moveTo(px, py); }); }); c.stroke(); c.restore();
        // a six-point star inside
        c.save(); c.rotate(sec * .35); for (const off of [0, Math.PI]) { c.beginPath(); for (let i = 0; i < 3; i++) { const a = off + i / 3 * TAU - Math.PI / 2; c.lineTo(Math.cos(a) * R * .55, Math.sin(a) * R * .55); } c.closePath(); c.stroke(); } c.restore();
        c.restore();
        // a faint column rising out of it
        c.save(); c.translate(x, y - S * .55); c.scale(.8, 2.2); glowDot(c, 0, 0, R * .75, hex(col, .26 * f * inn), hex(col, 0)); c.restore();
        for (let i = 0; i < 14; i++) { const u = (i * .137 + sec * .45) % 1, px = x + Math.sin(i * 7.3) * R * .7; c.fillStyle = hex('#ffffff', (1 - u) * f * .8); c.fillRect(px, y - u * S * 1.4, 2, 2 + 6 * (1 - u)); }
      } }, o);
    },
    // a rainbow star explosion with tilted orbit trails and twinkles
    starStorm(x, y, o) {
      const S = o.size || 260, h0 = rnd(0, 360);
      const st = [...Array(44)].map((_, i) => ({ a: rnd(0, TAU), v: S * rnd(.4, 1.9), r: S * rnd(.04, .11), rot: rnd(0, TAU), vr: rnd(-6, 6), h: h0 + i * 23 }));
      const orb = [{ tilt: -.5, rx: 1.25, ry: .38, h: h0 }, { tilt: .7, rx: 1.1, ry: .32, h: h0 + 140 }];
      add({ dur: 1150, draw(c, t, sec) {
        const e = ease(t), f = t < .6 ? 1 : 1 - (t - .6) / .4; c.globalCompositeOperation = 'lighter';
        glowDot(c, x, y, S * (.3 + e * .5), `rgba(255,255,255,${.8 * (1 - t)})`, 'rgba(255,255,255,0)');
        for (const q of orb) { c.save(); c.translate(x, y); c.rotate(q.tilt); const span = TAU * ease(cl(t / .5)); c.lineWidth = S * .035 * f + 1; c.lineCap = 'round';
          for (let k = 0; k < 24; k++) { const a = sec * 3 + k / 24 * span; c.strokeStyle = hsl(q.h + k * 15, f * k / 24, 65); c.beginPath(); c.ellipse(0, 0, S * q.rx * (.6 + e * .4), S * q.ry * (.6 + e * .4), 0, a, a + span / 24 + .02); c.stroke(); } c.restore(); }
        for (const p of st) { const d = p.v * e, px = x + Math.cos(p.a) * d, py = y + Math.sin(p.a) * d + S * .3 * t * t; const rr = p.r * (1 - t * .4), ro = p.rot + p.vr * sec; c.fillStyle = hsl(p.h + sec * 200, .3 * f, 60); star5(c, px, py, rr * 1.7, ro); c.fill(); c.fillStyle = hsl(p.h + sec * 200, f, 66); star5(c, px, py, rr, ro); c.fill(); }
        for (let i = 0; i < 18; i++) { const a = i * 2.39, d = S * (.3 + (i % 5) * .3) * e, tw = .5 + .5 * Math.sin(sec * 22 + i), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, k = 7 * tw * f; c.strokeStyle = `rgba(255,255,255,${tw * f})`; c.lineWidth = 1.3; c.beginPath(); c.moveTo(px - k, py); c.lineTo(px + k, py); c.moveTo(px, py - k); c.lineTo(px, py + k); c.stroke(); }
      } }, o);
    },
    // a golden energy tunnel: rings rushing out of a bright centre, radial streaks
    goldTunnel(x, y, o) {
      const S = o.size || 320, col = o.col || '#ffc94d', N = 9;
      const sk = [...Array(40)].map(() => ({ a: rnd(0, TAU), o: Math.random(), l: rnd(.1, .3) }));
      add({ dur: 1000, draw(c, t, sec) {
        const f = t < .7 ? 1 : 1 - (t - .7) / .3; c.globalCompositeOperation = 'lighter';
        glowDot(c, x, y, S * 1.4, hex(col, .35 * f), hex(col, 0));
        for (let i = 0; i < N; i++) { const u = ((i / N) + sec * 1.6) % 1, r = S * .1 + S * 1.6 * u * u, al = f * (1 - u) * .9; c.beginPath(); c.ellipse(x, y, r, r * .92, 0, 0, TAU); c.strokeStyle = hex(col, al * .3); c.lineWidth = 8 + 26 * u; c.stroke(); c.strokeStyle = hex(col, al); c.lineWidth = 2 + 10 * u; c.stroke(); }
        for (const s of sk) { const u = (s.o + sec * 1.2) % 1, r0 = S * (.15 + u * 1.5), r1 = r0 + S * s.l; c.strokeStyle = `rgba(255,248,220,${f * (1 - u) * .8})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + Math.cos(s.a) * r0, y + Math.sin(s.a) * r0); c.lineTo(x + Math.cos(s.a) * r1, y + Math.sin(s.a) * r1); c.stroke(); }
        glowDot(c, x, y, S * .32, `rgba(255,255,245,${f})`, hex(col, 0));
      } }, o);
    },
    // the super blackout: the screen drops to black, a burning floor grid scrolls underneath, embers rise
    blackout(x, y, o) {
      const hold = o.hold || 1, col = o.col || '#ff7a1a', floor = o.floor != null ? o.floor : innerHeight * .72;
      const em = [...Array(70)].map(() => ({ x: Math.random(), y: Math.random(), v: rnd(.15, .5), s: rnd(1, 3) }));
      add({ z: -10, dur: 1800 * hold, draw(c, t, sec) {
        const W = innerWidth, H = innerHeight, f = t < .12 ? t / .12 : t > .85 ? 1 - (t - .85) / .15 : 1;
        c.fillStyle = `rgba(4,2,4,${.92 * f})`; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'lighter';
        const hz = floor, g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, hex(col, 0)); g.addColorStop(1, hex(col, .35 * f)); c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
        c.strokeStyle = hex(col, .55 * f); c.lineWidth = 1;
        for (let i = 0; i < 14; i++) { const u = ((i / 14) + sec * .35) % 1, yy = hz + (H - hz) * u * u; c.globalAlpha = .3 + .7 * u; c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke(); }
        for (let i = -16; i <= 16; i++) { c.globalAlpha = .6; c.beginPath(); c.moveTo(x + i * 18, hz); c.lineTo(x + i * W * .14, H); c.stroke(); }
        c.globalAlpha = 1;
        for (const p of em) { const yy = ((p.y - sec * p.v) % 1 + 1) % 1, fl = .5 + .5 * Math.sin(sec * 9 + p.x * 40); c.fillStyle = flame(.3, f * fl * yy); c.fillRect(p.x * W, hz * .3 + yy * (H - hz * .3), p.s, p.s * 2.5); }
      } }, o);
    },
    // a manga panel flash: the screen turns a flat colour with speed lines rushing at the focus point
    speedPanel(x, y, o) {
      const col = o.col || '#ff3fb4', n = o.n || 90, hold = o.hold || 1;
      const ln = [...Array(n)].map(() => ({ a: rnd(0, TAU), w: rnd(.004, .02), r: rnd(.18, .42) }));
      add({ z: -5, dur: 700 * hold, draw(c, t, sec) {
        const W = innerWidth, H = innerHeight, f = t < .08 ? t / .08 : t > .8 ? 1 - (t - .8) / .2 : 1, L = Math.hypot(W, H);
        c.fillStyle = hex(col, .88 * f); c.fillRect(0, 0, W, H);
        const g = c.createRadialGradient(x, y, 0, x, y, L * .6); g.addColorStop(0, `rgba(255,255,255,${.55 * f})`); g.addColorStop(.4, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = `rgba(255,255,255,${.85 * f})`; const jit = Math.floor(sec * 30);
        ln.forEach((l, i) => { if ((i + jit) % 3 === 0) return; const r0 = L * l.r, a = l.a, w = l.w; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a - w) * L, y + Math.sin(a - w) * L); c.lineTo(x + Math.cos(a + w) * L, y + Math.sin(a + w) * L); c.closePath(); c.fill(); });
      } }, o);
    },
    // a big thin shockwave ring (a little off-round, glowing)
    ringWave(x, y, o) {
      const S = o.size || 300, col = o.col || '#ff3d5a';
      add({ dur: 650, draw(c, t) { const e = ease(t), f = 1 - t; c.globalCompositeOperation = 'lighter'; c.beginPath(); c.ellipse(x, y, S * (.3 + e), S * (.3 + e) * .96, .2, 0, TAU); c.strokeStyle = hex(col, .3 * f); c.lineWidth = Math.max(4, S * .1 * f); c.stroke(); c.strokeStyle = hex(col, .9 * f); c.lineWidth = Math.max(1, S * .03 * f); c.stroke(); c.lineWidth = Math.max(.6, S * .008 * f); c.strokeStyle = `rgba(255,255,255,${f})`; c.stroke(); } }, o);
    },
    // embers and heat rising off a burning fighter or the ground
    emberRise(x, y, o) {
      const S = o.size || 160, hold = o.hold || 1;
      const em = [...Array(90)].map(() => ({ x: rnd(-.55, .55), o: Math.random(), v: rnd(.5, 1.2), s: rnd(2.5, 6), w: rnd(0, TAU) }));
      add({ dur: 1400 * hold, draw(c, t, sec) { const f = t < .15 ? t / .15 : t > .7 ? 1 - (t - .7) / .3 : 1; c.globalCompositeOperation = 'lighter';
        for (const p of em) { const u = (p.o + sec * p.v * .7) % 1, px = x + p.x * S + Math.sin(p.w + sec * 4) * S * .06, py = y - u * S * 1.6; glowDot(c, px, py, p.s * 3.2, flame(.3 + u * .4, .35 * f * (1 - u)), flame(.6, 0)); c.fillStyle = flame(.1 + u * .45, f * (1 - u)); c.fillRect(px - p.s / 2, py, p.s, p.s * 1.8); }
        c.save(); c.translate(x, y); c.scale(1, .25); glowDot(c, 0, 0, S * .7, flame(.35, .35 * f), flame(.6, 0)); c.restore(); } }, o);
    },
    // an ice lance: a long crystal spear drives across, leaving frost
    iceLance(x, y, o) {
      const S = o.size || 260, dir = o.dir || 1, col = o.col || '#9fe6ff', x1 = o.tx != null ? o.tx : x + dir * S * 3, y1 = o.ty != null ? o.ty : y;
      add({ dur: 520, draw(c, t) { const g0 = ease(cl(t / .3)), f = t < .45 ? 1 : 1 - (t - .45) / .55, hx = x + (x1 - x) * g0, hy = y + (y1 - y) * g0, a = Math.atan2(y1 - y, x1 - x), L = S * .9, W = S * .09;
        c.globalCompositeOperation = 'lighter'; c.save(); c.translate(hx, hy); c.rotate(a);
        const g = c.createLinearGradient(-L, 0, 0, 0); g.addColorStop(0, hex(col, 0)); g.addColorStop(.7, hex(col, .7 * f)); g.addColorStop(1, `rgba(255,255,255,${f})`); c.fillStyle = g;
        c.beginPath(); c.moveTo(S * .25, 0); c.lineTo(0, -W); c.lineTo(-L, -W * .3); c.lineTo(-L, W * .3); c.lineTo(0, W); c.closePath(); c.fill(); c.restore();
        // frost trail of little crystals
        for (let i = 0; i < 16; i++) { const u = i / 16 * g0, px = x + (x1 - x) * u, py = y + (y1 - y) * u + Math.sin(i * 3.1) * W * 1.4; c.fillStyle = `rgba(220,250,255,${f * (1 - u) * .9})`; star5(c, px, py, W * .35, i); c.fill(); } } }, o);
      FX.shatter(x1, y1, { size: S * .8, dir, col, delay: (o.delay || 0) + 150, host: o.host, speed: o.speed });
    },
  };

  const LSFX = {
    list: Object.keys(FX),
    play(name, x, y, o) { const f = FX[name]; if (!f) return false; try { f(x, y, o || {}); return true; } catch (e) { console.warn('LSFX', name, e); return false; } },
    clear() { list = []; if (cv) { cv.remove(); cv = null; } },
  };
  window.LSFX = LSFX;
})();
