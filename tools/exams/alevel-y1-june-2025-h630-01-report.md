# June 2025 H630/01 pilot report

Status: complete locally; no commit or push. Only this one paper processed. Both import ZIPs retained.

## Verified totals

- 13 questions, numbered 1–13; 70 marks, matching both official sources.
- Pure: 9 questions / 49 marks. Mechanics: 4 questions / 21 marks.
- 13 compact PDFs, 13 original-working-space PDFs, 13 official-answer PDFs.
- No missing, duplicate or unresolved records/files.
- Existing 2,329 records preserved exactly: 997 Higher, 1,260 Foundation and 72 Further Maths. Total index: 2,342.

## Source handling

The supplied OCR question paper uses a separate Printed Answer Booklet. Neither uploaded archive contains that booklet. The exact official June 2025 H630/01 booklet was obtained from OCR and preserved as an additional source PDF:
https://www.ocr.org.uk/Images/752683-question-paper-pure-mathematics-and-mechanics-answer-book.pdf

Compact Q7 includes the original axes from booklet page 6. Working-space variants combine the original question wording with the corresponding original booklet answer areas at their original size where space permits, otherwise retaining separate continuation pages. No working spaces were invented. Q10 retains the original accuracy/gravity instructions, including g = 9.8.

Official answer extracts preserve all subparts, marks, guidance, alternative methods and diagrams. The empty appendix labelled “Exemplar responses for Q2(b)” has no responses; Q2 has no part (b), so this unrelated empty template is excluded. No answers were rewritten or generated.

## Classification

| Question | Marks | Topic | Primary subtopic | Secondary subtopics |
|---|---:|---|---|---|
| 1 | 3 | Pure | Binomial expansion | — |
| 2 | 2 | Pure | Trigonometry | Sine rule |
| 3 | 4 | Pure | Straight line graphs | Simultaneous equations |
| 4 | 4 | Pure | Quadratic equations | — |
| 5 | 4 | Mechanics | Forces and Newton's laws | Modelling |
| 6 | 4 | Pure | Trigonometric equations | Quadratic equations |
| 7 | 5 | Pure | Vectors | Straight line graphs |
| 8 | 3 | Mechanics | Kinematics | Forces and Newton's laws |
| 9 | 5 | Pure | Integration | Indices |
| 10 | 5 | Mechanics | Equilibrium | Forces and Newton's laws, Vectors, Modelling |
| 11 | 9 | Pure | Differentiation | Quadratic equations |
| 12 | 13 | Pure | Exponentials and logarithms | Modelling, Differentiation |
| 13 | 9 | Mechanics | Kinematics | Integration, Quadratic equations |

No existing A-Level Maths question records/subtopic labels existed to reuse. The combined paper title is retained in component metadata; Pure and Mechanics are the dynamic primary topic filters. Existing Core/Statistics/Mechanics options and all GCSE/Further Maths behavior remain.

## Sample selection

Questions 1, 2, 5, 12 and 13 (31 marks): binomial expansion, triangle diagram, forces/modelling, a long exponential model with table, and kinematics with velocity–time graph. The selection order is identical in all three sample files.

- Compact practice: 3 A4 portrait pages.
- Original working-space practice: 9 A4 portrait pages.
- Official answers: 3 A4 portrait pages.

## Focused validation

15 JavaScript pilot/core/practice checks passed, plus 2 focused Python tests. Chrome browser pilot passed at 1440/1024/390px with touch input: component and topic/secondary filters, Select All with existing Higher selection, all 13 previews and all 39 PDF paths, default-OFF options, basket order, compact/working/answers downloads and A4 dimensions. Final crop corrections passed the 4 pilot JavaScript tests and both Python tests. All pilot compact, working and answer variants and all sample pages were visually inspected. No repository-wide source-render audit was run.

## Files

All 13 records were appended to exams/data/exam-index.json. A-Level component selector support is the only public code change (assets/exams/core.js). Extraction plan, generator and focused tests are under tools/exams and tests.

| Question | Compact | Working space | Official answers |
|---|---|---|---|
| 1 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q1.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q1.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q1.pdf |
| 2 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q2.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q2.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q2.pdf |
| 3 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q3.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q3.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q3.pdf |
| 4 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q4.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q4.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q4.pdf |
| 5 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q5.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q5.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q5.pdf |
| 6 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q6.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q6.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q6.pdf |
| 7 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q7.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q7.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q7.pdf |
| 8 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q8.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q8.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q8.pdf |
| 9 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q9.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q9.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q9.pdf |
| 10 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q10.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q10.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q10.pdf |
| 11 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q11.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q11.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q11.pdf |
| 12 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q12.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q12.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q12.pdf |
| 13 | exams/questions/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q13.pdf | exams/questions/a-level-maths/year-1/ocr-mei/p1/working-space/ocr-mei-h630-01-2025-june-q13.pdf | exams/answers/a-level-maths/year-1/ocr-mei/p1/ocr-mei-h630-01-2025-june-q13.pdf |
