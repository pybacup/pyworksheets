"""Build a final import report from completed validation evidence."""
import hashlib,json,re,sys
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];work=Path(sys.argv[1])
rows=json.loads((ROOT/'exams/data/exam-index.json').read_text());foundation=[q for q in rows if q.get('tier')=='Foundation']
plan=json.loads((ROOT/'tools/exams/foundation-bank-plan.json').read_text())
baseline=json.loads((work/'baseline-index.json').read_text());assert rows[:len(baseline)]==baseline
render=json.loads((work/'final-rendering-audit.json').read_text());assert not render['failures']
preserved=json.loads((work/'preservation-report.json').read_text())
optimised=json.loads((work/'optimization-report.json').read_text());assert optimised['files']==3696
js=(work/'javascript-tests-final.log').read_text(encoding='utf-8');assert re.search(r'pass 95',js) and re.search(r'fail 0',js)
for name in ['python-tests.log','python-importer-tests.log']:
 text=(work/name).read_text(encoding='utf-8');assert 'OK' in text and 'FAILED' not in text
browser='\n'.join((work/f).read_text(encoding='utf-8') for f in ['browser-tests.log','foundation-pilot-browser.log','foundation-bank-browser.log'])
assert browser.count('PASS')==9
assert len(rows)==2329 and len(foundation)==1260 and len({q['id'] for q in rows})==2329
files=[]
for q in foundation:
 for key in ['questionFile','workingQuestionFile','answerFile']:
  f=ROOT/q[key];assert f.is_file() and f.read_bytes().startswith(b'%PDF-');assert f.stem==q['id'];files.append(q[key])
assert len(set(files))==3780
disk={p.relative_to(ROOT).as_posix() for folder in ['exams/questions/gcse/foundation','exams/answers/gcse/foundation'] for p in (ROOT/folder).rglob('*.pdf')}
assert disk==set(files)
papers=defaultdict(list)
for q in foundation:papers[q['sourceFile']].append(q)
assert len(papers)==45
for qs in papers.values():assert sum(q['marks'] for q in qs)==80 and sorted(int(q['question']) for q in qs)==list(range(1,len(qs)+1))
schemes=list((ROOT/'exams/source/gcse/foundation/mark-schemes').rglob('*.pdf'));assert len(schemes)==45
for source in papers:
 f=ROOT/source;assert f.is_file()
 assert (ROOT/'exams/source/gcse/foundation/mark-schemes'/f.parent.name/(f.stem+'-ms.pdf')).is_file()
zips=['PY_Exams_GCSE_Foundation_Question_Papers_2017-2025.zip','PY_Exams_GCSE_Foundation_Mark_Schemes_2017-2025.zip']
assert all((ROOT/f).is_file() for f in zips)
lines=['# GCSE Foundation processing report','',
'Completed locally on 11 October 2026. **Not committed or pushed. Both Foundation ZIPs retained.**','',
'## Coverage','',
'- Added **1,232 questions from the remaining 44 papers**. Together with the approved 28-question pilot, Foundation now contains **1,260 questions**.',
'- All **45 question papers and 45 official mark schemes** are represented and matched by Foundation paper code, year, series and question number.',
'- Every Foundation question has a valid compact, working-space and official answer PDF: **3,780 unique files**.',
'- Paper totals: **P1 421; P2 415; P3 424**. Every paper totals 80 marks; the bank totals **3,600 marks**.',
'- No missing IDs, duplicate IDs, missing variant files, duplicate path references, orphan Foundation extracts or unresolved question/answer matches.',
'- The complete public index has **2,329 records**: Foundation 1,260; Higher 997; non-GCSE 72.','',
'## Preservation','',
f'All {preserved["existingRecordsPreserved"]:,} pre-existing records are identical to the import baseline. All {preserved["existingPDFsPreserved"]:,} pre-existing PDFs, including every Higher PDF and the approved Foundation pilot, retain their original SHA-256 hashes. No public HTML, CSS, JavaScript, filter behavior or PDF-export behavior was changed. Both export options still default OFF.','',
'## Extraction and matching checks','',
'The reviewed plan embeds original vector PDF content rather than rewriting questions or answers. Compact extracts remove unnecessary answer-booklet space and dotted lines. Original-space extracts retain complete question regions and continuations. Official answers retain marking codes, alternatives, tables and relevant guidance. All question numbers and marks were independently reconciled with the source-paper total statements.',
'',f'All **{render["regions"]:,} new rendered regions** were compared with the source question/mark-scheme PDFs at 144 dpi, with zero outstanding failures. The pilot separately passed 147 region comparisons. Grey-grid antialiasing differences are tolerated without accepting missing visible content.',
'','Visual review included a question/answer pair from every newly imported paper, all pages of the three mixed review booklets, difficult table boundaries and alternative-method continuations. The November 2019 P2 wording was also reviewed from page images because its searchable text layer is incomplete.',
'','Two required thin lines were restored during review: June 2024 P2 Q7 (measurement) and November 2020 P3 Q17 (construction). The construction retains enough clear area to draw the triangle. Subpart grouping was refined so a mark/answer area does not become detached from its wording at a continuation break.','',
'PDF resource optimization was accepted only after identical 72 dpi rendering of every page. Any candidate that changed rendering was rejected and the original extract retained.','',
'## Mark-allocation reviews','',
'The following raw mark-code totals initially needed interpretation. Alternative routes must not be added together as extra question marks. Every case was resolved against the official scheme; the original question marks were preserved.','',
'| Question | Marks | Resolution |','|---|---:|---|']
for paper in plan:
 for q in paper['questions']:
  if q['markReview']!='Official mark-code total matches question paper.':
   r=q['record'];lines.append(f'| {r["series"]} {r["examYear"]} {r["paper"]} Q{r["question"]} | {r["marks"]} | {q["markReview"]} |')
