import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ukresults import parse_results, time_to_seconds


def page(row, header="Pos,Num,M,F,Name,Cat,CatPos,Club,Time"):
    cells = ''.join(f'<th>{h}</th>' for h in header.split(','))
    return f'<table><tr><td>unrelated</td></tr></table><table id="pikefell"><tr>{cells}</tr><tr>{row}</tr></table>'


class ParserTests(unittest.TestCase):
    def test_real_column_structure_and_entities(self):
        row = ''.join(f'<td>{value}</td>' for value in ['1','9','&nbsp;','001','<b>Test Runner</b>','F40','1','A &amp; B','00:34:31'])
        results, _ = parse_results(page(row))
        self.assertEqual(results[0]['time_seconds'], 2071)
        self.assertEqual(results[0]['gender'], 'F')
        self.assertEqual(results[0]['club'], 'A & B')
        self.assertEqual(results[0]['name'], 'Test Runner')

    def test_times(self):
        self.assertEqual(time_to_seconds('34:21'), 2061)
        self.assertEqual(time_to_seconds('01:47:28'), 6448)
        for value in ['00:60:01','DNF','34.21','-01:23']:
            with self.assertRaises(ValueError): time_to_seconds(value)

    def test_reject_changed_or_incomplete_source(self):
        for html in ['<html>Unavailable</html>', page('<td>1</td>'), page('', 'Position,Name')]:
            with self.assertRaises(ValueError): parse_results(html)

    def test_invalid_time_does_not_get_silently_skipped(self):
        row = ''.join(f'<td>{value}</td>' for value in ['1','9','001','','Test','MS','1','Club','DNF'])
        with self.assertRaisesRegex(ValueError, 'table row 2'): parse_results(page(row))


if __name__ == '__main__':
    unittest.main()
