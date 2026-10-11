// Embed reviewed original PDF regions. No question or answer text is reconstructed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),C=require('../../assets/exams/core.js');
const root=path.resolve(__dirname,'../..'),planPath=path.join(__dirname,'foundation-bank-plan.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function orientedPage(source,number,cache){
 if(cache.has(number))return cache.get(number);
 const raw=source.getPage(number),rotation=((raw.getRotation().angle%360)+360)%360;
 if(!rotation){cache.set(number,raw);return raw;}
 assert([90,180,270].includes(rotation));
 const box=raw.getMediaBox(),w=box.width,h=box.height,doc=await lib.PDFDocument.create();
 const page=doc.addPage(rotation===180?[w,h]:[h,w]);
 const e=await doc.embedPage(raw,{left:box.x,bottom:box.y,right:box.x+w,top:box.y+h});
 page.drawPage(e,{x:rotation===180?w:rotation===270?h:0,y:rotation===90?w:rotation===180?h:0,width:w,height:h,rotate:lib.degrees(-rotation)});
 await doc.flush();cache.set(number,page);return page;
}
(async()=>{
 const plan=JSON.parse(fs.readFileSync(planPath)),indexPath=path.join(root,'exams/data/exam-index.json');
 const existing=JSON.parse(fs.readFileSync(indexPath)),before=JSON.stringify(existing),ids=new Set(existing.map(q=>q.id));
 const additions=plan.flatMap(p=>p.questions.map(q=>q.record));
 assert.equal(plan.length,44);assert.equal(additions.length,1232);assert.equal(new Set(additions.map(q=>q.id)).size,1232);
 for(const q of additions){const old=existing.find(r=>r.id===q.id);if(old)assert.deepEqual(old,q,'Conflicting ID: '+q.id);}
 for(const paper of plan){
  const qb=fs.readFileSync(path.join(root,paper.sourceFile)),ab=fs.readFileSync(path.join(root,paper.markSchemeFile));
  assert.equal(sha(qb),paper.sourceSHA256);assert.equal(sha(ab),paper.markSchemeSHA256);
  const original=await lib.PDFDocument.load(qb),compact=await lib.PDFDocument.load(qb),answers=await lib.PDFDocument.load(ab),answerCache=new Map();
  // Masks apply only to a separate in-memory compact source; working originals stay intact.
  for(const q of paper.questions)for(const m of q.masks){
   const p=compact.getPage(m.page);p.drawRectangle({x:m.left,y:p.getHeight()-m.bottom,width:m.right-m.left,height:m.bottom-m.top,color:lib.rgb(1,1,1)});
  }
  for(const item of paper.questions){
   for(const mode of ['compact','working','answers']){
    const key={compact:'questionFile',working:'workingQuestionFile',answers:'answerFile'}[mode],file=path.join(root,item.record[key]);
    // A rerun may skip a verified output, but never overwrite an unexplained existing file.
    if(fs.existsSync(file)&&item[mode+'SHA256']===sha(fs.readFileSync(file)))continue;
    assert(!fs.existsSync(file),'Existing output differs from reviewed plan: '+file);
    const out=await lib.PDFDocument.create();out.setTitle(item.record.id+' - '+mode);out.setAuthor('Pearson Edexcel');
    async function draw(page,source,part,x,y){
     assert(part.top>=0&&part.bottom<=source.getHeight()+.1&&part.left>=0&&part.right<=source.getWidth()+.1);
     const e=await out.embedPage(source,{left:part.left,right:part.right,top:source.getHeight()-part.top,bottom:source.getHeight()-part.bottom});
     page.drawPage(e,{x,y,width:part.right-part.left,height:part.bottom-part.top});
    }
    if(mode==='compact'){
     const groups=[];
     for(const part of item.compact){if(part.keepPrevious&&groups.length)groups.at(-1).push(part);else groups.push([part]);}
     const chunks=[];let chunk=[],height=0;
     for(const group of groups){const h=group.reduce((a,p)=>a+p.bottom-p.top+6,0);if(chunk.length&&height+h>720){chunks.push(chunk);chunk=[];height=0;}chunk.push(...group);height+=h;}
     if(chunk.length)chunks.push(chunk);
     for(const parts of chunks){const h=parts.reduce((a,p)=>a+p.bottom-p.top,0)+(parts.length-1)*6+8,p=out.addPage([526,h]);let y=h-4;
      for(const part of parts){y-=part.bottom-part.top;await draw(p,compact.getPage(part.page),part,3,y);y-=6;}
     }
    }else if(mode==='working'){
     for(const part of item.working){const p=out.addPage([part.right-part.left,part.bottom-part.top]);await draw(p,original.getPage(part.page),part,0,0);}
    }else{
     for(const part of item.answers){
      const source=await orientedPage(answers,part.sourcePage-1,answerCache),w=part.right-part.left,body=part.bottom-part.top,header=part.headerBottom-part.headerTop,p=out.addPage([w,body+header+2]);
      await draw(p,source,part,0,1);await draw(p,source,{...part,top:part.headerTop,bottom:part.headerBottom},0,body+2);
      p.drawLine({start:{x:0,y:1},end:{x:w,y:1},thickness:.35});
     }
    }
    fs.mkdirSync(path.dirname(file),{recursive:true});const bytes=await out.save();fs.writeFileSync(file,bytes);item[mode+'SHA256']=sha(bytes);
   }
  }
  fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
  console.log(paper.year+' '+paper.series+' P'+paper.paper+': '+paper.questions.length+' complete triples');
 }
 assert.equal(JSON.stringify(existing),before);
 const merged=[...existing,...additions.filter(q=>!ids.has(q.id))];C.validateIndex(merged);
 fs.writeFileSync(indexPath,JSON.stringify(merged,null,2)+'\n');
 console.log('1,232 Foundation records merged; existing records preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
