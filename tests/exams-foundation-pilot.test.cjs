const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const all=require('../exams/data/exam-index.json'),plan=require('../tools/exams/foundation-june-2024-p1-plan.json'),C=require('../assets/exams/core.js'),P=require('../assets/exams/practice.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),pilot=all.filter(q=>q.id.startsWith('edexcel-1ma1-1f-2024-june-q'));
test('Foundation pilot preserves all 1069 previous records exactly and retains the approved 28 questions / 80 marks',()=>{
 const old=all.filter(q=>q.tier!=='Foundation');assert.equal(old.length,1069);assert.equal(sha(JSON.stringify(old)),'287354565d7900eaea25405e718b5f5f3d452857fb48433828220f236b9351e2');
 assert.equal(pilot.length,28);assert.equal(pilot.reduce((n,q)=>n+q.marks,0),80);assert.deepEqual(pilot.map(q=>+q.question),Array.from({length:28},(_,i)=>i+1));
 assert.equal(C.validateIndex(structuredClone(all)).length,2329);assert.equal(new Set(all.map(q=>q.id)).size,2329);
 for(const key of ['questionFile','workingQuestionFile','answerFile']){const values=all.map(q=>q[key]).filter(Boolean);assert.equal(new Set(values).size,values.length);}
 assert.equal(sha(fs.readFileSync(path.join(root,plan.sourceFile))),plan.sourceSHA256);assert.equal(sha(fs.readFileSync(path.join(root,plan.markSchemeFile))),plan.markSchemeSHA256);
});
test('every Foundation variant is readable, has reviewed geometry and matches the audited source plan',async()=>{
 for(const q of pilot){const item=plan.questions.find(p=>p.record.id===q.id);assert.deepEqual(q,item.record);assert.equal(q.paperCode,'1MA1/1F');assert.equal(q.examYear,2024);assert.equal(q.series,'June');assert.equal(q.paper,'P1');assert.equal(q.examBoard,'Pearson Edexcel');
  for(const [mode,key] of [['compact','questionFile'],['working','workingQuestionFile'],['answers','answerFile']]){const bytes=fs.readFileSync(path.join(root,q[key]));assert.equal(sha(bytes),item[mode+'SHA256']);const d=await lib.PDFDocument.load(bytes);assert.equal(d.getPageCount(),mode==='compact'?1:item[mode].length);
   if(mode==='compact'){assert.equal(d.getPage(0).getWidth(),517);assert(Math.abs(d.getPage(0).getHeight()-(item.compact.reduce((n,s)=>n+s.bottom-s.top,0)+6*(item.compact.length-1)))<.001);}
   else item[mode].forEach((s,i)=>{const size=d.getPage(i).getSize();assert(Math.abs(size.width-(s.right-s.left))<.001);assert(Math.abs(size.height-(s.bottom-s.top+(mode==='answers'?s.headerBottom-s.headerTop+2:0)))<.001);});
  }
 }
 const continuation=plan.questions[21];assert.deepEqual(continuation.record.sourcePages,[16,17]);assert.equal(continuation.working.length,2);assert(continuation.compact.some(p=>p.page===17));
 // Required chart grid remains a single uninterrupted 627pt content band.
 assert(plan.questions[6].compact.some(p=>p.top===88&&p.bottom===715));
});
test('Foundation uses shared taxonomy and combined filters; Select All preserves Higher selections',()=>{
 const topics=['Number','Algebra','Ratio, Proportion and Rates of Change','Geometry and Measures','Probability','Statistics'];
 for(const q of pilot){assert(topics.includes(q.topic));assert.equal(q.subtopics[0],q.subtopic);assert.equal(new Set(q.subtopics).size,q.subtopics.length);}
 // Shared questions must carry the exact audited Higher primary topic and subtopic.
 for(const [f,h] of [[20,1],[21,2],[22,3],[23,4],[24,5],[25,6],[26,7]]){const fq=pilot.find(q=>+q.question===f),hq=all.find(q=>q.id==='edexcel-1ma1-1h-2024-june-q'+h);assert.equal(fq.topic,hq.topic);assert.equal(fq.subtopic,hq.subtopic);}
 for(const tier of ['', 'Higher','Foundation'])assert.equal(C.filter(all,{qualification:'GCSE Maths',tier}).length,tier==='Higher'?997:tier==='Foundation'?1260:2257);
 const filter={qualification:'GCSE Maths',tier:'Foundation',paper:'P1',examYear:2024,series:'June',topic:'Algebra',minMarks:2,maxMarks:3},visible=C.filter(all,filter);assert.deepEqual(visible.map(q=>+q.question),[17,20,28]);
 const b=new P.Basket(),higher=all.find(q=>q.tier==='Higher');b.add(higher);visible.forEach(q=>b.add(q));visible.forEach(q=>b.add(q));assert.equal(b.items.length,4);assert(b.has(higher.id));
 assert.equal(C.filter(all,{qualification:'GCSE Maths',tier:'Foundation',paper:'P2'}).length,415);
});
test('Foundation exports all three variants on A4 in basket order with correct source headings',async()=>{
 const selected=[14,17,12,22,7].map(n=>pilot.find(q=>+q.question===n));let compactPages;
 for(const mode of ['compact','working','answers']){const loaded=[],headers=[],adapter={...lib,PDFDocument:{load:lib.PDFDocument.load.bind(lib.PDFDocument),create:async()=>{const d=await lib.PDFDocument.create(),add=d.addPage.bind(d);d.addPage=(...a)=>{const p=add(...a),draw=p.drawText.bind(p);p.drawText=(t,o)=>{headers.push(t);return draw(t,o);};return p;};return d;}}};
  const bytes=await(mode==='answers'?P.buildAnswers:P.build)(selected,{lib:adapter,title:'Foundation Pilot Practice',includeWorkingSpace:mode==='working',load:q=>{loaded.push(q.questionFile);return fs.readFileSync(path.join(root,q.questionFile));}});
  assert.deepEqual(loaded,selected.map(q=>q[mode==='answers'?'answerFile':mode==='working'?'workingQuestionFile':'questionFile']));const d=await lib.PDFDocument.load(bytes);for(const p of d.getPages())assert.deepEqual(p.getSize(),{width:595.28,height:841.89});
  assert(headers.some(h=>h.includes('GCSE Maths Foundation')&&h.includes('1MA1/1F')));for(const q of selected)assert(headers.some(h=>h.includes('June 2024 · Question '+q.question+' · '+q.marks+' marks')));
  if(mode==='compact'){compactPages=d.getPageCount();assert(compactPages<selected.length);}if(mode==='working')assert(d.getPageCount()>compactPages);if(mode==='answers')assert(d.getPageCount()<selected.length);
 }
});
