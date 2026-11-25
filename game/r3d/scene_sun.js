// Sun's Shore (sun) and the shore set ablaze (sun2): a black volcanic rock shelf at dusk, cracked and glowing with
// cooling lava, steam rising off the tide, a lone torii standing in the shallows on its rocks, smoking crags along the
// coast, and the last of the sun on the horizon. Phase two: the sky is fire, a second sun swells overhead, flames run
// over the rocks, lava pours through every crack, the torii burns, embers storm.
import { T } from './diorama.js';
import { kit, rng, sky, pbr, torii, sea, breakers, farPainting, scatter, drift, flames, restyle, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.5 };

export async function build(D, phase = 1) {
  const burn = phase === 2, K = kit(D), { S, add, box } = K, R = rng(burn ? 582 : 581);
  S.fog = new T.Fog(burn ? 0x8a3018 : 0x3a2440, 26, 140); S.background = new T.Color(burn ? 0x5a1a08 : 0x1e1430);
  D.moonlight(burn ? { color: 0xffb060, intensity: 3, dir: [.2, .9, -.6], ambient: 0x8a3a1a, ambientI: 2.4, sky: 0xffa050, ground: 0x6a2010 } : { color: 0xffa070, intensity: 2, dir: [.1, .4, -1], ambient: 0x4a3060, ambientI: 2, sky: 0x8a70c0, ground: 0x3a2028 });
  sky(D, burn ? [[0, '#3a0a04'], [.4, '#c0401a'], [.75, '#ffa040'], [1, '#ffe080']] : [[0, '#140c2a'], [.55, '#3a2a5a'], [.85, '#c06a5a'], [1, '#ffb070']], { stars: burn ? 0 : 60 });
  const M = { rock: pbr('lava_flags', [3, 2], { rmap: 'volcanic_rock_tiles', nmap: 'volcanic_rock_tiles', color: burn ? 0x8a5040 : 0x6a5a6a, rough: .6, ns: 1.6, glow: 'lava_flags', emissive: 0xff5a18, ei: burn ? 2.4 : .9 }),
    crag: pbr('rock_face', [2, 3], { color: burn ? 0x4a2a20 : 0x3a3040, ns: 2 }), gate: pbr('weathered_planks', [.5, 2], { color: burn ? 0x4a1a10 : 0x8a2a2a }), char: pbr('japanese_cedar_bark', [.5, 1], { color: 0x3a2a2a }) };
  // ── the rock shelf: lava-veined volcanic stone with a broken front edge ──
  box(30, 1.4, 11, M.rock, 0, -1.4, 1);
  D.updaters.push(t => { M.rock.emissiveIntensity = (burn ? 2.2 : .8) + Math.sin(t * 1.1) * (burn ? .5 : .25); });
  for (let i = 0; i < 16; i++) { const r = add(new T.DodecahedronGeometry(R.r(.8, 2.4), 1), M.crag, R.r(-15, 15), -.9, R.r(-4.5, -7), { ry: R() * 6 }); r.scale.y = R.r(.5, .9); }
  sea(D, R, { z: -70, shore: -8, foam: 5, color: burn ? 0x3a1408 : 0x1a1438, sky: burn ? ['#ffa040', '#8a2a10'] : ['#c06a5a', '#2a1a40'] });
  // ── the coastline crags, steaming ──
  for (let i = 0; i < 12; i++) { const x = R() < .5 ? R.r(-40, -14) : R.r(16, 40), h = R.r(6, 18), c = add(new T.ConeGeometry(R.r(3, 7), h, 6), M.crag, x, h / 2 - 1, R.r(-14, -40), { cast: false }); c.rotation.y = R() * 3; }
  { const sm = new T.SpriteMaterial({ color: burn ? 0x3a1a10 : 0xd8d0e0, transparent: true, opacity: burn ? .45 : .2, depthWrite: false }), L = [];
    for (let i = 0; i < 24; i++) { const s = new T.Sprite(sm); S.add(s); L.push([s, R.r(-30, 30), R.r(-6, -30), R() * 6]); }
    D.updaters.push(t => { for (const [s, x, z, ph] of L) { const u = (t * .12 + ph) % 1; s.position.set(x + Math.sin(t * .3 + ph), u * 10, z); s.scale.setScalar(2 + u * 8); } }); }
  // ── the lone torii on its rocks in the shallows ──
  for (let i = 0; i < 4; i++) add(new T.DodecahedronGeometry(R.r(1.4, 2.4), 1), M.crag, 13 + R.r(-3, 3), -1, -22 + R.r(-2, 2));
  torii(K, 13, -22, 9, M.gate, { y: .2, dark: M.char, rope: new T.MeshStandardMaterial({ color: burn ? 0x6a3a2a : 0xc8b890 }), tilt: burn ? .05 : 0 });
  breakers(D, R, [[13, -20, 1.2], [-8, -10, 1], [4, -12, .8]]);
  if (burn) { // a sky on fire, a second sun, flames on the rocks and the gate
    const sun = new T.Mesh(new T.CircleGeometry(30, 48), new T.MeshBasicMaterial({ color: 0xfff0a0, fog: false })); sun.position.set(-14, 56, -140); S.add(sun); D.glow(-14, 56, -138, 120, 0xffa040);
    const sun2 = new T.Mesh(new T.CircleGeometry(8, 32), new T.MeshBasicMaterial({ color: 0xff8030, fog: false })); sun2.position.set(30, 30, -139); S.add(sun2);
    flames(D, R, [[-12, -5, 1.6], [-5, -6, 1.2], [6, -5.6, 1.4], [12, -4.8, 1.8], [12, -21, 2.4], [15, -21, 2], [-20, -12, 2.4]]);
    drift(D, 300, 0, -10, 30, 20, 0xffa040, { y0: 0, y1: 16, size: 10 });
    farPainting(D, 'sun2', { v1: .42, z: -144, tint: 0xffffff });
  } else {
    const sun = new T.Mesh(new T.CircleGeometry(8, 32), new T.MeshBasicMaterial({ color: 0xffd080, fog: false })); sun.position.set(8, 2, -139); S.add(sun); D.glow(8, 3, -137, 60, 0xff9050);
    drift(D, 80, 0, -6, 20, 10, 0xff8030, { y0: 0, y1: 6, size: 7 });
    farPainting(D, 'sun', { v1: .5, z: -144 });
  }
  scatter(D, rng(119), { area: [-14, 14, -3, 6], pebbles: 120, stone: burn ? 0x3a2018 : 0x2a2430, puddles: burn ? 0 : 5 });
  decals(D, rng(838), { area: [-14, 14, -3, 6], list: [['scorch', 5, [2, 4]], ['crack', 4, [1.6, 3]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1065), { area: [-16, 16, -9, 4], items: [['namaqualand_boulder_02', 4, [.7, 1.4], { tint: 0x4a4048 }], ['rock_moss_set_02', 1, { s: [.25, .4] }, { tint: 0x4a4048 }]] });   // real CC0 models placed where they fit (kit.dress)
}
