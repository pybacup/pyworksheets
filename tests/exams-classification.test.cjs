const fs = require('node:fs');
const crypto = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/exams/core.js');
const all = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, '../exams/data/exam-index.json')));
const gcse = all.filter(q => q.qualification === 'GCSE Maths');

test('classification audit preserves every protected field and all non-GCSE records', () => {
  const protectedRecords = all.map(q => q.qualification === 'GCSE Maths'
    ? Object.fromEntries(Object.entries(q).filter(([k]) => !['topic', 'topics', 'subtopic', 'subtopics', 'workingQuestionFile'].includes(k)))
    : q);
  // Recorded from the pre-audit 1,069-record index, including its ordering.
  // The subsequently added workingQuestionFile is separately validated by working-space tests.
  const hash = crypto.createHash('sha256').update(JSON.stringify(protectedRecords)).digest('hex');
  assert.equal(hash, '80bc2f74f9cc1042670fa9c37d438e3c460e0d4937dad5f2c316b805fb42b17f');
});

test('reviewed mathematical distinctions remain findable under precise subtopics', () => {
  const cases = {
    '1h-2024-june-q14': 'Expanding three brackets',
    '1h-2024-june-q10': 'Linear simultaneous equations',
    '1h-2017-november-q11': 'Forming and solving linear simultaneous equations',
    '3h-2025-june-q21': 'Simultaneous equations with a quadratic',
    '2h-2018-november-q19': 'Quadratic inequalities',
    '1h-2022-june-q18': 'Negative indices',
    '2h-2024-november-q11': 'Enlargements',
    '2h-2022-june-q2': 'Translations',
    '3h-2023-june-q21': 'Quadratic equations by factorising',
    '3h-2025-june-q17': 'Algebraic fractions',
    '1h-2024-june-q13': 'Histograms',
    '3h-2019-june-q23': 'Bearings with trigonometry'
  };
  for (const [short, subtopic] of Object.entries(cases)) {
    const id = 'edexcel-1ma1-' + short;
    assert.equal(gcse.find(q => q.id === id).subtopic, subtopic, id);
    assert(C.filter(gcse, { subtopic }).some(q => q.id === id), id);
  }
  // A single mixed-skill question must be discoverable by either assessed skill.
  const mixed = gcse.find(q => q.id === 'edexcel-1ma1-3h-2018-november-q9');
  for (const subtopic of ['Expanding three brackets', 'Quadratic formula']) {
    assert.equal(C.filter([mixed], { subtopic }).length, 1);
  }
});

test('all classifications use the six topic groups and consistent unique primary/secondary labels', () => {
  const topics = new Set(['Number', 'Algebra', 'Ratio, Proportion and Rates of Change', 'Geometry and Measures', 'Probability', 'Statistics']);
  const obsolete = new Set(['Trigonometry', 'Simultaneous equations', 'Simultaneous linear equations', 'Expanding and simplifying expressions']);
  assert.equal(gcse.length, 997);
  for (const q of gcse) {
    assert(topics.has(q.topic), q.id);
    assert(q.topics.every(t => topics.has(t)), q.id);
    assert.equal(q.subtopics[0], q.subtopic, q.id);
    assert.equal(new Set(q.subtopics).size, q.subtopics.length, q.id);
    assert.equal(new Set(q.topics).size, q.topics.length, q.id);
    assert(q.subtopics.every(s => s === s.trim() && !obsolete.has(s)), q.id);
  }
});
