# GCSE Foundation processing report

Completed locally on 11 October 2026. **Not committed or pushed. Both Foundation ZIPs retained.**

## Coverage

- Added **1,232 questions from the remaining 44 papers**. Together with the approved 28-question pilot, Foundation now contains **1,260 questions**.
- All **45 question papers and 45 official mark schemes** are represented and matched by Foundation paper code, year, series and question number.
- Every Foundation question has a valid compact, working-space and official answer PDF: **3,780 unique files**.
- Paper totals: **P1 421; P2 415; P3 424**. Every paper totals 80 marks; the bank totals **3,600 marks**.
- No missing IDs, duplicate IDs, missing variant files, duplicate path references, orphan Foundation extracts or unresolved question/answer matches.
- The complete public index has **2,329 records**: Foundation 1,260; Higher 997; non-GCSE 72.

## Preservation

All 1,097 pre-existing records are identical to the import baseline. All 3,247 pre-existing PDFs, including every Higher PDF and the approved Foundation pilot, retain their original SHA-256 hashes. No public HTML, CSS, JavaScript, filter behavior or PDF-export behavior was changed. Both export options still default OFF.

## Extraction and matching checks

The reviewed plan embeds original vector PDF content rather than rewriting questions or answers. Compact extracts remove unnecessary answer-booklet space and dotted lines. Original-space extracts retain complete question regions and continuations. Official answers retain marking codes, alternatives, tables and relevant guidance. All question numbers and marks were independently reconciled with the source-paper total statements.

All **7,779 new rendered regions** were compared with the source question/mark-scheme PDFs at 144 dpi, with zero outstanding failures. The pilot separately passed 147 region comparisons. Grey-grid antialiasing differences are tolerated without accepting missing visible content.

Visual review included a question/answer pair from every newly imported paper, all pages of the three mixed review booklets, difficult table boundaries and alternative-method continuations. The November 2019 P2 wording was also reviewed from page images because its searchable text layer is incomplete.

Two required thin lines were restored during review: June 2024 P2 Q7 (measurement) and November 2020 P3 Q17 (construction). The construction retains enough clear area to draw the triangle. Subpart grouping was refined so a mark/answer area does not become detached from its wording at a continuation break.

PDF resource optimization was accepted only after identical 72 dpi rendering of every page. Any candidate that changed rendering was rejected and the original extract retained.

## Mark-allocation reviews

The following raw mark-code totals initially needed interpretation. Alternative routes must not be added together as extra question marks. Every case was resolved against the official scheme; the original question marks were preserved.

| Question | Marks | Resolution |
|---|---:|---|
| November 2020 P1 Q7 | 4 | Official alternative routes checked: each complete route awards 4 marks; all routes preserved. |
| November 2020 P1 Q15 | 3 | Official alternative routes checked: each complete route awards 3 marks; all routes preserved. |
| November 2022 P1 Q18 | 5 | Official alternative routes checked: each complete route awards 5 marks; all routes preserved. |
| June 2025 P1 Q17 | 3 | Official alternative routes checked: each complete route awards 3 marks; all routes preserved. |
| June 2017 P2 Q10 | 4 | Official alternative routes checked: each complete route awards 4 marks; all routes preserved. |
| June 2017 P2 Q17 | 3 | Official alternative routes checked: each complete route awards 3 marks; all routes preserved. |
| June 2017 P2 Q18 | 5 | Official alternative routes checked: each complete route awards 5 marks; all routes preserved. |
| June 2019 P2 Q15 | 4 | Official alternative routes checked: each complete route awards 4 marks; all routes preserved. |
| June 2024 P2 Q26 | 4 | Official alternative routes checked: each complete route awards 4 marks; all routes preserved. |
| November 2024 P2 Q3 | 1 | Official B1 is split into B and 1 in the text layer; one mark confirmed. |
| June 2017 P3 Q18 | 5 | Official alternative routes checked: each complete route awards 5 marks; all routes preserved. |
| November 2017 P3 Q7 | 4 | Official alternative routes checked: each complete route awards 4 marks; all routes preserved. |
| June 2018 P3 Q9 | 4 | Part (a) B1; part (b) two alternative P1 P1 C1 routes. Total 4, not 7. |
| June 2022 P3 Q28 | 3 | Official alternative routes checked: each complete route awards 3 marks; all routes preserved. |

## Validation

