// Cliffside Dojo: the polished training deck of a pirate dojo on a sea cliff. The dojo hall with its skull-and-swords
// banner and red lanterns, steps up to a bell pavilion with a great bronze bell, bonsai pines leaning over the drop,
// surf crashing on the rocks below, and red-sailed junks crossing under a blood moon.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, ship, sea, breakers, deck, rail, pagoda, bannerTex, ctex, scatter, farPainting, drift, deadTree } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.6], [-4.4, -1.8], [1.6, -2.6]], sum: [-5.6, .8], exposure: 1.6 };

const jolly = (g, cx, cy) => { g.fillStyle = '#f0e8dc'; g.beginPath(); g.ellipse(cx, cy - 20, 48, 52, 0, 0, 7); g.fill(); g.fillRect(cx - 26, cy + 20, 52, 28);
  g.fillStyle = '#7a1420'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 19, cy - 16, 12, 14, 0, 0, 7); g.fill(); }
  g.strokeStyle = '#f0e8dc'; g.lineWidth = 10; g.lineCap = 'round'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx - s * 76, cy + 120); g.lineTo(cx + s * 80, cy + 50); g.stroke(); } };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(341);
  S.fog = new T.Fog(0x3a1840, 28, 150); S.background = new T.Color(0x22122e);
  D.moonlight({ color: 0xffa0a8, intensity: 2, dir: [.5, 1, -.4], ambient: 0x5a3068, ambientI: 2, sky: 0x9a5aa8, ground: 0x4a2a28 });
  sky(D, [[0, '#140a26'], [.5, '#4a1644'], [1, '#8a2a3a']], { stars: 60 }); moon(D, 18, 48, -140, 30, [240, 70, 60], [220, 40, 70]);
  const M = { deck: pbr('japanese_cedar_planks', [8, 2], { color: 0xb07060, rough: .22, metal: .12, ns: 1 }), post: pbr('weathered_planks', [.4, 1], { color: 0x7a5050 }),
    stone: pbr('mossy_rock', [.5, .5], { color: 0xc8c0b8 }), rock: pbr('rock_face', [3, 3], { color: 0x6a5a70, ns: 2 }), wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x8a3a30, rough: .4 }),
    roof: pbr('roof_tiles_14', [3, 3], { color: 0x8a80a0 }), bronze: new T.MeshStandardMaterial({ color: 0x8a6a3a, metalness: .85, roughness: .35 }), pine: new T.MeshStandardMaterial({ color: 0x2a4a3a, roughness: .9, flatShading: true }),
    bark: pbr('japanese_cedar_bark', [1, 2], { color: 0x7a6060 }), lan: new T.MeshStandardMaterial({ color: 0xff6040, emissive: 0xff3018, emissiveIntensity: 1.6 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#a01a28', '#701020'], trim: '#e0c090', emblem: jolly, tatter: true, sd: 71 })), side: T.DoubleSide, alphaTest: .4 }) };
  deck(D, K, R, { mat: M.deck, post: M.post, stone: M.stone, rope: false });
  rail(K, [[-1, -3.4], [15, -3.4]], { h: 1, step: 2, mat: M.wood, post: .2, rails: [.9, .45] });
  // ── the cliff the dojo stands on and the drop to the sea ──
  box(40, 14, 16, M.rock, -12, -14, -12, { cast: false }); for (let i = 0; i < 12; i++) { const r = add(new T.DodecahedronGeometry(R.r(2, 5), 1), M.rock, R.r(-4, 16), R.r(-10, -4), R.r(-6, -20), { ry: R() * 6 }); r.scale.y = R.r(.8, 1.5); }
  sea(D, R, { z: -75, y: -9, shore: -16, foam: 6 }); breakers(D, R, [[6, -14, 1.6], [14, -18, 1.3], [0, -22, 1.2]], { y: -8.5 });
  // ── the dojo hall (left), its banner and lanterns ──
  pagoda(K, D, -14, -7, { w: 11, d: 7, h: 4.6, tiers: 2, y: 0, roof: M.roof, beam: M.wood, sd: 4 });
  { const b = new T.Mesh(new T.PlaneGeometry(2.6, 4.2, 1, 6), M.ban); b.geometry.translate(0, -2.1, 0); b.position.set(-10.6, 5.6, -3.3); b.castShadow = true; S.add(b); D.updaters.push(t => { b.rotation.y = Math.sin(t * .8) * .12; }); }
  for (const x of [-17.6, -14, -10.4]) { const l = add(new T.SphereGeometry(.36, 12, 10), M.lan, x, 4.2, -3.2, { cast: false }); l.scale.y = 1.3; D.lantern(x, 4.2, -3, { color: 0xff6030, intensity: 10, distance: 8, glow: 1 }); }
  for (let i = 0; i < 6; i++) box(4, .3, .9, M.stone, -9.4 + i * .1, i * .4, -3.6 - i * .8, { ry: .1 });
  // ── the bell pavilion on the cliff edge: four posts, a roof, the great bronze bell and its striker log ──
  { const px = -4, pz = -11, y0 = 2.4; box(7, y0 - .4, 7, M.rock, px, 0, pz); box(6, .4, 6, M.wood, px, y0 - .4, pz); for (const [dx, dz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) box(.36, 5, .36, M.wood, px + dx, y0, pz + dz);
    const r = add(new T.ConeGeometry(5, 1.8, 4), M.roof, px, y0 + 6, pz, { ry: Math.PI / 4 }); r.scale.set(1.1, 1, 1.1); box(5.4, .3, .3, M.wood, px, y0 + 4.8, pz, { cast: false });
    const bell = add(new T.CylinderGeometry(1, 1.4, 2.6, 18), M.bronze, px, y0 + 3.1, pz); add(new T.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.bronze, px, y0 + 4.4, pz);
    for (let k = 0; k < 3; k++) add(new T.TorusGeometry(1.05 + k * .12, .05, 6, 24), M.bronze, px, y0 + 2.2 + k * .8, pz, { rx: Math.PI / 2, cast: false });
    const log = new T.Group(); log.position.set(px + 2.8, y0 + 3, pz); S.add(log); const lg = new T.Mesh(new T.CylinderGeometry(.22, .22, 2.4, 10), M.bark); lg.rotation.z = Math.PI / 2; lg.position.x = 1.2; log.add(lg);
    D.updaters.push(t => { log.rotation.z = Math.sin(t * .4) * .05; }); }
  // ── bonsai pines leaning over the drop ──
  const pine = (x, y, z, s) => { deadTree(K, x, z, 6 * s, M.bark, x | 0).position.y = y; for (let k = 0; k < 6; k++) { const p = add(new T.SphereGeometry(1, 8, 6), M.pine, x + R.r(-2, 3) * s, y + R.r(3.5, 6) * s, z + R.r(-1, 1), { cast: true }); p.scale.set(R.r(1.4, 2.4) * s, .45 * s, 1.2 * s); } };
  pine(-6, 2, -16, 1.1); pine(6, -3, -12, .9); pine(-20, 6, -12, 1);
  ship(K, D, 20, -50, 16, { y: -9, ry: -.15 }); ship(K, D, 4, -70, 12, { y: -9, ry: .1 }); ship(K, D, 36, -80, 12, { y: -9 });
  farPainting(D, 'e_dojo', { v1: .45, z: -144, yb: -14 });
  scatter(D, rng(93), { area: [-14, 14, -3, 5.4], puddles: 6, petals: 60, petal: 0xff6a8a, leaves: 30, leaf: 0x3a5a3a });
  drift(D, 40, 0, -10, 20, 10, 0xffb070, { y0: .5, y1: 6, size: 7 });
}
