// Neon Ward Street: rain-black asphalt at a crossing in the Neon Ward. Chained bollards with lamps, a glowing crosswalk,
// a shrine gate at the end of the street, a corner shop with vending machines and a ramen stall, wires strung between
// poles, and towers wrapped in giant screens (koi, sakura) with neon bands.
import { T } from './diorama.js';
import { kit, rng, ctex, cvs, sky, torii, drift, pbr } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2.2], [-4.6, -2.6], [1.6, -4.6]], sum: [-5.6, .8] };

const asphalt = () => { const R = rng(3); return cvs(512, 512, (g, W, H) => { g.fillStyle = '#26222c'; g.fillRect(0, 0, W, H); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${R.r(.03, .08)})`; g.fillRect(R() * W, R() * H, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; for (let y = 0; y < H; y += 170) { g.beginPath(); g.moveTo(0, y + R.r(-8, 8)); g.lineTo(W, y + R.r(-8, 8)); g.stroke(); } g.beginPath(); g.moveTo(256, 0); g.lineTo(250, H); g.stroke(); }); };
const screenT = kind => cvs(256, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H);
  if (kind === 'koi') { gr.addColorStop(0, '#2a1a7a'); gr.addColorStop(1, '#5a20a0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(120,200,255,.35)'; g.lineWidth = 3; for (let y = 0; y < H; y += 30) { g.beginPath(); for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x * .05 + y) * 6); g.stroke(); }
    g.fillStyle = '#ff9ad8'; g.beginPath(); g.ellipse(128, 220, 46, 110, .35, 0, 7); g.fill(); g.beginPath(); g.moveTo(150, 320); g.quadraticCurveTo(210, 420, 150, 470); g.quadraticCurveTo(120, 400, 120, 330); g.fill();
    g.fillStyle = '#ffffff'; for (const [x, y] of [[100, 170], [140, 260], [110, 300]]) { g.beginPath(); g.ellipse(x, y, 18, 12, .4, 0, 7); g.fill(); } g.fillStyle = '#000'; g.beginPath(); g.arc(104, 140, 5, 0, 7); g.fill(); }
  else { gr.addColorStop(0, '#5a1060'); gr.addColorStop(1, '#a02a8a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); const R = rng(9);
    for (let i = 0; i < 140; i++) { g.fillStyle = `hsla(${R.r(300, 340)},90%,${R.r(70, 90)}%,${R.r(.5, .9)})`; g.beginPath(); g.arc(R() * W, R() * H, R.r(4, 14), 0, 7); g.fill(); } }
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1); });
const towerT = (sd, glow) => { const R = rng(sd); return cvs(128, 512, (g, W, H) => { g.fillStyle = glow ? '#000' : '#1a1428'; g.fillRect(0, 0, W, H);
  for (let y = 6; y < H; y += 14) for (let x = 6; x < W; x += 14) { const on = R() < .35; if (!on) continue; g.fillStyle = glow ? `hsl(${R() < .5 ? 40 : 200},90%,70%)` : R() < .5 ? '#ffd090' : '#a0e0ff'; g.fillRect(x, y, 8, 8); } }); };
const shopT = glow => cvs(512, 256, (g, W, H) => { g.fillStyle = glow ? '#000' : '#3a2418'; g.fillRect(0, 0, W, H);
  for (let x = 10; x < W; x += 100) { g.fillStyle = glow ? '#ffa850' : '#ffcf8a'; g.fillRect(x, 60, 90, 180); g.fillStyle = glow ? '#000' : '#3a2418'; for (let k = 1; k < 4; k++) g.fillRect(x, 60 + k * 45, 90, 4); if (!glow) { g.fillStyle = '#7a4a2a'; for (let k = 0; k < 3; k++) for (let j = 0; j < 6; j++) g.fillRect(x + 6 + j * 14, 74 + k * 45, 10, 22); } }
  if (!glow) { g.fillStyle = '#2a1a40'; g.fillRect(0, 0, W, 50); } });
const vendT = (hue) => cvs(128, 256, (g, W, H) => { g.fillStyle = `hsl(${hue},70%,45%)`; g.fillRect(0, 0, W, H); g.fillStyle = '#e8f4ff'; g.fillRect(10, 14, 82, 140);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { g.fillStyle = `hsl(${(c * 70 + r * 30) % 360},80%,55%)`; g.fillRect(14 + c * 16, 20 + r * 34, 10, 24); }
  g.fillStyle = '#111'; g.fillRect(98, 40, 20, 60); g.fillRect(14, 190, 80, 30); });

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(91);
  S.fog = new T.Fog(0x2a1848, 26, 140); S.background = new T.Color(0x1a1038);
  D.moonlight({ color: 0xb8a8ff, intensity: 1.6, dir: [.2, 1, .5], ambient: 0x5a4a90, ambientI: 2.1, sky: 0xa070d8, ground: 0x402838 });
  sky(D, [[0, '#120a2a'], [.6, '#3a1a5a'], [1, '#6a2a7a']], { stars: 0 });

  const neon = c => new T.MeshBasicMaterial({ color: c, fog: false });
  const M = {
    road: pbr('asphalt_02', [5, 26], { color: 0x8a80a0, rough: .18, metal: .35, ns: 1.2 }),
    walk: pbr('concrete_pavers', [4, 50], { color: 0x9a90a8, rough: .3, metal: .15 }),
    stripe: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xa0c0ff, emissiveIntensity: .4, roughness: .3 }),
    metal: pbr('metal_plate', [1, 2], { color: 0x6a6878, metal: .6, rough: .6 }),
    chain: new T.MeshStandardMaterial({ color: 0x6a6670, metalness: .8, roughness: .3 }),
    lamp: new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffb050, emissiveIntensity: 2.2 }),
    wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x7a5048 }), roof: pbr('grey_roof_tiles', [3, 1], { color: 0x8a80a0 }),
    gate: new T.MeshStandardMaterial({ color: 0xc8303a, emissive: 0x601018, emissiveIntensity: .6, roughness: .5 }), gateD: new T.MeshStandardMaterial({ color: 0x1a1418 }),
    awning: new T.MeshStandardMaterial({ color: 0xb02030, roughness: .7, side: T.DoubleSide }),
    lantR: new T.MeshStandardMaterial({ color: 0xff7040, emissive: 0xff4818, emissiveIntensity: 1.6 }),
    noren: new T.MeshStandardMaterial({ color: 0x2a2450, side: T.DoubleSide, roughness: .9 }),
    ac: new T.MeshStandardMaterial({ color: 0x8a8a94, roughness: .5, metalness: .3 }),
  };
  // ── the street: wet asphalt that mirrors every sign, raised sidewalks, a glowing crosswalk ──
  { const m = new T.Mesh(new T.PlaneGeometry(24, 130), M.road); m.rotation.x = -Math.PI / 2; m.position.set(0, 0, -50); m.receiveShadow = true; S.add(m);
    for (const s of [-1, 1]) box(10, .18, 130, M.walk, s * 17, 0, -50);
    for (let i = 0; i < 7; i++) box(1, .02, 3, M.stripe, -6 + i * 2, 0, -5.6, { cast: false });
    for (const [x, z] of [[8.6, -1], [-9, 4]]) { box(2.4, .03, 1, M.metal, x, 0, z, { cast: false }); } }
  // steam from the grate
  { const sm = []; const mat = new T.SpriteMaterial({ color: 0xd0c8e0, transparent: true, opacity: .18, depthWrite: false });
    for (let i = 0; i < 10; i++) { const s = new T.Sprite(mat); S.add(s); sm.push(s); }
    D.updaters.push(t => sm.forEach((s, i) => { const u = (t * .25 + i / 10) % 1; s.position.set(8.6 + Math.sin(t + i) * .3 + u * 1.2, u * 4, -1); s.scale.set(1 + u * 3, 1 + u * 3, 1); })); }

  // ── chained bollards with lamp heads across the back of the plaza ──
  const bx = [-11, -7.4, -3.8, 3.8, 7.4, 11];
  for (const x of bx) { box(.5, 1.5, .5, M.metal, x, 0, -3.2); box(.36, .44, .36, M.lamp, x, 1.1, -3.2, { cast: false }); add(new T.ConeGeometry(.38, .3, 4), M.metal, x, 1.65, -3.2, { ry: Math.PI / 4 }); D.glow(x, 1.3, -3, 1.2, 0xffb060); }
  for (let i = 0; i < bx.length - 1; i++) { if (bx[i] < 0 && bx[i + 1] > 0) continue; const a = new T.Vector3(bx[i], .95, -3.2), b = new T.Vector3(bx[i + 1], .95, -3.2), m = a.clone().lerp(b, .5); m.y -= .35;
    add(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, m, b), 14, .04, 4), M.chain, 0, 0, 0, { cast: false }); }
  D.lantern(-7.4, 1.3, -3, { intensity: 10, distance: 8, glow: 0 }); D.lantern(7.4, 1.3, -3, { intensity: 10, distance: 8, glow: 0 });

  // ── left corner shop: lit shelves, noren, red lanterns, two vending machines, planters ──
  { const w = new T.MeshStandardMaterial({ map: ctex(shopT()), emissiveMap: ctex(shopT(1)), emissive: 0xffa050, emissiveIntensity: 1.2, roughness: .8 });
    const b = box(12, 5, 6, w, -17, 0, 0); b.material = [w, M.wood, M.roof, M.roof, w, M.wood];
    box(13, .3, 2.4, M.roof, -16.4, 5, 2.4, { rz: -.25 }); box(6, 7, 6, new T.MeshStandardMaterial({ color: 0x2a2030 }), -17, 5, 0);
    for (let i = 0; i < 4; i++) { const n = add(new T.PlaneGeometry(1.4, 1.3), M.noren, -13.4 + i * 0, 3.6, -1 + i * 1.45, { ry: Math.PI / 2, cast: false }); }
    for (const z of [-2.2, 2.4]) { const l = add(new T.SphereGeometry(.42, 14, 10), M.lantR, -10.8, 4, z, { cast: false }); l.scale.y = 1.3; D.lantern(-10.8, 4, z, { color: 0xff6030, intensity: 14, distance: 9, glow: 1.4 }); }
    for (const [z, hue] of [[-3.6, 210], [-4.8, 340]]) { const vm = new T.MeshStandardMaterial({ map: ctex(vendT(hue)), emissive: 0xffffff, emissiveMap: ctex(vendT(hue)), emissiveIntensity: .7 });
      const v = box(1, 2.2, 1.1, vm, -10.4, .18, z); v.material = [M.metal, M.metal, M.metal, M.metal, vm, M.metal]; v.rotation.y = Math.PI / 2; D.glow(-9.6, 1.4, z, 2, hue === 210 ? 0x60b0ff : 0xff60a0); }
    D.lantern(-9.4, 1.4, -4.2, { color: 0x80a0ff, intensity: 10, distance: 7, glow: 0 });
    for (const z of [-6.4, -7.4]) box(.9, .7, .9, M.wood, -10.6, .18, z);
    await K.prop('ferns', -10.6, -6.4, 1, { y: .9 }); await K.prop('ferns', -10.6, -7.4, .9, { y: .9, flip: 1 });
    // the cherry tree overhanging the corner
    await K.prop('sakura', -12, -.5, 9, { y: 2, flip: 1, sway: .008 }); }

  // ── right: a ramen stall with a red awning, stools, lanterns ──
  { const w = new T.MeshStandardMaterial({ map: ctex(shopT()), emissiveMap: ctex(shopT(1)), emissive: 0xffa050, emissiveIntensity: 1.3 });
    const b = box(8, 3.6, 5, w, 16.4, .18, -5); b.material = [M.wood, w, M.roof, M.roof, w, M.wood];
    const aw = add(new T.BoxGeometry(2.6, .1, 7), M.awning, 11.4, 3.6, -5, { rz: .35 });
    for (let i = 0; i < 8; i++) add(new T.PlaneGeometry(.8, .5), M.awning, 10.3, 3.1, -8.2 + i * .9, { ry: Math.PI / 2, cast: false });
    box(1.2, 1.1, 6, M.wood, 11.8, .18, -5); for (let i = 0; i < 4; i++) { add(new T.CylinderGeometry(.28, .28, .08, 12), M.awning, 10.6, .95, -7.4 + i * 1.6); box(.08, .8, .08, M.metal, 10.6, .18, -7.4 + i * 1.6); }
    for (const z of [-7.8, -2.4]) { const l = add(new T.CylinderGeometry(.34, .34, .6, 12), M.lantR, 11, 2.9, z, { cast: false }); D.lantern(11, 2.9, z, { color: 0xff7040, intensity: 12, distance: 8, glow: 1.2 }); }
    box(1.2, .9, .7, M.ac, 13, 5.2, -2.4); }

  // ── utility poles and sagging wires, paper lanterns on the wires ──
  const poles = [[-7, -9], [6.8, -10], [-6.6, -24], [6.6, -26]];
  for (const [x, z] of poles) { box(.3, 9, .3, M.wood, x, 0, z); box(2.2, .14, .14, M.wood, x, 8, z); box(.5, .7, .4, M.metal, x, 6.4, z + .2); }
  const wire = (a, b, sag, lan) => { const m = a.clone().lerp(b, .5); m.y -= sag; const c = new T.QuadraticBezierCurve3(a, m, b); add(new T.TubeGeometry(c, 16, .025, 4), M.metal, 0, 0, 0, { cast: false });
    if (lan) for (let k = 1; k < lan; k++) { const p = c.getPoint(k / lan); const l = add(new T.SphereGeometry(.24, 10, 8), M.lamp, p.x, p.y - .35, p.z, { cast: false }); l.scale.y = 1.25; D.glow(p.x, p.y - .35, p.z, .9, 0xffb060); } };
  for (const [[ax, az], [bx2, bz]] of [[poles[0], poles[1]], [poles[2], poles[3]], [poles[0], poles[2]], [poles[1], poles[3]], [poles[0], [-12, -4]], [poles[1], [12, -6]]])
    for (const dy of [0, .4]) wire(new T.Vector3(ax, 7.8 - dy, az), new T.Vector3(bx2, 7.8 - dy, bz), 1 + dy, dy ? 0 : 8);

  // ── the shrine gate at the end of the street, the overpass behind it ──
  torii(K, 0, -30, 7, M.gate, { dark: M.gateD });
  for (const s of [-1, 1]) D.lantern(s * 2.4, 1, -29.6, { color: 0xff5040, intensity: 14, distance: 9, glow: 1.2 });
  box(40, 1.2, 3, M.metal, 0, 9, -46); for (const s of [-1, 1]) box(1.2, 9, 1.2, M.metal, s * 10, 0, -46); box(40, .12, .12, neon(0x40e0ff), 0, 9, -44.48, { cast: false });
  for (let i = 0; i < 12; i++) await K.prop('sakura', R() < .5 ? R.r(-10, -5) : R.r(5, 10), R.r(-16, -36), R.r(4, 6), { tint: 0xff60d0, blob: false, flip: R() < .5 });

  // ── towers: window grids, neon bands, two giant wrap-around screens, a needle spire on the skyline ──
  const tower = (x, z, w, d, h, sd) => { const tm = new T.MeshStandardMaterial({ map: ctex(towerT(sd), [w / 6, h / 24]), emissiveMap: ctex(towerT(sd, 1), [w / 6, h / 24]), emissive: 0xffffff, emissiveIntensity: .9, roughness: .5 });
    box(w, h, d, tm, x, 0, z, { cast: false }); const nc = [0xff40c0, 0x40e0ff, 0xb060ff][sd % 3];
    for (let y = 6; y < h; y += R.r(6, 12)) box(w + .1, .25, d + .1, neon(nc), x, y, z, { cast: false }); };
  for (const s of [-1, 1]) for (let z = -14, i = 0; z > -110; z -= R.r(9, 14), i++) tower(s * R.r(19, 28), z, R.r(8, 12), R.r(8, 12), R.r(24, 60), i * 2 + (s > 0 ? 1 : 0) + 3);
  for (let i = 0; i < 18; i++) tower(R.r(-40, 40), R.r(-80, -130), R.r(6, 12), 8, R.r(30, 80), 40 + i);
  { const sp = new T.MeshStandardMaterial({ color: 0x2a1a40, emissive: 0xa040ff, emissiveIntensity: .5 }); box(6, 70, 6, sp, 4, 0, -150, { cast: false }); add(new T.ConeGeometry(3, 40, 6), sp, 4, 90, -150, { cast: false }); D.glow(4, 110, -150, 10, 0xff60ff); }
  for (const [x, z, kind] of [[-15, -20, 'sak'], [16, -24, 'koi']]) { const sc = add(new T.CylinderGeometry(6, 6, 18, 32, 1, true, -Math.PI * .4 + (x > 0 ? -.4 : .4), Math.PI * .8), new T.MeshBasicMaterial({ map: ctex(screenT(kind)), fog: false, side: T.DoubleSide }), x, 22, z, { cast: false, ry: x > 0 ? -.3 : .3 });
    for (const y of [13, 31]) add(new T.TorusGeometry(6.05, .12, 4, 40, Math.PI * .8), neon(x > 0 ? 0x40e0ff : 0xff40c0), x, y, z, { rx: Math.PI / 2, rz: Math.PI * .1 + (x > 0 ? -.4 : .4), cast: false }); D.glow(x, 22, z + 6, 16, kind === 'koi' ? 0x8060ff : 0xff60c0); }
  // ── rain, wet glints, drifting petals ──
  { const n = 900, g = new T.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = R.r(-22, 22); p[i * 3 + 1] = R.r(0, 16); p[i * 3 + 2] = R.r(-30, 8); } g.setAttribute('position', new T.BufferAttribute(p, 3));
    S.add(new T.Points(g, new T.PointsMaterial({ color: 0xc8d0ff, size: .06, transparent: true, opacity: .55, depthWrite: false })));
    D.updaters.push((t, dt) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { let y = a[i * 3 + 1] - (dt || .016) * 14; if (y < 0) y += 16; a[i * 3 + 1] = y; } g.attributes.position.needsUpdate = true; }); }
  D.petals(70, -6, -2, 9, { color: 0xff7ad0 }); drift(D, 30, 0, -20, 12, 10, 0x80e0ff, { y0: 1, y1: 8, size: 6 });
}
