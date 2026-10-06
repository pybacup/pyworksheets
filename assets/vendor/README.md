# Vendored browser dependencies

- PDF.js / pdfjs-dist 4.10.38: compatibility (`legacy/build`) module and worker, standard_fonts, cmaps. Apache-2.0; licences retained alongside assets. Source: https://github.com/mozilla/pdf.js
- pdf-lib 1.17.1: UMD distribution. MIT; LICENSE.md retained. Source: https://github.com/Hopding/pdf-lib
- fflate 0.8.3: UMD distribution. MIT; LICENSE retained. Source: https://github.com/101arrowz/fflate

Downloaded from the corresponding pinned npm distributions. All are served locally; exam PDFs are never sent to these projects or CDNs. Keep PDF.js main and worker versions identical when upgrading. Re-run exam tests and browser acceptance checks after upgrades.
