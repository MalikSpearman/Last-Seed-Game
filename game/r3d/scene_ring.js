// The Tournament Ring (the main bracket arena, img/arena.webp): a great stone colosseum under a full moon. A cracked
// flagstone floor with a gold ring inlaid around the fighting circle, a low rim wall hung with crimson pennants, packed
// stands rising in three lantern-lit tiers behind it, floodlight banks on masts, tall stone pillars carrying huge crimson
// bracket banners, flaming braziers on plinths at the front corners, the judges' pagoda over the far gate with the
// crescent banner, streamers across the sky and embers drifting up.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, ctex, cvs, bannerTex, flames, drift, scatter, decals, pagoda, model } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2], [-4.4, -2.2], [1.6, -3.4]], sum: [-5.6, .8], exposure: 1.5 };

// the crowd: rows of heads and shoulders in the dark, picked out by lantern light, with glowsticks and phone lights
const crowd = glow => cvs(1024, 256, (g, W, H) => { const R = rng(glow ? 31 : 30); g.fillStyle = glow ? '#000' : '#1e1430'; g.fillRect(0, 0, W, H);
  for (let row = 0; row < 7; row++) { const y = 24 + row * 34, s = 9 + row * .6;
    for (let x = R.r(0, 14); x < W; x += R.r(13, 19)) { const lit = R(); if (!glow) { g.fillStyle = `hsl(${R.r(250, 330)},${R.r(15, 35)}%,${R.r(16, 30) + lit * 14}%)`; g.beginPath(); g.ellipse(x, y + s * 1.4, s * 1.1, s * .9, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x, y, s * .55, 0, 7); g.fill(); }
      if (R() < .05) { g.fillStyle = ['#ff70c0', '#70e0ff', '#ffd060', '#ffffff'][(R() * 4) | 0]; g.globalAlpha = glow ? 1 : .8; g.fillRect(x - 1.5, y - s * 1.4, 3, s * 1.1); g.globalAlpha = 1; }
      else if (glow && lit > .8) { g.fillStyle = `rgba(255,170,90,${(lit - .8) * 1.6})`; g.beginPath(); g.arc(x, y, s * .5, 0, 7); g.fill(); } } }
  if (!glow) { g.fillStyle = 'rgba(255,150,80,.06)'; g.fillRect(0, 0, W, H); } });
// the bracket emblem on the big banners (a gold tournament bracket over a flame)
const bracketEmblem = (g, cx, cy) => { g.strokeStyle = '#f0c766'; g.lineWidth = 9; g.lineCap = 'square';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 70, cy - 70); g.lineTo(cx + s * 40, cy - 70); g.lineTo(cx + s * 40, cy - 20); g.lineTo(cx + s * 70, cy - 20); g.moveTo(cx + s * 40, cy - 45); g.lineTo(cx + s * 10, cy - 45); g.lineTo(cx + s * 10, cy + 10); g.stroke(); }
  g.beginPath(); g.moveTo(cx - 10, cy + 10); g.lineTo(cx + 10, cy + 10); g.moveTo(cx, cy + 10); g.lineTo(cx, cy + 40); g.stroke();
  g.fillStyle = '#f0a040'; g.beginPath(); g.moveTo(cx - 60, cy + 120); g.quadraticCurveTo(cx - 40, cy + 60, cx, cy + 50); g.quadraticCurveTo(cx + 40, cy + 60, cx + 60, cy + 120); g.quadraticCurveTo(cx, cy + 90, cx - 60, cy + 120); g.fill(); };
