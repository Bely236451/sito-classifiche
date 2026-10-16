const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DATA_URL = 'data.json'; // oppure l'URL di un Google Sheet pubblicato come JSON
let teams = [], scorers = [], filter = 'all';

const logoOf = n => teams.find(t => t.nome === n)?.logo || 'img/logo-lega.png';

function countUp(el, to) {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return el.textContent = to;
  const t0 = performance.now();
  (function f(t) { const k = Math.min((t - t0) / 900, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
}

function renderStats(d) {
  const top = scorers[0];
  $('#pill').textContent = `Stagione ${d.stagione} · Giornata ${d.giornata}`;
  $('#stats').innerHTML = [[d.giornata, 'Giornata'], [teams.length, 'Squadre'], [top.gol, `Gol di ${top.giocatore}`]]
    .map(([n, l]) => `<div class="stat"><b class="num" data-n="${n}">0</b><span>${esc(l)}</span></div>`).join('');
  document.querySelectorAll('[data-n]').forEach(e => countUp(e, +e.dataset.n));
}

function renderTeams() {
  $('#squadre').innerHTML = teams.map((s, i) => `
    <button class="tr fade ${i === 0 ? 'lead' : ''}" style="animation-delay:${i * 60}ms" data-i="${i}" aria-label="Dettagli ${esc(s.nome)}">
      <b class="num">${i + 1}</b>
      <div class="tm"><img src="${s.logo}" alt="" loading="lazy"><span>${esc(s.nome)}</span></div>
      <span class="num">${s.pg}</span><span class="num">${s.v}</span><span class="num">${s.p}</span><span class="num">${s.s}</span>
      <span class="num gx">${s.gf ?? '–'}</span><span class="num gx">${s.gs ?? '–'}</span>
      <span class="num">${s.dr == null ? '–' : (s.dr > 0 ? '+' : '') + s.dr}</span>
      <span class="pt num">${s.pt}</span></button>`).join('');
}

function renderScorers() {
  const ranked = scorers.map((p, i) => ({ ...p, pos: i + 1 }));
  const medal = ['🥇', '🥈', '🥉'];
  $('#podio').innerHTML = [1, 0, 2].map(i => { const p = ranked[i]; return `
    <div class="pd p${i + 1} fade"><span class="crown">${medal[i]}</span>
    <img src="${logoOf(p.squadra)}" alt="${esc(p.squadra)}"><h3 class="display">${esc(p.giocatore)}</h3>
    <small>${esc(p.squadra)}</small><div class="g num">${p.gol}</div></div>`; }).join('');
  $('#chips').innerHTML = `<button class="chip all" data-f="all" aria-pressed="${filter === 'all'}">Tutte</button>` +
    teams.map(t => `<button class="chip" data-f="${esc(t.nome)}" aria-pressed="${filter === t.nome}"><img src="${t.logo}" alt="">${esc(t.nome)}</button>`).join('');
  const rows = ranked.slice(3).filter(p => filter === 'all' || p.squadra === filter);
  $('#lista').innerHTML = rows.length ? rows.map(p => `
    <div class="sc fade"><b class="num">${p.pos}</b>
    <div class="tm"><img src="${logoOf(p.squadra)}" alt=""><div>${esc(p.giocatore)}<small>${esc(p.squadra)}</small></div></div>
    <b class="g num">${p.gol}</b></div>`).join('')
    : '<p class="hint">Nessun marcatore tra i primi della classifica per questa squadra.</p>';
}

function openTeam(i) {
  const s = teams[i], mine = scorers.filter(p => p.squadra === s.nome);
  $('#dlg').innerHTML = `<img class="big" src="${s.logo}" alt="Logo ${esc(s.nome)}">
    <h2 class="display">${esc(s.nome)}</h2><span class="pill">${i + 1}° posto · ${s.pt} punti</span>
    <div class="kv">${[['PG', s.pg], ['V', s.v], ['P', s.p], ['S', s.s], ['DR', s.dr ?? '–']].map(([k, v]) => `<div><b class="num">${v}</b><span>${k}</span></div>`).join('')}</div>
    <p class="mini">${mine.length ? '<b>Marcatori:</b> ' + mine.map(p => `${esc(p.giocatore)} (${p.gol})`).join(', ') : 'Nessun marcatore in classifica.'}</p>
    <button class="close" autofocus>Chiudi</button>`;
  $('#dlg').showModal();
}

function setTab(name) {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name));
  document.querySelectorAll('[role=tabpanel]').forEach(p => p.hidden = p.id !== 'panel-' + name);
  history.replaceState(null, '', '#' + name);
  scrollTo({ top: Math.min(scrollY, $('nav').offsetTop), behavior: 'smooth' });
}

document.addEventListener('click', e => {
  const tab = e.target.closest('.tab'), row = e.target.closest('.tr'), chip = e.target.closest('.chip');
  if (tab) setTab(tab.dataset.tab);
  if (row) openTeam(+row.dataset.i);
  if (chip) { filter = chip.dataset.f; renderScorers(); }
  if (e.target.closest('.close') || e.target === $('#dlg')) $('#dlg').close();
});

fetch(DATA_URL, { cache: 'no-cache' }).then(r => r.json()).then(d => {
  teams = d.squadre.map((s, i) => ({ ...s, pt: s.v * 3 + s.p, dr: s.gf != null && s.gs != null ? s.gf - s.gs : null, i }))
    .sort((a, b) => b.pt - a.pt || (b.dr ?? 0) - (a.dr ?? 0) || a.i - b.i);
  scorers = [...d.marcatori].sort((a, b) => b.gol - a.gol);
  renderStats(d); renderTeams(); renderScorers();
  $('#agg').textContent = `Aggiornato alla Giornata ${d.giornata}`;
  setTab(location.hash === '#marcatori' ? 'marcatori' : 'classifica');
}).catch(() => { $('#agg').textContent = 'Impossibile caricare i dati. Controlla data.json.'; });