- **95/95 JavaScript tests passed** against the final files.
- **10/10 Python tests passed**: six Foundation source/layout tests and four existing importer tests.
- **9/9 browser suites passed** in Chrome, including desktop, iPad-sized touch and mobile layouts.
- Tier All/Higher/Foundation; P1/P2/P3; June/November; combined year/topic/subtopic/marks filters; scoped Select All; deduplication; cross-topic selections; previews; selection ordering and removal passed.
- Foundation mixed-year compact, original-working-space and official-answer downloads passed. An **85-question Foundation selection** covering all 2025 papers exported with matching answers in the selected order.
- Existing Higher browser checks still passed, including 267-question and 72-question exports, default-OFF options, failed-file handling and missing-answer preflight.
- All generated booklet pages are A4 portrait (595.28 × 841.89 points), with source headings.

## Mixed review PDFs

The same nine questions (35 marks) appear in all three files:

1. `PY-Maths-Foundation-Mixed-Compact.pdf` — 6 A4 pages.
2. `PY-Maths-Foundation-Mixed-Working-Space.pdf` — 10 A4 pages.
3. `PY-Maths-Foundation-Mixed-Answers.pdf` — 3 A4 pages.

Selection: June 2017 P1 Q8; June 2018 P2 Q26; November 2019 P2 Q9; November 2020 P3 Q17; November 2022 P2 Q24; November 2023 P3 Q29; June 2024 P1 Q22; June 2025 P2 Q19; June 2025 P3 Q30.

The sample deliberately includes calculations, algebra, geometry, required drawing space, a large graph, a multi-page original question and official alternatives/guidance.

## Classification

See `gcse-foundation-classification-report.md` for every subtopic/count, all seven one-off primary labels, differences from the Higher vocabulary and five multi-skill primary-label judgement calls. `gcse-foundation-classification.csv` provides the full 1,260-record audit. Existing Higher and approved pilot classifications are unchanged.

## Paper inventory

| Paper | Year | Series | Questions | Marks |
|---|---:|---|---:|---:|
| 1MA1/1F | 2017 | June | 27 | 80 |
| 1MA1/1F | 2017 | November | 30 | 80 |
| 1MA1/1F | 2018 | June | 26 | 80 |
| 1MA1/1F | 2018 | November | 28 | 80 |
| 1MA1/1F | 2019 | June | 29 | 80 |
| 1MA1/1F | 2019 | November | 29 | 80 |
| 1MA1/1F | 2020 | November | 30 | 80 |
| 1MA1/1F | 2021 | November | 28 | 80 |
| 1MA1/1F | 2022 | June | 30 | 80 |
| 1MA1/1F | 2022 | November | 26 | 80 |
| 1MA1/1F | 2023 | June | 31 | 80 |
| 1MA1/1F | 2023 | November | 27 | 80 |
| 1MA1/1F | 2024 | June | 28 | 80 |
| 1MA1/1F | 2024 | November | 26 | 80 |
| 1MA1/1F | 2025 | June | 26 | 80 |
| 1MA1/2F | 2017 | June | 25 | 80 |
| 1MA1/2F | 2017 | November | 24 | 80 |
| 1MA1/2F | 2018 | June | 26 | 80 |
| 1MA1/2F | 2018 | November | 27 | 80 |
| 1MA1/2F | 2019 | June | 29 | 80 |
| 1MA1/2F | 2019 | November | 30 | 80 |
| 1MA1/2F | 2020 | November | 29 | 80 |
| 1MA1/2F | 2021 | November | 28 | 80 |
| 1MA1/2F | 2022 | June | 28 | 80 |
| 1MA1/2F | 2022 | November | 26 | 80 |
| 1MA1/2F | 2023 | June | 28 | 80 |
| 1MA1/2F | 2023 | November | 30 | 80 |
| 1MA1/2F | 2024 | June | 28 | 80 |
| 1MA1/2F | 2024 | November | 28 | 80 |
| 1MA1/2F | 2025 | June | 29 | 80 |
| 1MA1/3F | 2017 | June | 23 | 80 |
| 1MA1/3F | 2017 | November | 27 | 80 |
| 1MA1/3F | 2018 | June | 28 | 80 |
| 1MA1/3F | 2018 | November | 26 | 80 |
| 1MA1/3F | 2019 | June | 30 | 80 |
| 1MA1/3F | 2019 | November | 30 | 80 |
| 1MA1/3F | 2020 | November | 29 | 80 |
| 1MA1/3F | 2021 | November | 28 | 80 |
| 1MA1/3F | 2022 | June | 30 | 80 |
| 1MA1/3F | 2022 | November | 30 | 80 |
| 1MA1/3F | 2023 | June | 28 | 80 |
| 1MA1/3F | 2023 | November | 29 | 80 |
| 1MA1/3F | 2024 | June | 29 | 80 |
| 1MA1/3F | 2024 | November | 27 | 80 |
| 1MA1/3F | 2025 | June | 30 | 80 |

Both original Foundation ZIP/import packages remain in the repository root for review. Publishing remains a separate, unperformed step.
