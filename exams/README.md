# PY Exams — public read-only site

`pyexams.html` lets visitors select a course, topic and filters, preview question PDFs, and arrange selected questions into a downloadable practice PDF. Topics and question metadata come from `exams/data/exam-index.json`. Public browsing uses `assets/exams/core.js`, `shared.js`, `browse.js` and `practice.js`, with bundled pdf-lib for browser-only export. There is no upload, import, edit or publishing interface on the public site.

## Practice papers

Selections stay in the basket when filters change, until the page is refreshed or closed. Move up/down buttons determine export order. Each original PDF page is embedded as vector content beneath a mandatory source header, scaled proportionally to fit. Every question starts on a fresh page; there is no separate cover page. A failed download or invalid PDF aborts the whole export and keeps the basket intact.

Source labels use the index metadata. An optional `examSeries` field (for example `June`) supplies the series; `series` and `session` are also accepted. If none is supplied, only the recorded exam year is shown. The exporter never guesses a series.

The current checkout has an empty index and no question PDFs. Automated export checks use temporary synthetic fixtures, not production exam entries; verify real exam papers once they are available.

Keep existing exam PDFs and index entries when adding prepared question packages. Merge new entries by ID into the latest index, check all PDF paths and metadata, then publish through your normal Git workflow. Do not replace a newer index with an older package snapshot.

## Deployment boundary

The local administration directory is ignored by Git and excluded by `_config.yml` for the default GitHub Pages/Jekyll build. Do not force-add administration tools to the repository. A `.gitignore` rule does not remove already-tracked files; the previous public importer and its supporting libraries are deliberately deleted in this change.

This checkout does not include a custom Pages deployment workflow, and remote Pages settings have not been verified. Custom workflows that upload the whole working directory or bypass Jekyll must explicitly exclude local administration files. The strongest separation is to keep your standalone administration tool entirely outside this repository.

These changes are local until committed and deployed. If an importer was previously published, deploy its removal and verify the old URL returns 404. Removing a file does not erase prior Git history, cached copies or downloads. Do not store credentials or secrets in any website or local importer code.

## Validation

Run `node --test tests/*.test.cjs`. Public tests cover index validation, filtering, paths and the deployment separation. Existing worksheet and game functionality is independent of the exam browser.

Optional browser checks: run `node tests/exams-practice.browser.cjs` with Playwright installed (or set `PLAYWRIGHT_MODULE` to its module path) and Chrome available. This tests mixed-topic/year selections, ordering, downloads, failure handling and responsive layouts using temporary PDFs.
