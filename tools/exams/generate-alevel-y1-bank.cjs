// Embed reviewed original OCR regions; publication and source archives are untouched.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const root=path.resolve(__dirname,'../..'),file=path.resolve(process.argv[2]),plan=JSON.parse(fs.readFileSync(file));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const priorFile=path.join(root,'tools/exams/alevel-y1-bank-plan.json'),prior=fs.existsSync(priorFile)?JSON.parse(fs.readFileSync(priorFile)):null;
const only=process.argv[3];
(async()=>{
 const all=JSON.parse(fs.readFileSync(path.join(root,'exams/data/exam-index.json')));
 const batchIds=new Set(plan.papers.flatMap(p=>p.questions.map(q=>q.record.id)));
 assert.deepEqual(all.filter(q=>!batchIds.has(q.id)),plan.baseline,'Existing index has changed since this batch was planned');
 for(const q of all.filter(q=>batchIds.has(q.id)))assert.deepEqual(q,plan.papers.flatMap(p=>p.questions).find(p=>p.record.id===q.id).record);
 const ids=new Set(all.filter(q=>!batchIds.has(q.id)).map(q=>q.id));
 for(const paper of plan.papers){
  const sources={};for(const [kind,p] of Object.entries(paper.sources)){
   const bytes=fs.readFileSync(path.join(root,p));assert.equal(sha(bytes),paper.sourceHashes[kind]);sources[kind]=await lib.PDFDocument.load(bytes);
  }
  assert.equal(paper.questions.reduce((s,q)=>s+q.record.marks,0),70);
  for(const q of paper.questions){assert(!ids.has(q.record.id));ids.add(q.record.id);
   if(only&&q.record.id!==only){const previous=prior?.papers.flatMap(p=>p.questions).find(p=>p.record.id===q.record.id);assert(previous);for(const mode of ['compact','working','answers']){assert.deepEqual(q[mode],previous[mode]);q[mode+'SHA256']=previous[mode+'SHA256'];}continue;}
   for(const mode of ['compact','working','answers']){
    const out=await lib.PDFDocument.create();out.setTitle(q.record.id+' - '+mode);out.setAuthor('OCR MEI');
    for(const group of q[mode]){
     const height=group.reduce((h,p)=>h+p.bottom-p.top,0)+6*(group.length-1)+8,width=Math.max(...group.map(p=>p.right-p.left))+10;
     const page=out.addPage([width,height]);let y=height-4;
     for(const p of group){const original=sources[p.source].getPage(p.page-1);assert.equal(original.getRotation().angle,0);assert(p.top>=0&&p.bottom<=original.getHeight()&&p.left>=0&&p.right<=original.getWidth()&&p.bottom>p.top);
      const h=p.bottom-p.top;y-=h;const emb=await out.embedPage(original,{left:p.left,right:p.right,top:original.getHeight()-p.top,bottom:original.getHeight()-p.bottom});page.drawPage(emb,{x:5,y,width:p.right-p.left,height:h});y-=6;
     }
    }
    const field={compact:'questionFile',working:'workingQuestionFile',answers:'answerFile'}[mode],target=path.join(root,q.record[field]);
    if(fs.existsSync(target)){const previous=prior?.papers.flatMap(p=>p.questions).find(p=>p.record.id===q.record.id);assert(previous,'Refusing to overwrite unaudited '+target);assert.equal(sha(fs.readFileSync(target)),previous[mode+'SHA256']);}
    const bytes=await out.save();fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);q[mode+'SHA256']=sha(bytes);
   }
  }
  console.log(paper.key+': '+paper.questions.length+' questions / 70 marks, three original variants');
 }
 plan.baselineCount=plan.baseline.length;plan.baselineSHA256=sha(JSON.stringify(plan.baseline));delete plan.baseline;
 fs.writeFileSync(path.join(root,'tools/exams/alevel-y1-bank-plan.json'),JSON.stringify(plan,null,2)+'\n');
 console.log('PDFs generated. Index deliberately not merged until focused verification.');
})().catch(e=>{console.error(e);process.exitCode=1;});
