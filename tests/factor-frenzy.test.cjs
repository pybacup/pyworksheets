const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../games/factor-frenzy.html'),'utf8');
const core = html.match(/<script id="factor-core">([\s\S]*?)<\/script>/)[1];
const ui = html.match(/<script id="factor-ui">([\s\S]*?)<\/script>/)[1];
const context = {};
vm.runInNewContext(core+'\nglobalThis.api = FactorFrenzy;',context);
const { Game, qualifies, isPrime, multiplier, pace } = context.api;
function rng(seed=19){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function tile(game,n,progress=0){const t={id:++game.id,n,correct:qualifies(game.mode,game.target,n),lane:0,offset:.5,progress};game.tiles.push(t);return t;}

test('every factor and multiple classification is exact across all supported targets',()=>{
  for(let target=12;target<=100;target++)for(let n=1;n<=144;n++){
    assert.equal(qualifies('factors',target,n),Number.isInteger(target/n));
    assert.equal(qualifies('multiples',target,n),Number.isInteger(n/target));
  }
  for(const n of [0,-1,2.5,NaN,Infinity])assert.equal(qualifies('factors',36,n),false);
  assert.equal(qualifies('factors',36,1),true);assert.equal(qualifies('factors',36,36),true);
});
test('primality agrees with exhaustive divisor counting, including squares and boundaries',()=>{
  for(let n=-2;n<=1000;n++){
    let divisors=0;for(let d=1;d<=n;d++)if(n%d===0)divisors++;
    assert.equal(isPrime(n),divisors===2,`prime ${n}`);
  }
  for(const n of [2.5,NaN,Infinity])assert.equal(isPrime(n),false);
});
test('generated targets always have valid good/bad pools and balanced spawn batches',()=>{
  for(const mode of ['factors','multiples','primes'])for(let seed=1;seed<=150;seed++){
    const g=new Game(mode,rng(seed),4);
    assert.ok(g.good.length&&g.bad.length);
    if(mode==='factors')assert.ok(g.target>=12&&g.target<=100);
    if(mode==='multiples')assert.ok([4,6,7,8,9,11,12].includes(g.target));
    for(const n of g.good)assert.equal(qualifies(mode,g.target,n),true);
    for(const n of g.bad)assert.equal(qualifies(mode,g.target,n),false);
    let good=0;
    for(let i=0;i<40;i++){
      g.tiles=[];const t=g.spawn();assert.ok(t);assert.equal(t.correct,qualifies(mode,g.target,t.n));
      assert.ok(t.lane>=0&&t.lane<4&&t.offset>=0&&t.offset<1);
      if(mode==='primes')assert.ok(t.n>=2&&t.n<=100);
      good+=Number(t.correct);
      if(i%4===3){assert.equal(good,2);good=0;}
    }
  }
});
test('streak thresholds score immediately and duplicate clicks are ignored',()=>{
  const g=new Game('primes',rng());let expected=0;
  for(let streak=1;streak<=12;streak++){
    const t=tile(g,7),result=g.hit(t.id),m=streak>=10?4:streak>=6?3:streak>=3?2:1;
    expected+=100*m;assert.equal(result.gain,100*m);assert.equal(g.score,expected);
    assert.equal(multiplier(streak),m);assert.equal(g.hit(t.id),null);
  }
  assert.equal(g.correct,12);assert.equal(g.clicks,12);assert.equal(g.best,12);assert.equal(g.accuracy,100);
  g.hit(tile(g,9).id);assert.equal(g.streak,0);assert.equal(g.best,12);assert.equal(g.lives,2);assert.equal(g.accuracy,92);
});
test('wrong clicks and missed correct numbers lose lives; passing distractors are safe',()=>{
  const g=new Game('primes',rng());assert.equal(g.lives,3);assert.equal(g.accuracy,0);
  g.hit(tile(g,7).id);tile(g,9,.999);g.tick(.1);assert.equal(g.lives,3);assert.equal(g.streak,1);
  tile(g,11,.999);const misses=g.tick(.1);assert.equal(misses.length,1);assert.equal(g.lives,2);assert.equal(g.streak,0);assert.equal(g.missed,1);
  g.hit(tile(g,4).id);g.hit(tile(g,6).id);assert.equal(g.lives,0);assert.equal(g.ended,true);
  const score=g.score;assert.equal(g.hit(tile(g,7).id),null);g.tick(10);assert.equal(g.score,score);assert.equal(g.lives,0);
});
test('simultaneous misses never produce negative lives',()=>{
  const g=new Game('primes');for(let i=0;i<6;i++)tile(g,7,.999);g.tick(.1);
  assert.equal(g.lives,0);assert.equal(g.missed,3);assert.equal(g.ended,true);
});
test('round ends at 120 seconds without penalising remaining targets',()=>{
  const g=new Game('primes');g.elapsed=119;tile(g,7,.95);g.tick(5);
  assert.equal(g.elapsed,120);assert.equal(g.ended,true);assert.equal(g.lives,3);assert.equal(g.missed,0);
  const fresh=new Game('primes');assert.equal(fresh.elapsed,0);assert.equal(fresh.lives,3);assert.equal(fresh.score,0);
});
test('speed, spawn frequency and capacity increase; lanes prevent overlapping spawns',()=>{
  const start=pace(0),mid=pace(60),end=pace(120);
  assert.ok(start.flight>mid.flight&&mid.flight>end.flight);
  assert.ok(start.interval>mid.interval&&mid.interval>end.interval);
  assert.ok(start.cap<mid.cap&&mid.cap<end.cap);
  const g=new Game('primes',rng(),3);for(let i=0;i<3;i++)assert.ok(g.spawn());
  assert.equal(new Set(g.tiles.map(t=>t.lane)).size,3);assert.equal(g.spawn(),null);
  g.tiles.forEach(t=>t.progress=.3);assert.ok(g.spawn());assert.equal(g.spawn(),null);
});
test('game is self-contained with valid scripts and native touch/mouse/keyboard click handling',()=>{
  new vm.Script(core);new vm.Script(ui);
  assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+rel="stylesheet"/);
  assert.match(html,/href="\.\.\/games.html"/);
  assert.match(ui,/node\.addEventListener\('click'/);
  assert.doesNotMatch(ui,/addEventListener\('(touchstart|mousedown|pointerdown)'/);
  assert.match(html,/touch-action:manipulation/);
});

// Run the actual UI controller against a small DOM and controllable animation clock.
function uiHarness(mode='factors') {
  let now=0,sequence=0;
  const timers=new Map(),frames=new Map(),elements=new Map(),docEvents={},windowEvents={};
  class Element {
    constructor(){this.hidden=false;this.children=[];this.events={};this.attributes={};this.textContent='';this.offsetWidth=68;this.offsetHeight=62;this.clientWidth=900;this.clientHeight=450;this.style={setProperty(){}};const classes=new Set();this.classList={add:n=>classes.add(n),remove:n=>classes.delete(n)};}
    append(child){this.children.push(child);child.parent=this;}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
    setAttribute(k,v){this.attributes[k]=v;}
    addEventListener(k,fn){this.events[k]=fn;}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {left:0,top:0};}
    click(pointerType='mouse'){this.events.click?.({pointerType});}
    querySelectorAll(){return [];}
  }
  const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const document={hidden:false,activeElement:null,getElementById:get,createElement:()=>new Element(),addEventListener:(k,f)=>docEvents[k]=f,querySelector:selector=>selector==='.app'?get('app'):selector.includes('input[name="mode"]')?{value:mode}:null};
  const c={document,window:{addEventListener:(k,f)=>windowEvents[k]=f},performance:{now:()=>now},setTimeout:(fn,delay)=>{timers.set(++sequence,{fn,due:now+delay});return sequence;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id)};
  const instrumented=ui.replace("  modal('startScreen','start');\n})();","  globalThis.uiState={game:()=>game,state:()=>state};\n  modal('startScreen','start');\n})();");
  vm.runInNewContext(core+'\n'+instrumented,c);
  return {get,c,docEvents,windowEvents,
    advance(ms){const end=now+ms;for(;;){const next=[...timers.entries()].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!next)break;now=next[1].due;timers.delete(next[0]);next[1].fn();}now=end;},
    frame(ms){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}
  };
}

