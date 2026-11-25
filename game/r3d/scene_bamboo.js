// Moonlit Bamboo Road: the shared HD-2D set used by free roam and the bamboo fight stages
import { T } from './diorama.js';
const BASE = new URL('./img/', import.meta.url).href;
const I = n => BASE + n + '.webp';
// ── the road: a walkable spine (x,z, height y, half-width w) ──
export const P = [
  { x: -40, z: 1.0, w: 2.6 }, { x: -32, z: 2.2, w: 2.4 }, { x: -25, z: 2.6, w: 2.0 }, { x: -20.5, z: 2.6, w: 1.5 },
  { x: -19.6, z: 2.6, y: .9, w: .2, br: 1 }, { x: -17.8, z: 2.6, y: 1.5, w: .2, br: 1 }, { x: -16, z: 2.6, y: 1.67, w: .2, br: 1 }, { x: -14.2, z: 2.6, y: 1.5, w: .2, br: 1 }, { x: -12.4, z: 2.6, y: .9, w: .2, br: 1 },
  { x: -11.5, z: 2.6, w: 1.5 }, { x: -6, z: 3.6, w: 2.4 }, { x: 0, z: 1.4, w: 2.6 }, { x: 6, z: 3.4, w: 2.4 }, { x: 12, z: 1.6, w: 2.6 },
  { x: 18, z: 2.6, w: 2.4 }, { x: 23.5, z: 1.4, w: 2.2 }, { x: 27, z: .2, w: 1.7 },
  { x: 27, z: -6.8, y: 3, w: 1.7, st: 1 }, { x: 27, z: -8.5, y: 3, w: 3.2 }, { x: 27, z: -15, y: 3, w: 5 },
];
P.forEach(p => p.y = p.y || 0);
// the road goes on: a western stretch before the grove and an eastern road past the shrine stairs
export const PW = [{ x: -96, z: 1.6, w: 2.4 }, { x: -86, z: 2.8, w: 2.6 }, { x: -74, z: 1.2, w: 2.5 }, { x: -62, z: 2.6, w: 2.6 }, { x: -50, z: 1.4, w: 2.5 }, { x: -40, z: 1.0, w: 2.6 }];
export const PE = [{ x: 23.5, z: 1.4, w: 2.2 }, { x: 32, z: 2.2, w: 2.4 }, { x: 42, z: 1.2, w: 2.6 }, { x: 54, z: 2.6, w: 2.5 }, { x: 66, z: 1.4, w: 2.6 }, { x: 78, z: 2.2, w: 2.4 }];
PW.forEach(p => p.y = 0); PE.forEach(p => p.y = 0);
export const PATHS = [P, PW, PE];
export function nearest(x, z, paths = PATHS) {
  let best = null;
  for (const Q of paths) for (let i = 0; i < Q.length - 1; i++) {
    const a = Q[i], b = Q[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
    let t = ((x - a.x) * dx + (z - a.z) * dz) / L2; t = Math.max(0, Math.min(1, t));
    const px = a.x + dx * t, pz = a.z + dz * t, d = Math.hypot(x - px, z - pz), w = a.w + (b.w - a.w) * t, y = a.y + (b.y - a.y) * t;
    const over = d - w; if (!best || over < best.over) best = { over, px, pz, d, w, y, i, t };
  }
  return best;
}

// ── a real 3D arched bridge over the stream: wooden deck that follows the walkable arch, red lacquer rails and posts with gold caps, stone piers ──
function bridge3d(D) {
  const N = [[-20.6, 0], [-19.6, .9], [-17.8, 1.5], [-16, 1.67], [-14.2, 1.5], [-12.4, .9], [-11.4, 0]], z0 = 2.6, half = 1.05;
  const yAt = x => { for (let i = 0; i < N.length - 1; i++) { const [a, ya] = N[i], [b, yb] = N[i + 1]; if (x >= a && x <= b) { const u = (x - a) / (b - a), s = u * u * (3 - 2 * u); return ya + (yb - ya) * s; } } return 0; };
  const wood = new T.MeshStandardMaterial({ color: 0x6e4b33, roughness: .85 }), lac = new T.MeshStandardMaterial({ color: 0xa8242a, roughness: .45 }), gold = new T.MeshStandardMaterial({ color: 0xd9a441, metalness: .6, roughness: .35 }), stone = new T.MeshStandardMaterial({ color: 0x6c6a64, roughness: .95 });
  const g = new T.Group(); const add = (geo, mat, x, y, z, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const x0 = N[0][0], x1 = N[N.length - 1][0], steps = 28;
  for (let i = 0; i < steps; i++) {
    const a = x0 + (x1 - x0) * i / steps, b = x0 + (x1 - x0) * (i + 1) / steps, ya = yAt(a), yb = yAt(b), L = Math.hypot(b - a, yb - ya), rz = Math.atan2(yb - ya, b - a), mx = (a + b) / 2, my = (ya + yb) / 2;
    add(new T.BoxGeometry(L * 1.04, .1, half * 2), wood, mx, my - .05, z0, rz);                       // planks
    for (const s of [-1, 1]) { add(new T.BoxGeometry(L * 1.04, .2, .12), lac, mx, my - .12, z0 + s * half, rz);   // side beams
      add(new T.BoxGeometry(L * 1.04, .07, .09), lac, mx, my + .82, z0 + s * half, rz); add(new T.BoxGeometry(L * 1.04, .05, .06), lac, mx, my + .45, z0 + s * half, rz); }   // top + mid rails
  }
  for (let i = 0; i <= 8; i++) { const x = x0 + .25 + (x1 - x0 - .5) * i / 8, y = yAt(x); for (const s of [-1, 1]) { add(new T.BoxGeometry(.13, .95, .13), lac, x, y + .38, z0 + s * half); add(new T.SphereGeometry(.09, 10, 8), gold, x, y + .9, z0 + s * half); } }
  for (const x of [-17.8, -14.2]) for (const s of [-1, 1]) add(new T.BoxGeometry(.32, 1.9, .32), stone, x, yAt(x) - 1.1, z0 + s * (half - .15));
  D.scene.add(g); return g;
}
export async function build(D) {
// ── world ──
D.moonlight({ intensity: 2.6, ambientI: 2.2 });
D.ground(240, I('t_moss'), 60, 0xc8d8c8);
D.backdrop(I('sky'), { z: -62, y: -6, w: 230, h: 98, parallax: .72 });
const road1 = P.slice(0, 4), road2 = P.slice(9, 17);
D.ribbon(road1, I('t_dirt'), { texLen: 5 }); D.ribbon(road2, I('t_dirt'), { texLen: 5 });
// stream with banks
D.water(-16, 0, 5.2, 120, { flow: [0, -1] });
// stairs + plateau
D.steps(27, .4, 27, -6.8, 0, 3, 12, 3.6, I('t_stone'));
D.box(27, 3, -15.5, 16, 3.05, 17, I('t_stone'), [5, 1.2], 0x7d7468);
{ const top = D.ground(1, I('t_moss'), 1); top.scale.set(16, 17, 1); top.position.set(27, 3.01, -15.5); top.material = top.material.clone(); top.material.map = top.material.map.clone(); top.material.map.repeat.set(5, 5); top.material.color.set(0xc8d8c8); }
D.ribbon([{ x: 27, z: -7, y: 3, w: 1.5 }, { x: 27, z: -12, y: 3, w: 1.6 }, { x: 27, z: -19, y: 3, w: 1.8 }], I('t_stone'), { texLen: 3, yOff: .02 });
// the stream's banks
D.ribbon([{ x: -18.9, z: -40, w: .5 }, { x: -18.9, z: 40, w: .5 }], I('t_dirt'), { texLen: 3, color: 0x6a6a60 });
D.ribbon([{ x: -13.1, z: -40, w: .5 }, { x: -13.1, z: 40, w: .5 }], I('t_dirt'), { texLen: 3, color: 0x6a6a60 });
// a soft fill light that follows Kaede so she never sinks into the dark



  const A = (n, x, z, h, o) => D.prop(I(n), x, z, h, o);
  bridge3d(D);
  await A('shrine', 27, -20, 4.6, { y: 3, blobW: .35 }); D.lantern(25.6, 5.6, -19.6, { distance: 7, intensity: 10, glow: .5 }); D.lantern(28.4, 5.6, -19.6, { distance: 7, intensity: 10, glow: .5 });
  await A('offering', 27, -17.6, .8, { y: 3 });
  await A('lanternline', -1.5, -1.6, 2.6); [-3.1, -2.2, -1.4, -.6, .2].forEach(x => D.lantern(x, 2.05, -1.45, { color: 0xff5030, intensity: 3, distance: 4, glow: .35, flicker: true }));
  await A('sign', -36.5, -.4, 1.7);
  await A('rocks', -19.4, -1.2, 1.1); await A('rocks', -12.8, 6.6, 1.0, { flip: 1 }); await A('rocks', -19.6, 7.5, .9); await A('rocks', -12.4, -3.5, 1.2, { flip: 1 });
  await A('ferns', -21.5, -.6, .9); await A('ferns', -10.6, 5.4, .8, { flip: 1 });
  // bamboo walls (north, dense) + a few in front of the road that fade when you pass behind them
  let seed = 3; const R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; const rnd = (a, b) => a + R() * (b - a);
  for (let x = -44; x < 46; x += 1.6) {
    for (let row = 0; row < 3; row++) {
      const z = -1.6 - row * 3.2 - R() * 2.2, xx = x + R() * 1.4;
      if (Math.abs(xx + 16) < 3.4) continue;                         // stream
      if (xx > 18.5 && xx < 36 && z < -1) continue;                 // stairs + plateau
      const n = nearest(xx, z, [P]); if (n.over < 1) continue;
      const big = R() < .55, one = R() < .3; await A(one ? 'bamboo1' : big ? 'bamboo3' : 'rfg_bamboo', xx, z, big ? rnd(7, 9) : rnd(5.5, 7), { flip: R() < .5, sway: .012, blobW: .25, tint: row ? 0xb8c4d8 : 0xffffff });
    }
  }
  for (let x = -40; x < 40; x += rnd(6, 9)) { if (Math.abs(x + 16) < 4) continue; await A(R() < .5 ? 'bamboo3' : 'rfg_bamboo', x, 8.6 + R() * 2, rnd(6.5, 8), { fadeNear: 1, flip: R() < .5, sway: .01, blobW: .25 }); }
  for (let x = -38; x < 24; x += 3.1) { const z = 6.2 + R() * 1.5; if (Math.abs(x + 16) < 4) continue; await A('ferns', x, z, rnd(.7, 1.1), { flip: R() < .5 }); }
  // stone lanterns along the road, each one a real light
  const toro = [[-34, -.6], [-24, -.4], [-8, .6], [5.6, -1.6], [10, 6.4], [16, -.5], [24.4, -1.6]];
  for (const [x, z] of toro) { await A('toro', x, z, 2.3); D.lantern(x, 1.62, z + .15, { distance: 9, intensity: 16 }); }
  await A('toro_s', -29, 5.4, 1.2); D.lantern(-29, .72, 5.55, { distance: 6, intensity: 8, glow: .7 });
  await A('toro_s', 20, 5.4, 1.2, { flip: 1 }); D.lantern(20, .72, 5.55, { distance: 6, intensity: 8, glow: .7 });
  // stairs: lanterns climb with you, guardians at the top, torii frames the shrine
  for (let i = 0; i < 3; i++) { const z = -1 - i * 2.4, y = (1 + i * 2.4) / 7 * 3; await A('toro_s', 24.6, z, 1.1, { y }); await A('toro_s', 29.4, z, 1.1, { y, flip: 1 }); D.lantern(24.6, y + .65, z + .15, { distance: 5, intensity: 6, glow: .32 }); D.lantern(29.4, y + .65, z + .15, { distance: 5, intensity: 6, glow: .32 }); }
  await A('komainu', 22.3, -8.6, 1.7, { y: 3 }); await A('komainu', 31.7, -8.6, 1.7, { y: 3, flip: 1 });
  await A('torii', 27, -10.2, 4.6, { y: 3, blobW: .3 });
  await A('toro', 22.4, -18.4, 2.3, { y: 3 }); D.lantern(22.4, 4.62, -18.25, { distance: 9, intensity: 16 });
  await A('toro', 31.6, -18.4, 2.3, { y: 3, flip: 1 }); D.lantern(31.6, 4.62, -18.25, { distance: 9, intensity: 16 });
  for (let x = 19.6; x < 34.6; x += 1.5) { if (Math.abs(x - 27) < 2.4) continue; await A(R() < .6 ? 'ferns' : 'rocks', x, -7.25, rnd(.7, 1), { y: 3, flip: R() < .5 }); }
  for (let x = 18; x < 37; x += 1.7) await A(R() < .5 ? 'bamboo3' : 'rfg_bamboo', x + R(), -24 - R() * 3, rnd(7, 9), { y: 3, sway: .012, blobW: .2, flip: R() < .5 });
  for (let z = -9; z > -24; z -= 2.2) { await A('bamboo3', 19.4 - R(), z, rnd(7, 8.5), { y: 3, sway: .012, blobW: .2 }); await A('bamboo3', 34.6 + R(), z, rnd(7, 8.5), { y: 3, sway: .012, blobW: .2, flip: 1 }); }
  await A('sakura', 19.9, -20.6, 4.2, { y: 3 }); await A('sakura', 34.1, -20.2, 3.8, { y: 3, flip: 1 });
  await A('sakura', -27, -4.5, 4.4); await A('sakura', 8, -3.2, 3.6, { flip: 1 });
  D.petals(70, -27, -3, 4); D.petals(60, 27, -16, 7); D.petals(40, 8, -2, 3.5);
  D.fireflies(140, 0, 1, 40, 6); D.fireflies(40, 27, -14, 7, 5, { y0: 3.3, y1: 6.5 });
  // a towering back row (about three fighters tall) so zoomed-out fights, big enemies and crews still sit inside the grove
  for (let x = -46; x < 48; x += 2.2) { const xx = x + R() * 1.6, z = -12.6 - R() * 3; if (Math.abs(xx + 16) < 3.6) continue; if (xx > 17.5 && xx < 37) continue;
    await A(R() < .5 ? 'bamboo3' : 'bamboo1', xx, z, rnd(12, 16), { flip: R() < .5, sway: .008, blobW: .2, tint: 0x9aa8c4 }); }
  for (let x = 17; x < 38; x += 2.4) await A('bamboo3', x + R(), -28 - R() * 2, rnd(13, 17), { y: 3, sway: .008, blobW: .2, tint: 0x9aa8c4, flip: R() < .5 });
  // the western stretch and the eastern road
  D.ribbon(PW, I('t_dirt'), { texLen: 5 }); D.ribbon(PE, I('t_dirt'), { texLen: 5 });
  for (const [x0, x1] of [[-104, -44], [46, 86]]) {
    for (let x = x0; x < x1; x += 1.6) for (let row = 0; row < 3; row++) { const z = -1.6 - row * 3.2 - R() * 2.2, xx = x + R() * 1.4; const n = nearest(xx, z); if (n.over < 1) continue;
      const big = R() < .55; await A(big ? 'bamboo3' : 'rfg_bamboo', xx, z, big ? rnd(7, 9) : rnd(5.5, 7), { flip: R() < .5, sway: .012, blobW: .25, tint: row ? 0xb8c4d8 : 0xffffff }); }
    for (let x = x0; x < x1; x += rnd(6, 9)) await A(R() < .5 ? 'bamboo3' : 'rfg_bamboo', x, 8.6 + R() * 2, rnd(6.5, 8), { fadeNear: 1, flip: R() < .5, sway: .01, blobW: .25 });
    for (let x = x0; x < x1; x += 3.1) await A('ferns', x, 6.2 + R() * 1.5, rnd(.7, 1.1), { flip: R() < .5 });
    for (let x = x0; x < x1; x += 2.2) { const xx = x + R() * 1.6; await A(R() < .5 ? 'bamboo3' : 'bamboo1', xx, -12.6 - R() * 3, rnd(12, 16), { flip: R() < .5, sway: .008, blobW: .2, tint: 0x9aa8c4 }); }
  }
  for (const [x, z] of [[-92, -.6], [-80, 5.6], [-68, -.4], [-56, 5.2], [-46, -.6], [36, -.6], [48, 5.4], [60, -.4], [72, 5.2]]) { await A('toro', x, z, 2.3); D.lantern(x, 1.62, z + .15, { distance: 9, intensity: 16 }); }
  await A('sakura', -84, -4, 4.2); await A('sakura', 58, -3.6, 4, { flip: 1 }); await A('sign', -95, -.6, 1.7); await A('sign', 77, -.4, 1.7, { flip: 1 });
  D.petals(50, -84, -3, 4); D.petals(40, 58, -3, 4); D.fireflies(90, -70, 1, 26, 6); D.fireflies(80, 60, 1, 22, 6);
  // things to find
}
