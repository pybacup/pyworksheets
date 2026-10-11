const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const P=require('../../assets/exams/practice.js'),lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),all=require('../../exams/data/exam-index.json');
(async()=>{const out=path.resolve(process.argv[2]||'output/pdf');fs.mkdirSync(out,{recursive:true});const selected=[14,17,12,22,7].map(n=>all.find(q=>q.id==='edexcel-1ma1-1f-2024-june-q'+n));assert(selected.every(Boolean));
 for(const mode of ['Compact','Working-Space','Answers']){
  const bytes=await(mode==='Answers'?P.buildAnswers:P.build)(selected,{title:'Foundation Pilot Practice',lib,includeWorkingSpace:mode==='Working-Space',load:q=>fs.readFileSync(path.resolve(__dirname,'../..',q.questionFile))});
  const file=path.join(out,'PY-Maths-Foundation-Pilot-'+mode+'.pdf');fs.writeFileSync(file,bytes);console.log(mode+': '+(await lib.PDFDocument.load(bytes)).getPageCount()+' A4 pages');
 }
 console.log('Selection: Q14, Q17, Q12, Q22, Q7; '+selected.reduce((n,q)=>n+q.marks,0)+' marks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