test('UI countdown starts each mode, native clicks score once, and pause preserves time',()=>{
  for(const mode of ['factors','multiples','primes']){
    const app=uiHarness(mode);app.get('start').click();assert.equal(app.c.uiState.state(),'countdown');
    app.advance(3000);assert.equal(app.c.uiState.state(),'playing');
    const g=app.c.uiState.game();assert.equal(g.mode,mode);assert.equal(app.get('time').textContent,'2:00');
    // Replace random tiles with one known good tile, then let the real UI render it.
    g.tiles=[];tile(g,g.good[0]);app.frame(16);
    const node=app.get('arena').children.find(n=>n.className==='target');assert.ok(node);
    node.click('touch');node.click('mouse');assert.equal(g.correct,1);assert.equal(g.score,100);
    app.get('pause').click();assert.equal(app.c.uiState.state(),'paused');const elapsed=g.elapsed;
    app.advance(20000);app.frame(16);assert.equal(g.elapsed,elapsed);
    app.get('resume').click();app.frame(1000);assert.ok(g.elapsed>elapsed);
    app.c.document.hidden=true;app.docEvents.visibilitychange();assert.equal(app.c.uiState.state(),'paused');
  }
});

test('UI expiry, results, replay and rotation work without leaving stale targets',()=>{
  const app=uiHarness('primes');app.get('start').click();app.advance(3000);
  const g=app.c.uiState.game();g.elapsed=119.9;app.frame(200);
  assert.equal(app.c.uiState.state(),'finished');assert.equal(app.get('endScreen').hidden,false);assert.equal(app.get('accuracy').textContent,'0%');
  app.get('again').click();assert.equal(app.get('startScreen').hidden,false);
  app.get('start').click();app.advance(3000);const fresh=app.c.uiState.game();assert.notEqual(fresh,g);assert.equal(fresh.score,0);assert.equal(fresh.lives,3);
  app.get('arena').clientWidth=300;app.windowEvents.resize();assert.equal(fresh.lanes,3);assert.ok(fresh.tiles.every(t=>t.lane<3));
});
