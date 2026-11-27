/* Aplikace: navigace, kapitoly, laboratoř, pokrok, nastavení */
'use strict';
const Chapters = [];
const PARTS = [
  { n: 'I', title: 'Hudební nauka', sub: 'základy' },
  { n: 'II', title: 'Harmonie', sub: 'připravuje se', soon: true },
];
const SOON = [
  'Čtyřhlasá sazba', 'Hlavní funkce T–S–D a kadence', 'Sextakordy a kvartsextakordy', 'Dominantní septakord',
  'Vedlejší funkce a klamný spoj', 'Mollová harmonie', 'Vedlejší dominanty a modulace', 'Alterace a neapolský sextakord',
];

/* stavební kameny textu kapitol */
const Sec = (id, title, ...kids) => h('section', { class: 'sec', id }, h('h2', {}, title), ...kids);
const P_ = html => h('p', { html });
const Box = (cls, html) => h('div', { class: 'box ' + cls, html });
const Fig = (node, cap) => h('figure', { class: 'fig' }, node, cap ? h('figcaption', { html: cap }) : null);
const Tbl = (head, rows, cls = '') => h('div', { class: 'tblw' }, h('table', { class: 'tbl ' + cls },
  h('thead', {}, h('tr', {}, ...head.map(x => h('th', { html: x })))),
  h('tbody', {}, ...rows.map(r => h('tr', {}, ...r.map(x => h('td', { html: String(x) })))))));
const Ex = (def) => { const w = h('div', { class: 'exwrap' }); Quiz.mount(w, def); return w; };
const PlayBtn = (label, fn, cls = '') => h('button', { class: 'btn sm ' + cls, onclick: fn }, '▶ ' + label);

