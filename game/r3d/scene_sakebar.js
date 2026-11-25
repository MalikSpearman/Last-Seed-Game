// Sake Bar Alley: a covered izakaya lane at night. Stone floor shining with lamplight, the bar on the left with shelves
// of bottles, stools and a steaming pot under seigaiha noren; a low table with cushions and a sake set on the right;
// paper lanterns strung all the way down the lane to the stairs at the far end.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, shojiMat, drift, farPainting, groundFill, scatter, cityBlocks, walkers, clutter } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -3.4]], sum: [-5.2, .8], exposure: 1.5 };

const noren = col => cvs(512, 256, (g, W, H) => { g.fillStyle = col; g.fillRect(0, 0, W, H); const n = 4, w = W / n;
  for (let i = 0; i < n; i++) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(i * w, 0, 4, H); g.strokeStyle = '#f4e4d4'; g.lineWidth = 5; for (let r = 46; r > 8; r -= 12) { g.beginPath(); g.arc(i * w + w / 2, H - 20, r, Math.PI, 0); g.stroke(); } }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, 14); });
const shelf = () => { const R = rng(4); return cvs(512, 256, (g, W, H) => { g.fillStyle = '#4a2a18'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 3; r++) { const y = 20 + r * 78; g.fillStyle = '#2a160c'; g.fillRect(0, y + 66, W, 8); for (let x = 8; x < W - 20; x += R.r(18, 28)) { const h = R.r(34, 62), w = R.r(10, 18), c = R() < .5 ? '#e8e0c8' : R() < .5 ? '#3a5a3a' : '#5a2a1a';
    g.fillStyle = c; g.fillRect(x, y + 66 - h, w, h); g.fillRect(x + w / 2 - 2, y + 66 - h - 10, 4, 10); if (c === '#e8e0c8') { g.fillStyle = '#1a1a1a'; g.fillRect(x + 2, y + 66 - h * .7, w - 4, h * .3); } g.fillStyle = 'rgba(255,220,160,.25)'; g.fillRect(x + 1, y + 66 - h, 3, h); } } }); };
