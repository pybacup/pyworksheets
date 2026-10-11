"""Plan Year 2 official source regions, preserving the approved 2025 H640/03 pilot."""
import pathlib,json,re,sys,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2];cache=pathlib.Path(sys.argv[1]);sources=json.loads((cache/'sources.json').read_text());bounds=json.loads((cache/'boundary-review.json').read_text());labels=json.loads((ROOT/'tools/exams/alevel-y2-classifications.json').read_text(encoding='utf-8-sig'));baseline=json.loads((cache/'baseline-index.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
plan=dict(baselineCount=len(baseline),baselineSHA256=sha(json.dumps(baseline,ensure_ascii=False,separators=(',',':')).encode()),papers=[]);issues=[]
def region(kind,page,top,bottom,p,left=None,right=None):return dict(source=kind,page=page+1,left=left if left is not None else (35 if kind=='markScheme' else 44),right=right if right is not None else (p['width']-35 if kind=='markScheme' else 551),top=round(top,2),bottom=round(bottom,2))
def words(p,lo,hi):return [w for w in p['words'] if 35<w['x0']<p['width']-25 and lo<=w['top']<hi]
def tight(p,lo,hi):
 ws=words(p,lo,hi);bottom=max((w['bottom']+5 for w in ws),default=lo)
 gs=[g for g in p['graphics'] if lo<=g['top'] and g['bottom']<=hi and 60<g['x0'] and g['x1']<p['width']-25 and g['bottom']-g['top']>15 and g['x1']-g['x0']>15]
 return min(hi,max(bottom,max((g['bottom']+3 for g in gs),default=lo)))
def groups(parts):
 out=[]
 for p in parts:
  if not out or sum(v['bottom']-v['top']+6 for v in out[-1])+p['bottom']-p['top']>710:out.append([])
  out[-1].append(p)
 return out
# Manually verified image-only 2020 booklet question blocks, including all continuations.
manual={
'2020-01':{1:[(2,86,428)],2:[(2,428,769)],3:[(3,64,292)],4:[(3,292,769)],5:[(4,64,769),(5,64,201)],6:[(5,201,769)],7:[(6,86,769)],8:[(7,64,769)],9:[(8,64,769)],10:[(9,64,769),(10,64,383)],11:[(10,383,769),(11,64,769)],12:[(12,64,769),(13,64,769)],13:[(14,64,769),(15,64,769)],14:[(16,64,769),(17,64,769)],15:[(18,64,769),(19,64,769)]},
'2020-02':{1:[(2,86,428)],2:[(2,428,769)],3:[(3,64,473)],4:[(3,473,702)],5:[(4,64,451)],6:[(4,451,769)],7:[(5,64,769)],8:[(6,86,769),(7,64,655)],9:[(7,655,769),(8,64,769)],10:[(9,64,769),(10,64,405)],11:[(10,405,769),(11,64,769)],12:[(12,64,769),(13,64,769)],13:[(14,64,769)],14:[(15,64,769)],15:[(16,64,611)]},
'2020-03':{1:[(2,86,315)],2:[(2,315,769)],3:[(3,64,428)],4:[(3,428,769)],5:[(4,64,769),(5,64,769)],6:[(6,64,769),(7,64,769)],7:[(8,64,769),(9,64,769)],8:[(10,64,769),(11,64,769),(12,64,769)],9:[(13,125,759)],10:[(14,63,324)],11:[(14,350,560)],12:[(14,585,738),(15,64,769)]}}
# Visually checked booklet-only figures. QP figures already preserved are not duplicated.
figure_regions={
 '2020-03':[(5,5,120,540,218,593)],
 '2021-01':[(8,8,175,445,395,598),(10,10,190,510,222,424)],
 '2021-03':[(5,4,175,345,344,511),(5,4,175,345,571,738)],
 '2022-02':[(3,3,44,551,84,427),(6,5,85,551,131,381),(16,18,95,551,75,420)],
 '2022-03':[(7,9,135,500,184,565)],
 '2023-01':[(8,7,100,540,92,293)],
 '2023-03':[(9,13,95,551,64,269)],
 '2024-02':[(4,3,110,535,140,437)],
 '2024-03':[(10,8,190,465,90,418)],
 '2025-01':[(1,2,175,530,133,383)],
 '2025-02':[(4,3,175,540,466,759),(7,5,175,465,94,291)]}
figures=[dict(key=k,question=n,page=pg,left=x0,right=x1,top=t,bottom=b) for k,rs in figure_regions.items() for n,pg,x0,x1,t,b in rs]
for key,src in sorted(sources.items()):
 if key=='2025-03':continue
 year,paper=map(int,key.split('-'));series={2020:'November',2021:'Autumn'}.get(year,'June');count=len(bounds[key]['question']);assert count==len(labels[key]),(key,count,len(labels[key]));ps={kind:json.loads((cache/'inspection'/f'{key}-{kind}.json').read_text()) for kind in src}
 starts=bounds[key]['question'];starttops=[]
 for start in starts:
  p=ps['question'][start['page']-1];prior=[w['bottom'] for w in p['words'] if re.fullmatch(r'\[\d+\]',w['text']) and w['top']<start['top']-12]
  top=max(58,start['top']-32,max(prior,default=0)+5)
  headers=[l['bottom']+3 for l in p['lines'] if re.match(r'(Section [AB] \(|Answer all the questions)',l['text']) and top<=l['top']<start['top']]
  if headers:top=max(top,max(headers))
  starttops.append(top)
 qp={};marks={};section_b=None
 for pi,p in enumerate(ps['question']):
  section=[l['top'] for l in p['lines'] if re.search(r'Section B.*15 marks',l['text'])]
  if section:
   section_b=next((s['question'] for s in starts if (s['page']-1,s['top'])>(pi,min(section))),None)
 for i,start in enumerate(starts):
  n=start['question'];nxt=starts[i+1] if i+1<count else None;parts=[];allwords=[]
  for pi in range(start['page']-1,nxt['page'] if nxt else len(ps['question'])):
   p=ps['question'][pi];lo=starttops[i] if pi==start['page']-1 else 58;hi=starttops[i+1] if nxt and pi==nxt['page']-1 else 798
   stop=[l['top']-4 for l in p['lines'] if any(t in l['text'] for t in ['END OF QUESTION PAPER','Section B (','Section A (','Answer all the questions']) and l['top']>=lo and (pi!=start['page']-1 or l['top']>start['top']+5)]
   if stop:hi=min(hi,min(stop))
   if hi<=lo:continue
   ws=words(p,lo,hi)
   if not ws:continue
   text=' '.join(w['text'] for w in ws)
   if any(t in text for t in ['Copyright','OCR is committed','BLANK PAGE','PLEASE DO NOT WRITE']):continue
   bottom=tight(p,lo,hi)
   if bottom<=lo:continue
   parts.append(region('question',pi,lo,bottom,p));allwords+=ws
  qp[n]=parts;marks[n]=sum(int(v) for w in allwords for v in re.findall(r'\[(\d+)\]',w['text']))
 assert sum(marks.values())==(75 if paper==3 else 100),(key,marks)
 if paper==3:assert section_b and sum(marks[n] for n in marks if n>=section_b)==15,(key,section_b,marks)
 ab={n:[] for n in qp}
 if key in manual:
  for n,parts in manual[key].items():ab[n]=[region('answerBooklet',pg-1,lo,hi,ps['answerBooklet'][pg-1]) for pg,lo,hi in parts]
 else:
  for pi,p in enumerate(ps['answerBooklet']):
   if pi==0:continue
   here=[s for s in bounds[key]['answerBooklet'] if s['page']==pi+1 and 1<=s['question']<=count];unique=[]
   for s in here:
    if not unique or unique[-1]['question']!=s['question']:unique.append(s)
   for i,s in enumerate(unique):
    lo=s['top']-8;hi=unique[i+1]['top']-8 if i+1<len(unique) else 769
    endnotes=[l['top']-6 for l in p['lines'] if any(v in l['text'] for v in ['ADDITIONAL ANSWER SPACE','EXTRA ANSWER SPACE','Copyright Information']) and l['top']>lo]
    if endnotes:hi=min(hi,min(endnotes))
    # For Section B, start at the repeated full question wording, not its later answer-box label.
    if paper==3 and s['question']>=section_b:
     starts_text=[w['top'] for w in p['words'] if w['text']==str(s['question']) and w['x0']<62 and 58<w['top']<=s['top']]
     if starts_text:lo=min(starts_text)-8
    ab[s['question']].append(region('answerBooklet',pi,lo,hi,p))
 ans={n:[] for n in qp};current=None;appendix=False;appendix_current=None
 for pi,p in enumerate(ps['markScheme']):
  text='\n'.join(l['text'] for l in p['lines'])
  if any(s in text for s in ['Need to get in touch?','OCR Customer Contact Centre','Call us on','Copyright Information']):continue
  headings=[]
  for l in p['lines']:
   match=re.search(r'(?:Exemplar responses for Q|Exemplars for |Question )(\d+)',l['text'])
   if not match:match=re.match(r'^Q(\d+)(?:[a-ziv]*|\([a-ziv]+\))?\.\s',l['text'])
   if match:headings.append((int(match[1]),l['top']-3))
  if 'APPENDIX' in text or headings:appendix=True
  if appendix:
   if not headings and appendix_current:headings=[(appendix_current,58)]
   for i,(n,lo) in enumerate(headings):
    if n not in ans:continue
    hi=headings[i+1][1] if i+1<len(headings) else p['height']-60;ws=words(p,lo,hi)
    if ws:ans[n].append([region('markScheme',pi,lo,tight(p,lo,hi),p)])
    appendix_current=n
   continue
  here=[s for s in bounds[key]['markScheme'] if s['page']==pi+1 and 1<=s['question']<=count];hs=[w for w in p['words'] if w['text']=='Question' and w['top']<400]
  if current is None and not here:continue
  if key=='2019-01' and 'Due to the error on the paper' in text:current=None
  lo=min((h['top']-4 for h in hs),default=58)
  footer=[w['top']-2 for w in p['words'] if re.fullmatch(r'\d{1,2}',w['text']) and .45*p['width']<w['x0']<.55*p['width'] and w['top']>p['height']-75]
  hi=min(footer) if footer else p['height']-40;unique=[]
  for s in here:
   if not unique or unique[-1]['question']!=s['question']:unique.append(s)
  if unique and current and unique[0]['question']!=current:
   between=[w for w in words(p,lo,unique[0]['top']-8) if w['text'] not in ['Question','Answer','Marks','AO','AOs','Guidance']]
   if between:unique.insert(0,dict(question=current,top=lo+8))
  elif not unique and current:
   if not words(p,lo,hi):continue
   unique=[dict(question=current,top=lo+8)]
  for i,s in enumerate(unique):
   n=s['question'];top=lo if i==0 else s['top']-8;bottom=unique[i+1]['top']-8 if i+1<len(unique) else hi
   if i:
    headers=[h['top']-4 for h in hs if unique[i-1]['top']+20<h['top']<top]
    if headers:top=max(headers)
   headers=[h['top']-4 for h in hs if top+20<h['top']<bottom]
   if headers:bottom=min(headers)
   if bottom<=top or not words(p,top,bottom):continue
   ans[n].append([region('markScheme',pi,top,tight(p,top,bottom),p)]);current=n
 extras={n:[] for n in qp}
 for f in figures:
  if f['key']!=key:continue
  if f['question'] not in qp:continue
  pg=f['page']-1;extras[f['question']].append(region('answerBooklet',pg,max(58,f['top']),min(769,f['bottom']),ps['answerBooklet'][pg],max(44,f['left']),min(551,f['right'])))
 if paper==1:
  cover=ps['question'][0];ls=[l for l in cover['lines'] if 'acceleration due' in l['text'] or '9.8' in l['text']]
  for n,label in enumerate(labels[key],1):
   if label.startswith('M|') and ls:qp[n].insert(0,region('question',0,min(l['top'] for l in ls)-2,max(l['bottom'] for l in ls)-1,cover))
 material=None
 if paper==3:
  mid=f'ocr-mei-h640-03-{year}-{series.lower()}-insert';insertparts=[]
  for pi,p in enumerate(ps['insert']):
   if pi==0 or any('Copyright' in l['text'] or 'BLANK PAGE' in l['text'] for l in p['lines']):continue
   ws=words(p,58,798)
   if len(ws)<20:continue
   insertparts.append([region('insert',pi,58,tight(p,58,798),p,35,570)])
  assert len(insertparts)==2,(key,'insert pages',len(insertparts))
  title=next((l['text'] for l in ps['insert'][1]['lines'] if l['top']>58 and not re.fullmatch(r'\d+',l['text'])),'H640/03 article')
  material=dict(metadata=dict(id=mid,title=title,file=f'exams/questions/a-level-maths/year-2/ocr-mei/p3/inserts/{mid}.pdf',sourceFile=src['insert'],sourcePages=[p[0]['page'] for p in insertparts]),regions=insertparts)
 records=[]
 for n in qp:
  if not ab[n] or not ans[n]:issues.append([key,n,'missing variant']);continue
  broad,*subs=labels[key][n-1].split('|');id=f'ocr-mei-h640-{paper:02}-{year}-{series.lower()}-q{n}';folder=f'a-level-maths/year-2/ocr-mei/p{paper}'
  rec=dict(id=id,qualification='A-Level Maths',yearGroup='Year 2',examBoard='OCR MEI',paper=f'P{paper}',paperNumber=paper,paperCode=f'H640/{paper:02}',component='Pure Mathematics and '+{1:'Mechanics',2:'Statistics',3:'Comprehension'}[paper],examYear=year,series=series,question=str(n),marks=marks[n],topic={'P':'Pure','M':'Mechanics','S':'Statistics'}[broad],subtopic=subs[0],subtopics=subs,questionFile=f'exams/questions/{folder}/{id}.pdf',workingQuestionFile=f'exams/questions/{folder}/working-space/{id}.pdf',answerFile=f'exams/answers/{folder}/{id}.pdf',sourceFile=src['question'],sourcePages=sorted({p['page'] for p in qp[n] if p['source']=='question'}),answerBookletFile=src['answerBooklet'],answerBookletPages=sorted({p['page'] for p in ab[n]}),answerSourceFile=src['markScheme'],answerSourcePages=sorted({p['page'] for g in ans[n] for p in g}))
  if paper==3:rec['section']='B' if n>=section_b else 'A'
  if paper==3 and n>=section_b:rec['requiredMaterials']=[material['metadata']];rec['contextTags']=['Comprehension']
  records.append(dict(record=rec,compact=groups(qp[n]+extras[n]),working=groups(([] if paper==3 and n>=section_b else qp[n])+ab[n]),answers=ans[n]))
 plan['papers'].append(dict(key=key,sources=src,sourceHashes={k:sha((ROOT/v).read_bytes()) for k,v in src.items()},questions=records,material=material));print(key,count,sum(marks.values()),'B',section_b,flush=True)
(cache/'draft-plan.json').write_text(json.dumps(plan,indent=2,ensure_ascii=False)+'\n',encoding='utf-8');(cache/'planning-issues.json').write_text(json.dumps(issues,indent=2));print('Issues',issues)

