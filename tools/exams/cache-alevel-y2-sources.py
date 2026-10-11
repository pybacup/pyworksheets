"""Preserve supplied Year 2 sources and cache PDF geometry for focused extraction."""
import pathlib,zipfile,re,json,hashlib,sys,concurrent.futures
import pdfplumber
ROOT=pathlib.Path(__file__).resolve().parents[2]
def inspect(job):
 key,kind,file,cache=job;dest=pathlib.Path(cache)/'inspection'/f'{key}-{kind}.json'
 if dest.exists():return key,kind,'cached'
 pages=[]
 with pdfplumber.open(ROOT/file) as pdf:
  for p in pdf.pages:
   graphics=[dict(x0=g['x0'],x1=g['x1'],top=g['top'],bottom=g['bottom']) for g in p.lines+p.rects+p.curves+p.images]
   pages.append(dict(width=p.width,height=p.height,rotation=p.rotation,words=p.extract_words(),lines=p.extract_text_lines(return_chars=False),graphics=graphics))
 dest.write_text(json.dumps(pages),encoding='utf-8');return key,kind,len(pages)
if __name__=='__main__':
 cache=pathlib.Path(sys.argv[1]);(cache/'inspection').mkdir(parents=True,exist_ok=True);sources={}
 for archive in sorted(ROOT.glob('*Year_2*.zip')):
  with zipfile.ZipFile(archive) as z:
   for name in z.namelist():
    if not name.lower().endswith('.pdf'):continue
    m=re.search(r'h640-(0[123])-(20\d\d)-(june|november)',name);assert m,name
    paper,year,series=m.groups();key=f'{year}-{paper}'
    kind='answerBooklet' if 'answer-booklet' in name else 'markScheme' if '-ms.pdf' in name else 'insert' if '-insert.pdf' in name else 'question'
    folder={'question':'','answerBooklet':'answer-booklets/','markScheme':'mark-schemes/','insert':'inserts/'}[kind]
    file='exams/source/a-level-maths/year-2/ocr-mei/'+folder+f'p{int(paper)}/'+pathlib.PurePosixPath(name).name
    dest=ROOT/file;data=z.read(name)
    if dest.exists():assert dest.read_bytes()==data,('source conflict',file)
    else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    sources.setdefault(key,{})[kind]=file
 assert len(sources)==24 and sum(len(v) for v in sources.values())==80
 for key,s in sources.items():assert set(s)==({'question','answerBooklet','markScheme','insert'} if key.endswith('03') else {'question','answerBooklet','markScheme'})
 (cache/'sources.json').write_text(json.dumps(sources,indent=2));baseline=cache/'baseline-index.json'
 if not baseline.exists():baseline.write_bytes((ROOT/'exams/data/exam-index.json').read_bytes())
 jobs=[(key,kind,file,str(cache)) for key,s in sources.items() for kind,file in s.items()]
 with concurrent.futures.ProcessPoolExecutor(max_workers=4) as pool:
  for result in pool.map(inspect,jobs):print(*result,flush=True)