const crescent = (g, cx, cy) => { g.fillStyle = '#f0c766'; g.beginPath(); g.arc(cx, cy, 58, 0, 7); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(cx + 22, cy - 8, 50, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = '#f0c766'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 72, 0, 7); g.stroke(); };
// the inlaid gold ring (and a faint inner one) as an emissive decal
const ringTex = () => cvs(1024, 1024, (g, W) => { g.clearRect(0, 0, W, W); const c = W / 2;
  g.strokeStyle = 'rgba(240,190,90,1)'; g.lineWidth = 18; g.beginPath(); g.arc(c, c, c - 20, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(240,190,90,.35)'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c * .5, 0, 7); g.stroke(); g.beginPath(); g.arc(c, c, c * .2, 0, 7); g.stroke();
  g.lineWidth = 3; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * c * .52, c + Math.sin(a) * c * .52); g.lineTo(c + Math.cos(a) * (c - 30), c + Math.sin(a) * (c - 30)); g.stroke(); } });

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(611);
  S.fog = new T.Fog(0x241a44, 34, 150); S.background = new T.Color(0x140f2c);
  D.moonlight({ color: 0xc0c8ff, intensity: 1.9, dir: [.45, 1, .1], ambient: 0x4a3a7a, ambientI: 1.7, sky: 0x8a7ad0, ground: 0x3a2a3a });
  sky(D, [[0, '#0e0c2a'], [.55, '#2a2060'], [1, '#5a3a7a']], { stars: 260 });
  moon(D, 26, 46, -120, 30, [255, 244, 228], [255, 210, 170]); D.glow(26, 46, -118, 44, 0xffe0b0);
  // painted clouds drifting past the moon
  { const ct = ctex(cvs(512, 256, (g, W, H) => { const Rc = rng(7); for (let i = 0; i < 60; i++) { const x = Rc() * W, y = Rc.r(60, 200), r = Rc.r(20, 60); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(120,100,170,.55)'); gr.addColorStop(1, 'rgba(60,40,100,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }));
    const cl = new T.Mesh(new T.PlaneGeometry(320, 80), new T.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, fog: false })); cl.position.set(0, 52, -130); S.add(cl); D.updaters.push(t => { ct.offset.x = t * .004; }); ct.wrapS = T.RepeatWrapping; }

  const M = { floor: pbr('rock_tile_floor', [9, 9], { color: 0x8a84a0, rough: .5 }), wall: pbr('castle_wall_slates', [14, 1], { color: 0x6a6480 }), stone: pbr('castle_wall_slates', [1, 3], { color: 0x8a8098 }),
    plinth: pbr('castle_wall_slates', [1, 1], { color: 0x7a7088 }), bronze: new T.MeshStandardMaterial({ color: 0xb07a3a, metalness: .8, roughness: .35 }), dark: new T.MeshStandardMaterial({ color: 0x1a1424, roughness: .7 }),
    wood: new T.MeshStandardMaterial({ color: 0x2a1a1a, roughness: .7 }), lamp: new T.MeshBasicMaterial({ color: 0xffe8c0 }),
    pen: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#9a1a24', '#6a0e18'], trim: '#e3b552', sd: 61 })), side: T.DoubleSide, alphaTest: .4 }),
    big: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#a01e28', '#6a0e18'], trim: '#e3b552', sd: 62, emblem: bracketEmblem })), side: T.DoubleSide, alphaTest: .4 }),
    moonBan: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#a01e28', '#6a0e18'], trim: '#e3b552', sd: 63, emblem: crescent })), side: T.DoubleSide, alphaTest: .4 }),
    roof: new T.MeshStandardMaterial({ color: 0x2a2236, roughness: .6 }), gate: new T.MeshStandardMaterial({ color: 0x5a1a20, roughness: .6 }) };

  // ── the floor: a great disc of cracked flagstones with the gold ring around the fighting circle ──
  const cz = -10;   // the colosseum's centre (behind the fighters, so the far stands fill the view)
  { const f = new T.Mesh(new T.CircleGeometry(40, 96), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, cz); f.receiveShadow = true; S.add(f);
    const rm = new T.Mesh(new T.PlaneGeometry(24, 24), new T.MeshStandardMaterial({ map: ctex(ringTex()), emissive: 0xffb050, emissiveMap: ctex(ringTex()), emissiveIntensity: .7, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: .3, metalness: .6 }));
    rm.rotation.x = -Math.PI / 2; rm.position.set(0, .012, -1.4); rm.renderOrder = 1; S.add(rm); }

  // ── the rim wall with crimson pennants ──
  const RW = 30;
  { const wall = new T.Mesh(new T.CylinderGeometry(RW, RW, 3.4, 120, 1, true, Math.PI * .35, Math.PI * 1.3), new T.MeshStandardMaterial({ map: M.wall.map, normalMap: M.wall.normalMap, color: 0x6a6480, side: T.BackSide }));
    wall.position.set(0, 1.7, cz); S.add(wall);
    for (let k = 0; k < 26; k++) { const a = Math.PI * .6 + (k + .5) / 26 * Math.PI * 1.8, x = Math.cos(a) * (RW - .25), z = cz + Math.sin(a) * (RW - .25); if (z > 2) continue;
      const p = new T.Mesh(new T.PlaneGeometry(1.5, 2.9), M.pen); p.position.set(x, 1.85, z); p.lookAt(0, 1.85, cz); S.add(p); } }

  // ── the stands: three tiers stepping up and back, packed with a lantern-lit crowd, a lantern rail on each tier ──
  { const ct = ctex(crowd(false), [14, 1]), cg = ctex(crowd(true), [14, 1]);
    for (let t = 0; t < 3; t++) { const r0 = RW + 1.5 + t * 7, y0 = 3.4 + t * 5.2;
      const seats = new T.Mesh(new T.CylinderGeometry(r0 + 6, r0, 5.2, 120, 1, true, Math.PI * .35, Math.PI * 1.3), new T.MeshStandardMaterial({ map: ct, emissiveMap: cg, emissive: 0xffffff, emissiveIntensity: .9, side: T.BackSide, roughness: .9 }));
      seats.position.set(0, y0 + 2.6, cz); S.add(seats);
      const ledge = new T.Mesh(new T.CylinderGeometry(r0 + .4, r0 + .4, .9, 120, 1, true, Math.PI * .35, Math.PI * 1.3), new T.MeshStandardMaterial({ map: M.wall.map, color: 0x5a5470, side: T.BackSide })); ledge.position.set(0, y0 + .45, cz); S.add(ledge);
      for (let k = 0; k < 22; k++) { const a = Math.PI * .62 + (k + .5) / 22 * Math.PI * 1.76, x = Math.cos(a) * (r0 + .2), z = cz + Math.sin(a) * (r0 + .2); if (z > -2) continue;
        D.glow(x, y0 + 1.4, z, 1.6, 0xffb060); if (k % 4 === 0) D.lantern(x, y0 + 1.4, z, { color: 0xffa050, intensity: 10, distance: 12, glow: 0 }); } }
    // a sweeping roof over the top tier
    const rf = new T.Mesh(new T.CylinderGeometry(RW + 26, RW + 21, 2.4, 120, 1, true, Math.PI * .35, Math.PI * 1.3), new T.MeshStandardMaterial({ color: 0x1e1830, roughness: .8, side: T.DoubleSide })); rf.position.set(0, 21.5, cz); S.add(rf); }

  // ── floodlight banks on masts, left and right ──
  for (const s of [-1, 1]) { const x = s * 27, z = cz - 14;
    box(.6, 26, .6, M.dark, x, 0, z); const g = new T.Group(); g.position.set(x - s * .4, 25, z + .6); g.rotation.y = -s * .5; S.add(g);
    K.add(new T.BoxGeometry(6, 3, .4), M.dark, 0, 0, 0, { to: g }); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) K.add(new T.CircleGeometry(.5, 16), M.lamp, -2.2 + i * 1.47, -.6 + j * 1.2, .22, { to: g, cast: false });
    D.glow(x - s * .4, 25, z + 1.4, 12, 0xfff0d0); }

  // ── tall stone pillars carrying the huge bracket banners (front left and right, framing the fight) ──
  for (const [x, z] of [[-17, -3], [17, -3], [-24, -14], [24, -14]]) {
    box(2.2, 20, 2.2, M.stone, x, 0, z); box(2.8, .6, 2.8, M.plinth, x, 20, z); box(2.8, 1.2, 2.8, M.plinth, x, 0, z);
    box(.3, .3, 5, M.wood, x, 18.6, z + 1.2); const b = new T.Mesh(new T.PlaneGeometry(4.2, 12.6), M.big); b.position.set(x + (x < 0 ? 1.6 : -1.6), 12, z + 1.4); b.rotation.y = x < 0 ? .3 : -.3; b.castShadow = true; S.add(b);
    D.updaters.push(t => { b.rotation.z = Math.sin(t * .7 + x) * .02; }); }
  // braziers on plinths at the front corners
  const braz = [[-13.5, -1.8], [13.5, -1.8], [-20, -11], [20, -11]];
  for (const [x, z] of braz) { box(2.2, 2.6, 2.2, M.plinth, x, 0, z); add(new T.CylinderGeometry(1.2, .6, .9, 18), M.bronze, x, 3.05, z); add(new T.TorusGeometry(1.2, .1, 6, 24), M.bronze, x, 3.5, z, { rx: Math.PI / 2 });
    D.lantern(x, 4.4, z, { color: 0xff8a30, intensity: 34, distance: 16 }); }
  flames(D, R, braz.map(([x, z]) => [x, z, 1.6]));
  // the flames sit on the bowls (flames() stands them on the floor; lift them onto the plinths)
  { const L = S.children.filter(o => o.isSprite && o.material.blending === T.AdditiveBlending && o.material.map && o.material.map.image && o.material.map.image.height === 128); D.updaters.push(() => { for (const sp of L) sp.position.y += 3.1; }); }

  // ── the judges' pagoda over the far gate, with the crescent banner and two flanking ones ──
  { const gz = cz - RW - 2; box(16, 12, 4, M.stone, 0, 0, gz); box(6, 7, .3, M.gate, 0, 0, gz + 2.05);
    pagoda(K, D, 0, gz, { w: 12, d: 5, h: 4, tiers: 2, y: 12, roof: M.roof, beam: M.gate, sd: 64, lamp: false });
    for (const [x, m, w, h] of [[0, M.moonBan, 4, 10], [-5, M.big, 2.6, 7.5], [5, M.big, 2.6, 7.5]]) { const b = new T.Mesh(new T.PlaneGeometry(w, h), m); b.position.set(x, 12 - h / 2 + 3, gz + 2.3); S.add(b); }
    for (const x of [-6.5, -2.6, 2.6, 6.5]) D.glow(x, 15, gz + 3, 2.4, 0xffc070); D.lantern(0, 14, gz + 5, { color: 0xffb060, intensity: 30, distance: 26, glow: 0 }); }

  // ── crimson streamers across the sky, rippling ──
  for (const [x0, y0, x1, y1, z] of [[-30, 26, 6, 20, -24], [8, 24, 32, 28, -22], [-26, 18, -4, 30, -36]]) {
    const n = 40, pos = []; const geo = new T.PlaneGeometry(1, 1, n, 1); const p = geo.attributes.position;
    for (let i = 0; i <= n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 4; for (const r of [0, 1]) { const k = r * (n + 1) + i; p.setXYZ(k, x, y + (r ? .7 : -.7) * (1 - u * .5), z + Math.sin(u * 9) * .6); } }
    geo.computeVertexNormals(); const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xa01828, side: T.DoubleSide, roughness: .7 })); S.add(m);
    const base = Float32Array.from(p.array); D.updaters.push(t => { for (let k = 0; k < p.count; k++) p.setY(k, base[k * 3 + 1] + Math.sin(t * 1.4 + k * .3) * .25); p.needsUpdate = true; }); }

  // ── the floor: dust, embers, scorch at the braziers, cracks ──
  scatter(D, rng(612), { area: [-16, 16, -6, 6], pebbles: 60, stone: 0x6a6080, petals: 60, petal: 0xff5a6a });
  decals(D, rng(613), { area: [-16, 16, -6, 5], list: [['crack', 7, [1.6, 3.2]], ['stain', 4, [1.4, 2.6]], ['scorch', 2, [1.6, 2.4]]] });
  drift(D, 140, 0, -10, 34, 20, 0xffa040, { y0: .5, y1: 22, size: 8 });
  // weapon racks and a water barrel by the rim, the real models
  model(D, 'wine_barrel_01', -22, 0, 1.5, { h: 1.3 }); model(D, 'wooden_bucket_01', -21, 0, 2.4, { h: .6 }); model(D, 'wooden_crate_02', 22, 0, 1, { s: 1.6, ry: 1.2 });
}
