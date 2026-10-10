# Official mark-scheme pilot: June 2024 Higher P1

## Scope and matching

Only Pearson Edexcel GCSE Maths Higher, June 2024, 1MA1/1H was processed. All **23 questions** matched the existing records, with **80 marks** in total. No matching discrepancies were found. The other 44 mark schemes remain unprocessed in `Higher MS.zip`.

The source is `exams/source/gcse/higher/mark-schemes/p1/edexcel-1ma1-1h-2024-june-ms.pdf`. The reviewed crop plan records its SHA-256, original table boundaries, source pages and mark totals in `tools/exams/june-2024-p1-answer-plan.json`. The pilot can be reproduced with `node tools/exams/generate-june-2024-p1-answers.cjs`.

Extracts embed the original vector PDF table regions. Answers, formulae, method/accuracy allocations, partial-credit rules and question-specific additional guidance are not rewritten. Questions 7 and 18 retain both complete alternative methods (5/5 and 3/3 marks respectively). Empty additional-guidance columns and trailing blank space are omitted; occupied guidance columns are retained in full. Original column headings are retained.

Only the standard-paper section (source pages 6–20) was used. The modified-large-print/Braille amendments on pages 21–24 are not applicable to the imported standard paper and were excluded. General front matter and publisher furniture were excluded from individual extracts; the complete official source PDF remains available.

## Pilot inventory

| Question | Marks | Official source page | Answer extract |
| --- | --- | --- | --- |
| 1 | 2 | 6 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q1.pdf) |
| 2 | 3 | 7 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q2.pdf) |
| 3 | 5 | 8 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q3.pdf) |
| 4 | 3 | 9 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q4.pdf) |
| 5 | 4 | 10 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q5.pdf) |
| 6 | 4 | 11 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q6.pdf) |
| 7 | 5 | 12 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q7.pdf) |
| 8 | 3 | 13 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q8.pdf) |
| 9 | 1 | 13 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q9.pdf) |
| 10 | 4 | 13 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q10.pdf) |
| 11 | 3 | 14 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q11.pdf) |
| 12 | 3 | 14 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q12.pdf) |
| 13 | 5 | 15 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q13.pdf) |
| 14 | 3 | 15 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q14.pdf) |
| 15 | 4 | 16 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q15.pdf) |
| 16 | 2 | 16 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q16.pdf) |
| 17 | 3 | 16 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q17.pdf) |
| 18 | 3 | 17 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q18.pdf) |
| 19 | 3 | 18 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q19.pdf) |
| 20 | 3 | 18 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q20.pdf) |
| 21 | 5 | 19 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q21.pdf) |
| 22 | 4 | 20 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q22.pdf) |
| 23 | 5 | 20 | [PDF](answers/gcse/higher/p1/edexcel-1ma1-1h-2024-june-q23.pdf) |

## Export behaviour

The Create Practice PDF dialog now contains the default-off **Also create answers / mark scheme** checkbox. The question paper retains its existing compact/original-working-space choice. Answers use `answerFile`, independently of that choice, and preserve the basket order.

Both outputs use A4 portrait (595.28 × 841.89 points), proportional vector content and actual source metadata. Short answers share pages; continuation pages retain their order. The practice PDF downloads automatically. A separate **Download answers / mark scheme** link is provided for the completed answer booklet, avoiding blocked multiple automatic downloads on mobile browsers.

Missing answer metadata is reported with the full question identity before either booklet is built. A failed answer fetch identifies the affected question and publishes neither booklet; the selection is retained. No incomplete answer booklet is silently produced.

## Review artifacts

- Complete pilot: `PY-Maths-June-2024-P1-Pilot-Answers.pdf` — all 23 questions, 8 A4 pages.
- Sample: `PY-Maths-June-2024-P1-Sample-Practice.pdf` and matching `PY-Maths-June-2024-P1-Sample-Practice-Answers.pdf`.
- Sample order: 14, 1, 9, 10, 13, 18, 21; answers occupy 3 A4 pages. This deliberately non-numeric order checks basket-order preservation and includes short answers, algebra, histogram marking guidance and an alternative method.

All 23 individual extracts and every page of the pilot and sample answer booklets were visually reviewed.

## Verification

- 86 JavaScript tests passed, including five new answer-export tests.
- All seven browser regression suites passed: answers, classification, full GCSE bank, GCSE filters, practice, results and original working-space support.
- Four existing Python tests passed.
- Browser checks cover default OFF, compact and working-space modes, ordered downloads, desktop/iPad-sized/mobile viewports and touch controls, missing-answer preflight and a failed answer fetch.
- All 2,119 pre-existing PDF files match their committed Git blob hashes byte for byte.
- All 1,069 existing records are unchanged except for the 23 new `answerFile` fields. There are still 997 GCSE Higher questions, no duplicate or missing records, and unchanged non-GCSE data.

No commit or push was made. This is a local pilot awaiting review before the remaining mark schemes are processed.
