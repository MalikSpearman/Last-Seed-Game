// The Landlord's Corridor: the open walkway of an old two-storey apartment block at dusk. Wet concrete, rows of numbered
// doors and frosted windows, a bank of rusty mailboxes stuffed with notices, potted plants, flickering tube lights, the
// upper walkway and its railing overhead, pipes and meters, and a warm sunset glowing down the length of the building.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, shojiMat, farPainting, scatter, clutter, drift, flurry, model, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.4], [-4, -1.6], [1.4, -2.2]], sum: [-5.2, .8], exposure: 1.45 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(521);
  S.fog = new T.Fog(0x5a3420, 22, 90); S.background = new T.Color(0x2a1810);
  D.moonlight({ color: 0xffa060, intensity: 2.4, dir: [.9, .5, .3], ambient: 0x7a4a30, ambientI: 2, sky: 0xffb080, ground: 0x5a3a28 });
  const M = { floor: pbr('concrete_pavers', [8, 3], { nmap: 'asphalt_02', rmap: 'asphalt_02', color: 0xb09080, rough: .2, metal: .2 }), wall: pbr('castle_wall_slates', [6, 2], { color: 0xb8a890 }),
    door: pbr('weathered_planks', [1, 1], { color: 0x8a5038 }), rust: pbr('rusty_metal_02', [1, 1], { color: 0xa08070, metal: .5, rough: .6 }), steel: pbr('metal_plate', [1, 1], { color: 0x7a7480, metal: .6, rough: .5 }),
    tube: new T.MeshBasicMaterial({ color: 0xe8fff0 }), pot: new T.MeshStandardMaterial({ color: 0x9a5030, roughness: .8 }), paper: new T.MeshStandardMaterial({ color: 0xf0ece0, roughness: .9 }) };
  { const f = new T.Mesh(new T.PlaneGeometry(60, 12), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -1); f.receiveShadow = true; S.add(f); }
  // ── the building face: doors and frosted windows in a row, with the upper walkway above ──
  box(60, 9, .5, M.wall, 0, 0, -6.4);
  for (let x = -26, i = 0; x < 27; x += 6, i++) { box(1.6, 3, .14, M.door, x, 0, -6.1); add(new T.PlaneGeometry(.6, .26), new T.MeshBasicMaterial({ color: 0xf0e8d0 }), x, 3.3, -6.02, { cast: false });
    const w = shojiMat(i + 2, [1, 1], { lit: .8, frame: '#4a3a2a' }); add(new T.PlaneGeometry(2.2, 1.4), w, x + 2.4, 1.9, -6.12, { cast: false });
    box(.9, .5, .2, M.steel, x - 1.4, 1.6, -6.1); }   // meter box beside each door
  box(60, .4, 3, M.wall, 0, 4.4, -5); box(60, .14, .14, M.rust, 0, 5.8, -3.6, { cast: false }); box(60, .1, .1, M.rust, 0, 5.2, -3.6, { cast: false });
  for (let x = -29; x < 30; x += 1) box(.06, 1, .06, M.rust, x, 4.8, -3.6, { cast: false });
  for (let x = -24; x < 26; x += 8) box(.3, 4.4, .3, M.steel, x, 0, -3.7);
  for (let x = -26; x < 27; x += 6) box(1.6, 3, .14, M.door, x, 4.8, -6.1);
  // tube lights under the walkway, a couple of them flickering
  const tubes = []; for (let x = -22; x < 24; x += 9) { box(1.6, .1, .14, M.tube, x, 4.15, -5, { cast: false }); D.lantern(x, 3.9, -4.6, { color: 0xe0fff0, intensity: 10, distance: 8, glow: .8 }); tubes.push(x); }
  // ── the mailbox bank stuffed with notices, pipes, potted plants ──
  { const mx = -11; box(4, 2.6, .8, M.rust, mx, .6, -5.9); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { box(.9, .7, .05, M.steel, mx - 1.4 + c * .95, 1 + r * .8, -5.48, { cast: false }); if (R() < .6) add(new T.PlaneGeometry(.5, .3), M.paper, mx - 1.4 + c * .95, 1.5 + r * .8, -5.44, { cast: false, rz: R.r(-.3, .3) }); } }
  for (const x of [-20, 6, 18]) add(new T.CylinderGeometry(.09, .09, 9, 8), M.rust, x, 4.5, -6.1);
  for (const [x, z] of [[-6, -5.4], [-5.2, -5.6], [9, -5.4], [16, -5.5]]) { add(new T.CylinderGeometry(.4, .3, .7, 12), M.pot, x, .35, z); await prop('ferns', x, z, R.r(1.2, 1.8), { y: .6, blob: false }); }
  model(D, 'trashbag', 12.6, 0, -5.2, { h: .9 }); model(D, 'trashbag', 13.3, 0, -5.4, { h: .75, ry: 1.4 }); model(D, 'metal_trash_can', -16, 0, -5.3, { h: 1.3 }); model(D, 'utility_box_01', 3.4, 0, -5.7, { h: 1.5 });
  model(D, 'wooden_bucket_01', -7.2, 0, -5.2, { h: .6 }); model(D, 'cardboard_box_01', 14.2, 0, -5.1, { s: 1.7, ry: .4 });
  // ── the sunset at the end of the walkway, notices blowing, dust in the light ──
  D.glow(30, 3, -2, 20, 0xffa050); D.lantern(26, 3, -2, { color: 0xffa050, intensity: 30, distance: 30, glow: 0 });
  flurry(D, R, 10, { area: [-14, 14, -1, -5], y0: 0, y1: 4, speed: .6 });
  drift(D, 40, 0, -2, 16, 3, 0xffd0a0, { y0: .5, y1: 5, size: 5 });
  scatter(D, rng(113), { area: [-14, 14, -4, 5], puddles: 6, pebbles: 30, stone: 0x6a5a50, leaves: 30, leaf: 0x8a6a3a });
  decals(D, rng(775), { area: [-14, 14, -4, 5], list: [['oil', 2, [.9, 1.6]], ['stain', 3, [1.2, 2.2]], ['crack', 3, [1.4, 2.6]], ['paper', 2, [.9, 1.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await clutter(D, K, rng(114), 'city', { area: [-26, 26, -5.4, -4.2], n: 10, clear: 6 });
  await dress(D, rng(1153), { area: [-16, 16, -9, 4], items: [['img:rg_bicycle', 2, [1.1, 1.2]], ['img:rg_scooter', 1, [1.2, 1.3]], ['img:rg_vending', 1, [2.2, 2.4]], ['wooden_stool_01', 1, [.5, .6]], ['cardboard_box_01', 2, { s: [1.5, 2] }], ['plastic_crate_01', 1, { s: [2, 2.4] }]] });   // real CC0 models placed where they fit (kit.dress)
}
