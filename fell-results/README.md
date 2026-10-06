# Fell Results

A local HTML/CSS/vanilla JavaScript prototype with a standard-library Python importer. No packages, build step, database or hosting setup.

## Run on Windows

In PowerShell, start in this folder:

```powershell
cd C:\Users\pybac\Documents\pyworksheets\fell-results
python importer/importer.py
python -m http.server 8000
```

Open http://localhost:8000. Keep the server terminal open; press Ctrl+C to stop it.

Python was not on PATH when this prototype was created. On this laptop the bundled executable can be used instead:

```powershell
$fellPython = 'C:\Users\pybac\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $fellPython importer/importer.py
& $fellPython -m http.server 8000
```

If you have the Windows Python launcher, `py` also works in place of `python`.

## Data and source

The importer downloads only https://www.ukresults.net/2026/pikefell.html, the Thieveley Pike Fell Race held on 26 September 2026. The short site name is Pike Fell; the complete source title is retained in the JSON and displayed on the site.

Generated results: `data/results/pike-fell/2026.json`. Race index: `data/races.json`. Run the importer again to refresh them. Existing files are retained if downloading or parsing fails. Paths are relative to the importer location, so imports work from any working directory.

The inspected HTML has a table with `id="pikefell"` and headings `Pos, Num, M, F, Name, Cat, CatPos, Club, After Winner, After 1st M, After 1st F, Time`. The parser locates that table and maps columns by heading. M/F comes from explicit gender placing columns, never names. Empty fields are null; original time strings are retained alongside numeric seconds. Unexpected rows, headings, times or race identity produce errors instead of partial imports. Other UKResults layouts may require adapting the parser.

The website calculates finisher count, fastest time/winner, median, fastest ten and gender counts from JSON. An even-sized field uses the mean of its two middle times and can display half seconds. Searching and sorting do not change overall statistics. Finish times in the full table remain as published.

Source results are credited to UKResults / John Schofield. The source states that unauthorised copying is prohibited; this prototype stays local as requested. Obtain appropriate permission before publishing the imported dataset.

## Checks

```powershell
python -m unittest discover -s importer/tests -v
```
