// Star Casino: the high-roller floor of the Neon Ward casino. A red carpet with a gold star inlay, gilded columns, the
// great star chandelier dripping crystal, velvet ropes on brass posts, slot banks, a roulette wheel and card tables, red
// drapes and star banners, cherry blossom in urns, and a wall of glass onto the rain-lit skyline.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, bannerTex, skyline, rain, drift, scatter, farPainting, decals } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -3]], sum: [-5.2, .8], exposure: 1.4 };

const carpet = () => { const R = rng(7); return cvs(1024, 1024, (g, W, H) => { g.fillStyle = '#9a1420'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d89a3a'; g.lineWidth = 6;
  for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * H; g.beginPath(); g.arc(x, y, R.r(20, 60), R() * 6, R() * 6 + 3); g.stroke(); }
  g.strokeStyle = '#f0c050'; g.lineWidth = 10; g.beginPath(); g.arc(W / 2, H / 2, 300, 0, 7); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(W / 2, H / 2, 330, 0, 7); g.stroke();
  g.fillStyle = '#f0c050'; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 60 : 260; g.lineTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); } g.closePath(); g.fill(); }); };
const slot = (sd, glow) => { const R = rng(sd); return cvs(128, 256, (g, W, H) => { g.fillStyle = glow ? '#000' : '#c8a040'; g.fillRect(0, 0, W, H); g.fillStyle = glow ? '#ff80d0' : '#ffd0f0'; g.fillRect(12, 20, W - 24, 60);
  g.fillStyle = glow ? '#fff0a0' : '#fff8e0'; for (let k = 0; k < 3; k++) g.fillRect(16 + k * 34, 100, 28, 50); g.fillStyle = '#c01a2a'; for (let k = 0; k < 3; k++) { g.font = 'bold 26px serif'; g.fillText(['7', '★', '♦'][(k + sd) % 3], 22 + k * 34, 136); }
  g.fillStyle = glow ? '#40e0ff' : '#80f0ff'; g.fillRect(12, 170, W - 24, 14); }); };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(421);
  S.fog = new T.Fog(0x3a1838, 26, 150); S.background = new T.Color(0x1e0e26);
  D.moonlight({ color: 0xffd0a0, intensity: 1, dir: [.1, 1, .6], ambient: 0x8a4a4a, ambientI: 2.4, sky: 0xffb080, ground: 0x6a1a1a });
  const M = { carpet: new T.MeshStandardMaterial({ map: ctex(carpet(), [1, 1]), roughness: .85 }), gold: new T.MeshStandardMaterial({ color: 0xd9a441, metalness: .85, roughness: .28 }), brass: new T.MeshStandardMaterial({ color: 0xc89a3a, metalness: .9, roughness: .25 }),
    velvet: new T.MeshStandardMaterial({ color: 0x9a1020, roughness: .7, side: T.DoubleSide }), felt: new T.MeshStandardMaterial({ color: 0x1a6a3a, roughness: .9 }), wood: pbr('japanese_cedar_planks', [1, 1], { color: 0x6a2a1a, rough: .25 }),
    crystal: new T.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc060, emissiveIntensity: 1.6, metalness: .3, roughness: .1 }), seat: new T.MeshStandardMaterial({ color: 0xa01020, roughness: .4 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#a01a28', '#701020'], trim: '#e3b552', sd: 81, emblem: (g, cx, cy) => { g.fillStyle = '#f0c766'; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = k % 2 ? 22 : 80; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); } })), side: T.DoubleSide, alphaTest: .4 }) };
  // ── floor: the star carpet (its star under the fight) running to the windows ──
  { const f = new T.Mesh(new T.PlaneGeometry(40, 30), M.carpet); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -6); f.receiveShadow = true; S.add(f); }
  // ── gilded columns, drapes and banners ──
  for (const x of [-14, -7, 7, 14]) { add(new T.CylinderGeometry(.7, .8, 10, 16), M.gold, x, 5, -10); add(new T.CylinderGeometry(1.1, 1.1, .6, 16), M.gold, x, .3, -10); add(new T.CylinderGeometry(1.1, .8, .8, 16), M.gold, x, 9.8, -10); D.glow(x, 6, -9.2, 2, 0xffb060); }
  for (const x of [-10.5, 10.5]) { const b = new T.Mesh(new T.PlaneGeometry(1.8, 4.6, 1, 6), M.ban); b.geometry.translate(0, -2.3, 0); b.position.set(x, 9.4, -10); S.add(b); }
  box(44, .8, 1, M.velvet, 0, 10, -10.4, { cast: false }); for (let x = -20; x < 21; x += 4) { const d = add(new T.CylinderGeometry(1.4, 1.4, .6, 12, 1, true, 0, Math.PI), M.velvet, x, 9.6, -10.3, { rz: Math.PI / 2, cast: false }); d.scale.set(1, 3, .6); }
  // ── the great star chandelier ──
  { const g = new T.Group(); g.position.set(0, 12, -6); S.add(g); const star = new T.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 1.2 : 3; k ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const sg = new T.ExtrudeGeometry(star, { depth: .5, bevelEnabled: true, bevelSize: .1, bevelThickness: .1 }); sg.center(); const sm = new T.Mesh(sg, M.crystal); sm.rotation.x = -Math.PI / 2; g.add(sm);
    K.add(new T.TorusGeometry(5, .2, 8, 48), M.gold, 0, .4, 0, { to: g, rx: Math.PI / 2, cast: false });
    for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2, l = 1 + (k % 3) * .6; K.add(new T.CylinderGeometry(.04, .04, l, 4), M.crystal, Math.cos(a) * 4.8, -l / 2 + .3, Math.sin(a) * 4.8, { to: g, cast: false }); }
    D.glow(0, 12, -6, 16, 0xffc060); D.lantern(0, 10, -6, { color: 0xffd080, intensity: 40, distance: 22, glow: 0 }); D.updaters.push(t => { g.rotation.y = t * .06; }); }
  // ── velvet ropes on brass posts, separating the floor from the tables ──
  const posts = [-12, -8, -4, 4, 8, 12]; for (const x of posts) { add(new T.CylinderGeometry(.08, .1, 1.1, 10), M.brass, x, .55, -4); add(new T.SphereGeometry(.14, 10, 8), M.brass, x, 1.15, -4); add(new T.CylinderGeometry(.3, .34, .08, 14), M.brass, x, .04, -4); }
  for (let i = 0; i < posts.length - 1; i++) { if (posts[i] < 0 && posts[i + 1] > 0) continue; const a = new T.Vector3(posts[i], 1, -4), b = new T.Vector3(posts[i + 1], 1, -4), m = a.clone().lerp(b, .5); m.y -= .3; add(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, m, b), 12, .05, 6), M.velvet, 0, 0, 0); }
  // ── slot banks (left), roulette and card tables (right), with chairs ──
  const sm = []; for (let i = 0; i < 4; i++) sm.push(new T.MeshStandardMaterial({ map: ctex(slot(i)), emissiveMap: ctex(slot(i, 1)), emissive: 0xffffff, emissiveIntensity: 1.1 }));
  for (let i = 0; i < 6; i++) { const x = -17 + i * 1.6, z = -8.5; box(1.3, 1.2, 1.1, M.gold, x, 0, z); add(new T.BoxGeometry(1.2, 2.2, .2), [M.gold, M.gold, M.gold, M.gold, sm[i % 4], M.gold], x, 2.3, z + .4); const c = box(.9, .9, .9, M.seat, x, 0, z + 1.6); }
  D.updaters.push(t => sm.forEach((m, i) => { m.emissiveIntensity = 1 + Math.sin(t * 5 + i * 2) * .3; }));
  { const rx = 11, rz = -7; box(4, .9, 2.4, M.wood, rx, 0, rz); box(4.2, .1, 2.6, M.felt, rx, .9, rz); const wheel = add(new T.CylinderGeometry(.8, .8, .2, 24), M.gold, rx - 1, 1.05, rz); D.updaters.push((t, dt) => { wheel.rotation.y += (dt || .016) * 2; });
    for (const dx of [-1.4, 0, 1.4]) { add(new T.CylinderGeometry(.06, .06, .9, 6), M.brass, rx + dx, .45, rz + 1.9); const s = box(.8, .14, .8, M.seat, rx + dx, .9, rz + 1.9); } }
  { const cx = 16, cz = -3; add(new T.CylinderGeometry(1.8, 1.8, .14, 24), M.felt, cx, .9, cz); add(new T.CylinderGeometry(.3, .5, .9, 12), M.wood, cx, .45, cz); D.lantern(cx, 2.4, cz, { intensity: 10, distance: 7, glow: 0 }); }
  for (const x of [-18, 18]) { add(new T.CylinderGeometry(.6, .4, 1.4, 14), M.gold, x, .7, -1); await prop('sakura', x, -1, 4, { y: 1.3, blob: false }); }
  // ── the window wall and the city beyond ──
  { const fr = new T.MeshStandardMaterial({ color: 0x2a1a10, metalness: .6, roughness: .4 }); for (let x = -20; x <= 20; x += 4) box(.25, 12, .25, fr, x, 0, -20.6); box(44, .3, .3, fr, 0, 6, -20.6); box(44, .4, .4, fr, 0, 12, -20.6); }
  skyline(K, D, R, { zNear: -30, zFar: -120, n: 40, spread: 70 }); farPainting(D, 'nw_casino', { v0: .1, v1: .55, z: -144 });
  rain(D, 400, [-20, 20], [0, 14], [-40, -22], { speed: 12 }); drift(D, 50, 0, -6, 14, 6, 0xffd080, { y0: 2, y1: 10, size: 6 });
  scatter(D, rng(101), { area: [-14, 14, -3, 5], petals: 60, petal: 0xffb0d0 });
  decals(D, rng(649), { area: [-14, 14, -3, 5], list: [['stain', 2, [1, 1.6], { op: .6 }]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
}
