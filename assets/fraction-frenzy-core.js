(function(root){
  'use strict';
  const DURATION=60, TARGET_PERIOD=15, TRANSITION=1.5;
  function gcd(a,b){while(b)[a,b]=[b,a%b];return a;}
  function reduced(f){const d=gcd(f.a,f.b);return {a:f.a/d,b:f.b/d};}
  function equivalent(a,b){const x=reduced(a),y=reduced(b);return x.a===y.a&&x.b===y.b;}
  const key=f=>f.a+'/'+f.b;
  const LEVELS={starter:{min:2,max:5,minA:1,scales:[2,3,4]},tricky:{min:5,max:12,minA:1,scales:[3,4,5,6,7,8]},expert:{min:9,max:20,minA:3,scales:[7,8,9,10,11,12,13,14,15,16]}};
  function shuffle(items,random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
  function targets(level){const config=LEVELS[level];if(!config)throw Error('Unknown difficulty');const result=[];for(let b=config.min;b<=config.max;b++)for(let a=config.minA;a<b;a++)if(gcd(a,b)===1)result.push({a,b});return result;}
  function pools(target,level){
    const base=reduced(target),good=[],bad=new Map();
    for(const scale of LEVELS[level].scales){
      const f={a:base.a*scale,b:base.b*scale};
      if(key(f)!==key(target))good.push(f);
      // Close distractors, checked mathematically rather than assumed to be wrong.
      for(const delta of [-2,-1,1,2])for(const n of [{a:f.a+delta,b:f.b},{a:f.a,b:f.b+delta}]){
        if(n.a>0&&n.b>0&&!equivalent(n,target))bad.set(key(n),n);
      }
    }
    return {good,bad:[...bad.values()]};
  }
  const multiplier=streak=>Math.max(1,Math.min(5,streak));
  function pace(elapsed,correct){const p=Math.min(1,elapsed/DURATION),skill=Math.min(1,correct/25);return {flight:9-2*p-1.5*skill,interval:1.35-.35*p-.25*skill,cap:4+Math.floor(3*p)};}
  function layout(width,height){const tileWidth=width<=540?64:76,tileHeight=82,rows=Math.max(2,Math.min(4,Math.floor((height-24)/100))),travel=Math.max(1,width-tileWidth-12);return {tileWidth,tileHeight,rows,travel,gap:(tileWidth+16)/travel};}
  function position(tile,width,height){const l=layout(width,height),rowHeight=(height-24)/l.rows;return {x:6+tile.progress*l.travel,y:tile.lane*rowHeight+8+tile.offset*Math.max(0,rowHeight-l.tileHeight-16),width:l.tileWidth,height:l.tileHeight};}
  class Game{
    constructor(level='starter',random=Math.random,width=900,height=420){
      this.level=level;this.random=random;this.targetDeck=shuffle(targets(level),random);this.deckIndex=0;
      this.elapsed=0;this.score=0;this.lives=3;this.streak=0;this.best=0;this.correct=0;this.incorrect=0;this.clicks=0;this.missed=0;this.ended=false;
      this.tiles=[];this.id=0;this.bag=[];this.spawnClock=0;this.transition=0;this.epoch=0;this.nextTarget=TARGET_PERIOD;
      this.resize(width,height);this.changeTarget(false);
    }
    pick(items){return items[Math.floor(this.random()*items.length)];}
    changeTarget(transition=true){
      const base=this.targetDeck[this.deckIndex++%this.targetDeck.length];
      const scale=this.level==='expert'?2+Math.floor(this.random()*4):1;
      this.target={a:base.a*scale,b:base.b*scale};Object.assign(this,pools(this.target,this.level));
      this.tiles=[];this.bag=[];this.spawnClock=0;this.transition=transition?TRANSITION:0;this.epoch++;
    }
    resize(width,height){
      this.width=width;this.height=height;this.geometry=layout(width,height);
      const previous=Array(this.geometry.rows).fill(Infinity);
      [...this.tiles].sort((a,b)=>b.progress-a.progress).forEach((tile,i)=>{tile.lane=i%this.geometry.rows;tile.progress=Math.min(tile.progress,previous[tile.lane]-this.geometry.gap);previous[tile.lane]=tile.progress;});
    }
    spawn(){
      if(this.ended||this.transition>0||this.tiles.length>=Math.min(pace(this.elapsed,this.correct).cap,this.geometry.rows*2))return null;
      const lanes=Array.from({length:this.geometry.rows},(_,i)=>i).filter(lane=>!this.tiles.some(t=>t.lane===lane&&t.progress<this.geometry.gap));
      if(!lanes.length)return null;
      if(!this.bag.length)this.bag=shuffle([true,true,false,false],this.random);
      const wanted=this.bag[this.bag.length-1];
      const candidates=(wanted?this.good:this.bad).filter(f=>!this.tiles.some(t=>key(t.fraction)===key(f)));
      if(!candidates.length)return null;
      this.bag.pop();const fraction=this.pick(candidates);
      const tile={id:++this.id,fraction,correct:equivalent(fraction,this.target),epoch:this.epoch,lane:this.pick(lanes),offset:this.random(),progress:0};
      this.tiles.push(tile);return tile;
    }
    loseLife(){this.lives=Math.max(0,this.lives-1);this.streak=0;if(!this.lives)this.ended=true;}
    hit(id){
      if(this.ended||this.transition>0)return null;
      const i=this.tiles.findIndex(t=>t.id===id&&t.epoch===this.epoch);if(i<0)return null;
      const [tile]=this.tiles.splice(i,1);this.clicks++;let gain=0;
      if(equivalent(tile.fraction,this.target)){this.correct++;this.streak++;this.best=Math.max(this.best,multiplier(this.streak));gain=100*multiplier(this.streak);this.score+=gain;}
      else{this.incorrect++;this.loseLife();}
      return {tile,correct:tile.correct,gain};
    }
    tick(seconds){
      const result={misses:[],changed:false};if(this.ended||seconds<=0)return result;
      const dt=Math.min(seconds,DURATION-this.elapsed);this.elapsed+=dt;
      if(this.elapsed>=DURATION){this.ended=true;return result;}
      if(this.elapsed>=this.nextTarget){
        this.nextTarget=(Math.floor(this.elapsed/TARGET_PERIOD)+1)*TARGET_PERIOD;
        this.changeTarget();result.changed=true;return result;
      }
      if(this.transition>0){this.transition=Math.max(0,this.transition-dt);return result;}
      const speed=pace(this.elapsed,this.correct);
      for(const tile of [...this.tiles]){
        tile.progress+=dt/speed.flight;
        if(tile.progress>=1){this.tiles.splice(this.tiles.indexOf(tile),1);if(equivalent(tile.fraction,this.target)){this.missed++;this.loseLife();result.misses.push(tile);}if(this.ended)break;}
      }
      if(!this.ended){this.spawnClock+=dt;if(this.spawnClock>=speed.interval){this.spawnClock=0;this.spawn();}}
      return result;
    }
    get accuracy(){return this.clicks?Math.round(this.correct/this.clicks*100):0;}
  }
  const api={DURATION,TARGET_PERIOD,TRANSITION,gcd,reduced,equivalent,key,targets,pools,multiplier,pace,layout,position,Game};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FractionFrenzy=api;
})(typeof globalThis!=='undefined'?globalThis:this);
