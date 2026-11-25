// Pachinko Parlour: the main aisle of a blazing pachinko hall. Rows of machines down both sides with flickering screens
// and spinning wheels, red seats, stacked ball boxes, a sakura-and-swirl carpet, a ring chandelier overhead, rising-sun
// and wave panels, and the aisle running back to a glowing counter. Coins of light everywhere.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, scatter, drift, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -3.4]], sum: [-5.2, .8], exposure: 1.4 };

const carpet = () => { const R = rng(3); return cvs(512, 512, (g, W, H) => { g.fillStyle = '#8a1a2a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e0a040'; g.lineWidth = 5;
  for (let i = 0; i < 6; i++) { g.beginPath(); for (let x = 0; x <= W; x += 8) g.lineTo(x, i * 90 + 40 + Math.sin(x * .02 + i) * 30); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H, r = R.r(10, 22); g.fillStyle = '#f0a0b8'; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .5, r * .32, a, 0, 7); g.fill(); } g.fillStyle = '#ffe0a0'; g.beginPath(); g.arc(x, y, r * .2, 0, 7); g.fill(); } }); };
const machine = (sd, glow) => { const R = rng(sd); return cvs(128, 256, (g, W, H) => { g.fillStyle = glow ? '#000' : '#d8c070'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(64, 100, 6, 64, 100, 56); gr.addColorStop(0, '#fff0f8'); gr.addColorStop(.4, `hsl(${R.r(280, 340)},90%,60%)`); gr.addColorStop(1, '#3a0a4a'); g.fillStyle = gr; g.beginPath(); g.arc(64, 100, 56, 0, 7); g.fill();
  g.strokeStyle = '#ffd040'; g.lineWidth = 6; g.beginPath(); g.arc(64, 100, 56, 0, 7); g.stroke(); g.fillStyle = glow ? '#ff40c0' : '#ff5ac8'; g.fillRect(8, 6, W - 16, 22); g.fillStyle = glow ? '#40e0ff' : '#5ae0ff'; g.fillRect(14, 176, W - 28, 16);
  g.fillStyle = glow ? '#000' : '#2a1a1a'; g.fillRect(20, 200, W - 40, 40); g.fillStyle = '#e0e0e8'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(R.r(26, 102), R.r(204, 236), 3, 0, 7); g.fill(); } }); };
