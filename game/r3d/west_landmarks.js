import { T } from './diorama.js';
import { pbr, rng } from './kit.js';

export function memorialCourt(D, K) {
  const rock = pbr('castle_wall_slates', [2, .5], { color: 0x657a80, rough: .91 });
  const cap = pbr('mossy_rock', [1, .6], { color: 0x8f9c87, rough: .94 });
  const brick = new T.BoxGeometry(1.04, .12, .66);
  const coping = new T.InstancedMesh(brick, cap, 13);
  const matrix = new T.Matrix4(), random = rng(74);
  const { box } = K;
  box(13.8, .37, .58, rock, 0, -.03, -5.75, { cast: false });
  for (let i = 0; i < coping.count; i++) {
    matrix.makeRotationY(random.r(-.045, .045)).setPosition((i - 6) * 1.06, .4, -5.75);
    coping.setMatrixAt(i, matrix);
  }
  coping.receiveShadow = true;
  brick.addEventListener('dispose', () => coping.dispose());
  K.S.add(coping);
  // Inset votive windows and stepped buttresses in the low memorial wall.
  const iron = new T.MeshStandardMaterial({ color: 0x222a37, roughness: .91 });
  const teal = new T.MeshBasicMaterial({ color: 0x88cbbc });
  for (const x of [-4.9, -.18, 4.55]) {
    box(.69, .29, .38, rock, x, .01, -5.27);
    box(.27, .22, .22, iron, x, .30, -5.31);
    box(.11, .12, .025, teal, x, .34, -5.18, { cast: false });
    box(.36, .09, .31, cap, x, .52, -5.31);
  }
  D.fireflies(15, .3, -8, 5.3, 3, { color: 0x9de1d3, y0: .35, y1: 1.17, size: 7 });
}

export function millRace(D, K, M, x, z) {
  const { box, add } = K;
  // A covered timber flume ends above the visible wheel. Low stone piers
  // and a return race are behind the deck and clear of the fighters.
  box(2.2, .28, 4.15, M.wood, x, 4.92, z - 3);
  for (const side of [-1, 1]) {
    box(.15, .51, 4.12, M.dark, x + side * 1.07, 4.97, z - 3);
    box(.32, 4.5, .39, M.post, x + side * 1.07, .07, z - 3.2);
    box(.78, .51, 1.72, M.stone, x + side * 1.7, -.33, z + .83);
  }
  const copper = new T.MeshStandardMaterial({ color: 0x92745d, roughness: .76, metalness: .25 });
  add(new T.TorusGeometry(.48, .047, 6, 18), copper, x, 2.61, z + .84);
  const spray = new T.MeshBasicMaterial({ color: 0xa0c8e2, transparent: true,
    depthWrite: false, opacity: .16, side: T.DoubleSide });
  const ripple = add(new T.RingGeometry(.72, .83, 20), spray, x, -.35, z + 1.25,
    { rx: -Math.PI / 2, cast: false });
  D.updaters.push(t => {
    const phase = (t * .46) % 1;
    ripple.scale.setScalar(.55 + phase * 1.35);
    spray.opacity = .22 * (1 - phase);
  });
}
