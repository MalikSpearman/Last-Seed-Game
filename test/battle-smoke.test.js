const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../game/index.html'), 'utf8');
const start = html.indexOf('var __GR_KAEDE=');
const end = html.indexOf('const VREN=', start);
const context = vm.createContext({ window: {}, URLSearchParams, location: { search: '' } });
vm.runInContext(html.slice(start, end), context, { filename: 'battle-model.js' });

test('seeded fights draw, play, alternate turns and resolve combat', () => {
  const outcomes = vm.runInContext(`Array.from({length: 12}, (_, i) => {
    const p={...FIGHTERS.kaede, hp:50}, e={...FIGHTERS.jin, hp:50};
    const b=new Battle(p,e,i+1);
    b.begin([]);
    let plays=0;
    for(let cycle=0;cycle<30&&!b.over;cycle++){
      for(const side of ['p','e']){
        if (cycle>0 || side==='e') b.startTurn(side);
        for(let n=0;n<12&&!b.over;n++){
          const pick=b.S(side).hand.findIndex((_,i)=>b.canPlay(side,i));
          if(pick<0) break;
          b.play(side,pick); plays++;
        }
        if(!b.over) b.endTurn(side);
      }
    }
    return {winner:b.over,turn:b.turn,plays,hp:[b.p.hp,b.e.hp]};
  })`, context);
  for (const outcome of outcomes) {
    assert.ok(outcome.winner === 'p' || outcome.winner === 'e', JSON.stringify(outcome));
    assert.ok(outcome.turn > 0 && outcome.plays > 0);
  }
});

test('a status-only attack presents the defeated group foe before the replacement', () => {
  const start = html.indexOf('  function evReorder(');
  const end = html.indexOf('  function netState(', start);
  vm.runInContext(html.slice(start, end), context, { filename: 'battle-presentation.js' });

  const outcome = vm.runInContext(`(() => {
    const b = new Battle({...FIGHTERS.orin, hp:50}, {...FIGHTERS.jin, hp:50}, 13);
    b.group([{...FIGHTERS.kaede, hp:44}]);
    b.begin([]);
    b.flush();
    b.e.hp = 2;
    b.e.guard = 0;
    b.e.burn = 2;
    b.p.energy = 20;
    b.p.hand = ['sup_orin'];
    if (!b.play('p', 0)) throw Error('Frost Seal did not play');
    const events = evReorder(b.flush());
    const handoff = events.findIndex(event => event.t === 'retarget');
    const ko = events.findIndex(event => event.t === 'eko');
    return JSON.stringify({
      reactionBeforeKO: events.findIndex(event => event.t === 'react') < ko,
      defeated: events[ko].s.e.hp,
      lastHP: events.at(-1).s.e.hp,
      replacement: events[handoff].s.e.hp,
      replacementMax: events[handoff].s.e.maxHp,
      active: b.e.hp
    });
  })()`, context);
  assert.deepEqual(JSON.parse(outcome), {
    reactionBeforeKO: true,
    defeated: 0,
    lastHP: 44,
    replacement: 44,
    replacementMax: 44,
    active: 44
  });
});

test('the Critical Art reveal releases only its own fades before combat resumes', async () => {
  const start = html.indexOf('  async function kTreeReveal(');
  const end = html.indexOf('  // ongoing rumble', start);
  vm.runInContext(html.slice(start, end), context, { filename: 'critical-reveal.js' });

  for (const interrupt of [false, true]) {
    const calls = [];
    let settle;
    const hidden = { cancel: () => calls.push('hide canceled') };
    const finished = new Promise((resolve, reject) => {
      settle = interrupt ? () => reject(new Error('animation canceled')) : resolve;
    });
    const sprite = {
      animate: (_, options) => {
        calls.push(['reveal started', options.duration, options.fill]);
        return { finished, cancel: () => calls.push('reveal released') };
      },
      getAnimations: () => assert.fail('unrelated combat animations must stay active')
    };
    const resumed = vm.runInContext('kTreeReveal', context)(sprite, hidden, 320)
      .then(() => calls.push('combat resumed'));
    assert.deepEqual(calls, [['reveal started', 320, undefined], 'hide canceled']);
    settle();
    await resumed;
    assert.deepEqual(calls.slice(2), ['reveal released', 'combat resumed']);
  }
});

