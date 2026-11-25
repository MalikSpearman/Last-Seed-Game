// Weather Studio (weather) and the storm that takes it over (weather2). The bright TV weather set: a glossy floor, a
// curved video wall with the forecast map, the news desk, studio cameras on pedestals, a green screen, a lighting rig
// of hot lamps overhead. Phase two: the roof is torn open to a hurricane eye, rain sheets in, lightning strikes, the
// wall shows the typhoon, lamps spark and swing, papers whirl, cables and puddles everywhere.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, farPainting, scatter, drift, rain, lightning, vortex, flurry, restyle, sky } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -2.6]], sum: [-5.2, .8], exposure: 1.4 };

const mapTex = storm => cvs(1024, 384, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, storm ? '#0a1a4a' : '#2a6ad0'); gr.addColorStop(1, storm ? '#1a3a8a' : '#5aa0f0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = storm ? '#2a8a4a' : '#5ad08a'; g.beginPath(); g.moveTo(560, 40); g.bezierCurveTo(640, 80, 600, 160, 660, 200); g.bezierCurveTo(700, 240, 620, 300, 560, 320); g.bezierCurveTo(540, 260, 580, 200, 520, 160); g.closePath(); g.fill();
  if (storm) { g.translate(380, 190); for (let a = 0; a < 22; a += .03) { g.fillStyle = `rgba(230,240,255,${Math.max(0, .12 - a * .005)})`; g.beginPath(); g.arc(Math.cos(a) * a * 7, Math.sin(a) * a * 7, 8 + a, 0, 7); g.fill(); } g.setTransform(1, 0, 0, 1, 0, 0); }
  else { for (const [x, y] of [[200, 100], [820, 120]]) { g.fillStyle = '#ffd040'; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill(); } g.fillStyle = '#fff'; for (const [x, y] of [[300, 220], [420, 120], [760, 260], [900, 200]]) { for (const [dx, r] of [[0, 30], [30, 24], [-28, 22]]) { g.beginPath(); g.arc(x + dx, y, r, 0, 7); g.fill(); } } }
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1); });

