// Willow Village: a rain-dark wooden landing on a misty river village. Stilt houses with lit paper windows and crest
// banners stand over the water, boardwalk bridges link them, a lantern boat drifts, willows and wisteria hang low,
// stone lanterns guard the landing, irises and blue wisps by the water, under a red moon.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, stoneLantern, water, drift, rail, pagoda, rain, bannerTex, ctex, farPainting, groundFill, scatter, cityBlocks, walkers, clutter, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.4], [-4.4, -1.6], [1.6, -2.2]], sum: [-5.6, .8], exposure: 1.6 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(191);
  S.fog = new T.Fog(0x3a2e5a, 18, 110); S.background = new T.Color(0x241c44);
  D.moonlight({ color: 0xd0b8ff, intensity: 2, dir: [.3, 1, -.3], ambient: 0x4a4280, ambientI: 2.1, sky: 0x8070c8, ground: 0x2a3a3a });
  sky(D, [[0, '#120c2a'], [.55, '#36245e'], [1, '#5a3470']], { stars: 60 }); moon(D, 26, 50, -140, 24, [240, 70, 60], [220, 40, 70]);
  const M = { deck: pbr('weathered_planks', [6, 2], { color: 0xd0b0c0, rough: .32, metal: .1, ns: 1.3 }), walk: pbr('worn_planks', [1, 4], { color: 0xc0a0b0, rough: .5 }),
    wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x9a6a58 }), old: pbr('weathered_planks', [.4, 1], { color: 0x9a7a7a }), roof: pbr('roof_tiles_14', [3, 3], { color: 0x9a90b0 }),
    stone: pbr('mossy_rock', [.5, .5], { color: 0xc8c8c0 }), boat: pbr('weathered_planks', [1, 1], { color: 0x7a5a50 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#c02a36', '#8a1424'], trim: '#e8d0b0', sd: 51, emblem: (g, cx, cy) => { g.fillStyle = '#f4e8dc'; for (let i = 0; i < 4; i++) { g.save(); g.translate(cx, cy); g.rotate(i * Math.PI / 2); g.beginPath(); g.ellipse(0, -34, 16, 34, 0, 0, 7); g.fill(); g.restore(); } } })), side: T.DoubleSide, alphaTest: .4 }),
    willow: new T.MeshStandardMaterial({ color: 0x8ab048, roughness: .9, side: T.DoubleSide }), wis: new T.MeshStandardMaterial({ color: 0xb080ff, emissive: 0x6030a0, emissiveIntensity: .4, side: T.DoubleSide }),
    bark: pbr('japanese_cedar_bark', [1, 2], { color: 0x8a7070 }), iris: new T.MeshStandardMaterial({ color: 0x7a50e0, emissive: 0x3a1a80, emissiveIntensity: .3 }) };
  water(D, 0, -40, 200, 80, 0x1a2a50, { y: -.6, sky: ['#5a3a7a', '#1a2a4a'], rings: 24 }).material.emissive = new T.Color(0x081030);
  // ── the landing ──
  box(28, .4, 9, M.deck, 0, -.4, 1.4); box(28, .3, .3, M.old, 0, -.3, -3.1);
  for (let x = -13; x <= 13; x += 2.6) box(.4, 1.6, .4, M.old, x, -1.8, -3.1);
  box(.5, 1, .5, M.old, 11, 0, -2.6); add(new T.TorusGeometry(.3, .07, 6, 12), new T.MeshStandardMaterial({ color: 0xb89a60 }), 11, .8, -2.6, { rx: Math.PI / 2 });
  for (const [x, z] of [[-12.6, -2], [12.8, -1.8]]) stoneLantern(D, K, x, z, 1.4, { mat: M.stone });
  // ── stilt houses: big on the left, one right, more down the river; boardwalk bridges between ──
  const stilts = (x, z, w, d) => { for (let dx = -w / 2; dx <= w / 2; dx += 2) for (const dz of [-d / 2, d / 2]) box(.3, 2.6, .3, M.old, x + dx, -1.6, z + dz); box(w + 1.4, .2, d + 1.4, M.walk, x, 1, z);
    rail(K, [[x - w / 2 - .7, z + d / 2 + .7], [x + w / 2 + .7, z + d / 2 + .7]], { y: 1.2, h: .8, step: 1.4, mat: M.wood, post: .14, rails: [.8] }); };
  stilts(-10, -9, 7, 5); pagoda(K, D, -10, -9, { w: 7, d: 5, h: 3.2, tiers: 1, y: 1.2, roof: M.roof, beam: M.wood, sd: 2 });
  { const b = new T.Mesh(new T.PlaneGeometry(1.6, 2.4), M.ban); b.position.set(-9, 3.4, -6.4); S.add(b); box(.5, .6, .5, new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffa040, emissiveIntensity: 2 }), -6.4, 3.4, -6.2, { cast: false }); D.lantern(-6.4, 3.7, -6, { intensity: 14, distance: 10, glow: 1 }); }
  stilts(12, -12, 6, 4.4); pagoda(K, D, 12, -12, { w: 6, d: 4.4, h: 2.8, tiers: 1, y: 1.2, roof: M.roof, beam: M.wood, sd: 5 });
  { const b = new T.Mesh(new T.PlaneGeometry(1.3, 2), M.ban); b.position.set(12.6, 3.2, -9.7); S.add(b); }
  stilts(-2, -30, 5, 4); pagoda(K, D, -2, -30, { w: 5, d: 4, h: 2.6, tiers: 2, y: 1.2, roof: M.roof, sd: 7 });
  stilts(6, -38, 4, 3.4); pagoda(K, D, 6, -38, { w: 4, d: 3.4, h: 2.4, tiers: 1, y: 1.2, roof: M.roof, sd: 3 });
  box(3, 4, 3, M.old, 9, 0, -46); pagoda(K, D, 9, -46, { w: 3, d: 3, h: 2, tiers: 1, y: 4, roof: M.roof, sd: 6 });
  for (const [a, b] of [[[-6.4, -7], [8.6, -11]], [[-6.6, -11], [-3, -28]], [[9, -14], [5, -36]]]) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    box(L, .16, 1.4, M.walk, (a[0] + b[0]) / 2, .85, (a[1] + b[1]) / 2, { ry, cast: false }); for (let k = 0; k <= L; k += 2.4) { const x = a[0] + (b[0] - a[0]) * k / L, z = a[1] + (b[1] - a[1]) * k / L; box(.2, 2.6, .2, M.old, x, -1.6, z, { cast: false }); }
    for (const s of [-.7, .7]) { const nx = Math.sin(-ry) * s, nz = Math.cos(ry) * s; rail(K, [[a[0] - nx, a[1] + nz], [b[0] - nx, b[1] + nz]], { y: 1, h: .7, step: 2.4, mat: M.old, post: .1, rails: [.85] }); } }
  // ── the lantern boat ──
  { const g = new T.Group(); g.position.set(2, -.55, -12); g.rotation.y = .3; S.add(g); for (const [y, w, l] of [[0, 1.5, 4.6], [-.25, 1.1, 4], [-.45, .7, 3.2]]) { const h = new T.Mesh(new T.BoxGeometry(w, .25, l), M.boat); h.position.y = y; h.castShadow = true; g.add(h); } for (const s of [-1, 1]) { const p = new T.Mesh(new T.ConeGeometry(.5, 1.2, 4), M.boat); p.rotation.x = s * Math.PI / 2; p.position.set(0, -.1, s * 2.8); p.scale.x = 1.4; g.add(p); }
    const pole = new T.Mesh(new T.CylinderGeometry(.04, .04, 2.2), M.wood); pole.position.set(0, 1.1, -1.6); g.add(pole); const lan = new T.Mesh(new T.SphereGeometry(.24, 10, 8), new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffa040, emissiveIntensity: 2 })); lan.position.set(0, 1.8, -1.6); g.add(lan);
    D.glow(2, 1.3, -12, 1.2, 0xffa050); D.updaters.push(t => { g.position.y = -.55 + Math.sin(t * .9) * .05; g.rotation.z = Math.sin(t * .7) * .03; }); }
  // ── willows and wisteria: drooping strands from canopy points ──
  const strands = (x, y, z, r, n, mat, len) => { for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, rr = R() * r, l = R.r(len * .5, len); const s = add(new T.PlaneGeometry(.18, l), mat, x + Math.cos(a) * rr, y - l / 2, z + Math.sin(a) * rr * .5, { cast: false, ry: R() * 3 });
    D.updaters.push(t => { s.rotation.z = Math.sin(t * .8 + i) * .05; }); } };
  add(new T.CylinderGeometry(.5, .9, 8, 8), M.bark, -16, 4, -4); strands(-14, 8.5, -3, 4, 90, M.willow, 6); strands(-12, 7.5, -1, 2.4, 40, M.wis, 3);
  strands(15, 7, -2, 2.4, 40, M.wis, 3.4); for (let i = 0; i < 6; i++) await prop(R() < .5 ? 'bamboo3' : 'rfg_bamboo', R.r(14, 18), R.r(-3, 2), R.r(9, 12), { y: -.4, tint: 0xd8e090, sway: .012, blobW: .2 });
  // irises along the edge, wisps on the water, rain
  for (let i = 0; i < 16; i++) { const x = (R() < .5 ? -1 : 1) * R.r(10, 14), z = R.r(-3.2, 5.6); add(new T.ConeGeometry(.12, .3, 5), M.iris, x, .8, z, { cast: false }); await prop('ferns', x, z, .8, { tint: 0x4a7a4a, blob: false }); }
  for (const [x, z] of [[-4, -7], [3, -16], [8, -6], [-6, -20]]) D.glow(x, .2, z, 1.2, 0x40e0f0);
  drift(D, 30, 0, -10, 12, 8, 0x60f0ff, { y0: -.4, y1: 2.4, size: 18 }); rain(D, 700, [-20, 20], [-.5, 14], [-22, 8], { speed: 11 }); D.petals(40, -12, -1, 5, { color: 0xc090ff });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(595);
  farPainting(D, 'w_village', { v1: .5, z: -145 });
  scatter(D, R2, { area: [-12, 12, -3, 5], puddles: 8, petals: 120, petal: 0xb080ff, leaves: 40, leaf: 0x7aa040, avoid: 4 });
  decals(D, rng(726), { area: [-12, 12, -3, 5], list: [['moss', 6, [1.4, 3]], ['stain', 3, [1.2, 2.2]], ['crack', 2, [1.4, 2.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'wild', { area: [-14, 14, 5.4, 6.4], n: 8, clear: 7 });
  await dress(D, rng(944), { area: [-16, 16, -9, 4], items: [['img:rg_willow', 2, [6, 8]], ['img:rg_well', 1, [2.4, 2.8]], ['wooden_bucket_01', 2, [.55, .7]], ['wine_barrel_01', 2, [1, 1.2]], ['painted_wooden_bench', 1, [.9, 1]], ['wooden_stool_01', 2, [.5, .6]]] });   // real CC0 models placed where they fit (kit.dress)
}
