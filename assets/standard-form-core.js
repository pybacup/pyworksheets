/* Shared browser/Node logic. Decimal strings keep every displayed pair exact. */
(function (root) {
  'use strict';
  const LEVELS = {
    easy: { min: 1, max: 99, powers: [3, 4, 5, 6, 7], mixed: false },
    medium: { min: 11, max: 999, powers: [2, 3, 4, 5, 6], mixed: true },
    hard: { min: 1001, max: 99999, powers: [4, 5, 6, 7, 8, 9, 10], mixed: true }
  };

  function ordinaryNumber(digits, power) {
    const point = power + 1;
    let whole, fraction = '';
    if (point <= 0) {
      whole = '0';
      fraction = '0'.repeat(-point) + digits;
    } else if (point >= digits.length) {
      whole = digits + '0'.repeat(point - digits.length);
    } else {
      whole = digits.slice(0, point);
      fraction = digits.slice(point);
    }
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction ? '.' + fraction : '');
  }

  function shuffle(items, random = Math.random) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Sample without replacement, without generating a huge candidate array.
  function sampleIndices(size, count, random) {
    const swaps = new Map();
    const selected = [];
    for (let i = 0; i < count; i++) {
      const remaining = size - i;
      const index = Math.floor(random() * remaining);
      selected.push(swaps.has(index) ? swaps.get(index) : index);
      swaps.set(index, swaps.has(remaining - 1) ? swaps.get(remaining - 1) : remaining - 1);
    }
    return selected;
  }

  function generatePairs(level, random = Math.random) {
    const config = LEVELS[level];
    if (!config) throw new Error('Unknown difficulty');
    // Integers with a nonzero final digit give one canonical coefficient each.
    const first = config.min - Math.floor(config.min / 10);
    const last = config.max - Math.floor(config.max / 10);
    const coefficients = last - first + 1;
    const size = coefficients * config.powers.length;
    const pairs = [];
    const signs = config.mixed ? [1, -1] : [1];
    for (const sign of signs) {
      for (const index of sampleIndices(size, config.mixed ? 4 : 8, random)) {
        const ordinal = first + index % coefficients;
        const mantissa = Math.floor((ordinal - 1) / 9) * 10 + (ordinal - 1) % 9 + 1;
        const digits = String(mantissa);
        const power = sign * config.powers[Math.floor(index / coefficients)];
        const coefficient = digits[0] + (digits.length > 1 ? '.' + digits.slice(1) : '');
        pairs.push({ id: digits + ':' + power, digits, power, coefficient, ordinary: ordinaryNumber(digits, power) });
      }
    }
    return shuffle(pairs, random);
  }

  class MatchGame {
    constructor(level = 'easy', random = Math.random) { this.reset(level, random); }
    reset(level, random = Math.random) {
      this.level = level;
      this.pairs = generatePairs(level, random);
      this.cards = shuffle(this.pairs.flatMap(pair => [
        { pair, kind: 'ordinary', revealed: false, matched: false },
        { pair, kind: 'standard', revealed: false, matched: false }
      ]), random);
      this.selected = [];
      this.moves = 0;
      this.found = 0;
      this.streak = 0;
      this.locked = false;
    }
    select(index) {
      const card = this.cards[index];
      if (!card || card.revealed || this.locked || this.found === 8) return 'ignored';
      card.revealed = true;
      this.selected.push(index);
      if (this.selected.length === 1) return 'first';
      this.moves++;
      const [a, b] = this.selected.map(i => this.cards[i]);
      if (a.pair.id === b.pair.id) {
        a.matched = b.matched = true;
        this.found++;
        this.streak++;
        this.selected = [];
        return this.found === 8 ? 'complete' : 'match';
      }
      this.streak = 0;
      this.locked = true;
      return 'mismatch';
    }
    resolveMismatch() {
      if (!this.locked) return;
      this.selected.forEach(i => { this.cards[i].revealed = false; });
      this.selected = [];
      this.locked = false;
    }
  }

  const api = { generatePairs, ordinaryNumber, MatchGame };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StandardFormCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
