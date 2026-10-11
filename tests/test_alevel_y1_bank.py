"""Focused source identity/numbering/marks checks; no source-render audit."""
import json,re,unittest,hashlib
from pathlib import Path
import pdfplumber
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
PLAN=json.loads((ROOT/'tools/exams/alevel-y1-bank-plan.json').read_text())
class BankTests(unittest.TestCase):
 def test_official_sources_and_question_numbering_marks(self):
  for paper in PLAN['papers']:
   sources={k:pdfplumber.open(ROOT/v) for k,v in paper['sources'].items()}
   try:
    r=paper['questions'][0]['record']
    for kind,doc in sources.items():
     cover=doc.pages[0].extract_text() or ''
     self.assertIn(r['paperCode'],cover.replace(' ','').replace('–','-'))
     self.assertIn(str(r['examYear']),cover)
     self.assertEqual(hashlib.sha256((ROOT/paper['sources'][kind]).read_bytes()).hexdigest(),paper['sourceHashes'][kind])
    for q in paper['questions']:
     r=q['record'];strips=[p for g in q['compact'] for p in g if p['source']=='question' and p['page']>1]
     text='\n'.join(sources['question'].pages[p['page']-1].crop((p['left'],p['top'],p['right'],p['bottom'])).extract_text() or '' for p in strips)
     self.assertRegex(text,r'(?m)^'+r['question']+r'\s')
     self.assertEqual(sum(map(int,re.findall(r'\[(\d+)\]',text))),r['marks'],r['id'])
     answer='\n'.join(sources['markScheme'].pages[p['page']-1].crop((p['left'],p['top'],p['right'],p['bottom'])).extract_text() or '' for g in q['answers'] for p in g)
     self.assertRegex(answer,r'(?m)^'+r['question']+r'\s',r['id'])
     self.assertTrue(any(p['source']=='answerBooklet' for g in q['working'] for p in g))
   finally:
    for doc in sources.values():doc.close()
 def test_all_552_new_variants_have_the_planned_pages(self):
  for paper in PLAN['papers']:
   for q in paper['questions']:
    for mode,field in [('compact','questionFile'),('working','workingQuestionFile'),('answers','answerFile')]:
     self.assertEqual(len(PdfReader(ROOT/q['record'][field]).pages),len(q[mode]))
if __name__=='__main__':unittest.main()
