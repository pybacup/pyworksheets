"""Build auditable official-answer crop coordinates from pdfplumber inspection caches.
No answer text is generated: the companion exporter embeds the original PDF regions.
"""
import argparse,json,re,pathlib,hashlib
parser=argparse.ArgumentParser(); parser.add_argument('cache'); args=parser.parse_args(); cache=pathlib.Path(args.cache)
all_records=json.loads(pathlib.Path('exams/data/exam-index.json').read_text(encoding='utf-8'))
records={q['id']:q for q in all_records if q['qualification']=='GCSE Maths' and q['tier']=='Higher'}
def clusters(values,tol=.8):
 out=[]
 for x in sorted(values):
  if not out or x-out[-1][-1]>tol:out.append([x])
  else:out[-1].append(x)
 return [sum(g)/len(g) for g in out]
plan=[]; issues=[]
for paper in json.loads((cache/'papers.json').read_text()):
 stem=pathlib.Path(paper['sourceFile']).stem; pages=json.loads((cache/(stem+'.json')).read_text(encoding='utf-8'))
 identity=f"edexcel-1ma1-{paper['paper']}h-{paper['year']}-{paper['series'].lower()}"
 # Confirm the official cover itself, not just the archive filename.
 cover=' '.join(p['text'] for p in pages[:2]); assert str(paper['year']) in cover,(stem,'cover year')
 assert '1MA1' in cover and re.search(r'Paper\s*'+str(paper['paper'])+'H',cover,re.I),(stem,'cover code')
 assert ('summer' if paper['series']=='June' else 'november') in cover.lower(),(stem,'cover series')
 questions={}; current=None; seen=[]; table_pages=[]
 for p in pages:
  if re.search('Modifications to the mark scheme|Modified Large Print',p['text'],re.I):break
  hs=[v for v in p['words'] if v['text']=='Question' and v['top']<180]
  if not hs:continue
  h=hs[0]; headerwords=[v for v in p['words'] if abs(v['top']-h['top'])<5]
  if not any(v['text']=='Answer' for v in headerwords):continue
  table_pages.append(p['number'])
  cols=clusters(e['x0'] for e in p['edges'] if e['orientation']=='v' and e['top']<=h['top']+4<=e['bottom'] and e['bottom']-e['top']>3)
  raw_cols=cols; cols=clusters(raw_cols,12); cols[0]=raw_cols[0]; cols[-1]=raw_cols[-1]
  assert len(cols)>=5,(stem,p['number'],cols)
  left,right=cols[0],cols[-1]
  rules=clusters(e['top'] for e in p['edges'] if e['orientation']=='h' and e['x0']<=left+1 and e['x1']>=left+12)
  ht=max(y for y in rules if y<=h['top']+1)
  hb=min(y for y in rules if y>=h['top']+5)
  bottom=max(e['bottom'] for e in p['edges'] if e['orientation']=='v' and abs(e['x0']-left)<1 and e['bottom']>hb)
  nums=[v for v in p['words'] if h['x0']-8<=v['x0']<h['x0']+25 and hb<=v['top']<bottom and re.fullmatch(r'\d{1,2}',v['text'])]
  starts=[]
  for v in nums:
   number=int(v['text']); top=max(y for y in rules if y<=v['top']+1)
   if starts and starts[-1][0]==number and abs(top-starts[-1][1])<1:continue
   starts.append((number,top));seen.append(number)
  if not starts or starts[0][1]>hb+10:
   content=[c for c in p['chars'] if c['text'].strip() and left<=c['x0']<=right and hb<c['top']<(starts[0][1] if starts else bottom)]
   if content:
    assert current is not None,(stem,p['number'],'unassigned continuation'); starts.insert(0,(current,hb))
  markword=next(v for v in headerwords if v['text']=='Mark')
  cx=(markword['x0']+markword['x1'])/2; ml=max(x for x in cols if x<cx);mr=min(x for x in cols if x>cx)
  guidance=next((v for v in headerwords if v['text']=='Additional'),None)
  gl=max(x for x in cols if x<guidance['x0']) if guidance else None
  for i,(number,top) in enumerate(starts):
   end=starts[i+1][1] if i+1<len(starts) else bottom
   assert end>top,(stem,p['number'],number,top,end)
   current=number; chars=[c for c in p['chars'] if c['text'].strip() and left-1<=c['x0']<=right+1 and top-.2<=c['top']<end-.5]
   assert chars,(stem,p['number'],number,'empty')
   # Start with the full row; the raster audit trims only genuinely blank trailing space.
   segment=dict(sourcePage=p['number'],left=round(left-.15,3),right=round(right+.15,3),top=round(top,3),bottom=round(end,3),headerTop=round(ht,3),headerBottom=round(hb,3),tableColumns=[round(x,3) for x in raw_cols],guidanceLeft=gl,textBottom=max(c['bottom'] for c in chars))
   words=[v for v in p['words'] if ml<v['x0']<mr and top<=v['top']<end]
   segment['markCodes']=[v['text'] for v in words if re.fullmatch(r'[PMABC]\d',v['text'])]
   key=identity+'-q'+str(number)
   assert key in records,(key,'not in question bank')
   questions.setdefault(key,dict(id=key,question=number,marks=records[key]['marks'],segments=[]))['segments'].append(segment)
 expected=[q for q in records.values() if q['paperNumber']==paper['paper'] and q['examYear']==paper['year'] and q['series']==paper['series']]
 assert set(questions)=={q['id'] for q in expected},(stem,'question mismatch',set(questions)^{q['id'] for q in expected},seen)
 unique=[n for i,n in enumerate(seen) if i==0 or n!=seen[i-1]]
 assert unique==list(range(1,len(questions)+1)),(stem,unique)
 for q in questions.values():
  q['rawMarkTotal']=sum(int(code[1:]) for s in q['segments'] for code in s['markCodes'])
  if q['rawMarkTotal']!=q['marks']:issues.append((q['id'],q['marks'],q['rawMarkTotal']))
 paper.update(questions=list(questions.values()),standardTablePages=table_pages)
 plan.append(paper)
pathlib.Path('tools/exams/gcse-answer-plan.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
(cache/'mark-checks.json').write_text(json.dumps(issues,indent=2))
print('Questions',sum(len(p['questions']) for p in plan),'segments',sum(len(q['segments']) for p in plan for q in p['questions']))
print('Mark totals needing review',len(issues));print(issues)





