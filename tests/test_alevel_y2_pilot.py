"""Focused H640/03 pilot checks only; no whole-bank rendering."""
import unittest,json,re,pathlib
import pdfplumber
ROOT=pathlib.Path(__file__).resolve().parents[1]
PLAN=json.loads((ROOT/'tools/exams/alevel-y2-june-2025-h640-03-plan.json').read_text(encoding='utf-8-sig'))
class Pilot(unittest.TestCase):
 def test_sources_and_marks(self):
  for kind,file in PLAN['sources'].items():
   with pdfplumber.open(ROOT/file) as pdf:
    cover=pdf.pages[0].extract_text()
    self.assertIn('H640/03',cover);self.assertIn('2025',cover)
    if kind=='answerBooklet':self.assertIn('Printed Answer Booklet',cover)
    if kind=='insert':self.assertIn('Insert',cover)
  with pdfplumber.open(ROOT/PLAN['sources']['question']) as pdf:
   for q in PLAN['questions']:
    words=[]
    for group in q['compact']:
     for part in group:
      if part['source']!='question':continue
      words.extend(pdf.pages[part['page']-1].crop((part['left'],part['top'],part['right'],part['bottom'])).extract_words())
    marks=sum(int(n) for w in words for n in re.findall(r'\[(\d+)\]',w['text']))
    self.assertEqual(marks,q['record']['marks'],q['record']['id'])
 def test_variants_and_continuations(self):
  for q in PLAN['questions']:
   for mode,key in [('compact','questionFile'),('working','workingQuestionFile'),('answers','answerFile')]:
    with pdfplumber.open(ROOT/q['record'][key]) as pdf:self.assertEqual(len(pdf.pages),len(q[mode]))
   if int(q['record']['question'])>=12:self.assertTrue(all(p['source']=='answerBooklet' for g in q['working'] for p in g))
  self.assertEqual(PLAN['questions'][13]['record']['answerSourcePages'],[29,30,31])
  for n,page in [(5,32),(6,33),(11,34)]:self.assertIn(page,PLAN['questions'][n-1]['record']['answerSourcePages'])
  with pdfplumber.open(ROOT/PLAN['material']['metadata']['file']) as pdf:
   self.assertEqual(len(pdf.pages),2);text='\n'.join(p.extract_text() for p in pdf.pages)
   for term in ['trisectrix','Fig. C1','Fig. C2','parametric','cartesian']:self.assertIn(term,text)
if __name__=='__main__':unittest.main()

