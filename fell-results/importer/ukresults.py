"""UKResults HTML table parser, using only the Python standard library."""
from html.parser import HTMLParser
import re


class ResultsTable(HTMLParser):
    def __init__(self, table_id):
        super().__init__(convert_charrefs=True)
        self.table_id = table_id
        self.depth = 0
        self.rows = []
        self.row = None
        self.cell = None
        self.headings = []
        self.heading = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            if self.depth or dict(attrs).get("id") == self.table_id:
                self.depth += 1
        if self.depth:
            if tag == "tr":
                self.row = []
            elif tag in ("td", "th"):
                self.cell = []
            elif tag == "br" and self.cell is not None:
                self.cell.append(" ")
        elif tag in ("h2", "h3"):
            self.heading = []

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)
        if self.heading is not None:
            self.heading.append(data)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split()))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None
        elif tag == "table" and self.depth:
            self.depth -= 1
        elif tag in ("h2", "h3") and self.heading is not None:
            self.headings.append(" ".join("".join(self.heading).split()))
            self.heading = None


def time_to_seconds(value):
    if not re.fullmatch(r"\d+:\d{2}(?::\d{2})?", value):
        raise ValueError(f"Unsupported finish time: {value!r}")
    parts = [int(part) for part in value.split(":")]
    if any(part >= 60 for part in parts[1:]):
        raise ValueError(f"Invalid finish time: {value!r}")
    return parts[0] * 60 + parts[1] if len(parts) == 2 else parts[0] * 3600 + parts[1] * 60 + parts[2]


def parse_results(html, table_id="pikefell"):
    parser = ResultsTable(table_id)
    parser.feed(html)
    if not parser.rows:
        raise ValueError(f"Results table #{table_id} was not found; the source layout may have changed.")
    headers = parser.rows[0]
    required = ("Pos", "Name", "Cat", "Club", "Time", "M", "F")
    if not all(header in headers for header in required):
        raise ValueError(f"Unexpected results headings: {headers}")
    results = []
    positions = set()
    for number, row in enumerate(parser.rows[1:], 2):
        if len(row) != len(headers):
            raise ValueError(f"Table row {number} has {len(row)} cells; expected {len(headers)}.")
        data = dict(zip(headers, row))
        try:
            position = int(data["Pos"])
            seconds = time_to_seconds(data["Time"])
            if position < 1 or position in positions or not data["Name"] or seconds <= 0:
                raise ValueError("Missing name, duplicate/invalid position or non-positive time")
            male, female = bool(data["M"]), bool(data["F"])
            if male and female:
                raise ValueError("Both gender placing columns are populated")
            for column in ("M", "F"):
                if data[column] and not data[column].isdigit():
                    raise ValueError(f"Invalid {column} placing")
        except ValueError as error:
            raise ValueError(f"Invalid result at table row {number}: {error}") from error
        positions.add(position)
        results.append({"position": position, "name": data["Name"], "club": data["Club"] or None,
                        "category": data["Cat"] or None, "gender": "M" if male else "F" if female else None,
                        "time": data["Time"], "time_seconds": seconds})
    if not results:
        raise ValueError("The table contains no finishers; existing data has not been replaced.")
    return sorted(results, key=lambda result: result["position"]), parser.headings
