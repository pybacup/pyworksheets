import pathlib,json,re,sys
cache=pathlib.Path(sys.argv[1]);sources=json.loads((cache/'sources.json').read_text());report={};summary=[]
for key,src in sorted(sources.items()):
 p={};question_count=0
 for kind in ['question','answerBooklet','markScheme']:
  file=cache/'inspection'/f'{key}-{kind}.json'
  if not file.exists():continue
  pages=json.loads(file.read_text());result=[];nextq=1;current=0;in_table=False
  for pi,page in enumerate(pages):
   words=page['words'];hs=[w for w in words if w['text']=='Question' and w['top']<400]
   if hs:in_table=True
   if kind=='markScheme' and not in_table:continue
   for w in words:
    match=re.fullmatch(r'(\d{1,2})(?:\([a-zA-Zivx]+\))*',w['text'])
    if not match:continue
    n=int(match[1]);x=w['x0'];y=w['top']
    if not 58<y<min(780,page['height']-30):continue
    if kind=='question':
     if x>=62 or n!=nextq:continue
     nextq+=1
    elif kind=='answerBooklet':
     if not 40<x<100:continue
    else:
     if not 40<x<86 or (hs and y<hs[0]['bottom']):continue
    if kind!='question':
     if any(v['x0']<x-2 and abs(v['top']-y)<3 for v in words):continue
     if n not in (current,current+1):continue
     current=n
    result.append(dict(question=n,page=pi+1,top=round(y,2),left=round(x,2)))
  p[kind]=result
 report[key]=p
 if len(p)==3:
  count=len(p['question']);summary.append((key,count,sorted(set(range(1,count+1))-{v['question'] for v in p['answerBooklet']}),sorted(set(range(1,count+1))-{v['question'] for v in p['markScheme']})))
(cache/'boundary-review.json').write_text(json.dumps(report,indent=2));print(summary)
# Compact readable per-question source text; no rewritten content.
for key,p in report.items():
 if 'question' not in p:continue
 pages=json.loads((cache/'inspection'/f'{key}-question.json').read_text());out=[]
 for i,start in enumerate(p['question']):
  nxt=p['question'][i+1] if i+1<len(p['question']) else None;lines=[]
  for pi in range(start['page']-1,(nxt['page'] if nxt else len(pages))):
   lo=start['top']-12 if pi==start['page']-1 else 58;hi=nxt['top']-12 if nxt and pi==nxt['page']-1 else 795
   lines += [l['text'] for l in pages[pi]['lines'] if lo<=l['top']<hi and not any(v in l['text'] for v in ['BLANK PAGE','Copyright','END OF QUESTION PAPER'])]
  out.append('Q'+str(start['question'])+' '+' / '.join(lines))
 (cache/f'{key}-questions.txt').write_text('\n'.join(out),encoding='utf-8')
