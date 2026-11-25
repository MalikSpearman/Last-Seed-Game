// Neon Teahouse: a tatami room open onto a garden. Shoji walls, a dragon scroll, paper lanterns painted with blossom,
// a low tea table with cushions; through the wide opening, a red bridge over a koi pond with a waterfall and a red
// maple, and beyond the garden wall the Neon Ward's towers in the rain under the moon.
import { T } from './diorama.js';
import { kit, rng, moon, sky, pbr, ctex, cvs, shojiMat, stoneLantern, water, rain, skyline, drift, farPainting, groundFill, scatter, cityBlocks, walkers, clutter } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.4], [-4, -1.6], [1.4, -2.2]], sum: [-5.2, .8], exposure: 1.55 };

const tatami = () => { const R = rng(2); return cvs(512, 512, (g, W, H) => { g.fillStyle = '#c8a860'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 3) { g.fillStyle = `rgba(${R() < .5 ? '90,70,30' : '255,240,190'},${R.r(.06, .16)})`; g.fillRect(0, y, W, 1.5); }
  g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, W, 18); g.fillRect(0, H / 2 - 9, W, 18); g.fillStyle = '#5a4020'; for (let x = 0; x < W; x += 12) { g.fillRect(x, 4, 6, 10); g.fillRect(x, H / 2 - 5, 6, 10); } g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(W / 2 - 1, 18, 2, H / 2 - 27); g.fillRect(W / 4, H / 2 + 9, 2, H / 2); }); };
const dragon = () => cvs(256, 512, (g, W, H) => { g.fillStyle = '#efe2c8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a1a1a'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(60, 60);
  for (let i = 0; i < 9; i++) g.quadraticCurveTo(i % 2 ? 40 : 220, 60 + i * 50, 128, 85 + i * 50); g.stroke(); g.strokeStyle = '#d0a040'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#8a1a1a'; g.beginPath(); g.ellipse(70, 60, 34, 22, -.3, 0, 7); g.fill(); g.fillStyle = '#f0c040'; g.beginPath(); g.arc(60, 54, 5, 0, 7); g.fill(); g.strokeStyle = '#2a2a6a'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(40 + i * 25, H - 40, 20, Math.PI, 0); g.stroke(); }
  g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, W, 14); g.fillRect(0, H - 14, W, 14); });
