const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { generatePairs, MatchGame } = require('../assets/equivalent-match-core.js');
function seeded(seed) { return () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296); }
for (const type of ['ratio','fraction']) for (const level of ['easy','medium','hard']) {
  test(`${type} ${level}: exact equivalence and one partner per card across 500 boards`,()=>{
    const random=seeded(37);let previous='';
    for(let i=0;i<500;i++){
      const pairs=generatePairs(type,level,random);
      assert.equal(pairs.length,8);
      const cards=pairs.flatMap(p=>[p.left,p.right]);
      assert.equal(new Set(cards.map(c=>c.a+':'+c.b)).size,16);
      for(const p of pairs){assert.equal(p.left.a*p.right.b,p.right.a*p.left.b);assert.notDeepEqual(p.left,p.right);}
      for(const [index,c] of cards.entries()){
        assert.equal(cards.filter((d,j)=>j!==index&&c.a*d.b===d.a*c.b).length,1);
        assert.ok(Number.isInteger(c.a)&&Number.isInteger(c.b)&&c.a>0&&c.b>0);
        if(type==='fraction'&&level!=='hard')assert.ok(c.a<c.b);
      }
      const signature=pairs.map(p=>p.id).sort().join('|');assert.notEqual(signature,previous);previous=signature;
    }
  });
}
for(const type of ['fraction','ratio'])test(`${type}: mismatches, duplicate taps, completion and reset`,()=>{
  const g=new MatchGame(type,'medium',seeded(21));
  assert.equal(g.select(0),'first');assert.equal(g.select(0),'ignored');
  const wrong=g.cards.findIndex(c=>c.pair.id!==g.cards[0].pair.id);
  assert.equal(g.select(wrong),'mismatch');assert.equal(g.select(2),'ignored');assert.equal(g.moves,1);
  g.resolveMismatch();assert.ok(g.cards.every(c=>!c.revealed));
  for(const p of g.pairs){const indices=g.cards.flatMap((c,i)=>c.pair.id===p.id?[i]:[]);assert.equal(g.select(indices[0]),'first');const result=g.select(indices[1]);assert.equal(result,g.found===8?'complete':'match');}
  assert.equal(g.moves,9);assert.equal(g.streak,8);assert.equal(g.found,8);
  g.reset('hard',seeded(98));assert.equal(g.found,0);assert.equal(g.moves,0);assert.equal(g.locked,false);assert.ok(g.cards.every(c=>!c.revealed));
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
function controller(type = 'fraction') {
  const elements = Object.fromEntries(['board', 'message', 'completion', 'timer', 'moves', 'pairs', 'streak', 'difficultyHelp', 'completionSummary', 'newGame', 'playAgain'].map(id => [id, new Element()]));
  const radios = ['easy', 'medium', 'hard'].map(value => Object.assign(new Element(), { value }));
  let model, now = 0, nextTimer = 0;
  const intervals = new Map(), timeouts = new Map();
  class CapturedGame extends MatchGame { constructor() { super(type); model = this; } }
  const context = {
    window: { EquivalentMatchCore: { MatchGame: CapturedGame } },
    document: { body: { dataset: { matchType: type } }, getElementById: id => elements[id], createElement: () => new Element(), createTextNode: text => ({ textContent: text }), querySelectorAll: () => radios },
    performance: { now: () => now },
    setInterval: fn => { intervals.set(++nextTimer, fn); return nextTimer; },
    clearInterval: id => intervals.delete(id),
    setTimeout: fn => { timeouts.set(++nextTimer, fn); return nextTimer; },
    clearTimeout: id => timeouts.delete(id)
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/equivalent-match.js'), 'utf8'), context);
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

test('fraction controller displays stacked fractions, completion stats and a working Play Again', () => {
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
  const standardIndex = app.model.cards.findIndex(() => true);
  assert.equal(e.board.children[standardIndex].valueNode.children.length, 1);
  e.playAgain.click();
  assert.equal(e.completion.hidden, true);
  assert.equal(app.model.found, 0);
  assert.equal(e.timer.textContent, '0:00');
  assert.equal(e.board.children.length, 16);
});

test('ratio controller displays ratio notation and finishes a complete round',()=>{
 const app=controller('ratio'), e=app.elements;
 for(const pair of app.model.pairs){
  const indices=app.model.cards.flatMap((c,i)=>c.pair.id===pair.id?[i]:[]);
  e.board.children[indices[0]].click();
  assert.match(e.board.children[indices[0]].valueNode.textContent,/^\d+ : \d+$/);
  e.board.children[indices[1]].click();
 }
 assert.equal(app.model.found,8);assert.equal(e.completion.hidden,false);
});
