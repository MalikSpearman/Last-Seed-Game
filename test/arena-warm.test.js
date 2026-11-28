const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const source = fs.readFileSync(require.resolve('../game/r3d/battle_bg.js'), 'utf8');
const warm = source.slice(source.indexOf('async function warmArenaDraws('), source.indexOf('export function prewarm('));

for (const scenario of ['success', 'failure', 'skip']) {
  const failure = scenario === 'failure';
  const skipped = scenario === 'skip';
  test('arena warm-up restores renderer and scene state ' + 'in the ' + scenario + ' path', async () => {
    class Layers {
      mask = 1;
      test(other) { return !!(this.mask & other.mask); }
      enable(channel) { this.mask |= 1 << channel; }
      set(channel) { this.mask = 1 << channel; }
    }
    const vector = value => ({
      value, clone() { return vector(this.value); }, copy(other) { this.value = other.value; },
      add(other) { this.value += other.value; return this; },
    });
    const objects = Array.from({length: 10}, () => ({ material: {}, layers: new Layers() }));
    const light = { isLight: true, layers: new Layers() };
    const passes = [];
    const signal = new AbortController();
    const camera = {
      layers: new Layers(), position: vector(12), quaternion: vector(20),
      lookAt() { this.quaternion.value = 30; }, updateMatrixWorld() {},
    };
    const renderer = {
      target: 'initial', shadowMap: { needsUpdate: true, autoUpdate: true },
      getRenderTarget() { return this.target; }, setRenderTarget(target) { this.target = target; },
      render() {
        assert.equal(this.target, 'offscreen');
        assert.equal(this.shadowMap.needsUpdate, false);
        assert.equal(light.layers.test(camera.layers), true);
        passes.push(objects.filter(item => item.layers.test(camera.layers)).length);
        if (skipped) signal.abort();
        if (failure && passes.length === 2) throw Error('draw failed');
      },
    };
    const context = vm.createContext({
      signal: signal.signal, splitSetup: scenario==='success', D: {renderer, camera, scene: {traverseVisible: callback => [...objects, light].forEach(callback)}, rt: 'offscreen'},
      solveFit: () => ({C: vector(2), f: vector(1)}),
      performance, document: {hidden: false}, requestAnimationFrame: setImmediate, cancelAnimationFrame: clearImmediate,
      setTimeout, clearTimeout,
    });
    const run = vm.runInContext(warm+'\nwarmArenaDraws(signal, splitSetup)', context);
    if (failure) await assert.rejects(run, /draw failed/); else await run;
    assert.deepEqual(passes, skipped ? [8] : [8, 2]);
    assert.ok([...objects, light, camera].every(item => item.layers.mask === 1));
    assert.equal(camera.position.value, 12);
    assert.equal(camera.quaternion.value, 20);
    assert.equal(renderer.target, 'initial');
    assert.deepEqual(renderer.shadowMap, {needsUpdate: true, autoUpdate: true});
  });
}
