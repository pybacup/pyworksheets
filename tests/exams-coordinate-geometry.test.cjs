const test=require('node:test'),assert=require('node:assert/strict'),cp=require('node:child_process'),C=require('../assets/exams/core.js'),all=require('../exams/data/exam-index.json');
const wanted=[[2018,2,8],[2019,1,4],[2020,1,8],[2020,2,7],[2021,1,1],[2021,2,10],[2022,1,10],[2022,2,7],[2023,1,8],[2023,2,5],[2024,1,8],[2024,2,6]];
test('all twelve specified Year 1 questions appear in the Core/Pure/Coordinate geometry filter',()=>{
 const matches=C.filter(all,{qualification:'A-Level Maths',yearGroup:'Year 1',component:'Core',topic:'Pure',subtopic:'Coordinate geometry'});
 for(const [year,paper,number] of wanted){const found=matches.filter(q=>q.examYear===year&&q.paperCode===`H630/0${paper}`&&String(q.question)===String(number));assert.equal(found.length,1);}
 assert.equal(matches.length,12);C.validateIndex(all);
});
test('only nine secondary-tag arrays changed; every primary label and other record/field is preserved',()=>{
 const before=JSON.parse(cp.execFileSync('git',['show','HEAD:exams/data/exam-index.json'],{maxBuffer:10*1024*1024,encoding:'utf8'}));assert.equal(all.length,before.length);let changed=0;
 for(let i=0;i<all.length;i++){const a=before[i],b=all[i];if(JSON.stringify(a)!==JSON.stringify(b)){assert.deepEqual(b,{...a,subtopics:[...a.subtopics,'Coordinate geometry']});assert(wanted.some(([year,paper,number])=>a.qualification==='A-Level Maths'&&a.yearGroup==='Year 1'&&a.examYear===year&&a.paperCode===`H630/0${paper}`&&String(a.question)===String(number)));changed++;}}
 assert.equal(changed,9);
});
