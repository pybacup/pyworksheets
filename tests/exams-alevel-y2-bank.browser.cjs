const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js'),samples=require('../tools/exams/create-alevel-y2-mixed-sample.cjs'),C=require('../assets/exams/core.js'),all=require('../exams/data/exam-index.json');
const root=path.resolve(__dirname,'..'),year2=all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup==='Year 2');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'}),out=fs.mkdtempSync(path.join(os.tmpdir(),'alevel-y2-bank-'));try{
 const p=await browser.newPage({viewport:{width:1024,height:900},hasTouch:true}),errors=[],requested=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{const relative=new URL(r.request().url()).pathname.slice(1),file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404});if(relative.endsWith('.pdf'))requested.push(relative);return r.fulfill({body:fs.readFileSync(file),contentType:({'.js':'application/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'text/html'});});
 await p.goto('http://bank.test/pyexams.html');await p.selectOption('#qualification','A-Level Maths');await p.selectOption('#yearGroup','Year 2');
 for(const component of ['Pure Mathematics and Mechanics','Pure Mathematics and Statistics','Pure Mathematics and Comprehension']){
  await p.selectOption('#component',component);for(const topic of [...new Set(year2.filter(q=>q.component===component).map(q=>q.topic))]){await p.selectOption('#topic',topic);assert.equal(await p.locator('.question-row').count(),year2.filter(q=>q.component===component&&q.topic===topic).length);}
 }
 await p.selectOption('#component','Pure Mathematics and Statistics');await p.selectOption('#examYear','2019');await p.selectOption('#topic','Pure');const keep=samples[2];await p.locator('.question-row').filter({has:p.locator(`a[href="${keep.questionFile}"]`)}).locator('input').check();
 await p.selectOption('#component','Pure Mathematics and Comprehension');await p.selectOption('#examYear','2022');await p.selectOption('#topic','Pure');await p.selectOption('#subtopic','Comprehension');assert.equal(await p.locator('#selectVisible').textContent(),'Select All (4)');await p.locator('#selectVisible').tap();await p.locator('#selectVisible').tap();assert.equal(await p.locator('#selectedList li').count(),5);
 await p.locator('#clearSelection').tap();
 for(const q of samples){await p.selectOption('#component',q.component);await p.selectOption('#topic',q.topic);await p.selectOption('#examYear',String(q.examYear));await p.selectOption('#subtopic','');await p.locator('.question-row').filter({has:p.locator(`a[href="${q.questionFile}"]`)}).locator('input').check();}assert.equal(await p.locator('#selectedList li').count(),samples.length);
 for(const file of samples.flatMap(q=>[q.questionFile,q.workingQuestionFile,q.answerFile]).concat(C.requiredMaterials(samples).map(m=>m.file)))assert.equal(await p.evaluate(async f=>(await fetch(f)).status,file),200);
 await p.selectOption('#component',samples[0].component);await p.selectOption('#topic',samples[0].topic);await p.selectOption('#examYear',String(samples[0].examYear));const preview=p.locator('.question-row').filter({has:p.locator(`a[href="${samples[0].questionFile}"]`)}).getByRole('link',{name:/Preview/});assert.equal(await preview.getAttribute('href'),samples[0].questionFile);
 for(const working of [false,true]){
  await p.locator('#createPractice').click();assert.equal(await p.locator('#includeAnswers').isChecked(),false);assert.equal(await p.locator('#includeWorkingSpace').isChecked(),false);await p.locator('#includeAnswers').tap();if(working)await p.locator('#includeWorkingSpace').tap();
  for(const width of [1440,1024,390]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  requested.length=0;let pending=p.waitForEvent('download');await p.locator('#buildPDF').click();let download=await pending;const file=path.join(out,working?'working.pdf':'compact.pdf');await download.saveAs(file);
  for(const pg of (await lib.PDFDocument.load(fs.readFileSync(file))).getPages())assert.deepEqual(pg.getSize(),{width:595.28,height:841.89});
  pending=p.waitForEvent('download');await p.getByRole('link',{name:'Download answers / mark scheme',exact:true}).click();download=await pending;await download.saveAs(path.join(out,'answers.pdf'));
  assert.deepEqual(requested,[...samples.map(q=>working?q.workingQuestionFile:q.questionFile),...C.requiredMaterials(samples).map(m=>m.file),...samples.map(q=>q.answerFile)]);
 }
 assert.deepEqual(errors,[]);console.log('PASS: 363 results; all components; combined year/topic/context filters; Select All preserves other selections without duplicates; previews and variant paths; touch layouts; compact/working/ordered answers; insert loaded once.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