const cushion = () => cvs(128, 128, (g, W) => { g.fillStyle = '#a02a30'; g.fillRect(0, 0, W, W); g.strokeStyle = '#e0b060'; g.lineWidth = 3; for (let i = 0; i < W; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(0, i); g.stroke(); g.beginPath(); g.moveTo(W - i, 0); g.lineTo(W, i); g.stroke(); } });

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(231);
  S.fog = new T.Fog(0x3a2418, 14, 60); S.background = new T.Color(0x1a1010);
  D.moonlight({ color: 0xffd0a0, intensity: 1, dir: [.2, 1, .6], ambient: 0x6a4a3a, ambientI: 2.4, sky: 0xd09a70, ground: 0x4a3028 });
  const M = { floor: pbr('rock_tile_floor', [4, 8], { color: 0xc0a890, rough: .3, metal: .12, ns: 1.3 }), wood: pbr('japanese_cedar_planks', [.5, 1], { color: 0xa07058 }),
    dark: pbr('weathered_planks', [1, 1], { color: 0x8a6050 }), top: pbr('japanese_cedar_planks', [3, .4], { color: 0xc08868, rough: .4 }), roof: pbr('roof_tiles_14', [6, 2], { color: 0x8a7a80 }),
    shelf: new T.MeshStandardMaterial({ map: ctex(shelf()), emissive: 0xffa060, emissiveMap: ctex(shelf()), emissiveIntensity: .25, roughness: .6 }),
    nR: new T.MeshStandardMaterial({ map: ctex(noren('#b02a34')), side: T.DoubleSide }), nB: new T.MeshStandardMaterial({ map: ctex(noren('#2a2a5a')), side: T.DoubleSide }),
    cush: new T.MeshStandardMaterial({ map: ctex(cushion()), roughness: .9 }), jar: new T.MeshStandardMaterial({ color: 0x4a3a34, roughness: .3, metalness: .1 }),
    paper: new T.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffa050, emissiveIntensity: 1.8 }), paperR: new T.MeshStandardMaterial({ color: 0xff6040, emissive: 0xff3818, emissiveIntensity: 1.5 }),
    pot: new T.MeshStandardMaterial({ color: 0x2a2a2e, metalness: .6, roughness: .4 }), rope: new T.MeshStandardMaterial({ color: 0xc8b088 }) };
  // ── the lane: floor running back, walls of shopfronts both sides, beams overhead ──
  { const f = new T.Mesh(new T.PlaneGeometry(26, 60), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -24); f.receiveShadow = true; S.add(f); }
  for (const s of [-1, 1]) { box(1, 7, 60, M.dark, s * 11.5, 0, -24); for (let z = 4; z > -50; z -= 6) box(.4, 7, .4, M.wood, s * 10.8, 0, z);
    for (let z = -6; z > -48; z -= 6) { const w = shojiMat(z | 0, [2, 1], { lit: .9 }); add(new T.PlaneGeometry(5, 2.6), w, s * 10.9, 2.4, z - 3, { ry: -s * Math.PI / 2, cast: false }); D.lantern(s * 9.6, 2.4, z - 3, { intensity: 8, distance: 8, glow: 0 }); } }
  for (let z = 4; z > -50; z -= 3) box(23, .3, .3, M.wood, 0, 6.6, z, { cast: false });
  box(26, .2, 60, M.roof, 0, 7.4, -24, { cast: false });
  // ── the bar (left): counter, top, stools, back shelves of bottles, noren, the steaming pot ──
  box(2, 1.15, 9, M.dark, -8.4, 0, -3); box(2.4, .12, 9.4, M.top, -8.3, 1.15, -3);
  add(new T.PlaneGeometry(9, 4.2), M.shelf, -10.95, 3.2, -3, { ry: Math.PI / 2, cast: false });
  for (let z = -6.4; z <= .6; z += 1.7) { add(new T.CylinderGeometry(.32, .3, .12, 12), M.top, -6.9, .78, z); for (const [dx, dz] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) box(.06, .72, .06, M.wood, -6.9 + dx, 0, z + dz); }
  for (let i = 0; i < 3; i++) { const n = add(new T.PlaneGeometry(3, 1.6), M.nR, -7.4, 5.4, -6.2 + i * 3.1, { ry: Math.PI / 2, cast: false }); D.updaters.push(t => { n.rotation.z = Math.sin(t * .7 + i) * .02; }); }
  add(new T.CylinderGeometry(.6, .5, .6, 16), M.pot, -8.6, 1.5, -5.6); D.glow(-8.6, 1.9, -5.4, 1.4, 0xffa060);
  { const sm = []; const mat = new T.SpriteMaterial({ color: 0xf0e8e0, transparent: true, opacity: .22, depthWrite: false }); for (let i = 0; i < 10; i++) { const s = new T.Sprite(mat); S.add(s); sm.push(s); }
    D.updaters.push(t => sm.forEach((s, i) => { const u = (t * .3 + i / 10) % 1; s.position.set(-8.6 + Math.sin(t * .8 + i) * .3, 1.9 + u * 3.6, -5.6 + u * .4); s.scale.set(.6 + u * 2, .6 + u * 2, 1); })); }
  for (let z = -6.6; z <= .8; z += 1.1) for (let k = 0; k < 2; k++) { const b = add(new T.CylinderGeometry(.08, .1, .36, 8), R() < .5 ? M.jar : new T.MeshStandardMaterial({ color: 0xe8e0c8 }), -9 + k * .3, 1.45, z + R.r(-.2, .2)); }
  // big sake jar with rope at the front left, barrel
  { const j = add(new T.SphereGeometry(1, 18, 14), M.jar, -11, 1.1, 2.4); j.scale.set(.9, 1.2, .9); add(new T.CylinderGeometry(.45, .55, .5, 14), M.jar, -11, 2.4, 2.4); add(new T.TorusGeometry(.6, .08, 6, 16), M.rope, -11, 2.2, 2.4, { rx: Math.PI / 2 }); }
  // ── the right side: low table, cushions, sake set, a box lantern, blue noren ──
  { const tx = 8, tz = 1; box(3.4, .12, 2, M.top, tx, .9, tz); for (const [dx, dz] of [[-1.5, -.8], [1.5, -.8], [-1.5, .8], [1.5, .8]]) box(.14, .9, .14, M.dark, tx + dx, 0, tz + dz);
    for (const [dx, dz] of [[-1, 1.8], [1.2, 1.9], [-2.6, 0], [0, -1.8]]) { const c = add(new T.BoxGeometry(1.3, .3, 1.3), M.cush, tx + dx, .15, tz + dz, { ry: R.r(-.2, .2) }); }
    add(new T.CylinderGeometry(.14, .2, .6, 12), M.jar, tx - .6, 1.32, tz); for (const dx of [.2, .6]) add(new T.CylinderGeometry(.1, .07, .12, 10), new T.MeshStandardMaterial({ color: 0xf0e8e0 }), tx + dx, 1.02, tz + .2);
    box(.6, .7, .6, M.paper, tx + 1.2, .96, tz - .3, { cast: false }); D.lantern(tx + 1.2, 1.4, tz, { intensity: 14, distance: 8, glow: 1 });
    for (let i = 0; i < 2; i++) add(new T.PlaneGeometry(2.6, 2.4), M.nB, 9.6, 4.6, -4 - i * 2.7, { ry: -Math.PI / 2, cast: false }); }
  // ── lanterns strung down the lane, the stairs at the far end ──
  for (let z = 1, i = 0; z > -46; z -= 4.2, i++) for (const x of [-5, 0, 5]) { if (x === 0 && i % 2) continue; const red = (i + x) % 3 === 0, l = add(new T.SphereGeometry(.42, 14, 10), red ? M.paperR : M.paper, x + (i % 2) * .6, 5.4 - (x === 0 ? .4 : 0), z, { cast: false }); l.scale.y = 1.3;
    box(.04, .6, .04, M.wood, l.position.x, 6, z, { cast: false }); if (i % 2 === 0 || x === 0) D.lantern(l.position.x, l.position.y, z, { color: red ? 0xff7040 : 0xffb060, intensity: 12, distance: 9, glow: 1.2 }); }
  for (let i = 0; i < 10; i++) box(8, .4, 1, M.dark, 0, i * .4, -48 - i * .8);
  D.glow(0, 5, -56, 8, 0xffa050); drift(D, 30, 0, -10, 8, 14, 0xffc080, { y0: .5, y1: 6, size: 6 });
  for (let i = 0; i < 3; i++) await K.prop('sakura', -9.6, -10 - i * .8, 2.4, { y: 1.2, tint: 0xff4040, blob: false });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(14);
  scatter(D, R2, { area: [-8, 8, -10, 5], puddles: 6, pebbles: 30, stone: 0x5a4a40, petals: 40, petal: 0xff5050 });
  // background life and mid-ground clutter
  await walkers(D, R2, { rim: '#ffa050', z: -14, x0: -7, x1: 7, group: 2, every: [4, 8], zJit: 1 }); await walkers(D, R2, { rim: '#ffa050', z: -30, x0: -7, x1: 7, group: 2, every: [3, 7], zJit: 2 });
}
