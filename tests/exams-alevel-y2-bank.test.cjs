const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),test=require('node:test');
const root=path.resolve(__dirname,'..'),C=require('../assets/exams/core.js'),P=require('../assets/exams/practice.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js'),all=require('../exams/data/exam-index.json'),plan=require('../tools/exams/alevel-y2-bank-plan.json'),pilot=require('../tools/exams/alevel-y2-june-2025-h640-03-plan.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),qs=all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup==='Year 2'),newIDs=new Set(plan.papers.flatMap(p=>p.questions.map(q=>q.record.id)));
test('Year 2 covers all 24 papers; all earlier records and approved pilot are unchanged',()=>{
 C.validateIndex(structuredClone(all));assert.equal(qs.length,363);assert.equal(newIDs.size,349);
 assert.equal(sha(JSON.stringify(all.filter(q=>!newIDs.has(q.id)))),plan.baselineSHA256);
 assert.deepEqual(qs.filter(q=>q.examYear===2025&&q.paperCode==='H640/03'),pilot.questions.map(q=>q.record));
 for(let year=2018;year<=2025;year++)for(let n=1;n<=3;n++){
  const code='H640/0'+n,paper=qs.filter(q=>q.examYear===year&&q.paperCode===code);
  assert(paper.length);assert.deepEqual(paper.map(q=>q.question),Array.from({length:paper.length},(_,i)=>String(i+1)));
  assert.equal(paper.reduce((s,q)=>s+q.marks,0),n===3?75:100);
  for(const q of paper){assert.equal(q.paper,'P'+n);assert.equal(q.paperNumber,n);assert.equal(q.series,year===2020?'November':year===2021?'Autumn':'June');assert.equal(q.component,'Pure Mathematics and '+({1:'Mechanics',2:'Statistics',3:'Comprehension'})[n]);assert.equal(q.subtopics[0],q.subtopic);if(n!==1)assert.notEqual(q.topic,'Mechanics');if(n!==2)assert.notEqual(q.topic,'Statistics');}
 }
 assert.deepEqual(Object.fromEntries(['Pure','Mechanics','Statistics'].map(t=>[t,qs.filter(q=>q.topic===t).length])),{Pure:250,Mechanics:50,Statistics:63});
 assert.equal(all.filter(q=>q.qualification==='GCSE Maths'&&q.tier==='Higher').length,997);assert.equal(all.filter(q=>q.qualification==='GCSE Maths'&&q.tier==='Foundation').length,1260);
});
test('every source and all three variant files match their source plan; no duplicate files',()=>{
 const files=new Set();for(const paper of [...plan.papers,pilot]){
  for(const [kind,file] of Object.entries(paper.sources))assert.equal(sha(fs.readFileSync(path.join(root,file))),paper.sourceHashes[kind]);
  for(const q of paper.questions)for(const [mode,key] of [['compact','questionFile'],['working','workingQuestionFile'],['answers','answerFile']]){const file=q.record[key];assert(!files.has(file));files.add(file);assert.equal(sha(fs.readFileSync(path.join(root,file))),q[mode+'SHA256']);assert(q[mode].length);}
  if(paper.material)assert.equal(sha(fs.readFileSync(path.join(root,paper.material.metadata.file))),paper.material.SHA256);
 }assert.equal(files.size,1089);assert.equal(C.requiredMaterials(qs).length,8);
});
test('combined component/year/topic/subtopic/marks filters drive duplicate-free Select All',()=>{
 for(const component of C.hierarchy['A-Level Maths'].components.filter(c=>c.startsWith('Pure Mathematics and'))){
  for(const topic of ['Pure','Mechanics','Statistics']){const f={qualification:'A-Level Maths',yearGroup:'Year 2',component,topic,examYear:2023,minMarks:2,maxMarks:15},visible=C.filter(all,f),b=new P.Basket();b.add(qs[0]);for(let i=0;i<2;i++)visible.forEach(q=>b.add(q));assert.equal(b.items.length,new Set([qs[0].id,...visible.map(q=>q.id)]).size);assert(visible.every(q=>q.component===component&&q.topic===topic&&q.examYear===2023));}
 }
 const b=C.filter(qs,{component:'Pure Mathematics and Comprehension',subtopic:'Comprehension'});assert(b.length);assert(b.every(q=>q.section==='B'&&q.requiredMaterials.length===1));
});
test('mixed-year inserts are appended once each and never to answers; all export modes are A4',async()=>{
 const sample=[2018,2022,2025].flatMap(year=>qs.filter(q=>q.examYear===year&&q.paperCode==='H640/03'&&q.section==='B').slice(0,2)),materials=C.requiredMaterials(sample);assert.equal(materials.length,3);
 for(const [working,answers] of [[false,false],[true,false],[false,true]]){
  const loaded=[],options={lib,includeWorkingSpace:working,load:async q=>{loaded.push(q.questionFile);return fs.readFileSync(path.join(root,q.questionFile));}},bytes=await(answers?P.buildAnswers(sample,options):P.build(sample,options));
  assert.deepEqual(loaded,[...sample.map(q=>answers?q.answerFile:working?q.workingQuestionFile:q.questionFile),...(!answers?materials.map(m=>m.file):[])]);
  for(const page of (await lib.PDFDocument.load(bytes)).getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
 }
 await assert.rejects(()=>P.buildAnswers([{...sample[0],answerFile:undefined}],{lib,load:async()=>{throw Error('should not load');}}),/Missing official mark scheme/);
});
