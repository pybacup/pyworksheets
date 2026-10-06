# PY Exams

PY Exams is a static, local-processing exam database and import tool. The main website is v1.23.

## Browse

Open `pyexams.html` through an HTTP/HTTPS server (including GitHub Pages). Direct `file://` opening cannot reliably load the JSON index or PDF worker. Course hierarchy lives in `assets/exams/core.js`; topics, subtopics, boards and exam years are derived from `exams/data/exam-index.json`.

The index starts empty because this checkout had no PY Exams prototype or individual exam PDFs. No exam PDFs have been removed or invented. To bring in an existing collection, retain its PDFs under `exams/questions/`, supply their real metadata and paths in the index, and classify the OCR Core 2018–2024 prototype as A-Level Further Maths / Year 2 / Pure.

## Import

1. Open `pyexams-import.html`. Choose or drop a PDF up to 80 MB and enter its paper metadata.
2. Analyse Exam reads text locally. Sequential left-margin question numbers, keyword topics/subtopics and printed mark totals are heuristic suggestions, not authoritative results.
3. Correct the review rows. Add missing questions manually, exclude unwanted rows, and set marks explicitly. Topics accept free text as well as common suggestions.
4. Page numbers include covers. Top/bottom percentages run from the top down. These crop the first and last page respectively; intermediate pages remain whole. Inspect source pages as needed.
5. Preview each included question and confirm all its pages, subparts, diagrams and marks are present, with no neighbouring questions. Editing a row invalidates its confirmation.
6. Prepare Import Package and download the ZIP. This is not a publishing action.

Scanned pages have no OCR in this release: define their ranges manually. Rotated pages must be saved upright first. Password-protected PDFs are rejected by the PDF loader. Difficult layouts, shared pages, repeated numbering, multi-column papers, and prose-only mark totals need manual correction. Review sessions are not retained after closing the page.

## Publish manually

The ZIP contains:

- `exams/source/...`: the original PDF, unchanged.
- `exams/questions/.../<topic>/...pdf`: individually reviewed question PDFs.
- `exams/data/exam-index.json`: complete index merged with the loaded baseline.
- `exam-index-additions.json`: additions for merging into a newer baseline.
- `import-manifest.json`: destination paths, source filename, IDs and reviewed page ranges.
- `README.txt`: publishing instructions.

Copy the package's `exams/` directory into the repository without deleting existing files. Before replacing the index, compare it with the latest repository version. If another import has been added, merge additions by ID instead. For consecutive imports, load the previous package's updated index in the importer. Re-imports with duplicate IDs/file paths or an already-indexed source path are blocked to avoid silent overwrites. Explicit replacement/edit workflows are not implemented yet.

Check the resulting site, then commit/push manually. No credentials, uploads or GitHub writes occur in the browser. This administration URL is publicly accessible on a static site, but has no publishing authority.

## PDF quality and privacy

PDF.js reads and renders previews. pdf-lib embeds and clips original page content, retaining vector text and diagrams rather than rasterising them. The delivered PDF displays only the selected region. Clipping is not secure redaction: underlying source page content may remain inside the PDF and be discoverable by extraction software. Do not use this importer to remove confidential information.

The original source PDF is also included in the package by design. All processing runs on the device. Bundled PDF libraries, fonts and character maps are local assets; there are no third-party processing calls.

## Architecture / future publishing

- `core.js`: hierarchy, metadata/index validation, analysis suggestions, filters, naming and merge rules (browser + Node).
- `shared.js`: course selectors and index loading.
- `browse.js`: student controller; question cards link only to `questionFile`.
- `pdf.js`: PDF extraction adapter independent of the interface.
- `import.js`: browser analysis/review/export orchestration.

A future authenticated publishing service can consume the package plus manifest, revalidate IDs and paths, compare the baseline against the latest index, and publish a reviewed change using server-side credentials. The public exam index and student interface need not change.

## Validation

Run `node --test tests/*.test.cjs`. Exam tests include all hierarchy branches, filters, safe paths, merge conflicts, heuristic boundaries, vector extraction, ZIP roundtrips and the actual browser/import controller code in a mock DOM. A synthetic question was rendered with PDF.js to visually check clipping of neighbouring questions and preservation of its diagram and mark allocation. Real exam-paper and physical iPad/browser acceptance testing is still needed before publishing.
