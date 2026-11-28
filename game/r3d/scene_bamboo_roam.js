// The walkable Bamboo zone. The landmarks dress the shared path without changing its collision.
import { T, tex } from './diorama.js';
import { nearest } from './scene_bamboo.js';
import { buildRedBridge } from './scene_bridge.js';
import { buildBambooApproaches, buildBridgeChannel, buildShrineStairs } from './bamboo_surfaces.js';

import { dressBambooLandmarks } from './bamboo_landmarks.js';

const art = (name, folder = './img/') => new URL(folder + name, import.meta.url).href;
const sprite = name => art(name + '.webp');
const ravine = art('bridge_ravine.jpg');
const HORIZONS = [
  { name: 'Willow Road', x: -88, src: 'w_village', width: 60, color: 0x9bb8bd },
  { name: 'Stone Pilgrims’ Road', x: -53, src: 'w_graves', width: 60, color: 0x96a5be },
  { name: 'Red Bridge', x: -16, width: 51, depth: -21, color: 0xd9e5fa },
  { name: 'Lantern Grove', x: 10, src: 'w_bamboo', width: 60, depth: -28, color: 0xb5c8bf },
  { name: 'Shrine Ascent', x: 27, src: 'w_bamboo', width: 50, depth: -40, color: 0x7696ac },
  { name: 'East Bamboo Road', x: 49, src: 'w_bamboo', width: 65, depth: -29, color: 0xb8cec9 },
  { name: 'Festival Gate', x: 81, src: 'road', width: 58, color: 0xc0adb0 },
];

function skyline(D, { name, x, src, width, color, depth = -20 }) {
  const bridge = !src;
  const height = bridge ? 23 : 25, centerY = bridge ? 3.9 : 4.8;
  const groundV = .5 - centerY / height;
  const geometry = new T.PlaneGeometry(width, height, 20, 20);
  const uv = geometry.attributes.uv, colors = [];
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    const edge = T.MathUtils.smoothstep(Math.min(u, 1 - u), 0, bridge ? .19 : .25);
    // Fade in above the point where the ground plane would clip the painting.
    const ground = T.MathUtils.smoothstep(v, groundV + .022, groundV + .16);
    colors.push(1, 1, 1, edge * ground);
  }
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 4));
  const map = tex(bridge ? ravine : art('bg_' + src + '.webp', '../img/'));
  const material = new T.MeshBasicMaterial({ map, color, vertexColors: true, transparent: true,
    depthWrite: false, fog: false, toneMapped: false });
  const mesh = new T.Mesh(geometry, material);
  mesh.name = name + ' painting';
  mesh.position.set(x, centerY, depth);
  // Composite the distant plates behind the river and other translucent world objects.
  mesh.renderOrder = bridge ? -29 : -30;
  mesh.raycast = () => {};
  D.scene.add(mesh);
}

