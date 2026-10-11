"""Focused boundary review of cached OCR source geometry; does not modify PDFs/index."""
import json, pathlib, re, sys
cache=pathlib.Path(sys.argv[1]); sources=json.loads((cache/'sources.json').read_text())
report={}
for key in sources:
 if key=='2025-01': continue
 paper={}
 for kind in ['question','answerBooklet','markScheme']:
  pages=json.loads((cache/'inspection'/f'{key}-{kind}.json').read_text())
  result=[]; nextq=1; in_table=False
  for pi,p in enumerate(pages):
   words=p['words']; hs=[w for w in words if w['text']=='Question' and w['top']<400]
   if hs:in_table=True
   if kind=='markScheme' and not in_table:continue
   for w in words:
    match=re.fullmatch(r'(\d{1,2})(?:\([a-zA-Zivx]+\))*',w['text'])
    if not match:continue
    n=int(match[1]); x=w['x0']; y=w['top']
    if not 58<y<min(780,p['height']-30):continue
    if kind=='question':
     if x>=62 or n!=nextq:continue
     nextq+=1
    elif kind=='answerBooklet':
     if not 40<x<100:continue
    else:
     if not 45<x<86 or (hs and y<hs[0]['bottom']):continue
    result.append(dict(question=n,page=pi+1,top=round(y,2),left=round(x,2)))
  paper[kind]=result
 report[key]=paper
(cache/'boundary-review.json').write_text(json.dumps(report,indent=2))
for key,p in report.items():
 print(key, 'QP',[(v['question'],v['page']) for v in p['question']])
 print('MS',[(v['question'],v['page'],v['top']) for v in p['markScheme']])
 print('AB missing',sorted(set(range(1,len(p['question'])+1))-{v['question'] for v in p['answerBooklet']}))