test('Dynamic Blossom restores the sprite and cancels only its own motion', () => {
  const start = html.indexOf('  function blossomMotion(');
  const end = html.indexOf('  function kUltKick(', start);
  vm.runInContext(html.slice(start, end), context, { filename: 'blossom-motion.js' });
  const calls = [];
  const sprite = {
    style: { translate: '2px 0', transformOrigin: '50% 80%', transform: 'translateX(-50%)' },
    animate: (frames) => ({ cancel: () => calls.push(frames[0]) }),
    getAnimations: () => assert.fail('unrelated combat animations must stay active')
  };
  const motion = vm.runInContext('blossomMotion', context)(sprite);
  sprite.style.translate = '8px 0';
  sprite.style.transformOrigin = '50% 100%';
  motion.play(['crouch']);
  motion.play(['launch']);
  motion.clear();
  motion.play(['land']);
  motion.clear();
  motion.clear();
  assert.deepEqual(calls, ['crouch', 'launch', 'land']);
  assert.deepEqual(sprite.style, {
    translate: '2px 0', transformOrigin: '50% 80%', transform: 'translateX(-50%)'
  });
});

test('poise breaks give only the broken fighter Seeing Stars, once per break', () => {
  const outcome = vm.runInContext(`(() => {
    const battle = () => new Battle({...FIGHTERS.kaede,hp:100,ult:'kaede'}, {...FIGHTERS.jin,hp:100,ult:'jin'}, 29);
    const stars = f => f.hand.filter(id => id==='seeing_stars').length;
    const take = b => b.flush().filter(e => e.t==='poisebreak'||e.card==='seeing_stars').map(e=>[e.t,e.side]);
    const b = battle();
    b.e.poise=0;
    b.p.hand=['ember_jab','ember_jab','ember_jab'];
    b.p.energy=8;
    b.play('p',0);
    const normal=take(b);
    b.play('p',0);
    const first={counts:[stars(b.p),stars(b.e)],events:take(b)};
    b.play('p',0);
    const alreadyBroken=take(b);
    b.startTurn('e');
    b.startTurn('e');
    const recovered=b.e.pbrk===0;
    b.e.poise=0;
    b.p.spirit=SPIRIT.bar;
    b.useArt('p','super');
    const repeat={counts:[stars(b.p),stars(b.e)],events:take(b)};

    const full=battle();
    full.p.poise=1;
    full.p.hand=[...Array(7).fill('ember_jab'),'kindle','seeing_stars'];
    full.p.disc.kindle=[1];
    full.e.spirit=SPIRIT.bar;
    full.useArt('e','super');
    const overflow=full.flush().filter(e=>['poisebreak','draw','discard'].includes(e.t))
      .map(e=>[e.t,e.side,e.card,e.index??null]);
    const fullState={p:stars(full.p),e:stars(full.e),size:full.p.hand.length,deck:full.p.deck.at(-1),
      discount:full.p.disc.kindle.length,overflow};
    full.p.energy=3;
    const prepared=full.p.hand.indexOf('seeing_stars');
    full.play('p',prepared);
    const exhausted=full.p.exhaust.includes('seeing_stars');

    const ai=battle();
    ai.e.poise=1;
    ai.e.hand=['moonlit_slash'];
    ai.p.spirit=SPIRIT.bar;
    ai.useArt('p','super');
    ai.startTurn('e');
    ai.makePlan();
    const aiCanPlay=ai.canPlay('e',ai.e.hand.indexOf('seeing_stars'));
    ai.flush();
    ai.endTurn('e');
    const held=ai.flush().some(e=>e.t==='held'&&e.side==='e'&&e.card==='seeing_stars');
    return JSON.stringify({normal,first,alreadyBroken,recovered,repeat,fullState,exhausted,aiCanPlay,held,aiNext:ai.e.hand.length});
  })()`, context);
  assert.deepEqual(JSON.parse(outcome), {
    normal: [],
    first: { counts: [0, 1], events: [['poisebreak', 'e'], ['draw', 'e']] },
    alreadyBroken: [],
    recovered: true,
    repeat: { counts: [0, 2], events: [['poisebreak', 'e'], ['draw', 'e']] },
    fullState: {
      p: 2, e: 0, size: 9, deck: 'kindle', discount: 0,
      overflow: [['poisebreak', 'p', 'sup_jin', null], ['discard', 'p', 'kindle', 7], ['draw', 'p', 'seeing_stars', null]]
    },
    exhausted: true,
    aiCanPlay: true,
    held: true,
    aiNext: 4
  });
});