const App = (() => {
  const main = $('#main');
  const nav = $('#nav');

  function buildNav() {
    nav.innerHTML = '';
    nav.append(h('a', { href: '#/', class: 'nhome' }, 'Úvod'));
    PARTS.forEach((pt, pi) => {
      nav.append(h('div', { class: 'npart' }, h('b', {}, `Díl ${pt.n}`), ` ${pt.title}`, pt.soon ? h('em', {}, pt.sub) : null));
      const ol = h('ol', { class: 'nlist' });
      if (pt.soon) SOON.forEach(t => ol.append(h('li', {}, h('span', { class: 'soon' }, t))));
      Chapters.filter(c => c.part === pi + 1).forEach(c => {
        const qs = c.quizzes || [];
        const m = qs.filter(id => Stats.mastered(id)).length;
        ol.append(h('li', {}, h('a', { href: '#/' + c.id, 'data-id': c.id },
          h('span', { class: 'nn' }, c.n), h('span', { class: 'nt' }, c.title),
          qs.length ? h('span', { class: 'np', title: `zvládnuto ${m} z ${qs.length} cvičení` }, `${m}/${qs.length}`) : null)));
      });
      nav.append(ol);
    });
    nav.append(h('div', { class: 'npart' }, h('b', {}, 'Nástroje')));
    nav.append(h('ol', { class: 'nlist tools' },
      h('li', {}, h('a', { href: '#/sluch', 'data-id': 'sluch' }, h('span', { class: 'nn' }, '♪'), h('span', { class: 'nt' }, 'Sluchová výchova'))),
      h('li', {}, h('a', { href: '#/lab', 'data-id': 'lab' }, h('span', { class: 'nn' }, '⌨'), h('span', { class: 'nt' }, 'Laboratoř – co hraju?'))),
      h('li', {}, h('a', { href: '#/pokrok', 'data-id': 'pokrok' }, h('span', { class: 'nn' }, '✓'), h('span', { class: 'nt' }, 'Můj pokrok'))),
      h('li', {}, h('a', { href: '#/nastaveni', 'data-id': 'nastaveni' }, h('span', { class: 'nn' }, '⚙'), h('span', { class: 'nt' }, 'Vstupy a nastavení')))));
    mark();
  }
  function mark() {
    const id = location.hash.replace(/^#\/?/, '').split('/')[0] || '';
    $$('#nav a').forEach(a => a.classList.toggle('on', (a.dataset.id || '') === id || (id === '' && a.classList.contains('nhome'))));
  }

  function route() {
    const [id, anchor] = location.hash.replace(/^#\/?/, '').split('/');
    main.innerHTML = '';
    Snd.stopAll();
    document.body.classList.remove('navopen');
    const c = Chapters.find(x => x.id === id);
    if (c) renderChapter(c);
    else if (id === 'lab') renderLab();
    else if (id === 'pokrok') renderProgress();
    else if (id === 'nastaveni') renderSettings();
    else if (id === 'sluch') renderEar();
    else renderHome();
    mark();
    if (anchor) { const t = document.getElementById(anchor); if (t) t.scrollIntoView(); }
    else main.scrollTop = 0, window.scrollTo(0, 0);
  }

  function renderChapter(c) {
    const idx = Chapters.indexOf(c);
    const art = h('article', { class: 'chap' });
    art.append(h('header', { class: 'chead' }, h('div', { class: 'kick' }, `Díl ${PARTS[c.part - 1].n} · kapitola ${c.n}`), h('h1', {}, c.title), c.lead ? h('p', { class: 'lead', html: c.lead }) : null));
    const body = h('div', { class: 'cbody' });
    art.append(body);
    c.render(body);
    // obsah kapitoly
    const secs = $$('section.sec', body);
    if (secs.length > 2) {
      const toc = h('nav', { class: 'ctoc', 'aria-label': 'Obsah kapitoly' }, ...secs.map(s => h('a', { href: `#/${c.id}/${s.id}`, onclick: e => { e.preventDefault(); s.scrollIntoView({ behavior: 'smooth' }); } }, s.querySelector('h2').textContent)));
      art.insertBefore(toc, body);
    }
    const pn = h('nav', { class: 'pn' });
    if (idx > 0) pn.append(h('a', { href: '#/' + Chapters[idx - 1].id, class: 'prev' }, h('small', {}, 'předchozí'), Chapters[idx - 1].title));
    if (idx < Chapters.length - 1) pn.append(h('a', { href: '#/' + Chapters[idx + 1].id, class: 'next' }, h('small', {}, 'další'), Chapters[idx + 1].title));
    art.append(pn);
    main.append(art);
  }

  function renderHome() {
    const art = h('article', { class: 'chap home' });
    art.append(h('header', { class: 'chead' }, h('div', { class: 'kick' }, 'Interaktivní učebnice'), h('h1', {}, 'Hudební nauka a harmonie'),
      h('p', { class: 'lead', html: 'Od notové osnovy po čtyřhlasou sazbu. Každá kapitola má výklad s živými ukázkami a cvičení, ve kterých odpovídáš výběrem, hrou na klaviaturu nebo MIDI klávesy, zápisem do osnovy nebo zpěvem do mikrofonu.' })));
    const grid = h('div', { class: 'hgrid' });
    Chapters.filter(c => c.part === 1).forEach(c => {
      const qs = c.quizzes || []; const m = qs.filter(id => Stats.mastered(id)).length;
      grid.append(h('a', { class: 'hcard', href: '#/' + c.id }, h('span', { class: 'hn' }, c.n), h('b', {}, c.title), h('span', { class: 'hs' }, c.short || ''),
        qs.length ? h('span', { class: 'hbar' }, h('i', { style: `width:${100 * m / qs.length}%` })) : null));
    });
    art.append(h('h2', { class: 'hh' }, 'Díl I – Hudební nauka'), grid);
    art.append(h('h2', { class: 'hh' }, 'Díl II – Harmonie'), h('p', { class: 'mut' }, 'Připravuje se: ' + SOON.join(' · ') + '.'));
    art.append(h('div', { class: 'hint2' },
      h('h3', {}, 'Jak hrát'),
      h('ul', {},
        h('li', { html: '<b>Myš / dotyk</b> – klaviatura se objeví u každého cvičení, které ji používá; volná hra je v <a href="#/lab">Laboratoři</a>.' }),
        h('li', { html: '<b>Klávesnice počítače</b> – řada <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> <kbd>K</kbd> jsou bílé klávesy od c¹, <kbd>W</kbd> <kbd>E</kbd> <kbd>T</kbd> <kbd>Z</kbd> <kbd>U</kbd> černé; <kbd>Q</kbd>/<kbd>X</kbd> posune o oktávu.' }),
        h('li', { html: '<b>MIDI klávesy</b> – zapni v <a href="#/nastaveni">Nastavení</a> (Chrome nebo Edge).' }),
        h('li', { html: '<b>Mikrofon</b> – u cvičení se zpěvem; stránka rozpozná výšku jednoho zpívaného tónu.' }))));
    main.append(art);
  }

  /* --- laboratoř: volná hra s rozpoznáním intervalu / akordu --- */
  function renderLab() {
    const art = h('article', { class: 'chap' });
    art.append(h('header', { class: 'chead' }, h('div', { class: 'kick' }, 'Nástroje'), h('h1', {}, 'Laboratoř – co hraju?'),
      h('p', { class: 'lead', html: 'Hraj na klaviaturu, MIDI klávesy nebo klávesnici počítače. Držené tóny se zapíší do osnovy a stránka pojmenuje interval nebo akord včetně obratu. Pravopis tónů je u akordů zjednodušený (enharmonicky může vyjít jinak, než by se psalo v tónině).' })));
    const out = h('div', { class: 'labout' }, h('div', { class: 'lname' }, 'Zahraj tón nebo souzvuk'), h('div', { class: 'lsub' }, ' '));
    const sw = h('div', { class: 'qstaff lab' });
    const pw = h('div', { class: 'qpiano big' });
    let latch = store.get('latch', false), latched = [];
    const latchBox = h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: latch, onchange: e => { latch = e.target.checked; store.set('latch', latch); latched = []; show([...Held]); } }), 'Podržet tóny po puštění (klikání myší)');
    const clearB = h('button', { class: 'btn ghost sm', onclick: () => { latched = []; show([]); } }, 'Vymazat');
    art.append(h('div', { class: 'labgrid' }, h('div', {}, out, sw), h('div', { class: 'labctl' }, latchBox, clearB)), pw);
    main.append(art);
    const pi = Piano.create(pw, { from: 36, to: 96, h: 120 });
    function show(ms) {
      const list = [...new Set(ms)].sort((a, b) => a - b);
      sw.innerHTML = '';
      const ps = list.map(m => T.spellMidi(m));
      const tr = ps.filter(p => T.midi(p) >= 60), bs = ps.filter(p => T.midi(p) < 60);
      const items = [];
      if (ps.length) items.push({ t: 'n', d: 'w', ps: [...tr.map(p => ({ ...p, st: 0 })), ...bs.map(p => ({ ...p, st: 1 }))] });
      sw.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], items, minWidth: 220, fit: true }));
      const id = T.identify(list);
      out.querySelector('.lname').textContent = id ? id.text : 'Zahraj tón nebo souzvuk';
      out.querySelector('.lsub').textContent = id ? (id.sub || (list.length ? list.map(m => T.name(T.spellMidi(m))).join(' · ') : ' ')) : ' ';
    }
    show([]);
    const off1 = Bus.on('on', ({ m }) => { if (latch) { if (latched.includes(m)) latched = latched.filter(x => x !== m); else latched.push(m); show(latched); } });
    const off2 = Bus.on('held', hs => { if (!latch) show(hs); });
    const obs = new MutationObserver(() => { if (!art.isConnected) { off1(); off2(); pi.destroy(); obs.disconnect(); } });
    obs.observe(main, { childList: true });
  }

  /* --- přehled pokroku --- */
  function renderProgress() {
    const art = h('article', { class: 'chap' });
    art.append(h('header', { class: 'chead' }, h('div', { class: 'kick' }, 'Nástroje'), h('h1', {}, 'Můj pokrok'),
      h('p', { class: 'lead', html: 'Cvičení je <b>zvládnuté</b>, když z posledních 20 a více pokusů máš alespoň 90 % správně. Pokrok se ukládá jen v tomto prohlížeči.' })));
    Chapters.forEach(c => {
      if (!c.quizzes || !c.quizzes.length) return;
      // kapitolu je potřeba jednou vykreslit, aby se zaregistrovaly definice cvičení
      if (!c.quizzes.every(id => ALL_QUIZZES[id])) { const tmp = h('div'); c.render(tmp); }
      const rows = c.quizzes.map(id => {
        const d = ALL_QUIZZES[id] || { title: id }; const s = Stats.get(id); const p = Stats.pct(id);
        return [`<a href="#/${c.id}/q-${id}">${d.title}</a>`, s.n ? `${p} %` : '–', `${s.ok}/${s.n}`, Stats.mastered(id) ? '<span class="ok">zvládnuto</span>' : s.n ? 'procvičuje se' : ''];
      });
      art.append(h('h2', { class: 'hh' }, `${c.n}. ${c.title}`), Tbl(['Cvičení', 'Úspěšnost (posl. 30)', 'Celkem', 'Stav'], rows, 'prog'));
    });
    art.append(h('button', { class: 'btn ghost', onclick: () => { if (confirm('Opravdu smazat veškerý uložený pokrok?')) { Object.keys(localStorage).filter(k => k.startsWith('hn:st:')).forEach(k => localStorage.removeItem(k)); route(); buildNav(); } } }, 'Smazat pokrok'));
    main.append(art);
  }

  /* --- nastavení vstupů --- */
  function renderSettings() {
    const art = h('article', { class: 'chap' });
    art.append(h('header', { class: 'chead' }, h('div', { class: 'kick' }, 'Nástroje'), h('h1', {}, 'Vstupy a nastavení')));
    const midiSt = h('span', { class: 'pill' }, midiText());
    function midiText() { return { off: 'vypnuto', on: 'připojeno: ' + Midi.names.join(', '), none: 'povoleno, ale žádné zařízení', denied: 'přístup odmítnut', unsupported: 'prohlížeč MIDI nepodporuje (použij Chrome nebo Edge)' }[Midi.status]; }
    const offM = Bus.on('midi', () => { midiSt.textContent = midiText(); });
    const vol = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: Snd.volume, oninput: e => Snd.setVolume(+e.target.value) });
    const snd = h('span', { class: 'pill' }, Snd.loaded ? 'vzorky klavíru načteny' : 'načte se po prvním tónu');
    const offA = (() => { const f = e => snd.textContent = e.detail.loaded ? `vzorky klavíru načteny (${e.detail.ok})` : 'vzorky se nepodařilo načíst – hraje syntéza'; document.addEventListener('audio-status', f); return () => document.removeEventListener('audio-status', f); })();
    const tuner = h('div', { class: 'tuner big' }, h('div', { class: 'tn' }, '–'), h('div', { class: 'tbar' }, h('i')), h('div', { class: 'tf mut' }, ' '));
    let offMic = null;
    const micB = h('button', { class: 'btn', onclick: async () => {
      if (Mic.running) { Mic.stop(); micB.textContent = '🎤 Zapnout mikrofon'; return; }
      if (await Mic.start()) {
        micB.textContent = 'Vypnout mikrofon';
        offMic = Mic.on(r => {
          if (!r) { tuner.querySelector('.tn').textContent = '–'; return; }
          tuner.querySelector('.tn').innerHTML = `${T.name(T.spellMidi(r.note))} <small>${r.cents > 0 ? '+' : ''}${r.cents} c</small>`;
          tuner.querySelector('.tbar i').style.left = (50 + r.cents / 2) + '%';
          tuner.querySelector('.tbar i').className = Math.abs(r.cents) < 15 ? 'good' : '';
          tuner.querySelector('.tf').textContent = r.f.toFixed(1) + ' Hz';
        });
      } else micB.textContent = 'Mikrofon nepovolen';
    } }, Mic.running ? 'Vypnout mikrofon' : '🎤 Zapnout mikrofon');
    art.append(
      Sec('zvuk', 'Zvuk', P_('Klavír používá nahrávky Salamander Grand Piano (Alexander Holm, licence CC-BY 3.0), které se stahují při prvním zahrání. Bez připojení hraje jednoduchá syntéza.'),
        h('div', { class: 'srow' }, h('label', {}, 'Hlasitost'), vol, snd), h('div', { class: 'srow' }, PlayBtn('Zkušební akord', () => Snd.chord([60, 64, 67, 72])))),
      Sec('midi', 'MIDI klávesy', P_('Připoj MIDI klávesy USB kabelem a povol přístup. Funguje v Chrome a Edge; Firefox vyžaduje doplněk, Safari MIDI nepodporuje. Tóny z MIDI se počítají ve všech cvičeních s klaviaturou.'),
        h('div', { class: 'srow' }, h('button', { class: 'btn', onclick: () => Midi.start() }, 'Povolit MIDI'), midiSt)),
      Sec('pc', 'Klávesnice počítače', P_('Bílé klávesy: <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> <kbd>K</kbd> (c až c o oktávu výš), černé: <kbd>W</kbd> <kbd>E</kbd> <kbd>T</kbd> <kbd>Z</kbd>/<kbd>Y</kbd> <kbd>U</kbd>. <kbd>Q</kbd> a <kbd>X</kbd> posouvají o oktávu dolů a nahoru.'),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: KeyMap.enabled, onchange: e => KeyMap.enabled = e.target.checked }), 'Hrát z klávesnice počítače')),
      Sec('mic', 'Mikrofon a ladička', P_('Detekce rozpozná jeden tón (zpěv, flétna, smyčec). Akord z mikrofonu rozpoznat nejde. Nejlépe funguje ve sluchátkách, aby mikrofon neslyšel zvuk z reproduktorů. Odchylka je v centech (100 centů = půltón).'),
        h('div', { class: 'srow' }, micB), tuner),
    );
    main.append(art);
    const obs = new MutationObserver(() => { if (!art.isConnected) { offM(); offA(); if (offMic) offMic(); obs.disconnect(); } });
    obs.observe(main, { childList: true });
  }

  /* sluchová výchova – stránka se skládá z cvičení, která registrují kapitoly */
  const EarSets = [];
  function renderEar() {
    const art = h('article', { class: 'chap' });
    art.append(h('header', { class: 'chead' }, h('div', { class: 'kick' }, 'Nástroje'), h('h1', {}, 'Sluchová výchova'),
      h('p', { class: 'lead', html: 'Všechna poslechová cvičení na jednom místě. Stránka zahraje ukázku a ty určuješ, co slyšíš. Odpovídat můžeš výběrem, nebo zahraním na klaviaturu.' })));
    const body = h('div', { class: 'cbody' });
    EarSets.forEach(([title, defs]) => { body.append(Sec('e-' + defs[0].id, title, ...defs.map(d => Ex({ ...d, id: d.id })))); });
    art.append(body);
    main.append(art);
  }

  function init() {
    buildNav();
    addEventListener('hashchange', route);
    Bus.on('stats', () => { clearTimeout(init._t); init._t = setTimeout(buildNav, 300); });
    $('#navbtn').addEventListener('click', () => document.body.classList.toggle('navopen'));
    // stavové kontrolky v hlavičce
    const st = $('#status');
    const upd = () => {
      st.innerHTML = '';
      st.append(h('a', { href: '#/nastaveni', class: 'stp ' + (Midi.status === 'on' ? 'on' : ''), title: 'MIDI' }, 'MIDI'));
      st.append(h('a', { href: '#/nastaveni', class: 'stp ' + (Mic.running ? 'on' : ''), title: 'Mikrofon' }, 'MIC'));
    };
    Bus.on('midi', upd); Bus.on('mic', upd); upd();
    if (store.get('midiOn', false)) Midi.start();
    // první dotyk odemkne zvuk
    addEventListener('pointerdown', () => Snd.ensure(), { once: true });
    addEventListener('keydown', () => Snd.ensure(), { once: true });
    // tlačítko tématu
    const tb = $('#theme');
    const setT = t => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; store.set('theme', t || null); };
    setT(store.get('theme', null));
    tb.addEventListener('click', () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); setT(cur === 'dark' ? 'light' : 'dark'); });
    route();
  }
  return { init, EarSets, route };
})();
