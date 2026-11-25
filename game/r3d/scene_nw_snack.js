// Snack Bar: a little Neon Ward "snack" on a rainy night. Glossy plank floor, the long bar with red stools and a back
// wall of glowing bottles, pink paper lanterns, an old CRT showing a cherry-blossom moon, a red booth by the window,
// a bead curtain, sakura in a vase, and the neon street smeared on the rain-streaked glass.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, viewMat, scatter, neonTower, rain, drift } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.4], [-4, -1.6], [1.4, -2.2]], sum: [-5.2, .8], exposure: 1.45 };

const bottles = glow => { const R = rng(12); return cvs(512, 256, (g, W, H) => { g.fillStyle = glow ? '#000' : '#3a1e14'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 3; r++) { const y = 14 + r * 80; if (!glow) { g.fillStyle = '#20100a'; g.fillRect(0, y + 70, W, 8); } for (let x = 6; x < W - 16; x += R.r(16, 26)) { const h = R.r(32, 62), w = R.r(10, 16), hue = R.r(20, 50);
    g.fillStyle = glow ? `hsla(${hue},100%,60%,${R.r(.3, .9)})` : `hsl(${hue},${R.r(40, 80)}%,${R.r(30, 60)}%)`; g.fillRect(x, y + 70 - h, w, h); g.fillRect(x + w / 2 - 2, y + 70 - h - 10, 4, 10); } } }); };
