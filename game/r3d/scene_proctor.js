// Exam Hall (proctor) and the failing grade (proctor2). A great wooden exam hall at golden hour: polished floor, rows of
// desks and chairs, tall windows with cherry trees outside and curtains, the stage with a blackboard, red drapes and
// flowers, a big clock. Phase two: everything turns red, the clock bleeds and runs fast, ink drips down the board,
// desks lift off the floor and drift, exam papers storm through the air, red light pools on the floor.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, farPainting, viewMat, scatter, drift, flurry, vortex } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -2.4]], sum: [-5.2, .8], exposure: 1.45 };
const board = red => cvs(512, 256, (g, W, H) => { g.fillStyle = '#1a3a2a'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(40, 40 + i * 26); g.lineTo(40 + (i * 53 % 300) + 100, 40 + i * 26); g.stroke(); }
  if (red) { g.fillStyle = '#b01020'; for (let i = 0; i < 14; i++) { const x = 20 + i * 36; g.fillRect(x, 0, 8 + (i % 3) * 4, 40 + (i * 37 % 180)); g.beginPath(); g.arc(x + 6, 40 + (i * 37 % 180), 8, 0, 7); g.fill(); } } });
const clockF = red => cvs(256, 256, (g, W) => { g.fillStyle = red ? '#f0d0c8' : '#f8f4ea'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.strokeStyle = red ? '#8a1010' : '#2a1a10'; g.lineWidth = 12; g.stroke(); g.fillStyle = g.strokeStyle; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100, 6, 0, 7); g.fill(); } });

