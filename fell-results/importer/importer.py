"""Run from any directory: python importer/importer.py."""
import json
from pathlib import Path
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError
from ukresults import parse_results

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://www.ukresults.net/2026/pikefell.html"
YEAR = 2026


def main():
    print(f"Downloading Pike Fell {YEAR}...")
    try:
        request = Request(SOURCE, headers={"User-Agent": "FellResults-LocalPrototype/1.0"})
        with urlopen(request, timeout=30) as response:
            html = response.read().decode(response.headers.get_content_charset() or "utf-8")
        results, headings = parse_results(html)
        if not headings or "Thieveley Pike" not in headings[0] or not any(str(YEAR) in h for h in headings):
            raise ValueError("Source race title or year does not match the configured race.")
        race = {"id": "pike-fell", "name": "Pike Fell", "full_name": headings[0],
                "date_label": headings[1], "year": YEAR, "source": SOURCE}
        payload = {"race": race, "imported_at": datetime.now(timezone.utc).isoformat(),
                   "gender_basis": "Explicit M/F placing columns in the source results", "results": results}
        relative = Path("data/results/pike-fell") / f"{YEAR}.json"
        target = ROOT / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(target)
        index = {"races": [{**race, "results_file": relative.as_posix()}]}
        index_target = ROOT / "data/races.json"
        index_temp = index_target.with_suffix(".json.tmp")
        index_temp.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        index_temp.replace(index_target)
        print(f"{len(results)} finishers found.")
        print(f"Saved {relative.as_posix()}")
    except (URLError, TimeoutError, OSError, UnicodeError, ValueError) as error:
        print(f"Import failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
