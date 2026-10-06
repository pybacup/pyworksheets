/* PDF adapter: vector clipping preserves original text and graphics. */
(function(root){
async function extract(source,row,lib){const out=await lib.PDFDocument.create();for(let n=+row.startPage;n<=+row.endPage;n++){const page=source.getPage(n-1);if(page.getRotation().angle%360!==0)throw Error('Rotated PDF pages are not supported in this version. Rotate and save the source PDF upright before importing.');const box=page.getCropBox();const top=n===+row.startPage?+row.top:0,bottom=n===+row.endPage?+row.bottom:100;const height=box.height*(bottom-top)/100;if(height<=0)throw Error('Empty crop on page '+n);const embedded=await out.embedPage(page,{left:box.x,right:box.x+box.width,bottom:box.y+box.height*(1-bottom/100),top:box.y+box.height*(1-top/100)});out.addPage([box.width,height]).drawPage(embedded,{x:0,y:0,width:box.width,height});}return out.save();}
if(typeof module!=='undefined')module.exports={extract};else root.ExamPDF={extract};
})(globalThis);