const panel = kind => cvs(256, 256, (g, W, H) => { if (kind === 'sun') { g.fillStyle = '#f4e8dc'; g.fillRect(0, 0, W, H); g.fillStyle = '#c01a2a'; for (let i = 0; i < 16; i += 2) { g.beginPath(); g.moveTo(W / 2, H); g.arc(W / 2, H, W, Math.PI + i * Math.PI / 16, Math.PI + (i + 1) * Math.PI / 16); g.fill(); } g.beginPath(); g.arc(W / 2, H, 50, 0, 7); g.fill(); }
  else { g.fillStyle = '#1a2a6a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f0f0ff'; g.lineWidth = 5; for (let y = 40; y < H + 40; y += 40) for (let x = (y / 40 % 2) * 30; x < W + 60; x += 60) for (let r = 28; r > 6; r -= 9) { g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.stroke(); } } });

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(401);
  S.fog = new T.Fog(0x4a1a3a, 20, 80); S.background = new T.Color(0x200a1c);
  D.moonlight({ color: 0xffd0e0, intensity: .8, dir: [.1, 1, .5], ambient: 0x8a3a6a, ambientI: 2.6, sky: 0xff9ad0, ground: 0x6a1a2a });
  const M = { carpet: new T.MeshStandardMaterial({ map: ctex(carpet(), [3, 8]), roughness: .85 }), gold: new T.MeshStandardMaterial({ color: 0xd9a441, metalness: .8, roughness: .3 }), chrome: new T.MeshStandardMaterial({ color: 0xd0d0d8, metalness: .9, roughness: .2 }),
    seat: new T.MeshStandardMaterial({ color: 0xc0182a, roughness: .35 }), dark: new T.MeshStandardMaterial({ color: 0x1a1018, roughness: .6 }), ceil: new T.MeshStandardMaterial({ color: 0x2a0a24, roughness: .8 }),
    sun: new T.MeshStandardMaterial({ map: ctex(panel('sun')) }), wave: new T.MeshStandardMaterial({ map: ctex(panel('wave')) }), balls: new T.MeshStandardMaterial({ color: 0xe8e8f0, metalness: .9, roughness: .15 }) };
  { const f = new T.Mesh(new T.PlaneGeometry(26, 70), M.carpet); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -28); f.receiveShadow = true; S.add(f); }
  box(26, .4, 70, M.ceil, 0, 8, -28, { cast: false });
  // ── the machine rows: back-to-back banks down both sides of the aisle, each machine its own flickering screen ──
  const mats = []; for (let i = 0; i < 6; i++) mats.push(new T.MeshStandardMaterial({ map: ctex(machine(i + 2)), emissiveMap: ctex(machine(i + 2, 1)), emissive: 0xffffff, emissiveIntensity: 1.2 }));
  for (const s of [-1, 1]) for (let z = 2, i = 0; z > -60; z -= 1.5, i++) { const x = s * 8.4, m = mats[(i + (s > 0 ? 3 : 0)) % 6];
    box(1.3, 1, 1, M.dark, x, 0, z); const face = add(new T.BoxGeometry(.2, 2.4, 1.3), [m, m, M.gold, M.gold, M.gold, M.gold], x - s * .6, 1, z);
    box(.8, .14, 1.1, M.gold, x - s * .7, 3.4, z, { cast: false }); box(.2, .5, 1.2, new T.MeshBasicMaterial({ color: [0xff40c0, 0x40e0ff, 0xffd040][i % 3] }), x - s * .62, 3.75, z, { cast: false });
    const seat = add(new T.BoxGeometry(.8, .16, .8), M.seat, x - s * 1.6, .7, z); add(new T.BoxGeometry(.16, 1, .8), M.seat, x - s * 1.25, 1.2, z); add(new T.CylinderGeometry(.06, .06, .7, 6), M.chrome, x - s * 1.6, .35, z);
    if (i % 4 === 1) { for (let k = 0; k < 3; k++) { box(.7, .4, .5, M.chrome, x - s * 2.6, k * .42, z + .2, { cast: false }); box(.62, .06, .42, M.balls, x - s * 2.6, k * .42 + .36, z + .2, { cast: false }); } }
    if (i % 3 === 0) D.lantern(x - s * 1.4, 2.4, z, { color: [0xff60c0, 0x60d0ff, 0xffc060][i % 3], intensity: 8, distance: 6, glow: 0 }); }
  D.updaters.push(t => mats.forEach((m, i) => { m.emissiveIntensity = 1 + Math.sin(t * (6 + i) + i) * .25 + (Math.sin(t * 23 + i * 7) > .92 ? .6 : 0); }));
  // ── wall panels above the machines: rising sun and waves ──
  for (const s of [-1, 1]) for (let z = 0, i = 0; z > -60; z -= 5, i++) add(new T.PlaneGeometry(4.4, 2.6), i % 2 ? M.wave : M.sun, s * 9.1, 5.6, z, { ry: -s * Math.PI / 2, cast: false });
  // ── the ring chandeliers down the aisle ──
  for (const z of [-6, -22, -40]) { const g = new T.Group(); g.position.set(0, 7, z); S.add(g); K.add(new T.TorusGeometry(3, .16, 8, 40), M.gold, 0, 0, 0, { to: g, rx: Math.PI / 2, cast: false });
    K.add(new T.TorusGeometry(2.2, .5, 8, 40), new T.MeshBasicMaterial({ color: 0xff70d0 }), 0, -.3, 0, { to: g, rx: Math.PI / 2, cast: false }); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; K.add(new T.SphereGeometry(.14, 8, 6), new T.MeshBasicMaterial({ color: 0xfff0b0 }), Math.cos(a) * 3, -.2, Math.sin(a) * 3, { to: g, cast: false }); }
    D.glow(0, 6.4, z, 9, 0xff80d0); D.lantern(0, 6, z, { color: 0xffa0e0, intensity: 24, distance: 16, glow: 0 }); D.updaters.push(t => { g.rotation.y = t * .2; }); }
  // ── the far counter ──
  box(10, 1.4, 1.6, M.gold, 0, 0, -58); box(12, 3, .3, new T.MeshBasicMaterial({ color: 0xff60c0 }), 0, 3, -60, { cast: false }); D.glow(0, 3, -59, 12, 0xff60c0);
  drift(D, 60, 0, -20, 6, 30, 0xffe0a0, { y0: 1, y1: 7, size: 6 });
  scatter(D, rng(99), { area: [-6, 6, -3, 5], pebbles: 30, stone: 0xe0e0f0 });
  decals(D, rng(656), { area: [-6, 6, -3, 5], list: [['gum', 3, [.8, 1.4]], ['paper', 2, [.9, 1.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1197), { area: [-7, 7, -8, 3], items: [['wooden_stool_01', 2, [.5, .6]]] });   // real CC0 models placed where they fit (kit.dress)
}
