// Arena life for the HD-2D fight sets: weather, drifting leaves and ground mist, element-coloured hit light,
// impact dust and ground cracks, and marks that stay on the ground for the rest of the fight
// (scorch, frost, puddles, poison, burnt lightning scars, blood), plus lanterns that flare from fire.
import { T } from './diorama.js';

const EL = {
  fire:  { c: 0xff7a2b, mark: 'scorch' }, ice: { c: 0x8be9ff, mark: 'frost' }, water: { c: 0x5ab4ff, mark: 'puddle' },
  storm: { c: 0xffe14a, mark: 'bolt' },   venom: { c: 0x9be34a, mark: 'poison' }, blood: { c: 0xff4d6a, mark: 'blood' },
  shadow:{ c: 0xd58bff, mark: 'void' },   mind: { c: 0xc86bff, mark: 'void' },   wind: { c: 0x8ff0c8, mark: 'gust' },
  life:  { c: 0x5fe0a0, mark: 'bloom' },  metal:{ c: 0xc8d2e0, mark: 'crack' },  sound: { c: 0xff7ad9, mark: 'crack' },
  none:  { c: 0xfff1d0, mark: 'crack' },
};
export const elColor = e => (EL[e] || EL.none).c;

// ── procedural decal textures (drawn once, cached) ──
const DEC = {};
function decal(kind) {
  if (DEC[kind]) return DEC[kind];
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), m = S / 2;
  const rad = (r, stops) => { const gr = g.createRadialGradient(m, m, 0, m, m, r); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.beginPath(); g.arc(m, m, r, 0, 7); g.fill(); };
  const blot = (n, r0, r1, col, spread) => { g.fillStyle = col; for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, d = Math.random() * spread; g.beginPath(); g.arc(m + Math.cos(a) * d, m + Math.sin(a) * d, r0 + Math.random() * (r1 - r0), 0, 7); g.fill(); } };
  const cracks = (n, len, col, w) => { g.strokeStyle = col; g.lineCap = 'round'; for (let i = 0; i < n; i++) { let x = m, y = m, a = i / n * 6.28 + Math.random() * .5; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { a += (Math.random() - .5) * .9; const L = len / 7 * (.6 + Math.random() * .8); x += Math.cos(a) * L; y += Math.sin(a) * L; g.lineTo(x, y); g.lineWidth = Math.max(.6, g.lineWidth * .8); } g.stroke(); } };
  switch (kind) {
    case 'scorch': rad(118, [[0, 'rgba(10,6,4,.92)'], [.55, 'rgba(25,12,6,.7)'], [1, 'rgba(30,15,8,0)']]); blot(26, 2, 5, 'rgba(255,120,40,.85)', 70); blot(10, 1, 3, 'rgba(255,220,120,.9)', 50); break;
    case 'frost': rad(122, [[0, 'rgba(210,245,255,.85)'], [.6, 'rgba(150,215,255,.5)'], [1, 'rgba(150,215,255,0)']]); cracks(14, 110, 'rgba(255,255,255,.9)', 3); break;
    case 'puddle': rad(116, [[0, 'rgba(60,120,200,.65)'], [.75, 'rgba(70,140,220,.45)'], [1, 'rgba(70,140,220,0)']]); g.strokeStyle = 'rgba(190,225,255,.6)'; g.lineWidth = 2; for (const r of [40, 70, 95]) { g.beginPath(); g.ellipse(m, m, r, r * .9, 0, 0, 7); g.stroke(); } break;
    case 'poison': rad(112, [[0, 'rgba(110,200,40,.75)'], [.6, 'rgba(70,150,30,.5)'], [1, 'rgba(70,150,30,0)']]); blot(18, 4, 10, 'rgba(190,255,90,.55)', 80); break;
    case 'blood': blot(30, 4, 14, 'rgba(110,10,25,.75)', 90); rad(60, [[0, 'rgba(120,10,30,.7)'], [1, 'rgba(120,10,30,0)']]); break;
    case 'bolt': rad(110, [[0, 'rgba(15,12,8,.85)'], [1, 'rgba(20,15,8,0)']]); cracks(9, 120, 'rgba(255,230,90,.95)', 4); break;
    case 'void': rad(116, [[0, 'rgba(20,4,30,.85)'], [.6, 'rgba(60,10,90,.45)'], [1, 'rgba(60,10,90,0)']]); blot(14, 2, 5, 'rgba(210,140,255,.8)', 70); break;
    case 'gust': g.strokeStyle = 'rgba(30,40,30,.55)'; g.lineWidth = 5; for (let i = 0; i < 9; i++) { const r = 30 + i * 10; g.beginPath(); g.arc(m, m, r, i, i + 2.2); g.stroke(); } break;
    case 'bloom': rad(110, [[0, 'rgba(120,255,170,.55)'], [1, 'rgba(120,255,170,0)']]); blot(22, 3, 6, 'rgba(255,190,220,.9)', 85); blot(16, 3, 5, 'rgba(255,255,255,.85)', 85); break;
    default: rad(70, [[0, 'rgba(10,8,6,.6)'], [1, 'rgba(10,8,6,0)']]); cracks(10, 115, 'rgba(15,12,10,.9)', 5); cracks(6, 80, 'rgba(255,240,210,.35)', 1.5);
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return (DEC[kind] = t);
}

