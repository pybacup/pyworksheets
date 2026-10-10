const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js'),P=require('../assets/exams/practice.js'),C=require('../assets/exams/core.js');
const plan=require('../tools/exams/gcse-answer-plan.json'),all=require('../exams/data/exam-index.json'),root=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('all 997 official GCSE answers have unique identities, correct source provenance and readable continuation pages',async()=>{
 const gcse=all.filter(q=>q.qualification==='GCSE Maths'&&q.tier==='Higher');assert.equal(gcse.length,997);assert.equal(plan.length,45);const byId=new Map(gcse.map(q=>[q.id,q])),paths=new Set(),ids=new Set();let pages=0;
 for(const p of plan){assert.equal(sha(fs.readFileSync(path.join(root,p.sourceFile))),p.sourceSHA256);assert.equal(p.questions.reduce((n,q)=>n+q.marks,0),80);
  for(const item of p.questions){const q=byId.get(item.id);assert(q);assert(!ids.has(q.id));ids.add(q.id);assert.equal(q.examBoard,'Pearson Edexcel');assert.equal(q.paper,'P'+p.paper);assert.equal(q.paperCode,'1MA1/'+p.paper+'H');assert.equal(q.examYear,p.year);assert.equal(q.series,p.series);assert.equal(+q.question,item.question);assert.equal(q.marks,item.marks);assert.equal(q.answerFile,`exams/answers/gcse/higher/p${p.paper}/${q.id}.pdf`);assert(!paths.has(q.answerFile));paths.add(q.answerFile);
   const bytes=fs.readFileSync(path.join(root,q.answerFile));assert.equal(sha(bytes),item.answerSHA256);const d=await lib.PDFDocument.load(bytes);assert.equal(d.getPageCount(),item.segments.length);pages+=d.getPageCount();
   item.segments.forEach((s,i)=>{assert(p.standardTablePages.includes(s.sourcePage));const size=d.getPage(i).getSize();assert(Math.abs(size.width-(s.right-s.left))<.001);assert(Math.abs(size.height-(s.bottom-s.top+s.headerBottom-s.headerTop+2))<.001);});
   if(item.rawMarkTotal!==q.marks)assert(item.markReview,'Alternative/malformed mark code needs documented review: '+q.id);
  }
 }
 assert.equal(ids.size,997);assert.equal(pages,1015);assert.equal(C.validateIndex(structuredClone(all)).length,1069);assert(all.filter(q=>q.qualification!=='GCSE Maths').every(q=>!q.answerFile));
});
test('mixed years and papers export both booklets in identical basket order with all answer continuations',async()=>{
 const keys=['1h-2017-june-q3','2h-2019-june-q20','3h-2022-november-q26','1h-2024-june-q14','3h-2025-june-q23'];const selected=keys.map(k=>all.find(q=>q.id==='edexcel-1ma1-'+k));const sequences=[];
 for(const answers of [false,true]){const loads=[],headers=[],draws=[],adapter={...lib,PDFDocument:{load:lib.PDFDocument.load.bind(lib.PDFDocument),create:async()=>{const d=await lib.PDFDocument.create(),add=d.addPage.bind(d);d.addPage=(...a)=>{const p=add(...a),draw=p.drawText.bind(p),embed=p.drawPage.bind(p);p.drawText=(text,o)=>{headers.push(text);return draw(text,o);};p.drawPage=(e,o)=>{draws.push(o);return embed(e,o);};return p;};return d;}}};
 const bytes=await (answers?P.buildAnswers:P.build)(selected,{lib:adapter,title:'Mixed Higher Practice',load:async q=>{loads.push(q.id);return fs.readFileSync(path.join(root,q.questionFile));}});sequences.push(loads);assert.deepEqual(loads,selected.map(q=>q.id));const d=await lib.PDFDocument.load(bytes);for(const p of d.getPages())assert.deepEqual(p.getSize(),{width:595.28,height:841.89});assert(draws.every(o=>o.x>=32&&o.y>=31.99));
 for(const q of selected)assert(headers.some(h=>h.includes(`${q.series} ${q.examYear} · Question ${q.question} · ${q.marks} marks`)));
 if(answers)assert.equal(draws.length,selected.reduce((n,q)=>n+plan.flatMap(p=>p.questions).find(e=>e.id===q.id).segments.length,0));
 }
 assert.deepEqual(sequences[0],sequences[1]);
});
