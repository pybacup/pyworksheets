# GCSE original-working-space variants

The public exporter defaults to the existing compact `questionFile`. Its optional
`Include original exam working space` checkbox selects `workingQuestionFile`.
All 997 GCSE Higher questions have separate working variants; no compact PDF is
overwritten. A-Level and Further Maths retain their current files. The dialog
explains this for mixed selections and disables the option when none is available.

## Regeneration (local development only)

From the repository root:

```sh
node tools/exams/generate-working-questions.cjs
python tools/exams/optimise-working-questions.py
```

Generation uses the existing vendored pdf-lib. The optional lossless optimiser
requires `pypdf` and `pypdfium2` locally; the website gains no Python dependency.
The optimiser accepts a smaller file only after all of its pages render identically
at 72 dpi. It removes unused resources/deduplicates objects and compresses raw
streams without rasterising text or diagrams.

`gcse-working-space-plan.json` contains the original question boundaries from the
approved GCSE extraction: 997 questions, 1,046 source-page crops, and SHA-256 hashes
of all 45 original source PDFs. The pilot's original, pre-compaction boundaries are
included. Coordinates are MediaBox points measured from the top; page numbers
are one-based. A changed source hash causes generation to stop for boundary review.
Shared source pages have separate question regions. All continuation regions stay
in source order. Each region is embedded as one continuous vector crop, retaining
blank space, dotted lines, answer boxes, diagrams, required grids and marks.

The only added index field is `workingQuestionFile`. Generation validates every
question ID and existing `sourcePages` before publishing those references. Future
imports need reviewed boundary entries before regenerating this complete bank.

## Export behaviour and checks

- The checkbox starts unchecked whenever the dialog opens.
- Compact mode uses exactly the existing A4 layout algorithm and compact files.
- Working mode uses the same proportional A4 placement and source labels, with
  no compaction or answer-line removal. Continuations retain separate pages.
- A missing GCSE working variant or failed fetch reports an error and retains
  the basket; it does not silently switch that question to compact mode.
- Other courses keep their existing PDFs in mixed selections, as disclosed in
  the dialog. No A-Level/Further Maths data or PDFs were modified.
- Both modes retain A4 portrait dimensions of 595.28 by 841.89 points.

Tests: `node --test tests/*.test.cjs`, plus
`node tests/exams-working-space.browser.cjs` with `PLAYWRIGHT_MODULE` set to the
installed Playwright package. Existing browser suites also remain applicable.
Set `WORKING_EXPORT_DIR` to save sample booklets and dialog screenshots.

The real-data acceptance sample covers June 2024 P1 Q10 (short algebra), June
2017 P1 Q21 (written proof), June 2024 P1 Q11 (grid), June 2024 P1 Q3 (two-page
question), November 2018 P2 Q13 and November 2022 P3 Q26. It produces four compact
A4 pages or six A4 pages with original working space. The compact sample was
pixel-identical at 72 dpi to the exporter before this feature. The individual
variant tests validate all 997 PDFs and all 1,046 continuation/source regions.


## Official GCSE Higher answer extracts

`gcse-answer-plan.json` is the reviewed extraction plan for all 997 questions.
It records source hashes, question identities, crop regions and answer hashes.
The 23 approved June 2024 P1 pilot extracts are preserved by the full generator.

To reproduce the remaining extracts from the stored official mark schemes:

```sh
node tools/exams/generate-gcse-answers.cjs
```

The generator validates source identities/hashes and adds only `answerFile` to
the question index. It normalizes rotated source pages before vector cropping.
Do not rerun the planning/trim scripts on the audited plan without reviewing
new boundaries; those scripts use inspection caches from the import workflow.

Verification and mixed review sample:

```sh
node --test tests/*.test.cjs
node tests/exams-answers.browser.cjs
python tools/exams/verify-gcse-answer-rendering.py --report /path/to/rendering-audit.json
node tools/exams/create-answers-review-sample.cjs /path/to/output/pdf
```

The browser suite requires `PLAYWRIGHT_MODULE` to point to an installed
Playwright package. PDF rendering verification requires pypdfium2, Pillow
and NumPy. See `exams/gcse-answers-processing-report.md` for coverage,
manual mark-allocation reviews and the final validation results.


