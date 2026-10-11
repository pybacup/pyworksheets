"""Assemble reviewed Foundation source regions. Does not mutate the public index.

Usage: python plan-foundation-bank.py INSPECTION_DIRECTORY
The cache contains source inspection, reviewed labels and official answer boundaries.
The approved June 2024 P1 pilot is deliberately excluded.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
cache = Path(sys.argv[1])
read = lambda name: json.loads((cache / name).read_text(encoding='utf-8'))
papers = read('gcse-parsed.json')
crops = {q['id']: q for q in read('gcse-extraction-plan.json')}
labels = read('final-labels.json')
answers = read('answer-plan.json')
answer_papers = {Path(p['sourceFile']).stem.removesuffix('-ms'): p for p in answers}
result = []
for paper in papers:
    source = paper['file'].replace('\\', '/')
    stem = Path(source).stem
    assert stem != 'edexcel-1ma1-1f-2024-june'
    match = re.fullmatch(r'edexcel-1ma1-([123])f-(\d{4})-(june|november)', stem)
    number, year, series = int(match[1]), int(match[2]), match[3].title()
    ms = answer_papers[stem]
    by_number = {q['question']: q for q in ms['questions']}
    assert len(by_number) == len(paper['questions'])
    assert sum(q['marks'] for q in paper['questions']) == 80
    out = dict(sourceFile=source, sourceSHA256=hashlib.sha256((ROOT/source).read_bytes()).hexdigest(),
               markSchemeFile=ms['sourceFile'], markSchemeSHA256=ms['sourceSHA256'],
               paper=number, year=year, series=series, questions=[])
    for q in paper['questions']:
        ident = stem + '-q' + str(q['q'])
        crop, label, answer = crops[ident], labels[ident], by_number[q['q']]
        assert answer['id'] == ident and answer['marks'] == q['marks']
        record = dict(id=ident, qualification='GCSE Maths', tier='Foundation',
                      examBoard='Pearson Edexcel', paper='P'+str(number), paperNumber=number,
                      paperCode=f'1MA1/{number}F', examYear=year, series=series,
                      question=str(q['q']), marks=q['marks'],
                      **{k: label[k] for k in ['topic','subtopic','topics','subtopics']},
                      questionFile=f'exams/questions/gcse/foundation/p{number}/{ident}.pdf',
                      workingQuestionFile=f'exams/questions/gcse/foundation/working/p{number}/{ident}.pdf',
                      answerFile=f'exams/answers/gcse/foundation/p{number}/{ident}.pdf',
                      sourceFile=source, sourcePages=crop['sourcePages'])
        working = []
        for part in q['parts']:
            pg = paper['pages'][part['page']]
            top = part['top']
            for prev in paper['questions']:
                if prev['q'] < q['q'] and prev['page'] == part['page']:
                    top = max(top, prev['bottom']+3)
            # Match the first content band's start, avoiding examination instructions.
            bands = [s for s in crop['strips'] if s['page'] == part['page']]
            top = max(top, min(s['top'] for s in bands))
            working.append(dict(page=part['page'], left=38+pg['off'], right=558+pg['off'],
                                top=top, bottom=part['bottom']))
        out['questions'].append(dict(record=record, compact=crop['strips'], masks=crop['masks'],
                                     working=working, answers=answer['segments'],
                                     classificationEvidence=label['evidence'],
                                     markReview=answer.get('markReview', 'Official mark-code total matches question paper.')))
    result.append(out)
assert len(result) == 44
assert sum(len(p['questions']) for p in result) == 1232
(ROOT/'tools/exams/foundation-bank-plan.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
print('Prepared 44 papers / 1,232 question plans; public index unchanged.')
