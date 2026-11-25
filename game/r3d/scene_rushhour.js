// Rush Hour Platform (rushhour) and the runaway express (rushhour2). A gleaming station platform: tiled floor with the
// yellow tactile strip, steel columns, a big station clock, the roof truss with its tube lights, a commuter train
// standing at the platform with its doors open, cherry trees beyond the far track, commuters waiting. Phase two: night,
// lightning over the city, the express tearing into the station with blazing headlights and sparks, hazard-striped
// columns, the lights flickering.
import { T } from './diorama.js';
import { IMG, kit, rng, sky, pbr, ctex, cvs, farPainting, scatter, drift, lightning, rain, walkers, skyline, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -2.4]], sum: [-5.2, .8], exposure: 1.4 };

const tiles = () => { const R = rng(2); return cvs(512, 512, (g, W, H) => { g.fillStyle = '#b8b4c0'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { g.fillStyle = `hsl(250,${R.r(4, 10)}%,${R.r(66, 76)}%)`; g.fillRect(x + 2, y + 2, 60, 60); } }); };
const strip = () => cvs(128, 128, (g, W) => { g.fillStyle = '#e8b020'; g.fillRect(0, 0, W, W); g.fillStyle = '#c89010'; for (let x = 0; x < W; x += 16) g.fillRect(x + 2, 0, 6, W); });
const hazard = () => cvs(64, 256, (g, W, H) => { g.fillStyle = '#e8b020'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a1a1a'; for (let y = -64; y < H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 32); g.lineTo(W, y + 56); g.lineTo(0, y + 24); g.fill(); } });
const clockF = () => cvs(256, 256, (g, W) => { g.fillStyle = '#f8f6f0'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 10; g.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.lineWidth = 6; g.beginPath(); g.moveTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); g.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); g.stroke(); } });

const ctex0 = url => { const t = new T.TextureLoader().load(url); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };

