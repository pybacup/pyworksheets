const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../assets/exams/practice.js'),C=require('../assets/exams/core.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const all=require('../exams/data/exam-index.json'),plan=require('../tools/exams/june-2024-p1-answer-plan.json');
const pilot=all.filter(q=>q.id.startsWith('edexcel-1ma1-1h-2024-june-q')),read=f=>fs.readFileSync(path.join(__dirname,'..',f));
test('pilot has exactly 23 original official answer extracts, matching all 80 marks',async()=>{
 assert.equal(pilot.length,23);assert.equal(all.filter(q=>q.qualification==='GCSE Maths'&&q.tier==='Higher').length,997);
 assert.equal(pilot.reduce((n,q)=>n+q.marks,0),80);assert.equal(new Set(all.map(q=>q.id)).size,all.length);
 for(const item of plan.questions){const q=pilot.find(q=>q.id===item.id);assert(q);assert.equal(+q.question,item.question);assert.equal(q.marks,item.marks);assert(item.markBranches.every(m=>m===q.marks));assert.equal(q.answerFile,'exams/answers/gcse/higher/p1/'+q.id+'.pdf');
 const doc=await lib.PDFDocument.load(read(q.answerFile));assert.equal(doc.getPageCount(),1);assert(doc.context.enumerateIndirectObjects().some(([,o])=>String(o).includes('/Subtype /Form')));}
 assert.equal(C.validateIndex(structuredClone(all)).length,1069);
});
test('answer paths reject external, traversal and duplicate files without requiring answers for legacy records',()=>{
 const q=pilot[0];for(const answerFile of ['https://example.com/a.pdf','exams/answers/../a.pdf','exams/answers/%2e%2e/a.pdf','exams/questions/a.pdf'])assert.throws(()=>C.validateIndex([{...q,answerFile}]),/Invalid answer PDF/);
 assert.throws(()=>C.validateIndex([q,{...pilot[1],answerFile:q.answerFile}]),/Duplicate answer PDF/);
 assert.equal(C.validateIndex([{...q,answerFile:undefined}]).length,1);
});
test('answers preserve basket order, source labels and A4 flow; working mode cannot select working PDFs',async()=>{
 const selected=[14,1,9,10,13,18,21].map(n=>pilot.find(q=>+q.question===n)),loads=[],texts=[];
 const adapter={...lib,PDFDocument:{load:lib.PDFDocument.load.bind(lib.PDFDocument),create:async()=>{const d=await lib.PDFDocument.create(),add=d.addPage.bind(d);d.addPage=(...args)=>{const p=add(...args),draw=p.drawText.bind(p);p.drawText=(t,o)=>{texts.push(t);return draw(t,o);};return p;};return d;}}};
 const bytes=await P.buildAnswers(selected,{title:'Algebra Practice',lib:adapter,includeWorkingSpace:true,load:async q=>{loads.push(q.questionFile);return read(q.questionFile);}});
 assert.deepEqual(loads,selected.map(q=>q.answerFile));const doc=await lib.PDFDocument.load(bytes);assert.equal(doc.getPageCount(),3);for(const p of doc.getPages())assert.deepEqual(p.getSize(),{width:595.28,height:841.89});
 assert.deepEqual(texts.filter(t=>t.includes('Question ')),selected.map(q=>P.sourceLines(q).join(' · ')));
 assert.equal(P.answerFilename('Algebra Practice'),'PY-Maths-Algebra-Practice-Answers.pdf');
});
test('missing answers identify every question before loading and failed answer loads identify source',async()=>{
 let called=false;const missing=[{...pilot[0],answerFile:undefined},{...pilot[1],answerFile:undefined}];
 await assert.rejects(()=>P.buildAnswers(missing,{lib,load:()=>{called=true;}}),e=>/Missing official mark scheme/.test(e.message)&&/Question 1 ·/.test(e.message)&&/Question 2 ·/.test(e.message)&&/June 2024/.test(e.message));assert.equal(called,false);
 await assert.rejects(()=>P.buildAnswers([pilot[0]],{lib,load:()=>{throw Error('HTTP 404');}}),/Pearson Edexcel 1MA1\/1H.*Question 1: HTTP 404/);
});
test('multi-page answers retain every continuation and allow short pages to share A4',async()=>{
 const fixture=await lib.PDFDocument.create();for(let i=0;i<3;i++)fixture.addPage([500,100]).drawText('Continuation '+i,{x:10,y:70});const data=await fixture.save(),drawn=[];
 const adapter={...lib,PDFDocument:{load:lib.PDFDocument.load.bind(lib.PDFDocument),create:async()=>{const d=await lib.PDFDocument.create(),add=d.addPage.bind(d);d.addPage=(...a)=>{const p=add(...a),draw=p.drawPage.bind(p);p.drawPage=(e,o)=>{drawn.push(o);return draw(e,o);};return p;};return d;}}};
 const out=await lib.PDFDocument.load(await P.buildAnswers([pilot[0]],{lib:adapter,load:()=>data}));assert.equal(out.getPageCount(),1);assert.equal(drawn.length,3);assert(drawn.every(o=>o.width===500&&o.height===100));
});
