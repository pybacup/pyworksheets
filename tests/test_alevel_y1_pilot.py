"""Focused pilot checks only; no repository-wide source-render audit."""
import json
import re
import unittest
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PLAN = json.loads((ROOT / 'tools/exams/alevel-y1-june-2025-h630-01-plan.json').read_text())

class PilotTests(unittest.TestCase):
    def test_source_numbering_marks_and_official_answers(self):
        with pdfplumber.open(ROOT / PLAN['sourceFile']) as qp, pdfplumber.open(ROOT / PLAN['markSchemeFile']) as ms:
            for item in PLAN['questions']:
                q = item['record']
                strips = [p for g in item['compact'] for p in g if p['source'] == 'question' and p['page'] > 1]
                text = '\n'.join(qp.pages[p['page']-1].crop((p['left'], p['top'], p['right'], p['bottom'])).extract_text() or '' for p in strips)
                self.assertRegex(text, r'(?m)^' + q['question'] + r'\s')
                marks = sum(map(int, re.findall(r'\[(\d+)\]', text)))
                self.assertEqual(marks, q['marks'])
                answer = '\n'.join(ms.pages[p['page']-1].crop((p['left'], p['top'], p['right'], p['bottom'])).extract_text() or '' for group in item['answers'] for p in group)
                self.assertRegex(answer, r'(?m)^' + q['question'] + r'\s')
                self.assertEqual(sum(map(int, re.findall(r'\[(\d+)\]', answer))), marks)

    def test_all_variants_and_sources_exist(self):
        for item in PLAN['questions']:
            for key in ['questionFile', 'workingQuestionFile', 'answerFile', 'sourceFile', 'answerBookletFile', 'answerSourceFile']:
                file = ROOT / item['record'][key]
                self.assertTrue(file.is_file(), str(file))
                self.assertTrue(file.read_bytes().startswith(b'%PDF'))

if __name__ == '__main__':
    unittest.main()
