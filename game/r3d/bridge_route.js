// Combat follows the crossing and its approaches from the Bamboo free-roam path.
import { P } from './scene_bamboo.js';

export const BRIDGE_ENTRY = -16;
const LANDINGS = [-34, -27, BRIDGE_ENTRY, -4.5, 6, 17];

export function bridgePoint(x) {
  x = Math.max(LANDINGS[0], Math.min(LANDINGS.at(-1), x));
  const i = P.findIndex(point => point.x >= x);
  const a = P[i - 1], b = P[i];
  let t = (x - a.x) / (b.x - a.x);
  const z = a.z + (b.z - a.z) * t;
  if (a.y !== b.y) t = t * t * (3 - 2 * t); // Ease the climb on and off the deck.
  return { x, y: a.y + (b.y - a.y) * t, z };
}

export function bridgeAnchor(x) {
  return LANDINGS.includes(x) ? x : BRIDGE_ENTRY;
}

export function bridgeEncounter(x) {
  if (!Number.isFinite(x) || x < LANDINGS[0] || x > LANDINGS.at(-1)) return null;
  return LANDINGS.reduce((near, point) => Math.abs(point - x) < Math.abs(near - x) ? point : near);
}

export function bridgeAdvance(x, direction) {
  const i = LANDINGS.indexOf(bridgeAnchor(x));
  return LANDINGS[Math.max(0, Math.min(LANDINGS.length - 1, i + Math.sign(direction)))];
}

export function bridgeDirection(screenDirection, mirrored) {
  return Math.sign(screenDirection) * (mirrored ? -1 : 1);
}

export function bridgeTravel(from, to, progress) {
  const t = Math.max(0, Math.min(1, progress));
  return bridgePoint(from + (to - from) * t);
}

export function bridgeSection(x) {
  if (x < -24) return 'West approach';
  if (x <= -8) return 'Red Bridge';
  if (x < 3) return 'Lantern grove';
  return 'East bamboo road';
}
