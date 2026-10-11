"""Reconcile all newly imported Foundation totals with the original question PDFs."""
import json,re,unittest
from pathlib import Path
import pdfplumber
ROOT=Path(__file__).resolve().parents[1]
PLAN=json.loads((ROOT/'tools/exams/foundation-bank-plan.json').read_text())
class FoundationBankTests(unittest.TestCase):
 def test_source_numbering_and_marks(self):
  for paper in PLAN:
   totals={}
   with pdfplumber.open(ROOT/paper['sourceFile']) as doc:
    for page in doc.pages:
     for n,m in re.findall(r'Total for Question (\d+) is (\d+) mark',page.extract_text() or ''):
      self.assertNotIn(int(n),totals);totals[int(n)]=int(m)
   self.assertEqual(totals,{int(q['record']['question']):q['record']['marks'] for q in paper['questions']},paper['sourceFile'])
   self.assertEqual(sum(totals.values()),80)
 def test_required_thin_lines_and_construction_space(self):
  items={q['record']['id']:q for p in PLAN for q in p['questions']}
  line=items['edexcel-1ma1-2f-2024-june-q7']['compact']
  self.assertTrue(any(s['top']<=169.4<=s['bottom'] for s in line))
  construction=items['edexcel-1ma1-3f-2020-november-q17']['compact']
  self.assertTrue(any(s['top']<=212 and s['bottom']>=399 for s in construction))
 def test_all_source_pages_and_answer_segments_are_retained(self):
  for p in PLAN:
   for q in p['questions']:
    self.assertEqual(sorted(set(s['page']+1 for s in q['compact'])),q['record']['sourcePages'])
    self.assertEqual([s['page']+1 for s in q['working']],q['record']['sourcePages'])
    self.assertTrue(q['answers'])
    for s in q['answers']:
     self.assertGreater(s['bottom'],s['top']);self.assertLess(s['headerTop'],s['headerBottom'])
if __name__=='__main__':unittest.main()
