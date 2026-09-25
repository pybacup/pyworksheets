(function (root) {
  'use strict';
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function generatePairs(type, level, random = Math.random) {
    if (!['fraction', 'ratio'].includes(type)) throw new Error('Unknown game');
    const settings = { easy: [8, 4], medium: [12, 7], hard: [20, 12] }[level];
    if (!settings) throw new Error('Unknown difficulty');
    const [limit, maxScale] = settings, candidates = [];
    // One reduced value per pair prevents 1/2, 2/4 and 3/6 forming ambiguous groups.
    for (let b = 2; b <= limit; b++) {
      for (let a = 1; a <= (type === 'fraction' && level !== 'hard' ? b - 1 : limit); a++) {
        if (gcd(a, b) === 1 && a !== b) candidates.push([a, b]);
      }
    }
    return shuffle(candidates, random).slice(0, 8).map(([a, b]) => {
      const scales = shuffle(Array.from({length: maxScale - 1}, (_, i) => i + 2), random);
      const first = level === 'easy' ? 1 : scales[0];
      const second = level === 'easy' ? scales[0] : scales[1];
      return { id: a + ':' + b, left: { a: a * first, b: b * first }, right: { a: a * second, b: b * second } };
    });
  }
  class MatchGame {
    constructor(type = 'fraction', level = 'easy', random = Math.random) {
      this.type = type; this.reset(level, random);
    }
    reset(level, random = Math.random) {
      this.level = level;
      this.pairs = generatePairs(this.type, level, random);
      this.cards = shuffle(this.pairs.flatMap(pair => ['left', 'right'].map(side => ({ pair, value: pair[side], revealed: false, matched: false }))), random);
      this.selected = []; this.moves = 0; this.found = 0; this.streak = 0; this.locked = false;
    }
    select(index) {
      const card = this.cards[index];
      if (!card || card.revealed || this.locked || this.found === 8) return 'ignored';
      card.revealed = true; this.selected.push(index);
      if (this.selected.length === 1) return 'first';
      this.moves++;
      const [a, b] = this.selected.map(i => this.cards[i]);
      if (a.value.a * b.value.b === b.value.a * a.value.b) {
        a.matched = b.matched = true; this.found++; this.streak++; this.selected = [];
        return this.found === 8 ? 'complete' : 'match';
      }
      this.streak = 0; this.locked = true; return 'mismatch';
    }
    resolveMismatch() {
      if (!this.locked) return;
      this.selected.forEach(i => { this.cards[i].revealed = false; });
      this.selected = []; this.locked = false;
    }
  }
  const api = { gcd, generatePairs, MatchGame };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EquivalentMatchCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
