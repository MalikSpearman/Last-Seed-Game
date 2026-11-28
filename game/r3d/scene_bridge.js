// Moonlit Bamboo Bridge. The fight uses the original crossing and fighter marks.
import { T, tex } from './diorama.js';
import { P } from './scene_bamboo.js';
import { addBridgeSills, buildBambooApproaches, buildBridgeChannel } from './bamboo_surfaces.js';

const image = name => new URL('./img/' + name + '.webp', import.meta.url).href;

function deckTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  for (let i = 0; i < 8; i++) {
    const x = i * 32;
    g.fillStyle = ['#684040', '#714a43', '#654044', '#785044'][i % 4];
    g.fillRect(x, 0, 32, 128);
    g.fillStyle = '#342534';
    g.fillRect(x, 0, 2, 128);
    g.fillStyle = '#996f60';
    g.fillRect(x + 2, 0, 1, 128);
    g.strokeStyle = '#35213455';
    for (let k = 0; k < 6; k++) {
      const grain = x + 4 + (i * 7 + k * 5) % 27;
      g.beginPath();
      g.moveTo(grain, 0);
      g.bezierCurveTo(grain + 2, 35, grain - 2, 90, grain, 128);
      g.stroke();
    }
    g.fillStyle = '#2d2533';
    g.fillRect(x + 17, 11, 2, 3);
    g.fillRect(x + 17, 114, 2, 3);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = T.RepeatWrapping;
  return texture;
}

// Combat and the walking map use the same deck and lantern silhouettes.
export function buildRedBridge(D) {
  const x0 = -16, z0 = 2.6, scene = D.scene;
  const wood = deckTexture();
  scene.userData.bridgeDeckTexture = wood;
  const plank = new T.MeshStandardMaterial({ map: wood, roughness: .93 });
  const lacquer = new T.MeshStandardMaterial({ color: 0x993537, roughness: .83 });
  const iron = new T.MeshStandardMaterial({ color: 0x382936, roughness: .88 });
  const brass = new T.MeshStandardMaterial({ color: 0xbb8856, roughness: .7 });
  const paper = new T.MeshStandardMaterial({ color: 0xffce89, emissive: 0xd96c2d,
    emissiveIntensity: .75, roughness: 1 });
  function place(geometry, material, x, y, z, shadow = false) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  const box = (w, h, d, material, x, y, z, shadow) =>
    place(new T.BoxGeometry(w, h, d), material, x, y, z, shadow);

  // Match the shared bamboo bridge: 11-unit flat span at y=1, then bank ramps.
  const top = P.slice(3, 10).map(({ x, y }) => [x, y + (y ? 0 : .012)]);
  // One deck skin follows the collision spine exactly. UVs stay continuous
  // through both slope breaks and the vertical sides hide the deck thickness.
  const positions = [], uv = [], indices = [];
  for (let face = 0; face < 3; face++) {
    for (const [x, y] of top) {
      const edges = [[[y, z0 + 1.3], [y, z0 - 1.3]],
        [[y - .16, z0 + 1.3], [y, z0 + 1.3]],
        [[y, z0 - 1.3], [y - .16, z0 - 1.3]]][face];
      const i = positions.length / 3;
      for (const [edgeY, z] of edges) positions.push(x, edgeY, z);
      uv.push((x + 24) / 2.75, 0, (x + 24) / 2.75, 1);
      if ((i - face * top.length * 2) > 0) indices.push(i - 2, i, i - 1, i - 1, i, i + 1);
    }
  }
  const deck = new T.BufferGeometry();
  deck.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  deck.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  deck.setIndex(indices);
  deck.computeVertexNormals();
  place(deck, plank, 0, 0, 0);
  addBridgeSills(D);
  for (const side of [-1, 1]) {
    box(11, .25, .16, lacquer, x0, .84, z0 + side * 1.29);
    for (const offset of [-4.5, 4.5]) {
      box(.4, 1.4, .42, iron, x0 + offset, .12, z0 + side * 1.08, true);
    }
  }
  // The forward edge stays below the fighters. Only the back bank carries a tall rail.
  const farZ = z0 - 1.27;
  box(11, .09, .12, lacquer, x0, 1.78, farZ, true);
  box(11, .06, .09, lacquer, x0, 1.4, farZ);
  const post = new T.BoxGeometry(.14, .83, .14);
  const cap = new T.BoxGeometry(.21, .09, .21);
  for (const x of [-21.25, -19.8, -17.9, -16, -14.1, -12.2, -10.75]) {
    place(post, lacquer, x, 1.38, farZ, true);
    place(cap, brass, x, 1.81, farZ);
  }

  const lantern = new T.CylinderGeometry(.15, .19, .37, 8);
  const canopy = new T.CylinderGeometry(.11, .28, .12, 8);
  for (const x of [-19.25, -12.75]) {
    const z = farZ - .25;
    box(.14, 1.86, .14, lacquer, x, 1.84, z, true);
    box(.51, .11, .15, lacquer, x, 2.74, z + .17);
    place(lantern, paper, x, 2.38, z + .37);
    place(canopy, iron, x, 2.61, z + .37);
    place(cap, brass, x, 2.17, z + .37);
    for (const side of [-1, 1]) {
      box(.017, .33, .025, iron, x + side * .083, 2.38, z + .52);
    }
    D.lantern(x, 2.38, z + .43, { color: 0xff9a54, intensity: 5.5, distance: 5, glow: .26 });
  }

  return { place, box, lantern, canopy, iron, paper, lacquer };
}

