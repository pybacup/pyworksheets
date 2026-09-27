(() => {
  'use strict';
  const {Session,Invaders,BONUS_SECONDS}=window.NegativeBlaster,$=id=>document.getElementById(id);
  const main=$('main'),header=document.querySelector('.site-header'),panel=document.querySelector('.math-panel'),canvas=$('space'),ctx=canvas.getContext('2d');
  const levels={easy:'Easy · multiplication up to 5 × 5',medium:'Medium · facts up to 8 × 8',hard:'Hard · facts up to 12 × 12'};
  let session=new Session(),engine=null,frame=null,timer=null,last=null,run=0,count=0,paused=false,sound=false,audio=null,tapFire=false;
  const keys=new Set(),pointers={left:new Set(),right:new Set(),fire:new Set()};
  const signed=n=>String(n).replace('-','−');
  function beep(hit){
    if(!sound)return;
    try{audio ||= new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});
      const o=audio.createOscillator(),g=audio.createGain();o.type=hit?'triangle':'sine';o.frequency.setValueAtTime(hit?780:160,audio.currentTime);g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.13);
    }catch(_){/* Audio is optional. */}
  }
  function resetControls(){keys.clear();Object.values(pointers).forEach(s=>s.clear());tapFire=false;}
  function cancelWork(){run++;clearTimeout(timer);timer=null;cancelAnimationFrame(frame);frame=null;last=null;paused=false;resetControls();if(engine)engine.cleanup();engine=null;}
  function later(fn,delay){const token=run;clearTimeout(timer);timer=setTimeout(()=>{timer=null;if(token===run)fn();},delay);}
  function modal(id){$('setup').hidden=id!=='setup';$('arcade').hidden=id!=='arcade';main.inert=Boolean(id);header.inert=Boolean(id);document.body.style.overflow=id?'hidden':'';}
  function totals(){
    $('correct').textContent=session.correct;$('score').textContent=session.bonusScore.toLocaleString('en-GB');
    const progress=session.state==='math'?session.correct%5:5;$('progress').textContent=progress+'/5';
    [...$('pips').children].forEach((p,i)=>p.classList.toggle('filled',i<progress));$('difficultyLabel').textContent=levels[session.level];
  }
  function showQuestion(){const q=session.question;$('question').textContent=`${signed(q.a)} ${q.op} ${q.b<0?'('+signed(q.b)+')':q.b} = ?`;$('questionLabel').textContent='QUESTION '+(session.correct+1);$('answer').value='';totals();}
  function flash(good){panel.classList.remove('correct-flash','wrong-flash');void panel.offsetWidth;panel.classList.add(good?'correct-flash':'wrong-flash');}
  function submit(event){
    event.preventDefault();if(session.state!=='math'||!$('setup').hidden)return;
    const result=session.submit($('answer').value);if(result==='ignored')return;
    if(result==='invalid'){$('feedback').className='feedback bad';$('feedback').textContent='Enter a whole integer, such as −12 or 24.';$('answer').focus();return;}
    if(result==='wrong'){flash(false);beep(false);$('feedback').className='feedback bad';$('feedback').textContent='Not quite. Check the signs and try this question again.';$('answer').focus();$('answer').select();return;}
    flash(true);beep(true);$('feedback').className='feedback good';$('feedback').textContent='Correct! Keep it going.';
    if(result==='bonus'){totals();startCountdown();}else{showQuestion();$('answer').focus();}
  }
  $('answerForm').addEventListener('submit',submit);
  $('keypad').addEventListener('click',event=>{
    const button=event.target.closest('[data-key]');if(!button||session.state!=='math')return;
    const key=button.dataset.key,input=$('answer'),value=input.value;
    if(key==='sign')input.value=value.startsWith('-')?value.slice(1):'-'+value;
    else if(key==='delete')input.value=value.slice(0,-1);
    else{
      // A selected wrong answer is replaced by the next keypad digit, just like typing.
      if(input.selectionStart===0&&input.selectionEnd===value.length&&value)input.value=key;
      else if(value.length<8)input.value=value+key;
    }
  });
  function controlsEnabled(enabled){for(const id of ['left','fire','right'])$(id).disabled=!enabled;}
  function message(title,subtitle,number=''){$('stageMessage').hidden=false;$('stageTitle').textContent=title;$('stageSubtitle').textContent=subtitle;$('countdown').textContent=number;$('resume').hidden=true;}
  function dimensions(){const r=$('spaceStage').getBoundingClientRect();return {width:Math.max(260,r.width),height:Math.max(200,r.height)};}
  function resize(){const size=dimensions(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(size.width*dpr);canvas.height=Math.round(size.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(engine)engine.resize(size.width,size.height);draw();}
  function startCountdown(){
    cancelWork();modal('arcade');controlsEnabled(false);count=0;$('bonusTime').textContent='20';$('bonusScore').textContent='0';$('bonusTotal').textContent=session.bonusScore.toLocaleString('en-GB');resize();$('bonusSound').focus();countdownStep();
  }
  function countdownStep(){
    if(count===0)message(session.correct+' CORRECT!','BONUS ROUND!','✦');else message('SYMBOL INVADERS','Get ready to move and fire.',String(4-count));
    beep(true);later(()=>{count++;if(count<=3)countdownStep();else beginBonus();},count===0?900:750);
  }
  function beginBonus(){
    if(!session.beginBonus())return;
    const size=dimensions();engine=new Invaders(size.width,size.height);last=performance.now();$('stageMessage').hidden=true;controlsEnabled(true);$('fire').focus();frame=requestAnimationFrame(animate);
  }
  function inputState(){return {left:keys.has('ArrowLeft')||keys.has('KeyA')||pointers.left.size>0,right:keys.has('ArrowRight')||keys.has('KeyD')||pointers.right.size>0,fire:keys.has('Space')||pointers.fire.size>0||tapFire};}
  function animate(now){
    if(session.state!=='bonus'||paused||!engine)return;
    const points=engine.tick(Math.max(0,(now-last)/1000),inputState());last=now;tapFire=false;
    if(points){session.award(points);beep(true);}
    $('bonusTime').textContent=Math.ceil(Math.max(0,BONUS_SECONDS-engine.elapsed));$('bonusScore').textContent=engine.score.toLocaleString('en-GB');$('bonusTotal').textContent=session.bonusScore.toLocaleString('en-GB');totals();draw();
    if(engine.ended){finishBonus();return;}frame=requestAnimationFrame(animate);
  }
  function draw(){
    const {width:w,height:h}=dimensions();ctx.clearRect(0,0,w,h);ctx.fillStyle='#030c18';ctx.fillRect(0,0,w,h);
    for(let i=0;i<55;i++){ctx.fillStyle=i%3?'#42637b':'#bceaff';ctx.fillRect((i*137+31)%w,(i*83+19)%h,i%3?1:2,i%3?1:2);}
    if(!engine)return;
    ctx.strokeStyle='#143144';ctx.beginPath();ctx.moveTo(0,h-14);ctx.lineTo(w,h-14);ctx.stroke();
    for(const e of engine.enemies){ctx.fillStyle=e.points===250?'#ffd166':'#43d9ff';ctx.fillRect(e.x-17,e.y-17,34,34);ctx.fillStyle='#071522';ctx.font='bold 25px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.symbol,e.x,e.y+1);}
    ctx.fillStyle='#f199d5';for(const s of engine.shots)ctx.fillRect(s.x-2,s.y-10,4,13);
    for(const p of engine.pops){ctx.globalAlpha=1-p.age/.45;ctx.strokeStyle='#ffd166';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,8+p.age*42,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffd166';ctx.font='bold 16px Arial';ctx.fillText('+'+p.points,p.x,p.y-p.age*40);ctx.globalAlpha=1;}
    ctx.fillStyle='#75e8ff';ctx.beginPath();ctx.moveTo(engine.x,h-43);ctx.lineTo(engine.x-19,h-18);ctx.lineTo(engine.x-7,h-23);ctx.lineTo(engine.x,h-17);ctx.lineTo(engine.x+7,h-23);ctx.lineTo(engine.x+19,h-18);ctx.closePath();ctx.fill();ctx.fillStyle='#f199d5';ctx.fillRect(engine.x-4,h-16,8,7);
  }
  function finishBonus(){
    if(!session.finishBonus())return;
    const earned=engine.score;cancelAnimationFrame(frame);frame=null;resetControls();engine.cleanup();engine=null;controlsEnabled(false);$('bonusTime').textContent='0';draw();
    message('BONUS COMPLETE','You scored '+earned.toLocaleString('en-GB')+' points!','');totals();later(returnToMath,2300);
  }
  function returnToMath(){if(!session.resumeMath())return;cancelWork();modal(null);showQuestion();$('feedback').className='feedback good';$('feedback').textContent='Welcome back. Five more correct answers unlock another bonus.';$('answer').focus();}
  function restart(){cancelWork();session.restart(session.level);totals();showQuestion();modal('setup');$('start').focus();}
  $('restart').addEventListener('click',restart);$('bonusRestart').addEventListener('click',restart);
  $('start').addEventListener('click',()=>{cancelWork();session.restart(document.querySelector('input[name="level"]:checked').value);modal(null);showQuestion();$('feedback').className='feedback';$('feedback').textContent='Use your keyboard or the number pad below.';$('answer').focus();});
  function toggleSound(){sound=!sound;for(const id of ['sound','bonusSound']){$(id).textContent=sound?'Sound on':'Sound off';$(id).setAttribute('aria-pressed',String(sound));}if(sound)beep(true);}
  $('sound').addEventListener('click',toggleSound);$('bonusSound').addEventListener('click',toggleSound);
  for(const action of ['left','right','fire']){
    const button=$(action);
    button.addEventListener('pointerdown',event=>{if(session.state!=='bonus'||paused)return;event.preventDefault();pointers[action].add(event.pointerId);button.setPointerCapture(event.pointerId);if(action==='fire')tapFire=true;});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,event=>{pointers[action].delete(event.pointerId);});
    button.addEventListener('contextmenu',event=>event.preventDefault());
    // Keyboard/switch activation of the visible Fire button also fires once.
    if(action==='fire')button.addEventListener('click',event=>{if(event.detail===0&&session.state==='bonus'&&!paused)tapFire=true;});
  }
  const controlKeys=new Set(['ArrowLeft','ArrowRight','KeyA','KeyD','Space']);
  document.addEventListener('keydown',event=>{
    if(event.key==='Tab'){
      const dialog=!$('setup').hidden?$('setup'):!$('arcade').hidden?$('arcade'):null;
      if(dialog){const items=[...dialog.querySelectorAll('a,button:not(:disabled),input:checked')].filter(el=>!el.hidden&&!el.closest('[hidden]'));if(items.length){if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}}}
    }
    if(!controlKeys.has(event.code)||paused||!['bonus','countdown'].includes(session.state))return;
    event.preventDefault();if(session.state==='bonus'){keys.add(event.code);if(event.code==='Space'&&!event.repeat)tapFire=true;}
  });
  document.addEventListener('keyup',event=>{keys.delete(event.code);if(!paused&&session.state==='bonus'&&controlKeys.has(event.code))event.preventDefault();});
  function pause(){
    resetControls();if(paused||!['bonus','countdown'].includes(session.state))return;
    if(session.state==='bonus'){cancelAnimationFrame(frame);frame=null;animate(performance.now());cancelAnimationFrame(frame);frame=null;if(session.state!=='bonus')return;}
    clearTimeout(timer);timer=null;paused=true;controlsEnabled(false);message('ROUND PAUSED','Your bonus is safe. Resume when ready.','');$('resume').hidden=false;$('resume').focus();
  }
  $('resume').addEventListener('click',()=>{if(!paused)return;paused=false;resetControls();if(session.state==='countdown')countdownStep();else if(session.state==='bonus'){$('stageMessage').hidden=true;controlsEnabled(true);last=performance.now();$('fire').focus();frame=requestAnimationFrame(animate);}});
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('resize',()=>{if(!$('arcade').hidden)resize();});
  window.addEventListener('pagehide',pause);
  showQuestion();modal('setup');$('start').focus();
})();