export async function build(D, phase = 1) {
  const night = phase === 2, K = kit(D), { S, add, box, prop } = K, R = rng(night ? 602 : 601);
  S.fog = new T.Fog(night ? 0x141828 : 0x8a90b0, 30, 140); S.background = new T.Color(night ? 0x0a0c18 : 0x6a7ab0);
  D.moonlight(night ? { color: 0x8a90c0, intensity: 1.2, dir: [.2, 1, .3], ambient: 0x2a2a4a, ambientI: 1.6, sky: 0x4a5a8a, ground: 0x2a2a30 } : { color: 0xfff4e0, intensity: 2.6, dir: [.3, 1, .4], ambient: 0x8a90b0, ambientI: 2.4, sky: 0xc8d8ff, ground: 0x7a7480 });
  sky(D, night ? [[0, '#05060e'], [.6, '#141a30'], [1, '#2a2a40']] : [[0, '#5a8ad0'], [.6, '#a0c0f0'], [1, '#f0e0f0']], { stars: 0 });
  const M = { floor: new T.MeshStandardMaterial({ map: ctex(tiles(), [16, 6]), roughness: .1, metalness: .3, color: night ? 0x8a8aa0 : 0xffffff }), strip: new T.MeshStandardMaterial({ map: ctex(strip(), [40, 1]), roughness: .6 }),
    steel: pbr('metal_plate', [1, 3], { color: 0xc8c8d0, metal: .7, rough: .35 }), haz: new T.MeshStandardMaterial({ map: ctex(hazard(), [1, 3]), roughness: .6 }), roof: pbr('metal_plate', [10, 2], { color: 0x6a6a78, metal: .5, rough: .6 }),
    train: new T.MeshStandardMaterial({ color: 0xd8dce4, metalness: .75, roughness: .25 }), green: new T.MeshStandardMaterial({ color: 0x2aa050, roughness: .4 }), glass: new T.MeshStandardMaterial({ color: 0x1a2a3a, metalness: .9, roughness: .1 }),
    tube: new T.MeshBasicMaterial({ color: 0xf0fff8 }), clock: new T.MeshBasicMaterial({ map: ctex(clockF()) }), dark: new T.MeshStandardMaterial({ color: 0x1a1a22 }), rail: new T.MeshStandardMaterial({ color: 0x8a8890, metalness: .9, roughness: .3 }), bed: pbr('burned_ground_01', [20, 2], { color: 0x6a6070 }) };
  // ── the platform, its edge strip, the drop to the tracks ──
  box(60, 1.2, 12, M.floor, 0, -1.2, 1.4); box(60, .02, .7, M.strip, 0, 0, -3.6, { cast: false });
  { const b = new T.Mesh(new T.PlaneGeometry(80, 12), M.bed); b.rotation.x = -Math.PI / 2; b.position.set(0, -1.2, -10); S.add(b); for (const z of [-7, -8.6, -13, -14.6]) box(80, .2, .14, M.rail, 0, -1.2, z, { cast: false }); }
  // ── columns, roof truss and tube lights, the station clock ──
  for (let x = -24; x <= 24; x += 8) { box(.9, 9, .9, night ? M.haz : M.steel, x, 0, -2.8); box(.9, 9, .9, M.steel, x, -1.2, -18); }
  box(60, .5, 22, M.roof, 0, 9, -6, { cast: false }); for (let x = -28; x <= 28; x += 4) box(.2, 1, 22, M.steel, x, 8, -6, { cast: false });
  const tubes = []; for (let x = -22; x <= 22; x += 5.5) { const tb = box(2.6, .14, .2, M.tube, x, 7.8, -1, { cast: false }); tubes.push(tb); D.glow(x, 7.6, -1, 3, 0xf0fff0); if ((x / 5.5 | 0) % 2 === 0) D.lantern(x, 7.4, 0, { color: 0xf0fff0, intensity: 16, distance: 14, glow: 0 }); }
  if (night) D.updaters.push(t => tubes.forEach((tb, i) => { tb.visible = Math.sin(t * (17 + i * 3) + i) > -.85; }));
  { const cx = 14, cz = -2.8; add(new T.CylinderGeometry(1.4, 1.4, .3, 32), M.dark, cx, 6.6, cz + .6, { rx: Math.PI / 2 }); add(new T.CircleGeometry(1.3, 32), M.clock, cx, 6.6, cz + .78, { cast: false });
    const hh = box(.1, .7, .04, M.dark, cx, 6.6, cz + .82, { cast: false }), mh = box(.06, 1, .04, M.dark, cx, 6.6, cz + .84, { cast: false }); hh.geometry.translate(0, .35 - .35, 0);
    D.updaters.push(t => { hh.rotation.z = -t * .02 - 1.2; mh.rotation.z = -t * .24; }); }
  // ── the train ──
  const train = new T.Group(); S.add(train);
  // painted commuter cars (a 2D cut-out on each car's near side, with a dark box body behind for depth and shadow)
  { const tm = new T.MeshStandardMaterial({ map: ctex0(IMG('rg_train')), alphaTest: .4, side: T.DoubleSide, roughness: .5, emissive: 0xffffff, emissiveMap: ctex0(IMG('rg_train')), emissiveIntensity: night ? .25 : .12 });
    for (let c = 0; c < 4; c++) { const g = new T.Group(); g.position.set(-10 + c * 12.2, -1.2, -7.8); train.add(g);
      K.add(new T.BoxGeometry(11.6, 3.4, 3), M.dark, 0, 2.2, 0, { to: g });
      const pl = new T.Mesh(new T.PlaneGeometry(12, 4.8), tm); pl.position.set(0, 2.4, 1.56); pl.castShadow = false; g.add(pl); } }
  if (night) { // the express charging in: headlights, sparks off the rails, it crawls forward and back on a cycle
    const hl = new T.MeshBasicMaterial({ color: 0xfff8d0 }); for (const dz of [-.9, .9]) { const l = new T.Mesh(new T.CircleGeometry(.3, 16), hl); l.position.set(-16.02, 1.6, -7.8 + dz); l.rotation.y = -Math.PI / 2; train.add(l); }
    const beam = new T.PointLight(0xfff0c0, 80, 40, 1.4); beam.position.set(-18, 1.4, -7.8); train.add(beam); D.glow(-17, 1.6, -7.8, 10, 0xfff0c0);
    D.updaters.push(t => { const P = 25, RUN = 13, X0 = 58, X1 = -76, u = ((t + 3) % P) / RUN; train.visible = u < 1; train.position.x = u < 1 ? X0 + (X1 - X0) * u : X1; });   // the whole train enters from off-screen right, runs clean off the left edge, then waits for the next pass (every 25 s) drift(D, 60, -18, -7.8, 3, 1.4, 0xffd040, { y0: -1, y1: 1.4, size: 14 });
    lightning(D, R, { color: 0xffe080, area: [-50, 50, -40, -90], every: [2, 5] }); rain(D, 800, [-30, 30], [0, 16], [-30, -12], { speed: 16 });
    skyline(K, D, R, { zNear: -30, zFar: -120, n: 40, spread: 80, spire: false }); farPainting(D, 'rushhour2', { v1: .45, z: -144 });
  } else {
    for (let i = 0; i < 6; i++) await prop('sakura', R.r(-30, 30), R.r(-20, -24), R.r(6, 9), { flip: R() < .5, sway: .01 });
    walkers(D, R, { z: -2.7, x0: -20, x1: 20, every: [2, 5], group: 3, rim: '#e0e8ff', zJit: .3 }); farPainting(D, 'rushhour', { v1: .45, z: -144 });
  }
  scatter(D, rng(121), { area: [-16, 16, -3, 6], puddles: night ? 12 : 0, petals: night ? 10 : 60, pebbles: 10, stone: 0x6a6a78 });
  decals(D, rng(698), { area: [-16, 16, -3, 6], list: [['gum', 6, [.8, 1.6]], ['paper', 2, [.9, 1.4]], ['stain', 3, [1, 2]], ['crack', 2, [1.4, 2.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1164), { area: [-16, 16, -3, 3], items: [['img:rg_vending', 1, [2.2, 2.4]], ['modular_street_seating', 1, [.95, 1.05]], ['metal_trash_can', 1, [1, 1.2]]] });   // real CC0 models placed where they fit (kit.dress)
}
