// Watermill Stream: a mossy wooden landing beside an old watermill. The great wheel turns under a waterfall off the
// millrace, the stream runs on under an arched footbridge to a little lit house, wisteria hangs from the thatch,
// bamboo and irises crowd the banks, stone lanterns glow, blue wisps drift, under a blood moon.
import { millRace } from './west_landmarks.js';
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, water, deck, rail, pagoda, scatter, clutter, farPainting, drift, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.6], [-4.4, -1.8], [1.6, -2.6]], sum: [-5.6, .8], exposure: 1.6 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(361);
  S.fog = new T.Fog(0x2e2450, 22, 120); S.background = new T.Color(0x1e1a3c);
  D.moonlight({ color: 0xd0b8ff, intensity: 2, dir: [.4, 1, -.3], ambient: 0x4a4280, ambientI: 2.1, sky: 0x8070c8, ground: 0x2a3a2a });
  sky(D, [[0, '#120c2a'], [.55, '#34245c'], [1, '#5a3470']], { stars: 60 }); moon(D, 16, 50, -140, 24, [240, 70, 60], [220, 40, 70]);
  const M = { deck: pbr('weathered_planks', [6, 2], { color: 0xb8a598, rough: .61, metal: .018, ns: 1.3 }), post: pbr('weathered_planks', [.4, 1], { color: 0x8a6a6a }), stone: pbr('mossy_rock', [.5, .5], { color: 0xc8c8c0 }),
    wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x9a6a58 }), dark: pbr('weathered_planks', [1, 1], { color: 0x6a4a40 }), wall: pbr('worn_planks', [2, 1], { color: 0x9a7a70 }),
    thatch: pbr('roof_tiles_14', [3, 3], { color: 0x8a8a60 }), rock: pbr('mossy_rock', [2, 2], { color: 0x8a8a98, ns: 1.6 }), bank: pbr('mud_forest', [10, 10], { color: 0x6a6a68 }),
    wis: new T.MeshStandardMaterial({ color: 0xb080ff, emissive: 0x6030a0, emissiveIntensity: .4, side: T.DoubleSide }), iris: new T.MeshStandardMaterial({ color: 0x7a50e0, emissive: 0x3a1a80, emissiveIntensity: .3 }),
    red: pbr('japanese_cedar_planks', [.3, 2], { color: 0xb04040, rough: .4 }), fall: new T.MeshBasicMaterial({ color: 0xd0e0ff, transparent: true, opacity: .6, depthWrite: false }) };
  deck(D, K, R, { mat: M.deck, post: M.post, stone: M.stone, rope: false });
  { const g = new T.Mesh(new T.PlaneGeometry(200, 120), M.bank); g.rotation.x = -Math.PI / 2; g.position.set(0, -.4, -60); g.receiveShadow = true; S.add(g); }
  water(D, 2, -16, 60, 20, 0x1a2a50, { y: -.5, sky: ['#5a3a7a', '#1a2a4a'], flow: [.03, .0], rings: 8, scale: 5 });
  // ── the mill: a thatched house on stone footing, the millrace trough, the turning wheel and its waterfall ──
  { const mx = -13, mz = -9; box(8, 1.6, 6, M.stone, mx, -.5, mz); box(7.4, 4.4, 5.6, M.wall, mx, 1.1, mz);
    const r = add(new T.ConeGeometry(6, 2.6, 4), M.thatch, mx, 6.8, mz, { ry: Math.PI / 4 }); r.scale.set(1.15, 1, 1);
    for (let i = 0; i < 3; i++) { const w = add(new T.PlaneGeometry(1.2, 1), new T.MeshStandardMaterial({ color: 0xffd090, emissive: 0xffa040, emissiveIntensity: 1.4 }), mx - 2.4 + i * 2, 3, mz + 2.81, { cast: false }); }
    D.lantern(mx, 3, mz + 3.6, { intensity: 14, distance: 10, glow: 0 });
    box(1.2, .6, 8, M.dark, mx + 5.6, 5.4, mz - 2, { cast: false });
    const wheel = new T.Group(); wheel.position.set(mx + 5.2, 2.6, mz + 1); S.add(wheel);
    for (const s of [-.5, .5]) { const rim = new T.Mesh(new T.TorusGeometry(3, .14, 6, 32), M.dark); rim.position.z = s; rim.castShadow = true; wheel.add(rim); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, pad = new T.Mesh(new T.BoxGeometry(.9, .14, 1.1), M.wood); pad.position.set(Math.cos(a) * 3, Math.sin(a) * 3, 0); pad.rotation.z = a; wheel.add(pad);
      if (k % 2 === 0) { const sp = new T.Mesh(new T.BoxGeometry(6, .12, .12), M.dark); sp.rotation.z = a; wheel.add(sp); } }
    const axle = new T.Mesh(new T.CylinderGeometry(.3, .3, 1.6, 10), M.dark); axle.rotation.x = Math.PI / 2; wheel.add(axle);
    D.updaters.push((t, dt) => { wheel.rotation.z -= (dt || .016) * .5; });
    const falls = []; for (const dx of [-.3, .5]) { const f = add(new T.PlaneGeometry(1, 5.8), M.fall.clone(), mx + 5.6 + dx, 2.6, mz + 1.7, { cast: false }); falls.push(f); }
    D.updaters.push(t => falls.forEach((f, i) => { f.material.opacity = .45 + Math.sin(t * 10 + i * 2) * .12; }));
    D.glow(mx + 5.6, -.2, mz + 2.4, 3.4, 0xb0d0ff); drift(D, 40, mx + 5.6, mz + 2, 1.6, 1, 0xe0f0ff, { y0: -.4, y1: 1.6, size: 12 });
    // wisteria off the thatch eaves
    for (let i = 0; i < 50; i++) { const x = mx + R.r(-4, 4), l = R.r(.8, 2.6), s = add(new T.PlaneGeometry(.2, l), M.wis, x, 5.6 - l / 2, mz + 3.2 + R.r(0, .3), { cast: false, ry: R.r(-.4, .4) }); D.updaters.push(t => { s.rotation.z = Math.sin(t * .7 + i) * .04; }); } }
  millRace(D, K, M, -7.4, -8);
  // ── the stream's arched footbridge and the little house beyond ──
  { const N = 18, x0 = 4, x1 = 13, z = -24; for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, a = x0 + (x1 - x0) * u0, b = x0 + (x1 - x0) * u1, ya = Math.sin(Math.PI * u0) * 1.8 - .3, yb = Math.sin(Math.PI * u1) * 1.8 - .3, L = Math.hypot(b - a, yb - ya), rz = Math.atan2(yb - ya, b - a);
      add(new T.BoxGeometry(L * 1.05, .12, 1.6), M.dark, (a + b) / 2, (ya + yb) / 2, z, { rz }); for (const s of [-1, 1]) add(new T.BoxGeometry(L * 1.05, .08, .08), M.dark, (a + b) / 2, (ya + yb) / 2 + .8, z + s * .8, { rz }); if (i % 3 === 0) for (const s of [-1, 1]) box(.1, .8, .1, M.dark, a, ya, z + s * .8); } }
  pagoda(K, D, 16, -30, { w: 4.4, d: 3.6, h: 2.4, tiers: 1, y: -.4, roof: M.thatch, beam: M.wood, sd: 5 });
  for (let i = 0; i < 10; i++) { const r = add(new T.DodecahedronGeometry(R.r(.6, 1.6), 1), M.rock, R.r(-10, 14), -.4, R.r(-7, -26), { ry: R() * 6 }); r.scale.y = .6; }
  // ── bamboo, irises, reeds, wisps ──
  for (let i = 0; i < 10; i++) await prop(R() < .5 ? 'bamboo3' : 'rfg_bamboo', R.r(13, 19), R.r(-2, -12), R.r(9, 13), { y: -.4, tint: 0xd8e090, sway: .012, blobW: .2 });
  for (let i = 0; i < 24; i++) { const x = R.r(-12, 16), z = R.r(-6.5, -9); add(new T.ConeGeometry(.12, .3, 5), M.iris, x, .1, z, { cast: false }); await prop('ferns', x, z, R.r(.7, 1.1), { y: -.5, tint: 0x4a7a4a, blob: false }); }
  for (const [x, z] of [[-4, -12], [6, -18], [10, -10]]) D.glow(x, .3, z, 1.2, 0x60c0ff);
  drift(D, 30, 0, -14, 14, 8, 0x80d0ff, { y0: -.2, y1: 3, size: 16 });
  farPainting(D, 'w_mill', { v1: .49, z: -144, tint: 0xaab9cf });
  await prop('rg_willow', 17.2, -13.1, 8.3, { y: -.4, tint: 0x99b7ab, sway: .014, blob: false });
  scatter(D, rng(95), { area: [-14, 14, -3, 5.4], puddles: 7, petals: 90, petal: 0xb080ff, leaves: 30, leaf: 0x6a9a4a, tufts: 20 });
  decals(D, rng(719), { area: [-14, 14, -3, 5.4], list: [['moss', 6, [1.4, 3]], ['stain', 3, [1.2, 2.2]], ['crack', 2, [1.4, 2.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(933), { area: [-16, 16, -9, 4], items: [['namaqualand_boulder_02', 2, [.6, 1.2]], ['tree_stump_01', 1, [.45, .6]], ['dead_tree_trunk', 1, { s: [.8, 1] }], ['wooden_bucket_01', 2, [.55, .7]], ['wine_barrel_01', 1, [1, 1.2]]] });   // real CC0 models placed where they fit (kit.dress)
}
