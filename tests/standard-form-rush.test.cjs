const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'games/standard-form-rush.html'), 'utf8');

function harness() {
  const nodes = new Map();
  function element() {
    const classes = new Set();
    return { textContent: '', innerHTML: '', style: {}, dataset: {}, children: [],
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
      addEventListener() {}, setAttribute() {}, appendChild(child) { this.children.push(child); }, querySelectorAll() { return []; } };
  }
  const get = id => { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); };
  const context = { document: { getElementById: get, createElement: element }, window: {},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setTimeout() {} };
  let script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const end = script.lastIndexOf('})();');
  script = script.slice(0, end) + 'globalThis.gameTest = {beginGame, loop, answer, getCorrect:()=>currentCorrect};\n' + script.slice(end);
  vm.runInNewContext(script, context);
  return { api: context.gameTest, get, element };
}

test('instructions, initial display and timer constant all specify 120 seconds', () => {
  assert.match(html, /id="timeStat">120\.0/);
  assert.match(html, /120 seconds \(2 minutes\)/);
  assert.match(html, /TOTAL_TIME=120/);
  assert.doesNotMatch(html, /60 seconds|timeStat">60\.0|TOTAL_TIME=60\b/);
});

test('timer lasts two minutes, progress is half at 60 seconds, and replay resets it', () => {
  const { api, get } = harness();
  api.beginGame();
  assert.equal(get('timeStat').textContent, '120.0');
  assert.equal(get('timerBar').style.width, '100%');
  api.loop(1000);
  api.loop(61000);
  assert.equal(get('timeStat').textContent, '60.0');
  assert.equal(get('timerBar').style.width, '50%');
  assert.ok(get('endOverlay').classList.contains('hidden'));
  api.loop(120900);
  assert.equal(get('timeStat').textContent, '0.1');
  // Advance to the first frame after expiry, allowing normal floating-point rounding.
  api.loop(121016);
  assert.equal(get('timeStat').textContent, '0.0');
  assert.equal(get('timerBar').style.width, '0%');
  assert.equal(get('endOverlay').classList.contains('hidden'), false);
  api.beginGame();
  assert.equal(get('timeStat').textContent, '120.0');
  assert.equal(get('timerBar').style.width, '100%');
});

test('wrong answers retain the two-second penalty; correct answers retain scoring', () => {
  const { api, get, element } = harness();
  api.beginGame();
  api.answer(element(), 'incorrect');
  assert.equal(get('timeStat').textContent, '118.0');
  assert.equal(get('scoreStat').textContent, '0');
  api.beginGame();
  api.answer(element(), api.getCorrect());
  assert.equal(get('scoreStat').textContent, '100');
  assert.equal(get('timeStat').textContent, '120.0');
});

test('navigation and assets resolve from the nested game page and catalogue', () => {
  assert.match(html, /href="\.\.\/games.html">← Back to Games/);
  for (const file of ['index.html', 'games.html', 'games/standard-form-rush.html']) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [, url] of content.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|data:|#)/.test(url)) continue;
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), url)), `${file}: ${url}`);
    }
  }
});
