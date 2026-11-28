const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../game/index.html'), 'utf8');

function source(start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to >= 0, 'Missing game source around ' + start);
  return html.slice(from, to);
}

function element(className = '') {
  const selectors = new Map();
  return {
    className, style: {}, children: [],
    appendChild(child) { this.children.push(child); },
    find(selector) {
      if (!selectors.has(selector)) selectors.set(selector, element());
      return selectors.get(selector);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }),
  };
}

function game(seed, hero, storage = new Map()) {
  const noop = () => {};
  const effects = new Proxy({}, { get: () => noop });
  const store = JSON.parse(storage.get('lastseed_v1') || 'null') || {
    runs: 0, b16: 1, legacy: [], seals: 0, bonds: {}, rivals: {},
    dojo: { hp: 3, skin: 2, mend: 2, kindle: 2, focus: 1 },
  };
  const mentor = { id: 'ryo', name: 'Ryo', sprite: 'ryo', card: 'final_lesson' };
  const screens = [];
  const choices = [];
  const context = vm.createContext({
    window: {}, URLSearchParams, location: { search: '' }, seed, store, console,
    localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    SKEY: s => s, app: { classList: effects }, Snd: effects, Fx: effects, I: {},
    setTimeout: noop, clearTimeout: noop, sleep: noop, toast: noop, title: noop,
    talk: () => Promise.resolve(), STORY: new Proxy({}, { get: () => () => [] }),
    howModal: noop, mentorPre: () => [], mentorScene: noop, festival: noop, vsSplash: noop,
    offerRelic: noop, runSummary: () => '', MENTORS: { ryo: { champ: '' } },
    relicSets: () => [], RELICS: {}, CONDS: {},
    pickTour: () => 'grand', pickHero: () => hero, pickMentor: () => mentor,
    pickInnate: () => vm.runInContext('GENERIC_INNATES[0]', context), pickMastery: () => [],
    h: (_, cls) => element(cls), $: (selector, parent) => parent.find(selector),
    cardEl: id => Object.assign(element(), { id }),
    show(screen) {
      screens.push(screen);
      if (screen.className.includes('spoils')) screen.find('.invs').children[0].onclick();
      else if (screen.children[0]?.innerHTML?.includes('Learn a technique')) {
        const card = screen.children[0].find('.offer').children[0];
        choices.push(card.id);
        card.onclick();
      }
    },
  });
  const parts = [
    source('var __GR_KAEDE=', 'const VREN='),
    source('const HBAL_VS=', '// LAST SEED — fully synthesized audio'),
    source('const save=()=>', '\n'),
    source('const RSV=SKEY', 'function manualSave'),
    source('function resumeRun(o)', '// ── title ──'),
    source('const STAGE_TXT=', '\n'),
    source("let run=null, HERO='kaede'", '\nconst '),
    source('const getF=', '\n'),
    source('const mentorOf=', '\n'),
    source('const UNLOCK=', 'function dailyKey'),
    source('async function startRun(D)', '// ── bracket (16'),
    source('function rivalHpMul(', '// ── the Demon King'),
    source('async function fight(rs)', 'function theme('),
    source('function befriend(opp)', '// LAST SEED — the festival'),
    source('function fightMods(opp)', 'function chooseCard'),
    source('function reward(opp)', '// ══ META PROGRESSION'),
    source('const dj=id=>', '\n'),
    source('const BOND_XP=', 'const mskill='),
    source('function metaWin()', '\n'),
    source('const RIVAL_N=', 'const TOURS='),
    source('const TOURS=', 'function pickTour'),
    source('function metaStart(', '// select screens'),
  ];
  // Run the tournament setup and outcome code used by the battle UI while driving
  // legal model actions directly. Animation, roads, and optional relics are omitted.
  const setup = source("dailyReseed('bt'+stage", 'const TRAIN=');
  const finish = [
    source('if(run.stats){ const S=run.stats; S.fights++', "for(const sd of ['p','e'])"),
    source("if(b.over==='e') run.lastFoe=opp.name;", "if(b.over==='p'&&fmLv"),
    source('run.hp=Math.max(custom?1:0,b.p.hp);', 'if(custom&&custom.bg) bgEl'),
  ];
  vm.runInContext(parts.join('\n') + `
    let randomState = [seed], rounds = [], results = [];
    Math.random = () => mulberryStep(randomState);
    function bracket() { RS_where='bracket'; RS_ctx=null; autoSave(); rounds.push(run.stage); }
    function rivalMentor() { return null; }
    function battle(opp, stage) {
      const custom = null, RD = rivalRound(stage), mods = fightMods(opp);
      ${setup}
      b.begin(mods.list);
      for (let turn=0; turn<30&&!b.over; turn++) {
        for (const side of ['p','e']) {
          if (b.over) break;
          if (turn || side==='e') b.startTurn(side);
          if (side==='p') {
            if (turn===0) b.useMentor();
            if (b.artReady('p','awaken')) b.useArt('p','awaken');
            if (b.artReady('p','crit')) b.useArt('p','crit');
          } else {
            const art = b.enemyArt();
            if (art) b.useArt('e',art);
          }
          for (let play=0; play<12&&!b.over; play++) {
            const hand = b.S(side).hand;
            const pick = side==='p' ? hand.indexOf(b.bestSeq('p')[0]) :
              b.enemyNext();
            if (pick<0) break;
            if (!b.canPlay(side,pick)) throw new Error('Illegal combat card');
            const id = hand[pick];
            if (side==='e') {
              const counter = b.counterOptions(id).sort((a,b) => b.tier-a.tier)[0];
              if (counter?.tier>=3) b.counter(id,counter.id,'perfect');
            } else {
              const counter = b.aiCounter(id);
              if (counter) b.counter(id,counter.pid,counter.res,'e');
            }
            if (!b.over) b.play(side,pick);
            if (b.rush && !b.over) b._rushAuto();
          }
          if (!b.over) b.endTurn(side);
          if (side==='e' && !b.over) b.makePlan();
        }
      }
      if (!b.over) throw new Error('Fight did not resolve');
      ${finish.join('\n')}
      results.push({ opponent:opp.id, winner:b.over, hp:b.p.hp, turns:b.turn });
      return b.over==='p';
    }
  `, context);
  return { run: code => vm.runInContext(code, context), store, screens, choices, storage };
}

