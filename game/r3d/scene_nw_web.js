// Spider's Roof: Jorogumo's helipad high in the Neon Ward. Wet steel decking with a painted landing ring, a giant spider
// billboard, pink silk webs strung between the scaffolds and the railing, cocoons swaying in the strands, AC units and
// a dish, red beacon lights blinking, and the skyline in the rain under a pale moon.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, ctex, cvs, rain, skyline, neonTower, cityBlocks, groundFill, farPainting, scatter, clutter, drift } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.6]], sum: [-5.6, .8], exposure: 1.55 };

const ring = () => cvs(512, 512, (g, W) => { g.clearRect(0, 0, W, W); g.strokeStyle = '#e0a020'; g.lineWidth = 22; g.beginPath(); g.arc(W / 2, W / 2, 210, 0, 7); g.stroke(); g.lineWidth = 8; g.beginPath(); g.arc(W / 2, W / 2, 170, 0, 7); g.stroke();
  g.fillStyle = '#e0a020'; g.fillRect(W / 2 - 80, W / 2 - 90, 34, 180); g.fillRect(W / 2 + 46, W / 2 - 90, 34, 180); g.fillRect(W / 2 - 46, W / 2 - 17, 92, 34); });
const spider = () => cvs(512, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#6a1a6a'); gr.addColorStop(1, '#c02a9a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,190,240,.5)'; g.lineWidth = 2; for (let a = 0; a < 6.28; a += .4) { g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + Math.cos(a) * 400, H / 2 + Math.sin(a) * 400); g.stroke(); } for (let r = 20; r < 300; r += 26) { g.beginPath(); g.arc(W / 2, H / 2, r, 0, 7); g.stroke(); }
  g.fillStyle = '#1a0a1a'; g.beginPath(); g.ellipse(W / 2, H / 2 + 10, 40, 50, 0, 0, 7); g.fill(); g.beginPath(); g.arc(W / 2, H / 2 - 44, 22, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#1a0a1a';
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(W / 2, H / 2 - 10 + k * 14); g.quadraticCurveTo(W / 2 + s * 80, H / 2 - 60 + k * 30, W / 2 + s * 120, H / 2 + 30 + k * 26); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1); });

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(441);
  S.fog = new T.Fog(0x2e1a54, 30, 170); S.background = new T.Color(0x1c1240);
  D.moonlight({ color: 0xd8c8ff, intensity: 1.8, dir: [.3, 1, .4], ambient: 0x5a4a90, ambientI: 2.2, sky: 0xa880e0, ground: 0x3a2838 });
  sky(D, [[0, '#120a30'], [.6, '#36205e'], [1, '#6a2a7a']], { stars: 20 }); moon(D, 26, 48, -140, 20, [240, 220, 255], [200, 150, 255]);
  const M = { deck: pbr('metal_plate', [8, 3], { color: 0x8a80a0, rough: .15, metal: .55 }), conc: pbr('castle_wall_slates', [4, 1], { color: 0x7a7088 }), steel: pbr('metal_plate', [1, 2], { color: 0x5a5868, metal: .7, rough: .5 }),
    rust: pbr('rusty_metal_02', [1, 1], { color: 0x8a6a6a, metal: .5, rough: .6 }), ring: new T.MeshStandardMaterial({ map: ctex(ring()), transparent: true, roughness: .3, polygonOffset: true, polygonOffsetFactor: -2 }),
    silk: new T.MeshBasicMaterial({ color: 0xff8ae0, transparent: true, opacity: .55, depthWrite: false }), cocoon: new T.MeshStandardMaterial({ color: 0xf0d8f0, emissive: 0xc04aa0, emissiveIntensity: .5, roughness: .6 }),
    beacon: new T.MeshBasicMaterial({ color: 0xff2030 }), ac: new T.MeshStandardMaterial({ color: 0xb8b8c0, roughness: .5, metalness: .3 }) };
  // ── the pad: steel deck with its landing ring, a low railing, beacon lights ──
  box(34, 1, 12, M.deck, 0, -1, 0); add(new T.PlaneGeometry(9, 9), M.ring, 0, .02, 0, { rx: -Math.PI / 2, cast: false });
  box(34, .3, .4, M.conc, 0, 0, -5.8); for (let x = -16; x <= 16; x += 2) box(.12, 1.1, .12, M.steel, x, .3, -5.8, { cast: false }); box(34, .1, .1, M.steel, 0, 1.3, -5.8, { cast: false });
  const beacons = []; for (const x of [-15, -5, 5, 15]) { const b = add(new T.SphereGeometry(.16, 10, 8), M.beacon, x, 1.5, -5.8, { cast: false }); const gl = D.glow(x, 1.5, -5.6, 1.4, 0xff2030); beacons.push([b, gl]); }
  D.updaters.push(t => beacons.forEach(([b, gl], i) => { const on = Math.sin(t * 3 + i * 1.3) > .3; b.visible = on; gl.visible = on; }));
  // ── scaffold towers on both sides and the spider billboard on the left ──
  const scaffold = (x, z, w, h) => { for (const dx of [-w / 2, w / 2]) for (const dz of [-1, 1]) box(.24, h, .24, M.steel, x + dx, 0, z + dz); for (let y = 2; y < h; y += 2.5) { box(w, .14, .14, M.steel, x, y, z - 1, { cast: false }); box(w, .14, .14, M.steel, x, y, z + 1, { cast: false }); }
    for (let y = 0; y < h - 2; y += 2.5) add(new T.BoxGeometry(.08, 3.4, .08), M.steel, x, y + 1.25, z + 1, { rz: .7, cast: false }); };
  scaffold(-13, -7, 6, 14); scaffold(14, -6, 4, 11);
  { const bb = add(new T.PlaneGeometry(12, 6.6), new T.MeshBasicMaterial({ map: ctex(spider()) }), -10, 10.4, -7.8, { ry: .2, cast: false }); D.glow(-10, 10, -6.4, 12, 0xff40c0); D.lantern(-10, 8, -5, { color: 0xff60d0, intensity: 20, distance: 16, glow: 0 }); }
  // AC units, a satellite dish, crates
  for (const [x, z] of [[-15, -3.6], [-13.4, -3.6], [12.6, -3.4]]) { box(1.4, 1.1, .9, M.ac, x, 0, z); add(new T.CylinderGeometry(.4, .4, .06, 18), M.steel, x, .55, z + .46, { rx: Math.PI / 2, cast: false }); }
  { const d = add(new T.SphereGeometry(1.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.6), M.steel, 15.4, 3.6, -7, { rx: -1.1 }); box(.16, 3.2, .16, M.steel, 15.4, 0, -6.6); }
  // ── silk webs: radial strands and spiral rings strung between scaffolds and rail, cocoons hanging ──
  const web = (cx, cy, cz, r, ry) => { const g = new T.Group(); g.position.set(cx, cy, cz); g.rotation.y = ry; S.add(g);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, L = r * R.r(.85, 1.1); const st = new T.Mesh(new T.CylinderGeometry(.012, .012, L, 3), M.silk); st.position.set(Math.cos(a) * L / 2, Math.sin(a) * L / 2, 0); st.rotation.z = a - Math.PI / 2; g.add(st); }
    for (let rr = r * .15; rr < r; rr += r * .12) { const t = new T.Mesh(new T.TorusGeometry(rr, .01, 3, 12), M.silk); g.add(t); } return g; };
  web(-8, 9, -6.6, 6, .1); web(12, 7.6, -5.4, 4.4, -.2); web(0, 13, -12, 8, 0);
  for (let i = 0; i < 6; i++) { const x = R.r(-12, 12), y = R.r(6, 11), z = R.r(-7, -10); const c = add(new T.SphereGeometry(.36, 10, 8), M.cocoon, x, y, z); c.scale.y = 1.9; add(new T.CylinderGeometry(.012, .012, 2.4, 3), M.silk, x, y + 1.6, z, { cast: false });
    D.updaters.push(t => { c.rotation.z = Math.sin(t * .8 + i) * .12; c.position.x = x + Math.sin(t * .8 + i) * .12; }); }
  // ── the city around and below ──
  groundFill(D, pbr('asphalt_02', [40, 40], { color: 0x2a2440, rough: .3, metal: .3 }), { y: -30, z0: -6, z1: -160 });
  cityBlocks(K, D, R, { x0: -50, x1: 50, z0: -16, z1: -40, n: 26, hMin: 14, hMax: 30, y: -30 }); skyline(K, D, R, { zNear: -44, zFar: -140, n: 50, spread: 100, y: -30 });
  farPainting(D, 'nw_web', { v1: .55, z: -144, yb: -30, h: 150 });
  rain(D, 1000, [-24, 24], [0, 18], [-30, 8], { speed: 14 }); drift(D, 40, 0, -10, 20, 10, 0xff8ae0, { y0: 1, y1: 12, size: 6 });
  scatter(D, rng(103), { area: [-15, 15, -5, 5.5], puddles: 12, pebbles: 30, stone: 0x4a4458 });
}
