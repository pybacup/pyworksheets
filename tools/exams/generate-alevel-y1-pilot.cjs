// June 2025 H630/01 only: retain original vector question, booklet and mark-scheme strips.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),C=require('../../assets/exams/core.js');
const root=path.resolve(__dirname,'../..'),planFile=path.join(__dirname,'alevel-y1-june-2025-h630-01-plan.json'),plan=JSON.parse(fs.readFileSync(planFile));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const sources={};
 for(const [kind,key] of [['question','source'],['markScheme','markScheme'],['answerBooklet','answerBooklet']]){
  const bytes=fs.readFileSync(path.join(root,plan[key+'File']));assert.equal(sha(bytes),plan[key+'SHA256']);sources[kind]=await lib.PDFDocument.load(bytes);
 }
 const indexFile=path.join(root,'exams/data/exam-index.json'),all=JSON.parse(fs.readFileSync(indexFile)),ids=new Set(plan.questions.map(q=>q.record.id));
 assert.equal(ids.size,13);assert.equal(plan.questions.reduce((n,q)=>n+q.record.marks,0),70);
 const old=all.filter(q=>!ids.has(q.id));assert.equal(old.length,plan.baselineCount);assert.equal(sha(JSON.stringify(old)),plan.baselineSHA256);
 for(const existing of all.filter(q=>ids.has(q.id)))assert.deepEqual(existing,plan.questions.find(q=>q.record.id===existing.id).record);
 const merged=[...old,...plan.questions.map(q=>q.record)];C.validateIndex(structuredClone(merged));
 // Validate all regions before writing anything.
 for(const q of plan.questions)for(const mode of ['compact','working','answers'])for(const group of q[mode])for(const p of group){
  const page=sources[p.source].getPage(p.page-1);assert.equal(page.getRotation().angle,0);assert(p.left>=0&&p.right<=page.getWidth()&&p.top>=0&&p.bottom<=page.getHeight()&&p.bottom>p.top);
 }
 for(const q of plan.questions)for(const mode of ['compact','working','answers']){
  const out=await lib.PDFDocument.create();out.setTitle(q.record.id+' - '+mode);out.setAuthor('OCR MEI');
  for(const group of q[mode]){
   const width=Math.max(...group.map(p=>p.right-p.left))+10,height=group.reduce((h,p)=>h+p.bottom-p.top,0)+6*(group.length-1)+8;
   const page=out.addPage([width,height]);let cursor=height-4;
   for(const p of group){const original=sources[p.source].getPage(p.page-1),h=p.bottom-p.top;cursor-=h;
    const embedded=await out.embedPage(original,{left:p.left,right:p.right,top:original.getHeight()-p.top,bottom:original.getHeight()-p.bottom});
    page.drawPage(embedded,{x:5,y:cursor,width:p.right-p.left,height:h});cursor-=6;
   }
  }
  const key={compact:'questionFile',working:'workingQuestionFile',answers:'answerFile'}[mode],file=path.join(root,q.record[key]),bytes=await out.save();
  if(fs.existsSync(file)){assert(q[mode+'SHA256'],'Refusing to overwrite an unaudited existing PDF: '+file);assert.equal(sha(fs.readFileSync(file)),q[mode+'SHA256']);}
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);q[mode+'SHA256']=sha(bytes);
 }
 fs.writeFileSync(indexFile,JSON.stringify(merged,null,2)+'\n');fs.writeFileSync(planFile,JSON.stringify(plan,null,2)+'\n');
 console.log('13 questions / 70 marks; 39 variants; all '+old.length+' existing records preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