const crt = () => cvs(256, 192, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a1a6a'); gr.addColorStop(1, '#a04a9a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffe8f4'; g.beginPath(); g.arc(150, 70, 34, 0, 7); g.fill(); g.fillStyle = '#ff9ad0'; const R = rng(5); for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(R() * W, 120 + R() * 70, R.r(3, 8), 0, 7); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); });
const glass = () => { const R = rng(8); return cvs(256, 256, (g, W, H) => { g.fillStyle = '#1a1030'; g.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { g.fillStyle = `hsla(${[320, 190, 40][i % 3]},90%,65%,${R.r(.3, .8)})`; g.fillRect(R() * W, R() * H, R.r(4, 30), R.r(10, 60)); }
  g.strokeStyle = 'rgba(220,230,255,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 50; i++) { const x = R() * W, y = R() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R.r(-3, 3), y + R.r(10, 40)); g.stroke(); } }); };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(381);
  S.fog = new T.Fog(0x3a1e2a, 18, 70); S.background = new T.Color(0x1a0e18);
  D.moonlight({ color: 0xffc8a0, intensity: .8, dir: [.2, 1, .6], ambient: 0x6a3a4a, ambientI: 2.4, sky: 0xd07a90, ground: 0x4a2a20 });
  const M = { floor: pbr('japanese_cedar_planks', [8, 3], { color: 0x8a4a3a, rough: .16, metal: .2 }), wall: pbr('weathered_planks', [3, 1], { color: 0x6a3a2a }), wood: pbr('japanese_cedar_planks', [.5, 1], { color: 0x7a3a2a, rough: .35 }),
    top: pbr('japanese_cedar_planks', [4, .4], { color: 0xa05a40, rough: .2 }), stool: new T.MeshStandardMaterial({ color: 0xc01a3a, roughness: .35 }), chrome: new T.MeshStandardMaterial({ color: 0xd0d0d8, metalness: .9, roughness: .2 }),
    shelf: new T.MeshStandardMaterial({ map: ctex(bottles(0)), emissiveMap: ctex(bottles(1)), emissive: 0xffffff, emissiveIntensity: 1 }), pink: new T.MeshStandardMaterial({ color: 0xffb0d0, emissive: 0xff5a9a, emissiveIntensity: 1.5 }),
    crt: new T.MeshBasicMaterial({ map: ctex(crt()) }), tvBody: new T.MeshStandardMaterial({ color: 0x2a2228, roughness: .5 }), glass: new T.MeshBasicMaterial({ map: ctex(glass()), color: 0xd0c0e0 }),
    velvet: new T.MeshStandardMaterial({ color: 0x9a1a2a, roughness: .7 }), bead: new T.MeshStandardMaterial({ color: 0xe0b060, metalness: .7, roughness: .3, emissive: 0x402000 }) };
  // ── the room: floor, back wall with the bar and bottle shelves, side walls, ceiling beams ──
  { const f = new T.Mesh(new T.PlaneGeometry(30, 14), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -1); f.receiveShadow = true; S.add(f); }
  box(30, 8, .4, M.wall, 0, 0, -8); box(.4, 8, 14, M.wall, -15, 0, -1); box(.4, 8, 14, M.wall, 15, 0, -1); box(30, .3, 14, M.wall, 0, 7.6, -1, { cast: false });
  for (let x = -13; x <= 13; x += 3.2) box(.3, .4, 14, M.wood, x, 7.2, -1, { cast: false });
  add(new T.PlaneGeometry(12, 3.4), M.shelf, 2, 3.8, -7.78, { cast: false }); box(12.4, .2, .6, M.wood, 2, 2, -7.5); box(12.4, .2, .6, M.wood, 2, 5.6, -7.5);
  box(14, 1.2, 1.4, M.wood, 2, 0, -5); box(14.4, .14, 1.8, M.top, 2, 1.2, -5); box(14, .06, .06, M.chrome, 2, .25, -4.2, { cast: false });
  for (let x = -4; x <= 8; x += 2) { add(new T.CylinderGeometry(.38, .34, .16, 16), M.stool, x, .9, -3.6); add(new T.CylinderGeometry(.05, .05, .84, 8), M.chrome, x, .42, -3.6); add(new T.CylinderGeometry(.3, .32, .04, 16), M.chrome, x, .02, -3.6); }
  for (let i = 0; i < 6; i++) add(new T.CylinderGeometry(.08, .1, .36, 8), new T.MeshStandardMaterial({ color: [0xe8e0c8, 0x3a6a3a, 0x8a3a1a][i % 3], roughness: .2 }), -2 + i * 1.8, 1.45, -5.3);
  // the CRT on the bar end
  { box(1.8, 1.4, 1.2, M.tvBody, 8, 1.3, -5.2); add(new T.PlaneGeometry(1.4, 1), M.crt, 8, 2.05, -4.59, { cast: false }); D.glow(8, 2.05, -4.3, 2.4, 0xc070ff); }
  // pink lanterns along the bar
  for (let i = 0; i < 5; i++) { const x = -3 + i * 2.6, l = add(new T.SphereGeometry(.45, 14, 10), M.pink, x, 5.8, -4.6, { cast: false }); l.scale.y = 1.25; box(.03, .9, .03, M.wood, x, 6.3, -4.6, { cast: false }); D.lantern(x, 5.8, -4.3, { color: 0xff7ab0, intensity: 9, distance: 8, glow: 1.1 }); }
  // ── left: the window onto the rainy street, the red booth and a little table ──
  { add(new T.PlaneGeometry(9, 4.4), viewMat('sky_neon', { u0: .04, u1: .96, v0: .28, v1: .92, tint: 0xe8d8f0 }), -14.8, 3.4, -2, { ry: Math.PI / 2, cast: false });
    const g = add(new T.PlaneGeometry(9, 4.4), new T.MeshBasicMaterial({ map: M.glass.map, color: 0xd0c0e0, transparent: true, opacity: .4, blending: T.AdditiveBlending, depthWrite: false }), -14.76, 3.4, -2, { ry: Math.PI / 2, cast: false });
    for (let k = 0; k < 4; k++) box(.2, 4.6, .2, M.wood, -14.7, 1.2, -6.4 + k * 3); box(.2, .2, 9.4, M.wood, -14.7, 5.6, -2); box(.2, .2, 9.4, M.wood, -14.7, 1.2, -2);
    box(1.4, 1, 6, M.velvet, -13.8, 0, -2); box(.5, 1.8, 6, M.velvet, -14.4, 1, -2);
    add(new T.CylinderGeometry(.7, .7, .06, 18), M.top, -11.6, 1.1, -2); add(new T.CylinderGeometry(.06, .06, 1.1, 8), M.chrome, -11.6, .55, -2);
    box(.4, .5, .4, new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffa040, emissiveIntensity: 1.6 }), -11.6, 1.13, -2.2, { cast: false }); D.lantern(-11.6, 1.5, -2, { intensity: 8, distance: 6, glow: .6 });
    await prop('sakura', -9.6, -6.6, 2.6, { y: 1.2, blob: false, shadow: false }); add(new T.SphereGeometry(.3, 12, 10), new T.MeshStandardMaterial({ color: 0xe0e0f0, roughness: .2 }), -9.6, 1.5, -6.6); }
  // ── right: the bead curtain doorway and a fan ──
  for (let k = 0; k < 18; k++) { const st = add(new T.CylinderGeometry(.03, .03, 4.2, 4), M.bead, 12 + k * .14, 2.1, -7.6, { cast: false }); D.updaters.push(t => { st.rotation.z = Math.sin(t * 1.2 + k * .4) * .02; }); }
  D.glow(13.2, 3, -7.4, 3, 0xffb060);
  // the street beyond the window: neon skyline in the rain
  for (let i = 0; i < 14; i++) neonTower(K, R.r(-24, -60), R.r(8, -24), R.r(6, 10), R.r(6, 10), R.r(16, 50), i + 3);
  rain(D, 300, [-30, -16], [0, 10], [-14, 8], { speed: 12 }); drift(D, 20, 0, -2, 10, 4, 0xffb0d0, { y0: 1, y1: 6, size: 5 });
  scatter(D, rng(97), { area: [-12, 12, -3, 5], petals: 30, petal: 0xff9ad0, puddles: 0 });
}
