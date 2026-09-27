(function(root){
  'use strict';
  const LEVELS={easy:5,medium:8,hard:12};
  function questionPool(level){
    const limit=LEVELS[level];if(!limit)throw Error('Unknown difficulty');const pool=[];
    for(let a=1;a<=limit;a++)for(let b=1;b<=limit;b++)for(const sa of [-1,1])for(const sb of [-1,1]){
      const hard=[6,7,8,9,11,12].includes(a)&&[6,7,8,9,11,12].includes(b);
      pool.push({a:a*sa,b:b*sb,op:'×',answer:a*b*sa*sb,facts:[a,b],hard});
      if(level!=='easy')pool.push({a:a*b*sa,b:b*sb,op:'÷',answer:a*sa*sb,facts:[a,b],hard});
    }
    return pool;
  }
  const key=q=>`${q.a}|${q.op}|${q.b}`;
  class Session{
    constructor(level='easy',random=Math.random){this.random=random;this.restart(level);}
    restart(level=this.level){this.level=level;this.pool=questionPool(level);this.recent=[];this.correct=0;this.bonusScore=0;this.lastMilestone=0;this.state='math';this.nextQuestion();}
    nextQuestion(){
      let candidates=this.pool.filter(q=>!this.recent.includes(key(q)));
      if(this.level==='hard'&&this.random()<.75){const harder=candidates.filter(q=>q.hard);if(harder.length)candidates=harder;}
      this.question=candidates[Math.floor(this.random()*candidates.length)];this.recent.push(key(this.question));if(this.recent.length>16)this.recent.shift();
    }
    submit(raw){
      if(this.state!=='math')return 'ignored';
      const text=String(raw).trim().replace(/−/g,'-');if(!/^[+-]?\d+$/.test(text)||!Number.isSafeInteger(Number(text)))return 'invalid';
      if(Number(text)!==this.question.answer)return 'wrong';
      this.correct++;
      if(this.correct%5===0&&this.correct>this.lastMilestone){this.lastMilestone=this.correct;this.state='countdown';return 'bonus';}
      this.nextQuestion();return 'correct';
    }
    beginBonus(){if(this.state!=='countdown')return false;this.state='bonus';return true;}
    award(points){if(this.state==='bonus')this.bonusScore+=points;}
    finishBonus(){if(this.state!=='bonus')return false;this.state='result';return true;}
    resumeMath(){if(this.state!=='result')return false;this.state='math';this.nextQuestion();return true;}
  }
  const BONUS_SECONDS=20, SYMBOLS=['+','−','×','÷','=','√','%','<','>'];
  const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
  class Invaders{
    constructor(width=800,height=400,random=Math.random){this.width=width;this.height=height;this.random=random;this.x=width/2;this.elapsed=0;this.score=0;this.enemies=[];this.shots=[];this.pops=[];this.spawnClock=.35;this.fireClock=0;this.id=0;this.ended=false;}
    resize(width,height){const sx=width/this.width,sy=height/this.height;this.x=clamp(this.x*sx,20,width-20);for(const e of this.enemies){e.x*=sx;e.y*=sy;}for(const s of this.shots){s.x*=sx;s.y*=sy;}this.width=width;this.height=height;}
    spawn(){
      const special=this.random()<.14,x=24+this.random()*(this.width-48);
      if(this.enemies.some(e=>e.y<65&&Math.abs(e.x-x)<45))return;
      this.enemies.push({id:++this.id,x,y:22,symbol:special?'π':SYMBOLS[Math.floor(this.random()*SYMBOLS.length)],points:special?250:100,speed:38+this.random()*24+this.elapsed*1.3,phase:this.random()*6.28});
    }
    step(dt,input){
      this.x=clamp(this.x+((input.right?1:0)-(input.left?1:0))*310*dt,20,this.width-20);
      this.fireClock=Math.max(0,this.fireClock-dt);
      if(input.fire&&this.fireClock<=0){this.shots.push({x:this.x,y:this.height-39});this.fireClock=.16;}
      this.spawnClock+=dt;if(this.spawnClock>=Math.max(.26,.64-this.elapsed*.015)){this.spawnClock=0;this.spawn();}
      for(const e of this.enemies){e.y+=e.speed*dt;e.x=clamp(e.x+Math.sin(this.elapsed*2+e.phase)*14*dt,20,this.width-20);}
      let points=0;
      for(const shot of [...this.shots]){
        const oldY=shot.y;shot.y-=490*dt;
        const hits=this.enemies.filter(e=>Math.abs(e.x-shot.x)<=21&&e.y+20>=shot.y&&e.y-20<=oldY).sort((a,b)=>b.y-a.y);
        if(hits.length){const e=hits[0];points+=e.points;this.score+=e.points;this.enemies.splice(this.enemies.indexOf(e),1);this.shots.splice(this.shots.indexOf(shot),1);this.pops.push({x:e.x,y:e.y,points:e.points,age:0});}
      }
      this.enemies=this.enemies.filter(e=>e.y<this.height-28);this.shots=this.shots.filter(s=>s.y>-20);
      this.pops.forEach(p=>p.age+=dt);this.pops=this.pops.filter(p=>p.age<.45);return points;
    }
    tick(seconds,input={}){
      if(this.ended||seconds<=0)return 0;
      const dt=Math.min(seconds,BONUS_SECONDS-this.elapsed);this.elapsed=Math.min(BONUS_SECONDS,this.elapsed+dt);
      // No catches or extra shots after the 20-second deadline.
      if(this.elapsed>=BONUS_SECONDS){this.ended=true;this.cleanup();return 0;}
      let remaining=Math.min(dt,.25),points=0;
      while(remaining>1e-8){const step=Math.min(1/60,remaining);points+=this.step(step,input);remaining-=step;}
      return points;
    }
    cleanup(){this.enemies=[];this.shots=[];this.pops=[];}
  }
  const api={LEVELS,questionPool,Session,Invaders,BONUS_SECONDS,key};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NegativeBlaster=api;
})(typeof globalThis!=='undefined'?globalThis:this);
