(function () {
  'use strict';
  const { MatchGame } = window.EquivalentMatchCore;
  const byId = id => document.getElementById(id);
  const board = byId('board');
  const message = byId('message');
  const completion = byId('completion');
  const type = document.body.dataset.matchType;
  const game = new MatchGame(type);
  const help = type === 'ratio' ? {
    easy: 'Small ratios with one card in simplest form.',
    medium: 'Match two scaled ratios by finding their common simplest form.',
    hard: 'Larger ratios and less obvious scale factors.'
  } : {
    easy: 'Proper fractions with one card in simplest form.',
    medium: 'Match two scaled proper fractions by simplifying.',
    hard: 'Larger values, including improper fractions.'
  };
  let buttons = [];
  let startedAt = null;
  let elapsed = 0;
  let clock = null;
  let turnBack = null;

  function timeLabel(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function updateTime() {
    if (startedAt !== null) elapsed = performance.now() - startedAt;
    byId('timer').textContent = timeLabel(elapsed);
  }
  function updateStats() {
    byId('moves').textContent = game.moves;
    byId('pairs').replaceChildren(document.createTextNode(game.found + ' '));
    const total = document.createElement('small');
    total.textContent = '/ 8';
    byId('pairs').append(total);
    byId('streak').replaceChildren(document.createTextNode(game.streak + ' '));
    const suffix = document.createElement('small');
    suffix.textContent = 'in a row';
    byId('streak').append(suffix);
  }
  function updateCards() {
    game.cards.forEach((card, index) => {
      const button = buttons[index];
      button.classList.toggle('revealed', card.revealed);
      button.classList.toggle('matched', card.matched);
      button.classList.toggle('miss', game.locked && card.revealed && !card.matched);
      button.setAttribute('aria-disabled', String(card.revealed || game.locked));
      const value = button.querySelector('.card-value');
      const kind = button.querySelector('.card-kind');
      value.replaceChildren();
      kind.textContent = '';
      if (!card.revealed) {
        button.setAttribute('aria-label', 'Card ' + (index + 1) + ', face down');
        return;
      }
      const { a, b } = card.value;
      if (type === 'fraction') {
        const fraction = document.createElement('span'); fraction.className = 'fraction';
        const numerator = document.createElement('span'); numerator.className = 'numerator'; numerator.textContent = a;
        const denominator = document.createElement('span'); denominator.className = 'denominator'; denominator.textContent = b;
        fraction.append(numerator); fraction.append(denominator); value.append(fraction);
      } else value.textContent = a + ' : ' + b;
      kind.textContent = card.matched ? '✓ Matched' : type === 'fraction' ? 'Fraction' : 'Ratio';
      const spoken = a + (type === 'fraction' ? ' over ' : ' to ') + b;
      button.setAttribute('aria-label', 'Card ' + (index + 1) + ', ' + spoken + (card.matched ? ', matched' : ''));
    });
  }
  function choose(index) {
    const result = game.select(index);
    if (result === 'ignored') return;
    if (startedAt === null) {
      startedAt = performance.now();
      clock = setInterval(updateTime, 250);
    }
    updateCards();
    updateStats();
    if (result === 'first') message.textContent = 'One card revealed. Find its equivalent.';
    if (result === 'match') message.textContent = game.streak > 1
      ? game.streak + ' matches in a row. You’re making connections!'
      : ['Good connection. Keep going!', 'Exactly right. Another pair found.', 'Nicely spotted.'][game.found % 3];
    if (result === 'mismatch') {
      message.textContent = 'Not this pair. Take a moment to remember their positions.';
      turnBack = setTimeout(() => {
        game.resolveMismatch();
        updateCards();
        message.textContent = 'Fresh turn. Try simplifying both values.';
        turnBack = null;
      }, 1400);
    }
    if (result === 'complete') {
      updateTime();
      clearInterval(clock);
      clock = null;
      startedAt = null;
      message.textContent = 'All eight pairs found. Well played!';
      byId('completionSummary').textContent = game.level[0].toUpperCase() + game.level.slice(1)
        + ' complete in ' + timeLabel(elapsed) + ' with ' + game.moves + ' moves.';
      completion.hidden = false;
      completion.focus();
    }
  }
  function newGame(level, focusBoard = false) {
    clearInterval(clock);
    clearTimeout(turnBack);
    clock = turnBack = null;
    startedAt = null;
    elapsed = 0;
    game.reset(level);
    document.querySelectorAll('input[name="difficulty"]').forEach(input => { input.checked = input.value === level; });
    completion.hidden = true;
    byId('timer').textContent = '0:00';
    byId('difficultyHelp').textContent = help[level] + ' Changing level starts a new game.';
    message.textContent = 'Ready when you are. The timer starts with your first card.';
    board.replaceChildren();
    buttons = game.cards.map((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'memory-card';
      // Both faces are decorative to assistive technology; the button label describes its state.
      button.innerHTML = '<span class="card-inner" aria-hidden="true"><span class="card-face card-back"><b>PY</b><small>MAKE A MATCH</small></span><span class="card-face card-front"><span class="card-value"></span><span class="card-kind"></span></span></span>';
      button.addEventListener('click', () => choose(index));
      board.append(button);
      return button;
    });
    updateCards();
    updateStats();
    if (focusBoard) buttons[0].focus();
  }
  document.querySelectorAll('input[name="difficulty"]').forEach(input => {
    input.addEventListener('change', () => { if (input.checked) newGame(input.value); });
  });
  byId('newGame').addEventListener('click', () => newGame(game.level, true));
  byId('playAgain').addEventListener('click', () => newGame(game.level, true));
  newGame('easy');
})();
