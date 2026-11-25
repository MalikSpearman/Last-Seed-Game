// Renovation Site: a gutted floor of a building mid-demolition at night. Cracked concrete slab with rebar sticking out,
// the outer wall smashed open onto the city and moon, steel columns, scaffolding wrapped in torn plastic sheeting that
// billows, hazard tape, work lamps on tripods throwing hard light, rubble heaps, cable reels and a toolbox.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, farPainting, scatter, drift, skyline, flurry, model, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -2.4]], sum: [-5.2, .8], exposure: 1.5 };
const tape = () => cvs(256, 32, (g, W, H) => { g.fillStyle = '#f0c020'; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; for (let x = -32; x < W; x += 32) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 16, H); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0); g.fill(); } });

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(621);
  S.fog = new T.Fog(0x2a2438, 24, 120); S.background = new T.Color(0x141220);
  D.moonlight({ color: 0xa8b0ff, intensity: 1.6, dir: [-.3, 1, -.6], ambient: 0x4a4060, ambientI: 2, sky: 0x7a70b0, ground: 0x3a3028 });
  const M = { slab: pbr('concrete_pavers', [6, 3], { nmap: 'asphalt_02', rmap: 'asphalt_02', color: 0xa09088, rough: .5 }), wall: pbr('castle_wall_slates', [4, 2], { color: 0xb0a090 }), steel: pbr('rusty_metal_02', [1, 3], { color: 0x8a6a5a, metal: .6, rough: .5 }),
    scaf: pbr('metal_plate', [1, 1], { color: 0xb0b0b8, metal: .7, rough: .4 }), rub: pbr('rock_face', [1, 1], { color: 0x9a9088 }), rebar: new T.MeshStandardMaterial({ color: 0x6a3a2a, metalness: .7, roughness: .6 }),
    sheet: new T.MeshStandardMaterial({ color: 0xe8f0ff, transparent: true, opacity: .45, side: T.DoubleSide, roughness: .2, depthWrite: false }), tape: new T.MeshBasicMaterial({ map: ctex(tape(), [6, 1]), side: T.DoubleSide }),
    lamp: new T.MeshBasicMaterial({ color: 0xfff4d0 }), black: new T.MeshStandardMaterial({ color: 0x1a1a1e }), yellow: new T.MeshStandardMaterial({ color: 0xe0b020, roughness: .5 }) };
  box(36, 1, 14, M.slab, 0, -1, 0); for (let i = 0; i < 14; i++) add(new T.CylinderGeometry(.04, .04, R.r(.6, 1.6), 5), M.rebar, R.r(-16, 16), .3, R.r(-6, -4.4), { rz: R.r(-.6, .6), rx: R.r(-.4, .4), cast: false });
  // ── the broken outer wall: chunks remain at the sides, the middle smashed open to the city ──
  for (const [x, w, h] of [[-14, 8, 9], [14, 7, 9], [-4, 4, 3], [5, 3, 2]]) { box(w, h, .8, M.wall, x, 0, -7); }
  box(36, 1, .8, M.wall, 0, 8, -7); for (const x of [-10, -2, 6, 12]) box(.8, 9, .8, M.steel, x, 0, -6.2);
  // ── scaffolding wrapped in torn plastic that billows ──
  const scaf = (x, z, w, h) => { for (const dx of [-w / 2, w / 2]) for (const dz of [-.8, .8]) box(.14, h, .14, M.scaf, x + dx, 0, z + dz); for (let y = 2; y < h; y += 2.2) { box(w, .1, .1, M.scaf, x, y, z - .8, { cast: false }); box(w, .1, .1, M.scaf, x, y, z + .8, { cast: false }); box(w, .06, 1.6, M.black, x, y, z, { cast: false }); } };
  scaf(-12, -5, 5, 8); scaf(13, -5, 4, 8);
  for (const [x, z, w] of [[-12, -4.1, 5], [13, -4.1, 4], [-1, -6.4, 6]]) { const sh = add(new T.PlaneGeometry(w, 7, 8, 8), M.sheet, x, 3.6, z, { cast: false }); const p = sh.geometry.attributes.position, base = p.array.slice();
    D.updaters.push(t => { for (let i = 0; i < p.count; i++) { const px = base[i * 3], py = base[i * 3 + 1]; p.setZ(i, Math.sin(t * 1.6 + px * .9 + py * .4) * .35 * (1 - (py + 3.5) / 7)); } p.needsUpdate = true; }); }
  // ── hazard tape strung between the columns ──
  for (const [a, b] of [[-10, -2], [6, 12]]) { const L = b - a; add(new T.PlaneGeometry(L, .14), M.tape, (a + b) / 2, 1.1, -6.15, { cast: false }); add(new T.PlaneGeometry(L, .14), M.tape, (a + b) / 2, 1.8, -6.15, { cast: false, rz: .05 }); }
  // ── work lamps on tripods ──
  for (const [x, z, ry] of [[-15, -3, .6], [15.5, -2.6, -.6], [2, -5.4, 0]]) { for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; add(new T.CylinderGeometry(.03, .03, 2.6, 4), M.black, x + Math.cos(a) * .4, 1.2, z + Math.sin(a) * .4, { rz: Math.cos(a) * .2, rx: -Math.sin(a) * .2, cast: false }); }
    const h = box(.8, .6, .3, M.yellow, x, 2.4, z, { ry }); add(new T.PlaneGeometry(.6, .4), M.lamp, x + Math.sin(ry) * .16, 2.7, z + Math.cos(ry) * .16, { ry, cast: false }); D.glow(x, 2.7, z + .4, 3, 0xfff0c0); D.lantern(x, 2.7, z + 1, { color: 0xfff0d0, intensity: 30, distance: 14, glow: 0 }); }
  // ── rubble heaps, a cable reel, a toolbox ──
  for (const [cx, cz, n] of [[-8, -5, 10], [9, -5.2, 8], [-2, -5.6, 6]]) for (let i = 0; i < n; i++) { const r = add(new T.DodecahedronGeometry(R.r(.2, .8), 0), M.rub, cx + R.r(-1.6, 1.6), R.r(0, .6), cz + R.r(-.8, .8), { ry: R() * 6 }); }
  { const g = new T.Group(); g.position.set(-11, .7, -2.4); g.rotation.y = .4; S.add(g); for (const dz of [-.4, .4]) K.add(new T.CylinderGeometry(.7, .7, .08, 18), new T.MeshStandardMaterial({ color: 0x8a5a2a }), 0, 0, dz, { to: g, rx: Math.PI / 2 }); K.add(new T.CylinderGeometry(.45, .45, .8, 14), new T.MeshStandardMaterial({ color: 0xe04a2a }), 0, 0, 0, { to: g, rx: Math.PI / 2 }); }
  box(1, .45, .5, new T.MeshStandardMaterial({ color: 0xc02a2a, metalness: .4, roughness: .4 }), 11, 0, -2.6, { ry: -.3 });
  // real site gear (Poly Haven): cement bags, a generator, a ladder against the scaffold, crates
  for (const [x, y, z, ry] of [[-13, 0, -1.4, .2], [-12.6, .26, -1.3, .5], [-13.3, 0, -.5, -.3]]) model(D, 'cement_bag', x, y, z, { s: 1.4, ry });
  model(D, 'portable_generator', 12.8, 0, -1.2, { s: 1.6, ry: -.7 }); model(D, 'ladder_sectioned_01', -16.4, 0, -4.4, { h: 3.4, rx: -.18, ry: .3 }); model(D, 'plastic_crate_01', 9.6, 0, -3.4, { s: 2.2, ry: .4 });
  // ── the city through the hole ──
  skyline(K, D, R, { zNear: -24, zFar: -120, n: 40, spread: 80, spire: false }); farPainting(D, 'reno', { v0: .05, v1: .5, z: -144 });
  flurry(D, R, 14, { area: [-14, 14, -1, -6], y0: 0, y1: 6, color: 0xd8d0c0, speed: .5 }); drift(D, 60, 0, -3, 16, 4, 0xe0d8c0, { y0: .2, y1: 6, size: 5 });
  scatter(D, rng(123), { area: [-16, 16, -4, 6], pebbles: 160, stone: 0x8a8078, puddles: 4 });
  decals(D, rng(817), { area: [-16, 16, -4, 6], list: [['crack', 6, [1.6, 3]], ['stain', 4, [1.2, 2.4]], ['paper', 2, [.9, 1.4]], ['oil', 2, [1, 1.6]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1142), { area: [-16, 16, -9, 4], items: [['img:rg_kei', 1, [2.3, 2.6]], ['concrete_road_barrier', 2, [.85, .95]], ['cement_bag', 3, { s: [1.3, 1.5] }], ['plastic_crate_01', 2, { s: [2, 2.6] }], ['cardboard_box_01', 2, { s: [1.5, 2] }]] });   // real CC0 models placed where they fit (kit.dress)
}
