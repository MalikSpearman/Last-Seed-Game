// Hold Line Call Centre (holdline) and the endless hold (holdline2). A vast pink-lit open-plan office: glossy floor,
// row after row of cubicles with monitors, headsets and potted plants, light panels marching to a vanishing point.
// Phase two: a magenta vortex tears through the ceiling, desks and monitors float up into it, phone handsets dangle on
// spiralling cords, papers storm, the floor cracks with pink light, the hold-music waveform glows across the dark.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, scatter, flurry, vortex, drift, model, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -2.4]], sum: [-5.2, .8], exposure: 1.45 };
const screen = glow => cvs(128, 96, (g, W, H) => { g.fillStyle = glow ? '#000' : '#1a1020'; g.fillRect(0, 0, W, H); g.fillStyle = glow ? '#ff70d0' : '#ff9ae0'; g.fillRect(8, 8, W - 16, H - 16); g.fillStyle = glow ? '#000' : '#ffffff'; for (let y = 18; y < H - 14; y += 10) g.fillRect(14, y, 40 + (y * 7 % 50), 4); });

// big polished vinyl office tiles: pale pink-white, faint mottling, hairline seams
const officeFloor = () => cvs(512, 512, (g, W) => { const R = rng(55); g.fillStyle = '#c8a8bc'; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = `hsl(${R.r(318, 336)},${R.r(16, 24)}%,${R.r(66, 72)}%)`; g.fillRect(i * W / 2 + 1, j * W / 2 + 1, W / 2 - 2, W / 2 - 2);
    for (let k = 0; k < 220; k++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '160,120,150'},${R.r(.04, .12)})`; g.beginPath(); g.arc(i * W / 2 + R() * W / 2, j * W / 2 + R() * W / 2, R.r(1, 5), 0, 7); g.fill(); } }
  g.fillStyle = 'rgba(90,60,85,.5)'; g.fillRect(0, W / 2 - 1, W, 2); g.fillRect(W / 2 - 1, 0, 2, W); g.fillRect(0, 0, W, 1); g.fillRect(0, 0, 1, W); });

export async function build(D, phase = 1) {
  const hold = phase === 2, K = kit(D), { S, add, box, prop } = K, R = rng(hold ? 702 : 701);
  S.fog = new T.Fog(hold ? 0x5a1450 : 0xe0b0d0, hold ? 18 : 40, hold ? 95 : 150); S.background = new T.Color(hold ? 0x2a0830 : 0xf8d8ec);
  D.moonlight(hold ? { color: 0xff70d0, intensity: 1.4, dir: [.1, 1, .3], ambient: 0x5a1a5a, ambientI: 2, sky: 0xff60c0, ground: 0x3a0a3a } : { color: 0xffffff, intensity: 1.7, dir: [.1, 1, .3], ambient: 0xc090b8, ambientI: 1.9, sky: 0xf8d0e8, ground: 0xb08aa8 });
  const M = { floor: new T.MeshStandardMaterial({ map: ctex(officeFloor(), [12, 34]), color: hold ? 0x8a5a8a : 0xe0c8d8, roughness: .3, metalness: 0 }),   // polished office vinyl tiles (no paving) panel: new T.MeshStandardMaterial({ color: hold ? 0x8a6a8a : 0xf4e8f0, roughness: .7 }),
    desk: new T.MeshStandardMaterial({ color: hold ? 0xa08aa0 : 0xfaf4f8, roughness: .4 }), black: new T.MeshStandardMaterial({ color: 0x2a2028, roughness: .5 }), light: new T.MeshBasicMaterial({ color: hold ? 0xff60c0 : 0xffe8f8 }),
    scr: new T.MeshStandardMaterial({ map: ctex(screen(0)), emissiveMap: ctex(screen(1)), emissive: 0xffffff, emissiveIntensity: 1 }), pot: new T.MeshStandardMaterial({ color: 0xd8d0d8 }), cord: new T.MeshStandardMaterial({ color: 0xff70d0, emissive: 0xc02090, emissiveIntensity: .6 }), ceil: new T.MeshStandardMaterial({ color: hold ? 0x2a0a2a : 0xfaf0f6 }) };
  { const f = new T.Mesh(new T.PlaneGeometry(50, 140), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -60); f.receiveShadow = true; S.add(f); }
  if (!hold) box(50, .4, 140, M.ceil, 0, 8, -60, { cast: false });
  // ceiling light panels marching away (phase two: torn loose)
  const lights = []; for (let z = 0; z > -120; z -= 6) for (const x of [-10, -3.4, 3.4, 10]) { const l = box(4, .1, 1.4, M.light, x, 7.8, z, { cast: false }); lights.push([l, x, z, R() * 6]); }
  for (let z = 0; z > -60; z -= 12) D.lantern(0, 7, z, { color: hold ? 0xff60c0 : 0xfff0fa, intensity: 16, distance: 18, glow: 0 });
  // ── cubicle rows down both sides of the central aisle ──
  const units = []; for (const s of [-1, 1]) for (let z = -2, i = 0; z > -100; z -= 3.4, i++) for (const c of [0, 1]) { const x = s * (7.5 + c * 4), g = new T.Group(); g.position.set(x, 0, z); S.add(g);
    K.add(new T.BoxGeometry(3.6, 1.6, .1), M.panel, 0, .8, -1.6, { to: g }); K.add(new T.BoxGeometry(.1, 1.6, 3.2), M.panel, s * -1.8, .8, 0, { to: g });
    if (i < 6) model(D, 'metal_office_desk', 0, 0, -.85, { s: 1.45, to: g, tint: hold ? 0xc0a0c0 : 0xfff0f8 }); else K.add(new T.BoxGeometry(3.2, .08, 1.4), M.desk, 0, 1.1, -.8, { to: g }); K.add(new T.BoxGeometry(.9, .6, .06), M.scr, 0, 1.6, -1.2, { to: g, cast: false }); K.add(new T.BoxGeometry(.1, .3, .1), M.black, 0, 1.25, -1.24, { to: g });
    if (i < 6) model(D, 'modern_arm_chair_01', 0, 0, .3, { h: 1.25, ry: Math.PI + Math.sin(z * 3.1 + x) * .3, to: g, tint: hold ? 0xd0a0c0 : 0x9090a0 });   // the near rows get real chairs (Poly Haven)
    else { K.add(new T.BoxGeometry(.7, .7, .7), M.black, 0, .7, .2, { to: g }); K.add(new T.BoxGeometry(.7, .8, .1), M.black, 0, 1.3, .55, { to: g }); }
    if ((i + c) % 3 === 0) { K.add(new T.CylinderGeometry(.18, .14, .3, 10), M.pot, 1.2, 1.3, -1.2, { to: g }); } units.push([g, x, z, R() * 6]); }
  for (let i = 0; i < 8; i++) await prop('ferns', (R() < .5 ? -1 : 1) * 6, -2 - i * 7, 1, { y: 1.3, blob: false });
  if (!hold) { model(D, 'WetFloorSign_01', 4.6, 0, -5.4, { h: 1, ry: -.5 }); model(D, 'CoffeeCart_01', -4.4, 0, -14, { h: 1.6, ry: .4 }); }
  for (const [x, z] of [[-5.3, -21], [5.3, -27], [-5.3, -39]]) model(D, 'potted_plant_02', x, 0, z, { h: 1.6, ry: x });
  model(D, 'security_camera_01', 0, 7.2, -9, { h: .5, ry: 0 }); model(D, 'korean_fire_extinguisher_01', 5.4, 0, -11, { h: .9, ry: -1.3 });
  if (hold) { // the vortex above, floating desks and monitors, dangling handsets, the waveform, cracked glowing floor
    vortex(D, 0, 14, -30, 30, '#ff40c0', { speed: .3, opacity: .85 }).rotation.x = Math.PI / 2; vortex(D, 0, 13.8, -30, 16, '#ffffff', { speed: -.5, opacity: .4 }).rotation.x = Math.PI / 2;
    D.updaters.push(t => { units.forEach(([g, x, z, ph], i) => { if (i % 4 || z < -40) return; g.position.y = 2 + Math.sin(t * .5 + ph) * 1 + (i % 3) * 2; g.rotation.set(Math.sin(t * .3 + ph) * .4, ph + t * .1, Math.cos(t * .35 + ph) * .3); });
      lights.forEach(([l, x, z, ph], i) => { if (i % 3) return; l.position.y = 9 + Math.sin(t * .4 + ph) * 2; l.rotation.z = Math.sin(t * .5 + ph) * .6; }); });
    for (let i = 0; i < 10; i++) { const x = R.r(-14, 14), z = R.r(-6, -30), y = R.r(8, 13), pts = []; for (let k = 0; k <= 30; k++) pts.push(new T.Vector3(x + Math.cos(k * .9) * .15, y - k * .14, z + Math.sin(k * .9) * .15)); add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 60, .02, 4), M.cord, 0, 0, 0, { cast: false });
      const hs = add(new T.CapsuleGeometry(.12, .6, 4, 8), M.cord, x, y - 4.4, z, { rz: Math.PI / 2 }); D.updaters.push(t => { hs.rotation.x = Math.sin(t + i) * .4; }); }
    { const pts = []; for (let k = 0; k <= 120; k++) { const x = -40 + k * .66; pts.push(new T.Vector3(x, 6 + Math.sin(k * .6) * Math.sin(k * .05) * 2.4, -40)); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 240, .08, 4), new T.MeshBasicMaterial({ color: 0xff60d0 }), 0, 0, 0, { cast: false }); D.glow(0, 10, -39, 20, 0xff40c0); { const fg = new T.Mesh(new T.PlaneGeometry(80, 56), new T.MeshBasicMaterial({ map: ctex(cvs(128, 128, (g, W, H) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(.45, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, W, H); })), color: 0xff40c0, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false, fog: false })); fg.rotation.x = -Math.PI / 2; fg.position.set(0, .04, -38); fg.renderOrder = 1; S.add(fg); }   /* the waveform light pools on the floor, so the glow fades into the ground instead of being cut off by it */ }
    for (let i = 0; i < 10; i++) { const pts = []; let x = R.r(-14, 14), z = R.r(-2, -24); for (let k = 0; k < 6; k++) { pts.push(new T.Vector3(x, .03, z)); x += R.r(-2, 2); z += R.r(-2, 2); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, .04, 4), new T.MeshBasicMaterial({ color: 0xff70e0 }), 0, 0, 0, { cast: false }); }
    flurry(D, R, 60, { area: [-16, 16, 2, -26], y0: 0, y1: 12, speed: 2.2 }); drift(D, 80, 0, -20, 16, 16, 0xff80e0, { y0: 1, y1: 14, size: 8 });
  } else { drift(D, 20, 0, -10, 14, 10, 0xffffff, { y0: 2, y1: 7, size: 4 }); flurry(D, R, 4, { area: [-12, 12, -2, -12], y0: 0, y1: 6, speed: .3 }); }
  scatter(D, rng(131), { area: [-14, 14, -3, 6], petals: hold ? 40 : 6, petal: 0xf4f0f0 });
  decals(D, rng(768), { area: [-14, 14, -3, 6], list: [['stain', 2, [.6, 1]], ['gum', 2, [.7, 1.1]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1230), { area: [-6, 6, -16, 3], items: [['cardboard_box_01', 2, { s: [1.6, 2] }]] });   // real CC0 models placed where they fit (kit.dress)
}
