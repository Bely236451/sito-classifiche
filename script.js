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
    <button class="tr fade ${i === 0 ? 'lead' : ''} ${s.nome === fav ? 'fav' : ''}" style="animation-delay:${i * 60}ms" data-i="${i}" aria-label="Dettagli ${esc(s.nome)}">
      <b class="num">${i + 1}</b>
      <div class="tm"><img src="${s.logo}" alt="" loading="lazy"><span>${esc(s.nome)}${s.nome === fav ? ' ★' : ''}</span></div>
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
    ${s.why ? `<small class="why">Spareggio: ${s.why}</small>` : ''}
    <button class="favbtn" data-fav="${esc(s.nome)}" aria-pressed="${fav === s.nome}">${favLabel(s.nome)}</button>
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
  if (e.target.closest('.close')) e.target.closest('dialog').close(); else if (e.target.tagName === 'DIALOG') e.target.close();
  const fb = e.target.closest('.favbtn'), sr = e.target.closest('.sr');
  if (fb) { setFav(fb.dataset.fav); fb.textContent = favLabel(fb.dataset.fav); fb.setAttribute('aria-pressed', fav === fb.dataset.fav); }
  if (sr) { $('#srch').close(); openTeam(+sr.dataset.ti); }
  if (e.target.closest('#sbtn')) { $('#srch').showModal(); $('#q').focus(); }
});

