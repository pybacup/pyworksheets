// Embed approved official source regions without rasterising or rewriting content.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),C=require('../../assets/exams/core.js');
const root=path.resolve(__dirname,'../..'),planFile=path.join(__dirname,'alevel-y2-bank-plan.json'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const plan=JSON.parse(fs.readFileSync(fs.existsSync(planFile)?planFile:process.argv[2]));
 const indexFile=path.join(root,'exams/data/exam-index.json'),all=JSON.parse(fs.readFileSync(indexFile)),records=plan.papers.flatMap(p=>p.questions.map(q=>q.record)),ids=new Set(records.map(q=>q.id));
 assert.equal(plan.papers.length,23);assert.equal(records.length,349);assert.equal(ids.size,349);
 const old=all.filter(q=>!ids.has(q.id));assert.equal(old.length,plan.baselineCount);assert.equal(sha(JSON.stringify(old)),plan.baselineSHA256);
 for(const q of all.filter(q=>ids.has(q.id)))assert.deepEqual(q,records.find(r=>r.id===q.id));
 const merged=[...old,...records];C.validateIndex(structuredClone(merged));
 for(const paper of plan.papers){
  const sources={};for(const [kind,file] of Object.entries(paper.sources)){const bytes=fs.readFileSync(path.join(root,file));assert.equal(sha(bytes),paper.sourceHashes[kind]);sources[kind]=await lib.PDFDocument.load(bytes);}
  const jobs=paper.questions.flatMap(q=>['compact','working','answers'].map(mode=>({owner:q,key:mode+'SHA256',groups:q[mode],file:q.record[{compact:'questionFile',working:'workingQuestionFile',answers:'answerFile'}[mode]]})));
  if(paper.material)jobs.push({owner:paper.material,key:'SHA256',groups:paper.material.regions,file:paper.material.metadata.file});
  for(const job of jobs){
   const file=path.join(root,job.file);
   if(fs.existsSync(file)){assert(job.owner[job.key],'Refusing to overwrite an unaudited PDF: '+job.file);assert.equal(sha(fs.readFileSync(file)),job.owner[job.key]);continue;}
   const out=await lib.PDFDocument.create();out.setAuthor('OCR MEI');out.setTitle(path.basename(file,'.pdf'));
   for(const group of job.groups){
    const width=Math.max(...group.map(p=>p.right-p.left))+10,height=group.reduce((h,p)=>h+p.bottom-p.top,0)+6*(group.length-1)+8,page=out.addPage([width,height]);let cursor=height-4;
    for(const p of group){const original=sources[p.source].getPage(p.page-1);assert.equal(original.getRotation().angle,0);assert(p.left>=0&&p.right<=original.getWidth()&&p.top>=0&&p.bottom<=original.getHeight()&&p.bottom>p.top,JSON.stringify(p));const h=p.bottom-p.top;cursor-=h;const embedded=await out.embedPage(original,{left:p.left,right:p.right,top:original.getHeight()-p.top,bottom:original.getHeight()-p.bottom});page.drawPage(embedded,{x:5,y:cursor,width:p.right-p.left,height:h});cursor-=6;}
   }
   const bytes=await out.save();fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);job.owner[job.key]=sha(bytes);
   // Keep progress resumable without replacing any existing question record.

  }
  const checkpoint=planFile+'.tmp';fs.writeFileSync(checkpoint,JSON.stringify(plan,null,2)+'\n');fs.renameSync(checkpoint,planFile);
  console.log(paper.key+': '+paper.questions.length+' questions, '+jobs.length+' official PDFs');
 }
 fs.writeFileSync(indexFile,JSON.stringify(merged,null,2)+'\n');fs.writeFileSync(planFile,JSON.stringify(plan,null,2)+'\n');
 console.log('Added 349 questions; preserved all '+old.length+' existing records, including the approved 14-question pilot.');
})().catch(e=>{console.error(e);process.exitCode=1;});
