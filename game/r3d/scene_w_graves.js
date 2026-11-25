// Willow Graves: a rain-slick mossy plaza at the edge of an old graveyard. Leaning headstones, wooden grave tablets and
// red-bibbed jizo statues among red spider lilies, an ancient weeping willow, a torii up worn steps to a small shrine,
// stone lanterns at the corners, blue soul-fires drifting over the stones, under a blood moon.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, stoneLantern, drift, rain, torii, pagoda, water, deadTree, farPainting, groundFill, scatter, cityBlocks, walkers, clutter, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2], [-4.4, -2.4], [1.6, -3.2]], sum: [-5.6, .8], exposure: 1.6 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(211);
  S.fog = new T.Fog(0x382a58, 18, 105); S.background = new T.Color(0x22183e);
  D.moonlight({ color: 0xd8b8ff, intensity: 2, dir: [.4, 1, -.2], ambient: 0x4a3c7a, ambientI: 2, sky: 0x8a6ac8, ground: 0x2a3028 });
  sky(D, [[0, '#120a26'], [.55, '#36205a'], [1, '#5a2e6a']], { stars: 40 }); moon(D, 18, 48, -140, 24, [240, 70, 60], [220, 40, 70]);
  const M = { floor: pbr('rock_tile_floor', [4, 3], { color: 0x9a88b0, rough: .3, metal: .15, ns: 1.4 }), moss: pbr('mossy_rock', [.6, .6], { color: 0xb8b8b0 }), stone: pbr('castle_wall_slates', [.4, .6], { color: 0xb0a8b8 }),
    grave: pbr('rock_face', [.5, .8], { color: 0xb8b0b8 }), wood: pbr('weathered_planks', [.2, 1], { color: 0xa08a80 }), red: new T.MeshStandardMaterial({ color: 0xc02030, roughness: .8 }),
    lily: new T.MeshStandardMaterial({ color: 0xff2a30, emissive: 0xa00a14, emissiveIntensity: .6 }), stem: new T.MeshStandardMaterial({ color: 0x3a6a2a }),
    gate: pbr('weathered_planks', [.5, 2], { color: 0xc04040 }), roof: pbr('roof_tiles_14', [3, 3], { color: 0x8a8aa0 }), bark: pbr('japanese_cedar_bark', [2, 3], { color: 0x9a8888, ns: 1.5 }),
    willow: new T.MeshStandardMaterial({ color: 0x9ac050, roughness: .9, side: T.DoubleSide }), pine: new T.MeshStandardMaterial({ color: 0x2a3048, roughness: 1 }), ground: pbr('mud_forest', [20, 20], { color: 0x6a6a70 }) };
  { const g = new T.Mesh(new T.PlaneGeometry(200, 140), M.ground); g.rotation.x = -Math.PI / 2; g.position.set(0, -.02, -50); g.receiveShadow = true; S.add(g);
    const f = new T.Mesh(new T.PlaneGeometry(28, 12), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, .01, 1); f.receiveShadow = true; S.add(f); }
  water(D, 10, -20, 30, 16, 0x1a2a4a, { y: -.05, sky: ['#5a3a6a', '#1a2a4a'], rings: 10, scale: 4 });
  // ── the graveyard: headstones, tablets, jizo, lilies ──
  const headstone = (x, z, h, tilt) => { const b = box(.8 * h / 2, h, .3, M.grave, x, 0, z, { ry: R.r(-.3, .3) }); b.rotation.z = tilt; box(1 * h / 2, .3, .5, M.moss, x, 0, z); };
  for (let i = 0; i < 34; i++) { const x = R.r(-16, 4), z = R.r(-5, -18); if (Math.abs(x + 9) < 2 && z > -8) continue; headstone(x, z, R.r(1.2, 2.4), R.r(-.12, .12)); }
  for (let i = 0; i < 16; i++) box(.24, R.r(1.4, 2.2), .05, M.wood, R.r(-14, 2), R.r(-6, -16), { ry: R.r(-.3, .3) });
  const jizo = (x, z, s = 1) => { add(new T.CylinderGeometry(.32 * s, .38 * s, .9 * s, 10), M.moss, x, .45 * s, z); add(new T.SphereGeometry(.26 * s, 10, 8), M.moss, x, 1.1 * s, z); add(new T.ConeGeometry(.42 * s, .5 * s, 10, 1, true), M.red, x, .72 * s, z + .04, { rx: -.2 }); };
  jizo(-8.6, -4.6, 1.3); jizo(-7.4, -5.2); jizo(-2, -8); jizo(-12, -9, 1.1);
  for (let i = 0; i < 60; i++) { const x = R() < .7 ? R.r(-15, 0) : R.r(4, 12), z = R.r(-3.6, -12); add(new T.CylinderGeometry(.015, .015, .5, 3), M.stem, x, .25, z, { cast: false });
    const f = add(new T.SphereGeometry(.13, 6, 4), M.lily, x, .52, z, { cast: false }); f.scale.y = .6; if (i % 5 === 0) D.glow(x, .55, z, .5, 0xff3040); }
  // ── the willow and old trees ──
  add(new T.CylinderGeometry(.8, 1.4, 9, 10), M.bark, -13, 4.5, -6);
  for (const [dx, dy, rz] of [[-1.6, 8, .6], [2, 8.6, -.7], [.4, 9.4, .1]]) add(new T.CylinderGeometry(.3, .6, 5, 7), M.bark, -13 + dx, dy, -6, { rz });
  for (let i = 0; i < 120; i++) { const a = R() * Math.PI * 2, rr = R() * 6, l = R.r(3, 7); const s = add(new T.PlaneGeometry(.22, l), M.willow, -12 + Math.cos(a) * rr, 11 - l / 2, -5 + Math.sin(a) * rr * .5, { cast: false, ry: R() * 3 }); D.updaters.push(t => { s.rotation.z = Math.sin(t * .6 + i) * .05; }); }
  deadTree(K, 16, -10, 9, M.bark, 4); deadTree(K, 20, -18, 8, M.bark, 9);
  // ── the torii up the steps to a small shrine (right, back) ──
  for (let i = 0; i < 8; i++) box(5 - i * .1, .35, 1, M.stone, 11, i * .35, -14 - i * .9);
  torii(K, 11, -14.6, 5.4, M.gate, { y: .1, dark: M.moss }); box(8, 2.8, 6, M.stone, 11, 0, -24);
  pagoda(K, D, 11, -24, { w: 4.6, d: 4, h: 2.8, tiers: 1, y: 2.8, roof: M.roof, beam: M.gate, sd: 4 });
  // ── stone lanterns at the corners, soul-fires, forest, rain ──
  stoneLantern(D, K, -12.4, -1.8, 1.5, { mat: M.moss }); stoneLantern(D, K, 12.6, -2, 1.5, { mat: M.moss });
  for (const [x, y, z] of [[-14, 3, -8], [-6, 2.6, -12], [3, 2.2, -10], [7, 3.6, -16], [-10, 4, -15], [15, 2.4, -6]]) { D.glow(x, y, z, 1.4, 0x40a8ff); D.glow(x, y + .3, z, .7, 0xc0f0ff); }
  drift(D, 30, -4, -10, 12, 6, 0x60c0ff, { y0: 1, y1: 5, size: 18 });
  for (let i = 0; i < 46; i++) { const x = R.r(-70, 70), z = R.r(-30, -64), h = R.r(10, 22); add(new T.ConeGeometry(h * .26, h, 7), M.pine, x, h / 2, z, { cast: false }); }
  for (let i = 0; i < 10; i++) { const x = (R() < .5 ? -1 : 1) * R.r(10, 14), z = R.r(2, 6); await prop('ferns', x, z, R.r(.7, 1.1), { tint: 0x4a7a4a, blob: false }); add(new T.ConeGeometry(.12, .3, 5), new T.MeshStandardMaterial({ color: 0x7a50e0 }), x, .9, z, { cast: false }); }
  rain(D, 600, [-20, 20], [0, 14], [-20, 8], { speed: 11 });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(627);
  farPainting(D, 'w_graves', { v1: .5, z: -145 });
  scatter(D, R2, { area: [-14, 14, -4, 6], puddles: 9, tufts: 90, tuft: 0x5a8a3a, leaves: 110, leaf: 0x8aa848, pebbles: 70, stone: 0x6a6070 });
  decals(D, rng(733), { area: [-14, 14, -4, 6], list: [['moss', 7, [1.4, 3]], ['stain', 3, [1.2, 2.2]], ['crack', 3, [1.4, 2.6]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'shrine', { area: [-16, 6, -4, -16], n: 20, clear: 3 });
  await dress(D, rng(922), { area: [-16, 16, -9, 4], items: [['img:rg_willow', 2, [7, 9]], ['tree_stump_01', 2, [.4, .6]], ['dead_tree_trunk', 1, { s: [.7, 1] }], ['namaqualand_boulder_02', 2, [.6, 1.2]], ['painted_wooden_bench', 1, [.9, 1]]] });   // real CC0 models placed where they fit (kit.dress)
}
