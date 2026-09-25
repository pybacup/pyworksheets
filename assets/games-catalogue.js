(() => {
  'use strict';
  // Topic IDs can be shared by multiple cards; a game can belong to several topics.
  const topics = [
    ['all', 'All games'], ['number', 'Number'], ['algebra', 'Algebra'],
    ['ratio', 'Ratio & proportion'], ['geometry', 'Geometry & measures'],
    ['probability', 'Probability'], ['statistics', 'Statistics']
  ];
  const cards = [...document.querySelectorAll('#gameCatalogue [data-topics]')];
  const matches = (card, topic) => topic === 'all' || card.dataset.topics.split(/\s+/).includes(topic);
  const controls = document.getElementById('topicFilters');
  const buttons = [];
  function select(topic, label) {
    let count = 0;
    cards.forEach(card => { card.hidden = !matches(card, topic); if (!card.hidden) count++; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === topic)));
    document.getElementById('catalogueStatus').textContent = count + ' game' + (count === 1 ? '' : 's') + (topic === 'all' ? ' available' : ' in ' + label);
    document.getElementById('catalogueEmpty').hidden = count !== 0;
  }
  topics.forEach(([topic, label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.topic = topic;
    button.textContent = label;
    button.setAttribute('aria-controls', 'gameCatalogue');
    const count = document.createElement('span');
    count.className = 'topic-count'; count.textContent = cards.filter(card => matches(card, topic)).length;
    count.setAttribute('aria-hidden', 'true'); button.append(count);
    button.addEventListener('click', () => select(topic, label));
    buttons.push(button); controls.append(button);
  });
  document.getElementById('showAllGames').addEventListener('click', () => { select('all', 'All games'); buttons[0].focus(); });
  select('all', 'All games');
  document.getElementById('catalogueFilters').hidden = false;
})();