## Foundation June 2024 P1 pilot

`foundation-june-2024-p1-plan.json` contains the reviewed compact bands, original
working-space regions, official answer-table crops and hashes for 28 questions
worth 80 marks. It uses the same public data model and exporter as Higher.

Run `node tools/exams/generate-foundation-pilot.cjs` to reproduce its 84 PDFs
from the two stored source files. Existing records are preserved; conflicting
pilot records cause an error. The generator does not process any other paper
or read/delete either ZIP. The pilot-specific planning script is only for
reviewing boundary changes; it should not be treated as an automatic full-bank
classifier or extraction tool.

Run `node tools/exams/create-foundation-pilot-samples.cjs /path/to/output/pdf`
for the five-question, 19-mark review set in compact, working-space and answer
modes. See `exams/gcse-foundation-pilot-report.md` for the classification table
and tests. `tests/test_foundation_pilot.py` independently reconciles source
marks and compares all 147 rendered regions with the originals.

## Complete Foundation bank

`foundation-bank-plan.json` is the reviewed plan for the other 44 papers:
1,232 questions, giving 1,260 Foundation questions including the pilot. It
records all compact bands, original working-space regions, official answer
regions, source hashes, final output hashes and classification evidence.
Required measuring lines, construction space, drawing grids and continuation
subparts are explicitly preserved in the reviewed bands.

`node tools/exams/generate-foundation-bank.cjs` reproduces missing outputs
from stored sources and merges only absent records. Existing records must
match exactly. Existing output files must match their recorded hashes; the
generator stops on unexplained differences. It never overwrites the pilot,
Higher files or non-GCSE records and does not delete either import ZIP.

The planning script uses the import inspection cache. Do not rerun it over
the final audited plan without separately reviewing the proposed changes.
The checked-in plan is sufficient for generation without that cache.

`optimise-foundation-bank.py --report PATH` prunes redundant PDF resources
only in these new files. It accepts smaller files only when every page's
72 dpi render is identical, then updates the plan's output hashes.

Verification and review tools:

```sh
node --test tests/*.test.cjs
python -m unittest discover -s tests -p 'test_*.py'
node tests/exams-foundation-pilot.browser.cjs
node tests/exams-foundation-bank.browser.cjs
python tools/exams/verify-foundation-rendering.py --report /path/to/audit.json
python tools/exams/report-foundation-classification.py
node tools/exams/create-foundation-review-sample.cjs /path/to/output/pdf
```

The full-bank browser test exercises all three papers and both series,
ordered mixed-year exports in both question modes, official answers and an
85-question filtered export. The two Foundation Python suites independently
reconcile all 45 question-paper totals and protect the required thin lines.
See `exams/gcse-foundation-processing-report.md` and
`exams/gcse-foundation-classification-report.md` for the final review.

## OCR MEI Year 1 (2018–2025)

`alevel-y1-bank-plan.json` records original source hashes, crop coordinates,
metadata and output hashes for the 15 papers following the approved pilot.
`alevel-y1-classifications.json` records primary and secondary skills.
`inspect-alevel-y1-boundaries.py` and `plan-alevel-y1-bank.py` consume a
pdfplumber geometry cache (sources.json and inspection/*.json); reviewed
booklet-only figure coordinates are explicit in the planner. The generator
embeds original PDF regions and refuses to overwrite unaudited files. It
does not merge the public index or publish anything.

Focused verification (no whole-repository render audit):

```sh
node --test tests/exams-alevel-y1-bank.test.cjs tests/exams-alevel-y1-pilot.test.cjs
python -m unittest discover -s tests -p 'test_alevel_y1*.py'
node tests/exams-alevel-y1-bank.browser.cjs
node tests/exams-alevel-y1-pilot.browser.cjs
node tools/exams/create-alevel-y1-review-sample.cjs /path/to/output/pdf
```

Chrome browser checks require Playwright (or PLAYWRIGHT_MODULE pointing to
the installed module). See `alevel-y1-processing-report.md` for counts,
preservation checks and the official mark-scheme subtotal inconsistency.
