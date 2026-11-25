// The Canteen Kitchen (oba) and the kitchen gone toxic (oba2). A big school canteen kitchen at sunset: tiled floor,
// stainless counters and the serving line with trays of food, giant stock pots steaming on the ranges, the extractor
// hood, hanging ladles and pans, fridges, windows with cherry trees. Phase two: the pots boil over with glowing green
// sludge that drips and pools, toxic green steam rolls, the lights spark and swing, a pot lies tipped on the floor.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, farPainting, viewMat, scatter, drift, model, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -2.4]], sum: [-5.2, .8], exposure: 1.45 };
const tiles = () => { const R = rng(4); return cvs(512, 512, (g, W, H) => { g.fillStyle = '#7a7480'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { g.fillStyle = `hsl(30,${R.r(4, 12)}%,${R.r(48, 60)}%)`; g.fillRect(x + 2, y + 2, 60, 60); } }); };

export async function build(D, phase = 1) {
  const toxic = phase === 2, K = kit(D), { S, add, box, prop } = K, R = rng(toxic ? 662 : 661);
  S.fog = new T.Fog(toxic ? 0x2a3a20 : 0x5a4030, 22, 90); S.background = new T.Color(toxic ? 0x141a10 : 0x2a1a14);
  D.moonlight(toxic ? { color: 0xb0ffa0, intensity: 1.4, dir: [-.5, .8, .4], ambient: 0x3a5a2a, ambientI: 2, sky: 0x8ad070, ground: 0x2a3a1a } : { color: 0xffc090, intensity: 2.4, dir: [-.8, .6, .4], ambient: 0x8a6a50, ambientI: 2.2, sky: 0xffd8b0, ground: 0x6a5040 });
  const M = { floor: new T.MeshStandardMaterial({ map: ctex(tiles(), [10, 4]), roughness: .12, metalness: .25, color: toxic ? 0x9aa890 : 0xffffff }), steel: new T.MeshStandardMaterial({ color: 0xd0d4dc, metalness: .85, roughness: .25 }),
    wall: pbr('worn_planks', [4, 1], { color: toxic ? 0x6a7a60 : 0xc8b8a0 }), pot: new T.MeshStandardMaterial({ color: 0xb8bcc4, metalness: .9, roughness: .3 }), black: new T.MeshStandardMaterial({ color: 0x2a2a30 }),
    food: new T.MeshStandardMaterial({ color: 0xd89a40, roughness: .7 }), sludge: new T.MeshStandardMaterial({ color: 0x8aff40, emissive: 0x50c020, emissiveIntensity: 1.4, roughness: .2 }),
    tube: new T.MeshBasicMaterial({ color: toxic ? 0xc0ffb0 : 0xfff8e0 }), win: new T.MeshBasicMaterial({ color: toxic ? 0x6a8a60 : 0xffc090 }) };
  { const f = new T.Mesh(new T.PlaneGeometry(40, 24), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -6); f.receiveShadow = true; S.add(f); }
  box(40, 10, .4, M.wall, 0, 0, -16); box(.4, 10, 24, M.wall, -20, 0, -6); box(.4, 10, 24, M.wall, 20, 0, -6); box(40, .4, 24, M.wall, 0, 9.6, -6, { cast: false });
  for (let z = -12; z <= 0; z += 4) for (let x = -14; x <= 14; x += 7) { const tb = box(3, .12, .3, M.tube, x, 9.3, z, { cast: false }); D.glow(x, 9.1, z, 2.6, toxic ? 0xc0ffa0 : 0xfff0c0); if (x === 0) D.lantern(x, 8.8, z, { color: toxic ? 0xa0ff80 : 0xfff0d0, intensity: 14, distance: 14, glow: 0 }); }
  // ── windows down the left, cherry trees outside ──
  for (let z = -13, wi = 0; z < 0; z += 4.4, wi++) { add(new T.PlaneGeometry(3.6, 3.6), viewMat('sky_school', { u0: .1 + wi * .28, u1: .1 + wi * .28 + .42, v0: .3, v1: .93, tint: toxic ? 0x9ad080 : 0xfff2e0 }), -19.7, 5, z, { ry: Math.PI / 2, cast: false }); box(.3, .2, 3.8, M.steel, -19.6, 3.2, z); }
  for (let i = 0; i < 3; i++) await prop('sakura', -23, -12 + i * 5, 8, { tint: toxic ? 0x8aa070 : 0xffffff, blob: false });
  // ── the back line: ranges with giant stock pots, the extractor hood, utensils, fridges ──
  box(22, 1.2, 2.4, M.steel, 2, 0, -14); box(24, 2.4, 3.4, M.steel, 2, 6.6, -14.2); box(20, .2, 2.8, M.black, 2, 6.5, -14, { cast: false });
  const pots = []; for (const x of [-5, 0, 5, 10]) { add(new T.CylinderGeometry(1.2, 1.1, 1.8, 20), M.pot, x, 2.1, -14); add(new T.TorusGeometry(1.2, .08, 6, 24), M.pot, x, 3, -14, { rx: Math.PI / 2 }); pots.push(x);
    if (toxic) { const s = add(new T.CylinderGeometry(1.15, 1.15, .2, 20), M.sludge, x, 3.02, -14, { cast: false }); for (let k = 0; k < 4; k++) { const d = add(new T.CylinderGeometry(.08, .03, R.r(.6, 1.8), 6), M.sludge, x + Math.cos(k * 1.7) * 1.15, 2.4, -14 + Math.sin(k * 1.7) * 1.15 + .3, { cast: false }); } D.glow(x, 3.2, -13.6, 3.2, 0x80ff40); D.lantern(x, 3.4, -13, { color: 0x80ff40, intensity: 10, distance: 8, glow: 0 }); } }
  for (let k = 0; k < 10; k++) { const x = -8 + k * 2.2; add(new T.CylinderGeometry(.02, .02, 1.2, 4), M.steel, x, 5, -12.6, { cast: false }); add(new T.SphereGeometry(.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.steel, x, 4.4, -12.6, { rx: Math.PI }); }
  for (const x of [15, 17.6]) { box(2.4, 6.4, 2, M.steel, x, 0, -14.6); box(.1, 2, .1, M.black, x - 1, 3, -13.5); }
  // steam (or toxic fumes) rising off the pots
  { const sm = new T.SpriteMaterial({ color: toxic ? 0x7ad040 : 0xf0f0f0, transparent: true, opacity: toxic ? .35 : .2, depthWrite: false }), L = []; for (const x of pots) for (let k = 0; k < 6; k++) { const s = new T.Sprite(sm); S.add(s); L.push([s, x, k / 6]); }
    D.updaters.push(t => { for (const [s, x, ph] of L) { const u = (t * .2 + ph) % 1; s.position.set(x + Math.sin(t + ph * 6) * .4, 3.2 + u * (toxic ? 7 : 4), -14 + u); s.scale.setScalar(1 + u * (toxic ? 5 : 3)); } }); }
  // ── the serving line in front of the ranges: counter, sneeze-guard glass, trays of food, stacks of trays ──
  box(16, 1.1, 1.6, M.steel, 2, 0, -9.4); add(new T.PlaneGeometry(16, 1), new T.MeshStandardMaterial({ color: 0xd0e8ff, transparent: true, opacity: .25, metalness: .9, roughness: .05 }), 2, 1.9, -8.8, { rx: -.3, cast: false });
  for (let k = 0; k < 6; k++) { box(2, .2, 1, M.steel, -3 + k * 2.4, 1.1, -9.4); box(1.8, .14, .8, toxic && k % 2 ? M.sludge : M.food, -3 + k * 2.4, 1.24, -9.4, { cast: false }); }
  for (const [x, z, s] of [[7.2, -9.3, 2.6], [8.6, -9.5, 2.2]]) model(D, 'pot_enamel_01', x, 1.2, z, { s, ry: x });
  model(D, 'WetFloorSign_01', -6, 0, -4.6, { h: 1, ry: .6 });
  for (let k = 0; k < 8; k++) box(1.2, .06, .9, new T.MeshStandardMaterial({ color: 0x6a8ab0 }), -10, 1.1 + k * .07, -9.4, { cast: false });
  if (toxic) { // the tipped pot and the spreading green pools; a swinging light
    const tp = add(new T.CylinderGeometry(1, .9, 1.6, 18, 1, true), M.pot, 13, .9, -3, { rz: Math.PI / 2 - .2, ry: .5 }); for (const [x, z, r] of [[11, -2.4, 1.8], [-6, -10.6, 1.4], [3, -11, 2.2], [8, -4, 1]]) { const p = add(new T.CircleGeometry(r, 20), M.sludge, x, .02, z, { rx: -Math.PI / 2, cast: false }); D.glow(x, .1, z, r * 1.6, 0x80ff40); }
    drift(D, 80, 2, -10, 14, 6, 0xa0ff60, { y0: 0, y1: 8, size: 10 });
  } else { drift(D, 30, 2, -12, 10, 2, 0xffffff, { y0: 3, y1: 8, size: 8 }); }
  scatter(D, rng(127), { area: [-14, 14, -4, 6], puddles: toxic ? 6 : 3, pebbles: 20, stone: 0xd8a050 });
  decals(D, rng(677), { area: [-14, 14, -4, 6], list: [['stain', 4, [1, 2]], ['oil', 2, [.8, 1.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1219), { area: [-16, 16, -9, 4], items: [['plastic_crate_01', 2, { s: [2, 2.4] }], ['cardboard_box_01', 2, { s: [1.5, 2] }], ['wooden_stool_01', 1, [.5, .6]]] });   // real CC0 models placed where they fit (kit.dress)
}
