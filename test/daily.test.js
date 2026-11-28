const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../game/index.html'), 'utf8');
const lines = html.split('\n');
const rng = lines.filter(line => /^(function (mulberryStep|mulberryS|dailyReseed|gameRandom)\(|const pickRun=)/.test(line)).join('\n');

test('Daily gameplay rolls are independent of cosmetic rolls and never replace Math.random', () => {
  const context = vm.createContext({});
  vm.runInContext('let run={daily:{seed:42}}; const original=Math.random;\n' + rng, context);
  assert.equal(vm.runInContext("dailyReseed('fest0'); Math.random === original", context), true);
  const sample = cosmetic => vm.runInContext(`dailyReseed('bt0:jin:0'); Array.from({length:8},()=>{ for(let i=0;i<${cosmetic};i++) Math.random(); return gameRandom(); })`, context);
  assert.deepEqual(sample(3), sample(300));
  vm.runInContext("dailyReseed('fest0'); gameRandom(); const restored=JSON.stringify(run)", context);
  const next = vm.runInContext("gameRandom()", context);
  assert.equal(vm.runInContext("run=JSON.parse(restored); gameRandom()", context), next);
  assert.equal(vm.runInContext("run=null; dailyReseed('fest0'); Math.random===original", context), true);
});

test('starting the same Daily yields the same bracket with different cosmetic calls and a local legacy', async () => {
  const a = html.indexOf('async function startRun(D)');
  const b = html.indexOf('\nconst STR=', a);
  const bracketSource = html.slice(a, b);
  const setup = `
    let run, HERO; const HS=6, store={runs:0,legacy:[],b16:1};
    const FIGHTERS={kaede:{deck:['ember_jab']}}, HEROES={kaede:{hp:100}};
    const GENERIC_INNATES=['a','b','c'], TOURS={grand:{champ:'varro'}}, SPIRIT={max:24};
    const location={search:''}, STORY={intro:()=>[]};
    const talk=()=>new Promise(()=>{}), metaStart=()=>{}, mentorOptions=()=>[{card:'test'}];
    function shuffle(a,rng){ for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
  `;
  const context = vm.createContext({ URLSearchParams });
  vm.runInContext([setup, rng, bracketSource].join('\n'), context);
  const first = await vm.runInContext("startRun({seed:23,hero:'kaede'}).then(()=>JSON.stringify([run.br,run.inn]))", context);
  const second = await vm.runInContext(`
    store.legacy.push({hero:'kaede',deck:['legacy']});
    for(let i=0;i<1000;i++) Math.random();
    startRun({seed:23,hero:'kaede'}).then(()=>JSON.stringify([run.br,run.inn]))
  `, context);
  assert.equal(second, first);
});
