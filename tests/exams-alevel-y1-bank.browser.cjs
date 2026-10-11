const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'..'),all=require('../exams/data/exam-index.json'),C=require('../assets/exams/core.js'),samples=require('../tools/exams/create-alevel-y1-review-sample.cjs');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'}),out=fs.mkdtempSync(path.join(os.tmpdir(),'alevel-y1-bank-'));
try{
 const p=await browser.newPage({viewport:{width:1024,height:900},hasTouch:true}),errors=[],requested=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{const relative=new URL(r.request().url()).pathname.slice(1),file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404});if(relative.endsWith('.pdf'))requested.push(relative);return r.fulfill({body:fs.readFileSync(file),contentType:({'.js':'application/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'text/html'});});
 await p.goto('http://alevel.test/pyexams.html');await p.selectOption('#qualification','GCSE Maths');for(const [tier,count] of [['Higher',997],['Foundation',1260]]){await p.selectOption('#tier',tier);assert.equal(await p.locator('.question-row').count(),count);}
 await p.selectOption('#qualification','A-Level Maths');await p.selectOption('#yearGroup','Year 1');
 for(const component of ['Pure Mathematics and Mechanics','Pure Mathematics and Statistics']){
  await p.selectOption('#component',component);for(const topic of component.endsWith('Mechanics')?['Pure','Mechanics']:['Pure','Statistics']){
   await p.selectOption('#topic',topic);const expected=C.filter(all,{qualification:'A-Level Maths',yearGroup:'Year 1',component,topic});assert.equal(await p.locator('.question-row').count(),expected.length);
   await p.selectOption('#examYear','2024');const scoped=expected.filter(q=>q.examYear===2024);assert.equal(await p.locator('#selectVisible').textContent(),'Select All ('+scoped.length+')');
   await p.locator('#selectVisible').tap();await p.locator('#selectVisible').tap();assert.equal(await p.locator('#selectedList li').count(),scoped.length);await p.locator('#clearSelection').tap();await p.selectOption('#examYear','');
  }
 }
 for(const q of samples){await p.selectOption('#component',q.component);await p.selectOption('#topic',q.topic);await p.selectOption('#examYear',String(q.examYear));
  const row=p.locator('.question-row').filter({has:p.locator(`a[href="${q.questionFile}"]`)});await row.locator('input').check();const popup=p.waitForEvent('popup');await row.locator('a').click();await(await popup).close();
 }
 assert.equal(await p.locator('#selectedList li').count(),samples.length);
 const paths=all.filter(q=>q.qualification==='A-Level Maths'&&q.yearGroup==='Year 1').flatMap(q=>[q.questionFile,q.workingQuestionFile,q.answerFile]);
 const statuses=await p.evaluate(async paths=>{const results=[];for(let i=0;i<paths.length;i+=12)results.push(...await Promise.all(paths.slice(i,i+12).map(async f=>({file:f,status:(await fetch(f)).status}))));return results;},paths);assert(statuses.every(s=>s.status===200));assert.equal(statuses.length,591);
 for(const mode of ['off','compact','working']){
  await p.locator('#createPractice').click();assert.equal(await p.locator('#includeAnswers').isChecked(),false);assert.equal(await p.locator('#includeWorkingSpace').isChecked(),false);assert(await p.locator('#includeWorkingSpace').isEnabled());
  if(mode!=='off')await p.locator('#includeAnswers').tap();if(mode==='working')await p.locator('#includeWorkingSpace').tap();await p.locator('#paperTitle').fill('Year 1 Mixed Practice');
  for(const width of [1440,1024,390]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  requested.length=0;let pending=p.waitForEvent('download');await p.locator('#buildPDF').click();const download=await pending,file=path.join(out,mode+'.pdf');await download.saveAs(file);const doc=await lib.PDFDocument.load(fs.readFileSync(file));for(const page of doc.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
  const expected=samples.map(q=>mode==='working'?q.workingQuestionFile:q.questionFile);
  if(mode!=='off'){pending=p.waitForEvent('download');await p.getByRole('link',{name:'Download answers / mark scheme',exact:true}).click();const answers=await pending;await answers.saveAs(path.join(out,mode+'-answers.pdf'));const a=await lib.PDFDocument.load(fs.readFileSync(path.join(out,mode+'-answers.pdf')));for(const page of a.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});expected.push(...samples.map(q=>q.answerFile));}
  assert.deepEqual(requested,expected);
 }
 assert.deepEqual(errors,[]);console.log('PASS: both combined components; Pure/Mechanics/Statistics/year filters; unique filtered Select All; preserved basket; six previews; 591 HTTP paths; default-OFF options; touch/mobile layouts; ordered A4 compact/working/official answers exports.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
