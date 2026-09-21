const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { generatePairs, ordinaryNumber, MatchGame } = require('../assets/standard-form-core.js');

function seeded(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function assertExact(pair) {
  const [whole, fraction = ''] = pair.ordinary.replaceAll(',', '').split('.');
  const ordinaryInteger = BigInt(whole + fraction);
  const standardInteger = BigInt(pair.digits);
  const power = pair.power - (pair.digits.length - 1) + fraction.length;
  if (power >= 0) assert.equal(ordinaryInteger, standardInteger * 10n ** BigInt(power));
  else assert.equal(ordinaryInteger * 10n ** BigInt(-power), standardInteger);
  assert.ok(Number(pair.coefficient) >= 1 && Number(pair.coefficient) < 10);
  assert.equal(pair.coefficient.replace('.', ''), pair.digits);
}

test('known conversions use exact decimal placement and thousands separators', () => {
  assert.equal(ordinaryNumber('56', 6), '5,600,000');
  assert.equal(ordinaryNumber('72', -5), '0.000072');
  assert.equal(ordinaryNumber('12345', 10), '12,345,000,000');
  assert.equal(ordinaryNumber('12345', -10), '0.00000000012345');
  assert.equal(ordinaryNumber('123', 2), '123');
  assert.equal(ordinaryNumber('1234', 1), '12.34');
});

for (const level of ['easy', 'medium', 'hard']) {
  test(`${level}: 1,000 boards contain eight unique, exact, appropriate pairs`, () => {
    const random = seeded(519);
    let previous = '';
    for (let round = 0; round < 1000; round++) {
      const pairs = generatePairs(level, random);
      assert.equal(pairs.length, 8);
      assert.equal(new Set(pairs.map(p => p.id)).size, 8);
      assert.equal(new Set(pairs.map(p => p.ordinary)).size, 8);
      const signature = pairs.map(p => p.id).sort().join('|');
      assert.notEqual(signature, previous);
      previous = signature;
      assert.equal(pairs.filter(p => p.power < 0).length, level === 'easy' ? 0 : 4);
      for (const pair of pairs) {
        assertExact(pair);
        assert.ok(!pair.digits.endsWith('0'));
        if (level === 'easy') { assert.ok(pair.digits.length <= 2); assert.ok(pair.power >= 3 && pair.power <= 7); }
        if (level === 'medium') { assert.ok(pair.digits.length >= 2 && pair.digits.length <= 3); assert.ok(Math.abs(pair.power) >= 2 && Math.abs(pair.power) <= 6); }
        if (level === 'hard') { assert.ok(pair.digits.length >= 4 && pair.digits.length <= 5); assert.ok(Math.abs(pair.power) >= 4 && Math.abs(pair.power) <= 10); }
      }
    }
  });
}

test('sampling remains unique even with a constant random source', () => {
  for (const level of ['easy', 'medium', 'hard']) {
    for (const value of [0, 0.999999]) {
      const pairs = generatePairs(level, () => value);
      assert.equal(new Set(pairs.map(p => p.ordinary)).size, 8);
      pairs.forEach(assertExact);
    }
  }
});

test('matching state guards double taps and third taps; resets streak and finishes', () => {
  const game = new MatchGame('medium', seeded(11));
  assert.equal(game.cards.length, 16);
  for (const pair of game.pairs) {
    assert.deepEqual(game.cards.filter(c => c.pair.id === pair.id).map(c => c.kind).sort(), ['ordinary', 'standard']);
  }
  const first = 0;
  const partner = game.cards.findIndex((c, i) => i !== first && c.pair.id === game.cards[first].pair.id);
  assert.equal(game.select(first), 'first');
  assert.equal(game.select(first), 'ignored');
  assert.equal(game.moves, 0);
  assert.equal(game.select(partner), 'match');
  assert.equal(game.streak, 1);
  assert.equal(game.select(first), 'ignored');
  const a = game.cards.findIndex(c => !c.matched);
  const b = game.cards.findIndex(c => !c.matched && c.pair.id !== game.cards[a].pair.id);
  game.select(a);
  assert.equal(game.select(b), 'mismatch');
  assert.equal(game.streak, 0);
  assert.equal(game.moves, 2);
  const third = game.cards.findIndex((c, i) => !c.revealed && i !== a && i !== b);
  assert.equal(game.select(third), 'ignored');
  assert.equal(game.cards[third].revealed, false);
  game.resolveMismatch();
  assert.equal(game.cards[a].revealed, false);
  assert.equal(game.cards[b].revealed, false);
  for (const pair of game.pairs.filter(p => p.id !== game.cards[first].pair.id)) {
    const indices = game.cards.flatMap((c, i) => c.pair.id === pair.id ? [i] : []);
    assert.equal(game.select(indices[0]), 'first');
    assert.equal(game.select(indices[1]), game.found === 8 ? 'complete' : 'match');
  }
  assert.equal(game.found, 8);
  assert.equal(game.moves, 9);
  assert.equal(game.streak, 7);
  assert.ok(game.cards.every(c => c.matched && c.revealed));
  game.reset('hard', seeded(22));
  assert.equal(game.moves, 0);
  assert.equal(game.found, 0);
  assert.equal(game.streak, 0);
  assert.equal(game.locked, false);
  assert.ok(game.cards.every(c => !c.revealed && !c.matched));
});

// A minimal DOM and fake clock exercise the actual controller without external dependencies.
class Element {
  constructor() {
    this.children = []; this.attributes = {}; this.events = {}; this.hidden = false;
    this.textContent = ''; this.checked = false; this.focused = false;
    this.classes = new Set();
    this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) };
  }
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; this.textContent = ''; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this.events[name] = callback; }
  focus() { this.focused = true; }
  set innerHTML(value) { this.valueNode = new Element(); this.kindNode = new Element(); }
  querySelector(selector) { return selector === '.card-value' ? this.valueNode : this.kindNode; }
  click() { this.events.click(); }
}
function controller() {
  const elements = Object.fromEntries(['board', 'message', 'completion', 'timer', 'moves', 'pairs', 'streak', 'difficultyHelp', 'completionSummary', 'newGame', 'playAgain'].map(id => [id, new Element()]));
  const radios = ['easy', 'medium', 'hard'].map(value => Object.assign(new Element(), { value }));
  let model, now = 0, nextTimer = 0;
  const intervals = new Map(), timeouts = new Map();
  class CapturedGame extends MatchGame { constructor() { super(); model = this; } }
  const context = {
    window: { StandardFormCore: { MatchGame: CapturedGame } },
    document: { getElementById: id => elements[id], createElement: () => new Element(), createTextNode: text => ({ textContent: text }), querySelectorAll: () => radios },
    performance: { now: () => now },
    setInterval: fn => { intervals.set(++nextTimer, fn); return nextTimer; },
    clearInterval: id => intervals.delete(id),
    setTimeout: fn => { timeouts.set(++nextTimer, fn); return nextTimer; },
    clearTimeout: id => timeouts.delete(id)
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/standard-form-match.js'), 'utf8'), context);
  return { elements, radios, get model() { return model; }, intervals, timeouts,
    advance(ms) { now += ms; intervals.forEach(fn => fn()); },
    resolve() { const pending = [...timeouts.values()]; timeouts.clear(); pending.forEach(fn => fn()); } };
}

test('controller times play, hides mismatches and cancels pending turns on restart', () => {
  const app = controller();
  const e = app.elements;
  assert.equal(e.board.children.length, 16);
  assert.equal(app.intervals.size, 0);
  assert.equal(e.completion.hidden, true);
  assert.ok(e.board.children.every(b => b.attributes['aria-label'].endsWith('face down')));
  e.board.children[0].click();
  app.advance(65000);
  assert.equal(e.timer.textContent, '1:05');
  const other = app.model.cards.findIndex(c => c.pair.id !== app.model.cards[0].pair.id);
  e.board.children[other].click();
  assert.equal(app.timeouts.size, 1);
  app.resolve();
  assert.equal(app.model.cards[0].revealed, false);
  e.board.children[0].click(); e.board.children[other].click();
  assert.equal(app.timeouts.size, 1);
  e.newGame.click();
  assert.equal(app.timeouts.size, 0);
  assert.equal(app.intervals.size, 0);
  assert.equal(e.timer.textContent, '0:00');
  assert.equal(app.model.moves, 0);
  assert.ok(e.board.children[0].focused);
  app.radios[2].checked = true; app.radios[2].events.change();
  assert.equal(app.model.level, 'hard');
  assert.ok(app.model.cards.every(c => !c.revealed));
});

test('controller displays superscripts, completion stats and a working Play Again', () => {
  const app = controller(), e = app.elements;
  for (const pair of app.model.pairs) {
    const indices = app.model.cards.flatMap((c, i) => c.pair.id === pair.id ? [i] : []);
    e.board.children[indices[0]].click();
    app.advance(2000);
    e.board.children[indices[1]].click();
  }
  assert.equal(e.completion.hidden, false);
  assert.ok(e.completion.focused);
  assert.equal(e.completionSummary.textContent, 'Easy complete in 0:16 with 8 moves.');
  assert.equal(app.intervals.size, 0);
  const standardIndex = app.model.cards.findIndex(c => c.kind === 'standard');
  assert.equal(e.board.children[standardIndex].valueNode.children.length, 1);
  e.playAgain.click();
  assert.equal(e.completion.hidden, true);
  assert.equal(app.model.found, 0);
  assert.equal(e.timer.textContent, '0:00');
  assert.equal(e.board.children.length, 16);
});
