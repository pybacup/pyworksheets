// Official source regions only: no answer reconstruction or generated solutions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),C=require('../../assets/exams/core.js');
const root=path.resolve(__dirname,'../..'),planPath=path.join(__dirname,'gcse-answer-plan.json'),plan=JSON.parse(fs.readFileSync(planPath));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 const indexPath=path.join(root,'exams/data/exam-index.json'),all=JSON.parse(fs.readFileSync(indexPath)),before=structuredClone(all),records=new Map(all.map(q=>[q.id,q]));
 const ids=plan.flatMap(p=>p.questions.map(q=>q.id));assert.equal(ids.length,997);assert.equal(new Set(ids).size,997);
 let generated=0,preserved=0;
 const onlyRotated=process.argv.includes('--rotated-only');
 for(const paper of plan){
  const bytes=fs.readFileSync(path.join(root,paper.sourceFile));assert.equal(hash(bytes),paper.sourceSHA256);const source=await lib.PDFDocument.load(bytes),oriented=new Map();
  async function visualPage(number){
   if(oriented.has(number))return oriented.get(number);
   const raw=source.getPage(number-1),rotation=((raw.getRotation().angle%360)+360)%360;
   assert([0,90,180,270].includes(rotation));
   if(rotation===0){oriented.set(number,raw);return raw;}
   const box=raw.getMediaBox(),w=box.width,h=box.height,doc=await lib.PDFDocument.create(),page=doc.addPage(rotation===180?[w,h]:[h,w]);
   const embedded=await doc.embedPage(raw,{left:box.x,bottom:box.y,right:box.x+w,top:box.y+h});
   page.drawPage(embedded,{x:rotation===180?w:rotation===270?h:0,y:rotation===90?w:rotation===180?h:0,width:w,height:h,rotate:lib.degrees(-rotation)});
   await doc.flush();oriented.set(number,page);return page;
  }
  for(const item of paper.questions){
   const q=records.get(item.id);assert(q);assert.equal(q.qualification,'GCSE Maths');assert.equal(q.tier,'Higher');assert.equal(q.examBoard,'Pearson Edexcel');assert.equal(q.paperNumber,paper.paper);assert.equal(q.paperCode,'1MA1/'+paper.paper+'H');assert.equal(q.examYear,paper.year);assert.equal(q.series,paper.series);assert.equal(+q.question,item.question);assert.equal(q.marks,item.marks);
   assert.equal(item.answerFile,'exams/answers/gcse/higher/p'+paper.paper+'/'+q.id+'.pdf');const file=path.join(root,item.answerFile);
   if(item.approvedPilot||(onlyRotated&&item.segments.every(s=>source.getPage(s.sourcePage-1).getRotation().angle===0))){assert.equal(q.answerFile,item.answerFile);assert(fs.existsSync(file));preserved++;}
   else{
    const out=await lib.PDFDocument.create();
    for(const s of item.segments){
     assert(paper.standardTablePages.includes(s.sourcePage));const original=await visualPage(s.sourcePage),width=s.right-s.left,body=s.bottom-s.top,header=s.headerBottom-s.headerTop;
     assert(width>0&&body>0&&header>0&&s.bottom<=original.getHeight());const page=out.addPage([width,header+body+2]);
     const crop=async(top,bottom,y)=>{const embedded=await out.embedPage(original,{left:s.left,right:s.right,top:original.getHeight()-top,bottom:original.getHeight()-bottom});page.drawPage(embedded,{x:0,y,width,height:bottom-top});};
     await crop(s.headerTop,s.headerBottom,body+2);await crop(s.top,s.bottom,1);page.drawLine({start:{x:0,y:1},end:{x:width,y:1},thickness:.35});
    }
    out.setTitle(q.id+' - official mark scheme');out.setAuthor('Pearson Edexcel');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,await out.save());generated++;
   }
   item.answerSHA256=hash(fs.readFileSync(file));q.answerFile=item.answerFile;
  }
  console.log(paper.year+' '+paper.series+' P'+paper.paper+': '+paper.questions.length+' matched');
 }
 for(let i=0;i<all.length;i++){const a={...before[i]},b={...all[i]};delete a.answerFile;delete b.answerFile;assert.deepEqual(a,b);}
 C.validateIndex(structuredClone(all));fs.writeFileSync(indexPath,JSON.stringify(all,null,2)+'\n');fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
 console.log('Generated '+generated+'; preserved existing '+preserved+'; total '+ids.length+'. Only answerFile fields updated.');
})().catch(e=>{console.error(e);process.exitCode=1;});
