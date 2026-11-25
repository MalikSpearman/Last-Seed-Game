// Shared kit for the modelled arena sets: code-painted textures, sky and moon, and the stock pieces
// (rails, dead trees, stone lanterns, hills, still water) that several sets share. Every set stays HD-2D:
// real geometry for what the fighters stand in, painted cut-outs (D.prop) for foliage and small props.
import { T } from './diorama.js';
export const IMG = n => new URL('./img/', import.meta.url).href + n + '.webp';

export function rng(sd) { let q = sd; const R = () => (q = (q * 9301 + 49297) % 233280) / 233280; R.r = (a, b) => a + R() * (b - a); return R; }
export function cvs(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
export function ctex(c, rep, srgb = true) { const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }

// a set-up helper bound to one diorama: meshes with shadows, boxes standing on their base, cut-out props
export function kit(D) {
  const S = D.scene;
  const add = (geo, mat, x, y, z, o = {}) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; m.castShadow = o.cast !== false; m.receiveShadow = true; (o.to || S).add(m); return m; };
  const box = (w, h, d, mat, x, y, z, o) => add(new T.BoxGeometry(w, h, d), mat, x, y + h / 2, z, o);
  const prop = (n, x, z, h, o) => D.prop(n.startsWith('data:') ? n : IMG(n), x, z, h, o);
  return { S, add, box, prop };
}

