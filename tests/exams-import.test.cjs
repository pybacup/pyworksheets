const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../assets/exams/core.js'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'..');
test('imported Year 1 batch has unique records and readable source/question PDFs',async()=>{
 const entries=C.validateIndex(JSON.parse(fs.readFileSync(path.join(root,'exams/data/exam-index.json'),'utf8')));
 const batch=entries.filter(e=>e.id.match(/^ocr-y410-01-20(18|19|20|21|22|23)-q\d+$/)&&e.yearGroup==='Year 1');
 assert.equal(batch.length,55);
 for(const e of batch){assert.equal(e.qualification,'A-Level Further Maths');assert.equal(e.component,'Pure');assert.equal(e.examBoard,'OCR');assert.equal(e.paperCode,'Y410/01');assert.ok(e.subtopics.length);}
 for(const file of new Set(batch.flatMap(e=>[e.sourceFile,e.questionFile]))){const pdf=await lib.PDFDocument.load(fs.readFileSync(path.join(root,file)));assert.ok(pdf.getPageCount()>0,file);}
});
test('topic tags are data-driven and secondary topics find the same question',()=>{
 const q={topic:'Complex Numbers',topics:['Complex Numbers','Roots of Polynomials'],subtopics:[]};
 assert.deepEqual(C.topics(q),['Complex Numbers','Roots of Polynomials']);
 assert.deepEqual(C.filter([q],{topic:'Roots of Polynomials'}),[q]);
 assert.deepEqual(C.filter([q],{topic:'Matrices'}),[]);
 assert.deepEqual(C.topics({topic:'Matrices'}),['Matrices']);
});