const blossomLantern = () => cvs(256, 256, (g, W) => { g.fillStyle = '#fff2e0'; g.fillRect(0, 0, W, W); g.strokeStyle = '#5a2a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 200); g.quadraticCurveTo(120, 120, 256, 60); g.stroke(); g.fillStyle = '#e04a5a'; const R = rng(3); for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(R() * W, 60 + R() * 140, R.r(5, 10), 0, 7); g.fill(); } });

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(251);
  S.fog = new T.Fog(0x3a2a5a, 24, 160); S.background = new T.Color(0x201840);
  D.moonlight({ color: 0xc0b8ff, intensity: 1.4, dir: [.2, 1, -.8], ambient: 0x8a6a6a, ambientI: 2.4, sky: 0xffc0a0, ground: 0x6a4a3a });
  sky(D, [[0, '#120c30'], [.6, '#36246a'], [1, '#6a3a80']], { stars: 40 }); moon(D, 16, 46, -140, 18);
  const M = { tatami: new T.MeshStandardMaterial({ map: ctex(tatami(), [3, 2]), normalMap: null, roughness: .75, color: 0xffe8c8 }), wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x9a3a30, rough: .35 }),
    dark: pbr('weathered_planks', [.4, 1], { color: 0x5a2a28 }), top: pbr('japanese_cedar_planks', [2, .5], { color: 0x6a2a20, rough: .25 }), gold: new T.MeshStandardMaterial({ color: 0xd9a441, metalness: .6, roughness: .35 }),
    scroll: new T.MeshStandardMaterial({ map: ctex(dragon()), roughness: .9 }), lan: new T.MeshStandardMaterial({ map: ctex(blossomLantern()), emissive: 0xffa060, emissiveMap: ctex(blossomLantern()), emissiveIntensity: 1.2 }),
    cush: new T.MeshStandardMaterial({ color: 0xa02a34, roughness: .9 }), red: pbr('japanese_cedar_planks', [.3, 2], { color: 0xd03030, rough: .4 }), stone: pbr('mossy_rock', [.5, .5], { color: 0xc0c0b8 }),
    rock: pbr('mossy_rock', [1, 1], { color: 0x9a9aa0 }), grass: pbr('coast_sand_rocks_02', [8, 8], { color: 0x7a9a7a }), wall: pbr('castle_wall_slates', [8, 1], { color: 0x8a8098 }), maple: new T.MeshStandardMaterial({ color: 0xe02a2a }) };
  // ── the room: tatami floor, posts, shoji side walls, the dragon scroll, a lintel framing the garden ──
  { const f = new T.Mesh(new T.PlaneGeometry(26, 10), M.tatami); f.rotation.x = -Math.PI / 2; f.position.set(0, .02, 1); f.receiveShadow = true; S.add(f); }
  box(26, .3, .5, M.dark, 0, 0, -4.1);
  for (const s of [-1, 1]) { const w = shojiMat(s > 0 ? 3 : 6, [2, 2], { lit: 1, frame: '#3a1a14', ei: 1 }); add(new T.PlaneGeometry(4, 5.6), w, s * 9.4, 2.8, -4.2, { cast: false }); box(.4, 6, .4, M.wood, s * 11.6, 0, -4.2); box(.4, 6, .4, M.wood, s * 7.2, 0, -4.2); }
  add(new T.PlaneGeometry(3.2, 5), M.scroll, -12.6, 2.9, -1, { ry: Math.PI / 2 }); box(.3, 6, 10, M.dark, -13, 0, 0); box(.3, 6, 10, M.dark, 13, 0, 0);
  box(28, .7, .6, M.wood, 0, 6, -4.2); box(28, .2, .3, M.gold, 0, 5.7, -3.9, { cast: false }); box(28, .3, 10, M.dark, 0, 6.6, 0, { cast: false });
  for (let x = -12; x <= 12; x += 3) box(.16, .8, .16, M.gold, x, 6.6, -4, { cast: false });
  // paper lanterns with blossoms, a floor lantern
  for (const [x, z] of [[-9, -2.4], [9, -2.4], [0, 1]]) { const l = add(new T.SphereGeometry(.7, 18, 12), M.lan, x, 4.8, z, { cast: false }); l.scale.y = 1.15; box(.6, .12, .6, M.dark, x, 5.6, z, { cast: false }); box(.6, .12, .6, M.dark, x, 3.96, z, { cast: false }); D.lantern(x, 4.8, z + .2, { intensity: 16, distance: 11, glow: 1.4 }); }
  box(.8, 1.1, .8, new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffa040, emissiveIntensity: 1.8 }), -11.4, 0, 1.6, { cast: false }); D.lantern(-11.4, .9, 1.8, { intensity: 10, distance: 7, glow: .8 });
  // low tea table, cushions, a vase with a blossom branch
  box(3.2, .14, 1.4, M.top, -8.6, .5, -2.2); for (const dx of [-1.4, 1.4]) box(.2, .5, 1.2, M.dark, -8.6 + dx, 0, -2.2);
  for (const dx of [-1.4, 1]) add(new T.BoxGeometry(1.2, .2, 1.2), M.cush, -8.6 + dx, .1, -.8);
  add(new T.SphereGeometry(.4, 14, 10), new T.MeshStandardMaterial({ color: 0x2a3a8a, roughness: .2 }), -11.6, .45, -2.8); await prop('sakura', -11.6, -2.8, 1.8, { y: .7, blob: false, shadow: false });
  // ── the garden: grass and rocks, a koi pond with a red arched bridge, waterfall, maple, stone lanterns ──
  { const g = new T.Mesh(new T.PlaneGeometry(80, 30), M.grass); g.rotation.x = -Math.PI / 2; g.position.set(0, -.4, -20); g.receiveShadow = true; S.add(g); }
  const pond = water(D, 2, -14, 20, 8, 0x1a3a5a, { y: -.3, sky: ['#4a3a7a', '#1a3a4a'], rings: 10, scale: 3 }); pond.material.emissive = new T.Color(0x0a2a40);
  for (let i = 0; i < 6; i++) { const k = add(new T.SphereGeometry(.2, 8, 6), new T.MeshStandardMaterial({ color: i % 2 ? 0xff7a30 : 0xffffff, emissive: 0x401000 }), 0, -.36, 0, { cast: false }); k.scale.set(2.4, .4, 1); const ph = i;
    D.updaters.push(t => { const a = t * .3 + ph; k.position.set(2 + Math.cos(a) * 6, -.36, -14 + Math.sin(a * 1.3) * 2.4); k.rotation.y = -a - Math.PI / 2; }); }
  { const N = 16, x0 = -3, x1 = 7, z = -14; for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, a = x0 + (x1 - x0) * u0, b = x0 + (x1 - x0) * u1, ya = Math.sin(Math.PI * u0) * 1.4 - .2, yb = Math.sin(Math.PI * u1) * 1.4 - .2, L = Math.hypot(b - a, yb - ya), rz = Math.atan2(yb - ya, b - a);
      add(new T.BoxGeometry(L * 1.05, .12, 1.6), M.red, (a + b) / 2, (ya + yb) / 2, z, { rz }); for (const s of [-1, 1]) add(new T.BoxGeometry(L * 1.05, .08, .08), M.red, (a + b) / 2, (ya + yb) / 2 + .8, z + s * .8, { rz }); if (i % 3 === 0) for (const s of [-1, 1]) box(.1, .8, .1, M.red, a, ya, z + s * .8); } }
  for (let i = 0; i < 10; i++) { const b = add(new T.DodecahedronGeometry(R.r(.6, 1.6), 1), M.rock, R.r(-10, 12), -.2, R.r(-10, -20), { ry: R() * 6 }); b.scale.y = .6; }
  { const fx = -6, fz = -20; for (let i = 0; i < 5; i++) { const b = add(new T.DodecahedronGeometry(R.r(1.4, 2.4), 1), M.rock, fx + R.r(-3, 3), R.r(0, 2.4), fz - R.r(0, 2), { ry: R() * 6 }); }
    const fm = new T.MeshBasicMaterial({ color: 0xd0e8ff, transparent: true, opacity: .6, depthWrite: false }); for (const dx of [-1, .4]) { const f = add(new T.PlaneGeometry(.9, 3), fm, fx + dx, 1.2, fz + 1.6, { cast: false }); D.updaters.push(t => { f.material.opacity = .5 + Math.sin(t * 9 + dx) * .1; }); } D.glow(fx, -.1, fz + 2, 2.6, 0xa0d0ff); }
  for (let i = 0; i < 4; i++) await prop('sakura', R.r(-4, 2), R.r(-17, -21), R.r(5, 7), { tint: 0xff3020, flip: R() < .5, sway: .01 });
  stoneLantern(D, K, -9, -12, 1.2, { mat: M.stone }); stoneLantern(D, K, 10, -16, 1.1, { mat: M.stone });
  // the garden wall, then the city in the rain
  box(80, 2.4, .8, M.wall, 0, -.4, -26); add(new T.BoxGeometry(80, .4, 1.6), pbr('roof_tiles_14', [20, 1], { color: 0x8a8aa0 }), 0, 2.2, -26, { cast: false });
  skyline(K, D, R, { zNear: -40, zFar: -120, n: 36, spread: 70 }); farPainting(D, 'sky_neon', { v0: .3, v1: 1, z: -144, yb: -10, h: 92, tint: 0xd8d0e8 });
  { const ow = []; const g = new T.Mesh(new T.BoxGeometry(70, .8, 4), pbr('concrete_pavers', [10, 1], { color: 0x6a6080 })); g.position.set(10, 14, -60); S.add(g); box(70, .14, .14, new T.MeshBasicMaterial({ color: 0xff40c0, fog: false }), 10, 13.5, -58, { cast: false }); }
  rain(D, 600, [-16, 16], [-.4, 14], [-30, -5], { speed: 12 }); drift(D, 20, 0, 0, 10, 3, 0xffc080, { y0: 1, y1: 5, size: 6 });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(129);
  cityBlocks(K, D, R2, { x0: -50, x1: 50, z0: -30, z1: -46, n: 18, hMin: 6, hMax: 18 });
  scatter(D, R2, { area: [-12, 12, -24, -6], pebbles: 80, stone: 0x7a7a80, leaves: 90, leaf: 0xd02a2a, tufts: 40 });
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'wild', { area: [-12, 12, -9, -22], n: 18, clear: 0, y: -.4 });
}
