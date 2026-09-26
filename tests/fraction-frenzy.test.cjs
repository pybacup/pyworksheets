const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const api=require('../assets/fraction-frenzy-core.js');
const {Game,equivalent,pools,targets,reduced,multiplier,pace,position,layout}=api;
function rng(seed=43){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function tile(g,f,progress=0){const t={id:++g.id,fraction:f,correct:equivalent(f,g.target),epoch:g.epoch,lane:0,offset:.5,progress};g.tiles.push(t);return t;}
for(const level of ['starter','tricky','expert'])test(`${level}: every generated pool has exact equivalents and no accidentally correct distractors`,()=>{
  for(const target of targets(level))for(const scale of (level==='expert'?[2,3,4,5]:[1])){
    const displayed={a:target.a*scale,b:target.b*scale},p=pools(displayed,level);
    assert.ok(p.good.length>=3&&p.bad.length>=8);
    for(const f of p.good){assert.equal(f.a*displayed.b,displayed.a*f.b);assert.deepEqual(reduced(f),reduced(displayed));assert.notDeepEqual(f,displayed);}
    for(const f of p.bad){assert.notEqual(f.a*displayed.b,displayed.a*f.b);assert.equal(equivalent(f,displayed),false);assert.ok(f.a>0&&f.b>0);}
  }
});
test('scoring increases with consecutive correct answers and caps at ×5',()=>{
  const g=new Game('starter',rng());let score=0;
  for(let i=1;i<=9;i++){const t=tile(g,g.good[0]);const hit=g.hit(t.id);score+=100*Math.min(i,5);assert.equal(g.score,score);assert.equal(hit.gain,100*Math.min(i,5));assert.equal(g.hit(t.id),null);}
  assert.equal(g.best,5);assert.equal(g.correct,9);assert.equal(g.accuracy,100);
  g.hit(tile(g,g.bad[0]).id);assert.equal(g.streak,0);assert.equal(g.incorrect,1);assert.equal(g.lives,2);assert.equal(g.accuracy,90);assert.equal(multiplier(0),1);
});
test('misses and wrong clicks lose lives; distractors leave safely; game ends at zero',()=>{
  const g=new Game('tricky',rng());g.hit(tile(g,g.good[0]).id);
  tile(g,g.bad[0],.999);g.tick(.1);assert.equal(g.lives,3);assert.equal(g.streak,1);
  tile(g,g.good[0],.999);g.tick(.1);assert.equal(g.missed,1);assert.equal(g.lives,2);assert.equal(g.streak,0);
  g.hit(tile(g,g.bad[0]).id);g.hit(tile(g,g.bad[1]).id);assert.equal(g.ended,true);assert.equal(g.lives,0);assert.equal(g.incorrect,2);
  const score=g.score;assert.equal(g.hit(tile(g,g.good[0]).id),null);assert.equal(g.score,score);
});
test('target changes clear old tiles fairly, give reading time, and reject stale clicks',()=>{
  const g=new Game('expert',rng());const old=g.target,t=tile(g,g.good[0],.999);g.elapsed=14.99;
  assert.equal(g.tick(.02).changed,true);assert.notDeepEqual(reduced(g.target),reduced(old));assert.equal(g.lives,3);assert.equal(g.missed,0);assert.equal(g.tiles.length,0);assert.equal(g.hit(t.id),null);assert.equal(g.spawn(),null);
  g.tick(1);assert.equal(g.tiles.length,0);g.tick(.51);assert.ok(g.spawn());
});
test('60-second finish stops penalties; target changes occur at 15, 30 and 45 seconds',()=>{
  const g=new Game('starter',rng());
  for(const second of [15,30,45]){g.elapsed=second-.01;assert.equal(g.tick(.02).changed,true);}
  g.transition=0;tile(g,g.good[0],.999);g.elapsed=59.99;g.tick(.02);assert.equal(g.elapsed,60);assert.equal(g.lives,3);assert.equal(g.ended,true);
});
test('spawns never duplicate visible fractions, and both correct and incorrect tiles appear',()=>{
  for(const level of ['starter','tricky','expert']){
    const g=new Game(level,rng());let seenGood=0,seenBad=0;
    for(let i=0;i<3000;i++){
      const t=g.spawn();if(t){if(t.correct)seenGood++;else seenBad++;}
      const keys=g.tiles.map(t=>t.fraction.a+'/'+t.fraction.b);assert.equal(new Set(keys).size,keys.length);
      g.tiles.forEach(t=>t.progress+=.08);g.tiles=g.tiles.filter(t=>t.progress<1);
    }
    assert.ok(seenGood>100&&seenBad>100);
  }
});
test('lanes remain readable and tappable at phone, iPad and desktop sizes, including rotation',()=>{
  const sizes=[[300,330],[375,330],[540,380],[768,420],[1024,450],[1440,450]];
  const g=new Game('expert',rng());
  for(const [width,height]of sizes){
    g.resize(width,height);g.tiles=[];
    for(let frame=0;frame<1000;frame++){
      g.spawn();const rects=g.tiles.map(t=>position(t,width,height));
      for(const [i,a]of rects.entries()){
        assert.ok(a.width>=64&&a.height>=82);assert.ok(a.x>=0&&a.x+a.width<=width);assert.ok(a.y>=0&&a.y+a.height<=height-24);
        for(const b of rects.slice(i+1))assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,'overlapping targets');
      }
      g.tiles.forEach(t=>t.progress+=.012);g.tiles=g.tiles.filter(t=>t.progress<1);
    }
  }
  g.resize(300,330);assert.equal(g.geometry.rows,layout(300,330).rows);
  for(const a of g.tiles)for(const b of g.tiles)if(a.id!==b.id&&a.lane===b.lane)assert.ok(Math.abs(a.progress-b.progress)>=g.geometry.gap-1e-9);
});
test('pace increases with successful play but remains bounded',()=>{
  assert.ok(pace(40,20).flight<pace(0,0).flight);assert.ok(pace(40,20).interval<pace(0,0).interval);
  assert.ok(pace(60,1000).flight>=5);assert.equal(multiplier(1000),5);
});
test('page and scripts parse, use native clicks, and all local links exist',()=>{
  for(const f of ['assets/fraction-frenzy-core.js','assets/fraction-frenzy.js'])new vm.Script(fs.readFileSync(path.join(__dirname,'..',f),'utf8'));
  for(const f of ['fraction-frenzy.html','games.html']){const text=fs.readFileSync(path.join(__dirname,'..',f),'utf8');for(const [,u]of text.matchAll(/(?:src|href)="([^"]+)"/g))if(!/^(https?:|#|data:)/.test(u))assert.ok(fs.existsSync(path.join(__dirname,'..',u)),u);}
  const ui=fs.readFileSync(path.join(__dirname,'../assets/fraction-frenzy.js'),'utf8');assert.match(ui,/addEventListener\('click'/);assert.doesNotMatch(ui,/addEventListener\('(touchstart|mousedown)'/);
});

const core=fs.readFileSync(path.join(__dirname,'../assets/fraction-frenzy-core.js'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../assets/fraction-frenzy.js'),'utf8');
function uiHarness(mode='starter') {
  let now=0,sequence=0;
  const timers=new Map(),frames=new Map(),elements=new Map(),docEvents={},windowEvents={};
  class Element {
    constructor(){this.hidden=false;this.children=[];this.events={};this.attributes={};this.textContent='';this.offsetWidth=68;this.offsetHeight=62;this.clientWidth=900;this.clientHeight=450;this.style={setProperty(){}};const classes=new Set();this.classList={add:n=>classes.add(n),remove:n=>classes.delete(n)};}
    append(child){this.children.push(child);child.parent=this;}
    replaceChildren(...children){this.children=children;}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
    setAttribute(k,v){this.attributes[k]=v;}
    addEventListener(k,fn){this.events[k]=fn;}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {left:0,top:0};}
    click(pointerType='mouse'){this.events.click?.({pointerType});}
    querySelectorAll(){return [];}
  }
  const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const document={hidden:false,activeElement:null,getElementById:get,createElement:()=>new Element(),addEventListener:(k,f)=>docEvents[k]=f,querySelector:selector=>selector==='.app'?get('app'):selector.includes('input[name="level"]')?{value:mode}:null};
  const c={document,window:{addEventListener:(k,f)=>windowEvents[k]=f},performance:{now:()=>now},setTimeout:(fn,delay)=>{timers.set(++sequence,{fn,due:now+delay});return sequence;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id)};
  const instrumented=ui.replace("  modal('startScreen','start');\n})();","  globalThis.uiState={game:()=>game,state:()=>state};\n  modal('startScreen','start');\n})();");
  vm.runInNewContext(core+'\nwindow.FractionFrenzy=FractionFrenzy;\n'+instrumented,c);
  return {get,c,docEvents,windowEvents,
    advance(ms){const end=now+ms;for(;;){const next=[...timers.entries()].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!next)break;now=next[1].due;timers.delete(next[0]);next[1].fn();}now=end;},
    frame(ms){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}
  };
}

for(const level of ['starter','tricky','expert'])test(`${level}: actual controller starts, scores native clicks once, pauses, changes target and replays`,()=>{
  const app=uiHarness(level);app.get('start').click();assert.equal(app.c.uiState.state(),'countdown');
  app.advance(3000);const g=app.c.uiState.game();assert.equal(g.level,level);assert.equal(app.c.uiState.state(),'playing');assert.equal(app.get('time').textContent,'1:00');
  g.tiles=[];tile(g,g.good[0]);app.frame(16);
  const node=app.get('arena').children.find(n=>n.className==='target');assert.ok(node);assert.equal(node.children[0].children.length,2);
  node.click('touch');node.click('mouse');assert.equal(g.score,100);assert.equal(g.correct,1);
  app.get('pause').click();const elapsed=g.elapsed;app.advance(20000);app.frame(16);assert.equal(g.elapsed,elapsed);
  app.get('resume').click();assert.equal(app.c.uiState.state(),'playing');
  g.elapsed=14.99;app.frame(20);assert.equal(app.get('targetCue').hidden,false);assert.equal(g.tiles.length,0);
  app.frame(1600);assert.equal(app.get('targetCue').hidden,true);
  g.elapsed=59.99;app.frame(20);assert.equal(app.get('endTitle').textContent,'TIME!');assert.equal(app.get('endScreen').hidden,false);
  assert.equal(app.get('finalCorrect').textContent,1);assert.equal(app.get('finalIncorrect').textContent,0);assert.equal(app.get('accuracy').textContent,'100%');
  app.get('again').click();app.get('start').click();app.advance(3000);assert.notEqual(app.c.uiState.game(),g);assert.equal(app.get('score').textContent,'0');
  app.get('arena').clientWidth=300;app.get('arena').clientHeight=330;app.windowEvents.resize();assert.equal(app.c.uiState.game().geometry.rows,3);
  app.c.document.hidden=true;app.docEvents.visibilitychange();assert.equal(app.c.uiState.state(),'paused');
});
