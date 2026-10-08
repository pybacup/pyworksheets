(()=>{
'use strict';
const $=id=>document.getElementById(id),C=ExamCore,U=ExamUI,P=ExamPractice,basket=new P.Basket();
let entries=[],visible=[],busy=false,downloadURL=null;
const ids=['topic','examBoard','examYear','paper','series','subtopic','minMarks','maxMarks'];
function node(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function render(){
 const f={...U.values(),...Object.fromEntries(ids.map(k=>[k,$(k).value]))};$('questions').replaceChildren();visible=[];$('selectVisible').textContent='Select All (0)';$('selectVisible').disabled=true;
 if(!U.ready(f)){$('status').textContent='Choose a qualification and its tier or year and component.';return;}
 if(!f.topic&&f.qualification!=='GCSE Maths'){$('status').textContent=entries.length?'Choose a topic to see individual questions.':'No exams have been added yet.';return;}
 if((f.minMarks&&(+f.minMarks<1||!Number.isInteger(+f.minMarks)))||(f.maxMarks&&(+f.maxMarks<1||!Number.isInteger(+f.maxMarks)))||(f.minMarks&&f.maxMarks&&+f.minMarks>+f.maxMarks)){$('status').textContent='Enter a valid whole-number marks range.';return;}
 const found=C.filter(entries,f).sort((a,b)=>b.examYear-a.examYear||String(a.question).localeCompare(String(b.question),undefined,{numeric:true}));
 $('status').textContent=found.length+' question'+(found.length===1?'':'s')+' found.';
 visible=found;$('selectVisible').textContent='Select All ('+found.length+')';$('selectVisible').disabled=busy||!found.length;
 for(const e of found){
 const card=node('article',undefined,'question-card question-row');card.classList.toggle('selected',basket.has(e.id));
 const label=node('label',undefined,'select-question'),input=document.createElement('input');input.type='checkbox';input.checked=basket.has(e.id);input.disabled=busy;input.setAttribute('aria-label','Select '+e.examBoard+' '+e.paperCode+' '+P.series(e)+' question '+e.question);
 input.addEventListener('change',()=>{if(busy)return;if(input.checked)basket.add(e);else basket.remove(e.id);card.classList.toggle('selected',input.checked);renderBasket();});
 const number=node('span','Q'+e.question,'question-number');
 const source=node('span',[e.examBoard,C.paper(e),e.paperCode,P.series(e)].filter(Boolean).join(' · '),'question-source');
 const topic=node('span',C.topics(e).join(', '),'question-topic');
 const marks=node('span',e.marks+' marks','question-marks');
 const subtopic=node('span',e.subtopics.join(', '),'question-subtopic');
 for(const field of [source,topic,subtopic])field.title=field.textContent;
 label.append(input,number,source,topic,marks,subtopic);
 const a=node('a','Preview ↗','question-preview');a.href=e.questionFile;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Preview question '+e.question+' '+P.series(e));
 card.append(label,a);$('questions').append(card);
 }
}
function renderBasket(focus){
 $('basketCount').textContent='Selected Questions ('+basket.items.length+')';$('basketMarks').textContent=basket.marks+' total marks';$('basketSummary').textContent=basket.items.length+' selected · '+basket.marks+' marks';$('selectedList').replaceChildren();
 basket.items.forEach((e,i)=>{const li=node('li');li.append(node('strong',(i+1)+'. '+e.topic+' · Question '+e.question),node('p',[e.examBoard,e.paperCode,P.series(e),e.marks+' marks'].join(' · ')));const controls=node('div',undefined,'basket-controls');for(const [action,text,disabled] of [['up','↑ Move up',i===0],['down','↓ Move down',i===basket.items.length-1],['remove','Remove',false]]){const b=node('button',text);b.type='button';b.disabled=busy||disabled;b.dataset.id=e.id;b.dataset.action=action;b.setAttribute('aria-label',text+' question '+e.question+' '+e.paperCode+' '+P.series(e));b.addEventListener('click',()=>{if(busy)return;if(action==='remove')basket.remove(e.id);else basket.move(e.id,action==='up'?-1:1);renderBasket({id:e.id,action});render();});controls.append(b);}li.append(controls);$('selectedList').append(li);});
 $('basketEmpty').hidden=basket.items.length>0;$('createPractice').disabled=busy||!basket.items.length;$('clearAll').disabled=busy||!basket.items.length;$('clearSelection').disabled=busy||!basket.items.length;
 if(focus){const candidates=[...$('selectedList').querySelectorAll('button')];const target=candidates.find(b=>b.dataset.id===focus.id&&b.dataset.action===focus.action&&!b.disabled)||candidates.find(b=>b.dataset.id===focus.id&&!b.disabled)||$('basketHeading');target.focus();}
}
function course(){const gcse=U.values().qualification==='GCSE Maths';for(const key of ['paper','series']){$(key+'Label').hidden=!gcse;if(!gcse)$(key).value='';}const scoped=C.filter(entries,U.values());U.options('topic',C.unique(scoped.flatMap(e=>C.topics(e))),gcse?'All':'Choose a topic');U.options('examBoard',C.unique(scoped.map(e=>e.examBoard)));U.options('examYear',C.unique(scoped.map(e=>e.examYear)).reverse());U.options('subtopic',[]);$('minMarks').value=$('maxMarks').value='';render();}
U.courses(course);for(const id of ids)$(id).addEventListener('input',()=>{if(id==='topic')U.options('subtopic',C.unique(C.filter(entries,{...U.values(),topic:$('topic').value}).flatMap(e=>e.subtopics)));render();});
$('reset').addEventListener('click',()=>{for(const id of ids.filter(k=>k!=='topic'))$(id).value='';render();});
function clearSelection(){if(busy)return;basket.clear();renderBasket();render();}
$('clearAll').addEventListener('click',clearSelection);$('clearSelection').addEventListener('click',clearSelection);
$('selectVisible').addEventListener('click',()=>{if(busy)return;for(const e of visible)basket.add(e);renderBasket();render();});
$('createPractice').addEventListener('click',()=>{if(busy||!basket.items.length)return;const topics=C.unique(basket.items.map(e=>e.topic));$('paperTitle').value=topics.length===1?topics[0]+' Practice':$('topic').value?$('topic').value+' and Mixed Questions Practice':'Mixed Topics Practice';$('exportStatus').textContent='Source details are included on every page.';$('exportDialog').showModal();$('paperTitle').focus();});
$('cancelExport').addEventListener('click',()=>{if(!busy)$('exportDialog').close();});$('exportDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('exportForm').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!basket.items.length)return;
 const title=$('paperTitle').value.trim();if(!title){$('exportStatus').textContent='Enter a practice paper title.';$('paperTitle').focus();return;}
 busy=true;$('buildPDF').disabled=true;$('cancelExport').disabled=true;$('paperTitle').disabled=true;$('exportDialog').setAttribute('aria-busy','true');$('exportStatus').textContent='Creating PDF…';$('downloadResult').replaceChildren();if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;}renderBasket();render();
 const selected=basket.items.slice();
 try{if(!window.PDFLib)throw Error('The PDF library did not load. Reload the page and try again.');const bytes=await P.build(selected,{title,lib:PDFLib,load:P.loadQuestion,onProgress:(i,total)=>{$('exportStatus').textContent='Creating PDF… question '+(i+1)+' of '+total;}});downloadURL=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=node('a','Download practice PDF','primary-link');a.href=downloadURL;a.download=P.filename(title);const open=node('a','Open PDF in a new tab');open.href=downloadURL;open.target='_blank';open.rel='noopener';$('downloadResult').append(node('p','Ready: '+selected.length+' questions · '+selected.reduce((sum,e)=>sum+e.marks,0)+' marks'),a,open);a.click();$('exportDialog').close();$('downloadResult').focus();}
 catch(error){$('exportStatus').textContent=error.message+' No practice paper was created. Your selections have been kept.';}
 finally{busy=false;$('buildPDF').disabled=false;$('cancelExport').disabled=false;$('paperTitle').disabled=false;$('exportDialog').setAttribute('aria-busy','false');renderBasket();render();}
});
renderBasket();U.index().then(data=>{entries=data;course();}).catch(e=>{$('status').textContent=e.message+' Serve this site over HTTP/HTTPS and check exams/data/exam-index.json.';});
window.addEventListener('pagehide',()=>{if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;$('downloadResult').replaceChildren();}});
})();
