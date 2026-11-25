// Mountain Pass: a snowbound flagstone path at sunset. Rope rails on snow-capped posts lead up to a lantern-lit cave
// under icicles; crimson laurel banners snap in the wind, a rope bridge spans the gorge to a watchtower, and the
// range rolls away above a sea of cloud.
import { T } from './diorama.js';
import { kit, rng, sky, pbr, stoneLantern, drift, bannerTex, ctex, cvs, farPainting, groundFill, scatter, cityBlocks, walkers, clutter } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2.2], [-4.2, -2.6], [2, -4.6]], sum: [-5.6, .8], exposure: 1.25 };

const laurel = (g, cx, cy) => { g.strokeStyle = '#f0c766'; g.fillStyle = '#f0c766'; g.lineWidth = 6;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx, cy, 64, Math.PI / 2 + s * .15, Math.PI / 2 + s * 2.9, s < 0); g.stroke();
    for (let k = 0; k < 7; k++) { const a = Math.PI / 2 + s * (.45 + k * .37); g.save(); g.translate(cx + Math.cos(a) * 64, cy + Math.sin(a) * 64); g.rotate(a + s * .9); g.beginPath(); g.ellipse(0, 0, 16, 6, 0, 0, 7); g.fill(); g.restore(); } } };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(131);
  S.fog = new T.Fog(0xc8b0c8, 40, 190); S.background = new T.Color(0xb8a0c0);
  D.moonlight({ color: 0xffd0a0, intensity: 3.2, dir: [-.3, .7, -1], ambient: 0x8a90c0, ambientI: 2.4, sky: 0xb0b8ff, ground: 0xc0b0b8 });
  sky(D, [[0, '#4a5aa8'], [.4, '#8a90d0'], [.7, '#e0a8b8'], [.86, '#ffc890'], [1, '#ffe0a0']], { stars: 0 });
  { const sun = new T.Sprite(new T.SpriteMaterial({ map: ctex(cvs(256, 256, (g, W) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(.18, 'rgba(255,230,160,1)'); gr.addColorStop(.45, 'rgba(255,180,110,.35)'); gr.addColorStop(1, 'rgba(255,150,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); })), fog: false, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    sun.position.set(-12, 22, -140); sun.scale.set(60, 60, 1); S.add(sun); }
  const M = {
    path: pbr('snowy_flags', [3, 6], { color: 0xe0d8e8, rough: .7, ns: 1.3 }),
    snow: pbr('snow_02', [20, 20], { nmap: 'snowy_rock', rmap: 'snowy_rock', color: 0xf4f0ff, rough: .6 }),
    rock: pbr('snowy_rock', [2, 2], { color: 0xc8c0d8, ns: 1.8 }), cliff: pbr('rock_face', [4, 6], { color: 0x8a8098, ns: 2 }),
    stone: pbr('castle_wall_slates', [.5, .5], { color: 0xc0b8c8 }), wood: pbr('weathered_planks', [.4, 1], { color: 0xa07868 }),
    rope: new T.MeshStandardMaterial({ color: 0xb89060, roughness: 1 }), ice: new T.MeshStandardMaterial({ color: 0xd8f0ff, roughness: .15, metalness: .1, transparent: true, opacity: .85, emissive: 0x4080a0, emissiveIntensity: .2 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#a01a28', '#7a1020'], trim: '#e3b552', emblem: laurel, sd: 31 })), side: T.DoubleSide, alphaTest: .4, roughness: .9 }),
    pen: new T.MeshStandardMaterial({ color: 0xc02030, side: T.DoubleSide }), peak: new T.MeshStandardMaterial({ color: 0x8a90b8, roughness: 1, flatShading: true }), peakS: new T.MeshStandardMaterial({ color: 0xf8f4ff, roughness: .8, flatShading: true }),
    cloud: new T.MeshBasicMaterial({ color: 0xf0e8f8, transparent: true, opacity: .55, depthWrite: false }),
  };
  // ── the ledge: snowfield, the flagstone path winding up-right to the cave ──
  box(40, 2, 14, M.snow, 0, -2, 1);
  { const m = new T.Mesh(new T.PlaneGeometry(14, 40), M.path); m.rotation.x = -Math.PI / 2; m.rotation.z = -.5; m.position.set(4, .02, -10); m.receiveShadow = true; S.add(m);
    const f = new T.Mesh(new T.PlaneGeometry(24, 8), M.path); f.rotation.x = -Math.PI / 2; f.position.set(0, .015, 1.5); f.receiveShadow = true; S.add(f); }
  // steps climbing to the cave mouth
  for (let i = 0; i < 8; i++) box(4.4, .4, 1.1, M.stone, 14 + i * .9, i * .4, -18 - i * 1.1, { ry: -.5 });
  // ── the cliff on the right with the cave, its lanterns and icicles ──
  { for (let i = 0; i < 9; i++) { const b = add(new T.DodecahedronGeometry(R.r(5, 9), 1), M.cliff, R.r(20, 30), R.r(2, 16), R.r(-10, -34), { ry: R() * 6 }); b.scale.set(1, R.r(1, 1.6), 1); }
    const mouth = new T.Mesh(new T.CircleGeometry(3, 20, 0, Math.PI), new T.MeshBasicMaterial({ color: 0x2a1a10 })); mouth.position.set(22.6, 3.2, -26.4); mouth.rotation.y = -.6; S.add(mouth);
    D.glow(22.4, 4, -25.8, 6, 0xffa040); for (const dx of [-3.4, 3.4]) { box(.2, 2.4, .2, M.wood, 22.6 + dx * .8, 3.2, -26 + dx * .6); D.lantern(22.6 + dx * .8, 5.8, -25.8 + dx * .6, { intensity: 20, distance: 10, glow: 1 }); }
    for (let i = 0; i < 30; i++) { const x = R.r(14, 28), z = R.r(-8, -30), y = R.r(7, 14), h = R.r(.6, 2.6); add(new T.ConeGeometry(R.r(.08, .22), h, 5), M.ice, x, y - h / 2, z, { rx: Math.PI, cast: false }); }
    for (let i = 0; i < 8; i++) { const b = add(new T.DodecahedronGeometry(R.r(1, 2.4), 1), M.rock, R.r(9, 15), R.r(-.4, .6), R.r(1, -12), { ry: R() * 6 }); b.scale.y = .7; } }
  // ── rope rail on snow-capped posts along the path's left edge, stone lanterns ──
  const posts = [[-11, -3.6], [-7, -3.8], [-3, -3.9], [1, -4.6], [4.6, -7.4], [7.6, -10.6], [10.4, -14]];
  for (const [x, z] of posts) { add(new T.CylinderGeometry(.22, .26, 1.4, 10), M.wood, x, .7, z); add(new T.SphereGeometry(.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.snow, x, 1.38, z).scale.y = .6; }
  for (let i = 0; i < posts.length - 1; i++) { const a = new T.Vector3(posts[i][0], 1.15, posts[i][1]), b = new T.Vector3(posts[i + 1][0], 1.15, posts[i + 1][1]), m = a.clone().lerp(b, .5); m.y -= .4; add(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, m, b), 14, .06, 5), M.rope, 0, 0, 0); }
  for (const [x, z, s] of [[-12.4, -1.8, 1.3], [-8.6, -.6, .9], [9.6, -7.6, 1.1], [13.2, -15, 1.1]]) { stoneLantern(D, K, x, z, s, { mat: M.stone }); add(new T.ConeGeometry(.66 * s, .2 * s, 4), M.snow, x, 1.98 * s + .05, z, { ry: Math.PI / 4 }); }
  // ── the left ledge: banner poles, rocks, red plum shrubs ──
  const banner = (x, z, h, flag) => { add(new T.CylinderGeometry(.09, .11, h, 8), M.wood, x, h / 2, z); box(1.5, .07, .07, M.wood, x + .7, h - .3, z, { cast: false });
    const b = new T.Mesh(new T.PlaneGeometry(flag ? 1.8 : 1.3, flag ? .8 : 3.6, 6, 6), flag ? M.pen : M.ban); b.geometry.translate(flag ? .9 : 0, flag ? 0 : -1.8, 0); b.position.set(flag ? x : x + .75, h - .35, z + .05); b.castShadow = true; S.add(b);
    D.updaters.push(t => { b.rotation.y = (flag ? -.3 : 0) + Math.sin(t * 1.6 + x) * .22 * (D.wind || 1); }); };
  banner(-13, -5, 8.4); banner(-9.6, -9, 6.6, true); banner(-7.8, -13, 5.2); banner(15.6, -20, 5);
  for (let i = 0; i < 7; i++) { const b = add(new T.DodecahedronGeometry(R.r(1.2, 2.6), 1), M.rock, R.r(-18, -11), R.r(-.4, .8), R.r(2, -6), { ry: R() * 6 }); b.scale.y = .7; }
  for (const [x, z, h] of [[-13.6, 3, 2.6], [12.8, 3.4, 2.4], [-15.6, -1, 2]]) await prop('sakura', x, z, h, { tint: 0xff3030, flip: x > 0, sway: .01 });
  // ── the gorge: rope bridge to a watchtower on a crag ──
  { const tx = -14, tz = -36; const crag = add(new T.ConeGeometry(5, 26, 6), M.cliff, tx, -6, tz, { cast: false }); crag.scale.z = .7;
    box(3, 4, 3, M.stone, tx, 7, tz); add(new T.ConeGeometry(2.8, 1.6, 4), M.peak, tx, 11.8, tz, { ry: Math.PI / 4 }); D.glow(tx, 9, tz + 1.6, 2, 0xffa040);
    const a = new T.Vector3(-7.4, 1.2, -16), b = new T.Vector3(tx + 1.4, 7.2, tz + 1.4);
    for (const off of [-.7, .7]) { const p0 = a.clone().add(new T.Vector3(off, 0, 0)), p1 = b.clone().add(new T.Vector3(off, 0, 0)), m = p0.clone().lerp(p1, .5); m.y -= 2.4;
      const c = new T.QuadraticBezierCurve3(p0, m, p1); add(new T.TubeGeometry(c, 30, .04, 4), M.rope, 0, 0, 0, { cast: false }); const c2 = new T.QuadraticBezierCurve3(p0.clone().setY(p0.y + .9), m.clone().setY(m.y + .9), p1.clone().setY(p1.y + .9)); add(new T.TubeGeometry(c2, 30, .03, 4), M.rope, 0, 0, 0, { cast: false });
      if (off < 0) for (let k = 0; k <= 30; k++) { const p = c.getPoint(k / 30); box(1.6, .08, .3, M.wood, p.x + .7, p.y - .04, p.z, { cast: false, ry: -.3 }); } }
    box(.3, 2.2, .3, M.wood, -8, 0, -16.2); box(.3, 2.2, .3, M.wood, -6.6, 0, -15.8); }
  // ── the range: snow-capped peaks over a sea of cloud, ice motes in the air ──
  for (let i = 0; i < 22; i++) { const x = R.r(-110, 70), z = R.r(-70, -150), h = R.r(26, 60), r = h * R.r(.5, .75);
    add(new T.ConeGeometry(r, h, 6), M.peak, x, h / 2 - 14, z, { cast: false, ry: R() * 3 }); add(new T.ConeGeometry(r * .38, h * .38, 6), M.peakS, x, h - 14 - h * .19 + .1, z, { cast: false, ry: R() * 3 }); }
  for (let i = 0; i < 26; i++) { const c = add(new T.PlaneGeometry(R.r(30, 70), R.r(6, 12)), M.cloud, R.r(-90, 60), R.r(-10, -2), R.r(-40, -110), { cast: false, rx: -Math.PI / 2 + .3 }); D.updaters.push(t => { c.position.x += Math.sin(t * .05 + i) * .004; }); }
  drift(D, 120, 0, -6, 18, 10, 0xffffff, { y0: 0, y1: 9, size: 7 }); D.petals(30, -12, 0, 6, { color: 0xff5050 });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(471);
  farPainting(D, 'mountain_pass', { v1: .45, z: -145, tint: 0xffffff });
  scatter(D, R2, { area: [-14, 14, -4, 7], pebbles: 90, stone: 0x8a8498, tufts: 40, tuft: 0x8a7a5a, leaves: 70, leaf: 0xd02424 });
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'wild', { area: [-18, 16, -5, -16], n: 22, clear: 5 });
}
