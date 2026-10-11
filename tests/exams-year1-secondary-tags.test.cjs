const test=require('node:test'),assert=require('node:assert/strict'),cp=require('node:child_process'),C=require('../assets/exams/core.js'),all=require('../exams/data/exam-index.json');
const groups={'Large data set':[[2019,2,6]],Probability:[[2021,2,6],[2022,2,1],[2023,2,9]],Trigonometry:[[2020,2,8],[2022,1,5],[2023,1,4],[2024,2,14],[2025,1,6],[2025,2,3]],'Coordinate geometry':[[2025,1,3],[2025,1,7],[2025,2,11]]};
function record(year,paper,number){const found=all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup==='Year 1'&&q.examYear===year&&q.paperCode===`H630/0${paper}`&&String(q.question)===String(number));assert.equal(found.length,1);return found[0];}
test('all thirteen approved records retain precise primary labels and include the approved secondary tag',()=>{for(const [tag,keys] of Object.entries(groups))for(const key of keys){const q=record(...key);assert(q.subtopics.includes(tag));assert.notEqual(q.subtopic,tag);assert(q.subtopics.includes(q.subtopic));}C.validateIndex(all);});
test('Year 1 combined filters return the four approved counts',()=>{for(const [subtopic,count] of Object.entries({'Coordinate geometry':15,Trigonometry:21,Probability:10,'Large data set':9})){const topic=['Probability','Large data set'].includes(subtopic)?'Statistics':'Pure';assert.equal(C.filter(all,{qualification:'A-Level Maths',yearGroup:'Year 1',component:topic==='Pure'?'Core':'Statistics',topic,subtopic}).length,count);}});
test('pending metadata changes only append the approved secondary tags',()=>{
 const before=JSON.parse(cp.execFileSync('git',['show','HEAD:exams/data/exam-index.json'],{encoding:'utf8',maxBuffer:10*1024*1024}));assert.equal(all.length,before.length);
 const approved=new Map(Object.entries(groups).flatMap(([tag,keys])=>keys.map(key=>[record(...key).id,tag])));let changed=0;
 for(let i=0;i<all.length;i++){const a=before[i],b=all[i];if(JSON.stringify(a)!==JSON.stringify(b)){assert(approved.has(a.id));assert.deepEqual(b,{...a,subtopics:[...a.subtopics,approved.get(a.id)]});changed++;}}
 // Once committed the same metadata remains valid without a pending diff.
 assert([0,13].includes(changed));console.log(`Verified ${changed} pending secondary-subtopic array changes.`);
});
