const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),P=require('../../assets/exams/practice.js');
const plan=require('./alevel-y1-bank-plan.json'),root=path.resolve(__dirname,'../..');
const ids=['ocr-mei-h630-01-2018-june-q11','ocr-mei-h630-01-2019-june-q6','ocr-mei-h630-02-2020-november-q2','ocr-mei-h630-01-2022-june-q12','ocr-mei-h630-02-2024-june-q3','ocr-mei-h630-02-2025-june-q16'];
const selected=ids.map(id=>plan.papers.flatMap(p=>p.questions.map(q=>q.record)).find(q=>q.id===id));assert(selected.every(Boolean));
module.exports=selected;
if(require.main===module)(async()=>{
 const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
 for(const mode of ['Compact','Working-Space','Answers']){
  const bytes=await(mode==='Answers'?P.buildAnswers:P.build)(selected,{title:'Year 1 Maths Mixed Practice',lib,includeWorkingSpace:mode==='Working-Space',load:q=>fs.readFileSync(path.join(root,q.questionFile))});
  const doc=await lib.PDFDocument.load(bytes);for(const page of doc.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
  fs.writeFileSync(path.join(out,'PY-Maths-Year-1-Mixed-'+mode+'.pdf'),bytes);console.log(mode+': '+doc.getPageCount()+' A4 pages');
 }
 fs.writeFileSync(path.join(out,'selection.json'),JSON.stringify(selected,null,2));console.log(selected.length+' questions / '+selected.reduce((s,q)=>s+q.marks,0)+' marks');
})().catch(e=>{console.error(e);process.exitCode=1;});
