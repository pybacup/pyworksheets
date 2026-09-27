const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {Session,Invaders,questionPool,answerChoices,key}=require('../assets/negative-blaster-core.js');
const rng=(seed=42)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
test('all generated facts have exact integer answers, valid ranges and all sign combinations',()=>{
  for(const [level,limit] of [['easy',5],['medium',8],['hard',12]]){
    const pool=questionPool(level),signs=new Set();assert.equal(new Set(pool.map(key)).size,pool.length);
    for(const q of pool){assert.equal(q.answer,q.op==='×'?q.a*q.b:q.a/q.b);assert.ok(Number.isInteger(q.answer));assert.ok(q.facts.every(n=>n>=1&&n<=limit));assert.notEqual(q.b,0);signs.add(`${q.op}:${Math.sign(q.a)},${Math.sign(q.b)}`);}
    assert.equal(signs.size,level==='easy'?4:8);if(level==='easy')assert.ok(pool.every(q=>q.op==='×'));
  }
});
test('questions avoid the last sixteen repeats and hard mode favours challenging facts',()=>{
  for(const level of ['easy','medium','hard']){const s=new Session(level,rng()),recent=[];let hard=0;
    for(let i=0;i<2000;i++){assert.ok(!recent.includes(key(s.question)));recent.push(key(s.question));if(recent.length>16)recent.shift();hard+=s.question.hard;s.nextQuestion();}
    if(level==='hard')assert.ok(hard>1400);
  }
});
test('wrong or invalid answers retain the question; milestones fire once and scores accumulate',()=>{
  const s=new Session('medium',rng());const first=s.question;
  for(const raw of ['', '1.5','1e2','Infinity','--2'])assert.equal(s.submit(raw),'invalid');
  assert.equal(s.submit(first.answer+1),'wrong');assert.equal(s.question,first);assert.equal(s.correct,0);
  for(let n=1;n<=25;n++){
    assert.equal(s.submit(String(s.question.answer).replace('-','−')),n%5===0?'bonus':'correct');
    if(n%5===0){assert.equal(s.submit(s.question.answer),'ignored');assert.equal(s.beginBonus(),true);assert.equal(s.beginBonus(),false);s.award(350);assert.equal(s.submit(s.question.answer),'ignored');assert.equal(s.finishBonus(),true);assert.equal(s.finishBonus(),false);s.award(999);assert.equal(s.resumeMath(),true);assert.equal(s.resumeMath(),false);assert.equal(s.bonusScore,n/5*350);}
  }
  s.restart('easy');assert.equal(s.correct,0);assert.equal(s.bonusScore,0);assert.equal(s.state,'math');
});
test('shots remove symbols once, gold symbols score 250, misses never reduce score',()=>{
  const g=new Invaders(600,400,rng());
  for(const points of [100,250]){g.enemies=[{x:g.x,y:340,points,speed:0,phase:0}];g.shots=[{x:g.x,y:365}];assert.equal(g.tick(.04),points);assert.equal(g.enemies.length,0);assert.equal(g.tick(.01),0);}
  assert.equal(g.score,350);g.enemies=[{x:40,y:399,points:100,speed:60,phase:0}];g.tick(.02);assert.equal(g.enemies.length,0);assert.equal(g.score,350);
});
test('held controls move and fire continuously; timer ends at twenty seconds and cleans entities',()=>{
  const g=new Invaders(600,400,rng());for(let i=0;i<40;i++)g.tick(.025,{right:true,fire:true});assert.equal(g.x,580);assert.ok(g.shots.length>1);
  for(let i=0;i<80;i++)g.tick(.025,{left:true});assert.equal(g.x,20);
  g.resize(320,260);assert.ok(g.x>=20&&g.x<=300);g.tick(100,{fire:true});assert.equal(g.elapsed,20);assert.equal(g.ended,true);assert.deepEqual([g.enemies.length,g.shots.length,g.pops.length],[0,0,0]);const score=g.score;g.tick(5,{fire:true});assert.equal(g.score,score);
});

