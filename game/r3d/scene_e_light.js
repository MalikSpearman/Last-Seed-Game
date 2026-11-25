// Lighthouse Point: a wet stone ledge on the rocky point under the lighthouse. Its lamp sweeps a real beam over the
// sea, the keeper's house and stair climb the cliff, a fish-drying rack, a wreck on the reef, red spider lilies,
// stone lanterns, and waves smashing on the rocks under a blood moon.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, ship, sea, breakers, stoneLantern, pagoda, scatter, clutter, farPainting, drift } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.6 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(321);
  S.fog = new T.Fog(0x3a1a44, 26, 140); S.background = new T.Color(0x22122e);
  D.moonlight({ color: 0xffa0b0, intensity: 2, dir: [.5, 1, -.5], ambient: 0x5a3070, ambientI: 2, sky: 0x9a5ab0, ground: 0x3a2a30 });
  sky(D, [[0, '#140a26'], [.5, '#4a1844'], [1, '#8a2a40']], { stars: 60 }); moon(D, 20, 50, -140, 26, [240, 70, 60], [220, 40, 70]);
  const M = { floor: pbr('rock_tile_floor', [4, 2], { color: 0xb8a0b0, rough: .3, metal: .15, ns: 1.2 }), stone: pbr('mossy_rock', [.5, .5], { color: 0xc8c0b8 }),
    rock: pbr('rock_face', [2, 2], { color: 0x6a5a70, ns: 2 }), tower: pbr('castle_wall_slates', [2, 4], { color: 0xd8d0c8 }), wood: pbr('weathered_planks', [.4, 1], { color: 0x8a6a60 }),
    roof: pbr('roof_tiles_14', [3, 3], { color: 0x8a80a0 }), red: new T.MeshStandardMaterial({ color: 0xb02030, roughness: .7, side: T.DoubleSide }), fish: new T.MeshStandardMaterial({ color: 0xc0c0d0, metalness: .6, roughness: .3 }),
    lily: new T.MeshStandardMaterial({ color: 0xff2a30, emissive: 0xa00a14, emissiveIntensity: .6 }), lamp: new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc060, emissiveIntensity: 3 }) };
  // ── the ledge: a slab of cracked stone, raised over the rocks ──
  box(30, 1.6, 10, M.floor, 0, -1.6, 1.4); for (let i = 0; i < 12; i++) { const r = add(new T.DodecahedronGeometry(R.r(1, 2.2), 1), M.rock, R.r(-15, 15), -1.2, R.r(-3.6, -5), { ry: R() * 6 }); r.scale.y = .6; }
  stoneLantern(D, K, -12.6, -2.8, 1.4, { mat: M.stone }); stoneLantern(D, K, 12.8, -2.6, 1.4, { mat: M.stone });
  sea(D, R, { z: -70, shore: -8, foam: 6 });
  // ── the point: a rocky hill on the left with the lighthouse, keeper's house and steps ──
  for (let i = 0; i < 14; i++) { const r = add(new T.DodecahedronGeometry(R.r(3, 7), 1), M.rock, R.r(-30, -12), R.r(-2, 6), R.r(-6, -26), { ry: R() * 6 }); r.scale.y = R.r(.8, 1.4); }
  const lx = -19, lz = -16, ly = 8;
  { add(new T.CylinderGeometry(2, 2.8, 12, 16), M.tower, lx, ly + 6, lz); add(new T.CylinderGeometry(2.4, 2.4, .5, 16), M.wood, lx, ly + 12.2, lz);
    add(new T.CylinderGeometry(1.5, 1.5, 2, 12, 1, true), M.lamp, lx, ly + 13.4, lz, { cast: false }); add(new T.ConeGeometry(2.2, 1.8, 12), M.roof, lx, ly + 15.3, lz);
    D.glow(lx, ly + 13.4, lz + 1.5, 6, 0xffd080); D.lantern(lx, ly + 13.4, lz + 2, { color: 0xffd080, intensity: 30, distance: 20, glow: 0 });
    // the sweeping beam: a long additive cone from the lamp, turning slowly
    const beam = new T.Mesh(new T.ConeGeometry(4, 60, 16, 1, true), new T.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: .12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    beam.geometry.translate(0, -30, 0); const piv = new T.Group(); piv.position.set(lx, ly + 13.4, lz); piv.add(beam); beam.rotation.z = Math.PI / 2; S.add(piv);
    D.updaters.push(t => { piv.rotation.y = t * .35; beam.material.opacity = .08 + Math.max(0, Math.cos(t * .35 + .4)) * .1; }); }
  pagoda(K, D, -12, -10, { w: 6, d: 4.6, h: 3, tiers: 1, y: 2.2, roof: M.roof, beam: M.wood, sd: 3 });
  for (let i = 0; i < 10; i++) box(2, .3, .9, M.stone, -8 + i * .2, 2.2 - i * .3, -6 - i * .7, { ry: .3 });
  for (let k = 0; k < 3; k++) { const f = new T.Mesh(new T.PlaneGeometry(.6, 1.4), M.red); f.position.set(-14.6 + k * 1.2, 5.4, -7.6); S.add(f); D.updaters.push(t => { f.rotation.y = Math.sin(t * 1.4 + k) * .3; }); }
  // ── fish-drying rack on the right, the wreck on the reef, junks out at sea ──
  { const rx = 11, rz = -6; for (const dx of [-2, 2]) box(.24, 4.4, .24, M.wood, rx + dx, -.2, rz); box(4.6, .16, .16, M.wood, rx, 4, rz, { cast: false }); box(.2, .2, 3, M.wood, rx, 4.1, rz, { cast: false });
    for (let k = 0; k < 5; k++) { const f = add(new T.ConeGeometry(.24, 1.3, 6), M.fish, rx - 1.6 + k * .8, 3.1, rz, { rx: Math.PI }); f.scale.z = .4; D.updaters.push(t => { f.rotation.z = Math.sin(t + k) * .06; }); } }
  ship(K, D, 26, -36, 14, { y: -1.6, ry: -.6, tilt: .25, wreck: true }); for (let i = 0; i < 5; i++) add(new T.DodecahedronGeometry(R.r(1, 2.4), 1), M.rock, R.r(20, 32), -.8, R.r(-30, -40));
  ship(K, D, -4, -70, 12, { y: -.9, ry: .1 }); ship(K, D, 16, -80, 10, { y: -.9 });
  breakers(D, R, [[-10, -8, 1.4], [6, -9, 1], [22, -30, 1.2], [-24, -20, 1.5]]);
  // red spider lilies along the edges
  for (let i = 0; i < 50; i++) { const x = (R() < .5 ? -1 : 1) * R.r(9, 15), z = R.r(-3, 5.6); add(new T.CylinderGeometry(.015, .015, .5, 3), new T.MeshStandardMaterial({ color: 0x3a6a2a }), x, .25, z, { cast: false });
    const f = add(new T.SphereGeometry(.14, 6, 4), M.lily, x, .52, z, { cast: false }); f.scale.y = .6; }
  farPainting(D, 'e_light', { v1: .45, z: -144 });
  scatter(D, rng(91), { area: [-14, 14, -3, 5.6], puddles: 9, pebbles: 40, stone: 0x6a6070, tufts: 40, tuft: 0x4a7a3a });
  drift(D, 60, 0, -10, 24, 12, 0xffffff, { y0: 0, y1: 5, size: 6 });
}
