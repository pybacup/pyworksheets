'use strict';
const content = document.querySelector('#content');
const escapeHTML = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function formatTime(seconds) {
  const whole = Math.floor(seconds), hours = Math.floor(whole / 3600);
  const minutes = Math.floor(whole % 3600 / 60), secs = whole % 60;
  return `${hours ? hours + ':' : ''}${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}${seconds % 1 ? '.5' : ''}`;
}
function statistics(results) {
  if (!results.length || results.some(r => !Number.isFinite(r.time_seconds) || r.time_seconds <= 0)) throw new Error('The results file has missing or invalid finish times.');
  const fastest = [...results].sort((a,b) => a.time_seconds - b.time_seconds || a.position - b.position);
  const middle = Math.floor(fastest.length / 2);
  return {count: results.length, winner: fastest[0], median: fastest.length % 2 ? fastest[middle].time_seconds : (fastest[middle-1].time_seconds + fastest[middle].time_seconds)/2,
    fastest: fastest.slice(0,10), male: results.filter(r => r.gender === 'M').length, female: results.filter(r => r.gender === 'F').length, unknown: results.filter(r => !['M','F'].includes(r.gender)).length};
}
const statsHTML = s => `<div class="stats"><div><span class="stat-label">Finishers</span><span class="stat-value">${s.count}</span></div><div><span class="stat-label">Winning time</span><span class="stat-value">${formatTime(s.winner.time_seconds)}</span></div><div><span class="stat-label">Median time</span><span class="stat-value">${formatTime(s.median)}</span></div></div>`;
async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status}). Run the Python importer first.`);
  return response.json();
}
function renderRace({race, results, gender_basis}) {
  const s = statistics(results);
  document.title = `${race.name} ${race.year} · Fell Results`;
  content.innerHTML = `<section class="race-intro"><p class="eyebrow">${escapeHTML(race.date_label)} · ${race.year}</p><h1>${escapeHTML(race.name)}</h1><p>${escapeHTML(race.full_name)}</p><p class="winner">Winner: <strong>${escapeHTML(s.winner.name)}</strong> · ${escapeHTML(s.winner.club)}</p>${statsHTML(s)}</section>
  <div class="detail-grid"><section class="panel"><h2>The fastest ten</h2><ol class="top-ten">${s.fastest.map((r,i)=>`<li><span class="rank">${i+1}</span><span>${escapeHTML(r.name)}</span><span class="time">${formatTime(r.time_seconds)}</span></li>`).join('')}</ol></section>
  <section class="panel"><h2>The finishing field</h2><div class="field-counts"><div><strong>${s.male}</strong><span>Male finishers</span></div><div><strong>${s.female}</strong><span>Female finishers</span></div>${s.unknown ? `<div><strong>${s.unknown}</strong><span>Unspecified</span></div>` : ''}</div><div class="field-bar" aria-hidden="true"><span style="width:${s.male/s.count*100}%"></span></div><p class="muted">${escapeHTML(gender_basis)}. Median and fastest ten use the full finishing field.</p></section></div>
  <section class="panel results-panel"><div class="table-heading"><div><p class="eyebrow">EVERY FINISHER</p><h2>Full results</h2><span class="muted">Select a column heading to sort.</span></div><div class="search"><label for="search">Find a runner or club</label><input id="search" type="search" placeholder="Runner name or club…"></div></div><div class="table-scroll" tabindex="0" aria-label="Scrollable race results"><table><thead><tr>${[['position','Position'],['name','Runner'],['club','Club'],['category','Category'],['time_seconds','Time']].map(([key,label])=>`<th scope="col" data-column="${key}"><button type="button" data-sort="${key}">${label}<span class="sort-icon" aria-hidden="true"> ↕</span></button></th>`).join('')}</tr></thead><tbody id="rows"></tbody></table></div><p id="count" class="count" aria-live="polite"></p></section><p class="muted">Source: <a id="source-link">UKResults / John Schofield</a> · Original finish times are preserved. All statistics are calculated from the imported JSON.</p>`;
  const source = document.querySelector('#source-link');
  const sourceURL = new URL(race.source);
  if (sourceURL.protocol === 'https:') source.href = sourceURL.href;
  let key = 'position', direction = 1;
  function update() {
    const query = document.querySelector('#search').value.trim().toLocaleLowerCase();
    const filtered = results.filter(r => `${r.name} ${r.club || ''}`.toLocaleLowerCase().includes(query));
    filtered.sort((a,b) => direction * (typeof a[key] === 'number' ? a[key]-b[key] : String(a[key] || '').localeCompare(String(b[key] || ''), 'en', {numeric:true})) || a.position-b.position);
    document.querySelector('#rows').innerHTML = filtered.length ? filtered.map(r=>`<tr><td>${r.position}</td><td>${escapeHTML(r.name)}</td><td>${escapeHTML(r.club)}</td><td>${escapeHTML(r.category)}</td><td>${escapeHTML(r.time)}</td></tr>`).join('') : '<tr><td colspan="5">No runners or clubs match your search.</td></tr>';
    document.querySelector('#count').textContent = `Showing ${filtered.length} of ${results.length} finishers`;
    document.querySelectorAll('th[data-column]').forEach(th=>{const active = th.dataset.column === key; th.setAttribute('aria-sort', active ? direction === 1 ? 'ascending' : 'descending' : 'none'); th.querySelector('.sort-icon').textContent = active ? direction === 1 ? ' ↑' : ' ↓' : ' ↕';});
  }
  document.querySelector('#search').addEventListener('input', update);
  document.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>{direction = key === button.dataset.sort ? -direction : 1; key = button.dataset.sort; update();}));
  update();
}
async function init() {
  try {
    const index = await loadJSON('data/races.json');
    if (!Array.isArray(index.races) || !index.races.length) throw new Error('No races are available. Run the Python importer first.');
    if (document.body.dataset.page === 'race') {
      const params = new URLSearchParams(location.search);
      const race = index.races.find(r => r.id === (params.get('id') || 'pike-fell') && String(r.year) === (params.get('year') || '2026'));
      if (!race) throw new Error('That race edition was not found. Return to All races.');
      renderRace(await loadJSON(race.results_file));
    } else {
      const cards = [];
      for (const entry of index.races) {
        const {race, results} = await loadJSON(entry.results_file), s = statistics(results);
        cards.push(`<article class="race-card"><div class="card-top"><div><span class="tag">FELL RUNNING · ${race.year}</span><h3>${escapeHTML(race.name)}</h3><p>${escapeHTML(race.full_name)}<br>${escapeHTML(race.date_label)}</p></div><span class="tag">RESULTS AVAILABLE</span></div>${statsHTML(s)}<div class="card-bottom"><span class="muted">First home: <strong>${escapeHTML(s.winner.name)}</strong></span><a class="button" href="race.html?id=${encodeURIComponent(race.id)}&year=${race.year}">View full results <span aria-hidden="true">→</span></a></div></article>`);
      }
      content.innerHTML = cards.join('');
    }
  } catch (error) {
    content.innerHTML = `<div class="error" role="alert"><strong>Results could not be loaded.</strong><p>${escapeHTML(error.message)}</p><p>Serve the fell-results folder with <code>python -m http.server 8000</code>, then open <code>http://localhost:8000</code>.</p></div>`;
  }
}
init();