fetch(DATA_URL, { cache: 'no-cache' }).then(r => r.json()).then(d => {
  teams = rankTeams(d.squadre, d.calendario || []);
  scorers = [...d.marcatori].sort((a, b) => b.gol - a.gol);
  renderStats(d); renderTeams(); renderLeagueStats(); renderScorers(); initCal(d);
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
  return `<div class="mt ${w ? 'win' : ''}">${t ? `<img src="${t.logo}" alt="">` : '<span class="ph">?</span>'}<span>${esc(n)}${n === fav ? ' ★' : ''}</span></div>`; };

function card(m, nx) {
  const p = played(m), isN = nx && nx.casa === m.casa && nx.data === m.data, mine = fav && (m.casa === fav || m.ospite === fav);
  return `<article class="mc fade ${isN ? 'nx' : ''} ${mine ? 'mine' : ''}"><div class="mh"><span>${m.po ? esc(m.titolo) : 'Giornata ' + m.g}</span>
    <span>${isN ? '<em class="tag">Prossima</em> ' : ''}${dayLbl(m.data)}</span></div>
    <div class="mb">${mt(m.casa, p && m.gc > m.go)}<div class="sco num ${p ? '' : 'vs'}">${p ? `${m.gc}<i>–</i>${m.go}` : 'VS'}</div>${mt(m.ospite, p && m.go > m.gc)}</div>
    ${p ? '' : `<button class="ics" data-ics="${esc(m.casa)}|${m.data}">🔔 Aggiungi al calendario</button>`}</article>`;
}

const banner = (m, label, cls = '') => {
  const days = Math.round((fmtD(m.data) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  const when = days < 0 ? 'Risultato in arrivo' : days === 0 ? 'Oggi' : days === 1 ? 'Domani' : `Tra ${days} giorni`;
  return `<div class="nextm fade ${cls}"><small>${label} · ${when}</small>
    <div class="nm">${esc(m.casa)} <span>vs</span> ${esc(m.ospite)}</div><small class="cap">${dayLbl(m.data)}</small></div>`;
};

function renderCal() {
  const nx = nextMatch(), fn = fav && allMatches().find(m => !played(m) && (m.casa === fav || m.ospite === fav));
  $('#nextm').innerHTML = (nx ? banner(nx, 'Prossima partita') : '') +
    (fn && !(nx && nx.casa === fn.casa && nx.data === fn.data) ? banner(fn, `★ ${esc(fav)}`, 'mine') : '');
  $('#cchips').innerHTML = `<button class="cchip all" data-f="all" aria-pressed="${calTeam === 'all'}">Tutte</button>` +
    teams.map(t => `<button class="cchip" data-f="${esc(t.nome)}" aria-pressed="${calTeam === t.nome}"><img src="${t.logo}" alt="">${esc(t.nome)}${t.nome === fav ? ' ★' : ''}</button>`).join('');
  $('#gps').hidden = calTeam !== 'all';
  $('#gps').innerHTML = cal.map(g => `<button class="gp ${nx && nx.g === g.giornata ? 'nx' : ''}" data-g="${g.giornata}" aria-pressed="${calSel == g.giornata}">G${g.giornata}</button>`).join('')
    + `<button class="gp ${nx && nx.po ? 'nx' : ''}" data-g="po" aria-pressed="${calSel === 'po'}">Playoff</button>`;
  const list = calTeam !== 'all' ? allMatches().filter(m => !m.po && (m.casa === calTeam || m.ospite === calTeam))
    : allMatches().filter(m => calSel === 'po' ? m.po : !m.po && String(m.g) === String(calSel));
  const todo = calTeam !== 'all' && list.some(m => !played(m));
  $('#cal').innerHTML = (todo ? `<button class="icsall">🔔 Aggiungi tutte le partite di ${esc(calTeam)} al calendario</button>` : '') + list.map(m => card(m, nx)).join('');
  centerPill();
}

function centerPill() {
  const el = $('.gp[aria-pressed=true]'), box = $('#gps');
  if (el && box && el.offsetWidth) box.scrollLeft = el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2;
}

/* ---------- Promemoria (.ics) ---------- */
const slug = t => t.replace(/[^a-z0-9]/gi, '');
const icsTxt = t => String(t).replace(/([,;\\])/g, '\\$1');
const ymd = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
function downloadIcs(list, name) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ev = list.map(m => { const d = fmtD(m.data), n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return ['BEGIN:VEVENT', `UID:${m.data}-${slug(m.casa)}-${slug(m.ospite)}@campettoleague`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(n)}`, `SUMMARY:${icsTxt(m.casa + ' vs ' + m.ospite)} (Campetto League)`,
      `DESCRIPTION:${icsTxt((m.po ? m.titolo : 'Giornata ' + m.g) + '. Orario da confermare.')}`, 'END:VEVENT'].join('\r\n'); });
  const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Campetto League//IT', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = name + '.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

document.addEventListener('click', e => {
  const gp = e.target.closest('.gp'), ct = e.target.closest('.cchip'), ib = e.target.closest('.ics'), ia = e.target.closest('.icsall');
  if (gp) { calSel = gp.dataset.g; renderCal(); }
  if (ct) { calTeam = ct.dataset.f; renderCal(); }
  if (ib) { const [c, dt] = ib.dataset.ics.split('|'), m = allMatches().find(x => x.casa === c && x.data === dt); if (m) downloadIcs([m], 'campetto-league-' + slug(c) + '-' + dt); }
  if (ia) downloadIcs(allMatches().filter(m => !played(m) && !m.po && (m.casa === calTeam || m.ospite === calTeam)), 'campetto-league-' + slug(calTeam));
});

/* ---------- Squadra del cuore ---------- */
let fav = ''; try { fav = localStorage.getItem('cl-fav') || ''; } catch {}
const favLabel = n => fav === n ? '★ La tua squadra del cuore' : '☆ Imposta come squadra del cuore';
function setFav(n) {
  fav = fav === n ? '' : n;
  try { fav ? localStorage.setItem('cl-fav', fav) : localStorage.removeItem('cl-fav'); } catch {}
  renderTeams(); renderCal();
}

/* ---------- Cerca giocatore ---------- */
const norm = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
$('#q').addEventListener('input', () => {
  const q = norm($('#q').value.trim());
  if (!q) return $('#qres').innerHTML = '';
  const res = teams.flatMap((t, ti) => (t.rosa || []).map(p => ({ ...p, t, ti })))
    .filter(p => norm(p.nome).includes(q) || String(p.num ?? '') === q || norm(p.t.nome).includes(q)).slice(0, 30);
  $('#qres').innerHTML = res.length ? res.map(p => `<button class="sr" data-ti="${p.ti}"><img src="${p.t.logo}" alt="">
    <span><b>${esc(p.nome)}</b><small>${esc(p.t.nome)} · n. ${p.num ?? '–'}</small></span>
    ${p.capitano ? '<em class="bd c">C</em>' : ''}${p.portiere ? '<em class="bd g">POR</em>' : ''}</button>`).join('')
    : '<p class="hint">Nessun risultato.</p>';
});
$('#srch').addEventListener('close', () => { $('#q').value = ''; $('#qres').innerHTML = ''; });

/* ---------- Classifica: spareggi (scontri diretti > diff. reti > gol fatti) ---------- */
function rankTeams(squadre, calendario) {
  const base = squadre.map((s, i) => ({ ...s, pt: s.v * 3 + s.p, dr: s.gf != null && s.gs != null ? s.gf - s.gs : null, i }));
  const games = calendario.flatMap(g => g.partite).filter(m => m.gc != null && m.go != null);
  const out = [], keys = [['sd', 'scontri diretti'], ['sdd', 'scontri diretti'], ['d', 'differenza reti'], ['gf', 'gol fatti']];
  [...new Set(base.map(t => t.pt))].sort((a, b) => b - a).forEach(pt => {
    const grp = base.filter(t => t.pt === pt), names = grp.map(t => t.nome), mini = {};
    grp.forEach(t => mini[t.nome] = { p: 0, d: 0 });
    games.filter(m => names.includes(m.casa) && names.includes(m.ospite)).forEach(m => {
      const a = mini[m.casa], b = mini[m.ospite];
      a.d += m.gc - m.go; b.d += m.go - m.gc;
      if (m.gc > m.go) a.p += 3; else if (m.gc < m.go) b.p += 3; else { a.p++; b.p++; }
    });
    grp.forEach(t => { t.sd = mini[t.nome].p; t.sdd = mini[t.nome].d; t.d = t.dr ?? 0; t.gf = t.gf ?? 0; });
    grp.sort((a, b) => b.sd - a.sd || b.sdd - a.sdd || b.d - a.d || b.gf - a.gf || a.i - b.i);
    if (grp.length > 1) grp.forEach((t, k) => { const o = grp[k + 1] || grp[k - 1], f = keys.find(([x]) => t[x] !== o[x]); if (f) t.why = f[1]; });
    out.push(...grp);
  });
  return out;
}

/* ---------- Statistiche di lega ---------- */
function renderLeagueStats() {
  const v = teams.filter(t => t.gf != null && t.gs != null && t.pg > 0);
  if (!v.length) return $('#lstats').innerHTML = '';
  const pick = (k, f) => { const m = Math[f](...v.map(t => t[k])); return v.filter(t => t[k] === m); };
  const fmt = n => n.toFixed(1).replace('.', ',');
  const att = pick('gf', 'max'), def = pick('gs', 'min');
  const goals = v.reduce((a, t) => a + t.gf, 0), matches = Math.round(v.reduce((a, t) => a + t.pg, 0) / 2) || 1;
  const box = (ttl, who, big, sub) => `<div class="ls fade"><small>${ttl}</small>
    <div class="lw">${who.map(t => `<img src="${t.logo}" alt="">`).join('')}<b class="display">${who.map(t => esc(t.nome)).join(' · ')}</b></div>
    <div class="lbig num">${big}</div><small>${sub}</small></div>`;
  $('#lstats').innerHTML =
    box('Miglior attacco', att, att[0].gf, `gol fatti · ${fmt(att[0].gf / att[0].pg)} a partita`) +
    box('Miglior difesa', def, def[0].gs, `gol subiti · ${fmt(def[0].gs / def[0].pg)} a partita`) +
    `<div class="ls fade"><small>Media gol a partita</small><div class="lbig num big2">${fmt(goals / matches)}</div><small>${goals} gol in ${matches} partite</small></div>`;
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
