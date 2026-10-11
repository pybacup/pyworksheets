# OCR MEI A-Level Maths Year 1 processing report

Completed locally: 15 remaining papers, 184 new questions; approved June 2025 H630/01 pilot retained unchanged.

## Coverage

| Year | Official series | H630/01 questions | H630/02 questions | Marks per paper |
|---|---|---:|---:|---:|
| 2018 | June | 11 | 12 | 70 |
| 2019 | June | 11 | 10 | 70 |
| 2020 | November | 12 | 11 | 70 |
| 2021 | Autumn | 11 | 13 | 70 |
| 2022 | June | 12 | 11 | 70 |
| 2023 | June | 12 | 15 | 70 |
| 2024 | June | 12 | 15 | 70 |
| 2025 | June | 13 | 16 | 70 |

- **197 questions**, 16 papers, **1,120 marks**.
- H630/01: 94 questions; H630/02: 103 questions.
- Pure: 123; Mechanics: 31; Statistics: 43.
- **197/197** compact PDFs, **197/197** official working-space PDFs, **197/197** official answer PDFs: **591 variants**.
- All **16 question papers**, **16 Printed Answer Booklets**, and **16 mark schemes** matched and preserved under `exams/source/a-level-maths/year-1/ocr-mei/`.
- Missing, duplicate or unresolved question/source matches: **0**.

## Preservation and interface

The 2,342 records present before this batch, including the 13 approved pilot questions, are unchanged (exact metadata hash verification). GCSE Higher 997, Foundation 1,260 and Further Maths 72 remain unchanged. Pilot PDF hashes are unchanged. No compact PDF was replaced by a working-space variant.

The only public-code extension in this batch is the addition of the combined `Pure Mathematics and Statistics` component. Existing Core, Statistics, Mechanics and the pilot’s combined Mechanics component remain available. Topics and subtopics populate from metadata. Both export checkboxes continue to default OFF.

Working-space output embeds the supplied official Printed Answer Booklet sections, with original response areas and continuations. Compact output retains question-paper content plus essential booklet-only tables, axes, grids and force outlines. Duplicate copies of graphs already present in the question are not added to compact PDFs. Answers embed original official tables and retain alternative methods and question-specific examiner appendices (including 2024 P1 Q3/Q9 and 2025 P2 Q5).

## Source notes

Archive filenames use `june` for all years. The official 2020 mark schemes identify the series as **November**, and 2021 as **Autumn**; metadata and exported headings use those actual official series. Original source filenames are retained.

**Official source inconsistency:** June 2024 H630/02 Q9(b) has `[2]` printed in the mark scheme but only a B1 allocation; the question paper allocates 1 mark and Q9 totals 6 marks. The official PDF is reproduced without correction; metadata retains the question-paper marks. This is not a failed identity match.

## Focused verification

- 22 JavaScript metadata, preservation, PDF-integrity, filters, basket and exporter tests passed.
- 4 Python tests passed: official source identity/hash, question numbering/marks and planned PDF pages, including pilot checks.
- Both Year 1 Chrome browser suites passed: component/topic/year/secondary filters, filtered Select All without duplicates, basket preservation, previews, all 591 HTTP PDF paths, default-OFF options, desktop/iPad/mobile layouts, ordered A4 exports.
- Mixed samples rendered and visually inspected; required table edges, axes and answer diagrams retained.
- No heavy whole-repository source-render audit was run.

## Mixed sample

Six questions / 42 marks, in this order:
- June 2018 H630/01 Q11: Pure / Exponentials and logarithms (13 marks).
- June 2019 H630/01 Q6: Mechanics / Forces and Newton's laws (7 marks).
- November 2020 H630/02 Q2: Statistics / Cumulative frequency (3 marks).
- June 2022 H630/01 Q12: Pure / Differentiation (6 marks).
- June 2024 H630/02 Q3: Statistics / Cumulative frequency (4 marks).
- June 2025 H630/02 Q16: Statistics / Hypothesis testing (9 marks).

Review outputs: compact 7 A4 pages, original working-space 15 A4 pages, official answers 4 A4 pages.

## Primary subtopic counts

| Subtopic | Questions |
|---|---:|
| Algebraic manipulation | 1 |
| Binomial distribution | 2 |
| Binomial expansion | 5 |
| Box plots | 1 |
| Circles | 7 |
| Coordinate geometry | 2 |
| Correlation and regression | 7 |
| Cumulative frequency | 2 |
| Differentiation | 20 |
| Discrete probability distributions | 5 |
| Equilibrium | 4 |
| Exponentials and logarithms | 14 |
| Forces and Newton's laws | 10 |
| Graphs of functions | 1 |
| Histograms | 4 |
| Hypothesis testing | 7 |
| Indices | 1 |
| Integration | 13 |
| Kinematics | 17 |
| Large data set | 2 |
| Linear equations | 1 |
| Linear inequalities | 1 |
| Measures of location and spread | 3 |
| Modelling | 3 |
| Outliers | 1 |
| Polynomials and factor theorem | 5 |
| Probability | 3 |
| Proof | 7 |
| Quadratic equations | 6 |
| Quadratic inequalities | 1 |
| Sampling | 2 |
| Simultaneous equations | 1 |
| Statistical diagrams | 3 |
| Stem-and-leaf diagrams | 1 |
| Straight line graphs | 6 |
| Surds | 4 |
| Trigonometric equations | 8 |
| Trigonometry | 11 |
| Vectors | 5 |

Primary and genuine secondary subtopics are stored in the index. Existing pilot labels are reused for the same skills; no Foundation/GCSE/Further labels were changed.

## Classification approval

The user approved the other one-off Year 1 subtopic labels and all current
primary classifications. No primary or secondary labels were changed.

November 2020 H630/01 Q11 retains the secondary label `Inequalities`:
part (a) critiques solving x^(1/2) < 4 without respecting the real square-root
domain; part (b) solves (1/2)^x < 4 using logarithms and the inequality reversal
for a negative logarithm. These are root/domain and exponential inequalities,
so neither `Linear inequalities` nor `Quadratic inequalities` accurately
describes the original skill, despite the rearranged solutions being linear
bounds on x. Its primary label remains `Exponentials and logarithms`.

November 2020 H630/02 Q11 remains Pure / Exponentials and logarithms, with
Differentiation and Modelling as secondary skills. `Kinematics` is not added.
The documented June 2024 H630/02 Q9(b) official subtotal discrepancy above
is unchanged.

## Publication

The approved Year 1 implementation was committed as `35e71e3` and pushed to
`main`. All 48 PDFs in the three import archives were checked byte-for-byte
against the extracted question papers, printed answer booklets and mark schemes.
The three temporary ZIPs were then removed from the repository in a separate
cleanup commit. The documented official Q9(b) discrepancy remains unchanged.
