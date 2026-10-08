# PY Exams — public read-only site

`pyexams.html` lets visitors select a course, topic and filters, preview question PDFs, and arrange selected questions into a downloadable practice PDF. Topics and question metadata come from `exams/data/exam-index.json`. Public browsing uses `assets/exams/core.js`, `shared.js`, `browse.js` and `practice.js`, with bundled pdf-lib for browser-only export. There is no upload, import, edit or publishing interface on the public site.

## Practice papers

Selections stay in the basket when filters change, until the page is refreshed or closed. Move up/down buttons determine export order. Each original PDF page is embedded as vector content beneath a mandatory source header, scaled proportionally to fit. Questions flow vertically on A4 portrait sheets (595.28 × 841.89 pt), with 32 pt margins and 28 pt between questions. Single-page questions move intact to the next sheet if needed. Multi-page questions begin on a fresh sheet and retain each continuation page. Oversized source pages are scaled proportionally to fit a full sheet; other questions are never shrunk to fill leftover space. There is no separate cover page. A failed download or invalid PDF aborts the whole export and keeps the basket intact.

Source labels use the index metadata. An optional `examSeries` field (for example `June`) supplies the series; `series` and `session` are also accepted. If none is supplied, only the recorded exam year is shown. The exporter never guesses a series.

The Year 1 Pure OCR Y410/01 batch contains 55 questions and six source papers from 2018–2023. Its fragment was merged by ID; singular subtopic metadata was also mapped to the subtopics array used by the browser. Topic options and filtering include both the primary topic and any additional topics tags. The index was empty before this import, so this checkout contained no Year 2 records to merge alongside it.

Keep existing exam PDFs and index entries when adding prepared question packages. Merge new entries by ID into the latest index, check all PDF paths and metadata, then publish through your normal Git workflow. Do not replace a newer index with an older package snapshot.

## Deployment boundary

The local administration directory is ignored by Git and excluded by `_config.yml` for the default GitHub Pages/Jekyll build. Do not force-add administration tools to the repository. A `.gitignore` rule does not remove already-tracked files; the previous public importer and its supporting libraries are deliberately deleted in this change.

This checkout does not include a custom Pages deployment workflow, and remote Pages settings have not been verified. Custom workflows that upload the whole working directory or bypass Jekyll must explicitly exclude local administration files. The strongest separation is to keep your standalone administration tool entirely outside this repository.

These changes are local until committed and deployed. If an importer was previously published, deploy its removal and verify the old URL returns 404. Removing a file does not erase prior Git history, cached copies or downloads. Do not store credentials or secrets in any website or local importer code.

## Validation

Run `node --test tests/*.test.cjs`. Public tests cover index validation, filtering, paths and the deployment separation. Existing worksheet and game functionality is independent of the exam browser.

Optional browser checks: run `node tests/exams-practice.browser.cjs` with Playwright installed (or set `PLAYWRIGHT_MODULE` to its module path) and Chrome available. This tests mixed-topic/year selections, ordering, downloads, failure handling and responsive layouts using temporary PDFs.

## GCSE metadata and filters

GCSE Maths supports Higher and Foundation, each with P1, P2 and P3. The tier, paper, year, series (June/November), topic, board and marks filters combine; All includes older records whose optional paper or series metadata is missing. No questions are fabricated for empty tiers.

Records retain qualification, tier, examBoard, paper, paperNumber, paperCode, examYear, series, question, marks, topic and subtopic, plus their unique id and source/question PDF paths. Use tier Higher for Higher imports and Foundation for Foundation imports. The browser accepts a singular subtopic and converts it to its internal subtopics array when loading. Paper uses P1/P2/P3, falling back to paperNumber 1/2/3 when absent. Missing paper numbers are never guessed from the code. Series may contain the year, such as June 2024. Existing A-Level metadata and filtering remain independent.
