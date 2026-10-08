// Real-data classification/filter acceptance test; no external service required.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const C = require('../assets/exams/core.js');
const root = path.resolve(__dirname, '..');
const all = JSON.parse(fs.readFileSync(path.join(root, 'exams/data/exam-index.json')));
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 900 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const file = path.resolve(root, '.' + new URL(route.request().url()).pathname);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404 });
      return route.fulfill({ body: fs.readFileSync(file), contentType: ({ '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.pdf': 'application/pdf', '.png': 'image/png' })[path.extname(file)] || 'text/html' });
    });
    await page.goto('http://audit.test/pyexams.html');
    await page.selectOption('#qualification', 'GCSE Maths');
    await page.selectOption('#tier', 'Higher');
    const scoped = C.filter(all, { qualification: 'GCSE Maths', tier: 'Higher' });
    const topics = C.unique(scoped.flatMap(C.topics));
    assert.equal(topics.length, 6);
    assert.deepEqual(await page.locator('#topic option').evaluateAll(opts => opts.map(o => o.value).filter(Boolean)), topics);
    let checkedSubtopics = 0;
    for (const topic of topics) {
      await page.selectOption('#topic', topic);
      const qs = C.filter(scoped, { topic });
      const subtopics = C.unique(qs.flatMap(q => q.subtopics));
      assert.equal(await page.locator('#subtopic').inputValue(), '');
      assert.deepEqual(await page.locator('#subtopic option').evaluateAll(opts => opts.map(o => o.value).filter(Boolean)), subtopics);
      for (const subtopic of subtopics) {
        await page.selectOption('#subtopic', subtopic);
        const expected = C.filter(qs, { subtopic });
        const paths = await page.locator('.question-row a').evaluateAll(links => links.map(a => a.getAttribute('href')).sort());
        assert.deepEqual(paths, expected.map(q => q.questionFile).sort(), topic + ': ' + subtopic);
        assert.equal(await page.locator('#selectVisible').textContent(), 'Select All (' + expected.length + ')');
        checkedSubtopics++;
      }
    }
    // Combine every paper, series, several years, topic, subtopic and marks range.
    const basket = new Set();
    let combinations = 0;
    for (const paper of ['P1', 'P2', 'P3']) for (const series of ['June', 'November']) for (const examYear of [2017, 2022, 2024]) {
      const base = { qualification: 'GCSE Maths', tier: 'Higher', paper, series, examYear, minMarks: 2, maxMarks: 5 };
      const sample = C.filter(all, base)[0];
      assert(sample);
      await page.selectOption('#topic', sample.topic);
      await page.selectOption('#subtopic', sample.subtopic);
      await page.selectOption('#paper', paper);
      await page.selectOption('#series', series);
      await page.selectOption('#examYear', String(examYear));
      await page.locator('#minMarks').fill('2');
      await page.locator('#maxMarks').fill('5');
      const expected = C.filter(all, { ...base, topic: sample.topic, subtopic: sample.subtopic });
      assert.deepEqual(await page.locator('.question-row a').evaluateAll(links => links.map(a => a.getAttribute('href')).sort()), expected.map(q => q.questionFile).sort());
      await page.locator('#selectVisible').click();
      await page.locator('#selectVisible').click();
      expected.forEach(q => basket.add(q.id));
      assert.equal(await page.locator('#selectedList li').count(), basket.size);
      assert.equal(await page.locator('.question-row input:checked').count(), expected.length);
      combinations++;
    }
    await page.locator('#clearSelection').click();
    assert.equal(await page.locator('#selectedList li').count(), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS classification dropdowns: six topics, ${checkedSubtopics} topic/subtopic combinations, ${combinations} combined paper/series/year/subtopic/marks filters, Select All preservation/deduplication.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
