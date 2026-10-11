"""Compare every new Foundation PDF region with its official source at 144 dpi."""
import argparse
import json
from pathlib import Path
import numpy as np
import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFilter

parser=argparse.ArgumentParser()
parser.add_argument('--report',required=True)
parser.add_argument('--ids',help='JSON array of question IDs to inspect')
parser.add_argument('--visual',help='Directory for flagged source/output comparisons')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[2]
plan=json.loads((ROOT/'tools/exams/foundation-bank-plan.json').read_text())
results=[]
selected=set(json.loads(Path(args.ids).read_text())) if args.ids else None
def compare(a,b,label):
    original_a,original_b=a,b
    a=np.asarray(a.resize(b.size))
    b=np.asarray(b)
    def expand(x):
        return np.asarray(Image.fromarray((x*255).astype('uint8')).filter(ImageFilter.MaxFilter(5)))>0
    interior=(slice(5,-5),slice(5,-5))
    # Thin grey grids antialias differently after fractional-point translation.
    # Require visible ink to have nearby ink, rather than comparing identical
    # hard thresholds (which falsely report complete, unchanged grey grids).
    missing=float(((a<230)&~expand(b<250))[interior].sum()/max(1,(a[interior]<230).sum()))
    extra=float(((b<230)&~expand(a<250))[interior].sum()/max(1,(b[interior]<230).sum()))
    results.append(dict(id=label,missingInkRatio=missing,extraInkRatio=extra))
    if args.visual and max(missing,extra)>.03:
        dest=Path(args.visual);dest.mkdir(parents=True,exist_ok=True)
        canvas=Image.new('RGB',(max(original_a.width,original_b.width)*2,max(original_a.height,original_b.height)+30),'white')
        canvas.paste(original_a,(0,30));canvas.paste(original_b,(canvas.width//2,30))
        ImageDraw.Draw(canvas).text((5,5),label+'   SOURCE LEFT / EXTRACT RIGHT',fill='black')
        canvas.save(dest/(label.replace(':','_')+'.png'))
def crop(im,coords):
    return im.crop(tuple(round(v*2) for v in coords))
for paper in plan:
    docs={k:pdfium.PdfDocument(ROOT/paper[f]) for k,f in [('question','sourceFile'),('answer','markSchemeFile')]}
    rasters={}
    def source(kind,n):
        if (kind,n) not in rasters:
            p=docs[kind][n];p.set_cropbox(*p.get_mediabox())
            rasters[kind,n]=p.render(scale=2).to_pil().convert('L');p.close()
        return rasters[kind,n]
    for q in paper['questions']:
        if selected is not None and q['record']['id'] not in selected:continue
        for mode,key in [('compact','questionFile'),('working','workingQuestionFile'),('answers','answerFile')]:
            doc=pdfium.PdfDocument(ROOT/q['record'][key]);images={}
            def output(n):
                if n not in images:
                    p=doc[n];images[n]=p.render(scale=2).to_pil().convert('L');p.close()
                return images[n]
            positions=[]
            if mode=='compact':
                groups=[]
                for s in q[mode]:
                    if s.get('keepPrevious') and groups:groups[-1].append(s)
                    else:groups.append([s])
                n=0;offset=4;height=0
                for group in groups:
                    h=sum(s['bottom']-s['top']+6 for s in group)
                    if height and height+h>720:n+=1;offset=4;height=0
                    for s in group:
                        positions.append((s,n,3,offset));offset+=s['bottom']-s['top']+6
                    height+=h
            else:
                positions=[(s,n,0,s['headerBottom']-s['headerTop']+1 if mode=='answers' else 0) for n,s in enumerate(q[mode])]
            for i,(s,n,x,y) in enumerate(positions):
                kind='answer' if mode=='answers' else 'question'
                pn=s['sourcePage']-1 if mode=='answers' else s['page']
                original=source(kind,pn)
                if mode=='compact':
                    original=original.copy();draw=ImageDraw.Draw(original)
                    for m in q['masks']:
                        if m['page']==pn:draw.rectangle(tuple(v*2 for v in [m['left'],m['top'],m['right'],m['bottom']]),fill=255)
                expected=crop(original,[s['left'],s['top'],s['right'],s['bottom']])
                actual=crop(output(n),[x,y,x+s['right']-s['left'],y+s['bottom']-s['top']])
                compare(expected,actual,f"{q['record']['id']}:{mode}:{i}")
                if mode=='answers':
                    compare(crop(original,[s['left'],s['headerTop'],s['right'],s['headerBottom']]),crop(output(n),[0,0,s['right']-s['left'],s['headerBottom']-s['headerTop']]),f"{q['record']['id']}:header:{i}")
            doc.close()
    for d in docs.values():d.close()
    print(Path(paper['sourceFile']).stem,flush=True)
failures=[r for r in results if max(r['missingInkRatio'],r['extraInkRatio'])>.03]
Path(args.report).write_text(json.dumps(dict(regions=len(results),failures=failures,worst=sorted(results,key=lambda r:max(r['missingInkRatio'],r['extraInkRatio']),reverse=True)[:25]),indent=2))
print('Compared',len(results),'regions;',len(failures),'failures.')
assert not failures,failures[:20]
