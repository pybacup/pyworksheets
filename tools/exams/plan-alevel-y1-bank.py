"""Plan original OCR regions from cached geometry. No rewritten mathematical content."""
import json,pathlib,re,sys,hashlib,collections
cache=pathlib.Path(sys.argv[1]); root=pathlib.Path(__file__).resolve().parents[2]
sources=json.loads((cache/'sources.json').read_text()); boundaries=json.loads((cache/'boundary-review.json').read_text())
labels=json.loads((root/'tools/exams/alevel-y1-classifications.json').read_text())
baseline=json.loads((cache/'baseline-index.json').read_text()); plan={'baseline':baseline,'papers':[]}; issues=[]
def region(kind,pi,top,bottom,p):
 return dict(source=kind,page=pi+1,left=40 if kind=='markScheme' else 44,right=min(p['width']-40,802) if kind=='markScheme' else 551,top=round(top,2),bottom=round(bottom,2))
def content(p,lo,hi):
 return [w for w in p['words'] if 40<w['x0']<p['width']-35 and lo<=w['top']<hi]
def groups(parts,limit=710):
 out=[]
 for part in parts:
  if not out or sum(x['bottom']-x['top']+6 for x in out[-1])+part['bottom']-part['top']>limit:out.append([])
  out[-1].append(part)
 return out
