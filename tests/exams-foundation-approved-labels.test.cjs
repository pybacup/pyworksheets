const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../assets/exams/core.js');
const all=require('../exams/data/exam-index.json');
const plan=require('../tools/exams/foundation-bank-plan.json');
const reviewed=[
 ['1f-2017-june-q19','Algebra','Linear equations with brackets',[['Algebra','Linear inequalities']]],
 ['1f-2018-june-q16','Algebra','Substitution',[['Algebra','Expanding a single bracket'],['Algebra','Linear equations with brackets']]],
 ['3f-2018-june-q15','Number','Order of operations',[['Statistics','Range']]],
 ['2f-2017-november-q24','Algebra','Quadratic equations using square roots',[['Algebra','Expanding two brackets'],['Algebra','Factorising quadratics']]],
 ['2f-2019-june-q13','Ratio, Proportion and Rates of Change','Ratio problem solving',[['Geometry and Measures','Properties of shapes']]]
];
test('approved Foundation primary and secondary skills remain findable through combined filters',()=>{
 C.validateIndex(structuredClone(all));
 for(const [suffix,topic,subtopic,alternatives] of reviewed){
  const id='edexcel-1ma1-'+suffix,q=all.find(q=>q.id===id);
  assert(q,id);assert.equal(q.topic,topic);assert.equal(q.subtopic,subtopic);
  assert.equal(q.subtopics[0],subtopic);assert.equal(new Set(q.subtopics).size,q.subtopics.length);
  assert.deepEqual(plan.flatMap(p=>p.questions).find(p=>p.record.id===id).record,q);
  for(const [skillTopic,skillSubtopic] of [[topic,subtopic],...alternatives]){
   assert(q.topics.includes(skillTopic));assert(q.subtopics.includes(skillSubtopic));
   const filters={qualification:'GCSE Maths',tier:'Foundation',paper:q.paper,examYear:q.examYear,series:q.series,topic:skillTopic,subtopic:skillSubtopic};
   assert.equal(C.filter(all,filters).filter(r=>r.id===id).length,1,`${id}: ${skillTopic} / ${skillSubtopic}`);
  }
 }
});
test('the seven approved one-off primary labels remain assigned to their reviewed questions',()=>{
 const labels=[['1f-2017-june-q26','Parallel and perpendicular lines'],['2f-2017-november-q14','Algebraic proof'],['2f-2017-november-q24','Quadratic equations using square roots'],['2f-2019-november-q26','Quadratic sequences'],['2f-2020-november-q24','Cubic graphs'],['2f-2022-june-q26','Depreciation'],['3f-2022-june-q6','Symmetry']];
 const foundation=all.filter(q=>q.tier==='Foundation');
 for(const [suffix,label] of labels){const matches=foundation.filter(q=>q.subtopic===label);assert.equal(matches.length,1);assert.equal(matches[0].id,'edexcel-1ma1-'+suffix);}
 assert(all.find(q=>q.id==='edexcel-1ma1-1f-2024-june-q25').subtopics.includes('Parallel and perpendicular lines'));
});
