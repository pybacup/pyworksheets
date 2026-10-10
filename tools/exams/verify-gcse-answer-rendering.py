"""Raster regression: every answer body must reproduce its official source region.
Uses a 2-pixel tolerance for fractional PDF coordinates and font rasterisation.
"""
import argparse,json,pathlib,math
import pypdfium2 as pdfium
import numpy as np
from PIL import Image,ImageFilter
parser=argparse.ArgumentParser();parser.add_argument('--report',required=True);args=parser.parse_args()
plan=json.loads(pathlib.Path('tools/exams/gcse-answer-plan.json').read_text());results=[]
for paper in plan:
 source=pdfium.PdfDocument(paper['sourceFile']);pages={}
 for q in paper['questions']:
  answer=pdfium.PdfDocument(q['answerFile'])
  for n,s in enumerate(q['segments']):
   number=s['sourcePage']
   if number not in pages:
    page=source[number-1];pages[number]=page.render(scale=2).to_pil().convert('L');page.close()
   original=pages[number].crop(tuple(round(v*2) for v in [s['left'],s['top'],s['right'],s['bottom']]))
   page=answer[n];rendered=page.render(scale=2).to_pil().convert('L');page.close();hh=s['headerBottom']-s['headerTop']
   actual=rendered.crop((0,round((hh+1)*2),round((s['right']-s['left'])*2),round((hh+1+s['bottom']-s['top'])*2)))
   original=original.resize(actual.size);expected=np.asarray(original)<180;got=np.asarray(actual)<180
   def expanded(mask):return np.asarray(Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.MaxFilter(5)))>0
   missing=float((expected&~expanded(got))[5:-5,5:-5].sum()/max(1,expected[5:-5,5:-5].sum()));extra=float((got&~expanded(expected))[5:-5,5:-5].sum()/max(1,got[5:-5,5:-5].sum()))
   results.append(dict(id=q['id'],page=n+1,missingInkRatio=missing,extraInkRatio=extra))
  answer.close()
 source.close();print(pathlib.Path(paper['sourceFile']).stem,flush=True)
failures=[r for r in results if max(r['missingInkRatio'],r['extraInkRatio'])>.03]
pathlib.Path(args.report).write_text(json.dumps(dict(pages=len(results),failures=failures,worst=sorted(results,key=lambda r:max(r['missingInkRatio'],r['extraInkRatio']),reverse=True)[:25]),indent=2))
print('Compared',len(results),'answer bodies against original source crops;',len(failures),'failures.')
assert not failures,failures
