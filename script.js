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

function rosterHTML(s) {
  const list = [...(s.rosa || [])].sort((a, b) => !!b.portiere - !!a.portiere || (a.num ?? 999) - (b.num ?? 999));
  if (!list.length) return '';
  return `<h3 class="display rh">Rosa · ${list.length} giocatori</h3><ul class="rosa">` + list.map(p => `
    <li class="pl"><span class="pn num">${p.num ?? '–'}</span><span class="pname">${esc(p.nome)}</span>
    ${p.capitano ? '<em class="bd c" title="Capitano">C</em>' : ''}${p.portiere ? '<em class="bd g" title="Portiere">POR</em>' : ''}</li>`).join('') + '</ul>';
}

function openTeam(i) {
  const s = teams[i];
  $('#dlg').innerHTML = `<img class="big" src="${s.logo}" alt="Logo ${esc(s.nome)}">
    <h2 class="display">${esc(s.nome)}</h2><span class="pill">${i + 1}° posto · ${s.pt} punti</span>
    <div class="kv">${[['PG', s.pg], ['V', s.v], ['P', s.p], ['S', s.s], ['DR', s.dr ?? '–']].map(([k, v]) => `<div><b class="num">${v}</b><span>${k}</span></div>`).join('')}</div>
    ${rosterHTML(s)}
    <button class="close" autofocus>Chiudi</button>`;
  $('#dlg').showModal(); $('#dlg').scrollTop = 0;
}

function setTab(name) {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name));
  document.querySelectorAll('[role=tabpanel]').forEach(p => p.hidden = p.id !== 'panel-' + name);
  history.replaceState(null, '', '#' + name);
  if (name === 'calendario') centerPill();
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
  renderStats(d); renderTeams(); renderScorers(); initCal(d);
  $('#agg').textContent = `Aggiornato alla Giornata ${d.giornata}`;
  setTab(['marcatori', 'calendario'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'classifica');
}).catch(() => { $('#agg').textContent = 'Impossibile caricare i dati. Controlla data.json.'; });

/* ---------- CALENDARIO ---------- */
let cal = [], playoff = [], calSel = '1', calTeam = 'all';
const fmtD = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const dayLbl = iso => new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }).format(fmtD(iso)).replace(/\./g, '');
const played = m => m.gc != null && m.go != null;
const allMatches = () => [...cal.flatMap(g => g.partite.map(m => ({ ...m, g: g.giornata }))), ...playoff.map(m => ({ ...m, po: true }))]
  .sort((a, b) => a.data.localeCompare(b.data));
const nextMatch = () => allMatches().find(m => !played(m));

function initCal(d) {
  cal = d.calendario || []; playoff = d.playoff || [];
  const n = nextMatch();
  calSel = n ? (n.po ? 'po' : String(n.g)) : 'po';
  renderCal();
}

const mt = (n, w) => { const t = teams.find(x => x.nome === n);
  return `<div class="mt ${w ? 'win' : ''}">${t ? `<img src="${t.logo}" alt="">` : '<span class="ph">?</span>'}<span>${esc(n)}</span></div>`; };

function card(m, nx) {
  const p = played(m), isN = nx && nx.casa === m.casa && nx.data === m.data;
  return `<article class="mc fade ${isN ? 'nx' : ''}"><div class="mh"><span>${m.po ? esc(m.titolo) : 'Giornata ' + m.g}</span>
    <span>${isN ? '<em class="tag">Prossima</em> ' : ''}${dayLbl(m.data)}</span></div>
    <div class="mb">${mt(m.casa, p && m.gc > m.go)}<div class="sco num ${p ? '' : 'vs'}">${p ? `${m.gc}<i>–</i>${m.go}` : 'VS'}</div>${mt(m.ospite, p && m.go > m.gc)}</div></article>`;
}

function renderCal() {
  const nx = nextMatch();
  if (nx) {
    const days = Math.round((fmtD(nx.data) - new Date().setHours(0, 0, 0, 0)) / 864e5);
    const when = days < 0 ? 'Risultato in arrivo' : days === 0 ? 'Oggi' : days === 1 ? 'Domani' : `Tra ${days} giorni`;
    $('#nextm').innerHTML = `<div class="nextm fade"><small>Prossima partita · ${when}</small>
      <div class="nm">${esc(nx.casa)} <span>vs</span> ${esc(nx.ospite)}</div><small class="cap">${dayLbl(nx.data)}</small></div>`;
  } else $('#nextm').innerHTML = '';
  $('#cchips').innerHTML = `<button class="cchip all" data-f="all" aria-pressed="${calTeam === 'all'}">Tutte</button>` +
    teams.map(t => `<button class="cchip" data-f="${esc(t.nome)}" aria-pressed="${calTeam === t.nome}"><img src="${t.logo}" alt="">${esc(t.nome)}</button>`).join('');
  $('#gps').hidden = calTeam !== 'all';
  $('#gps').innerHTML = cal.map(g => `<button class="gp ${nx && nx.g === g.giornata ? 'nx' : ''}" data-g="${g.giornata}" aria-pressed="${calSel == g.giornata}">G${g.giornata}</button>`).join('')
    + `<button class="gp ${nx && nx.po ? 'nx' : ''}" data-g="po" aria-pressed="${calSel === 'po'}">Playoff</button>`;
  const list = calTeam !== 'all' ? allMatches().filter(m => !m.po && (m.casa === calTeam || m.ospite === calTeam))
    : allMatches().filter(m => calSel === 'po' ? m.po : !m.po && String(m.g) === String(calSel));
  $('#cal').innerHTML = list.map(m => card(m, nx)).join('');
  centerPill();
}

function centerPill() {
  const el = $('.gp[aria-pressed=true]'), box = $('#gps');
  if (el && box && el.offsetWidth) box.scrollLeft = el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2;
}

document.addEventListener('click', e => {
  const gp = e.target.closest('.gp'), ct = e.target.closest('.cchip');
  if (gp) { calSel = gp.dataset.g; renderCal(); }
  if (ct) { calTeam = ct.dataset.f; renderCal(); }
});