function harness(){
  let now=0,id=0;const timers=new Map(),frames=new Map(),els=new Map(),docEvents={},winEvents={};
  class Element{
    constructor(){this.hidden=false;this.value='';this.children=[];this.style={};this.events={};this.dataset={};this.classList={add(){},remove(){},toggle(){}};}
    addEventListener(n,fn){(this.events[n]||=[]).push(fn);}
    fire(n,props={}){const e={target:this,preventDefault(){this.prevented=true;},...props};for(const f of this.events[n]||[])f(e);return e;}
    replaceChildren(){this.children=[];}append(child){this.children.push(child);}
    focus(){document.activeElement=this;}select(){this.selectionStart=0;this.selectionEnd=this.value.length;}
    setAttribute(){}setPointerCapture(){}closest(){return null;}querySelectorAll(){return [];}
    getBoundingClientRect(){return {width:700,height:350};}
    getContext(){return new Proxy({},{get:()=>()=>{},set:()=>true});}
  }
  const el=n=>{if(!els.has(n))els.set(n,new Element());return els.get(n);};
  el('pips').children=Array.from({length:5},()=>new Element());el('level').value='medium';
  const document={createElement:()=>new Element(),body:{style:{}},getElementById:el,querySelector:s=>el(s.startsWith('input')?'level':s),addEventListener:(n,f)=>(docEvents[n]||=[]).push(f)};
  const window={NegativeBlaster:{Session,Invaders,BONUS_SECONDS:20},addEventListener:(n,f)=>(winEvents[n]||=[]).push(f)};
  const context={window,document,performance:{now:()=>now},setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)};
  let source=fs.readFileSync(path.join(__dirname,'../assets/negative-blaster.js'),'utf8');source=source.replace(/\}\)\(\);\s*$/, 'window.inspect=()=>({session,engine,paused,input:inputState()});})();');vm.runInNewContext(source,context);
  const advance=ms=>{const until=now+ms;while(true){const next=[...timers.entries()].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=until;};
  const frame=ms=>{now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));};
  const submit=()=>{const answer=window.inspect().session.question.answer;el('choices').children.find(b=>Number(b.textContent.replace('−','-'))===answer).fire('click');};
  const event=(n,props={})=>{const e={preventDefault(){this.prevented=true;},...props};(docEvents[n]||[]).forEach(f=>f(e));return e;};
  return {el,advance,frame,submit,event,inspect:window.inspect,timers,frames,docEvents,winEvents};
}
test('UI repeats bonuses, retains totals, suppresses scrolling and cleans held touch controls',()=>{
  const h=harness();h.el('start').fire('click');
  for(let round=1;round<=3;round++){
    for(let i=0;i<5;i++)h.submit();assert.equal(h.inspect().session.state,'countdown');h.submit();assert.equal(h.inspect().session.correct,round*5);
    h.advance(3150);assert.equal(h.inspect().session.state,'bonus');assert.equal(h.frames.size,1);
    assert.equal(h.event('keydown',{code:'ArrowRight'}).prevented,true);h.frame(100);assert.ok(h.inspect().engine.x>350);h.event('keyup',{code:'ArrowRight'});
    h.el('left').fire('pointerdown',{pointerId:1});h.el('fire').fire('pointerdown',{pointerId:2});assert.equal(h.inspect().input.left,true);assert.equal(h.inspect().input.fire,true);
    h.frame(100);h.el('left').fire('pointercancel',{pointerId:1});h.el('fire').fire('pointerup',{pointerId:2});assert.equal(h.inspect().input.left,false);assert.equal(h.inspect().input.fire,false);
    const g=h.inspect().engine;g.enemies=[{x:g.x,y:290,points:250,speed:0,phase:0}];g.shots=[{x:g.x,y:315}];h.frame(40);assert.equal(h.inspect().session.bonusScore,round*250);
    h.frame(19760);assert.equal(h.inspect().session.state,'result');assert.equal(h.inspect().engine,null);assert.equal(h.frames.size,0);assert.equal(h.el('bonusTime').textContent,'0');
    h.advance(2300);assert.equal(h.inspect().session.state,'math');assert.equal(h.el('questionLabel').textContent,'QUESTION '+(round*5+1));assert.equal(h.el('progress').textContent,'0/5');assert.equal(h.timers.size,0);
  }
  assert.equal(h.el('fire').events.pointerdown.length,1);assert.equal(h.docEvents.keydown.length,1);
  h.el('restart').fire('click');assert.equal(h.inspect().session.correct,0);assert.equal(h.inspect().session.bonusScore,0);
});
test('restart cancels countdowns and active rounds; blur pauses without burning reward time',()=>{
  const h=harness();h.el('start').fire('click');for(let i=0;i<5;i++)h.submit();h.el('bonusRestart').fire('click');h.advance(5000);assert.equal(h.frames.size,0);assert.equal(h.inspect().session.correct,0);
  h.el('start').fire('click');for(let i=0;i<5;i++)h.submit();h.advance(3150);h.frame(1000);h.winEvents.blur[0]();const elapsed=h.inspect().engine.elapsed;assert.equal(h.inspect().paused,true);assert.equal(h.frames.size,0);h.advance(60000);h.el('resume').fire('click');h.frame(100);assert.ok(Math.abs(h.inspect().engine.elapsed-elapsed-.1)<1e-8);
  h.el('bonusRestart').fire('click');assert.equal(h.inspect().engine,null);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
});

test('every question has four distinct integer options and exactly one correct answer',()=>{
 for(const level of ['easy','medium','hard'])for(const q of questionPool(level))for(const random of [rng(),()=>0,()=>.999]){
  const options=answerChoices(q,random);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(n=>n===q.answer).length,1);assert.ok(options.every(Number.isInteger));assert.ok(options.includes(-q.answer));
 }
});
test('wrong choices preserve the question and options; stale clicks cannot score twice',()=>{
 const h=harness();h.el('start').fire('click');const q=h.inspect().session.question,buttons=[...h.el('choices').children];
 const value=b=>Number(b.textContent.replace('−','-'));
 buttons.find(b=>value(b)!==q.answer).fire('click');assert.equal(h.inspect().session.question,q);assert.deepEqual(h.el('choices').children,buttons);assert.equal(h.inspect().session.correct,0);
 const correct=buttons.find(b=>value(b)===q.answer);correct.fire('click');assert.equal(h.inspect().session.correct,1);correct.fire('click');assert.equal(h.inspect().session.correct,1);assert.notEqual(h.inspect().session.question,q);
});
