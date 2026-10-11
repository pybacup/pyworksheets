const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'..'),all=require('../exams/data/exam-index.json'),pilot=all.filter(q=>q.paperCode==='H630/01'&&q.examYear===2025);
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'}),out=fs.mkdtempSync(path.join(os.tmpdir(),'alevel-y1-pilot-'));
try{
 const p=await browser.newPage({viewport:{width:1024,height:900},hasTouch:true}),errors=[],requested=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{const relative=new URL(r.request().url()).pathname.slice(1),file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404});if(relative.endsWith('.pdf'))requested.push(relative);return r.fulfill({body:fs.readFileSync(file),contentType:({'.js':'application/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'text/html'});});
 await p.goto('http://alevel.test/pyexams.html');await p.selectOption('#qualification','GCSE Maths');await p.selectOption('#tier','Higher');assert.equal(await p.locator('.question-row').count(),997);
 const higher=all.find(q=>q.tier==='Higher');await p.locator('.question-row').filter({has:p.locator(`a[href="${higher.questionFile}"]`)}).locator('input').check();
 await p.selectOption('#qualification','A-Level Maths');await p.selectOption('#yearGroup','Year 1');await p.selectOption('#component','Pure Mathematics and Mechanics');await p.selectOption('#examYear','2025');
 await p.selectOption('#topic','Mechanics');assert.equal(await p.locator('.question-row').count(),4);assert.equal(await p.locator('#selectVisible').textContent(),'Select All (4)');await p.locator('#selectVisible').tap();await p.locator('#selectVisible').tap();assert.equal(await p.locator('#selectedList li').count(),5);
 await p.selectOption('#topic','Pure');assert.equal(await p.locator('.question-row').count(),9);await p.selectOption('#subtopic','Differentiation');assert.equal(await p.locator('.question-row').count(),2);assert.equal(await p.locator('#selectVisible').textContent(),'Select All (2)');await p.locator('#selectVisible').tap();assert.equal(await p.locator('#selectedList li').count(),7);
 await p.selectOption('#subtopic','');await p.locator('#clearSelection').tap();
 const samples=[1,2,12,5,13].map(n=>pilot.find(q=>+q.question===n));
 for(const topic of ['Pure','Mechanics']){await p.selectOption('#topic',topic);for(const q of pilot.filter(q=>q.topic===topic)){
  const row=p.locator('.question-row').filter({has:p.locator(`a[href="${q.questionFile}"]`)});if(samples.includes(q))await row.locator('input').check();
  const popup=p.waitForEvent('popup');await row.locator('a').click();await(await popup).close();
 }}
 for(const q of pilot)for(const key of ['questionFile','workingQuestionFile','answerFile'])assert.equal(await p.evaluate(async file=>(await fetch(file)).status,q[key]),200);
 for(const mode of ['off','compact','working']){
  await p.locator('#createPractice').click();assert.equal(await p.locator('#includeAnswers').isChecked(),false);assert.equal(await p.locator('#includeWorkingSpace').isChecked(),false);assert(await p.locator('#includeWorkingSpace').isEnabled());
  if(mode!=='off')await p.locator('#includeAnswers').tap();if(mode==='working')await p.locator('#includeWorkingSpace').tap();await p.locator('#paperTitle').fill('Year 1 Maths Pilot Practice');
  for(const width of [1440,1024,390]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  requested.length=0;let pending=p.waitForEvent('download');await p.locator('#buildPDF').click();const download=await pending,file=path.join(out,mode+'.pdf');await download.saveAs(file);const doc=await lib.PDFDocument.load(fs.readFileSync(file));for(const page of doc.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
  const expected=samples.map(q=>mode==='working'?q.workingQuestionFile:q.questionFile);
  if(mode!=='off'){pending=p.waitForEvent('download');await p.getByRole('link',{name:'Download answers / mark scheme',exact:true}).click();const answers=await pending;assert.equal(answers.suggestedFilename(),'PY-Maths-Year-1-Maths-Pilot-Practice-Answers.pdf');await answers.saveAs(path.join(out,mode+'-answers.pdf'));const a=await lib.PDFDocument.load(fs.readFileSync(path.join(out,mode+'-answers.pdf')));for(const page of a.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});expected.push(...samples.map(q=>q.answerFile));}
  assert.deepEqual(requested,expected);
 }
 assert.deepEqual(errors,[]);console.log('PASS: combined component, Pure/Mechanics/secondary filters, Select All preservation, all 39 paths, all 13 previews, default-OFF options, touch layouts and ordered compact/working/official answers exports.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
