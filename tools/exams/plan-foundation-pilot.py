"""Reviewed June 2024 Foundation P1 pilot boundaries; never processes other papers."""
import json,re,hashlib
from pathlib import Path
import pdfplumber
root=Path(__file__).resolve().parents[2]
source='exams/source/gcse/foundation/p1/edexcel-1ma1-1f-2024-june.pdf'
ms='exams/source/gcse/foundation/mark-schemes/p1/edexcel-1ma1-1f-2024-june-ms.pdf'
# MediaBox points, measured from the top. These bands were checked against the source render.
content={1:[(2,178,196)],2:[(2,279,298)],3:[(2,379,489)],4:[(2,563,625)],5:[(2,706,725)],6:[(3,88,207)],7:[(4,88,715)],8:[(5,88,279),(5,399,417)],9:[(6,88,185),(6,274,291),(6,409,426)],10:[(7,88,144)],11:[(7,365,385),(7,443,466),(7,568,617)],12:[(8,88,261)],13:[(9,88,153),(9,231,334)],14:[(10,88,108)],15:[(11,88,256),(11,333,352),(11,453,521)],16:[(12,88,297)],17:[(13,88,108)],18:[(13,380,403)],19:[(14,88,458)],20:[(14,581,655)],21:[(15,88,127),(15,399,640)],22:[(16,88,393),(17,86,145)],23:[(18,88,307),(18,405,452)],24:[(19,88,146),(19,387,421)],25:[(20,88,471),(20,601,645)],26:[(21,88,248)],27:[(22,88,154)],28:[(22,379,417)]}
N='Number';A='Algebra';G='Geometry and Measures';R='Ratio, Proportion and Rates of Change';S='Statistics';P='Probability'
labels={1:(N,['Rounding']),2:(N,['Percentages']),3:(G,['Angle facts']),4:(N,['Ordering fractions, decimals and percentages']),5:(N,['Powers and roots']),6:(N,['Four operations']),7:(S,['Bar charts']),8:(G,['Angle facts']),9:(A,['Function machines']),10:(R,['Simplifying ratios']),11:(N,['Four operations','Laws of indices','Order of operations']),12:(G,['Perimeter']),13:(P,['Basic probability']),14:(N,['Four operations']),15:(S,['Stem-and-leaf diagrams','Median','Range']),16:(R,['Best buys']),17:(A,['Linear equations with brackets']),18:(N,['Laws of indices']),19:(G,['Translations']),20:(A,['Arithmetic sequences']),21:(N,['Mixed numbers']),22:(G,['Area','Unit rates']),23:(P,['Venn diagrams']),24:(N,['Estimation']),25:(A,['Equation of a straight line','Parallel and perpendicular lines']),26:(R,['Combining ratios','Percentages']),27:(N,['Reverse percentages']),28:(A,['Linear inequalities'])}
questions=[]
with pdfplumber.open(root/source) as doc:
 cover=doc.pages[0].extract_text();assert '1MA1/1F' in cover and 'Foundation' in cover and '16 May 2024' in cover
 totals={}
 for pn,p in enumerate(doc.pages,1):
  for line in p.extract_text_lines():
   match=re.search(r'Total for Question (\d+) is (\d+) mark',line['text'])
   if match:totals[int(match[1])]=(pn,int(match[2]),line['top']-1,line['bottom']+2)
 assert set(totals)==set(range(1,29)) and sum(x[1] for x in totals.values())==80
 for number,bands in content.items():
  pn,marks,tt,tb=totals[number]; pages=list(dict.fromkeys(b[0] for b in bands)); compact=[];working=[]
  for page in pages:
   spans=[(t,b) for p,t,b in bands if p==page];start=min(t for t,b in spans)
   end=tb if page==pn else 805
   words=doc.pages[page-1].extract_words()
   markbands=[(v['top']-1,v['bottom']+2) for v in words if v['x0']>500 and start<=v['top']<end and re.fullmatch(r'\([1-9]\)',v['text'])]
   spans+=markbands
   if page==pn:spans.append((tt,tb))
   merged=[]
   for t,b in sorted(spans):
    if merged and t<=merged[-1][1]+4:merged[-1][1]=max(b,merged[-1][1])
    else:merged.append([t,b])
   compact += [dict(page=page,left=68,right=585,top=round(t,3),bottom=round(b,3)) for t,b in merged]
   working.append(dict(page=page,left=68,right=585,top=start,bottom=round(end,3)))
  topic,subs=labels[number];topics=[topic]
  if number==22:topics.append(R)
  if number==26:topics.append(N)
  identity=f'edexcel-1ma1-1f-2024-june-q{number}'
  record=dict(id=identity,qualification='GCSE Maths',tier='Foundation',examBoard='Pearson Edexcel',paper='P1',paperNumber=1,paperCode='1MA1/1F',examYear=2024,series='June',examDate='2024-05-16',question=str(number),marks=marks,topic=topic,topics=topics,subtopic=subs[0],subtopics=subs,questionFile=f'exams/questions/gcse/foundation/p1/{identity}.pdf',sourceFile=source,sourcePages=pages,workingQuestionFile=f'exams/questions/gcse/foundation/working/p1/{identity}.pdf',answerFile=f'exams/answers/gcse/foundation/p1/{identity}.pdf')
  questions.append(dict(record=record,compact=compact,working=working,answers=[]))
