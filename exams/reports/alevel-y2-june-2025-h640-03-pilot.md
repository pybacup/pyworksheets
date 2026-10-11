# June 2025 H640/03 Year 2 pilot

Status: ready for review; not committed or pushed. Only this paper was processed.

## Totals and preservation

- 14 questions, 75 marks: Section A Q1–11 = 60; Section B Q12–14 = 15.
- All 14 have compact, official Printed Answer Booklet working-space and official mark-scheme PDFs (42 variants).
- All four official 2025 H640/03 sources matched by cover identity and SHA-256.
- Question numbering and per-question marks checked against the question paper.
- No missing, duplicate or unresolved question/answer matches.
- All 2,526 previous records are byte-equivalent after JSON serialization; no existing PDF was modified.
- GCSE Higher 997, Foundation 1,260, A-Level Year 1 197, Further Maths 72 preserved.
- All six Year 2 ZIPs retained. No other 23 papers processed.

## Reading insert

The original four-page insert is retained under exams/source. The two article pages are extracted with original vector content, equations, diagrams and line numbers. Q12–14 share a requiredMaterials reference and a Reading insert link. Compact and working-space exports append the article once, after the selected questions. Dependent question headings point to the insert at the end; article pages have their own source headings. Section A-only exports omit it. Answer exports contain only official mark-scheme extracts. Missing required material fails the export with an explicit error.

Section B working-space extracts use the complete official booklet sections, which already repeat the question text, avoiding duplicate question wording. Required drawing grids for Q3/Q5 and the diagram for Q14 are also retained in compact mode. Q5/Q6/Q11 question-specific mark-scheme appendix guidance is included; Q14 includes all three official answer pages and alternative methods.

## Classification

All questions have primary topic Pure. Comprehension is a secondary/context tag for Q12–14, not their primary mathematical classification. Existing Year 1 labels are reused where the skill matches; distinct Year 2 skills have precise labels.

| Question | Section | Marks | Primary subtopic | Secondary subtopics |
|---|---|---:|---|---|
| Q1 | A | 4 | Binomial expansion | — |
| Q2 | A | 2 | Composite functions | Domains of functions |
| Q3 | A | 10 | Straight line graphs | Coordinate geometry |
| Q4 | A | 3 | Geometric series | — |
| Q5 | A | 10 | Iteration | Exponentials and logarithms, Graphs of functions |
| Q6 | A | 3 | Differentiation | Exponentials and logarithms |
| Q7 | A | 9 | Exponentials and logarithms | Modelling, Geometric sequences, Differentiation |
| Q8 | A | 3 | Differentiation | Differentiation from first principles |
| Q9 | A | 5 | Differentiation | Inverse functions |
| Q10 | A | 6 | Vectors | Surds |
| Q11 | A | 5 | Proof | Surds |
| Q12 | B | 7 | Inequalities | Graphs of functions, Comprehension |
| Q13 | B | 3 | Trigonometry | Trigonometric identities, Comprehension |
| Q14 | B | 5 | Parametric equations | Trigonometry, Algebraic manipulation, Comprehension |

## Focused validation

- 13 Node tests passed: pilot metadata/source/PDF hashes, preservation, filters, shared-insert deduplication, missing/unsafe insert handling and existing practice/answers regressions.
- 2 focused Python tests passed: four source identities, all question marks, 42 variant page counts, official booklet provenance, mark-scheme continuation and appendix pages, required article content.
- Chrome browser pilot passed: component/topic/context filters, repeated Select All without duplicates, all 43 generated PDF paths, default-OFF options, desktop/iPad/mobile widths, ordered compact/working/answers downloads and one insert request per practice export.
- Pilot extracts and sample pages rendered and visually reviewed; no whole-repository source-render audit performed.

## Review samples

Same selection Q1, Q3, Q12, Q13, Q14 (29 marks) in all three exports. Compact: 5 A4 portrait pages including the two-page article. Working space: 11 A4 portrait pages including the article. Official answers: 4 A4 portrait pages, matching selected order.
