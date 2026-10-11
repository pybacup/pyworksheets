const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const all=require('../exams/data/exam-index.json'),plan=require('../tools/exams/foundation-bank-plan.json'),pilot=require('../tools/exams/foundation-june-2024-p1-plan.json');
const C=require('../assets/exams/core.js'),P=require('../assets/exams/practice.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'..'),rows=all.filter(q=>q.tier==='Foundation'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('all 45 Foundation papers and official schemes have complete, unique triples and correct totals',async()=>{
 assert.equal(rows.length,1260);assert.equal(all.length,2329);assert.equal(new Set(all.map(q=>q.id)).size,2329);assert.equal(C.validateIndex(structuredClone(all)).length,2329);
 const papers=new Map();for(const q of rows){if(!papers.has(q.sourceFile))papers.set(q.sourceFile,[]);papers.get(q.sourceFile).push(q);}
 assert.equal(papers.size,45);
 for(const qs of papers.values()){assert.equal(qs.reduce((a,q)=>a+q.marks,0),80);assert.deepEqual(qs.map(q=>+q.question).sort((a,b)=>a-b),Array.from({length:qs.length},(_,i)=>i+1));}
 const schemes=new Set([pilot.markSchemeFile]),files=new Set();
 for(const paper of plan){schemes.add(paper.markSchemeFile);assert.equal(hash(fs.readFileSync(path.join(root,paper.sourceFile))),paper.sourceSHA256);assert.equal(hash(fs.readFileSync(path.join(root,paper.markSchemeFile))),paper.markSchemeSHA256);
  for(const item of paper.questions){const q=all.find(q=>q.id===item.record.id);assert.deepEqual(q,item.record);assert.equal(q.paperCode,`1MA1/${q.paperNumber}F`);assert.equal(q.paper,'P'+q.paperNumber);assert.equal(q.examBoard,'Pearson Edexcel');assert.equal(q.tier,'Foundation');
   for(const [mode,key] of [['compact','questionFile'],['working','workingQuestionFile'],['answers','answerFile']]){assert(!files.has(q[key]));files.add(q[key]);const b=fs.readFileSync(path.join(root,q[key]));assert.equal(hash(b),item[mode+'SHA256'],q.id+mode);const d=await lib.PDFDocument.load(b);assert(d.getPageCount()>0);if(mode!=='compact')assert.equal(d.getPageCount(),item[mode].length);}
  }
 }
 assert.equal(schemes.size,45);assert.equal(files.size,3696);
 for(const key of ['questionFile','workingQuestionFile','answerFile'])assert.equal(new Set(rows.map(q=>q[key])).size,1260);
});
test('Foundation filters combine year, series, paper, topic and marks; Select All remains scoped and deduplicated',()=>{
 for(const [tier,count] of [['',2257],['Higher',997],['Foundation',1260]])assert.equal(C.filter(all,{qualification:'GCSE Maths',tier}).length,count);
 for(const [paper,count] of [['P1',421],['P2',415],['P3',424]]){
  assert.equal(C.filter(all,{qualification:'GCSE Maths',tier:'Foundation',paper}).length,count);
  for(const series of ['June','November'])for(const year of [2017,2019,2022,2024]){
   const filter={qualification:'GCSE Maths',tier:'Foundation',paper,series,examYear:year};
   for(const topic of C.unique(rows.flatMap(C.topics))){const visible=C.filter(all,{...filter,topic,minMarks:2,maxMarks:5});
    assert(visible.every(q=>q.paper===paper&&q.series===series&&q.examYear===year&&C.topics(q).includes(topic)&&q.marks>=2&&q.marks<=5));
    const basket=new P.Basket(),higher=all.find(q=>q.tier==='Higher');basket.add(higher);visible.forEach(q=>basket.add(q));visible.forEach(q=>basket.add(q));assert.equal(basket.items.length,visible.length+1);assert(basket.has(higher.id));
   }
  }
 }
});
test('mixed Foundation exports preserve selection order, actual sources and A4 dimensions in all modes',async()=>{
 const selected=require('../tools/exams/create-foundation-review-sample.cjs').map(id=>rows.find(q=>q.id==='edexcel-1ma1-'+id));let compact;
 for(const mode of ['compact','working','answers']){const requested=[];const bytes=await(mode==='answers'?P.buildAnswers:P.build)(selected,{title:'Foundation Mixed Practice',lib,includeWorkingSpace:mode==='working',load:q=>{requested.push(q.questionFile);return fs.readFileSync(path.join(root,q.questionFile));}});
  assert.deepEqual(requested,selected.map(q=>q[mode==='answers'?'answerFile':mode==='working'?'workingQuestionFile':'questionFile']));const d=await lib.PDFDocument.load(bytes);for(const p of d.getPages())assert.deepEqual(p.getSize(),{width:595.28,height:841.89});
  if(mode==='compact'){compact=d.getPageCount();assert(compact<selected.length);}if(mode==='working')assert(d.getPageCount()>compact);
 }
});