// ── sky: a gradient wall with stars and an optional spiral (a storm eye), plus a moon sprite ──
export function sky(D, stops, { stars = 220, swirl = null, z = -150, y = 40, w = 420, h = 160 } = {}) {
  const c = cvs(512, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); stops.forEach(([u, col]) => gr.addColorStop(u, col)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (swirl) { const [sx, sy, col] = swirl; g.globalCompositeOperation = 'lighter'; for (let a = 0; a < 40; a += .05) { const r = a * 5.5; g.fillStyle = col; g.globalAlpha = Math.max(0, .06 - a * .0012); g.beginPath(); g.arc(sx * W + Math.cos(a) * r * 1.6, sy * H + Math.sin(a) * r * .55, 10 + a * .6, 0, 7); g.fill(); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    const R = rng(7); for (let i = 0; i < 200; i++) { const cy = R() * H * .5; g.fillStyle = `rgba(20,8,30,${R.r(.08, .2)})`; g.beginPath(); g.ellipse(R() * W, cy + H * .1, R.r(30, 90), R.r(6, 16), 0, 0, 7); g.fill(); } });
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: ctex(c), fog: false })); m.position.set(0, y, z); D.scene.add(m);
  if (stars) { const R = rng(3), g = new T.BufferGeometry(), p = []; for (let i = 0; i < stars; i++) p.push(R.r(-w / 2, w / 2), R.r(y - 10, y + h / 2 - 5), z + 2); g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    D.scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: .5, fog: false, transparent: true, opacity: .7 }))); }
  return m;
}
export function moon(D, x, y, z, size, tint = [255, 248, 238], halo = [170, 120, 255]) {
  const [r, g0, b] = tint, [hr, hg, hb] = halo;
  const c = cvs(256, 256, (g, W) => { const gr = g.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, `rgb(${r},${g0},${b})`); gr.addColorStop(.42, `rgb(${r},${g0 - 6},${b - 6})`); gr.addColorStop(.47, `rgba(${hr},${hg},${hb},.35)`); gr.addColorStop(1, `rgba(${hr},${hg},${hb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, W, W); g.fillStyle = 'rgba(0,0,0,.14)'; for (const [x0, y0, rr] of [[105, 100, 18], [150, 140, 22], [120, 160, 10], [160, 95, 9], [90, 140, 7]]) { g.beginPath(); g.arc(x0, y0, rr, 0, 7); g.fill(); } });
  const s = new T.Sprite(new T.SpriteMaterial({ map: ctex(c), fog: false, transparent: true, depthWrite: false })); s.position.set(x, y, z); s.scale.set(size, size, 1); D.scene.add(s); return s;
}

// ── textures ──
// stone flags; cracks: 'lava' glows through the seams (use the second canvas as an emissive map)
export function flags(sd, { hue = [255, 280], sat = [8, 18], lit = [30, 44], rows = 6, cracks = null } = {}) {
  const R = rng(sd), seams = [];
  const col = cvs(512, 512, (g, W, H) => { g.fillStyle = '#1c1624'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) { const h = H / rows; let x = -R() * 120;
      while (x < W) { const w = R.r(90, 170); g.fillStyle = `hsl(${R.r(...hue)},${R.r(...sat)}%,${R.r(...lit)}%)`; g.fillRect(x + 3, r * h + 3, w - 6, h - 6);
        for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(${R() < .5 ? '255,240,255' : '20,10,30'},${R.r(.03, .09)})`; g.fillRect(x + R.r(4, w - 10), r * h + R.r(4, h - 10), R.r(3, 16), R.r(2, 7)); }
        seams.push([x, r * h, w, h]); x += w; } }
    if (cracks) { g.strokeStyle = '#140a10'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); let px = R() * W, py = R() * H; g.moveTo(px, py); for (let k = 0; k < 6; k++) { px += R.r(-40, 40); py += R.r(-40, 40); g.lineTo(px, py); } g.stroke(); } } });
  if (!cracks) return { col };
  const R2 = rng(sd + 1);
  const glow = cvs(512, 512, (g, W, H) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.strokeStyle = cracks; g.lineCap = 'round';
    for (const [x, y, w] of seams) if (R2() < .45) { g.lineWidth = R2.r(1.5, 4); g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x + w, y + 1); g.stroke(); }
    for (let i = 0; i < 14; i++) { g.lineWidth = R2.r(1.5, 3.5); g.beginPath(); let px = R2() * W, py = R2() * H; g.moveTo(px, py); for (let k = 0; k < 6; k++) { px += R2.r(-40, 40); py += R2.r(-40, 40); g.lineTo(px, py); } g.stroke(); } });
  return { col, glow };
}
export function planks(sd, { hue = 22, lit = [22, 34], n = 8, moss = true } = {}) {
  const R = rng(sd);
  return cvs(512, 512, (g, W, H) => { const w = W / n; g.fillStyle = '#140c0c'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) { let y = -R() * 200; while (y < H) { const L = R.r(140, 300); g.fillStyle = `hsl(${hue + R.r(-6, 6)},${R.r(20, 32)}%,${R.r(...lit)}%)`; g.fillRect(i * w + 2, y + 2, w - 4, L - 4);
        for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(20,10,6,${R.r(.12, .3)})`; g.lineWidth = 1; g.beginPath(); const gx = i * w + R.r(4, w - 4); g.moveTo(gx, y); g.lineTo(gx + R.r(-3, 3), y + L); g.stroke(); }
        g.fillStyle = 'rgba(10,6,4,.85)'; g.beginPath(); g.arc(i * w + w / 2, y + 12, 2.2, 0, 7); g.fill(); y += L; } }
    if (moss) for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(90,${R.r(110, 150)},50,${R.r(.25, .5)})`; g.beginPath(); g.ellipse(R() * W, R() * H, R.r(4, 18), R.r(2, 6), 0, 0, 7); g.fill(); } });
}
export function rough(sd, base = '#888') { const R = rng(sd); return cvs(256, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},.06)`; g.fillRect(R() * W, R() * H, 6, 6); }
  for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, r * 64, W, 3); for (let x = (r % 2) * 40; x < W; x += 80) g.fillRect(x, r * 64, 3, 64); } }); }
// a cloth banner: field colour, a border, an emblem drawn by fn(g,cx,cy), optional tatters
export function bannerTex({ field = ['#8c1424', '#6a0e1e'], trim = '#e3b552', emblem = null, tatter = false, sd = 5 } = {}) {
  const R = rng(sd);
  return cvs(256, 768, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, field[0]); gr.addColorStop(1, field[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = trim; g.lineWidth = 8; g.strokeRect(14, 14, W - 28, H - 90); if (emblem) emblem(g, W / 2, 290);
    g.globalCompositeOperation = 'destination-out';
    if (tatter) { for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(R() * W, R.r(120, H - 120), R.r(6, 20), R.r(10, 34), R(), 0, 7); g.fill(); }
      g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 24) g.lineTo(x, H - R.r(20, 150)); g.lineTo(W, H); g.fill(); }
    else { for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 32, H - 52); g.lineTo(x + 64, H); g.fill(); } }
    g.globalCompositeOperation = 'source-over'; });
}

// ── pieces ──
// a wooden rail along points [[x,z],..] at height y: posts every `step`, two rails, optional rope ties
export function rail(K, pts, { y = 0, h = 1, step = 1.6, mat, post = .16, rails = [.92, .5] } = {}) {
  const g = new T.Group(); K.S.add(g);
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), ry = -Math.atan2(bz - az, bx - ax), n = Math.max(1, Math.round(L / step));
    for (const f of rails) K.box(L, .09, .09, mat, (ax + bx) / 2, y + h * f, (az + bz) / 2, { ry, to: g });
    for (let k = 0; k < n; k++) { const u = k / n; K.box(post, h * 1.05, post, mat, ax + (bx - ax) * u, y, az + (bz - az) * u, { to: g }); } }
  const [lx, lz] = pts[pts.length - 1]; K.box(post, h * 1.05, post, mat, lx, y, lz, { to: g }); return g;
}
// a bare, twisted tree out of tapering branches (real geometry so it casts long shadows)
export function deadTree(K, x, z, h, mat, sd = 1, { glow = null } = {}) {
  const R = rng(sd), g = new T.Group(); g.position.set(x, 0, z); K.S.add(g);
  const branch = (p, dir, len, r, depth) => { const end = p.clone().add(dir.clone().multiplyScalar(len));
    const m = new T.Mesh(new T.CylinderGeometry(r * .62, r, len, 6), mat); m.position.copy(p).add(end).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize()); m.castShadow = true; g.add(m);
    if (depth <= 0 || r < .03) return; const k = depth > 2 ? 2 : 3;
    for (let i = 0; i < k; i++) { const d = dir.clone().add(new T.Vector3(R.r(-.9, .9), R.r(-.1, .5), R.r(-.5, .5))).normalize(); branch(end, d, len * R.r(.55, .75), r * .62, depth - 1); } };
  branch(new T.Vector3(0, 0, 0), new T.Vector3(R.r(-.15, .15), 1, 0).normalize(), h * .38, h * .05, 4);
  return g;
}
// a stone lantern (toro) of real blocks with a glowing fire box
export function stoneLantern(D, K, x, z, s = 1, { mat, color = 0xffa040, y = 0, light = true } = {}) {
  const box = (w, h, d, yy, m = mat) => K.box(w * s, h * s, d * s, m, x, y + yy * s, z);
  box(.7, .18, .7, 0); box(.22, .9, .22, .18); box(.55, .14, .55, 1.08);
  const fire = new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: color, emissiveIntensity: 2, roughness: .6 });
  box(.4, .4, .4, 1.22, fire); for (const [dx, dz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) K.box(.06 * s, .4 * s, .06 * s, mat, x + dx * s, y + 1.22 * s, z + dz * s);
  const roof = K.add(new T.ConeGeometry(.6 * s, .38 * s, 4), mat, x, y + 1.81 * s, z, { ry: Math.PI / 4 }); K.add(new T.SphereGeometry(.08 * s, 8, 6), mat, x, y + 2.05 * s, z);
  if (light) D.lantern(x, y + 1.42 * s, z + .1, { color, intensity: 14 * s, distance: 8 * s, glow: .8 * s }); else D.glow(x, y + 1.42 * s, z, 1.2 * s, color);
  return roof;
}
// low rolling hills on the horizon (smooth cones squashed flat)
export function hills(K, list, mat) { for (const [x, z, r, h] of list) { const m = K.add(new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, 0, z, { cast: false }); m.scale.set(r, h, r * .6); } }
// still dark water that mirrors its lights (glossy plane, a little ripple)
export function water(D, x, z, w, d, color = 0x1a1438, { y = -.25 } = {}) {
  const m = new T.Mesh(new T.PlaneGeometry(w, d, 1, 1), new T.MeshStandardMaterial({ color, roughness: .08, metalness: .6, transparent: true, opacity: .94 }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; D.scene.add(m); return m;
}
// a glowing particle drift: embers, will-o-wisps, sparks
export const drift = (D, n, cx, cz, rx, rz, color, o = {}) => D.fireflies(n, cx, cz, rx, rz, Object.assign({ color }, o));

// a torii of real beams: two pillars, the swept kasagi, the nuki tie, optional shimenawa rope with paper
export function torii(K, x, z, h, mat, { y = 0, ry = 0, dark = null, rope = null, tilt = 0 } = {}) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.rotation.z = tilt; K.S.add(g); const w = h * .82, r = h * .055;
  for (const s of [-1, 1]) { K.add(new T.CylinderGeometry(r, r * 1.15, h, 10), mat, s * w / 2, h / 2, 0, { to: g }); K.add(new T.CylinderGeometry(r * 1.4, r * 1.4, h * .08, 10), dark || mat, s * w / 2, h * .04, 0, { to: g }); }
  K.add(new T.BoxGeometry(w * 1.05, r * 1.3, r * 1.3), mat, 0, h * .74, 0, { to: g });
  const top = K.add(new T.BoxGeometry(w * 1.4, r * 1.5, r * 2.2), dark || mat, 0, h * .97, 0, { to: g });
  for (const s of [-1, 1]) K.add(new T.BoxGeometry(w * .18, r * 1.4, r * 2.1), dark || mat, s * w * .74, h * .99, 0, { to: g, rz: s * .18 });
  K.add(new T.BoxGeometry(w * 1.2, r * 1.1, r * 1.6), mat, 0, h * .9, 0, { to: g }); K.add(new T.BoxGeometry(r * 1.2, h * .16, r), dark || mat, 0, h * .82, 0, { to: g });
  if (rope) { const c = new T.CatmullRomCurve3([new T.Vector3(-w / 2, h * .66, r * 1.2), new T.Vector3(0, h * .55, r * 1.2), new T.Vector3(w / 2, h * .66, r * 1.2)]);
    K.add(new T.TubeGeometry(c, 20, r * .5, 6), rope, 0, 0, 0, { to: g });
    const pm = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x80a0ff, emissiveIntensity: .3, side: T.DoubleSide });
    for (let i = 1; i < 6; i++) { const p = c.getPoint(i / 6); const s = K.add(new T.PlaneGeometry(r * 1.4, r * 4), pm, p.x, p.y - r * 2.4, p.z + .02, { to: g, cast: false }); } }
  return g;
}
// a junk ship: a hull from stacked tapered boxes, a raised stern castle, masts with batten sails, lit portholes
export function ship(K, D, x, z, L, { y = 0, ry = 0, tilt = 0, sail = 0xb0202e, wreck = false, lights = true } = {}) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.set(0, ry, tilt); K.S.add(g);
  const hull = new T.MeshStandardMaterial({ color: wreck ? 0x2c2a2c : 0x3a2a22, roughness: .85 }), trim = new T.MeshStandardMaterial({ color: wreck ? 0x3a3a3e : 0x8a6a3a, roughness: .6 });
  const H = L * .16, B = L * .22;
  for (let i = 0; i < 5; i++) { const u = i / 5, w = L * (1 - u * .35), m = K.add(new T.BoxGeometry(w, H / 5, B * (1 - u * .4)), hull, 0, H - (i + .5) * H / 5, 0, { to: g }); }
  K.add(new T.BoxGeometry(L * .26, H * .7, B * .96), hull, -L * .36, H * 1.35, 0, { to: g }); K.add(new T.BoxGeometry(L * .12, H * .5, B * .8), hull, L * .44, H * 1.2, 0, { to: g });
  K.add(new T.BoxGeometry(L, .12, B + .1), trim, 0, H, 0, { to: g });
  if (lights && !wreck) { const pm = new T.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffa040, emissiveIntensity: 2 });
    for (let i = 0; i < 9; i++) K.add(new T.BoxGeometry(L * .04, H * .16, .05), pm, -L * .4 + i * L * .09, H * .62, B / 2 + .02, { to: g, cast: false });
    D.glow(x, y + H * 1.6, z, L * .25, 0xffa050); }
  const sm = new T.MeshStandardMaterial({ color: sail, roughness: .8, side: T.DoubleSide, emissive: sail, emissiveIntensity: .15, transparent: wreck, opacity: wreck ? .6 : 1 });
  const mast = new T.MeshStandardMaterial({ color: 0x2a1c16, roughness: .8 });
  for (const [mx, mh] of [[-L * .12, L * .75], [L * .18, L * .62], [-L * .38, L * .45]]) { const hh = wreck ? mh * .7 : mh;
    K.add(new T.CylinderGeometry(.06 * L / 10, .09 * L / 10, hh, 6), mast, mx, H + hh / 2, 0, { to: g, rz: wreck ? .25 : 0 });
    if (!wreck || mx < 0) { const sw = mh * .48, sh = hh * .78, sg = new T.PlaneGeometry(sw, sh, 4, 6), p = sg.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getY(i) / sh + .5) * Math.PI) * sw * .08 * (wreck ? .3 : 1)); sg.computeVertexNormals();
      const s = K.add(sg, sm, mx - sw * .42, H + hh * .52, .12, { to: g });
      for (let k = 0; k < 6; k++) K.add(new T.BoxGeometry(sw, .05, .05), mast, mx - sw * .42, H + hh * .52 - sh / 2 + k * sh / 5, .2, { to: g, cast: false }); } }
  return g;
}

// ── PBR materials from the baked texture library (r3d/tex: CC0 Poly Haven sets, see tools/arena_tex.py) ──
const TEXB = new URL('./tex/', import.meta.url).href, TL = new T.TextureLoader(), TC = {};
function ltex(file, rep, srgb) { const k = file + rep; if (TC[k]) return TC[k];
  const t = TL.load(TEXB + file + '.webp'); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; if (srgb) t.colorSpace = T.SRGBColorSpace; return (TC[k] = t); }
// pbr('rock_tile_floor', [6, 6], { color, rough, metal, ns, glow: 'lava_flags', emissive, ei, rmap, side })
export function pbr(name, rep = [1, 1], o = {}) {
  const m = new T.MeshStandardMaterial({ map: ltex(name + '_c', rep, true), normalMap: ltex((o.nmap || name) + '_n', rep), roughnessMap: ltex((o.rmap || name) + '_r', rep),
    roughness: o.rough ?? 1, metalness: o.metal ?? 0, color: o.color ?? 0xffffff, side: o.side ?? T.FrontSide });
  m.normalScale.set(o.ns ?? 1, o.ns ?? 1);
  if (o.glow) { m.emissiveMap = ltex(o.glow + '_e', rep, true); m.emissive = new T.Color(o.emissive ?? 0xffffff); m.emissiveIntensity = o.ei ?? 1; }
  return m;
}

// lit shoji walls: a paper-window grid whose lit panes glow (colour + matching emissive map from one seed)
const SHOJI = {};
export function shojiMat(sd, rep = [1, 1], o = {}) {
  sd = sd % 8 + 1; rep = rep.map(v => Math.max(.5, Math.round(v * 2) / 2)); const key = sd + '|' + rep + '|' + JSON.stringify(o); if (SHOJI[key]) return SHOJI[key];
  const draw = glow => { const R = rng(sd); return cvs(256, 128, (g, W, H) => { g.fillStyle = glow ? '#000' : (o.frame || '#3a2418'); g.fillRect(0, 0, W, H);
    for (let x = 6; x < W; x += 50) { const on = R() < (o.lit ?? .8); g.fillStyle = glow ? (on ? '#ffb060' : '#000') : on ? '#ffd090' : '#2a1810'; g.fillRect(x, 20, 40, 80);
      g.fillStyle = glow ? '#000' : (o.frame || '#3a2418'); g.fillRect(x + 19, 20, 3, 80); g.fillRect(x, 58, 40, 3); } }); };
  return (SHOJI[key] = new T.MeshStandardMaterial({ map: ctex(draw(0), rep), emissiveMap: ctex(draw(1), rep), emissive: 0xffa050, emissiveIntensity: o.ei ?? 1.3, roughness: .8 }));
}
// a pagoda-roofed hall: lit walls, tiers of hipped roofs with flared eaves; returns its top height
export function pagoda(K, D, x, z, { w = 6, d = 5, h = 3, tiers = 2, y = 0, wall, roof, beam, sd = 1, lamp = true, ry = 0 } = {}) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; K.S.add(g); let yy = 0;
  for (let t = 0; t < tiers; t++) { const s = 1 - t * .22, ww = w * s, dd = d * s, hh = t ? h * .6 : h, wm = wall || shojiMat(sd + t, [ww / 4, 1]);
    const b = K.add(new T.BoxGeometry(ww, hh, dd), [wm, wm, roof, roof, wm, wm], 0, yy + hh / 2, 0, { to: g });
    if (beam) { K.add(new T.BoxGeometry(ww + .2, .18, dd + .2), beam, 0, yy + hh - .05, 0, { to: g }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add(new T.BoxGeometry(.22, hh, .22), beam, sx * ww / 2, yy + hh / 2, sz * dd / 2, { to: g }); }
    yy += hh; const r = K.add(new T.ConeGeometry(Math.max(ww, dd) * .86, 1.3 * s + .4, 4, 1), roof, 0, yy + .55 * s, 0, { to: g, ry: Math.PI / 4 }); r.scale.set(ww / Math.max(ww, dd) * 1.25, 1, dd / Math.max(ww, dd) * 1.25);
    yy += .9 * s; }
  K.add(new T.ConeGeometry(.12, 1, 6), beam || roof, 0, yy + .6, 0, { to: g });
  if (lamp) D.lantern(x, y + h * .55, z + d / 2 + 1, { intensity: 12, distance: 10, glow: 0 });
  return y + yy;
}
