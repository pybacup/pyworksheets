const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const P=require('../../assets/exams/practice.js'),lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),all=require('../../exams/data/exam-index.json');
const sample=['1f-2017-june-q8','2f-2018-june-q26','2f-2019-november-q9','3f-2020-november-q17','2f-2022-november-q24','3f-2023-november-q29','1f-2024-june-q22','2f-2025-june-q19','3f-2025-june-q30'];
module.exports=sample;
if(require.main===module)(async()=>{
 const out=path.resolve(process.argv[2]||'output/pdf');fs.mkdirSync(out,{recursive:true});
 const selected=sample.map(s=>all.find(q=>q.id==='edexcel-1ma1-'+s));assert(selected.every(Boolean));
 for(const mode of ['Compact','Working-Space','Answers']){
  const bytes=await(mode==='Answers'?P.buildAnswers:P.build)(selected,{title:'Foundation Mixed Practice',lib,includeWorkingSpace:mode==='Working-Space',load:q=>fs.readFileSync(path.resolve(__dirname,'../..',q.questionFile))});
  const file=path.join(out,'PY-Maths-Foundation-Mixed-'+mode+'.pdf');fs.writeFileSync(file,bytes);
  console.log(mode+': '+(await lib.PDFDocument.load(bytes)).getPageCount()+' A4 pages');
 }
 fs.writeFileSync(path.join(out,'selection.json'),JSON.stringify(selected,null,2));
 console.log(selected.length+' questions; '+selected.reduce((n,q)=>n+q.marks,0)+' marks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
