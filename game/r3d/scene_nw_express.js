// Neon Expressway: the shoulder of a rain-soaked elevated highway. Lane lines glint, a concrete barrier with amber
// marker lights holds the edge, hazard barriers and a chain fence on the left, and the expressway curves away into a
// skyline of screens and neon under a red moon. Cars stream past as light trails.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, ctex, cvs, rain, skyline, billboard, neonTower, drift, farPainting, groundFill, scatter, cityBlocks } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.4]], sum: [-5.6, .8], exposure: 1.6 };

const fence = () => cvs(256, 256, (g, W, H) => { g.strokeStyle = '#b0b0c0'; g.lineWidth = 3; for (let i = -W; i < W * 2; i += 24) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke(); g.beginPath(); g.moveTo(i, 0); g.lineTo(i - H, H); g.stroke(); } });
const hazard = () => cvs(256, 64, (g, W, H) => { g.fillStyle = '#e8a020'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a1a1a'; for (let x = -64; x < W; x += 48) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 24, H); g.lineTo(x + 48, 0); g.lineTo(x + 24, 0); g.fill(); } });

// low-poly cars built from boxes: body, cabin with dark glass, wheels, head/tail lights, neon underglow
const PAINT = [0xc81e3a, 0x1e5ac8, 0xf0f0f4, 0x1a1a22, 0xe0b020, 0x7a2ad0];
function makeCar(K, kind, R) {
  const g = new T.Group(), paint = new T.MeshStandardMaterial({ color: PAINT[(R() * PAINT.length) | 0], metalness: .7, roughness: .25 }), glass = new T.MeshStandardMaterial({ color: 0x0a0a14, metalness: .9, roughness: .1 });
  const tyre = new T.MeshStandardMaterial({ color: 0x111114, roughness: .8 }), head = new T.MeshBasicMaterial({ color: 0xfff4d8 }), tail = new T.MeshBasicMaterial({ color: 0xff2030 });
  const b = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const L = kind === 'truck' ? 9 : kind === 'van' ? 5 : 4.4, W = kind === 'truck' ? 2.5 : 1.9, H = kind === 'sport' ? .55 : kind === 'van' ? 1.6 : kind === 'truck' ? 1.2 : .7;
  if (kind === 'truck') { b(6.2, 2.8, W, new T.MeshStandardMaterial({ color: 0xd8d8e0, roughness: .6 }), -1.3, 1.9, 0); b(2.4, 2.2, W, paint, 3.2, 1.6, 0); b(.1, .9, W * .9, glass, 4.42, 2.2, 0); }
  else { b(L, H, W, paint, 0, .35 + H / 2, 0); const cl = kind === 'van' ? L * .75 : L * .48, ch = kind === 'sport' ? .45 : kind === 'van' ? .6 : .55;
    b(cl, ch, W * .86, glass, kind === 'van' ? -.2 : -.3, .35 + H + ch / 2, 0); b(cl * .9, .06, W * .82, paint, kind === 'van' ? -.2 : -.3, .35 + H + ch, 0);
    if (kind === 'sport') b(.5, .06, W * .9, paint, -L / 2 + .2, .35 + H + .3, 0); }
  const fx = (kind === 'truck' ? 4.4 : L / 2) + .01, rx = kind === 'truck' ? -4.4 : -L / 2 - .01, ly = kind === 'truck' ? .9 : .35 + H * .6;
  for (const s of [-1, 1]) { b(.06, .16, .34, head, fx, ly, s * (W / 2 - .3)); b(.06, .14, .4, tail, rx, ly, s * (W / 2 - .3)); }
  const wx = kind === 'truck' ? [-3.6, -2.4, 3.2] : [-L / 2 + .8, L / 2 - .8];
  for (const x of wx) for (const s of [-1, 1]) { const w = new T.Mesh(new T.CylinderGeometry(.36, .36, .26, 14), tyre); w.rotation.x = Math.PI / 2; w.position.set(x, .36, s * (W / 2 - .05)); g.add(w); }
  const glow = new T.Mesh(new T.PlaneGeometry(L * .9, W * 1.1), new T.MeshBasicMaterial({ color: [0xff40c0, 0x40e0ff, 0xb060ff][(R() * 3) | 0], transparent: true, opacity: .5, blending: T.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = .03; g.add(glow);
  // a long soft headlight beam on the wet road
  const beam = new T.Mesh(new T.PlaneGeometry(7, 2.2), new T.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false }));
  beam.rotation.x = -Math.PI / 2; beam.position.set(fx + 3.5, .04, 0); g.add(beam);
  return g;
}
const RIDES = { // sound, its loud moment (s), speed (units/s), chance
  car: { snd: 'car_pass1', peak: 1.03, v: 30 }, sport: { snd: 'car_pass2', peak: 2.51, v: 38 }, sport2: { snd: 'car_pass3', peak: 2.3, v: 34 }, van: { snd: 'car_pass1', peak: 1.03, v: 26 }, truck: { snd: 'car_truck', peak: 1.56, v: 22 } };
function traffic(D, K, R) {
  const LANE = 6.4, X0 = 46, light = new T.PointLight(0xfff0d0, 0, 14, 1.4); D.scene.add(light);
  let next = R.r(3, 6), cur = null; const play = (n, at, v = 1) => setTimeout(() => { if (!D.paused) (window.__lsSfx || (() => { try { const a = new Audio('snd/' + n + '.mp3'); a.volume = .6 * v; a.play().catch(() => {}); } catch (e) {} }))(n, v); }, Math.max(0, at * 1000));
  D.updaters.push((t, dt) => { dt = dt || .016;
    if (!cur && t > next) { const pick = R(), kind = pick < .18 ? 'truck' : pick < .45 ? 'sport' : pick < .6 ? 'van' : 'car', ride = RIDES[kind === 'sport' && R() < .5 ? 'sport2' : kind], dir = R() < .5 ? 1 : -1;
      const g = makeCar(K, kind, R); g.position.set(-dir * X0, 0, LANE + (dir < 0 ? 1.3 : 0)); g.rotation.y = dir > 0 ? 0 : Math.PI; D.scene.add(g);
      cur = { g, dir, v: ride.v }; const cross = X0 / ride.v;
      play(ride.snd, cross - ride.peak, kind === 'truck' ? .45 : .8);
      if (kind !== 'truck' && R() < .25) play('car_horn', cross - 1.42 - .25, .28); }
    if (cur) { const g = cur.g; g.position.x += cur.dir * cur.v * dt; light.position.set(g.position.x + cur.dir * 3, 1, g.position.z - .6); light.intensity = 30;
      if (Math.abs(g.position.x) > X0 + 2) { g.removeFromParent(); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); cur = null; light.intensity = 0; next = t + R.r(6, 13); } } });
}

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(171);
  S.fog = new T.Fog(0x3a2060, 50, 230); S.background = new T.Color(0x22164a);
  D.moonlight({ color: 0xc8b0ff, intensity: 1.8, dir: [.3, 1, .4], ambient: 0x5a4090, ambientI: 2.1, sky: 0xa070d8, ground: 0x402838 });
  sky(D, [[0, '#140a30'], [.6, '#3a1a60'], [1, '#7a2a7a']], { stars: 0 }); moon(D, 22, 54, -140, 18, [240, 70, 70], [220, 40, 80]);
  const M = { road: pbr('asphalt_02', [6, 4], { color: 0x8a80a0, rough: .15, metal: .35, ns: 1.2 }), conc: pbr('concrete_pavers', [6, .5], { nmap: 'asphalt_02', rmap: 'asphalt_02', color: 0x9a90a8 }),
    metal: pbr('metal_plate', [1, 2], { color: 0x6a6878, metal: .6, rough: .6 }), white: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9090b0, emissiveIntensity: .4, roughness: .4 }),
    amber: new T.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffa030, emissiveIntensity: 2.4 }), haz: new T.MeshStandardMaterial({ map: ctex(hazard(), [2, 1]), roughness: .6 }),
    fence: new T.MeshStandardMaterial({ map: ctex(fence(), [6, 2]), transparent: true, alphaTest: .3, side: T.DoubleSide, metalness: .5 }), deck: pbr('concrete_pavers', [10, 1], { nmap: 'asphalt_02', color: 0x6a6080 }) };
  // ── the road deck, lane lines, the shoulder barrier with amber markers ──
  box(60, 1, 14, M.road, 0, -1, 1);
  for (let x = -26; x < 26; x += 6) box(3, .02, .18, M.white, x, 0, 4.8, { cast: false });
  box(60, .02, .14, M.white, 0, 0, -2.2, { cast: false });
  box(40, 1.2, .8, M.conc, 0, 0, -3.4); box(40, .2, 1, M.conc, 0, 1.2, -3.4);
  for (let x = -18; x <= 18; x += 3.6) { box(.6, .2, .1, M.amber, x, .5, -2.95, { cast: false }); D.glow(x, .6, -2.8, 1, 0xffa030); }
  D.lantern(-7, 1, -2.5, { color: 0xffa030, intensity: 8, distance: 8, glow: 0 }); D.lantern(7, 1, -2.5, { color: 0xffa030, intensity: 8, distance: 8, glow: 0 });
  // hazard barriers at the ends, a chain-link fence on the left
  for (const [x, z, ry] of [[-15, -2.4, .1], [16, -2.6, -.2], [-12.6, -1.6, -.3]]) { box(2.4, .9, .5, M.haz, x, 0, z, { ry }); box(.15, .9, .15, M.metal, x - 1, 0, z, { ry }); }
  for (let x = -24; x <= -14; x += 3) box(.12, 3.6, .12, M.metal, x, 0, -1); add(new T.PlaneGeometry(10, 3.4), M.fence, -19, 1.8, -1, { cast: false });
  // street lamps: curved arms with glowing heads
  for (const [x, z] of [[-10, -3.4], [10, -3.4], [26, -14]]) { box(.2, 7, .2, M.metal, x, 1.3, z); box(1.6, .14, .14, M.metal, x + .7, 8.2, z); box(.6, .2, .4, M.amber, x + 1.4, 8, z, { cast: false }); D.lantern(x + 1.4, 7.8, z + .4, { color: 0xffc070, intensity: 22, distance: 14, glow: 1.4 }); }
  // ── the elevated expressway crossing behind us: a long gentle S on concrete piers, side walls with neon under-strips,
  //    green gantry signs, lamps along the edge, and real traffic (car bodies with head/tail lights) both ways ──
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(new T.Vector3(-70 + u * 140, 5.6 + Math.sin(u * Math.PI) * .8, -18 - Math.sin(u * Math.PI * 2) * 3 - u * 4)); }
  const curve = new T.CatmullRomCurve3(pts), neon = [new T.MeshBasicMaterial({ color: 0xff40c0 }), new T.MeshBasicMaterial({ color: 0x40e0ff })];
  const gsign = new T.MeshBasicMaterial({ map: ctex(cvs(256, 96, (g, W, H) => { g.fillStyle = '#0c6a3a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f4f4'; g.lineWidth = 4; g.strokeRect(5, 5, W - 10, H - 10); g.fillStyle = '#f4f4f4'; for (let k = 0; k < 4; k++) g.fillRect(20 + k * 40, 22, 28, 22); g.fillRect(20, 56, 120, 12); g.beginPath(); g.moveTo(200, 70); g.lineTo(200, 30); g.lineTo(186, 44); g.moveTo(200, 30); g.lineTo(214, 44); g.lineWidth = 6; g.stroke(); })) });
  for (let i = 0; i < 40; i++) { const a = curve.getPoint(i / 40), b = curve.getPoint((i + 1) / 40), L = a.distanceTo(b), ry = -Math.atan2(b.z - a.z, b.x - a.x), m = a.clone().lerp(b, .5);
    box(L + .1, .9, 9, M.deck, m.x, m.y - .9, m.z, { ry, cast: false }); box(L + .1, 1.1, .35, M.conc, m.x, m.y, m.z + 4.4, { ry, cast: false }); box(L + .1, 1.1, .35, M.conc, m.x, m.y, m.z - 4.4, { ry, cast: false });
    box(L + .1, .16, .16, neon[(i >> 2) % 2], m.x, m.y - 1.05, m.z + 4.6, { ry, cast: false }); box(L + .1, .06, .06, M.amber, m.x, m.y + 1.12, m.z + 4.4, { ry, cast: false });
    if (i % 3 === 0) { box(2, m.y - .9, 2.4, M.conc, m.x, 0, m.z, { cast: false }); box(4, .8, 3, M.conc, m.x, m.y - 1.7, m.z, { cast: false }); }
    if (i % 4 === 2) { box(.16, 2.6, .16, M.metal, m.x, m.y, m.z + 4.6, { cast: false }); D.glow(m.x, m.y + 2.7, m.z + 4.6, 1.2, 0xffc070); }
    if (i % 9 === 4) { for (const dz of [-4.6, 4.6]) box(.3, 4.4, .3, M.metal, m.x, m.y, m.z + dz, { cast: false }); box(.3, .3, 9.6, M.metal, m.x, m.y + 4.3, m.z, { cast: false }); add(new T.PlaneGeometry(5, 1.9), gsign, m.x, m.y + 3.4, m.z + 4.9, { cast: false }); } }
  D.lantern(-12, 7, -14, { color: 0xffc070, intensity: 16, distance: 18, glow: 0 }); D.lantern(14, 7, -16, { color: 0xffc070, intensity: 16, distance: 18, glow: 0 });
  { const cm = [0xc81e3a, 0x1e5ac8, 0xf0f0f4, 0x1a1a22, 0xe0b020].map(c => new T.MeshStandardMaterial({ color: c, metalness: .6, roughness: .3 })), hl = new T.MeshBasicMaterial({ color: 0xfff4d8 }), tl = new T.MeshBasicMaterial({ color: 0xff2030 }), traffic = [];
    for (let i = 0; i < 18; i++) { const g = new T.Group(), body = new T.Mesh(new T.BoxGeometry(4, .9, 1.8), cm[i % cm.length]); body.position.y = .75; g.add(body); const cab = new T.Mesh(new T.BoxGeometry(2, .6, 1.6), new T.MeshStandardMaterial({ color: 0x0a0a14, metalness: .9, roughness: .1 })); cab.position.set(-.2, 1.45, 0); g.add(cab);
      const dir = i % 2 ? 1 : -1; for (const s of [-.6, .6]) { const h = new T.Mesh(new T.BoxGeometry(.06, .16, .3), hl), t2 = new T.Mesh(new T.BoxGeometry(.06, .16, .3), tl); h.position.set(2.02, .8, s); t2.position.set(-2.02, .8, s); g.add(h, t2); }
      const tr = new T.Mesh(new T.PlaneGeometry(9, .5), new T.MeshBasicMaterial({ color: dir > 0 ? 0xfff0c0 : 0xff3040, transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false })); tr.position.set(-5, .7, 0); g.add(tr);
      S.add(g); traffic.push([g, R(), dir, R.r(.025, .045)]); }
    D.updaters.push((t, dt) => { for (const c of traffic) { c[1] = (c[1] + (dt || .016) * c[3] * c[2] + 1) % 1; const p = curve.getPoint(c[1]), q = curve.getPoint(Math.min(.999, c[1] + .005)); c[0].position.set(p.x, p.y, p.z + (c[2] > 0 ? 2.2 : -2.2)); c[0].rotation.y = -Math.atan2(q.z - p.z, q.x - p.x) + (c[2] < 0 ? Math.PI : 0); } }); }
  // ── skyline with the two big screens, cherry tree left ──
  billboard(K, D, -16, 20, -46, 10, 16, 'face'); billboard(K, D, 24, 22, -52, 10, 16, 'koi');
  neonTower(K, -16, -52, 12, 10, 34, 2); neonTower(K, 24, -58, 12, 10, 38, 5);
  skyline(K, D, R, { zNear: -50, zFar: -140, n: 44 });
  for (let i = 0; i < 3; i++) await prop('sakura', -16 + i * 1.6, -1 + i * .6, R.r(8, 10), { flip: R() < .5, sway: .01, blob: false });
  // ── traffic in the near lane: every so often a car (sometimes a truck) tears across the foreground, with real pass-by sound and horns ──
  traffic(D, K, R);
  rain(D, 900, [-24, 24], [0, 16], [-30, 8]); D.petals(40, -10, 0, 6, { color: 0xff7ad0 }); drift(D, 40, 0, -20, 30, 14, 0xff60c0, { y0: 2, y1: 14, size: 6 });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(467);
  farPainting(D, 'nw_express', { v1: .45, z: -145 });
  groundFill(D, pbr('asphalt_02', [30, 30], { color: 0x3a3450, rough: .3, metal: .3 }), { z0: -6, z1: -150 });
  cityBlocks(K, D, R2, { x0: -60, x1: 60, z0: -28, z1: -36, n: 22, hMin: 4, hMax: 8 });   // low shop row under the expressway
  cityBlocks(K, D, R2, { x0: -70, x1: 70, z0: -40, z1: -60, n: 22, hMin: 12, hMax: 34 });
  scatter(D, R2, { area: [-14, 14, -2, 8], puddles: 12, pebbles: 40, stone: 0x3a3440, petals: 40, petal: 0xff7ad0 });
}
