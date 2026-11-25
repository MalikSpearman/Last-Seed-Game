// Whalebone Shore: a wet fishing-dock deck above a beach at night. A whale's skeleton lies on the sand under its ribs,
// a fisher's hut with crest banners and lanterns, rowboats drawn up, a drying rack of fish, a long lit pier out to the
// junks at anchor, waves running up the sand, under a blood moon.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, ship, sea, breakers, deck, rail, pagoda, bannerTex, ctex, scatter, clutter, farPainting, drift, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.6], [-4.4, -1.8], [1.6, -2.6]], sum: [-5.6, .8], exposure: 1.6 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(301);
  S.fog = new T.Fog(0x3a1a40, 26, 140); S.background = new T.Color(0x24122e);
  D.moonlight({ color: 0xffa0a8, intensity: 2, dir: [.4, 1, -.4], ambient: 0x5a3068, ambientI: 2, sky: 0x9a5aa8, ground: 0x4a3028 });
  sky(D, [[0, '#140a24'], [.5, '#4a1640'], [1, '#8a2a3a']], { stars: 60 }); moon(D, 24, 50, -140, 26, [240, 70, 60], [220, 40, 70]);
  const M = { deck: pbr('weathered_planks', [6, 2], { color: 0xd0a8b0, rough: .32, metal: .1, ns: 1.3 }), post: pbr('weathered_planks', [.4, 1], { color: 0x8a6a6a }),
    stone: pbr('mossy_rock', [.5, .5], { color: 0xc8c0b8 }), sand: pbr('coast_sand_rocks_02', [12, 6], { color: 0xb8a0a0, rough: .8 }), bone: pbr('rock_face', [1, 3], { color: 0xf0e8dc, rough: .7 }),
    wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x9a6a58 }), roof: pbr('roof_tiles_14', [3, 3], { color: 0x8a80a0 }), boat: pbr('weathered_planks', [1, 1], { color: 0xa84040 }),
    rock: pbr('rock_face', [2, 2], { color: 0x6a5a6a, ns: 1.8 }), fish: new T.MeshStandardMaterial({ color: 0xc8c8d0, metalness: .6, roughness: .3 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#c02a36', '#8a1424'], trim: '#f0e0c8', sd: 61, emblem: (g, cx, cy) => { g.strokeStyle = '#f4e8dc'; g.lineWidth = 16; for (const r of [60, 36]) { g.beginPath(); g.arc(cx, cy, r, .3, Math.PI * 1.7); g.stroke(); } } })), side: T.DoubleSide, alphaTest: .4 }) };
  deck(D, K, R, { mat: M.deck, post: M.post, stone: M.stone });
  // ── the beach below and the sea ──
  { const b = new T.Mesh(new T.PlaneGeometry(120, 30), M.sand); b.rotation.x = -Math.PI / 2; b.rotation.z = .08; b.position.set(-10, -1.2, -16); b.receiveShadow = true; S.add(b); }
  sea(D, R, { z: -80, shore: -26, foam: 7 });
  // ── the whale skeleton: spine, ribs arching over the sand, skull, jaw ──
  { const x0 = -14, z0 = -12, sp = []; for (let i = 0; i <= 16; i++) { const u = i / 16; sp.push(new T.Vector3(x0 + u * 18, 1.6 + Math.sin(u * Math.PI) * 2.2 - u * 1.2, z0 - u * 3)); }
    const spine = new T.CatmullRomCurve3(sp); add(new T.TubeGeometry(spine, 40, .28, 8), M.bone, 0, 0, 0);
    for (let i = 1; i < 12; i++) { const p = spine.getPoint(i / 13), r = 2.6 + Math.sin(i / 12 * Math.PI) * 1.6;
      for (const s of [-1, 1]) { const c = new T.QuadraticBezierCurve3(p, new T.Vector3(p.x, p.y + .4, p.z + s * r * 1.1), new T.Vector3(p.x + .3, -1.1, p.z + s * r * .8)); add(new T.TubeGeometry(c, 12, .16 - i * .006, 6), M.bone, 0, 0, 0); } }
    const sk = add(new T.SphereGeometry(1.6, 14, 10), M.bone, x0 + 19.5, .8, z0 - 3.2); sk.scale.set(2.4, .8, 1.1);
    const jaw = add(new T.CylinderGeometry(.2, .35, 6, 8), M.bone, x0 + 21, -.4, z0 - 1.8, { rz: Math.PI / 2 - .2 }); }
  // ── the fisher's hut, banners, lanterns, boats, drying rack ──
  pagoda(K, D, -16, -6, { w: 6, d: 5, h: 3.4, tiers: 1, y: -1.2, roof: M.roof, beam: M.wood, sd: 2 });
  for (let k = 0; k < 2; k++) { const b = new T.Mesh(new T.PlaneGeometry(1.4, 2.6), M.ban); b.position.set(-13.6 + k * 1.6, 1.6, -3.4); S.add(b); }
  const boat = (x, z, ry) => { const g = new T.Group(); g.position.set(x, -1.1, z); g.rotation.y = ry; S.add(g); for (const [y, w, l] of [[0, 1.4, 4.4], [-.25, 1, 3.8]]) { const h = new T.Mesh(new T.BoxGeometry(w, .3, l), M.boat); h.position.y = y + .3; h.castShadow = true; g.add(h); }
    for (const s of [-1, 1]) { const p = new T.Mesh(new T.ConeGeometry(.45, 1.1, 4), M.boat); p.rotation.x = s * Math.PI / 2; p.position.set(0, .3, s * 2.7); p.scale.x = 1.5; g.add(p); } };
  boat(-9, -8, .4); boat(-6.4, -9.6, .7);
  { const rx = 12, rz = -5; for (const dx of [-1.8, 1.8]) box(.2, 4, .2, M.wood, rx + dx, -1.2, rz); box(4, .14, .14, M.wood, rx, 2.6, rz, { cast: false });
    for (let k = 0; k < 4; k++) { const f = add(new T.ConeGeometry(.22, 1.2, 6), M.fish, rx - 1.3 + k * .85, 1.8, rz, { rx: Math.PI }); f.scale.z = .4; } }
  // ── the long lit pier out to the junks ──
  { const pz = -24; box(4, .3, 30, pbr('worn_planks', [1, 6], { color: 0xb09090 }), 6, -.6, pz, { ry: -.7 });
    for (let i = 0; i < 8; i++) { const x = 6 - 9 + i * 2.6, z = pz + 10 - i * 2.8; box(.2, 1.8, .2, M.wood, x, -.6, z); D.glow(x, 1.4, z, 1, 0xffb060); }
    pagoda(K, D, 16, -34, { w: 5, d: 4, h: 2.4, tiers: 1, y: -.4, roof: M.roof, sd: 5 }); pagoda(K, D, 22, -38, { w: 4, d: 3.6, h: 2.2, tiers: 1, y: -.4, roof: M.roof, sd: 6 }); }
  ship(K, D, 24, -52, 14, { y: -.9, ry: -.15 }); ship(K, D, -10, -70, 12, { y: -.9, ry: .1 }); ship(K, D, 40, -84, 10, { y: -.9 });
  // ── rocks and a cliff on the left, waves breaking ──
  for (let i = 0; i < 10; i++) { const r = add(new T.DodecahedronGeometry(R.r(1.4, 4), 1), M.rock, R.r(-30, -18), R.r(-1, 4), R.r(-4, -30), { ry: R() * 6 }); r.scale.y = R.r(.7, 1.6); }
  breakers(D, R, [[-18, -26, 1.2], [4, -28, .8], [30, -24, 1]]);
  farPainting(D, 'e_whale', { v1: .45, z: -144 });
  scatter(D, rng(77), { area: [-14, 14, -3, 5.4], puddles: 8, pebbles: 30, stone: 0x6a5a50, petals: 40, petal: 0xff4a50 });
  decals(D, rng(761), { area: [-14, 14, -3, 5.4], list: [['stain', 3, [1.2, 2.2]], ['oil', 2, [.9, 1.6]], ['moss', 2, [1.4, 2.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await clutter(D, K, rng(78), 'dock', { area: [-14, 14, -3.2, -2.6], n: 8, clear: 6 });
  drift(D, 40, 0, -10, 20, 10, 0xffb070, { y0: .5, y1: 6, size: 7 });
  await dress(D, rng(966), { area: [-16, 16, -9, 4], items: [['img:rg_boat', 1, [2.2, 2.8]], ['img:rg_fishrack', 1, [2.2, 2.6]], ['wine_barrel_01', 2, [1, 1.2]], ['wooden_crate_02', 2, { s: [1.3, 1.6] }], ['wooden_bucket_01', 1, [.55, .7]], ['lifebuoy', 1, [.9, 1]]] });   // real CC0 models placed where they fit (kit.dress)
}
