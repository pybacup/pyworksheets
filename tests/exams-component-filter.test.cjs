const test=require('node:test'),assert=require('node:assert/strict'),C=require('../assets/exams/core.js'),all=require('../exams/data/exam-index.json');
test('A-Level pupil components map primary topics for both years without changing source metadata',()=>{
 const before=JSON.stringify(all);assert.deepEqual(C.filterComponents('A-Level Maths'),['Core','Statistics','Mechanics']);
 for(const yearGroup of ['Year 1','Year 2'])for(const [component,topic] of [['Core','Pure'],['Statistics','Statistics'],['Mechanics','Mechanics']]){
  const actual=C.filter(all,{qualification:'A-Level Maths',yearGroup,component});
  assert(actual.length);assert.deepEqual(actual,all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup===yearGroup&&q.topic===topic));
 }
 assert.equal(JSON.stringify(all),before);C.validateIndex(all);
});
test('legacy canonical components work; primary topic takes precedence; Further Maths is unchanged',()=>{
 const legacy=['Core','Statistics','Mechanics'].map(component=>({qualification:'A-Level Maths',component,topic:'Legacy',subtopics:[]}));
 for(const q of legacy)assert.deepEqual(C.filter(legacy,{component:q.component}),[q]);
 assert.equal(C.pupilComponent({...legacy[0],topic:'Mechanics'}),'Mechanics');
 assert.deepEqual(C.filterComponents('A-Level Further Maths'),['Pure','Numerical Methods']);
 const further={qualification:'A-Level Further Maths',component:'Pure',topic:'Matrices'};assert.deepEqual(C.filter([further],{component:'Pure'}),[further]);
});
