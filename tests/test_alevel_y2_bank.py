"""Focused Year 2 import checks. No raster/source-render audit."""
import hashlib,json,pathlib,re,unittest
import pdfplumber
from pypdf import PdfReader
ROOT=pathlib.Path(__file__).resolve().parents[1]
PLAN=json.loads((ROOT/'tools/exams/alevel-y2-bank-plan.json').read_text(encoding='utf-8'))
class Year2Bank(unittest.TestCase):
 def test_source_regions_and_marks(self):
  for paper in PLAN['papers']:
   with pdfplumber.open(ROOT/paper['sources']['question']) as pdf:
    for q in paper['questions']:
     count=0
     for group in q['compact']:
      for part in group:
       if part['source']=='question':
        words=pdf.pages[part['page']-1].crop((part['left'],part['top'],part['right'],part['bottom'])).extract_words()
        count+=sum(int(n) for w in words for n in re.findall(r'\[(\d+)\]',w['text']))
     self.assertEqual(count,q['record']['marks'],q['record']['id'])
 def test_pdf_variants_and_booklet_origin(self):
  for paper in PLAN['papers']:
   for q in paper['questions']:
    for mode,key in [('compact','questionFile'),('working','workingQuestionFile'),('answers','answerFile')]:
     reader=PdfReader(ROOT/q['record'][key]);self.assertEqual(len(reader.pages),len(q[mode]),q['record']['id'])
     for pg in reader.pages:self.assertGreater(float(pg.mediabox.width),0);self.assertGreater(float(pg.mediabox.height),0)
    self.assertTrue(any(p['source']=='answerBooklet' for g in q['working'] for p in g))
    self.assertTrue(all(p['source']=='markScheme' for g in q['answers'] for p in g))
    self.assertEqual(sorted({p['page'] for g in q['working'] for p in g if p['source']=='answerBooklet'}),q['record']['answerBookletPages'])
   if paper['material']:self.assertEqual(len(PdfReader(ROOT/paper['material']['metadata']['file']).pages),2)
 def test_discrepancy_and_extra_guidance_stay_with_correct_questions(self):
  p=next(p for p in PLAN['papers'] if p['key']=='2019-01');q=p['questions'][11]
  self.assertEqual(q['record']['marks'],6)
  with pdfplumber.open(ROOT/p['sources']['markScheme']) as pdf:
   text=' '.join(pdf.pages[r['page']-1].crop((r['left'],r['top'],r['right'],r['bottom'])).extract_text() or '' for g in q['answers'] for r in g)
   self.assertIn('Due to the error on the paper',text);self.assertIn('all candidates will get 4 marks',text)
  p=next(p for p in PLAN['papers'] if p['key']=='2024-03')
  for n in range(8,19):self.assertTrue(any(page>=30 for page in p['questions'][n-1]['record']['answerSourcePages']),n)
  self.assertFalse(any(page>=30 for page in p['questions'][2]['record']['answerSourcePages']))
if __name__=='__main__':unittest.main()