export async function buildBambooRoam(D) {
  D.scene.background.set(0x17283f);
  D.scene.fog = new T.Fog(0x29435a, 19, 68);
  D.moonlight({ color: 0xb5d9fb, intensity: 2.24, dir: [-.6, 1, -.35],
    ambient: 0x655477, ambientI: 1.88, sky: 0x9bbcd6, ground: 0x4c4546 });
  buildBridgeChannel(D, 320, 330, 0x7d9a87, 0x3d7794);
  for (const horizon of HORIZONS) skyline(D, horizon);
  buildBambooApproaches(D, true);
  const { box, place, lacquer, paper, iron, lantern, canopy } = buildRedBridge(D);

  buildShrineStairs(D);
  dressBambooLandmarks(D, { box, place, lacquer, paper, iron, lantern, canopy });

  const paintedProps = [];
  function prop(name, x, z, h, options = {}) {
    paintedProps.push([name, x, z, h, options]);
  }
  const stone = new T.MeshStandardMaterial({ color: 0x738391, roughness: .95 });
  const darkRoof = new T.MeshStandardMaterial({ color: 0x363952, roughness: .93 });
  function waylight(x, z, y, color, wood = false) {
    const frame = wood ? lacquer : stone;
    box(.22, 1.5, .24, frame, x, y + .75, z, true);
    box(.5, .14, .47, frame, x, y + .13, z);
    place(lantern, paper, x, y + 1.61, z);
    place(canopy, iron, x, y + 1.85, z);
    D.lantern(x, y + 1.62, z + .16, { color, intensity: wood ? 7 : 5, distance: 7, glow: .35 });
  }
  function gate(x, z, y, width, clearWalkLane = false) {
    for (const dir of [-1, 1]) {
      box(.32, 3.38, .35, lacquer, x + dir * width / 2, y + 1.69, z, true);
      box(.48, .43, .51, stone, x + dir * width / 2, y + .21, z);
    }
    const top = [
      box(width + .74, .24, .29, lacquer, x, y + 2.78, z),
      box(width + 1.1, .29, .46, darkRoof, x, y + 3.4, z, true),
      box(.56, .55, .15, lacquer, x, y + 3.02, z + .06),
    ];
    if (clearWalkLane) {
      const materials = [lacquer.clone(), darkRoof.clone()];
      for (const material of materials) { material.transparent = true; material.depthWrite = false; }
      top.forEach((mesh, i) => { mesh.material = materials[i === 1 ? 1 : 0]; });
      D.updaters.push(() => {
        const p = D.focus;
        const lookThrough = p && p.z < z + .20 && D.camera.position.z > z - .45
          && Math.abs(x - p.x) < width * .68;
        const target = lookThrough ? .025 : 1;
        for (const material of materials) material.opacity += (target - material.opacity) * .18;
      });
    }

  }

  // Willow Road and the stone pilgrimage each have a different roadside rhythm.
  prop('rg_willow', -94.5, -5.85, 8.5, { tint: 0xa3bcb1, sway: .028 });
  prop('bamboo_willow_shelter.png', -87.2, -8.18, 4.25, { y: .21, tint: 0xd4c2a6 });
  prop('rg_well', -83.6, -1.6, 2.05, { tint: 0xb5b5bb });
  prop('rg_maple', -77, -5, 7.9, { tint: 0xcab3a9, sway: .025 });
  prop('rg_willow', -70, -7, 8, { tint: 0x9db5af, sway: .021, flip: true });
  for (const x of [-65, -57, -47, -34, -25]) {
    prop('rg_jizo', x + .7, -1.15, 1.37, { tint: 0xbad0cb });
    prop('rg_mossrock', x - 1.2, -2, 1.5, { tint: 0xa0a8b8 });
    waylight(x, -.65, 0, 0x97d6ef);
  }
  waylight(-92, -.7, 0, 0xffba79, true);
  waylight(-82, -.8, 0, 0xffc080, true);
  waylight(-73, -1.2, 0, 0xffb06b, true);

  // A broken pilgrimage precinct sits back from the road, with a real raised terrace.
  for (const [x, w, z] of [[-59, 5.1, -3.35], [-52.9, 5.6, -3.65], [-46.5, 5.3, -3.43]]) {
    D.box(x, .24, z, w, .43, 1.68, sprite('t_stone'), [w / 2.5, .8], 0x555e58);
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * w / 5, setback = i === 2 ? .03 : .06 * Math.sin(dx * 7);
      const block = D.box(x + dx, .295, z + setback, w / 5 - .018, .075, 1.72,
        sprite('t_stone'), [.37, .47], i % 2 ? 0x717572 : 0x626d6d);
      block.rotation.y = .04 * Math.sin(dx * 4 + x);
    }
  }
  prop('rg_jizo', -53, -3.55, 2.35, { y: .3, tint: 0xa6c7c6 });
  prop('rg_mossrock', -55.8, -4.3, 1.4, { tint: 0x83a89e });
  prop('rg_mossrock', -49.65, -4.75, 1.54, { tint: 0x849fa9 });
  D.lantern(-53, 1.8, -2.8, { color: 0x9ad8fa, intensity: 5, distance: 8, glow: .35 });

  // The well sits beside a damp basin and exposed stones at the Willow bend.
  const pool = D.water(-86.8, -3.9, 7.1, 3.7, { color: 0x1d4050, flow: [.21, .48] });
  pool.position.y = .008;
  pool.material.fragmentShader = pool.material.fragmentShader.replace(
    'gl_FragColor=vec4(c,.88*edge+.04);',
    'gl_FragColor=vec4(c,(.88*edge+.04)*(1.0-smoothstep(.33,.5,length(vUv-.5))));');
  for (const [x,z,h] of [[-89.8,-2.6,1.12],[-88,-5.25,1.45],[-84.3,-4.3,1.15],[-82,-3.4,.86]]) {
    prop('rg_mossrock', x, z, h, { tint: 0x91b39e });
  }

  // Open the ravine sightline on both ramps. Keep its boldest color off the moving feet.
  prop('rg_maple', -24.5, -3.55, 6.45, { tint: 0xa584ac, sway: .021 });
  prop('rg_maple', -8.95, -4.2, 6.35, { tint: 0xbb91a0, sway: .025, flip: true });
  for (const [x,z,h] of [[-19.4,-.8,1.15],[-12.2,-1.6,1.4],[-19.5,-8,2],[-12.8,-9,2.2]]) {
    prop('rg_mossrock', x, z, h, { tint: 0x98bac3 });
  }

  // Reserved breaks in the canopy give the amber pools a rhythm on the earthen lane.
  prop('rg_bamclump', -.4, -7.2, 7.8, { sway: .022, tint: 0x91b7a4 });
  prop('rg_bamclump', 15.3, -7.9, 8.4, { sway: .018, tint: 0x7daca6 });
  prop('ferns', 8.3, -1.9, 1.05, { sway: .014, tint: 0xa2aa75 });
  prop('rg_mossrock', 17.8, -3.9, 1.75, { tint: 0x9ca183 });

  // Lantern Grove and the shrine climb. Keep roof geometry behind the walkable court.
  for (const x of [-7.7, -.6, 6.6, 16.9, 22.7]) waylight(x, -.75, 0, 0xffaa6a, true);
  for (const [x,z,h] of [[-5,-7,6.3],[2.1,-5.2,5.8],[10.5,-5.3,6.2],[16.9,-8.3,6.9]]) {
    prop('sakura', x, z, h, { tint: 0xffc6cc, sway: .025, flip: x > 0 });
  }
  gate(27, -9.6, 3, 4.2, true);
  for (const side of [-1, 1]) {
    for (const [z,y] of [[-1,.54],[-3.8,1.72],[-6.4,2.84],[-14.8,3]]) waylight(27 + side * 2.3, z, y, 0xffbd7c, true);
    // Splayed retaining courses tie the stair to the raised court without covering its treads.
    for (let i = 0; i < 3; i++) {
      const x = 27 + side * (3.28 + i * 1.22), y = 1.42 - i * .36;
      D.box(x, y, -5.6 - i * .12, 1.32, y + .12, 2.56 - i * .28, sprite('t_stone'),
        [.72, .95], 0x525b5f);
    }
    prop('rg_mossrock', 27 + side * 5.9, -4.9, 1.45, { tint: 0x829b8c });
    prop('komainu', 27 + side * 3.3, -8.6, 1.65, { y: 3, flip: side < 0 });
    // A tall, wide court billboard used to put painted roots and branches across the crest.
    // Root both crowns at grade beyond the entire retaining wall and let the court frame them.
    const outside = 27 + side * (side < 0 ? 11.1 : 11.8);
    prop('sakura', outside, -16.3, 7.7, { tint: 0xc299b6, sway: .015, flip: side > 0 });
    prop('rg_mossrock', 27 + side * 6.55, -15.6, .66, { y: 2.994, tint: 0x809778 });
    prop('ferns', 27 + side * 6.65, -19.01, .55, { y: 2.994, sway: .012, tint: 0xa39e77 });
  }
  prop('bamboo_shrine_facade.png', 27, -22.06, 5.25, { y: 3.19, tint: 0xe4d5c7 });
  prop('offering', 27, -17.7, 1.15, { y: 3 });

  // The east grove opens into the lantern gate toward Sunset Road.
  for (const x of [37, 47, 58, 69, 77]) waylight(x, -1, 0, x < 60 ? 0x97e5d3 : 0xffa074, true);
  prop('rg_bamclump', 38.8, -4.35, 6.4, { sway: .025 });
  prop('rg_maple', 53, -4.5, 7.4, { sway: .021, tint: 0xe0aa98 });
  prop('rg_yatai', 71, -4.7, 3.2, { tint: 0xe2b8a7 });
  prop('rg_goldfish', 76, -5.2, 2.9, { tint: 0xf2b191 });
  gate(78, -.2, 0, 4.6);
  // Uneven masonry wings sit behind the lane, open where the stalls meet the road.
  for (const [x, width, height] of [[73.8, 2.65, .43], [83.2, 3.9, .64]]) {
    D.box(x, height, -1.22, width, height + .12, .61, sprite('t_stone'),
      [width / 2.4, .55], 0x6d625b);
    for (let i = 0; i < 4; i++) {
      D.box(x + (i - 1.5) * width / 4, height + .10, -1.22, width / 4 - .016,
        .11, .72, sprite('t_stone'), [.39, .33], i % 2 ? 0x7c756a : 0x6c685c);
    }
  }

  // Low midground silhouettes replace the old full-wall scatter, leaving sightlines to the paintings.
  for (let x = -101; x <= 85; x += 5.8) {
    if (x > -25.7 && x < -7 || x > 18 && x < 38 || x > -92 && x < -82 || x > 69 && x < 78) continue;
    const z = -4.9 - (Math.sin(x * .73) + 1) * 4;
    if (nearest(x, z).over <= 1.18) continue;
    prop(x % 3 > 1 ? 'bamboo1' : 'bamboo3', x, z, 6 + (1 + Math.sin(x)) * 1.1,
      { sway: .018, flip: Math.sin(x) > 0, tint: x < -24 ? 0x9aafc0 : 0x88b3a5 });
  }
  for (const x of [-85, -58, -37, 0, 13, 42, 59, 73]) {
    prop('ferns', x, 6.6, .85, { fadeNear: true, sway: .017, tint: 0x92bb9b });
  }
  // Tufts stay outside the dressed stone, with a few breaks so the edge never reads as a hedge.
  for (const [x, z] of [[-90,-.95],[-67,5.7],[-56,-1.65],[-37,-2.3],[-25.6,5.05],
    [-6.6,5.0],[4.9,-.35],[16.1,5.85],[44.1,-1.75],[60.5,5.5],[70.4,-2.1],[80.5,5.3]]) {
    if (nearest(x, z).over > .47) prop('ferns', x, z, .44, { fadeNear: true, sway: .013, tint: 0x8c9c77 });
  }
  await Promise.all(paintedProps.map(([name, x, z, h, options]) =>
    D.prop(name.endsWith('.png') ? art(name) : sprite(name), x, z, h, { shadow: false, blob: false, ...options })));

  D.petals(20, -84, -3, 8, { color: 0xf7bdcd });
  D.petals(22, -16, -5, 5, { color: 0xf5bbbf });
  D.petals(30, 4, -4, 11, { color: 0xffabcf });
  D.petals(27, 27, -15, 8, { color: 0xf8a7ce });
  D.fireflies(22, -54, -2, 19, 4, { color: 0x9be5e1, size: 11 });
  D.fireflies(25, 52, -3, 14, 5, { color: 0xabebbf, size: 12 });
  D.fireflies(20, 74, -3, 9, 4, { color: 0xffc698, size: 11 });
}
