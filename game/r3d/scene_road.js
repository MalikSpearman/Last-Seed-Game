// Sunset Road: the festival road at dusk. A wet flagstone road lined with cherry trees and lanterns on wooden posts
// with crest banners, a carved stone marker, a canal running alongside behind a stone embankment, a red arched bridge
// over it to a lit townhouse, the road winding off past fields and lanterns toward the colosseum glowing on the
// horizon, mountains under a pink and violet sunset, petals everywhere.
import { T } from './diorama.js';
import { kit, rng, sky, pbr, ctex, cvs, bannerTex, water, pagoda, farPainting, scatter, clutter, walkers, drift, hills, groundFill, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2], [-4.4, -2.4], [1.6, -3.4]], sum: [-5.6, .8], exposure: 1.4 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(741);
  S.fog = new T.Fog(0x8a5a7a, 34, 170); S.background = new T.Color(0x5a3a6a);
  D.moonlight({ color: 0xffb080, intensity: 2.6, dir: [.2, .5, -1], ambient: 0x7a5a8a, ambientI: 2.2, sky: 0xffb0c0, ground: 0x5a4a50 });
  sky(D, [[0, '#2a2a5a'], [.4, '#7a4a8a'], [.72, '#ff8a8a'], [.9, '#ffc080'], [1, '#ffe0b0']], { stars: 30 });
  const M = { road: pbr('rock_tile_floor', [4, 18], { color: 0xc8a8b0, rough: .3, metal: .12, ns: 1.3 }), verge: pbr('coast_sand_rocks_02', [20, 20], { color: 0x8a7a70 }), stone: pbr('castle_wall_slates', [8, 1], { color: 0xb8a8a8 }),
    post: pbr('japanese_cedar_planks', [.3, 1], { color: 0x8a3a28, rough: .5 }), lamp: new T.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffa040, emissiveIntensity: 2 }), red: pbr('japanese_cedar_planks', [.3, 2], { color: 0xc03838, rough: .4 }),
    marker: pbr('mossy_rock', [.6, 1], { color: 0xd8d0c8 }), roof: pbr('roof_tiles_14', [3, 3], { color: 0x8a80a0 }), field: new T.MeshStandardMaterial({ color: 0x4a5a3a, roughness: .9 }), hill: new T.MeshStandardMaterial({ color: 0x5a4a7a, roughness: 1 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#3a2a6a', '#24183a'], trim: '#e3b552', sd: 101, emblem: (g, cx, cy) => { g.strokeStyle = '#f0c766'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, 54, 0, 7); g.stroke(); g.fillStyle = '#f0c766'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 16 : 40; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); } })), side: T.DoubleSide, alphaTest: .4 }) };
  // ── the road: a wide flagstone band curving away left, verges either side ──
  groundFill(D, M.verge, { y: -.03, z0: 30, z1: -180 });
  { const pts = [[0, 10], [0, -6], [-2, -20], [-7, -36], [-14, -56], [-20, -80], [-24, -110]], g = new T.Group(); S.add(g);
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), ry = -Math.atan2(bz - az, bx - ax) + Math.PI / 2, w = 26 - i * 3;
      const m = new T.Mesh(new T.PlaneGeometry(w, L + .5), M.road); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set((ax + bx) / 2, .01 + i * .001, (az + bz) / 2); m.receiveShadow = true; g.add(m); } }
  // ── lanterns on wooden posts with crest banners, down the left side and on into the distance ──
  const lp = (x, z, s = 1, banner = false) => { box(.26 * s, 4.4 * s, .26 * s, M.post, x, 0, z); box(1.4 * s, .16 * s, .16 * s, M.post, x + .6 * s, 4.2 * s, z, { cast: false });
    const l = add(new T.CylinderGeometry(.34 * s, .34 * s, .7 * s, 12), M.lamp, x + 1 * s, 3.5 * s, z, { cast: false }); D.lantern(x + 1 * s, 3.5 * s, z + .2, { intensity: 14 * s, distance: 10 * s, glow: 1.1 * s });
    if (banner) { const b = new T.Mesh(new T.PlaneGeometry(.9, 2.2), M.ban); b.position.set(x - .1, 3.2 * s, z + .2); S.add(b); D.updaters.push(t => { b.rotation.y = Math.sin(t * .9 + z) * .14; }); } };
  lp(-11, -2, 1.2, true); lp(-9, -10, 1, false); lp(-8.6, -18, 1, true); lp(-11, -28, .9); lp(-15, -40, .9); lp(-19, -54, .8); lp(-23, -70, .8); lp(-26, -86, .7);
  for (const [x, z] of [[8, -6], [5, -16], [3, -28], [-2, -46], [-6, -62], [-10, -80]]) { D.glow(x, 2, z, 1.4, 0xffb060); box(.16, 2, .16, M.post, x, 0, z, { cast: false }); }
  // ── the carved stone marker at the near left ──
  { const m = box(1.2, 2.8, .6, M.marker, -13, 0, 1.4, { ry: .3 }); add(new T.SphereGeometry(.62, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.marker, -13, 2.8, 1.4, { ry: .3 }).scale.set(1, .4, .5); box(1.8, .5, 1, M.marker, -13, 0, 1.4, { ry: .3 }); }
  for (let i = 0; i < 6; i++) { const r = add(new T.DodecahedronGeometry(R.r(.5, 1.2), 1), M.marker, R.r(-15, -10), .1, R.r(-1, 5)); r.scale.y = .6; }
  // ── the canal on the right behind its embankment, the red arched bridge, the townhouse beyond ──
  { box(80, 1.4, 1, M.stone, 16, -1.2, -8, { ry: -.35 }); const w = water(D, 22, -18, 12, 90, 0x3a3a6a, { y: -.9, sky: ['#ff9a8a', '#4a3a7a'], flow: [.0, .02], scale: 4 }); w.rotation.z = -.35;
    const N = 18, x0 = 9, x1 = 20, z = -12; for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, a = x0 + (x1 - x0) * u0, b = x0 + (x1 - x0) * u1, ya = Math.sin(Math.PI * u0) * 2.2, yb = Math.sin(Math.PI * u1) * 2.2, L = Math.hypot(b - a, yb - ya), rz = Math.atan2(yb - ya, b - a);
      add(new T.BoxGeometry(L * 1.05, .14, 2.2), M.red, (a + b) / 2, (ya + yb) / 2, z, { rz, ry: -.35 }); for (const s of [-1, 1]) add(new T.BoxGeometry(L * 1.05, .1, .1), M.red, (a + b) / 2 - s * .37, (ya + yb) / 2 + 1, z + s * 1.04, { rz, ry: -.35 }); }
    for (const [x, zz] of [[9.4, -12.2], [19.6, -8.5]]) for (const s of [-1, 1]) { box(.16, 1.3, .16, M.red, x + s * .37, 0, zz + s * 1); add(new T.SphereGeometry(.12, 8, 6), new T.MeshStandardMaterial({ color: 0xd9a441, metalness: .6, roughness: .35 }), x + s * .37, 1.4, zz + s * 1); }
    pagoda(K, D, 24, -4, { w: 8, d: 6, h: 3.6, tiers: 2, y: 0, roof: M.roof, beam: M.post, sd: 4 }); pagoda(K, D, 28, -18, { w: 6, d: 5, h: 3, tiers: 1, y: 0, roof: M.roof, sd: 7 }); }
  // ── cherry trees framing the road, more along it ──
  for (const [x, z, h] of [[-15, -5, 11], [-12, -12, 9], [14, 2, 10], [-17, -24, 9], [11, -24, 8], [-22, -40, 8], [7, -40, 7], [-27, -56, 7]]) await prop('sakura', x, z, h, { flip: R() < .5, sway: .01, blobW: .3 });
  // ── the distance: fields and village roofs, the colosseum glowing, mountains, the sun going down ──
  for (let i = 0; i < 10; i++) { const f = add(new T.PlaneGeometry(R.r(10, 20), R.r(6, 10)), M.field, R.r(-60, 40), .02, R.r(-60, -110), { rx: -Math.PI / 2, cast: false }); f.rotation.z = R.r(-.3, .3); }
  for (let i = 0; i < 16; i++) pagoda(K, D, R.r(-70, 30), R.r(-70, -110), { w: R.r(3, 6), d: R.r(3, 5), h: R.r(1.6, 2.6), tiers: 1, y: 0, roof: M.roof, sd: i, lamp: false });
  { const col = new T.Mesh(new T.CylinderGeometry(14, 16, 8, 40, 1, true), new T.MeshStandardMaterial({ color: 0x8a7090, emissive: 0xffa050, emissiveIntensity: .5, side: T.DoubleSide })); col.position.set(-10, 4, -140); S.add(col); D.glow(-10, 8, -128, 30, 0xffa050); }
  hills(K, [[-80, -150, 50, 22], [-20, -160, 40, 16], [40, -155, 50, 24], [90, -150, 40, 18]], M.hill);
  { const sun = new T.Mesh(new T.CircleGeometry(9, 32), new T.MeshBasicMaterial({ color: 0xffe8b0, fog: false })); sun.position.set(-6, 10, -149); S.add(sun); D.glow(-6, 12, -147, 90, 0xff9a70); }
  farPainting(D, 'road', { v1: .4, z: -146 });
  // ── life: travellers on the road, petals on the wind ──
  walkers(D, R, { z: -16, x0: -14, x1: 6, every: [4, 9], group: 2, rim: '#ffb080', zJit: 2 });
  D.petals(260, -2, -6, 16); D.petals(120, -10, -30, 14); drift(D, 40, 0, -10, 20, 14, 0xffd0a0, { y0: .5, y1: 6, size: 6 });
  scatter(D, rng(143), { area: [-14, 14, -4, 7], puddles: 8, petals: 380, pebbles: 40, stone: 0x8a7a80, tufts: 30, tuft: 0x6a8a4a });
  decals(D, rng(691), { area: [-14, 14, -4, 7], list: [['moss', 4, [1.4, 2.6]], ['crack', 3, [1.4, 2.6]], ['stain', 3, [1.2, 2.2]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await clutter(D, K, rng(144), 'shrine', { area: [-16, -10, -2, -16], n: 6, clear: 0 });
  await dress(D, rng(1021), { area: [-16, 16, -9, 4], items: [['img:rg_yatai', 1, [3, 3.4]], ['img:rg_taiko', 1, [1.6, 1.9]], ['img:rg_willow', 1, [6, 7.5]], ['painted_wooden_bench', 2, [.9, 1]], ['wine_barrel_01', 1, [1, 1.2]], ['wooden_bucket_01', 1, [.55, .7]]] });   // real CC0 models placed where they fit (kit.dress)
}
