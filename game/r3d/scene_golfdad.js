// Golf Dad's Course (golfdad) and the thunderstorm round (golfdad2). A sunset golf course: a flagstone terrace with
// flower urns and lanterns, the fairway rolling away to a green with its flag, sand bunkers and a pond with a little
// waterfall, the clubhouse lit up on the hill among cypresses, golf carts parked, blossom trees, mountains at sunset.
// Phase two: night thunderstorm, rain lashing, lightning striking the flag, the cart flipped on its side, puddles.
import { T } from './diorama.js';
import { kit, rng, sky, pbr, ctex, cvs, water, stoneLantern, pagoda, farPainting, scatter, drift, lightning, rain, hills, groundFill, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.35 };
const grass = (night) => { const R = rng(3); return cvs(256, 256, (g, W, H) => { g.fillStyle = night ? '#1a3a20' : '#4a8a3a'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,200' : '0,40,0'},${R.r(.03, .1)})`; g.fillRect(R() * W, R() * H, 1, 3); }
  for (let x = 0; x < W; x += 64) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x, 0, 32, H); } }); };

export async function build(D, phase = 1) {
  const storm = phase === 2, K = kit(D), { S, add, box, prop } = K, R = rng(storm ? 722 : 721);
  S.fog = new T.Fog(storm ? 0x1a2030 : 0xe0a090, 40, 200); S.background = new T.Color(storm ? 0x0a0e18 : 0xc08080);
  D.moonlight(storm ? { color: 0x8090c0, intensity: 1.2, dir: [.2, 1, .3], ambient: 0x2a3050, ambientI: 1.8, sky: 0x4a5a8a, ground: 0x1a2a1a } : { color: 0xffc080, intensity: 3, dir: [-.3, .5, -1], ambient: 0x8a6a6a, ambientI: 2.2, sky: 0xffc0b0, ground: 0x5a7a3a });
  sky(D, storm ? [[0, '#04060e'], [.6, '#141a2e'], [1, '#2a2a3a']] : [[0, '#5a4a8a'], [.45, '#c070a0'], [.8, '#ffa070'], [1, '#ffe0a0']], { stars: 0 });
  const M = { terrace: pbr('rock_tile_floor', [4, 2], { color: storm ? 0x8a8a98 : 0xe0c8b8, rough: storm ? .2 : .6, metal: storm ? .15 : 0 }), grass: new T.MeshStandardMaterial({ map: ctex(grass(storm), [30, 30]), roughness: storm ? .5 : .95 }),
    green: new T.MeshStandardMaterial({ color: storm ? 0x2a5a30 : 0x6ab04a, roughness: .8 }), sand: pbr('coast_sand_rocks_02', [3, 3], { color: storm ? 0x8a8070 : 0xf0e0c0 }), stone: pbr('mossy_rock', [.5, .5], { color: 0xe0d8d0 }),
    urn: new T.MeshStandardMaterial({ color: 0xe8e0d8, roughness: .5 }), wall: new T.MeshStandardMaterial({ color: storm ? 0x8a8070 : 0xf0e0c8, roughness: .7 }), roof: pbr('roof_tiles_14', [4, 2], { color: 0x8a5a4a }),
    cypress: new T.MeshStandardMaterial({ color: storm ? 0x1a2a1e : 0x2a4a2a, roughness: .9, flatShading: true }), cart: new T.MeshStandardMaterial({ color: 0xf0f0f0, roughness: .4 }), flag: new T.MeshStandardMaterial({ color: 0xd02020, side: T.DoubleSide }), hill: new T.MeshStandardMaterial({ color: storm ? 0x1a2a3a : 0x6a5a8a, roughness: 1 }) };
  box(30, .4, 9, M.terrace, 0, -.4, 1.4);
  for (const s of [-1, 1]) { stoneLantern(D, K, s * 12.6, -2.6, 1.2, { mat: M.stone }); add(new T.CylinderGeometry(.8, .5, 1.2, 16), M.urn, s * 13.6, .6, 2.6); add(new T.CylinderGeometry(.5, .6, .5, 16), M.urn, s * 13.6, .25, 2.6);
    for (let k = 0; k < 8; k++) add(new T.SphereGeometry(.22, 8, 6), new T.MeshStandardMaterial({ color: [0xff70b0, 0xffffff, 0xff4080][k % 3] }), s * 13.6 + R.r(-.6, .6), 1.4 + R.r(0, .4), 2.6 + R.r(-.6, .6), { cast: false }); }
  // ── the course: rolling fairway, the green with its flag, bunkers, the pond and waterfall ──
  groundFill(D, M.grass, { y: -.5, z0: -3, z1: -200 });
  hills(K, [[-30, -40, 30, 3], [20, -55, 40, 4], [-10, -80, 50, 6]], M.grass);
  { const gr = add(new T.CircleGeometry(6, 32), M.green, 8, -.38, -30, { rx: -Math.PI / 2, cast: false }); gr.scale.y = .6; const fx = 9, fz = -30;
    add(new T.CylinderGeometry(.04, .04, 3.4, 6), M.urn, fx, 1.3, fz); const fl = add(new T.PlaneGeometry(1.2, .8, 4, 1), M.flag, fx + .6, 2.6, fz, { cast: false }); D.updaters.push(t => { const p = fl.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(t * (storm ? 9 : 4) + p.getX(i) * 4) * .1 * (p.getX(i) + .6)); p.needsUpdate = true; });
    if (storm) D.glow(fx, 2, fz, 6, 0xc0a0ff); }
  for (const [x, z, r] of [[-6, -18, 3], [14, -22, 2.4], [2, -36, 2]]) { const b = add(new T.CircleGeometry(r, 20), M.sand, x, -.37, z, { rx: -Math.PI / 2, cast: false }); b.scale.y = .55; }
  const pond = water(D, -12, -12, 14, 6, storm ? 0x1a2a40 : 0x3a6a9a, { y: -.42, sky: storm ? ['#4a5a8a', '#0a1020'] : ['#ffa070', '#6a5a9a'], rings: storm ? 14 : 0, scale: 3 });
  { for (let i = 0; i < 4; i++) add(new T.DodecahedronGeometry(R.r(.8, 1.4), 1), M.stone, -18 + R.r(-1, 1), 0, -14 + R.r(-1, 1)); const f = add(new T.PlaneGeometry(1, 1.6), new T.MeshBasicMaterial({ color: 0xd8eeff, transparent: true, opacity: .6 }), -17.2, .5, -13.2, { cast: false }); D.updaters.push(t => { f.material.opacity = .5 + Math.sin(t * 9) * .1; }); }
  // ── the clubhouse on the hill, cypresses, carts ──
  pagoda(K, D, -4, -70, { w: 24, d: 10, h: 5, tiers: 2, y: 3, wall: null, roof: M.roof, sd: 2 }); D.glow(-4, 7, -64, 20, 0xffc070);
  for (let i = 0; i < 14; i++) { const x = R.r(-40, 30), z = R.r(-55, -75), h = R.r(6, 11); add(new T.ConeGeometry(h * .16, h, 8), M.cypress, x, h / 2 + 2, z, { cast: false }); }
  const cart = (x, z, ry, flip) => { const g = new T.Group(); g.position.set(x, flip ? .6 : -.4, z); g.rotation.set(0, ry, flip ? Math.PI / 2 - .2 : 0); S.add(g); K.add(new T.BoxGeometry(2.2, .6, 1.3), M.cart, 0, .6, 0, { to: g }); K.add(new T.BoxGeometry(.1, 1.2, 1.3), M.cart, -.4, 1.4, 0, { to: g }); K.add(new T.BoxGeometry(1.6, .08, 1.4), M.cart, .2, 2, 0, { to: g });
    for (const [dx, dz] of [[-.7, -.6], [.7, -.6], [-.7, .6], [.7, .6]]) K.add(new T.CylinderGeometry(.26, .26, .2, 12), new T.MeshStandardMaterial({ color: 0x1a1a1a }), dx, .26, dz, { to: g, rx: Math.PI / 2 }); };
  if (storm) cart(14, -12, .6, true); else { cart(16, -40, .3); cart(18.6, -41, .3); }
  for (let i = 0; i < 6; i++) await prop('sakura', (R() < .5 ? -1 : 1) * R.r(14, 22), R.r(-4, -14), R.r(6, 9), { tint: storm ? 0x8090b0 : 0xffffff, flip: R() < .5, sway: storm ? .03 : .01 });
  if (storm) { lightning(D, R, { color: 0xc0b0ff, area: [-30, 30, -30, -70], every: [1.6, 4] }); rain(D, 1400, [-24, 24], [0, 20], [-30, 8], { speed: 18 }); farPainting(D, 'golfdad2', { v1: .45, z: -144 }); }
  else { const sun = new T.Mesh(new T.CircleGeometry(10, 32), new T.MeshBasicMaterial({ color: 0xfff0c0, fog: false })); sun.position.set(-20, 6, -139); S.add(sun); D.glow(-20, 8, -137, 80, 0xffa060); farPainting(D, 'golfdad', { v1: .5, z: -144 }); drift(D, 30, 0, -10, 20, 10, 0xffe0a0, { y0: .5, y1: 5, size: 5 }); }
  scatter(D, rng(133), { area: [-14, 14, -3, 6], puddles: storm ? 12 : 0, petals: storm ? 60 : 90, petal: 0xffb0d0, tufts: 20 });
  await dress(D, rng(1087), { area: [-16, 16, -9, 4], items: [['painted_wooden_bench', 1, [.9, 1]], ['tree_stump_01', 1, [.45, .6]], ['namaqualand_boulder_02', 1, [.6, 1.2]]] });   // real CC0 models placed where they fit (kit.dress)
}
