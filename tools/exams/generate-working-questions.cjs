// Local CLI only: regenerate the original-working-space variants from checked source crops.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const lib = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const C = require('../../assets/exams/core.js');
const root = path.resolve(__dirname, '../..');
const plan = require('./gcse-working-space-plan.json');
const indexPath = path.join(root, 'exams/data/exam-index.json');
const all = JSON.parse(fs.readFileSync(indexPath));
const entries = new Map(all.map(q => [q.id, q]));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

(async () => {
  assert.equal(new Set(plan.questions.map(q => q.id)).size, plan.questions.length);
  const gcse = all.filter(q => q.qualification === 'GCSE Maths' && q.tier === 'Higher');
  assert.deepEqual(plan.questions.map(q => q.id).sort(), gcse.map(q => q.id).sort());
  const sourceBytes = new Map();
  for (const [file, expected] of Object.entries(plan.sourceSHA256)) {
    assert(C.safePath(file, 'exams/source/'));
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(hash(bytes), expected, 'Source changed; review boundaries before generating: ' + file);
    sourceBytes.set(file, bytes);
  }
  let sourceFile, source, pages = 0, bytesWritten = 0;
  for (const q of plan.questions) {
    const record = entries.get(q.id);
    assert.equal(record.sourceFile, q.sourceFile);
    assert.deepEqual(q.parts.map(p => p.page), record.sourcePages);
    const file = `exams/questions/gcse/higher/working/p${record.paperNumber}/${q.id}.pdf`;
    assert(C.safePath(file, 'exams/questions/'));
    assert.notEqual(file, record.questionFile);
    if (sourceFile !== q.sourceFile) {
      sourceFile = q.sourceFile;
      source = await lib.PDFDocument.load(sourceBytes.get(sourceFile));
    }
    const out = await lib.PDFDocument.create();
    out.setTitle(q.id + ' - original working space');
    for (const part of q.parts) {
      const original = source.getPage(part.page - 1), w = original.getWidth(), h = original.getHeight();
      assert.equal(original.getRotation().angle, 0);
      assert(part.left >= 0 && part.right <= w && part.top >= 0 && part.bottom <= h);
      assert(part.right > part.left && part.bottom > part.top);
      // One continuous crop per source page. No masks, removed lines or compacted bands.
      const width = part.right - part.left, height = part.bottom - part.top;
      const embedded = await out.embedPage(original, { left: part.left, right: part.right, bottom: h - part.bottom, top: h - part.top });
      out.addPage([width, height]).drawPage(embedded, { x: 0, y: 0, width, height });
      pages++;
    }
    const bytes = await out.save();
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), bytes);
    bytesWritten += bytes.length;
    record.workingQuestionFile = file;
  }
  // Publish references only after every PDF has been successfully generated.
  C.validateIndex(all);
  fs.writeFileSync(indexPath, JSON.stringify(all, null, 2) + '\n');
  console.log(`Generated ${plan.questions.length} working-space PDFs (${pages} source-page crops, ${(bytesWritten / 1048576).toFixed(1)} MB). Compact PDFs unchanged.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