export async function build(D, phase = 1) {
  const storm = phase === 2, K = kit(D), { S, add, box } = K, R = rng(storm ? 562 : 561);
  S.fog = new T.Fog(storm ? 0x1a2a50 : 0x2a3a6a, 24, 120); S.background = new T.Color(storm ? 0x0a1428 : 0x0e1a3a);
  D.moonlight(storm ? { color: 0x90a8ff, intensity: 1.6, dir: [.2, 1, .2], ambient: 0x2a3a6a, ambientI: 1.8, sky: 0x5a7ad0, ground: 0x1a2a3a } : { color: 0xffffff, intensity: 2.2, dir: [.1, 1, .5], ambient: 0x5a6a9a, ambientI: 2.4, sky: 0xc0d8ff, ground: 0x3a4a6a });
  const M = { floor: pbr('concrete_pavers', [6, 3], { nmap: 'asphalt_02', rmap: 'asphalt_02', color: storm ? 0x5a6a90 : 0x9aa8d0, rough: .08, metal: .45 }), steel: pbr('metal_plate', [1, 2], { color: 0x8a8a98, metal: .7, rough: .4 }),
    black: new T.MeshStandardMaterial({ color: 0x14141c, roughness: .5 }), desk: new T.MeshStandardMaterial({ color: 0xe8eef8, roughness: .2, metalness: .2 }), deskGlow: new T.MeshBasicMaterial({ color: storm ? 0x4060ff : 0x60a0ff }),
    wall: new T.MeshBasicMaterial({ map: ctex(mapTex(storm)) }), green: new T.MeshStandardMaterial({ color: 0x2ab84a, roughness: .9, side: T.DoubleSide }), lamp: new T.MeshBasicMaterial({ color: 0xfff8e0 }), cable: new T.MeshStandardMaterial({ color: 0x0a0a10, roughness: .6 }) };
  { const f = new T.Mesh(new T.PlaneGeometry(40, 22), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -5); f.receiveShadow = true; S.add(f); }
  // ── the curved video wall and its frame pillars ──
  { const wall = new T.Mesh(new T.CylinderGeometry(16, 16, 7, 48, 1, true, -Math.PI * .28, Math.PI * .56), M.wall); wall.position.set(2, 4, 2); wall.rotation.y = Math.PI; S.add(wall);
    for (const a of [-.9, 0, .9]) { const x = 2 + Math.sin(a) * 16.1, z = 2 - Math.cos(a) * 16.1; add(new T.CylinderGeometry(.7, .7, 9, 16), M.steel, x, 4.5, z); D.glow(x, 5, z + .8, 2, 0x80c0ff); }
    D.glow(2, 4, -12, 18, storm ? 0x4060ff : 0x60a0ff); D.lantern(2, 4, -9, { color: storm ? 0x6080ff : 0x80c0ff, intensity: 24, distance: 20, glow: 0 }); }
  // ── the news desk ──
  { const g = new T.Group(); g.position.set(6, 0, -8); if (storm) g.rotation.set(0, .3, .06); S.add(g); K.add(new T.CylinderGeometry(3.2, 3.2, 1.3, 24, 1, false, -Math.PI / 2, Math.PI), M.desk, 0, .65, 0, { to: g });
    K.add(new T.CylinderGeometry(3.25, 3.25, .12, 24, 1, false, -Math.PI / 2, Math.PI), M.deskGlow, 0, .2, 0, { to: g, cast: false }); for (const dx of [-1.4, 1.4]) K.add(new T.BoxGeometry(.6, .5, .4), M.black, dx, 1.55, -.3, { to: g }); }
  // ── studio cameras on pedestals, the green screen, monitors ──
  const cam = (x, z, ry, tilt = 0) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.set(0, ry, tilt); S.add(g); K.add(new T.CylinderGeometry(.8, .9, .3, 14), M.black, 0, .3, 0, { to: g }); K.add(new T.CylinderGeometry(.14, .14, 2.4, 10), M.steel, 0, 1.6, 0, { to: g });
    K.add(new T.BoxGeometry(1.2, .9, 2), M.black, 0, 3.1, 0, { to: g }); K.add(new T.CylinderGeometry(.34, .4, .8, 14), M.black, 0, 3.1, 1.3, { to: g, rx: Math.PI / 2 }); K.add(new T.BoxGeometry(.9, .6, .1), new T.MeshBasicMaterial({ color: 0x6090ff }), 0, 3.4, -1.05, { to: g, cast: false });
    const tally = K.add(new T.SphereGeometry(.08, 8, 6), new T.MeshBasicMaterial({ color: 0xff2020 }), .5, 3.6, .9, { to: g, cast: false }); return g; };
  cam(-13, -2, .5, storm ? .25 : 0); cam(13, 1, -.6); cam(-6, -10, .2);
  { const gs = add(new T.PlaneGeometry(8, 7, 6, 6), M.green, -15, 3.5, -8, { ry: .7, cast: false }); if (storm) { const p = gs.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 1.3) * .5); D.updaters.push(t => { gs.rotation.z = Math.sin(t * 2) * .05; }); } }
  for (const x of [-9, -7.6]) { box(1.2, .9, .8, M.black, x, 1, -9); add(new T.PlaneGeometry(1, .7), new T.MeshBasicMaterial({ color: storm ? 0x3a5aff : 0x80c0ff }), x, 1.45, -8.58, { cast: false }); box(.1, 1, .1, M.steel, x, 0, -9); }
  // ── the lighting rig: a truss grid of hot lamps overhead ──
  const lamps = []; for (let x = -16; x <= 16; x += 4) { box(.2, .2, 20, M.steel, x, 11, -5, { cast: false }); }
  for (let z = -14; z <= 4; z += 6) box(34, .2, .2, M.steel, 0, 11, z, { cast: false });
  for (let i = 0; i < 10; i++) { const x = -14 + i * 3.2, z = i % 2 ? -10 : -2, g = new T.Group(); g.position.set(x, 10.8, z); S.add(g);
    K.add(new T.BoxGeometry(.9, .9, .9), M.black, 0, -.5, 0, { to: g }); K.add(new T.PlaneGeometry(.7, .7), M.lamp, 0, -.5, .46, { to: g, cast: false, rx: .5 }); lamps.push([g, x, z, R() * 6]); D.glow(x, 10.2, z + .6, 2.4, 0xfff0c0); if (i % 3 === 0) D.lantern(x, 9, z + 1, { color: 0xfff0d0, intensity: 18, distance: 14, glow: 0 }); }
  if (storm) {
    // ripped-open roof: torn truss pieces, the hurricane eye, rain, lightning, sparks, debris
    sky(D, [[0, '#060a1a'], [.5, '#1a2a5a'], [1, '#2a3a6a']], { stars: 0, z: -149 });
    vortex(D, 0, 50, -60, 60, '#a0c0ff', { speed: .1 }); vortex(D, 0, 48, -58, 34, '#e0f0ff', { speed: -.16, opacity: .5 });
    for (let i = 0; i < 8; i++) { const b = box(R.r(3, 8), .2, .2, M.steel, R.r(-14, 14), R.r(9, 12), R.r(-14, 2), { ry: R() * 3, cast: false }); b.rotation.z = R.r(-.6, .6); }
    D.updaters.push(t => lamps.forEach(([g, x, z, ph]) => { g.rotation.z = Math.sin(t * 1.6 + ph) * .3; g.rotation.x = Math.sin(t * 1.1 + ph) * .2; }));
    lightning(D, R, { color: 0xc0d0ff, area: [-40, 40, -30, -80], every: [1.5, 4] }); rain(D, 1400, [-22, 22], [0, 20], [-24, 8], { speed: 18 });
    flurry(D, R, 40, { area: [-14, 14, 2, -14], y0: 0, y1: 10, speed: 2.4 }); drift(D, 40, 0, -6, 16, 8, 0xfff0a0, { y0: 6, y1: 11, size: 10 });
    for (let i = 0; i < 6; i++) { const c = new T.CatmullRomCurve3(Array.from({ length: 5 }, (_, k) => new T.Vector3(R.r(-14, 14), .04, R.r(-10, 4)))); add(new T.TubeGeometry(c, 40, .06, 5), M.cable, 0, 0, 0, { cast: false }); }
    farPainting(D, 'weather2', { v1: .4, z: -144, tint: 0xb0b8d0 });
    scatter(D, rng(117), { area: [-16, 16, -6, 6], puddles: 16, petals: 60, petal: 0xf4f0e8 });
  } else {
    farPainting(D, 'weather', { v1: .35, z: -144, tint: 0x8090b0 });
    scatter(D, rng(117), { area: [-16, 16, -6, 6], pebbles: 0, petals: 8, petal: 0xf4f0e8 });
    for (let i = 0; i < 4; i++) { const c = new T.CatmullRomCurve3(Array.from({ length: 4 }, (_, k) => new T.Vector3(-16 + k * 3, .04, -6 + R.r(-2, 2)))); add(new T.TubeGeometry(c, 30, .05, 5), M.cable, 0, 0, 0, { cast: false }); }
  }
}