export async function build(D) {
  const x0 = -16, z0 = 2.6;
  const scene = D.scene;
  scene.background = new T.Color(0x183142);
  scene.fog = new T.Fog(0x244552, 12, 47);
  D.moonlight({ color: 0xbddde8, intensity: 2.25, dir: [-.65, 1, -.35],
    ambient: 0x4b4b75, ambientI: 1.6, sky: 0x688eab, ground: 0x493343 });
  buildBridgeChannel(D, 100, 104, 0x405b56, 0x356a85);
  buildBambooApproaches(D);

  // A stationary far plate and swaying painted clumps separate as the camera turns.
  const painting = tex(new URL('./img/bridge_ravine.jpg', import.meta.url).href);
  const painted = new T.MeshBasicMaterial({ map: painting, fog: false, toneMapped: false });
  const bankPaint = painted.clone();
  bankPaint.vertexColors = true;
  const ravinePaint = painted.clone();
  ravinePaint.vertexColors = true;
  ravinePaint.transparent = true;
  ravinePaint.depthWrite = false;
  function plate(name, width, x, z, rotation, crop) {
    const height = 19, centerY = 2.8;
    const plane = new T.PlaneGeometry(width, height, crop ? 1 : 20, crop ? 20 : 1);
    if (crop) {
      const [left, right] = crop;
      const uv = plane.attributes.uv, positions = plane.attributes.position, colors = [];
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, left + (right - left) * uv.getX(i), .4 + .42 * uv.getY(i));
        // Sink the painted banks into the shaded ground at the foot of the ravine.
        const shade = .035 + .965 * T.MathUtils.smoothstep(positions.getY(i) + centerY, 0, 3.5);
        colors.push(shade, shade, shade);
      }
      plane.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    } else {
      const uv = plane.attributes.uv, colors = [];
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i), edge = Math.min(u, 1 - u);
        colors.push(1, 1, 1, T.MathUtils.smoothstep(edge, 0, .16));
      }
      plane.setAttribute('color', new T.Float32BufferAttribute(colors, 4));
    }
    const mesh = new T.Mesh(plane, crop ? bankPaint : ravinePaint);
    mesh.name = name;
    mesh.raycast = () => {}; // Painted scenery stays outside the Rushdown collision probes.
    mesh.position.set(x, centerY, z);
    mesh.rotation.y = rotation;
    scene.add(mesh);
  }
  plate('Painted ravine', 38, x0, -21, 0);
  // Use the forested edges of the same plate behind either counter camera.
  plate('Painted west bank', 40, x0 - 19, -1, Math.PI / 2, [.58, 1]);
  plate('Painted east bank', 40, x0 + 19, -1, -Math.PI / 2, [0, .42]);

  const { place, box, lantern, canopy, iron, paper, lacquer } = buildRedBridge(D);

  // Far paintings sit behind the entire crossing; overlap is masked by the near trees.
  for (const view of [
    { name: 'w_village', x: -36, z: -24, color: 0xa9b8cc },
    { name: 'w_bamboo', x: 14, z: -24, color: 0xa5bad1 },
  ]) {
    const map = tex(new URL('../img/bg_' + view.name + '.webp', import.meta.url).href);
    const material = new T.MeshBasicMaterial({ map, color: view.color, fog: false, toneMapped: false });
    const far = new T.Mesh(new T.PlaneGeometry(32, 21), material);
    far.position.set(view.x, 2, view.z);
    far.raycast = () => {};
    scene.add(far);
  }

  // Weathered stone marks the west approach; lacquer and amber mark the shrine grove.
  const pillar = new T.BoxGeometry(.54, 1.8, .5);
  const stoneCap = new T.BoxGeometry(.76, .18, .68);
  const stone = new T.MeshStandardMaterial({ color: 0x5a6576, roughness: .97 });
  for (const x of [-36.5, -31.8, -25.3]) {
    place(pillar, stone, x, .9, -.35, true);
    place(stoneCap, stone, x, 1.84, -.35);
    D.lantern(x, 1.9, -.08, { color: 0x87c9d5, distance: 5, intensity: 4, glow: .19 });
  }
  for (const x of [-8.8, -.8, 5.7]) {
    box(.19, 2.5, .21, lacquer, x, 1.25, -.7, true);
    box(.57, .1, .14, lacquer, x, 2.42, -.55);
    place(lantern, paper, x + .19, 2.17, -.47);
    place(canopy, iron, x + .19, 2.39, -.47);
    D.lantern(x + .19, 2.17, -.37, { color: 0xffa76c, distance: 6, intensity: 7, glow: .32 });
  }

  const foliage = [
    ['rg_maple', -21.7, -1.7, 5.6, 0x99717d],
    ['rg_maple', -10.1, -4.8, 5.8, 0xaa7a7d],
    ['bamboo3', -20.2, -8.1, 7.3, 0x6aa4a4],
    ['bamboo3', -11.7, -9.1, 7.4, 0x5c99a0],
    ['bamboo3', -24.5, -1.45, 7.3, 0x57837f],
    ['bamboo3', -7.5, -.95, 7, 0x57837f],
    ['rg_mossrock', -19.65, -.9, 1.65, 0x80aaa6],
    ['rg_mossrock', -12.25, -2.1, 1.8, 0x80aaa6],
    ['rg_willow', -35.8, -3.8, 6.9, 0x729ca5],
    ['rg_mossrock', -27.2, -.45, 1.15, 0x8aa5ae],
    ['rg_jizo', -31.5, -1.05, 1.2, 0x91a3a9],
    ['rg_maple', -7.5, -4.1, 6.8, 0xbd8793],
    ['torii', -3.6, -5.6, 4.8, 0xcdab99],
    ['sakura', 1.4, -3.3, 4.6, 0xcb92aa],
    ['bamboo3', 7.6, -3.3, 8.8, 0x8cb397],
    ['bamboo3', 19.8, -3.9, 9.2, 0x90b4a9],
    ['rg_bamclump', 13.6, -4.3, 6, 0x8aa69b],
    ['rg_signpost', 20.2, -.5, 2.5, 0xabb2aa],
  ];
  await Promise.all(foliage.map(([name, x, z, h, tint], i) =>
    D.prop(image(name), x, z, h, { tint, flip: i % 2, sway: /maple|bamboo|bamclump|willow|sakura/.test(name) ? .024 : 0, shadow: false, blob: false })));
  D.petals(22, -3.5, -2.6, 6, { color: 0xfba6b0 });
  D.fireflies(14, 13, -3, 6, 4, { y0: .3, y1: 2, color: 0xb8dec5, size: 10 });
  D.petals(16, x0 - 2, -3, 4);
  D.fireflies(15, x0, -5, 4, 7, { y0: .2, y1: 1.3, color: 0xffbf7a, size: 12 });
}
