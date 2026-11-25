// Neon Ward Rooftop: a wet concrete roof high in the Neon Ward. A lit rooftop shack with a paper lantern, AC units,
// potted plants and crates, giant billboards on steel scaffolds, a water tower, laundry on a line, a pipe-run parapet,
// and the whole neon skyline with a shrine gate on a lower roof, in the rain under the moon.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, ctex, cvs, shojiMat, rain, skyline, billboard, neonTower, drift, farPainting, groundFill, scatter, cityBlocks, walkers, clutter } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.2, -1.8], [-4.4, -2], [1.6, -2.6]], sum: [-5.6, .8], exposure: 1.6 };

const acFace = () => cvs(128, 128, (g, W) => { g.fillStyle = '#c8c8d0'; g.fillRect(0, 0, W, W); g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(64, 64, 46, 0, 7); g.fill(); g.strokeStyle = '#9a9aa4'; g.lineWidth = 3; for (let r = 10; r < 46; r += 7) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); } for (let i = 0; i < 4; i++) { g.save(); g.translate(64, 64); g.rotate(i * Math.PI / 2); g.fillRect(-3, -44, 6, 88); g.restore(); } });

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(271);
  S.fog = new T.Fog(0x3a2068, 34, 180); S.background = new T.Color(0x24164c);
  D.moonlight({ color: 0xc8b8ff, intensity: 1.8, dir: [-.2, 1, .5], ambient: 0x5a4a90, ambientI: 2.2, sky: 0xa880e0, ground: 0x402838 });
  sky(D, [[0, '#120a30'], [.6, '#3a1c66'], [1, '#7a2a80']], { stars: 30 }); moon(D, 14, 52, -140, 20);
  const M = { roof: pbr('concrete_pavers', [8, 3], { nmap: 'asphalt_02', rmap: 'asphalt_02', color: 0x9a90b0, rough: .15, metal: .35 }), conc: pbr('castle_wall_slates', [4, 1], { color: 0x8a8098 }),
    metal: pbr('metal_plate', [1, 2], { color: 0x6a6878, metal: .6, rough: .6 }), rust: pbr('rusty_metal_02', [1, 1], { color: 0x8a6a5a, metal: .5, rough: .7 }), wood: pbr('weathered_planks', [.5, 1], { color: 0x8a6a5a }),
    ac: new T.MeshStandardMaterial({ map: ctex(acFace()), roughness: .5, metalness: .2 }), acB: new T.MeshStandardMaterial({ color: 0xb8b8c0, roughness: .5, metalness: .3 }), pipe: new T.MeshStandardMaterial({ color: 0x7a6a60, metalness: .7, roughness: .4 }),
    amber: new T.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffa030, emissiveIntensity: 2.2 }), lanR: new T.MeshStandardMaterial({ color: 0xff6040, emissive: 0xff3018, emissiveIntensity: 1.6 }), pot: new T.MeshStandardMaterial({ color: 0x8a4a2a, roughness: .8 }),
    cloth: [0xf0e0e8, 0xff80b0, 0xa0c0ff, 0xffffff].map(c => new T.MeshStandardMaterial({ color: c, side: T.DoubleSide, roughness: .9 })), gate: new T.MeshStandardMaterial({ color: 0xd03040, emissive: 0x801020, emissiveIntensity: .8 }) };
  // ── the roof deck, parapet with pipes and amber markers ──
  box(34, 1, 10, M.roof, 0, -1, 1);
  box(34, 1, .5, M.conc, 0, 0, -3.6); for (const y of [.3, .65]) add(new T.CylinderGeometry(.1, .1, 34, 10), M.pipe, 0, y, -3.2, { rz: Math.PI / 2 });
  for (let x = -12; x <= 12; x += 6) { box(.7, .18, .1, M.amber, x, .2, -3.3, { cast: false }); D.glow(x, .3, -3.1, 1, 0xffa030); }
  box(1.4, .06, .8, M.metal, 6, 0, 3.6, { cast: false });
  // ── the shack on the left: door, lit window, red lantern, AC units, plants and crates ──
  { const sx = -13, sz = -1.4, w = shojiMat(2, [1, 1], { lit: 1 }); box(7, 4, 5, M.conc, sx, 0, sz); box(7.6, .3, 5.6, M.rust, sx, 4, sz);
    add(new T.PlaneGeometry(1.4, 2.4), M.wood, sx + 2, 1.2, sz + 2.51); add(new T.PlaneGeometry(2.2, 1.3), w, sx - 1.4, 2.2, sz + 2.51, { cast: false }); D.lantern(sx - 1.4, 2.2, sz + 3, { intensity: 12, distance: 8, glow: 0 });
    const l = add(new T.SphereGeometry(.4, 12, 10), M.lanR, sx + 3.4, 3, sz + 2.8, { cast: false }); l.scale.y = 1.3; D.lantern(sx + 3.4, 3, sz + 3, { color: 0xff6030, intensity: 14, distance: 8, glow: 1.2 });
    for (const [x, y, z] of [[sx - 2, 4.3, sz], [sx + 1, 4.3, sz - 1], [7.5, 0, -2.4], [9.3, 0, -2.4]]) { const b = box(1.6, 1.2, .9, M.acB, x, y, z); add(new T.PlaneGeometry(1, 1), M.ac, x, y + .6, z + .46, { cast: false }); }
    for (const [x, z] of [[sx + 4, sz + 3], [sx + 4.8, sz + 2.6], [-8, -2.6]]) { add(new T.CylinderGeometry(.4, .3, .6, 12), M.pot, x, .3, z); await prop('ferns', x, z, 1.2, { y: .5, blob: false }); }
    for (const [x, z, s] of [[-9.4, 2.4, .9], [-10, 3.2, .7]]) box(s, s, s, M.wood, x, 0, z); }
  // ── billboards on steel scaffolds ──
  const scaffold = (x, z, w, h, y0) => { for (const dx of [-w / 2, 0, w / 2]) box(.25, y0 + h, .25, M.metal, x + dx, 0, z - .6); for (let y = 2; y < y0 + h; y += 2.4) box(w, .12, .12, M.metal, x, y, z - .6, { cast: false });
    for (let y = 0; y < y0; y += 2.4) for (const dx of [-w / 4, w / 4]) add(new T.BoxGeometry(.08, 3.3, .08), M.metal, x + dx, y + 1.2, z - .6, { rz: .7, cast: false }); };
  scaffold(-6, -8, 14, 7, 6); billboard(K, D, -6, 9.5, -8, 14, 7, 'face', { frame: M.metal });
  scaffold(15, -10, 10, 8, 6); billboard(K, D, 15, 10, -10, 10, 8, 'koi', { frame: M.metal });
  for (const [x, z] of [[-12, -7.4], [21, -9]]) { box(.8, .3, .4, M.amber, x, 13.6, z, { cast: false }); D.lantern(x, 13.4, z + .6, { color: 0xffc070, intensity: 18, distance: 14, glow: 1 }); }
  // ── water tower on stilts (right), laundry line, a shrine gate on a lower roof beyond ──
  { const tx = 12, tz = -3.8; for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(.2, 4, .2, M.rust, tx + dx, 0, tz + dz); add(new T.CylinderGeometry(1.6, 1.6, 3, 18), M.rust, tx, 5.5, tz); add(new T.ConeGeometry(1.8, 1, 18), M.rust, tx, 7.5, tz);
    for (const y of [4.6, 6.4]) add(new T.TorusGeometry(1.62, .06, 6, 24), M.pipe, tx, y, tz, { rx: Math.PI / 2 }); }
  { const a = new T.Vector3(4, 3, -3.2), b = new T.Vector3(10.4, 3.2, -3.4), m = a.clone().lerp(b, .5); m.y -= .4; const c = new T.QuadraticBezierCurve3(a, m, b); add(new T.TubeGeometry(c, 12, .02, 4), M.pipe, 0, 0, 0, { cast: false });
    box(.1, 3.2, .1, M.metal, 4, 0, -3.2); for (let k = 1; k < 7; k++) { const p = c.getPoint(k / 7), cl = add(new T.PlaneGeometry(.7, R.r(.8, 1.2)), M.cloth[k % 4], p.x, p.y - .5, p.z, { cast: false }); D.updaters.push(t => { cl.rotation.y = Math.sin(t * 1.2 + k) * .25; }); } }
  { box(12, 10, 10, M.conc, 2, -14, -24, { cast: false }); const g = new T.Group(); g.position.set(2, -4, -22); S.add(g);
    for (const s of [-1, 1]) K.add(new T.CylinderGeometry(.3, .34, 5, 10), M.gate, s * 2, 2.5, 0, { to: g }); K.add(new T.BoxGeometry(6, .5, .6), M.gate, 0, 5, 0, { to: g }); K.add(new T.BoxGeometry(5, .3, .4), M.gate, 0, 4.1, 0, { to: g }); D.glow(2, 0, -21, 6, 0xff4060); }
  // ── the skyline, rain ──
  neonTower(K, -24, -30, 12, 12, 76, 4, { y: -26 }); neonTower(K, 28, -34, 12, 12, 82, 9, { y: -26 }); skyline(K, D, R, { zNear: -40, zFar: -140, n: 50, spread: 100, y: -26 });
  for (let i = 0; i < 2; i++) await prop('sakura', -17 + i * 1.4, -4 - i, R.r(7, 9), { y: 0, flip: i, sway: .01, blob: false });
  rain(D, 1000, [-24, 24], [0, 18], [-30, 8], { speed: 14 }); D.petals(40, -12, -2, 6, { color: 0xff7ad0 }); drift(D, 40, 0, -20, 30, 14, 0x60e0ff, { y0: 2, y1: 14, size: 6 });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(644);
  farPainting(D, 'nw_roof', { v1: .5, z: -144, yb: -26, h: 150 });
  groundFill(D, pbr('asphalt_02', [40, 40], { color: 0x2a2440, rough: .3, metal: .3 }), { y: -26, z0: -4, z1: -160 });
  cityBlocks(K, D, R2, { x0: -50, x1: 50, z0: -12, z1: -36, n: 26, hMin: 12, hMax: 30, y: -26, skipX: [2, 8] });
  cityBlocks(K, D, R2, { x0: -60, x1: 60, z0: -40, z1: -70, n: 22, hMin: 20, hMax: 50, y: -26 });
  for (let i = 0; i < 40; i++) D.glow(R2.r(-60, 60), -24, R2.r(-10, -90), R2.r(2, 5), [0xff40c0, 0x40e0ff, 0xffb060][i % 3]);
  scatter(D, R2, { area: [-15, 15, -3, 6], puddles: 12, pebbles: 50, stone: 0x4a4458, petals: 50, petal: 0xff7ad0 });
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'city', { area: [-9, 9, 5, 5.8], n: 5, clear: 6 });
}