export async function build(D, phase = 1) {
  const red = phase === 2, K = kit(D), { S, add, box, prop } = K, R = rng(red ? 642 : 641);
  S.fog = new T.Fog(red ? 0x5a0a10 : 0x6a4a30, 24, 100); S.background = new T.Color(red ? 0x2a0408 : 0x3a2414);
  D.moonlight(red ? { color: 0xff5a4a, intensity: 2, dir: [-.8, .6, .3], ambient: 0x7a1a1a, ambientI: 2.2, sky: 0xff6a5a, ground: 0x4a0a0a } : { color: 0xffc080, intensity: 2.6, dir: [-.8, .6, .3], ambient: 0x8a6040, ambientI: 2.2, sky: 0xffd8a0, ground: 0x6a4028 });
  const M = { floor: pbr('japanese_cedar_planks', [10, 4], { color: red ? 0xa04030 : 0xc08a60, rough: .15, metal: .15 }), wall: pbr('worn_planks', [4, 1], { color: red ? 0x8a3a30 : 0xd0b090 }), wood: pbr('japanese_cedar_planks', [.5, 1], { color: red ? 0x6a2a20 : 0x8a5a38, rough: .35 }),
    desk: pbr('japanese_cedar_planks', [1, .5], { color: red ? 0x9a4a3a : 0xc89060, rough: .3 }), metal: new T.MeshStandardMaterial({ color: 0x3a3a40, metalness: .7, roughness: .4 }), drape: new T.MeshStandardMaterial({ color: red ? 0x8a0a14 : 0x9a1a24, roughness: .8, side: T.DoubleSide }),
    board: new T.MeshStandardMaterial({ map: ctex(board(red)), roughness: .9 }), clock: new T.MeshBasicMaterial({ map: ctex(clockF(red)) }), win: new T.MeshBasicMaterial({ color: red ? 0xff5a40 : 0xffd090 }), curtain: new T.MeshStandardMaterial({ color: 0xf4f0e8, transparent: true, opacity: .7, side: T.DoubleSide }) };
  { const f = new T.Mesh(new T.PlaneGeometry(40, 30), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -10); f.receiveShadow = true; S.add(f); }
  box(40, 12, .4, M.wall, 0, 0, -24); box(.4, 12, 30, M.wall, -20, 0, -10); box(.4, 12, 30, M.wall, 20, 0, -10); box(40, .4, 30, M.wall, 0, 11.6, -10, { cast: false });
  for (let z = -22; z < 4; z += 5) box(40, .5, .5, M.wood, 0, 11, z, { cast: false });
  // ── tall windows down the left wall: light pours in, curtains stir, cherry trees outside ──
  for (let z = -20, wi = 0; z < 2; z += 5, wi++) { add(new T.PlaneGeometry(3.4, 7), viewMat('sky_school', { u0: .06 + wi * .17, u1: .06 + wi * .17 + .3, v0: .02, v1: .98, tint: red ? 0xff7a60 : 0xfff2e0 }), -19.7, 4.6, z, { ry: Math.PI / 2, cast: false }); box(.3, 7.4, .2, M.wood, -19.6, 1, z - 1.8); box(.3, 7.4, .2, M.wood, -19.6, 1, z + 1.8); box(.3, .2, 3.8, M.wood, -19.6, 4.6, z);
    const c = add(new T.PlaneGeometry(1.4, 7.6, 2, 6), M.curtain, -19.3, 4.4, z + 2.4, { ry: Math.PI / 2, cast: false }); D.updaters.push(t => { c.rotation.z = Math.sin(t * .6 + z) * .04; });
    D.lantern(-17, 5, z, { color: red ? 0xff5040 : 0xffc080, intensity: 16, distance: 12, glow: 0 }); }
  for (let i = 0; i < 4; i++) await prop('sakura', -23, -18 + i * 6, 8, { y: 0, tint: red ? 0xff3030 : 0xffffff, blob: false });
  // ── the stage: a raised platform, blackboard, drapes, flower stands, the big clock ──
  box(22, 1, 5, M.wood, 0, 0, -21.6); add(new T.PlaneGeometry(12, 4.4), M.board, 0, 4.4, -23.7, { cast: false }); box(12.6, 5, .2, M.wood, 0, 1.9, -23.9);
  for (const s of [-1, 1]) { const d = add(new T.PlaneGeometry(4, 9, 6, 1), M.drape, s * 9, 5.6, -23.6, { cast: false }); const p = d.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4) * .2); p.needsUpdate = true; d.geometry.computeVertexNormals();
    add(new T.CylinderGeometry(.3, .4, 1.4, 12), M.wood, s * 6.6, 1.7, -21); await prop('sakura', s * 6.6, -21, 1.8, { y: 2.3, blob: false, tint: red ? 0xff4040 : 0xffd0e0 }); }
  const cg = new T.Group(); cg.position.set(0, 8.6, -23.6); S.add(cg); K.add(new T.CylinderGeometry(1.8, 1.8, .3, 32), M.wood, 0, 0, 0, { to: cg, rx: Math.PI / 2 }); K.add(new T.CircleGeometry(1.65, 32), M.clock, 0, 0, .16, { to: cg, cast: false });
  const hh = K.add(new T.BoxGeometry(.12, .9, .04), M.metal, 0, .35, .2, { to: cg, cast: false }), mh = K.add(new T.BoxGeometry(.08, 1.3, .04), M.metal, 0, .55, .22, { to: cg, cast: false }); hh.geometry.translate(0, .1, 0); mh.geometry.translate(0, .1, 0);
  D.updaters.push(t => { const sp = red ? 4 : .05; hh.rotation.z = -t * sp * .08; mh.rotation.z = -t * sp; });
  // ── rows of desks and chairs (phase two: they lift and drift) ──
  const desks = [];
  for (const s of [-1, 1]) for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { const x = s * (7 + c * 3.4), z = -5 - r * 3.2, g = new T.Group(); g.position.set(x, 0, z); S.add(g);
    K.add(new T.BoxGeometry(2, .1, 1.1), M.desk, 0, 1.2, 0, { to: g }); for (const [dx, dz] of [[-.9, -.45], [.9, -.45], [-.9, .45], [.9, .45]]) K.add(new T.BoxGeometry(.06, 1.2, .06), M.metal, dx, .6, dz, { to: g });
    K.add(new T.BoxGeometry(.9, .08, .8), M.desk, 0, .8, .9, { to: g }); K.add(new T.BoxGeometry(.9, .8, .08), M.desk, 0, 1.2, 1.3, { to: g }); desks.push([g, x, z, R() * 6]); }
  if (red) { D.updaters.push(t => desks.forEach(([g, x, z, ph], i) => { if (i % 3) return; g.position.y = 1.5 + Math.sin(t * .5 + ph) * 1.2 + (i % 2) * 2; g.rotation.set(Math.sin(t * .3 + ph) * .5, ph, Math.cos(t * .4 + ph) * .4); }));
    flurry(D, R, 70, { area: [-16, 16, 0, -20], y0: 0, y1: 10, speed: 2 }); vortex(D, 0, 8, -23.5, 9, '#ff3040', { speed: .2, opacity: .45 });
    for (let i = 0; i < 6; i++) { const p = add(new T.CircleGeometry(R.r(.8, 2), 20), new T.MeshStandardMaterial({ color: 0x8a0010, roughness: .05, metalness: .5 }), R.r(-12, 12), .015, R.r(-3, -16), { rx: -Math.PI / 2, cast: false }); }
  } else { flurry(D, R, 8, { area: [-14, 14, -2, -18], y0: 0, y1: 8, speed: .4 }); drift(D, 50, -10, -10, 10, 12, 0xffe0a0, { y0: 1, y1: 9, size: 6 }); }
  scatter(D, rng(125), { area: [-14, 14, -3, 6], petals: red ? 30 : 40, petal: red ? 0xf0e8e0 : 0xffc0d0, puddles: 0 });
}
