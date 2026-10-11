// Recreate only official crops changed by the focused visual review.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js'),C=require('../../assets/exams/core.js');
const root=path.resolve(__dirname,'../..'),planFile=path.join(__dirname,'alevel-y2-bank-plan.json'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const old=JSON.parse(fs.readFileSync(planFile)),plan=JSON.parse(fs.readFileSync(process.argv[2])),indexFile=path.join(root,'exams/data/exam-index.json'),all=JSON.parse(fs.readFileSync(indexFile));assert.equal(old.baselineSHA256,plan.baselineSHA256);let changed=0;
 for(const paper of plan.papers){const before=old.papers.find(p=>p.key===paper.key),sources={};assert.deepEqual(paper.sourceHashes,before.sourceHashes);
  if(paper.material){assert.deepEqual(paper.material.regions,before.material.regions);paper.material.SHA256=before.material.SHA256;}
  for(const q of paper.questions){const previous=before.questions.find(v=>v.record.id===q.record.id);assert.deepEqual({...q.record,sourcePages:[]},{...previous.record,sourcePages:[]});
   for(const mode of ['compact','working','answers']){const key={compact:'questionFile',working:'workingQuestionFile',answers:'answerFile'}[mode],file=path.join(root,q.record[key]);assert.equal(sha(fs.readFileSync(file)),previous[mode+'SHA256']);
    if(JSON.stringify(q[mode])===JSON.stringify(previous[mode])){q[mode+'SHA256']=previous[mode+'SHA256'];continue;}
    assert.notEqual(mode,'answers','Answer crops must remain unchanged in this review');const out=await lib.PDFDocument.create();out.setAuthor('OCR MEI');out.setTitle(path.basename(file,'.pdf'));
    for(const group of q[mode]){const width=Math.max(...group.map(p=>p.right-p.left))+10,height=group.reduce((h,p)=>h+p.bottom-p.top,0)+6*(group.length-1)+8,page=out.addPage([width,height]);let cursor=height-4;
     for(const p of group){if(!sources[p.source])sources[p.source]=await lib.PDFDocument.load(fs.readFileSync(path.join(root,paper.sources[p.source])));const original=sources[p.source].getPage(p.page-1),h=p.bottom-p.top;cursor-=h;const embedded=await out.embedPage(original,{left:p.left,right:p.right,top:original.getHeight()-p.top,bottom:original.getHeight()-p.bottom});page.drawPage(embedded,{x:5,y:cursor,width:p.right-p.left,height:h});cursor-=6;}
    }
    const bytes=await out.save();fs.writeFileSync(file,bytes);q[mode+'SHA256']=sha(bytes);changed++;
   }
   const i=all.findIndex(v=>v.id===q.record.id);assert(i>=0);all[i]=q.record;
  }
 }
 C.validateIndex(structuredClone(all));fs.writeFileSync(planFile+'.tmp',JSON.stringify(plan,null,2)+'\n');fs.renameSync(planFile+'.tmp',planFile);fs.writeFileSync(indexFile,JSON.stringify(all,null,2)+'\n');console.log('Updated '+changed+' reviewed compact/working crops; official answers and all prior-bank records unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;});