export class ArenaFX {
  constructor(D) {
    this.D = D; this.marks = []; this.flashes = []; this.dust = []; this.weatherKind = 'clear';
    const L = this.L = []; for (let i = 0; i < 2; i++) { const p = new T.PointLight(0xffffff, 0, 10, 1.4); D.scene.add(p); L.push(p); }
    D.wind = 1; this.gust = 0;
    D.updaters.push((t, dt) => this.tick(t, dt));
  }
  // ── weather: clear / rain / snow / fog, picked per fight ──
  weather(kind, c) {
    const D = this.D; this.weatherKind = kind;
    if (this.wx) { D.scene.remove(this.wx); this.wx.geometry.dispose(); this.wx = null; }
    const f = D.scene.fog, base = this.fog0 || (this.fog0 = { near: f.near, far: f.far, col: f.color.clone() });
    f.near = base.near; f.far = base.far; f.color.copy(base.col); D.scene.background.copy(base.col); D.wind = 1;
    if (D.moon) { this.moon0 = this.moon0 ?? D.moon.intensity; D.moon.intensity = this.moon0; }
    if (kind === 'fog') { f.near = 6; f.far = 34; f.color.set(0x2a3352); D.scene.background.set(0x2a3352); }
    if (kind === 'rain') { f.far = base.far * .7; f.color.set(0x0a1024); D.scene.background.set(0x0a1024); D.wind = 1.8; if (D.moon) D.moon.intensity = this.moon0 * .7; }
    if (kind === 'snow') { f.color.set(0x1c2442); D.scene.background.set(0x1c2442); }
    if (kind === 'rain' || kind === 'snow') {
      const n = kind === 'rain' ? 2400 : 1400, g = new T.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n);
      for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() * 2 - 1) * 22; p[i * 3 + 1] = Math.random() * 16; p[i * 3 + 2] = (Math.random() * 2 - 1) * 12; s[i] = Math.random() * 100; }
      g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('seed', new T.BufferAttribute(s, 1));
      const rain = kind === 'rain';
      const mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, sz: { value: (rain ? 7 : 9) * D.renderer.getPixelRatio() }, ctr: { value: new T.Vector3(...c) } },
        vertexShader: `uniform float t; uniform float sz; uniform vec3 ctr; attribute float seed; varying float a;
          void main(){ vec3 q=position+ctr; float sp=${rain ? '14.' : '1.1'}; q.y=mod(position.y - t*sp - seed*.37, 16.);
            q.x+=${rain ? 'q.y*.12' : 'sin(t*.7+seed)*.6'}; q.z+=${rain ? '0.' : 'cos(t*.5+seed*1.3)*.4'};
            vec4 mv=modelViewMatrix*vec4(q,1.); a=clamp(q.y/2.,0.,1.); gl_PointSize=sz/(-mv.z)*8.; gl_Position=projectionMatrix*mv; }`,
        fragmentShader: rain
          ? `varying float a; void main(){ vec2 c=gl_PointCoord-.5; if(abs(c.x)>.06) discard; gl_FragColor=vec4(.75,.82,1.,.42*a*(1.-abs(c.y)*1.8)); }`
          : `varying float a; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(1.,1.,1.,.85*a*smoothstep(.5,.15,d)); }` });
      this.wx = new T.Points(g, mat); this.wx.frustumCulled = false; this.wxMat = mat; D.scene.add(this.wx);
    }
  }
  // ── living scenery: green leaves drift through, low mist rolls along the ground ──
  life(c) {
    const D = this.D; this.leaves = this.leaves || {}; const lk = c.join(','); if (!this.leaves[lk]) this.leaves[lk] = D.petals(46, c[0], c[2] - 1, 9, { color: 0x8fc46a });
    if (!this.mist) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(200,215,255,.35)'); gr.addColorStop(1, 'rgba(200,215,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      const tx = new T.CanvasTexture(cv); this.mist = [];
      for (let i = 0; i < 9; i++) { const m = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, opacity: .35, fog: true }));
        m.userData = { ox: (Math.random() * 2 - 1) * 14, z: (Math.random() * 2 - 1) * 5, sp: .2 + Math.random() * .3, ph: Math.random() * 6 }; m.scale.set(9, 2.2, 1); D.scene.add(m); this.mist.push(m); }
    }
    this.mistC = c;
  }
  // ── a hit lands: element light, dust, cracks on big hits, a lasting mark for elemental hits ──
  impact(pos, o = {}) {
    if (!pos) return; const D = this.D, e = EL[o.el] ? o.el : 'none', col = elColor(e), big = !!o.big;
    const L = this.L[this.li = (this.li + 1 || 0) % this.L.length]; L.position.set(pos.x, pos.y + 1.6, pos.z + .6); L.color.setHex(col); L.userData.k = big ? 1 : .6; L.distance = big ? 14 : 9;
    this.puff(pos, big ? 26 : 12, big);
    if (big) { this.gust = Math.min(1.6, this.gust + (o.fin ? 1.2 : .6)); }
    if (e !== 'none' && (big || o.fin)) this.mark(pos, EL[e].mark, big ? 2.6 : 1.8);
    else if (big && o.fin) this.mark(pos, 'crack', 2.4);
    if (e === 'fire' && D.spots) for (const s of D.spots) { const d = Math.hypot(s.x - pos.x, s.z - pos.z); if (d < 9) s.boost = Math.max(s.boost || 0, 1.4 * (1 - d / 9)); }
  }
  mark(pos, kind, size) {
    const D = this.D, m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: decal(kind), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, opacity: 0, fog: true }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.3; m.position.set(pos.x + (Math.random() - .5) * .6, pos.y + .02 + this.marks.length * .001, pos.z + (Math.random() - .5) * .4);
    m.scale.set(size * (1 + Math.random() * .3), size, 1); m.renderOrder = 2; D.scene.add(m);
    this.marks.push({ m, t: 0, life: kind === 'puddle' || kind === 'frost' ? 40 : 60 });
    while (this.marks.length > 10) { const o = this.marks.shift(); D.scene.remove(o.m); o.m.geometry.dispose(); o.m.material.dispose(); }
  }
  puff(pos, n, big) {
    const D = this.D, g = new T.BufferGeometry(), p = new Float32Array(n * 3), v = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = pos.x + (Math.random() - .5) * .8; p[i * 3 + 1] = pos.y + .1; p[i * 3 + 2] = pos.z + (Math.random() - .5) * .5; const a = Math.random() * 6.3, s = (big ? 2.6 : 1.6) * (.4 + Math.random()); v[i * 3] = Math.cos(a) * s; v[i * 3 + 1] = .4 + Math.random() * (big ? 1.6 : .9); v[i * 3 + 2] = Math.sin(a) * s * .5; }
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    const mat = new T.PointsMaterial({ color: 0xb8b0a0, size: big ? .55 : .38, transparent: true, opacity: .55, depthWrite: false, sizeAttenuation: true });
    const pts = new T.Points(g, mat); D.scene.add(pts); this.dust.push({ pts, v, t: 0 });
  }
  clear() { const D = this.D; for (const o of this.marks) { D.scene.remove(o.m); o.m.geometry.dispose(); o.m.material.dispose(); } this.marks = []; for (const d of this.dust) D.scene.remove(d.pts); this.dust = []; }
  tick(t, dt) {
    const D = this.D;
    for (const L of this.L) { const k = L.userData.k || 0; L.intensity = k * k * 60; L.userData.k = Math.max(0, k - dt * 2.2); }
    this.gust = Math.max(0, this.gust - dt * .7); D.wind = (this.weatherKind === 'rain' ? 1.8 : 1) + this.gust * 3;
    if (D.spots) for (const s of D.spots) if (s.boost) { s.boost = Math.max(0, s.boost - dt * .35); }
    for (const o of this.marks) { o.t += dt; const a = Math.min(1, o.t * 5) * Math.min(1, Math.max(0, (o.life - o.t) / 6)); o.m.material.opacity = a * .9; }
    for (let i = this.dust.length - 1; i >= 0; i--) { const d = this.dust[i]; d.t += dt; const p = d.pts.geometry.attributes.position; for (let k = 0; k < p.count; k++) { d.v[k * 3 + 1] -= dt * 1.4; p.array[k * 3] += d.v[k * 3] * dt; p.array[k * 3 + 1] = Math.max(.05, p.array[k * 3 + 1] + d.v[k * 3 + 1] * dt); p.array[k * 3 + 2] += d.v[k * 3 + 2] * dt; d.v[k * 3] *= .96; d.v[k * 3 + 2] *= .96; } p.needsUpdate = true; d.pts.material.opacity = .55 * Math.max(0, 1 - d.t / 1.3); if (d.t > 1.3) { D.scene.remove(d.pts); d.pts.geometry.dispose(); d.pts.material.dispose(); this.dust.splice(i, 1); } }
    if (this.wxMat) this.wxMat.uniforms.t.value = t;
    if (this.mist && this.mistC) { const c = this.mistC; for (const m of this.mist) { const u = m.userData; m.position.set(c[0] + ((u.ox + t * u.sp + 14) % 28) - 14, c[1] + .5 + Math.sin(t * .3 + u.ph) * .1, c[2] + u.z); m.material.opacity = (this.weatherKind === 'fog' ? .55 : .28) * (.8 + .2 * Math.sin(t * .4 + u.ph)); } }
  }
}
