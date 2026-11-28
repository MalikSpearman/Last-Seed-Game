const test = require('node:test');
const assert = require('node:assert/strict');

test('bridge advances on the Bamboo Road spine in both directions and stops at its ends', async () => {
  const { bridgeAdvance, bridgePoint, bridgeSection, bridgeEncounter, bridgeAnchor, bridgeTravel, bridgeDirection } =
    await import('../game/r3d/bridge_route.js');
  const expected = [-34, -27, -16, -4.5, 6, 17];
  assert.equal(bridgeAnchor(undefined), -16);
  assert.equal(bridgeAnchor(999), -16);
  assert.equal(bridgeEncounter(-60), null);
  assert.equal(bridgeEncounter(-2), -4.5);
  assert.equal(bridgeEncounter(14), 17);
  assert.equal(bridgeDirection(1, false), bridgeDirection(-1, true));
  assert.equal(bridgeDirection(-1, false), bridgeDirection(1, true));
  assert.equal(bridgeAdvance(-16, bridgeDirection(1, true)), -27);
  assert.equal(bridgeAdvance(-34, -1), -34);
  assert.equal(bridgeAdvance(17, 1), 17);

  const sections = new Set();
  for (let i = 0; i < expected.length - 1; i++) {
    const x = expected[i], next = expected[i + 1];
    assert.equal(bridgeAdvance(x, 1), next);
    assert.equal(bridgeAdvance(next, -1), x);
    const a = bridgePoint(x), b = bridgePoint(next);
    assert.ok(Number.isFinite(a.z) && Number.isFinite(b.z));
    assert.ok(b.x > a.x);
    sections.add(bridgeSection(x));
    let prev = a;
    for (let t = 1; t <= 100; t++) {
      const p = bridgePoint(x + (next - x) * t / 100);
      assert.ok(Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z) < .2);
      assert.ok(p.y >= 0 && p.y <= 1);
      prev = p;
    }
  }
  assert.equal(sections.size, 4);
  assert.deepEqual(bridgePoint(-16), { x: -16, y: 1, z: 2.6 });
  assert.deepEqual(bridgeTravel(-16, -4.5, -.02), bridgePoint(-16));
  assert.deepEqual(bridgeTravel(-16, -4.5, 1.02), bridgePoint(-4.5));
  assert.deepEqual(bridgeTravel(6, -4.5, .5), bridgePoint(.75));
  assert.deepEqual(bridgePoint(-34), bridgePoint(-100));
  assert.deepEqual(bridgePoint(17), bridgePoint(100));
});
