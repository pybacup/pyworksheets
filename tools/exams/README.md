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