def clusters(values,tol=.8):
 out=[]
 for x in sorted(values):
  if not out or x-out[-1][-1]>tol:out.append([x])
  else:out[-1].append(x)
 return [sum(v)/len(v) for v in out]
with pdfplumber.open(root/ms) as doc:
 assert 'Foundation (Non-Calculator) Paper 1F' in doc.pages[0].extract_text()
 seen=[]
 for pn,p in enumerate(doc.pages,1):
  if pn<6 or pn>21:continue
  words=p.extract_words();h=next(v for v in words if v['text']=='Question' and v['top']<180)
  cols=clusters(e['x0'] for e in p.edges if e['orientation']=='v' and e['top']<=h['top']+4<=e['bottom'] and e['bottom']-e['top']>3)
  left,right=cols[0],cols[-1]
  rules=clusters(e['top'] for e in p.edges if e['orientation']=='h' and e['x0']<=left+1 and e['x1']>=left+12)
  ht=max(y for y in rules if y<=h['top']+1);hb=min(y for y in rules if y>=h['top']+5)
  bottom=max(e['bottom'] for e in p.edges if e['orientation']=='v' and abs(e['x0']-left)<1 and e['bottom']>hb)
  nums=[v for v in words if h['x0']-8<=v['x0']<h['x0']+25 and hb<=v['top']<bottom and re.fullmatch(r'\d{1,2}',v['text'])]
  starts=[(int(v['text']),max(y for y in rules if y<=v['top']+1)) for v in nums]
  for i,(n,top) in enumerate(starts):
   end=starts[i+1][1] if i+1<len(starts) else bottom
   chars=[c for c in p.chars if c['text'].strip() and left<=c['x0']<=right and top<=c['top']<end-.5]
   # Every diagram in this pilot sits above its final marking text; retain the complete body up to that text.
   end=min(end,max(c['bottom'] for c in chars)+4)
   questions[n-1]['answers'].append(dict(page=pn,left=round(left-.15,3),right=round(right+.15,3),top=round(top,3),bottom=round(end,3),headerTop=round(ht,3),headerBottom=round(hb,3)))
   seen.append(n)
 assert seen==list(range(1,29)),seen
plan=dict(sourceFile=source,markSchemeFile=ms,sourceSHA256=hashlib.sha256((root/source).read_bytes()).hexdigest(),markSchemeSHA256=hashlib.sha256((root/ms).read_bytes()).hexdigest(),questions=questions)
(root/'tools/exams/foundation-june-2024-p1-plan.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
print('Planned 28 questions / 80 marks, 29 working-space pages, 28 official answers.')
