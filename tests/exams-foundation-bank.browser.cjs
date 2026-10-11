const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),lib=require('../assets/vendor/pdf-lib/pdf-lib.min.js'),C=require('../assets/exams/core.js');
const root=path.resolve(__dirname,'..'),all=require('../exams/data/exam-index.json');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'}),out=fs.mkdtempSync(path.join(os.tmpdir(),'foundation-bank-'));
try{const p=await browser.newPage({viewport:{width:1024,height:900},hasTouch:true}),errors=[],requested=[];
p.on('pageerror',e=>errors.push(e.message));
await p.route('**/*',r=>{const relative=new URL(r.request().url()).pathname.slice(1),file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404});if(relative.endsWith('.pdf'))requested.push(relative);return r.fulfill({body:fs.readFileSync(file),contentType:({'.js':'application/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'text/html'});});
await p.goto('http://foundation-bank.test/pyexams.html');await p.selectOption('#qualification','GCSE Maths');await p.selectOption('#tier','Foundation');
for(const paper of ['P1','P2','P3'])for(const series of ['June','November']){
 await p.selectOption('#paper',paper);await p.selectOption('#series',series);await p.selectOption('#examYear','2022');
 const expected=C.filter(all,{qualification:'GCSE Maths',tier:'Foundation',paper,series,examYear:2022});
 assert.equal(await p.locator('.question-row').count(),expected.length);assert.equal(await p.locator('#selectVisible').textContent(),`Select All (${expected.length})`);
 await p.locator('#selectVisible').tap();await p.locator('#selectVisible').tap();assert.equal(await p.locator('#selectedList li').count(),expected.length);await p.locator('#clearSelection').click();
}
await p.locator('#reset').click();await p.selectOption('#topic','');
const samples=require('../tools/exams/create-foundation-review-sample.cjs').map(id=>all.find(q=>q.id==='edexcel-1ma1-'+id));
for(const q of samples){const row=p.locator('.question-row').filter({has:p.locator(`a[href="${q.questionFile}"]`)});await row.locator('input').check();const popup=p.waitForEvent('popup');await row.locator('a').click();await(await popup).close();}
async function exportAndCheck(selected,working,title){
 await p.locator('#createPractice').click();assert.equal(await p.locator('#includeAnswers').isChecked(),false);assert.equal(await p.locator('#includeWorkingSpace').isChecked(),false);
 await p.locator('#includeAnswers').check();if(working)await p.locator('#includeWorkingSpace').check();await p.locator('#paperTitle').fill(title);requested.length=0;
 let download=p.waitForEvent('download',{timeout:180000});await p.locator('#buildPDF').click();let d=await download;const file=path.join(out,d.suggestedFilename());await d.saveAs(file);
 const pdf=await lib.PDFDocument.load(fs.readFileSync(file));for(const page of pdf.getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
 download=p.waitForEvent('download');await p.getByRole('link',{name:'Download answers / mark scheme',exact:true}).click();d=await download;const answer=path.join(out,d.suggestedFilename());await d.saveAs(answer);
 for(const page of(await lib.PDFDocument.load(fs.readFileSync(answer))).getPages())assert.deepEqual(page.getSize(),{width:595.28,height:841.89});
 assert.deepEqual(requested,[...selected.map(q=>working?q.workingQuestionFile:q.questionFile),...selected.map(q=>q.answerFile)]);
}
await exportAndCheck(samples,false,'Foundation Mixed Compact');await exportAndCheck(samples,true,'Foundation Mixed Working');
// Exercise a large, genuinely filtered basket spanning all three papers.
await p.locator('#clearSelection').click();await p.selectOption('#examYear','2025');
await p.locator('#selectVisible').click();const selectedFiles=await p.locator('.question-row a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));const large=selectedFiles.map(f=>all.find(q=>q.questionFile===f));
assert.equal(large.length,85);assert.equal(await p.locator('#selectedList li').count(),85);await exportAndCheck(large,false,'Foundation 2025 Large Selection');
assert.deepEqual(errors,[]);console.log('PASS Foundation P1/P2/P3 + June/November filters, scoped Select All, previews, mixed ordered exports in both modes and 85-question practice/answers download. '+out);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
