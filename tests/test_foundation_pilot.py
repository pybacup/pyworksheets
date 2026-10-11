"""Independent source/mark reconciliation and rendered-crop checks for the Foundation pilot."""
import json,re,unittest
from pathlib import Path
import pdfplumber,pypdfium2 as pdfium,numpy as np
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
PLAN=json.loads((ROOT/'tools/exams/foundation-june-2024-p1-plan.json').read_text())
class FoundationPilotTests(unittest.TestCase):
 def test_source_numbering_and_marks(self):
  totals={}
  with pdfplumber.open(ROOT/PLAN['sourceFile']) as d:
   for p in d.pages:
    for n,m in re.findall(r'Total for Question (\d+) is (\d+) mark',p.extract_text() or ''):totals[int(n)]=int(m)
  self.assertEqual(totals,{int(q['record']['question']):q['record']['marks'] for q in PLAN['questions']});self.assertEqual(sum(totals.values()),80)
 def test_official_mark_codes(self):
  with pdfplumber.open(ROOT/PLAN['markSchemeFile']) as d:
   for q in PLAN['questions']:
    s=q['answers'][0];words=d.pages[s['page']-1].extract_words();h=next(w for w in words if w['text']=='Mark' and w['top']<s['top'])
    codes=[w['text'] for w in words if h['x0']-4<=w['x0']<=h['x1']+4 and s['top']<=w['top']<s['bottom'] and re.fullmatch(r'[PMABC]\d',w['text'])]
    expected=q['record']['marks']*(2 if q['record']['question']=='26' else 1)
    self.assertEqual(sum(int(c[1:]) for c in codes),expected,q['record']['id'])
 def test_every_rendered_region_matches_original(self):
  # Render full MediaBoxes: question originals have printer CropBoxes offset by 28.3465pt.
  sources={};cache={};checks=0
  for kind,key in [('questions','sourceFile'),('answers','markSchemeFile')]:sources[kind]=pdfium.PdfDocument(ROOT/PLAN[key])
  def source_image(kind,n):
   if (kind,n) not in cache:
    p=sources[kind][n-1];box=p.get_mediabox();p.set_cropbox(*box);cache[kind,n]=p.render(scale=2).to_pil().convert('L');p.close()
   return cache[kind,n]
  def compare(expected,actual,label):
   expected=expected.resize(actual.size);a=np.asarray(expected)<180;b=np.asarray(actual)<180
   def dilate(x):return np.asarray(Image.fromarray((x*255).astype('uint8')).filter(ImageFilter.MaxFilter(5)))>0
   missing=(a&~dilate(b))[5:-5,5:-5].sum()/max(1,a[5:-5,5:-5].sum());extra=(b&~dilate(a))[5:-5,5:-5].sum()/max(1,b[5:-5,5:-5].sum())
   self.assertLess(max(missing,extra),.03,(label,float(missing),float(extra)))
  for q in PLAN['questions']:
   for mode,key in [('compact','questionFile'),('working','workingQuestionFile'),('answers','answerFile')]:
    d=pdfium.PdfDocument(ROOT/q['record'][key]);offset=0
    for i,s in enumerate(q[mode]):
     page=d[0 if mode=='compact' else i];im=page.render(scale=2).to_pil().convert('L');page.close()
     kind='answers' if mode=='answers' else 'questions';original=source_image(kind,s['page']);rect=[s['left'],s['top'],s['right'],s['bottom']]
     expected=original.crop(tuple(round(v*2) for v in rect));top=offset if mode=='compact' else s['headerBottom']-s['headerTop']+1 if mode=='answers' else 0
     actual=im.crop((0,round(top*2),round((s['right']-s['left'])*2),round((top+s['bottom']-s['top'])*2)))
     compare(expected,actual,(q['record']['id'],mode,i));checks+=1
     if mode=='compact':offset+=s['bottom']-s['top']+6
    d.close()
  for d in sources.values():d.close()
  print('Verified',checks,'rendered source regions across all 84 pilot PDFs.')
if __name__=='__main__':unittest.main()
