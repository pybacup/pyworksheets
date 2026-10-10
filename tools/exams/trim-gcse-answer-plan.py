"""Trim blank table tails using source ink as well as text; preserve diagrams.
The approved pilot coordinates are reused verbatim and its PDFs are never replaced.
"""
import json,pathlib,argparse,math
import numpy as np
import pypdfium2 as pdfium
parser=argparse.ArgumentParser();parser.add_argument('cache');args=parser.parse_args();cache=pathlib.Path(args.cache)
path=pathlib.Path('tools/exams/gcse-answer-plan.json');plan=json.loads(path.read_text());pilot=json.loads(pathlib.Path('tools/exams/june-2024-p1-answer-plan.json').read_text())
reviews={}
for ident,expected,raw in json.loads((cache/'mark-checks.json').read_text()):
 note='Complete alternative marking routes retained; route totals are not added together.'
 if ident.endswith('1h-2024-november-q9'):note='Part (a): 3 marks; part (b): two alternative 3-mark methods. Total remains 6.'
 if ident.endswith('2h-2019-june-q20'):note='Part (a): 2 marks; part (b): two alternative 4-mark methods. Total remains 6.'
 if ident.endswith('3h-2023-june-q21'):note='Official final A1 code is extracted as separate A and 1 tokens; visual check confirms fourth mark.'
 reviews[ident]=note
for paper in plan:
 pages=json.loads((cache/(pathlib.Path(paper['sourceFile']).stem+'.json')).read_text());doc=pdfium.PdfDocument(paper['sourceFile']);rasters={}
 for q in paper['questions']:
  if q['id'] in reviews:q['markReview']=reviews[q['id']]
  q['answerFile']=f"exams/answers/gcse/higher/p{paper['paper']}/{q['id']}.pdf"
  if paper['sourceFile']==pilot['sourceFile']:
   s=next(v for v in pilot['questions'] if v['id']==q['id']);q['segments']=[{k:s[k] for k in ['sourcePage','left','right','top','bottom','headerTop','headerBottom']}];q['approvedPilot']=True;continue
  for s in q['segments']:
   number=s['sourcePage'];p=pages[number-1]
   if number not in rasters:
    page=doc[number-1];rasters[number]=np.asarray(page.render(scale=2).to_pil().convert('L'))<190;page.close()
   ink=rasters[number].copy();original_bottom=s['bottom'];s['rowBottom']=original_bottom
   # Remove table-rule pixels from the whitespace detector, not from output PDFs.
   for x in s['tableColumns']:ink[:,max(0,math.floor((x-1)*2)):math.ceil((x+1)*2)]=False
   for e in p['edges']:
    if e['orientation']=='h' and e['x1']-e['x0']>25:
     yy=round(e['top']*2)
     ink[max(0,yy-2):yy+3,max(0,math.floor(e['x0']*2)):math.ceil(e['x1']*2)]=False
   l=math.ceil((s['left']+1)*2);r=math.floor((s['right']-1)*2);t=math.ceil((s['top']+1)*2);b=math.floor((s['bottom']-1)*2)
   rows=np.where(ink[t:b,l:r].sum(axis=1)>3)[0]
   lastink=(t+int(rows[-1])+1)/2 if len(rows) else s['top']
   # Non-text linework may finish below words; never trim it away.
   s['bottom']=round(min(original_bottom,max(s['textBottom'],lastink)+3),3)
   gl=s['guidanceLeft']
   if gl:
    chars=[c for c in p['chars'] if c['text'].strip() and c['x0']>=gl+1 and s['top']<=c['top']<original_bottom]
    pixels=ink[t:b,math.ceil((gl+1)*2):r].sum()
    if not chars and pixels<8:s['right']=round(gl+.15,3);s['emptyGuidanceOmitted']=True
   assert s['bottom']>s['top'] and s['right']>s['left']
   # Every non-whitespace source glyph in this question is retained.
   for c in p['chars']:
    if c['text'].strip() and s['left']<=c['x0']<=paper.get('tableRight',1000) and s['top']+.1<=c['top']<original_bottom-.5:
     assert c['bottom']<=s['bottom']+3,(q['id'],'bottom clips text',c)
     assert c['x1']<=s['right']+.8,(q['id'],'right clips text',c)
 print(pathlib.Path(paper['sourceFile']).stem,'trimmed',flush=True)
 doc.close()
path.write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
print('All crops checked for source-text preservation; diagrams included in ink bounds.')