lines+=['','## Validation','',
'- **95/95 JavaScript tests passed** against the final files.',
'- **10/10 Python tests passed**: six Foundation source/layout tests and four existing importer tests.',
'- **9/9 browser suites passed** in Chrome, including desktop, iPad-sized touch and mobile layouts.',
'- Tier All/Higher/Foundation; P1/P2/P3; June/November; combined year/topic/subtopic/marks filters; scoped Select All; deduplication; cross-topic selections; previews; selection ordering and removal passed.',
'- Foundation mixed-year compact, original-working-space and official-answer downloads passed. An **85-question Foundation selection** covering all 2025 papers exported with matching answers in the selected order.',
'- Existing Higher browser checks still passed, including 267-question and 72-question exports, default-OFF options, failed-file handling and missing-answer preflight.',
'- All generated booklet pages are A4 portrait (595.28 × 841.89 points), with source headings.','',
'## Mixed review PDFs','',
'The same nine questions (35 marks) appear in all three files:','',
'1. `PY-Maths-Foundation-Mixed-Compact.pdf` — 6 A4 pages.',
'2. `PY-Maths-Foundation-Mixed-Working-Space.pdf` — 10 A4 pages.',
'3. `PY-Maths-Foundation-Mixed-Answers.pdf` — 3 A4 pages.','',
'Selection: June 2017 P1 Q8; June 2018 P2 Q26; November 2019 P2 Q9; November 2020 P3 Q17; November 2022 P2 Q24; November 2023 P3 Q29; June 2024 P1 Q22; June 2025 P2 Q19; June 2025 P3 Q30.','',
'The sample deliberately includes calculations, algebra, geometry, required drawing space, a large graph, a multi-page original question and official alternatives/guidance.','',
'## Classification','',
'See `gcse-foundation-classification-report.md` for every subtopic/count, all seven one-off primary labels, differences from the Higher vocabulary and five multi-skill primary-label judgement calls. `gcse-foundation-classification.csv` provides the full 1,260-record audit. Existing Higher and approved pilot classifications are unchanged.','',
'## Paper inventory','', '| Paper | Year | Series | Questions | Marks |','|---|---:|---|---:|---:|']
for source,qs in sorted(papers.items()):
 q=qs[0];lines.append(f'| {q["paperCode"]} | {q["examYear"]} | {q["series"]} | {len(qs)} | 80 |')
lines+=['','Both original Foundation ZIP/import packages remain in the repository root for review. Publishing remains a separate, unperformed step.','']
(ROOT/'exams/gcse-foundation-processing-report.md').write_text('\n'.join(lines),encoding='utf-8')
print('Verified final inventory: 1260 questions, 3780 variants, 45 papers, 45 schemes; wrote processing report.')
