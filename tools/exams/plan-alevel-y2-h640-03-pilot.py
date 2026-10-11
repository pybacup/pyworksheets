"""June 2025 H640/03 only: plan original OCR regions from a pilot geometry cache."""
import json,pathlib,re,sys,hashlib
root=pathlib.Path(__file__).resolve().parents[2];cache=pathlib.Path(sys.argv[1]);sources=json.loads((cache/'sources.json').read_text())
pages={k:json.loads((cache/f'{k}.json').read_text()) for k in sources}
baseline=json.loads((cache/'baseline-index.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
labels=[
 ['Binomial expansion'],['Composite functions','Domains of functions'],['Straight line graphs','Coordinate geometry'],
 ['Geometric series'],['Iteration','Exponentials and logarithms','Graphs of functions'],['Differentiation','Exponentials and logarithms'],
 ['Exponentials and logarithms','Modelling','Geometric sequences','Differentiation'],['Differentiation','Differentiation from first principles'],
 ['Differentiation','Inverse functions'],['Vectors','Surds'],['Proof','Surds'],
 ['Inequalities','Graphs of functions','Comprehension'],['Trigonometry','Trigonometric identities','Comprehension'],
 ['Parametric equations','Trigonometry','Algebraic manipulation','Comprehension']]
def region(kind,pi,lo,hi,left=44,right=None):
 return dict(source=kind,page=pi+1,left=left,right=right or (802 if kind=='markScheme' else 551),top=round(lo,2),bottom=round(hi,2))
def content(p,lo,hi):return [w for w in p['words'] if 40<w['x0']<p['width']-35 and lo<=w['top']<hi]
def trimmed(p,lo,hi):
 ws=content(p,lo,hi);assert ws
 end=max(w['bottom'] for w in ws)+5
 gs=[g for g in p['graphics'] if g['top']>=lo and g['bottom']<=hi and g['x0']>120 and g['x1']<p['width']-40 and g['x1']-g['x0']>15 and g['bottom']-g['top']>15]
 return min(hi,max(end,max((g['bottom']+3 for g in gs),default=0)))
def groups(parts):
 out=[]
 for p in parts:
  if not out or sum(v['bottom']-v['top']+6 for v in out[-1])+p['bottom']-p['top']>710:out.append([])
  out[-1].append(p)
 return out
starts=[];nextq=1
for pi,p in enumerate(pages['question']):
 for w in p['words']:
  if w['text']==str(nextq) and w['x0']<62 and 58<w['top']<770:
   starts.append((nextq,pi,w['top']-10));nextq+=1
assert nextq==15
qp={};marks={}
for i,(n,pi,lo) in enumerate(starts):
 next=starts[i+1] if i+1<len(starts) else None;parts=[];words=[]
 for page in range(pi,(next[1]+1 if next else 9)):
  p=pages['question'][page];top=lo if page==pi else 58;bottom=next[2] if next and page==next[1] else 770
  end=[l['top'] for l in p['lines'] if 'END OF QUESTION PAPER' in l['text']]
  if end:bottom=min(bottom,end[0]-4)
  ws=content(p,top,bottom)
  if not ws:continue
  parts.append(region('question',page,top,trimmed(p,top,bottom)));words.extend(ws)
 qp[n]=parts;marks[n]=sum(int(v) for w in words for v in re.findall(r'\[(\d+)\]',w['text']))
# A vector's bracket starts above its question number; exclude it from Q9.
qp[9][0]['bottom']=179
qp[10][0]['top']=199
# Section B introduction on the next page is not part of Q11.
qp[11]=[p for p in qp[11] if p['page']==8]
assert sum(marks.values())==75,marks
assert sum(marks[n] for n in range(1,12))==60
ab={n:[] for n in qp}
for pi,p in enumerate(pages['answerBooklet']):
 if pi<2 or pi>=19:continue
 nums=[]
 for w in p['words']:
  m=re.fullmatch(r'(\d{1,2})(?:\([a-zivx]+\))*',w['text'])
  if m and 45<w['x0']<100 and 60<w['top']<770 and 1<=int(m[1])<=14:
   n=int(m[1]);
   if not nums or nums[-1][0]!=n:nums.append((n,w['top']-10))
 for i,(n,lo) in enumerate(nums):
  hi=nums[i+1][1]+2 if i+1<len(nums) else 769
  ab[n].append(region('answerBooklet',pi,lo,hi))
ans={n:[] for n in qp};current=None
for pi in range(11,31):
 p=pages['markScheme'][pi];hs=[w for w in p['words'] if w['text']=='Question' and w['top']<180]
 lo=min((w['top']-4 for w in hs),default=58)
 foot=[w['top']-2 for w in p['words'] if re.fullmatch(r'\d{1,2}',w['text']) and .45*p['width']<w['x0']<.55*p['width'] and w['top']>p['height']-75]
 hi=min(foot) if foot else p['height']-40;nums=[]
 for w in p['words']:
  if re.fullmatch(r'\d{1,2}',w['text']) and 45<w['x0']<65 and lo<w['top']<hi and 1<=int(w['text'])<=14:
   n=int(w['text'])
   if not nums or nums[-1][0]!=n:nums.append((n,w['top']-10))
 if nums and current and nums[0][0]!=current:
  prior=[w for w in content(p,lo,nums[0][1]) if w['text'] not in ['Question','Answer','Marks','AO','Guidance']]
  if prior:nums.insert(0,(current,lo))
 if not nums and current:nums=[(current,lo)]
 for i,(n,top) in enumerate(nums):
  if i==0:top=lo
  else:
   preceding=[w['top']-4 for w in p['words'] if w['text']=='Question' and nums[i-1][1]+20<w['top']<top]
   if preceding:top=max(preceding)
  bottom=nums[i+1][1] if i+1<len(nums) else hi
  # A new table header belongs to the following question, not this extract.
  headers=[w['top']-4 for w in p['words'] if w['text']=='Question' and top+20<w['top']<bottom]
  if headers:bottom=min(headers)
  if not content(p,top,bottom):continue
  ans[n].append([region('markScheme',pi,top,trimmed(p,top,bottom),40)]);current=n
for n,page in [(5,32),(6,33),(11,34)]:
 p=pages['markScheme'][page-1];ws=content(p,58,p['height']-70)
 ans[n].append([region('markScheme',page-1,58,max(w['bottom'] for w in ws)+5,40)])
extra={3:[region('answerBooklet',3,80,356,188,472)],5:[region('answerBooklet',6,66,420,128,533)],14:[region('answerBooklet',17,238,496,174,472)]}
insertFile='exams/questions/a-level-maths/year-2/ocr-mei/p3/inserts/ocr-mei-h640-03-2025-june-insert.pdf'
material=dict(id='ocr-mei-h640-03-2025-june-insert',title='The trisectrix of Maclaurin',file=insertFile,sourceFile=sources['insert'],sourcePages=[2,3])
questions=[]
for n in qp:
 id=f'ocr-mei-h640-03-2025-june-q{n}';folder='a-level-maths/year-2/ocr-mei/p3'
 rec=dict(id=id,qualification='A-Level Maths',yearGroup='Year 2',examBoard='OCR MEI',paper='P3',paperNumber=3,paperCode='H640/03',component='Pure Mathematics and Comprehension',examYear=2025,series='June',section='A' if n<=11 else 'B',question=str(n),marks=marks[n],topic='Pure',subtopic=labels[n-1][0],subtopics=labels[n-1],questionFile=f'exams/questions/{folder}/{id}.pdf',workingQuestionFile=f'exams/questions/{folder}/working-space/{id}.pdf',answerFile=f'exams/answers/{folder}/{id}.pdf',sourceFile=sources['question'],sourcePages=sorted({p['page'] for p in qp[n]}),answerBookletFile=sources['answerBooklet'],answerBookletPages=sorted({p['page'] for p in ab[n]}),answerSourceFile=sources['markScheme'],answerSourcePages=sorted({p['page'] for g in ans[n] for p in g}))
 if n>=12:rec['requiredMaterials']=[material];rec['contextTags']=['Comprehension']
 assert ab[n] and ans[n]
 questions.append(dict(record=rec,compact=groups(qp[n]+extra.get(n,[])),working=groups((qp[n] if n<=11 else [])+ab[n]),answers=ans[n]))
plan=dict(baselineCount=len(baseline),baselineSHA256=sha(json.dumps(baseline,ensure_ascii=False,separators=(',',':')).encode()),sources=sources,sourceHashes={k:sha((root/v).read_bytes()) for k,v in sources.items()},questions=questions,material=dict(metadata=material,regions=[[region('insert',1,58,748)],[region('insert',2,58,548)]]))
plan_path=root/'tools/exams/alevel-y2-june-2025-h640-03-plan.json'
if plan_path.exists():
 old=json.loads(plan_path.read_text(encoding='utf-8-sig'))
 for q,prior in zip(plan['questions'],old['questions']):
  for mode in ['compact','working','answers']:
   if mode+'SHA256' in prior:q[mode+'SHA256']=prior[mode+'SHA256']
 if 'SHA256' in old['material']:plan['material']['SHA256']=old['material']['SHA256']
plan_path.write_text(json.dumps(plan,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('14 questions / 75 marks; Section A60 / B15; shared insert original pages2–3')
print('Question marks',marks);print('Answer pages',{q['record']['question']:q['record']['answerSourcePages'] for q in questions})
