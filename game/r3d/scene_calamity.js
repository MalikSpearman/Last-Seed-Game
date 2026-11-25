// Calamity Arena: the cursed tournament colosseum. A scorched sand floor strewn with petals and rubble, the stands
// ringing it with lantern-lit tiers and crest banners, purple braziers burning around the rim, the demon gate at the far
// end, and a vortex of violet cloud tearing open the sky overhead with a black crystal heart hanging in it.
import { T } from './diorama.js';
import { kit, rng, sky, pbr, ctex, cvs, bannerTex, farPainting, scatter, drift, vortex, flames, lightning } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2], [-4.4, -2.2], [1.6, -3.4]], sum: [-5.6, .8], exposure: 1.55 };

const arches = glow => cvs(512, 256, (g, W, H) => { g.fillStyle = glow ? '#000' : '#4a3a58'; g.fillRect(0, 0, W, H);
  for (const [y0, h] of [[30, 96], [150, 86]]) for (let x = 8; x < W; x += 64) { g.fillStyle = glow ? '#ffb070' : '#ffcf80'; g.beginPath(); g.moveTo(x + 8, y0 + h); g.lineTo(x + 8, y0 + 22); g.arc(x + 32, y0 + 22, 24, Math.PI, 0); g.lineTo(x + 56, y0 + h); g.fill(); } });

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(541);
  S.fog = new T.Fog(0x4a1a5a, 30, 160); S.background = new T.Color(0x2a0e36);
  D.moonlight({ color: 0xe0a0ff, intensity: 2, dir: [.2, 1, .2], ambient: 0x6a2a7a, ambientI: 2.2, sky: 0xc070e0, ground: 0x5a2a4a });
  sky(D, [[0, '#1a0628'], [.5, '#5a1a6a'], [1, '#a02a6a']], { stars: 0 });
  const M = { sand: pbr('burned_ground_01', [12, 12], { color: 0xd0a0c0, rough: .9 }), stone: pbr('castle_wall_slates', [12, 1], { color: 0x8a7a98 }), dark: pbr('rock_face', [2, 2], { color: 0x4a3a58 }),
    crystal: new T.MeshStandardMaterial({ color: 0x2a0a3a, emissive: 0x8a20c0, emissiveIntensity: .8, metalness: .6, roughness: .2, flatShading: true }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#7a1a4a', '#4a0a2a'], trim: '#e0b060', sd: 91, emblem: (g, cx, cy) => { g.strokeStyle = '#f0c766'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, 60, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx, cy - 60); g.lineTo(cx, cy + 60); g.moveTo(cx - 60, cy); g.lineTo(cx + 60, cy); g.stroke(); } })), side: T.DoubleSide, alphaTest: .4 }) };
  // ── the arena floor: a huge disc of scorched sand ──
  { const f = new T.Mesh(new T.CircleGeometry(60, 64), M.sand); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -30); f.receiveShadow = true; S.add(f); }
  // ── the stands: two lit tiers of arches in a ring, the rim wall and banners ──
  { const r = 58, cz = -30, wt = ctex(arches(false), [24, 1]), gt = ctex(arches(true), [24, 1]);
    const tiers = new T.Mesh(new T.CylinderGeometry(r, r + 6, 18, 96, 1, true), new T.MeshStandardMaterial({ map: wt, emissiveMap: gt, emissive: 0xffa050, emissiveIntensity: 1.1, side: T.BackSide })); tiers.position.set(0, 9, cz); S.add(tiers);
    const wall = new T.Mesh(new T.CylinderGeometry(r - 1, r - 1, 3, 96, 1, true), new T.MeshStandardMaterial({ map: pbr('castle_wall_slates', [30, 1]).map, color: 0x8a7a98, side: T.BackSide })); wall.position.set(0, 1.5, cz); S.add(wall);
    for (let k = 0; k < 18; k++) { const a = -Math.PI / 2 + (k - 8.5) / 18 * Math.PI * 1.3, x = Math.cos(a) * (r - 2), z = cz + Math.sin(a) * (r - 2); const b = new T.Mesh(new T.PlaneGeometry(2.4, 6), M.ban); b.position.set(x, 9, z); b.lookAt(0, 9, cz); S.add(b); }
    // purple braziers around the rim
    const spots = []; for (let k = 0; k < 14; k++) { const a = -Math.PI / 2 + (k - 6.5) / 14 * Math.PI * 1.4, x = Math.cos(a) * (r - 6), z = cz + Math.sin(a) * (r - 6); add(new T.CylinderGeometry(.9, .5, 1.2, 12), M.dark, x, 2.4, z); box(.8, 1.8, .8, M.dark, x, 0, z); spots.push([x, z, 1]); }
    flames(D, R, spots.map(([x, z]) => [x, z, 1.4]), { color: 0xc040ff });
    // the demon gate at the far end
    box(14, 16, 3, M.stone, 0, 0, cz - r + 2); add(new T.PlaneGeometry(6, 10), new T.MeshBasicMaterial({ color: 0x1a0624 }), 0, 5, cz - r + 3.6, { cast: false }); D.glow(0, 6, cz - r + 5, 14, 0xa030ff); }
  // ── the vortex and the black crystal heart ──
  vortex(D, 0, 60, -60, 50, '#c060ff', { speed: .05 }); vortex(D, 0, 58, -58, 30, '#ff60c0', { speed: -.09, opacity: .6 });
  { const g = new T.Group(); g.position.set(0, 40, -55); S.add(g); for (let k = 0; k < 7; k++) { const c = new T.Mesh(new T.OctahedronGeometry(R.r(2, 5), 0), M.crystal); c.position.set(R.r(-4, 4), R.r(-4, 3), R.r(-2, 2)); c.scale.y = R.r(1.6, 3); c.rotation.set(R() * 3, R() * 3, Math.PI); g.add(c); }
    D.glow(0, 40, -50, 24, 0xa020ff); D.updaters.push(t => { g.rotation.y = t * .15; g.position.y = 40 + Math.sin(t * .6) * 1.5; }); }
  lightning(D, R, { color: 0xd080ff, area: [-50, 50, -50, -90], every: [3, 7] });
  // rubble and cracked stones on the floor, petals
  for (let i = 0; i < 24; i++) { const r = add(new T.DodecahedronGeometry(R.r(.4, 1.4), 0), M.dark, R.r(-20, 20), .2, R.r(-6, -30), { ry: R() * 6 }); r.scale.y = .5; }
  scatter(D, rng(115), { area: [-16, 16, -4, 6], pebbles: 120, stone: 0x5a4a68, petals: 200, petal: 0xd070c0 });
  drift(D, 120, 0, -20, 40, 30, 0xc070ff, { y0: .5, y1: 20, size: 8 });
}
