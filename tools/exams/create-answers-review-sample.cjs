// Review sample intentionally mixes paper, year, series and question order.
const fs=require('node:fs'),path=require('node:path'),P=require('../../assets/exams/practice.js'),lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'../..'),all=require('../../exams/data/exam-index.json');
const ids=['1h-2017-june-q3','1h-2024-june-q14','2h-2018-november-q13','2h-2019-june-q20','3h-2020-november-q5','3h-2021-november-q23','3h-2022-november-q26','3h-2023-june-q21','1h-2024-june-q13','3h-2025-june-q23','2h-2017-june-q2','1h-2018-june-q1'];
(async()=>{const out=path.resolve(process.argv[2]||'output/pdf');fs.mkdirSync(out,{recursive:true});const selected=ids.map(id=>{const q=all.find(q=>q.id==='edexcel-1ma1-'+id);if(!q)throw Error(id);return q;}),title='GCSE Higher Mixed Practice';
 for(const answers of [false,true]){const bytes=await (answers?P.buildAnswers:P.build)(selected,{title,lib,load:q=>fs.readFileSync(path.join(root,q.questionFile))}),file=path.join(out,answers?P.answerFilename(title):P.filename(title));fs.writeFileSync(file,bytes);console.log(file+' : '+(await lib.PDFDocument.load(bytes)).getPageCount()+' A4 pages');}
 fs.writeFileSync(path.join(out,'mixed-sample-selection.json'),JSON.stringify(selected.map(q=>({id:q.id,question:q.question,marks:q.marks,topic:q.topic,subtopic:q.subtopic,questionFile:q.questionFile,answerFile:q.answerFile})),null,2));
 console.log(selected.length+' questions; '+selected.reduce((n,q)=>n+q.marks,0)+' marks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
