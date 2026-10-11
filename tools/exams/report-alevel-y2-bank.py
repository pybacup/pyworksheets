"""Lightweight metadata/file report; deliberately performs no source rendering."""
import collections,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
all_records=json.loads((ROOT/'exams/data/exam-index.json').read_text(encoding='utf-8'))
qs=[q for q in all_records if q.get('qualification')=='A-Level Maths' and q.get('yearGroup')=='Year 2']
plan=json.loads((ROOT/'tools/exams/alevel-y2-bank-plan.json').read_text(encoding='utf-8'))
pilot=json.loads((ROOT/'tools/exams/alevel-y2-june-2025-h640-03-plan.json').read_text(encoding='utf-8'))
new_ids={q['record']['id'] for p in plan['papers'] for q in p['questions']}
old=[q for q in all_records if q['id'] not in new_ids]
assert len(old)==2540 and hashlib.sha256(json.dumps(old,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==plan['baselineSHA256']
files=[q[k] for q in qs for k in ['questionFile','workingQuestionFile','answerFile']]
assert len(qs)==363 and len(files)==len(set(files))==1089
assert all((ROOT/f).is_file() for f in files)
primary=collections.defaultdict(list);skills=collections.defaultdict(list)
for q in qs:
 primary[q['subtopic']].append(q)
 for s in q['subtopics']:skills[s].append(q)
def identity(q):return f"{q['series']} {q['examYear']} {q['paperCode']} Q{q['question']}"
def find(year,code,n):return next(q for q in qs if q['examYear']==year and q['paperCode']==code and q['question']==str(n))
judgements=[
 (2019,'H640/01',15,'Pure / Differential equations','The differential equation describes motion through a fluid, so Mechanics reflects the assessed physical model.'),
 (2022,'H640/01',8,'Mechanics / Kinematics','Despite the particle context, the assessment centres on parametric differentiation and eliminating the parameter.'),
 (2020,'H640/02',8,'Statistics / Normal distribution','Sampling methods frame the investigation, while later parts also assess fitting and using a Normal model.'),
 (2024,'H640/02',15,'Statistics / Hypothesis testing','Most parts build and use the Normal model before the final hypothesis test.'),
 (2023,'H640/03',11,'Pure / Numerical integration','The task evaluates a finite sum and checks an article formula; Numerical integration is retained secondarily.'),
 (2024,'H640/03',18,'Pure / Algebraic manipulation','Substitution into the article formula finds a geometric locus of tangent intersections.'),
 (2020,'H640/03',2,'Pure / Modulus functions or Linear inequalities','The graph supports an absolute-value inequality, which can also be treated as two linear bounds.')]
review=['# A-Level Maths Year 2 — lightweight classification review','',
 '363 questions: Pure 250; Mechanics 50; Statistics 63. No exhaustive rewrite was performed. Established Year 1/pilot labels are reused; the approved pilot is unchanged.','',
 '## Labels used once as the primary subtopic','',
 '| Subtopic | Question |','|---|---|']
for label,records in sorted(primary.items()):
 if len(records)==1:review.append(f'| {label} | {identity(records[0])} |')
review+=['','These six primary singletons are not all singletons in the combined primary/secondary filters.','',
 '## Labels used once across all primary and secondary skills','',
 '| Subtopic | Question |','|---|---|']
for label,records in sorted(skills.items()):
 if len(records)==1:review.append(f'| {label} | {identity(records[0])} |')
review+=['','All nine combined-filter singletons are secondary skills and use precise mathematical names or existing Year 1 labels.','',
 '## Similar labels checked','',
 '- **Geometric sequences / Geometric series / Sequences and series:** individual terms, sums and mixed finite-sum work respectively; retained as distinct skills.',
 '- **Trapezium rule / Numerical integration:** the named rule versus rectangle bounds or article-based approximation formulae; retained as specific versus broader labels.',
 '- **Trigonometry / Trigonometric equations / Trigonometric identities:** mixed triangle/function work, solving equations and proving identities; established labels are retained.',
 '- **Graphs of functions / Graph transformations / Modulus functions:** general graph reasoning, transformations and absolute-value functions; not interchangeable.',
 '- **Inequalities / Linear inequalities / Quadratic inequalities:** the generic pilot/domain and inequality-reasoning label is retained; November 2020 H640/03 Q2 is the borderline modulus/linear case listed below.',
 '', 'No spelling-only, capitalisation-only or Foundation-style synonym duplicates were introduced. Broader/specific overlaps above are intentional, rather than a reason for another bank-wide rewrite.','',
 '## Primary-label judgement calls','',
 '| Question | Current primary label | Alternative considered | Reason |','|---|---|---|---|']
for year,code,n,alt,reason in judgements:
 q=find(year,code,n);review.append(f"| {identity(q)} | {q['topic']} / {q['subtopic']} | {alt} | {reason} |")
review+=['','These seven decisions are mathematically usable classifications, not unresolved source matches. Current secondary labels remain available through the Subtopic filter; Comprehension remains a context/secondary skill for all 35 Section B questions. No review-driven primary-label rewrite has been made.','']
report=['# OCR MEI A-Level Maths Year 2 — completed local import','',
 '**363 questions across 24 papers**, including the unchanged 14-question June 2025 H640/03 pilot. Added 349 questions from the remaining 23 papers.','',
 '| Primary topic | Questions |','|---|---:|','| Pure | 250 |','| Mechanics | 50 |','| Statistics | 63 |','| Total | 363 |','',
 '## Paper coverage','',
 '| Official series/year | H640/01 | H640/02 | H640/03 | Total questions |','|---|---:|---:|---:|---:|']
for year in range(2018,2026):
 counts=[sum(q['examYear']==year and q['paperCode']==f'H640/0{n}' for q in qs) for n in range(1,4)]
 series={2020:'November',2021:'Autumn'}.get(year,'June');report.append(f'| {series} {year} | '+' | '.join(map(str,counts))+f' | {sum(counts)} |')
report+=['','Each H640/01 and H640/02 paper totals 100 marks; each H640/03 totals 75 marks, including 15 for Section B. Total bank marks: 2,200. Question numbering is consecutive within each paper.','',
 '## Source and file checks','',
 '- All 24 question papers, 24 matching official Printed Answer Booklets and 24 mark schemes are preserved in `exams/source/a-level-maths/year-2/ocr-mei/`.',
 '- All 8 year-specific H640/03 reading inserts are matched and preserved. Their article-content PDFs contain the original diagrams, formulae and article text.',
 '- Every one of 363 questions has a unique, valid `questionFile`, `workingQuestionFile` and `answerFile`: 1,089 individual PDFs in total.',
 '- The new batch produced 1,047 question/working/answer PDFs and 7 shared insert PDFs. The pilot’s 42 variants and shared insert remain byte-for-byte unchanged.',
 '- Official answer sections include continuation tables, alternatives, examiner guidance and question-specific appendices. The 2024 H640/03 supplementary Q8–Q18 notes are attached to their own questions.',
 '- The three image-based 2020 booklets were usable: question labels and continuation blocks were checked visually and embedded from the supplied original files.',
 '- Missing records/files: 0. Duplicate IDs or variant paths: 0. Unresolved source matches: 0.',
 '- All 2,540 pre-bulk records, including the approved pilot, remain unchanged. GCSE Higher 997, Foundation 1,260, Year 1 Maths 197 and Further Maths 72 are preserved.',
 '', '## Official-source notes','',
 '**June 2019 H640/01 Q12:** the question wording prints `y = 4t`, while the diagram labels P as `(4t², 8t)`. OCR explicitly recognises the error and awards 4 marks for (a) and 2 for (b). The original question is not corrected or rewritten. Its official answer PDF includes OCR’s highlighted notice and the supplied marking scheme for the intended question.',
 '', 'The 2020 covers show October sitting dates but the official schemes identify the series as **November 2020**. The 2021 archive filenames use November, whereas OCR identifies the schemes as **Autumn 2021** (with October sitting dates). Index/source headings use those official series labels. These are naming differences, not missing or mismatched sources.',
 '', 'The documented Year 1 June 2024 H630/02 Q9(b) discrepancy remains unchanged with its existing record.',
 '', '## PDF behaviour and mixed sample','',
 'Seven questions, 40 marks, from 2018, 2019, 2022, 2023, 2024 and 2025; all three paper codes and all three primary topics:',
 '', '| Question | Topic / primary subtopic | Marks |','|---|---|---:|']
for year,code,n in [(2018,'H640/01',7),(2023,'H640/01',8),(2019,'H640/02',2),(2025,'H640/02',11),(2024,'H640/02',12),(2022,'H640/03',11),(2022,'H640/03',12)]:
 q=find(year,code,n);report.append(f"| {identity(q)} | {q['topic']} / {q['subtopic']} | {q['marks']} |")
report+=['','- Compact sample: **7 A4 portrait pages**, including the two-page 2022 article.',
 '- Working-space sample: **17 A4 portrait pages**, including the same article once at the end.',
 '- Official answers: **5 A4 portrait pages**, in exactly the selected-question order, with no reading insert.',
 '- A4 dimensions remain 595.28 × 841.89 points. Original proportions/vector content are preserved; scanned booklet content remains its official supplied image.',
 '- Short questions share pages where space allows. Booklet-only axes/grids are retained in compact mode; identical copies of question-paper figures are not added again.',
 '- Required questions show “Uses reading insert at end”. Articles are deduplicated by identity and appended after all questions under “Reading Insert – H640/03”. Mixed-year selections receive each distinct required article once.',
 '- Final review titles contain no “Pilot”. Both optional export checkboxes remain OFF by default. Missing official answers or insert loads raise explicit errors.',
 '', '## Focused validation','',
 '- **20 JavaScript tests passed:** metadata, source/variant hashes, preservation, combinable filters, basket uniqueness, ordering, headers, A4 flow and missing-answer/insert behaviour.',
 '- **5 Python tests passed:** source-region mark counts for this import, valid PDF/page variants, official booklet/answer origins, pilot continuations, insert contents and correct ownership of supplementary guidance.',
 '- **2 Chrome browser checks passed:** bulk bank and preserved pilot, component/year/topic/context filtering, Select All, preview/variant requests, desktop/iPad/mobile widths, default-OFF options and ordered compact/working/answer exports.',
 '- Focused visual inspection covered the mixed sample and booklet-only figure exceptions. No heavy repository-wide source-render audit was run.',
 '', '## Review state','',
 'No commit or push has been made. All six Year 2 source ZIPs remain in the repository root. Worksheets, Games and other unrelated site files were not changed.',
 '', 'See `alevel-maths-year-2-classification-review.md` for the one-off labels, intentional label overlaps and seven primary-label judgement calls.','']
out=ROOT/'exams/reports';out.mkdir(exist_ok=True)
(out/'alevel-maths-year-2-processing-report.md').write_text('\n'.join(report),encoding='utf-8')
(out/'alevel-maths-year-2-classification-review.md').write_text('\n'.join(review),encoding='utf-8')
print('Processing and lightweight classification reports written. 363 questions; 1,089 unique valid variants; 2,540 earlier records unchanged.')
