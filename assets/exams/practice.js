(function(root){
'use strict';
class Basket{
 constructor(){this.items=[];}
 add(q){if(!this.items.some(e=>e.id===q.id))this.items.push(q);}
 remove(id){this.items=this.items.filter(e=>e.id!==id);}
 move(id,delta){const i=this.items.findIndex(e=>e.id===id),j=i+delta;if(i<0||j<0||j>=this.items.length)return;[this.items[i],this.items[j]]=[this.items[j],this.items[i]];}
 has(id){return this.items.some(e=>e.id===id);}
 clear(){this.items=[];}
 get marks(){return this.items.reduce((sum,e)=>sum+e.marks,0);}
}
function series(e){const label=String(e.examSeries||e.series||e.session||'').trim();return label?(label.includes(String(e.examYear))?label:label+' '+e.examYear):String(e.examYear);}
function sourceLines(e){const C=root.ExamCore||(typeof require==='function'?require('./core.js'):null),paper=C?C.paper(e):'',course=e.qualification+(e.qualification==='GCSE Maths'&&e.tier?' '+e.tier:'');return [[e.examBoard,course,paper?'Paper '+paper.slice(1):'',e.paperCode].filter(Boolean).join(' \u00b7 '),series(e)+' \u00b7 Question '+e.question+' \u00b7 '+e.marks+' marks'];}
function filename(title){const clean=String(title).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,120).replace(/-$/,'');return 'PY-Maths-'+(clean||'Practice')+'.pdf';}
function wrap(text,font,size,width){const lines=[];let line='';for(const word of String(text).replace(/[\r\n\t]+/g,' ').split(/\s+/)){const trial=line?line+' '+word:word;if(font.widthOfTextAtSize(trial,size)<=width){line=trial;continue;}if(line)lines.push(line);line='';for(const ch of word){if(font.widthOfTextAtSize(line+ch,size)>width&&line){lines.push(line);line='';}line+=ch;}}if(line)lines.push(line);return lines;}
// Embed the full CropBox as vector content; never crop to make a question fit.
async function build(questions,{title='Maths Practice',lib,load,onProgress=()=>{}}){
 if(!questions.length)throw Error('Select at least one question.');
 const width=595.28,height=841.89,margin=32,gap=28,usable=width-2*margin;
 const out=await lib.PDFDocument.create(),font=await out.embedFont(lib.StandardFonts.Helvetica),bold=await out.embedFont(lib.StandardFonts.HelveticaBold);
 out.setTitle('PY Maths – '+title);out.setCreator('PY Maths');
 let page=null,cursor=0,hasContent=false;
 function newPage(){
  const first=out.getPageCount()===0;page=out.addPage([width,height]);cursor=height-margin;hasContent=false;
  if(first){const lines=wrap('PY Maths – '+title,bold,12,usable);if(lines.length>8)throw Error('Practice title is too long.');for(const text of lines){page.drawText(text,{x:margin,y:cursor-12,font:bold,size:12,color:lib.rgb(.075,.306,.29)});cursor-=15;}cursor-=12;}
 }
 for(let i=0;i<questions.length;i++){const q=questions[i];try{
  onProgress(i,questions.length,q);const src=await lib.PDFDocument.load(await load(q));const count=src.getPageCount();if(!count)throw Error('PDF has no pages.');
  for(let n=0;n<count;n++){
   const original=src.getPage(n),box=original.getCropBox(),rotation=((original.getRotation().angle%360)+360)%360;
   if(![0,90,180,270].includes(rotation))throw Error('Unsupported page rotation.');
   const rotated=rotation===90||rotation===270,dw=rotated?box.height:box.width,dh=rotated?box.width:box.height;
   if(!(dw>0&&dh>0))throw Error('Invalid PDF page dimensions.');
   const label=sourceLines(q).join(' · ')+(count>1?' · Page '+(n+1)+' of '+count:'');
   const headers=wrap(label,font,8,usable),headerHeight=headers.length*11+10;
   if(headerHeight>150)throw Error('Source metadata is too long to fit the header.');
   if(!page||(count>1&&hasContent))newPage();
   // Fit width at most 100%. Never reduce further simply to fill leftover space.
   let scale=Math.min(1,usable/dw),required=headerHeight+dh*scale;
   if(hasContent&&required>cursor-margin)newPage();
   // Exception: a source page taller than an entire usable sheet must fit A4.
   // It gets the full sheet, retaining all content and its original proportions.
   scale=Math.min(scale,(cursor-margin-headerHeight)/dh);
   let y=cursor;
   for(const text of headers){page.drawText(text,{x:margin,y:y-8,font,size:8,color:lib.rgb(.2,.25,.23)});y-=11;}
   page.drawLine({start:{x:margin,y:y-3},end:{x:width-margin,y:y-3},thickness:.5,color:lib.rgb(.72,.79,.75)});
   const embedded=await out.embedPage(original,{left:box.x,bottom:box.y,right:box.x+box.width,top:box.y+box.height});
   const w=box.width*scale,h=box.height*scale,bottom=cursor-headerHeight-dh*scale;
   let x=margin,y0=bottom;
   if(rotation===90)y0+=w;else if(rotation===180){x+=w;y0+=h;}else if(rotation===270)x+=h;
   page.drawPage(embedded,{x,y:y0,width:w,height:h,rotate:lib.degrees(-rotation)});
   cursor=bottom-gap;hasContent=true;
  }
 }catch(error){throw Error('Could not include '+q.examBoard+' '+q.paperCode+' · '+series(q)+' · Question '+q.question+': '+error.message);}}
 return out.save();
}
async function loadQuestion(q){if(!root.ExamCore.safePath(q.questionFile,'exams/questions/'))throw Error('Invalid question PDF path.');const url=new URL(q.questionFile,document.baseURI);if(url.origin!==location.origin)throw Error('Question PDF must be hosted on this site.');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);try{const response=await fetch(url,{signal:controller.signal,redirect:'error'});if(!response.ok)throw Error('PDF request returned HTTP '+response.status+'.');const data=new Uint8Array(await response.arrayBuffer());if(data.length>80*1024*1024)throw Error('Question PDF exceeds 80 MB.');return data;}finally{clearTimeout(timer);}}
const api={Basket,series,sourceLines,filename,wrap,build,loadQuestion};if(typeof module!=='undefined')module.exports=api;else root.ExamPractice=api;
})(globalThis);
