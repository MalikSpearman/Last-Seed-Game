// Tama's Room (tama) and its 3 a.m. zoomies (zoomies): a cosy tatami room with a kotatsu under a flowered quilt, a tall
// cat tower, a paper window, a food bowl, cushions and a ball of yarn. Tama's version glows with sunset through the
// shoji; Zoomies is the same room at 3:00 at night, moonlit blue, a torn shoji, the quilt dragged off, a vase smashed,
// a digital clock glaring, and things knocked everywhere.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, shojiMat, farPainting, scatter, drift, flurry, restyle, model, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.4], [-4, -1.6], [1.4, -2.2]], sum: [-5.2, .8], exposure: 1.45 };

const tatami = () => { const R = rng(2); return cvs(512, 512, (g, W, H) => { g.fillStyle = '#c8a860'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 3) { g.fillStyle = `rgba(${R() < .5 ? '90,70,30' : '255,240,190'},${R.r(.06, .16)})`; g.fillRect(0, y, W, 1.5); }
  g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, W, 16); g.fillRect(0, H / 2 - 8, W, 16); }); };
const quilt = night => cvs(512, 512, (g, W, H) => { g.fillStyle = night ? '#4a2a6a' : '#b0202a'; g.fillRect(0, 0, W, H); const R = rng(4);
  for (let i = 0; i < 12; i++) { const x = R() * W, y = R() * H, r = R.r(30, 60); g.fillStyle = night ? '#d0c0f0' : '#fff0e8'; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .45, r * .3, a, 0, 7); g.fill(); } g.fillStyle = '#ffd060'; g.beginPath(); g.arc(x, y, r * .2, 0, 7); g.fill(); }
  g.strokeStyle = '#e0b060'; g.lineWidth = 10; g.strokeRect(10, 10, W - 20, H - 20); });

