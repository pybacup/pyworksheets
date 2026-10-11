const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),all=require('../exams/data/exam-index.json'),plan=require('../tools/exams/alevel-y1-june-2025-h630-01-plan.json');
const C=require('../assets/exams/core.js'),P=require('../assets/exams/practice.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),ids=new Set(plan.questions.map(q=>q.record.id)),pilot=all.filter(q=>ids.has(q.id));
test('pilot adds 13 numbered questions / 70 marks and preserves every existing record',()=>{
 const old=all.filter(q=>q.qualification!=='A-Level Maths');assert.equal(old.length,2329);assert.equal(sha(JSON.stringify(old)),plan.baselineSHA256);
 assert.equal(pilot.length,13);assert.equal(pilot.reduce((n,q)=>n+q.marks,0),70);assert.deepEqual(pilot.map(q=>+q.question),Array.from({length:13},(_,i)=>i+1));
 assert.equal(C.validateIndex(structuredClone(all)).length,all.length);assert.equal(new Set(all.map(q=>q.id)).size,all.length);
 for(const key of ['questionFile','workingQuestionFile','answerFile']){const files=all.map(q=>q[key]).filter(Boolean);assert.equal(new Set(files).size,files.length);}
 for(const key of ['source','markScheme','answerBooklet'])assert.equal(sha(fs.readFileSync(path.join(root,plan[key+'File']))),plan[key+'SHA256']);
});
test('all 39 variants are readable and match audited source regions and official files',async()=>{
 for(const item of plan.questions){const q=pilot.find(q=>q.id===item.record.id);assert.deepEqual(q,item.record);assert.equal(q.paperCode,'H630/01');assert.equal(q.series,'June');assert.equal(q.examYear,2025);
  for(const [mode,key] of [['compact','questionFile'],['working','workingQuestionFile'],['answers','answerFile']]){
   const bytes=fs.readFileSync(path.join(root,q[key]));assert.equal(sha(bytes),item[mode+'SHA256']);const d=await lib.PDFDocument.load(bytes);assert.equal(d.getPageCount(),item[mode].length);
   item[mode].forEach((group,i)=>{const size=d.getPage(i).getSize();assert.equal(size.width,Math.max(...group.map(p=>p.right-p.left))+10);assert(Math.abs(size.height-(group.reduce((h,p)=>h+p.bottom-p.top,0)+6*(group.length-1)+8))<.001);});
  }
 }
 assert(plan.questions[6].compact[0].some(p=>p.source==='answerBooklet'&&p.page===6)); // Required original axes.
 for(const n of [4,11,12,13])assert.equal(new Set(plan.questions[n-1].working.flat().filter(p=>p.source==='answerBooklet').map(p=>p.page)).size,2);
 for(const n of [11,12,13])assert.equal(plan.questions[n-1].answers.length,2);
 assert(plan.questions[9].compact[0].some(p=>p.source==='question'&&p.page===1)); // Original g=9.8 rubric.
});
test('A-Level Year 1 combined paper and Pure/Mechanics/secondary skill filters work',()=>{
 const f={qualification:'A-Level Maths',yearGroup:'Year 1',component:'Pure Mathematics and Mechanics',examYear:2025};
 assert.equal(C.filter(all,f).length,13);assert.equal(C.filter(all,{...f,topic:'Pure'}).length,9);assert.equal(C.filter(all,{...f,topic:'Mechanics'}).length,4);
 assert.deepEqual(C.filter(all,{...f,topic:'Pure',subtopic:'Differentiation'}).map(q=>q.question),['11','12']);
 assert.equal(C.filter(all,{...f,topic:'Mechanics',minMarks:5}).length,2);
 assert(C.hierarchy['A-Level Maths'].components.includes('Core'));assert(C.hierarchy['A-Level Maths'].components.includes('Statistics'));
 assert.deepEqual(C.hierarchy['A-Level Further Maths'].components,['Pure','Numerical Methods']);
 const basket=new P.Basket();basket.add(all.find(q=>q.tier==='Higher'));const visible=C.filter(all,{...f,topic:'Mechanics'});visible.forEach(q=>basket.add(q));visible.forEach(q=>basket.add(q));assert.equal(basket.items.length,5);
});
test('all export modes use A4, selected order, actual OCR headings and default compact files',async()=>{
 const selected=[1,2,5,12,13].map(n=>pilot.find(q=>+q.question===n));let compactPages;
 for(const mode of ['compact','working','answers']){
  const loaded=[],headers=[],adapter={...lib,PDFDocument:{load:lib.PDFDocument.load.bind(lib.PDFDocument),create:async()=>{const d=await lib.PDFDocument.create(),add=d.addPage.bind(d);d.addPage=(...a)=>{const p=add(...a),draw=p.drawText.bind(p);p.drawText=(t,o)=>{headers.push(t);return draw(t,o);};return p;};return d;}}};
  const options={lib:adapter,title:'Year 1 Maths Pilot Practice',includeWorkingSpace:mode==='working',load:q=>{loaded.push(q.questionFile);return fs.readFileSync(path.join(root,q.questionFile));}};
  const bytes=await(mode==='answers'?P.buildAnswers:P.build)(selected,options),doc=await lib.PDFDocument.load(bytes);
  assert.deepEqual(loaded,selected.map(q=>q[mode==='answers'?'answerFile':mode==='working'?'workingQuestionFile':'questionFile']));
  for(const page of doc.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
  for(const q of selected)assert(headers.some(h=>h.includes('OCR MEI')&&h.includes('H630/01')&&h.includes('June 2025')&&h.includes('Question '+q.question+' · '+q.marks+' marks')));
  if(mode==='compact'){compactPages=doc.getPageCount();assert(compactPages<selected.length);}if(mode==='working')assert(doc.getPageCount()>compactPages);
  if(process.env.PILOT_OUTPUT_DIR){fs.mkdirSync(process.env.PILOT_OUTPUT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.PILOT_OUTPUT_DIR,'PY-Maths-Year-1-Pilot-Practice'+(mode==='answers'?'-Answers':mode==='working'?'-Working-Space':'')+'.pdf'),bytes);}
  console.log(mode+': '+doc.getPageCount()+' A4 pages');
 }
 assert.throws(()=>P.requireAnswers([{...selected[0],answerFile:undefined}]),/Question 1/);
});
