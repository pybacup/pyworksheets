const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const all=require('../exams/data/exam-index.json'),plan=require('../tools/exams/alevel-y1-bank-plan.json'),pilot=require('../tools/exams/alevel-y1-june-2025-h630-01-plan.json');
const C=require('../assets/exams/core.js'),P=require('../assets/exams/practice.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js'),root=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const added=plan.papers.flatMap(p=>p.questions),ids=new Set(added.map(q=>q.record.id)),bank=all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup==='Year 1');
test('approved Q11 inequality labels remain precise to the actual root/exponential skill',()=>{
 const q=bank.find(q=>q.id==='ocr-mei-h630-01-2020-november-q11');
 assert.equal(q.topic,'Pure');assert.equal(q.subtopic,'Exponentials and logarithms');
 assert.deepEqual(q.subtopics,['Exponentials and logarithms','Inequalities']);
 const scope={qualification:'A-Level Maths',yearGroup:'Year 1',component:q.component,examYear:2020,topic:'Pure'};
 assert(C.filter(all,{...scope,subtopic:'Inequalities'}).some(e=>e.id===q.id));
 for(const label of ['Linear inequalities','Quadratic inequalities'])assert(!C.filter(all,{...scope,subtopic:label}).some(e=>e.id===q.id));
 const p2=bank.find(q=>q.id==='ocr-mei-h630-02-2020-november-q11');
 assert.equal(p2.component,'Pure Mathematics and Statistics');assert.equal(p2.topic,'Pure');
 assert.deepEqual(p2.subtopics,['Exponentials and logarithms','Differentiation','Modelling']);
 const classifications=require('../tools/exams/alevel-y1-classifications.json');
 assert.equal(classifications['2020-01'][10],'P|Exponentials and logarithms|Inequalities');
 assert.equal(classifications['2020-02'][10],'P|Exponentials and logarithms|Differentiation|Modelling');
 for(const item of [q,p2])assert.deepEqual(added.find(e=>e.record.id===item.id).record,item);
});
test('184 additions preserve all 2342 existing records including approved pilot',()=>{
 const old=all.filter(q=>!ids.has(q.id));assert.equal(old.length,plan.baselineCount);assert.equal(sha(JSON.stringify(old)),plan.baselineSHA256);
 assert.equal(added.length,184);assert.equal(bank.length,197);assert.equal(all.length,2526);assert.equal(C.validateIndex(structuredClone(all)).length,all.length);
 assert.equal(new Set(all.map(q=>q.id)).size,all.length);assert.equal(all.filter(q=>q.tier==='Higher').length,997);assert.equal(all.filter(q=>q.tier==='Foundation').length,1260);
 for(const q of added)assert.deepEqual(all.find(e=>e.id===q.record.id),q.record);
 for(const q of pilot.questions)assert.deepEqual(all.find(e=>e.id===q.record.id),q.record);
});
test('all 16 papers and official source trios match; all 591 PDF variants are readable',async()=>{
 const papers=[...plan.papers,{sources:{question:pilot.sourceFile,markScheme:pilot.markSchemeFile,answerBooklet:pilot.answerBookletFile},questions:pilot.questions}];assert.equal(papers.length,16);
 const identities=new Set(),paths=new Set();
 for(const p of papers){const r=p.questions[0].record,key=r.examYear+'-'+r.paperCode;assert(!identities.has(key));identities.add(key);assert.equal(p.questions.reduce((s,q)=>s+q.record.marks,0),70);assert.deepEqual(p.questions.map(q=>+q.record.question),p.questions.map((_,i)=>i+1));
  for(const [kind,file] of Object.entries(p.sources)){const bytes=fs.readFileSync(path.join(root,file));assert(bytes.subarray(0,4).equals(Buffer.from('%PDF')));if(p.sourceHashes)assert.equal(sha(bytes),p.sourceHashes[kind]);}
  for(const q of p.questions)for(const [mode,field] of [['compact','questionFile'],['working','workingQuestionFile'],['answers','answerFile']]){
   const file=q.record[field];assert(!paths.has(file));paths.add(file);const bytes=fs.readFileSync(path.join(root,file));assert.equal(sha(bytes),q[mode+'SHA256']);const doc=await lib.PDFDocument.load(bytes);assert.equal(doc.getPageCount(),q[mode].length);
   for(const pg of doc.getPages())assert(pg.getWidth()>0&&pg.getHeight()>0);
  }
 }
 assert.equal(paths.size,591);
 for(const year of [2018,2019,2020,2021,2022,2023,2024,2025])for(const paper of ['H630/01','H630/02'])assert(identities.has(year+'-'+paper));
 assert(bank.filter(q=>q.examYear===2020).every(q=>q.series==='November'));assert(bank.filter(q=>q.examYear===2021).every(q=>q.series==='Autumn'));
});
test('combined component, broad topics, secondary filters and Select All preserve basket',()=>{
 for(const component of ['Pure Mathematics and Mechanics','Pure Mathematics and Statistics']){
  const f={qualification:'A-Level Maths',yearGroup:'Year 1',component};const visible=C.filter(all,f);assert(visible.length>80);
  for(const topic of component.endsWith('Mechanics')?['Pure','Mechanics']:['Pure','Statistics'])assert(C.filter(all,{...f,topic}).length>0);
  const selected=C.filter(all,{...f,topic:component.endsWith('Mechanics')?'Mechanics':'Statistics',examYear:2024});
  const basket=new P.Basket();basket.add(all.find(q=>q.tier==='Higher'));for(let i=0;i<2;i++)selected.forEach(q=>basket.add(q));assert.equal(basket.items.length,selected.length+1);
 }
 assert(C.filter(all,{qualification:'A-Level Maths',subtopic:'Differentiation from first principles'}).length>=3);
 const appendix=added.find(q=>q.record.id==='ocr-mei-h630-01-2024-june-q3');assert(appendix.record.answerSourcePages.includes(23));
 assert(added.find(q=>q.record.id==='ocr-mei-h630-01-2024-june-q9').record.answerSourcePages.includes(24));
 assert(added.find(q=>q.record.id==='ocr-mei-h630-02-2025-june-q5').record.answerSourcePages.includes(27));
});
test('mixed compact/working/official answers export A4 in exact selected order',async()=>{
 const selected=require('../tools/exams/create-alevel-y1-review-sample.cjs');let compact;
 for(const mode of ['compact','working','answers']){const loaded=[],options={lib,title:'Year 1 Mixed Practice',includeWorkingSpace:mode==='working',load:q=>{loaded.push(q.questionFile);return fs.readFileSync(path.join(root,q.questionFile));}};
  const bytes=await(mode==='answers'?P.buildAnswers:P.build)(selected,options);const doc=await lib.PDFDocument.load(bytes);for(const page of doc.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
  assert.deepEqual(loaded,selected.map(q=>q[mode==='answers'?'answerFile':mode==='working'?'workingQuestionFile':'questionFile']));if(mode==='compact')compact=doc.getPageCount();if(mode==='working')assert(doc.getPageCount()>compact);
 }
 assert.throws(()=>P.requireAnswers([{...selected[0],answerFile:undefined}]),/Question 11/);
});