test('Grand Tournament records earned techniques and awards once across end resumes', async () => {
  const g = game(6, 'varro');
  await g.run('startRun()');
  await new Promise(setImmediate);
  assert.equal(g.run('new Set(run.br.slots).size'), 16);
  for (let round=0; round<4; round++) {
    assert.equal(g.run('run.stage'), round);
    assert.equal(g.run('rsGet(RSV).where'), 'bracket');
    for (const card of g.choices) {
      assert.ok(JSON.parse(g.run('JSON.stringify(run.deck)')).includes(card));
    }
    await g.run('fight(false)');
    assert.equal(g.run('results.at(-1).winner'), 'p', g.run('JSON.stringify(results)'));
  }
  assert.equal(g.run('JSON.stringify(rounds)'), '[0,1,2,3]');
  assert.equal(g.run('Object.keys(run.br.w).length'), 15);
  assert.equal(g.run('run.br.w.r3m0'), g.run('HERO'));
  assert.equal(g.run('run.stats.won'), 4);
  assert.equal(g.run('run.mon'), 114);
  assert.equal(g.choices.length, 3);
  assert.equal(g.store.history.length, 1);
  assert.deepEqual(Array.from(g.store.history[0].picks), g.choices);
  assert.equal(g.store.history[0].stage, 4);
  assert.equal(g.store.history[0].win, true);
  assert.equal(g.store.seals, 20);
  assert.equal(g.store.bonds.ryo, 7);
  const hero = g.run('HERO');
  assert.equal(g.store.fm[hero], 10);
  assert.equal(g.store.winsBy[hero], 1);

  assert.equal(g.run('rsGet(RSV).where'), 'end');
  assert.equal(g.run('rsGet(RSV).run.metaDone'), 1);

  // Older builds wrote the end checkpoint before putting the award summary on the run.
  const oldStorage = new Map(g.storage);
  const oldCheckpoint = JSON.parse(oldStorage.get('lastseed_run'));
  delete oldCheckpoint.run.metaDone;
  delete oldCheckpoint.run.metaHtml;
  oldStorage.set('lastseed_run', JSON.stringify(oldCheckpoint));

  const reloaded = game(6, 'varro', g.storage);
  for (const session of [game(6, 'varro', oldStorage), reloaded]) {
    session.run('resumeRun(rsGet(RSV)); resumeRun(rsGet(RSV));');
    assert.equal(session.store.history.length, 1);
    assert.equal(session.store.seals, 20);
    assert.equal(session.store.bonds.ryo, 7);
    assert.equal(session.store.fm[hero], 10);
    assert.equal(session.store.winsBy[hero], 1);
  }

  const end = reloaded.screens.at(-1).children[0];
  assert.match(end.innerHTML, /20 Tournament Seals/);
  const offer = end.find('.offer');
  const legacy = offer.children.find(card => card.id === g.choices[0]);
  assert.ok(legacy, 'An earned technique must be available to pass on');
  await legacy.onclick();
  const stored = JSON.parse(reloaded.storage.get('lastseed_v1'));
  assert.equal(stored.runs, 1);
  assert.equal(stored.legacy.length, 1);
  assert.equal(stored.legacy[0].card, g.choices[0]);
  assert.deepEqual(stored.legacy[0].deck, JSON.parse(g.run('JSON.stringify(run.deck)')));
  assert.equal(reloaded.run('rsGet(RSV)'), null);
});
