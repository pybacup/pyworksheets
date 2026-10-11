// Pilot only. Original vector strips, never rewritten question or answer content.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),C=require('../../assets/exams/core.js');
const root=path.resolve(__dirname,'../..'),plan=require('./foundation-june-2024-p1-plan.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const bytes=fs.readFileSync(path.join(root,plan.sourceFile)),msBytes=fs.readFileSync(path.join(root,plan.markSchemeFile));
 assert.equal(sha(bytes),plan.sourceSHA256);assert.equal(sha(msBytes),plan.markSchemeSHA256);
 const source=await lib.PDFDocument.load(bytes),marks=await lib.PDFDocument.load(msBytes);
 const indexPath=path.join(root,'exams/data/exam-index.json'),all=JSON.parse(fs.readFileSync(indexPath));
 const ids=new Set(plan.questions.map(q=>q.record.id));assert.equal(ids.size,28);assert.equal(plan.questions.reduce((n,q)=>n+q.record.marks,0),80);
 // Refuse conflicting pre-existing pilot records. A reviewed pilot may be regenerated idempotently.
 for(const q of all.filter(q=>ids.has(q.id)))assert.deepEqual(q,plan.questions.find(p=>p.record.id===q.id).record);
 for(const item of plan.questions){
  for(const mode of ['compact','working','answers']){
   const out=await lib.PDFDocument.create(),src=mode==='answers'?marks:source,parts=item[mode];
   out.setTitle(item.record.id+' - '+mode);out.setAuthor('Pearson Edexcel');
   const draw=async(page,part,y,top=part.top,bottom=part.bottom)=>{
    const original=src.getPage(part.page-1);assert.equal(original.getRotation().angle,0);
    assert(top>=0&&bottom<=original.getHeight()&&part.left>=0&&part.right<=original.getWidth());
    const e=await out.embedPage(original,{left:part.left,right:part.right,top:original.getHeight()-top,bottom:original.getHeight()-bottom});
    page.drawPage(e,{x:0,y,width:part.right-part.left,height:bottom-top});
   };
   if(mode==='compact'){
    const height=parts.reduce((h,p)=>h+p.bottom-p.top,0)+6*(parts.length-1),page=out.addPage([517,height]);let cursor=height;
    for(const p of parts){cursor-=p.bottom-p.top;await draw(page,p,cursor);cursor-=6;}
   }else for(const p of parts){
    const body=p.bottom-p.top,header=mode==='answers'?p.headerBottom-p.headerTop+2:0;
    const page=out.addPage([p.right-p.left,body+header]);
    await draw(page,p,mode==='answers'?1:0);
    if(mode==='answers'){await draw(page,p,body+2,p.headerTop,p.headerBottom);page.drawLine({start:{x:0,y:1},end:{x:p.right-p.left,y:1},thickness:.35});}
   }
   const key={compact:'questionFile',working:'workingQuestionFile',answers:'answerFile'}[mode],file=path.join(root,item.record[key]);
   fs.mkdirSync(path.dirname(file),{recursive:true});const output=await out.save();fs.writeFileSync(file,output);item[mode+'SHA256']=sha(output);
  }
 }
 const merged=[...all.filter(q=>!ids.has(q.id)),...plan.questions.map(q=>q.record)];C.validateIndex(merged);
 fs.writeFileSync(indexPath,JSON.stringify(merged,null,2)+'\n');
 fs.writeFileSync(path.join(__dirname,'foundation-june-2024-p1-plan.json'),JSON.stringify(plan,null,2)+'\n');
 console.log('28 Foundation records merged. 84 question/working/answer PDFs generated. Existing records untouched.');
})().catch(e=>{console.error(e);process.exitCode=1;});