for key,bounds in boundaries.items():
 year,paper=map(int,key.split('-')); series={2020:'November',2021:'Autumn'}.get(year,'June'); count=len(bounds['question'])
 assert count==len(labels[key]),(key,count,len(labels[key]))
 ps={kind:json.loads((cache/'inspection'/f'{key}-{kind}.json').read_text()) for kind in sources[key]}
 qp={n:[] for n in range(1,count+1)}; marks={}
 starts=bounds['question']
 for i,start in enumerate(starts):
  n=start['question']; nxt=starts[i+1] if i+1<count else None; words=[]
  for pi in range(start['page']-1,(nxt['page'] if nxt else len(ps['question']))):
   p=ps['question'][pi]; lo=start['top']-8 if pi==start['page']-1 else 58
   hi=nxt['top']-8 if nxt and pi==nxt['page']-1 else 775
   end=[l['top'] for l in p['lines'] if 'END OF QUESTION PAPER' in l['text']]
   if end:hi=min(hi,end[0]-4)
   ws=content(p,lo,hi)
   if not ws:continue
   if all(re.search('BLANK PAGE|PLEASE DO NOT WRITE',w['text']) for w in ws):continue
   # Blank/copyright pages after the final question are never question content.
   if pi>start['page']-1 and any('Copyright' in l['text'] or 'BLANK PAGE' in l['text'] for l in p['lines']):
    if not any(re.fullmatch(r'\[\d+\]',w['text']) for w in ws):continue
   bottom=max(w['bottom'] for w in ws)+5
   qp[n].append(region('question',pi,lo,min(hi,bottom),p));words.extend(ws)
  ms=[int(v) for w in words for v in re.findall(r'\[(\d+)\]',w['text'])];marks[n]=sum(ms)
  if not ms:issues.append([key,n,'no question marks found'])
 ab={n:[] for n in qp}; current=None
 for pi,p in enumerate(ps['answerBooklet']):
  if pi==0:continue
  here=[s for s in bounds['answerBooklet'] if s['page']==pi+1 and s['question']<=count]
  if not here:continue
  unique=[]
  for s in here:
   if not unique or unique[-1]['question']!=s['question']:unique.append(s)
  for i,s in enumerate(unique):
   top=s['top']-8;bottom=unique[i+1]['top']-6 if i+1<len(unique) else 769
   ab[s['question']].append(region('answerBooklet',pi,top,bottom,p))
 ans={n:[] for n in qp};current=None; appendix=False; appendix_current=None
 for pi,p in enumerate(ps['markScheme']):
  text='\n'.join(l['text'] for l in p['lines'])
  if 'APPENDIX' in text:appendix=True
  if any(s in text for s in ['Need to get in touch?','OCR Customer Contact Centre','Call us on']):continue
  if appendix:
   headings=[]
   for l in p['lines']:
    m=re.search(r'Exemplar responses for Q(\d+)',l['text'])
    if m:headings.append((int(m[1]),l['top']-3))
   if not headings and appendix_current:headings=[(appendix_current,58)]
   for i,(n,lo) in enumerate(headings):
    hi=headings[i+1][1] if i+1<len(headings) else p['height']-40;ws=content(p,lo,hi)
    if ws:ans[n].append([region('markScheme',pi,lo,max(w['bottom'] for w in ws)+4,p)])
    appendix_current=n
   continue
  here=[s for s in bounds['markScheme'] if s['page']==pi+1 and s['question']<=count]
  hs=[w for w in p['words'] if w['text']=='Question' and w['top']<400]
  if current is None and not here:continue
  lo=min(h['top']-4 for h in hs) if hs else 58
  footer=[w['top']-2 for w in p['words'] if re.fullmatch(r'\d{1,2}',w['text']) and p['width']*.45<w['x0']<p['width']*.55 and w['top']>p['height']-75]
  hi=min(footer) if footer else p['height']-40; unique=[]
  for s in here:
   if not unique or unique[-1]['question']!=s['question']:unique.append(s)
  if unique and current and unique[0]['question']!=current:
   between=content(p,lo,unique[0]['top']-8)
   between=[w for w in between if w['text'] not in ['Question','Answer','Marks','AO','AOs','Guidance']]
   if between:unique.insert(0,dict(question=current,top=lo+8))
  elif not unique and current:
   ws=content(p,lo,hi)
   if not ws:continue
   unique=[dict(question=current,top=lo+8)]
  for i,s in enumerate(unique):
   n=s['question'];top=lo if i==0 else s['top']-8;bottom=unique[i+1]['top']-8 if i+1<len(unique) else hi
   ws=content(p,top,bottom)
   if not ws:continue
   allowed_bottom=bottom
   bottom=min(bottom,max(w['bottom'] for w in ws)+5)
   figures=[v for v in p['graphics'] if v['top']>=top and v['bottom']<=allowed_bottom and v['x0']>120 and v['x1']<802 and v['x1']-v['x0']>15 and v['bottom']-v['top']>15]
   if figures:bottom=min(allowed_bottom,max(bottom,max(v['bottom'] for v in figures)+3))
   ans[n].append([region('markScheme',pi,top,bottom,p)]);current=n
 # Essential original booklet figures, without the surrounding ruled answer boxes.
 extras={
 '2018-01':{11:[(12,195,445,370,440)]},
 '2018-02':{2:[(2,130,510,278,375)]},
 '2019-01':{6:[(5,120,535,110,240)]},
 '2019-02':{6:[(5,110,540,282,478)]},
 '2020-01':{5:[(5,150,540,74,171)]},
 '2021-01':{9:[(10,160,540,88,382)]},
 '2022-02':{7:[(6,175,505,90,715)]},
 '2023-01':{11:[(12,185,500,105,260)]},
 '2023-02':{12:[(10,105,540,312,348)]},
 '2025-02':{6:[(4,130,510,200,535)],15:[(11,130,510,460,750)]}
 }.get(key,{})
 for n,figures in extras.items():
  for page,left,right,top,bottom in figures:qp[n].append(dict(source='answerBooklet',page=page,left=left,right=right,top=top,bottom=bottom))
 # Supply the official gravity convention for independent Mechanics practice.
 if paper==1:
  cover=ps['question'][0]
  lines=[l for l in cover['lines'] if 'acceleration due' in l['text'] or '9.8' in l['text']]
  for n,label in enumerate(labels[key],1):
   if label.startswith('M|') and lines:
    qp[n].insert(0,region('question',0,min(l['top'] for l in lines)-2,max(l['bottom'] for l in lines)+2,cover))
 records=[]
 for n in qp:
  assert ab[n] and ans[n],(key,n,'missing variant')
  broad,*subs=labels[key][n-1].split('|');id=f'ocr-mei-h630-{paper:02}-{year}-{series.lower()}-q{n}'
  folder=f'a-level-maths/year-1/ocr-mei/p{paper}'
  rec=dict(id=id,qualification='A-Level Maths',yearGroup='Year 1',examBoard='OCR MEI',paper=f'P{paper}',paperNumber=paper,paperCode=f'H630/{paper:02}',component='Pure Mathematics and '+('Mechanics' if paper==1 else 'Statistics'),examYear=year,series=series,question=str(n),marks=marks[n],topic={'P':'Pure','M':'Mechanics','S':'Statistics'}[broad],subtopic=subs[0],subtopics=subs,questionFile=f'exams/questions/{folder}/{id}.pdf',workingQuestionFile=f'exams/questions/{folder}/working-space/{id}.pdf',answerFile=f'exams/answers/{folder}/{id}.pdf',sourceFile=sources[key]['question'],sourcePages=sorted({v['page'] for v in qp[n]}),answerBookletFile=sources[key]['answerBooklet'],answerBookletPages=sorted({v['page'] for v in ab[n]}),answerSourceFile=sources[key]['markScheme'],answerSourcePages=sorted({v['page'] for g in ans[n] for v in g}))
  records.append(dict(record=rec,compact=groups(qp[n]),working=groups([v for v in qp[n] if v['source']=='question']+ab[n]),answers=ans[n]))
 total=sum(marks.values())
 if total!=70:issues.append([key,'marks total',total,marks])
 plan['papers'].append(dict(key=key,sources=sources[key],sourceHashes={k:hashlib.sha256((root/v).read_bytes()).hexdigest() for k,v in sources[key].items()},questions=records))
 print(key,count,total)
(cache/'draft-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
(cache/'planning-issues.json').write_text(json.dumps(issues,indent=2))
print('Issues:',issues)
