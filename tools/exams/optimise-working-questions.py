"""Losslessly prune unused resources in NEW working variants; never touch compact PDFs.

Requires pypdf and pypdfium2. Every output page must render identically at 72 dpi
before a smaller file is accepted. Run from any directory after the JS generator.
"""
import hashlib
import io
import json
from pathlib import Path

import pypdfium2 as pdfium
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, StreamObject

ROOT = Path(__file__).resolve().parents[2]


def render_hashes(data):
    with pdfium.PdfDocument(data) as doc:
        result = []
        for page in doc:
            image = page.render(scale=1).to_pil().convert('RGB')
            result.append((image.size, hashlib.sha256(image.tobytes()).hexdigest()))
        return result


def optimise(data):
    reader = PdfReader(io.BytesIO(data))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    seen = set()

    def prune(obj):
        if id(obj) in seen:
            return
        seen.add(id(obj))
        resources = obj.get('/Resources')
        if not resources:
            return
        resources = resources.get_object()
        stream = obj.get('/Contents') if obj.get('/Type') == '/Page' else obj
        if not stream:
            return
        used = {b'Tf': set(), b'Do': set()}
        for args, op in ContentStream(stream, writer).operations:
            if op in used and args:
                used[op].add(args[0])
        for key, op in [('/Font', b'Tf'), ('/XObject', b'Do')]:
            group = resources.get(key)
            if not group:
                continue
            group = group.get_object()
            for name in list(group):
                if name not in used[op]:
                    del group[name]
                elif op == b'Do' and group[name].get('/Subtype') == '/Form':
                    prune(group[name])

    for page in writer.pages:
        prune(page)
    # Source image metadata sometimes contains large uncompressed XML streams.
    # Preserve that metadata, but losslessly deflate it along with other raw streams.
    for i, obj in enumerate(writer._objects):
        if isinstance(obj, StreamObject) and not obj.get('/Filter'):
            encoded = obj.flate_encode()
            if len(encoded._data) < len(obj._data):
                encoded.indirect_reference = obj.indirect_reference
                writer._objects[i] = encoded
    writer.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


if __name__ == '__main__':
    records = json.loads((ROOT / 'exams/data/exam-index.json').read_text(encoding='utf-8'))
    saved = count = 0
    for q in records:
        if q['qualification'] != 'GCSE Maths' or not q.get('workingQuestionFile'):
            continue
        file = (ROOT / q['workingQuestionFile']).resolve()
        assert file.is_relative_to(ROOT / 'exams/questions/gcse/higher/working')
        assert q['questionFile'] != q['workingQuestionFile']
        before = file.read_bytes()
        after = optimise(before)
        if len(after) < len(before):
            assert render_hashes(before) == render_hashes(after), f'Rendering changed: {q["id"]}'
            file.write_bytes(after)
            saved += len(before) - len(after)
        count += 1
        if count % 100 == 0:
            print(f'Checked {count} variants; saved {saved / 1048576:.1f} MiB', flush=True)
    print(f'Complete: {count} variants; saved {saved / 1048576:.1f} MiB; accepted pages render identically at 72 dpi.')
