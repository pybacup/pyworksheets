const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const P=require('../assets/exams/practice.js'),C=require('../assets/exams/core.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'..'),all=JSON.parse(fs.readFileSync(path.join(root,'exams/data/exam-index.json')));
const plan=require('../tools/exams/gcse-working-space-plan.json');
test('every GCSE working variant exists and retains every original question page at its original crop dimensions',async()=>{
 const byId=new Map(all.map(q=>[q.id,q]));assert.equal(plan.questions.length,997);
 let pages=0;const files=new Set();
 for(const item of plan.questions){const q=byId.get(item.id);assert(C.safePath(q.workingQuestionFile,'exams/questions/'));assert.notEqual(q.questionFile,q.workingQuestionFile);assert(!files.has(q.workingQuestionFile));files.add(q.workingQuestionFile);
  assert.deepEqual(item.parts.map(p=>p.page),q.sourcePages);
  const pdf=await lib.PDFDocument.load(fs.readFileSync(path.join(root,q.workingQuestionFile)));assert.equal(pdf.getPageCount(),item.parts.length,q.id);
  pdf.getPages().forEach((p,i)=>{assert(Math.abs(p.getWidth()-(item.parts[i].right-item.parts[i].left))<.001);assert(Math.abs(p.getHeight()-(item.parts[i].bottom-item.parts[i].top))<.001);pages++;});
 }
 assert.equal(pages,1046);assert(all.filter(q=>q.qualification!=='GCSE Maths').every(q=>q.workingQuestionFile===undefined));
});
test('working mode selects separate variants without mutating the basket; other courses retain existing PDFs',async()=>{
 const q=all.find(q=>q.id==='edexcel-1ma1-1h-2024-june-q10'),original=JSON.stringify(q),other=all.find(q=>q.qualification!=='GCSE Maths');
 assert.equal(P.fileFor(q),q.questionFile);assert.equal(P.fileFor(q,true),q.workingQuestionFile);assert.equal(P.fileFor(other,true),other.questionFile);
 const requested=[];await P.build([q,other],{lib,includeWorkingSpace:true,load:e=>{requested.push(e.questionFile);return fs.readFileSync(path.join(root,e.questionFile));}});
 assert.deepEqual(requested,[q.workingQuestionFile,other.questionFile]);assert.equal(JSON.stringify(q),original);
 const missing={...q};delete missing.workingQuestionFile;assert.throws(()=>P.fileFor(missing,true),/not available/);
 await assert.rejects(()=>P.build([q],{lib,includeWorkingSpace:true,load:()=>{throw Error('HTTP 404');}}),/Question 10: HTTP 404/);
 for(const bad of ['../secret.pdf','https://example.com/q.pdf',q.questionFile])assert.throws(()=>C.validateIndex([{...q,workingQuestionFile:bad}]),/working-space PDF/);
});
test('compact remains the default and packs short questions; working mode preserves large areas and continuation pages on A4',async()=>{
 const ids=['1h-2024-june-q10','1h-2024-june-q14','1h-2024-june-q3'];const qs=ids.map(id=>all.find(q=>q.id==='edexcel-1ma1-'+id));
 const load=q=>fs.readFileSync(path.join(root,q.questionFile));
 const compact=await lib.PDFDocument.load(await P.build(qs.slice(0,2),{lib,load}));assert.equal(compact.getPageCount(),1);
 const placements=[],labels=[];const adapter={...lib,PDFDocument:{load:lib.PDFDocument.load.bind(lib.PDFDocument),create:async()=>{const d=await lib.PDFDocument.create(),add=d.addPage.bind(d);d.addPage=(...args)=>{const p=add(...args),draw=p.drawPage.bind(p),text=p.drawText.bind(p);p.drawPage=(e,o)=>{placements.push(o);return draw(e,o);};p.drawText=(s,o)=>{labels.push(s);return text(s,o);};return p;};return d;}}};
 const working=await lib.PDFDocument.load(await P.build(qs,{lib:adapter,load,includeWorkingSpace:true}));assert.equal(placements.length,4);
 for(const p of working.getPages())assert.deepEqual(p.getSize(),{width:595.28,height:841.89});
 assert(placements.every(p=>p.width/536>.90));assert(labels.some(s=>s.includes('Page 1 of 2')));assert(labels.some(s=>s.includes('Page 2 of 2')));
 assert(labels.some(s=>s.includes('Question 3')));assert(labels.some(s=>s.includes('Pearson Edexcel')));
});
