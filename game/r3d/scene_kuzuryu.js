// Kuzuryu's Falls (kuzuryu) and the nine-headed storm (kuzuryu2). A mossy stone terrace before a great twin-pillared
// torii standing in a sacred pool, shimenawa ropes and paper streamers strung across, waterfalls pouring off the
// cliffs behind, blue stone lanterns, cherry blossom, the shrine glowing far beyond, under a full moon. Phase two: the
// pool rises into a whirlpool of storm water, lightning cracks the sky, the torii stands in the maelstrom, spray flies.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, torii, water, stoneLantern, farPainting, scatter, drift, lightning, vortex, rain, breakers, pagoda } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.55 };

export async function build(D, phase = 1) {
  const storm = phase === 2, K = kit(D), { S, add, box, prop } = K, R = rng(storm ? 682 : 681);
  S.fog = new T.Fog(storm ? 0x0a2a4a : 0x1a2a4a, 24, 140); S.background = new T.Color(storm ? 0x061424 : 0x0e1a34);
  D.moonlight({ color: storm ? 0x80c0ff : 0xc0d0ff, intensity: storm ? 1.6 : 2, dir: [.3, 1, -.4], ambient: storm ? 0x1a3a6a : 0x2a3a6a, ambientI: 2, sky: storm ? 0x3a7ac0 : 0x6a80d0, ground: 0x1a2a2a });
  sky(D, storm ? [[0, '#020814'], [.5, '#0a2a4a'], [1, '#1a4a6a']] : [[0, '#0a1030'], [.55, '#1a2a5a'], [1, '#2a3a6a']], { stars: storm ? 0 : 160 }); if (!storm) moon(D, 10, 52, -140, 24, [240, 244, 255], [150, 170, 255]);
  const M = { floor: pbr('rock_tile_floor', [4, 2], { color: 0x8a9ab8, rough: .25, metal: .2, ns: 1.4 }), stone: pbr('mossy_rock', [.5, 1.5], { color: 0x9aa8a0 }), rock: pbr('mossy_rock', [3, 3], { color: 0x6a7a80, ns: 1.8 }),
    cliff: pbr('rock_face', [4, 6], { color: 0x4a5a6a, ns: 2 }), rope: new T.MeshStandardMaterial({ color: 0xd8c8a0, roughness: 1 }), paper: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x80a0ff, emissiveIntensity: .4, side: T.DoubleSide }),
    fall: new T.MeshBasicMaterial({ color: 0xd0e8ff, transparent: true, opacity: .55, depthWrite: false }), roof: pbr('roof_tiles_14', [3, 3], { color: 0x7a7a90 }) };
  box(30, 1.2, 10, M.floor, 0, -1.2, 1.4); for (let i = 0; i < 10; i++) { const r = add(new T.DodecahedronGeometry(R.r(.8, 2), 1), M.rock, R.r(-15, 15), -.8, R.r(-3.6, -5), { ry: R() * 6 }); r.scale.y = .6; }
  for (const [x, z] of [[-12.6, -2.6], [12.8, -2.4], [-15, -8], [15, -9]]) { stoneLantern(D, K, x, z, 1.3, { mat: M.stone, color: 0x60c0ff }); }
  // ── the sacred pool (phase two: a whirlpool) ──
  const pool = water(D, 0, -26, 80, 44, storm ? 0x0a3a5a : 0x14305a, { y: -.6, sky: storm ? ['#40a0ff', '#0a2a4a'] : ['#4060c0', '#0a1a3a'], rings: storm ? 0 : 12, flow: storm ? [.06, .04] : [.01, .008] }); pool.material.emissive = new T.Color(storm ? 0x0a4a6a : 0x0a1a40);
  if (storm) { vortex(D, 0, -.5, -24, 18, '#a0e0ff', { speed: .5, opacity: .7 }).rotation.x = -Math.PI / 2; vortex(D, 0, -.45, -24, 10, '#ffffff', { speed: -.8, opacity: .5 }).rotation.x = -Math.PI / 2; }
  // ── the great torii in the pool, ropes and streamers strung out to posts ──
  torii(K, 0, -20, 13, M.stone, { y: -.6, dark: M.rock, rope: M.rope, tilt: storm ? -.03 : 0 });
  for (const s of [-1, 1]) { box(.4, 4, .4, M.stone, s * 13, -.6, -16); const a = new T.Vector3(s * 5.2, 7, -20), b = new T.Vector3(s * 13, 3.2, -16), m = a.clone().lerp(b, .5); m.y -= 1; const c = new T.QuadraticBezierCurve3(a, m, b);
    add(new T.TubeGeometry(c, 16, .1, 6), M.rope, 0, 0, 0, { cast: false }); for (let k = 1; k < 7; k++) { const p = c.getPoint(k / 7), sh = add(new T.PlaneGeometry(.3, .9), M.paper, p.x, p.y - .5, p.z, { cast: false }); D.updaters.push(t => { sh.rotation.z = Math.sin(t * (storm ? 6 : 1.4) + k) * (storm ? .5 : .15); }); } }
  // ── the cliffs and their waterfalls, the shrine beyond ──
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const r = add(new T.DodecahedronGeometry(R.r(6, 11), 1), M.cliff, s * R.r(20, 34), R.r(4, 14), R.r(-30, -50), { cast: false, ry: R() * 6 }); r.scale.y = R.r(1.2, 2); }
  const falls = []; for (const [x, w, h] of [[-18, 3, 22], [-12, 1.6, 16], [17, 2.4, 20], [24, 1.4, 14]]) { const f = add(new T.PlaneGeometry(w, h, 1, 8), M.fall.clone(), x, h / 2 - .6, -34, { cast: false }); falls.push(f); D.glow(x, -.2, -33, w * 2.4, 0xa0d0ff); }
  D.updaters.push(t => falls.forEach((f, i) => { f.material.opacity = .45 + Math.sin(t * 9 + i * 2) * .12; }));
  drift(D, 80, 0, -32, 24, 4, 0xe0f0ff, { y0: -.6, y1: 3, size: 12 });
  pagoda(K, D, 0, -52, { w: 8, d: 6, h: 3, tiers: 2, y: 1, roof: M.roof, sd: 6 }); D.glow(0, 3, -48, 6, 0xa0c0ff);
  for (let i = 0; i < 5; i++) await prop('sakura', -14 + R.r(-3, 3), R.r(-4, 2), R.r(7, 9), { y: 0, flip: R() < .5, sway: .01, tint: storm ? 0xa0b0ff : 0xffd0f0, blob: false });
  if (storm) { lightning(D, R, { color: 0xa0e0ff, area: [-40, 40, -30, -80], every: [1.2, 3.5] }); rain(D, 1200, [-22, 22], [0, 20], [-30, 8], { speed: 18 }); breakers(D, R, [[-6, -18, 1.4], [6, -19, 1.4], [0, -28, 2], [-10, -24, 1], [10, -26, 1.2]], { y: -.6 });
    farPainting(D, 'kuzuryu2', { v1: .45, z: -144 }); D.petals(80, 0, -2, 14, { color: 0xe0e8ff });
  } else { farPainting(D, 'kuzuryu', { v1: .45, z: -144 }); D.petals(120, -6, -2, 14, { color: 0xffc0e0 }); drift(D, 30, 0, -14, 14, 8, 0x60c0ff, { y0: 0, y1: 4, size: 14 }); }
  scatter(D, rng(129), { area: [-14, 14, -3, 6], puddles: storm ? 12 : 7, petals: 80, petal: 0xffc0e0, tufts: 30, tuft: 0x4a7a5a });
}
