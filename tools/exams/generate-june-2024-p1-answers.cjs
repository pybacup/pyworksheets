// Pilot only. Embed official mark-scheme table regions, without rewriting any answers.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const plan=require('./june-2024-p1-answer-plan.json'),root=path.resolve(__dirname,'../..');
(async()=>{
 const sourceBytes=fs.readFileSync(path.join(root,plan.sourceFile));
 assert.equal(crypto.createHash('sha256').update(sourceBytes).digest('hex'),plan.sourceSHA256);
 const indexPath=path.join(root,'exams/data/exam-index.json'),all=JSON.parse(fs.readFileSync(indexPath));
 const records=new Map(all.map(q=>[q.id,q]));
 assert.equal(plan.questions.length,23);assert.equal(new Set(plan.questions.map(q=>q.id)).size,23);
 assert.equal(plan.questions.reduce((n,q)=>n+q.marks,0),80);
 const source=await lib.PDFDocument.load(sourceBytes);
 for(const item of plan.questions){
  const q=records.get(item.id);assert(q);assert.equal(q.qualification,'GCSE Maths');assert.equal(q.tier,'Higher');assert.equal(q.paperCode,'1MA1/1H');assert.equal(q.examYear,2024);assert.equal(q.series,'June');assert.equal(+q.question,item.question);assert.equal(q.marks,item.marks);
  assert(item.sourcePage>=6&&item.sourcePage<=20,'Exclude modified-paper appendices');
  const original=source.getPage(item.sourcePage-1),out=await lib.PDFDocument.create();
  const width=item.right-item.left,headerHeight=item.headerBottom-item.headerTop,height=item.bottom-item.top;
  const page=out.addPage([width,headerHeight+height+2]);
  const crop=async(top,bottom,y)=>{const e=await out.embedPage(original,{left:item.left,right:item.right,top:original.getHeight()-top,bottom:original.getHeight()-bottom});page.drawPage(e,{x:0,y,width,height:bottom-top});};
  await crop(item.headerTop,item.headerBottom,height+2);await crop(item.top,item.bottom,1);
  page.drawLine({start:{x:0,y:1},end:{x:width,y:1},thickness:.35});
  out.setTitle(q.id+' - official mark scheme');out.setAuthor('Pearson Edexcel');
  const file='exams/answers/gcse/higher/p1/'+q.id+'.pdf';fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),await out.save());q.answerFile=file;
 }
 fs.writeFileSync(indexPath,JSON.stringify(all,null,2)+'\n');
 console.log('Pilot: 23 official answer extracts generated; 80 marks matched. Only answerFile added to the 23 existing June 2024 P1 records.');
})().catch(e=>{console.error(e);process.exitCode=1;});
