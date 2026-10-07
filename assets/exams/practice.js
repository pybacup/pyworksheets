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
function sourceLines(e){return [e.examBoard+' · '+e.qualification+' · '+e.paperCode,series(e)+' · Question '+e.question+' · '+e.marks+' marks'];}
function filename(title){const clean=String(title).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,120).replace(/-$/,'');return 'PY-Maths-'+(clean||'Practice')+'.pdf';}
function wrap(text,font,size,width){const lines=[];let line='';for(const word of String(text).replace(/[\r\n\t]+/g,' ').split(/\s+/)){const trial=line?line+' '+word:word;if(font.widthOfTextAtSize(trial,size)<=width){line=trial;continue;}if(line)lines.push(line);line='';for(const ch of word){if(font.widthOfTextAtSize(line+ch,size)>width&&line){lines.push(line);line='';}line+=ch;}}if(line)lines.push(line);return lines;}
// The full original visible page is embedded as a vector form, including CropBox offsets.
// Rotation is applied explicitly so portrait, landscape and rotated source PDFs fit safely.
async function build(questions,{title='Maths Practice',lib,load,onProgress=()=>{}}){
 if(!questions.length)throw Error('Select at least one question.');
 const out=await lib.PDFDocument.create(),font=await out.embedFont(lib.StandardFonts.Helvetica),bold=await out.embedFont(lib.StandardFonts.HelveticaBold);
 out.setTitle('PY Maths – '+title);out.setCreator('PY Maths');let first=true;
 for(let i=0;i<questions.length;i++){const q=questions[i];try{
 onProgress(i,questions.length,q);const data=await load(q),src=await lib.PDFDocument.load(data);if(!src.getPageCount())throw Error('PDF has no pages.');
 for(let n=0;n<src.getPageCount();n++){
 const original=src.getPage(n),box=original.getCropBox(),rotation=((original.getRotation().angle%360)+360)%360;
 if(![0,90,180,270].includes(rotation))throw Error('Unsupported page rotation.');
 const rotated=rotation===90||rotation===270,dw=rotated?box.height:box.width,dh=rotated?box.width:box.height;
 if(!(dw>0&&dh>0))throw Error('Invalid PDF page dimensions.');
 const width=Math.max(360,dw),height=Math.max(480,dh),margin=24;
 const titleLines=first?wrap('PY Maths – '+title,bold,13,width-2*margin):[];
 const headers=sourceLines(q).flatMap(line=>wrap(line,font,9,width-2*margin));
 if(src.getPageCount()>1)headers.push('Question page '+(n+1)+' of '+src.getPageCount());
 const top=margin+titleLines.length*17+(titleLines.length?10:0)+headers.length*13+16;
 if(top>height*.45)throw Error('Source metadata or title is too long to fit the header.');
 const page=out.addPage([width,height]);let y=height-margin;
 for(const text of titleLines){page.drawText(text,{x:margin,y:y-13,font:bold,size:13,color:lib.rgb(.075,.306,.29)});y-=17;}if(titleLines.length)y-=10;
 for(const text of headers){page.drawText(text,{x:margin,y:y-9,font,size:9,color:lib.rgb(.2,.25,.23)});y-=13;}
 page.drawLine({start:{x:margin,y:y-5},end:{x:width-margin,y:y-5},thickness:.6,color:lib.rgb(.72,.79,.75)});
 const embedded=await out.embedPage(original,{left:box.x,bottom:box.y,right:box.x+box.width,top:box.y+box.height});
 const scale=Math.min(1,(width-2*margin)/dw,(height-top-margin)/dh),w=box.width*scale,h=box.height*scale;
 let x=(width-dw*scale)/2,y0=height-top-dh*scale;
 if(rotation===90)y0+=w;else if(rotation===180){x+=w;y0+=h;}else if(rotation===270)x+=h;
 page.drawPage(embedded,{x,y:y0,width:w,height:h,rotate:lib.degrees(-rotation)});first=false;
 }
 }catch(error){throw Error('Could not include '+q.examBoard+' '+q.paperCode+' · '+series(q)+' · Question '+q.question+': '+error.message);}}
 return out.save();
}
async function loadQuestion(q){if(!root.ExamCore.safePath(q.questionFile,'exams/questions/'))throw Error('Invalid question PDF path.');const url=new URL(q.questionFile,document.baseURI);if(url.origin!==location.origin)throw Error('Question PDF must be hosted on this site.');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);try{const response=await fetch(url,{signal:controller.signal,redirect:'error'});if(!response.ok)throw Error('PDF request returned HTTP '+response.status+'.');const data=new Uint8Array(await response.arrayBuffer());if(data.length>80*1024*1024)throw Error('Question PDF exceeds 80 MB.');return data;}finally{clearTimeout(timer);}}
const api={Basket,series,sourceLines,filename,wrap,build,loadQuestion};if(typeof module!=='undefined')module.exports=api;else root.ExamPractice=api;
})(globalThis);
