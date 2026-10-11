# OCR MEI A-Level Maths Year 2 — completed local import

**363 questions across 24 papers**, including the unchanged 14-question June 2025 H640/03 pilot. Added 349 questions from the remaining 23 papers.

| Primary topic | Questions |
|---|---:|
| Pure | 250 |
| Mechanics | 50 |
| Statistics | 63 |
| Total | 363 |

## Paper coverage

| Official series/year | H640/01 | H640/02 | H640/03 | Total questions |
|---|---:|---:|---:|---:|
| June 2018 | 14 | 17 | 15 | 46 |
| June 2019 | 16 | 15 | 15 | 46 |
| November 2020 | 15 | 15 | 12 | 42 |
| Autumn 2021 | 13 | 16 | 15 | 44 |
| June 2022 | 14 | 16 | 12 | 42 |
| June 2023 | 15 | 18 | 15 | 48 |
| June 2024 | 16 | 16 | 18 | 50 |
| June 2025 | 14 | 17 | 14 | 45 |

Each H640/01 and H640/02 paper totals 100 marks; each H640/03 totals 75 marks, including 15 for Section B. Total bank marks: 2,200. Question numbering is consecutive within each paper.

## Source and file checks

- All 24 question papers, 24 matching official Printed Answer Booklets and 24 mark schemes are preserved in `exams/source/a-level-maths/year-2/ocr-mei/`.
- All 8 year-specific H640/03 reading inserts are matched and preserved. Their article-content PDFs contain the original diagrams, formulae and article text.
- Every one of 363 questions has a unique, valid `questionFile`, `workingQuestionFile` and `answerFile`: 1,089 individual PDFs in total.
- The new batch produced 1,047 question/working/answer PDFs and 7 shared insert PDFs. The pilot’s 42 variants and shared insert remain byte-for-byte unchanged.
- Official answer sections include continuation tables, alternatives, examiner guidance and question-specific appendices. The 2024 H640/03 supplementary Q8–Q18 notes are attached to their own questions.
- The three image-based 2020 booklets were usable: question labels and continuation blocks were checked visually and embedded from the supplied original files.
- Missing records/files: 0. Duplicate IDs or variant paths: 0. Unresolved source matches: 0.
- All 2,540 pre-bulk records, including the approved pilot, remain unchanged. GCSE Higher 997, Foundation 1,260, Year 1 Maths 197 and Further Maths 72 are preserved.

## Official-source notes

**June 2019 H640/01 Q12:** the question wording prints `y = 4t`, while the diagram labels P as `(4t², 8t)`. OCR explicitly recognises the error and awards 4 marks for (a) and 2 for (b). The original question is not corrected or rewritten. Its official answer PDF includes OCR’s highlighted notice and the supplied marking scheme for the intended question.

The 2020 covers show October sitting dates but the official schemes identify the series as **November 2020**. The 2021 archive filenames use November, whereas OCR identifies the schemes as **Autumn 2021** (with October sitting dates). Index/source headings use those official series labels. These are naming differences, not missing or mismatched sources.

The documented Year 1 June 2024 H630/02 Q9(b) discrepancy remains unchanged with its existing record.

## PDF behaviour and mixed sample

Seven questions, 40 marks, from 2018, 2019, 2022, 2023, 2024 and 2025; all three paper codes and all three primary topics:

| Question | Topic / primary subtopic | Marks |
|---|---|---:|
| June 2018 H640/01 Q7 | Mechanics / Moments | 3 |
| June 2023 H640/01 Q8 | Mechanics / Kinematics | 11 |
| June 2019 H640/02 Q2 | Pure / Differentiation | 4 |
| June 2025 H640/02 Q11 | Statistics / Binomial distribution | 7 |
| June 2024 H640/02 Q12 | Statistics / Hypothesis testing | 7 |
| June 2022 H640/03 Q11 | Pure / Trigonometry | 3 |
| June 2022 H640/03 Q12 | Pure / Trigonometric identities | 5 |

- Compact sample: **7 A4 portrait pages**, including the two-page 2022 article.
- Working-space sample: **17 A4 portrait pages**, including the same article once at the end.
- Official answers: **5 A4 portrait pages**, in exactly the selected-question order, with no reading insert.
- A4 dimensions remain 595.28 × 841.89 points. Original proportions/vector content are preserved; scanned booklet content remains its official supplied image.
- Short questions share pages where space allows. Booklet-only axes/grids are retained in compact mode; identical copies of question-paper figures are not added again.
- Required questions show “Uses reading insert at end”. Articles are deduplicated by identity and appended after all questions under “Reading Insert – H640/03”. Mixed-year selections receive each distinct required article once.
- Final review titles contain no “Pilot”. Both optional export checkboxes remain OFF by default. Missing official answers or insert loads raise explicit errors.

## Focused validation

- **20 JavaScript tests passed:** metadata, source/variant hashes, preservation, combinable filters, basket uniqueness, ordering, headers, A4 flow and missing-answer/insert behaviour.
- **5 Python tests passed:** source-region mark counts for this import, valid PDF/page variants, official booklet/answer origins, pilot continuations, insert contents and correct ownership of supplementary guidance.
- **2 Chrome browser checks passed:** bulk bank and preserved pilot, component/year/topic/context filtering, Select All, preview/variant requests, desktop/iPad/mobile widths, default-OFF options and ordered compact/working/answer exports.
- Focused visual inspection covered the mixed sample and booklet-only figure exceptions. No heavy repository-wide source-render audit was run.

## Review state

The PDFs, source matching and classification review are approved for publication. The implementation was pushed as d60eaf8. All six temporary Year 2 ZIPs were then removed; all 80 supplied source PDFs were verified byte-for-byte and remain preserved in the extracted repository structure. Worksheets, Games and other unrelated site files were not changed.

See `alevel-maths-year-2-classification-review.md` for the one-off labels, intentional label overlaps and seven primary-label judgement calls.