export async function build(D, phase = 1, name = 'tama') {
  const night = name === 'zoomies', K = kit(D), { S, add, box, prop } = K, R = rng(night ? 503 : 501);
  S.fog = new T.Fog(night ? 0x1a2040 : 0x5a3020, 18, 70); S.background = new T.Color(night ? 0x0e1228 : 0x2a1410);
  D.moonlight(night ? { color: 0x8aa0ff, intensity: 1.6, dir: [-.6, .7, -.5], ambient: 0x2a3a6a, ambientI: 1.8, sky: 0x5a70c0, ground: 0x2a2030 } : { color: 0xffb070, intensity: 2.2, dir: [.7, .6, -.5], ambient: 0x8a5030, ambientI: 2, sky: 0xffc090, ground: 0x6a3a20 });
  const M = { tatami: new T.MeshStandardMaterial({ map: ctex(tatami(), [4, 2]), roughness: .7, color: night ? 0x8a90b8 : 0xffe0c0 }), wood: pbr('japanese_cedar_planks', [.5, 1], { color: night ? 0x6a5a6a : 0xa06a48, rough: .4 }),
    wall: pbr('worn_planks', [3, 1], { color: night ? 0x6a6878 : 0xb08a6a }), quilt: new T.MeshStandardMaterial({ map: ctex(quilt(night)), roughness: .9 }), sisal: new T.MeshStandardMaterial({ color: 0xc8a878, roughness: 1 }),
    plush: new T.MeshStandardMaterial({ color: night ? 0x8a8098 : 0xe8d8c8, roughness: 1 }), bowl: new T.MeshStandardMaterial({ color: 0xf0ece4, roughness: .3 }), yarn: new T.MeshStandardMaterial({ color: 0xc02030, roughness: .9 }),
    cush: new T.MeshStandardMaterial({ color: night ? 0x3a3a7a : 0xe0b040, roughness: .9 }), blue: new T.MeshStandardMaterial({ color: 0x2a4aa0, roughness: .2 }), clock: new T.MeshBasicMaterial({ color: 0xb060ff }) };
  { const f = new T.Mesh(new T.PlaneGeometry(32, 14), M.tatami); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -1); f.receiveShadow = true; S.add(f); }
  // ── walls: shoji window wall at the back (sunset or moon behind it), sliding doors, beams ──
  const sh = shojiMat(night ? 3 : 1, [3, 2], { lit: 1, frame: '#3a2418', ei: night ? .5 : 1.4 }); if (night) sh.emissive.set(0x7090ff);
  add(new T.PlaneGeometry(12, 6), sh, 4, 3, -7.9, { cast: false }); box(30, 7.6, .3, M.wall, 0, 0, -8.2); box(30, .4, .5, M.wood, 0, 6.2, -7.9); box(.3, 7.6, 14, M.wall, -15, 0, -1); box(.3, 7.6, 14, M.wall, 15, 0, -1);
  for (let x = -14; x <= 14; x += 3.5) box(.3, 7.6, .3, M.wood, x, 0, -7.9); box(30, .3, 14, M.wall, 0, 7.6, -1, { cast: false });
  if (night) { const hole = add(new T.PlaneGeometry(2.6, 2.4), new T.MeshBasicMaterial({ color: 0x0a0e20 }), 2, 3.4, -7.85, { cast: false }); D.glow(2, 3.4, -7.4, 4, 0x8090ff); add(new T.CircleGeometry(.8, 24), new T.MeshBasicMaterial({ color: 0xf0f4ff, fog: false }), 2.4, 3.8, -7.82, { cast: false }); }
  else D.glow(4, 3, -7.2, 14, 0xffa060);
  // ── the kotatsu with its quilt, teapot and cups (Zoomies: quilt dragged off, table skewed) ──
  { const kx = -9, kz = -4; box(3.6, .3, 3.6, M.wood, kx, 1.1, kz, { ry: night ? .3 : 0 });
    const q = add(new T.CylinderGeometry(2.8, 3.2, 1.2, 4, 1), M.quilt, kx + (night ? 1.4 : 0), .6, kz + (night ? .8 : 0), { ry: Math.PI / 4 + (night ? .5 : 0) }); if (night) { q.scale.set(1.2, .4, .9); q.rotation.z = .2; }
    if (!night) { add(new T.SphereGeometry(.45, 14, 10), new T.MeshStandardMaterial({ color: 0xd8d0c0, roughness: .3 }), kx, 1.7, kz); for (const dx of [.9, -.7]) add(new T.CylinderGeometry(.18, .14, .3, 12), M.bowl, kx + dx, 1.55, kz + .6); drift(D, 12, kx, kz, .2, .2, 0xffffff, { y0: 2, y1: 3.5, size: 14 }); } }
  // ── the cat tower: sisal posts, plush platforms, a little house ──
  { const tx = -3.5, tz = -6.4; for (const [dx, h, y] of [[0, 6, 0], [.9, 3.4, 0]]) add(new T.CylinderGeometry(.24, .24, h, 10), M.sisal, tx + dx, y + h / 2, tz);
    for (const [y, r] of [[1.2, 1.2], [3.4, 1], [6, 1.1]]) add(new T.CylinderGeometry(r, r, .3, 16), M.plush, tx, y, tz); box(1.6, 1.4, 1.4, M.plush, tx + .9, 3.6, tz); add(new T.CircleGeometry(.4, 16), new T.MeshBasicMaterial({ color: 0x2a1a10 }), tx + .9, 4.2, tz + .71, { cast: false }); }
  // ── cushions, food bowl with paw print, yarn ──
  for (const [x, z, s] of [[-13, 1, 1], [-11.4, 2.4, .8], [12, 1.6, 1]]) { const c = add(new T.SphereGeometry(1, 12, 8), M.cush, x, .25, z); c.scale.set(1.1 * s, .3, 1.1 * s); }
  model(D, 'television_02', 6.4, 0, -6.6, { h: 1.6, ry: -.2 }); model(D, 'throw_pillows_01', -12.6, .3, 1.1, { s: 2, ry: .3 }); model(D, 'potted_plant_02', 14.2, 0, -5.6, { h: 2.2 });
  add(new T.CylinderGeometry(.9, .7, .5, 18), M.bowl, 10.6, .25, -4.6); for (let i = 0; i < 12; i++) add(new T.SphereGeometry(.12, 6, 4), new T.MeshStandardMaterial({ color: 0x7a4a2a }), 10.6 + R.r(-.5, .5), .52, -4.6 + R.r(-.5, .5), { cast: false });
  add(new T.SphereGeometry(.5, 14, 10), M.yarn, 12.6, .5, -2.4); { const c = new T.CatmullRomCurve3([new T.Vector3(12.4, .1, -2), new T.Vector3(10, .03, -1), new T.Vector3(7, .03, -2.6), new T.Vector3(5, .03, -1.4)]); add(new T.TubeGeometry(c, 30, .03, 4), M.yarn, 0, 0, 0, { cast: false }); }
  if (night) { // the smashed vase, scattered things, the digital clock reading 3:00
    for (let i = 0; i < 6; i++) { const p = add(new T.SphereGeometry(R.r(.2, .5), 6, 4, 0, Math.PI), M.blue, -6 + R.r(-1, 1), .1, -2 + R.r(-1, 1), { rx: R() * 3, rz: R() * 3 }); }
    box(2.4, 1, .3, new T.MeshStandardMaterial({ color: 0x1a1020 }), 11, 4.4, -7.9); add(new T.PlaneGeometry(2, .7), M.clock, 11, 4.9, -7.74, { cast: false }); D.glow(11, 4.9, -7.4, 3, 0xb060ff);
    flurry(D, R, 26, { area: [-12, 12, -1, -7], y0: 0, y1: 6, color: 0xe8e0f0, speed: 1.6 }); D.lantern(2, 3.4, -6, { color: 0x8090ff, intensity: 14, distance: 14, glow: 0 }); }
  else { D.lantern(4, 3, -6, { color: 0xffa050, intensity: 18, distance: 16, glow: 0 }); D.lantern(-9, 2.6, -2, { intensity: 10, distance: 8, glow: 0 }); }
  await prop('sakura', 13.4, -6, 3, { y: 0, tint: night ? 0x8a80c0 : 0xff9090, blob: false });
  scatter(D, rng(111), { area: [-13, 13, -3, 5], petals: night ? 60 : 20, petal: night ? 0xd8d0f0 : 0xffb0a0 });
  decals(D, rng(607), { area: [-13, 13, -3, 5], list: [['stain', 2, [1, 1.6], { op: .7 }]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1241), { area: [-14, 14, -7, 3], items: [['cardboard_box_01', 2, { s: [1.8, 2.4] }], ['chinese_stool', 1, [.6, .7]]] });   // real CC0 models placed where they fit (kit.dress)
}
