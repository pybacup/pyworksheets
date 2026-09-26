(() => {
  'use strict';
  const {Game,multiplier,position,DURATION}=window.FractionFrenzy;
  const $=id=>document.getElementById(id),arena=$('arena'),app=document.querySelector('.app');
  let game,state='ready',frame,last=null,countTimer,step=0,sound=false,audio;
  const nodes=new Map(),effects=new Set(),colours=['#43d9ff','#bda0ff','#ffd166','#69d8cd'];
  function fraction(parent,f){
    parent.replaceChildren();const span=document.createElement('span');span.className='fraction';span.setAttribute('aria-hidden','true');
    for(const [name,n] of [['numerator',f.a],['denominator',f.b]]){const part=document.createElement('span');part.className=name;part.textContent=n;span.append(part);}
    parent.append(span);parent.setAttribute('aria-label',f.a+' over '+f.b);
  }
  function beep(good){
    if(!sound)return;
    try{audio ||= new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});
      const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=good?'triangle':'sine';oscillator.frequency.setValueAtTime(good?700:180,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(good?1100:90,audio.currentTime+.13);gain.gain.setValueAtTime(.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);oscillator.connect(gain).connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.17);
    }catch(_){/* Gameplay remains available without browser audio. */}
  }
  function modal(id,focus){for(const name of ['startScreen','pauseScreen','endScreen','countdown'])$(name).hidden=name!==id;app.inert=Boolean(id);if(focus)$(focus).focus();}
  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;const dialog=document.querySelector('.overlay:not([hidden])');if(!dialog)return;
    const controls=[...dialog.querySelectorAll('a,button,input:checked')];if(!controls.length){e.preventDefault();return;}
    if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus();}
  });
  function stats(){
    const seconds=Math.ceil(Math.max(0,DURATION-game.elapsed));$('time').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    $('timeBar').style.width=Math.max(0,1-game.elapsed/DURATION)*100+'%';$('score').textContent=game.score.toLocaleString('en-GB');$('lives').textContent='♥'.repeat(game.lives)+'♡'.repeat(3-game.lives);$('lives').setAttribute('aria-label',game.lives+' lives');$('combo').textContent='×'+multiplier(game.streak);$('correct').textContent=game.correct;
    $('targetCue').hidden=game.transition<=0;
  }
  function showTarget(){fraction($('targetFraction'),game.target);fraction($('cueFraction'),game.target);}
  function render(){
    const ids=new Set(game.tiles.map(t=>t.id));for(const [id,node]of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}
    for(const tile of game.tiles){let node=nodes.get(tile.id);
      if(!node){node=document.createElement('button');node.type='button';node.className='target';fraction(node,tile.fraction);node.style.setProperty('--tile-color',colours[tile.id%colours.length]);node.addEventListener('click',()=>catchTile(tile.id));arena.append(node);nodes.set(tile.id,node);}
      const p=position(tile,arena.clientWidth,arena.clientHeight);node.style.width=p.width+'px';node.style.height=p.height+'px';node.style.transform=`translate3d(${p.x}px,${p.y}px,0)`;
    }
  }
  function temporary(node){arena.append(node);effects.add(node);setTimeout(()=>{node.remove();effects.delete(node);},550);}
  function feedback(tile,text,good){
    const p=position(tile,arena.clientWidth,arena.clientHeight),effect=document.createElement('span');effect.className='burst'+(good?'':' bad');effect.textContent=text;effect.style.left=Math.max(0,p.x)+'px';effect.style.top=p.y+'px';temporary(effect);
    if(good){const disc=document.createElement('span');disc.className='pop-disc';disc.style.left=p.x+'px';disc.style.top=p.y+'px';disc.style.width=p.width+'px';temporary(disc);}
    else{arena.classList.remove('flash-red');void arena.offsetWidth;arena.classList.add('flash-red');}beep(good);
  }
  function advance(now){
    if(last===null)last=now;const result=game.tick(Math.max(0,(now-last)/1000));last=now;
    if(result.changed){effects.forEach(e=>e.remove());effects.clear();showTarget();$('feedback').textContent='New target: '+game.target.a+' over '+game.target.b+'. Old tiles cleared — no penalty.';}
    for(const tile of result.misses)feedback(tile,'Missed!',false);
    if(result.misses.length)$('feedback').textContent='An equivalent escaped. '+game.lives+' lives left.';
    render();stats();if(game.ended)finish();
  }
  function catchTile(id){
    if(state!=='playing')return;advance(performance.now());if(state!=='playing')return;
    const result=game.hit(id);if(!result)return;
    feedback(result.tile,result.correct?'+'+result.gain:'−1 life',result.correct);
    if(result.correct){$('feedback').textContent=['Great!','Nice!','Perfect!'][game.correct%3]+(game.streak>=2?' 🔥 ×'+multiplier(game.streak)+' COMBO':' Same value, good catch.');$('combo').classList.remove('combo-pop');void $('combo').offsetWidth;$('combo').classList.add('combo-pop');}
    else $('feedback').textContent='Not equivalent. Combo reset. '+game.lives+' lives left.';
    render();stats();if(game.ended)finish();
  }
  function loop(now){if(state!=='playing')return;advance(now);if(state==='playing')frame=requestAnimationFrame(loop);}
  function start(){
    clearTimeout(countTimer);cancelAnimationFrame(frame);nodes.forEach(n=>n.remove());nodes.clear();effects.forEach(e=>e.remove());effects.clear();
    const level=document.querySelector('input[name="level"]:checked').value;game=new Game(level,Math.random,arena.clientWidth,arena.clientHeight);
    $('levelLabel').textContent='PY Games / '+level[0].toUpperCase()+level.slice(1);showTarget();stats();$('hint').hidden=true;$('feedback').textContent='Catch fractions equal to the target. Let the others pass.';
    state='countdown';step=0;modal('countdown');countdownNext();
  }
  function countdownNext(){
    $('countdown').textContent=['3','2','1','GO!'][step];beep(true);
    countTimer=setTimeout(()=>{step++;if(step<4)countdownNext();else{state='playing';modal(null);last=performance.now();game.spawn();render();$('pause').disabled=false;$('pause').focus();frame=requestAnimationFrame(loop);}},step===3?500:800);
  }
  function pause(){if(state!=='playing')return;advance(performance.now());if(state!=='playing')return;state='paused';cancelAnimationFrame(frame);modal('pauseScreen','resume');}
  function finish(){
    if(state==='finished')return;state='finished';cancelAnimationFrame(frame);$('pause').disabled=true;
    $('endTitle').textContent=game.lives?'TIME!':'GAME OVER';$('finalScore').textContent=game.score.toLocaleString('en-GB');$('finalCorrect').textContent=game.correct;$('finalIncorrect').textContent=game.incorrect;$('accuracy').textContent=game.accuracy+'%';$('finalBest').textContent=game.best?'×'+game.best:'—';
    $('achievement').textContent=game.correct>=15&&game.accuracy>=90?'Fraction expert! Fast thinking and outstanding accuracy.':game.correct>=8?'Strong connections. Your fraction fluency is growing.':game.correct>0?'A good start. Simplify first, then build your speed.':'A fresh start awaits. Multiply or divide both parts by the same number.';
    $('summary').textContent=game.missed+' equivalent fraction'+(game.missed===1?'':'s')+' missed.';modal('endScreen','again');
  }
  $('start').addEventListener('click',start);$('again').addEventListener('click',()=>{state='ready';modal('startScreen','start');});$('pause').addEventListener('click',pause);
  $('resume').addEventListener('click',()=>{if(state!=='paused')return;state='playing';modal(null);last=performance.now();$('pause').focus();frame=requestAnimationFrame(loop);});
  $('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=sound?'🔊':'🔇';$('sound').setAttribute('aria-label',sound?'Mute sound':'Turn sound on');$('sound').setAttribute('aria-pressed',String(sound));if(sound)beep(true);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;if(state==='playing')pause();else if(state==='countdown'){clearTimeout(countTimer);state='ready';modal('startScreen','start');}});
  window.addEventListener('resize',()=>{if(game){game.resize(arena.clientWidth,arena.clientHeight);render();}});
  modal('startScreen','start');
})();
