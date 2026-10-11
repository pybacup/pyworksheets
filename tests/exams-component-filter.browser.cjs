const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),all=require('../exams/data/exam-index.json');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve(__dirname,'..');await p.route('**/*',r=>{const file=path.resolve(root,new URL(r.request().url()).pathname.slice(1));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404});return r.fulfill({body:fs.readFileSync(file),contentType:({'.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'text/html'});});
 await p.goto('http://components.test/pyexams.html');await p.selectOption('#qualification','A-Level Maths');await p.selectOption('#yearGroup','Year 1');
 for(const yearGroup of ['Year 1','Year 2']){
  await p.selectOption('#yearGroup',yearGroup);
  assert.deepEqual(await p.locator('#component option').evaluateAll(es=>es.filter(e=>e.value).map(e=>e.value)),['Core','Statistics','Mechanics']);
  for(const [component,topic] of [['Core','Pure'],['Statistics','Statistics'],['Mechanics','Mechanics']]){
   await p.selectOption('#component',component);await p.selectOption('#topic',topic);
   const expected=all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup===yearGroup&&q.topic===topic).length;
   assert.equal(await p.locator('.question-row').count(),expected);assert.equal(await p.locator('#selectVisible').textContent(),`Select All (${expected})`);
  }
 }
 await p.selectOption('#qualification','A-Level Further Maths');assert.deepEqual(await p.locator('#component option').evaluateAll(es=>es.filter(e=>e.value).map(e=>e.value)),['Pure','Numerical Methods']);
 await p.selectOption('#qualification','GCSE Maths');assert(await p.locator('#componentLabel').isHidden());
 await p.selectOption('#qualification','A-Level Maths');assert.equal(await p.locator('#component').inputValue(),'');assert.deepEqual(await p.locator('#component option').evaluateAll(es=>es.filter(e=>e.value).map(e=>e.value)),['Core','Statistics','Mechanics']);
 await p.selectOption('#yearGroup','Year 1');await p.selectOption('#component','Core');await p.selectOption('#topic','Pure');await p.selectOption('#subtopic','Coordinate geometry');
 const coordinate=all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup==='Year 1'&&q.topic==='Pure'&&q.subtopics.includes('Coordinate geometry'));
 assert.equal(coordinate.length,12);assert.equal(await p.locator('.question-row').count(),12);assert.equal(await p.locator('#selectVisible').textContent(),'Select All (12)');
 assert.deepEqual((await p.locator('.question-row .question-preview').evaluateAll(es=>es.map(e=>e.getAttribute('href')))).sort(),coordinate.map(q=>q.questionFile).sort());
 assert.deepEqual(errors,[]);console.log('PASS: Year 1/2 Core, Statistics, Mechanics results and Select All counts; qualification/year refresh; other qualifications unchanged.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
