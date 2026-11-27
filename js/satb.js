/* Editor čtyřhlasé sazby: zápis klikáním / MIDI / klávesnicí, kontrola, vzorové řešení */
'use strict';
const Satb = (() => {
  let focus = null; // editor, do kterého jdou tóny z MIDI a klávesnice
  const COLS = { chyba: 'var(--bad)', 'varování': 'var(--warn)' };

  /* vykreslení čtyřhlasu do velké osnovy
     cols = [[S,A,T,B]…], o = { K, specs, colors:[[…]], cur:{c,v}, labels:true, interactive } */
  function draw(cols, o) {
    const items = cols.map((v, c) => {
      const ps = [];
      v.forEach((p, i) => { if (p) ps.push({ ...p, st: i < 2 ? 0 : 1, color: (o.colors && o.colors[c] && o.colors[c][i]) || (o.fx && o.fx[c] && o.fx[c][i] ? 'var(--mut)' : null) }); });
      return { t: 'n', d: 'w', ps, lab: o.labels === false ? '' : (o.specs ? (o.hideLab && o.hideLab(c) ? '?' : H.label(o.specs[c])) : '') };
    });
    const svg = Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], key: o.K.acc, items, spacing: o.spacing || 5.4, minWidth: o.minWidth || 120 + cols.length * 70, fit: true, scale: o.scale || 1.35, interactive: o.interactive });
    if (o.cur && svg._xs[o.cur.c] != null) {
      const NS = 'http://www.w3.org/2000/svg';
      const r = document.createElementNS(NS, 'rect');
      const x = svg._xs[o.cur.c];
      r.setAttribute('x', x - 16); r.setAttribute('width', 32); r.setAttribute('y', 0); r.setAttribute('height', svg.viewBox.baseVal.height);
      r.setAttribute('class', 'colhl'); svg.insertBefore(r, svg.firstChild);
    }
    return svg;
  }

  /* přehrání průběhu */
  function play(cols, dur = 1.0) { Snd.stopAll(); cols.forEach((v, c) => { const ms = v.filter(Boolean).map(T.midi); Snd.chord(ms, c * dur, dur * 0.95); }); }

  /* editor
     t = { K, specs, fixed: [[S,A,T,B] | null …] (zadané tóny po akordech), onSolved(ok, usedSolution), sol } */
  function editor(host, t) {
    const n = t.specs.length;
    const fx = t.specs.map((_, c) => [0, 1, 2, 3].map(i => !!(t.fixed && t.fixed[c] && t.fixed[c][i])));
    const cols = t.specs.map((_, c) => [0, 1, 2, 3].map(i => fx[c][i] ? t.fixed[c][i] : null));
    const given = [0, 1, 2, 3].map(i => fx.every(r => r[i])); // hlas zadaný v celém průběhu
    let cur = { c: 0, v: 0 };
    let accSel = null; // null = podle předznamenání
    let colors = null, done = false;
    const sw = h('div', { class: 'qstaff satb' });
    const errs = h('div', { class: 'satberr', 'aria-live': 'polite' });
    const vRow = h('div', { class: 'altrow' });
    const aRow = h('div', { class: 'altrow' });
    const VLAB = ['S – soprán', 'A – alt', 'T – tenor', 'B – bas'];
    const vBtns = VLAB.map((l, i) => h('button', { class: 'chip vchip v' + i, disabled: given[i], onclick: () => { cur.v = i; render(); } }, l));
    vRow.append(h('span', { class: 'hint' }, 'Hlas: '), ...vBtns);
    const ACC = [[null, 'dle předznamenání'], [-1, '♭'], [0, '♮'], [1, '♯']];
    const aBtns = ACC.map(([a, l]) => h('button', { class: 'chip', onclick: () => { accSel = a; render(); } }, l));
    aRow.append(h('span', { class: 'hint' }, 'Posuvka: '), ...aBtns);

    function advance() {
      // další prázdný hlas v akordu, jinak další akord
      for (let k = 1; k <= 4 * n; k++) {
        const idx = cur.c * 4 + cur.v + k; const c = Math.floor(idx / 4) % n, v = idx % 4;
        if (!fx[c][v] && !cols[c][v]) { cur = { c, v }; return; }
      }
    }
    function place(p, c = cur.c) {
      if (done) return;
      cols[c][cur.v] = p; colors = null; errs.innerHTML = '';
      Snd.note(T.midi(p), 0, 0.8);
      advance(); render();
    }
    function render() {
      sw.innerHTML = '';
      sw.append(draw(cols, {
        K: t.K, specs: t.specs, colors, cur, fx,
        interactive: done ? null : {
          hint: true,
          alt: step => accSel == null ? T.keyAlt(t.K.acc, step) : accSel,
          onClick: (p, si, L) => {
            // akord podle polohy kliknutí
            const xs = sw.querySelector('svg')._xs; let c = 0, bd = 1e9;
            xs.forEach((x, i) => { const d = Math.abs(x - L.x); if (d < bd) { bd = d; c = i; } });
            cur.c = c;
            // hlas: zvolený, pokud patří do kliknuté osnovy; jinak první volný hlas v osnově
            const inStaff = si === 0 ? [0, 1] : [2, 3];
            if (!inStaff.includes(cur.v) || fx[c][cur.v]) {
              const free = inStaff.filter(i => !fx[c][i]);
              if (!free.length) return;
              cur.v = free.find(i => !cols[c][i]) ?? free[0];
            }
            accSel = null;
            place(p, c);
          },
        },
      }));
      vBtns.forEach((b, i) => b.classList.toggle('on', i === cur.v));
      aBtns.forEach((b, i) => b.classList.toggle('on', ACC[i][0] === accSel));
    }
    const offB = Bus.on('on', ({ m, src }) => {
      if (done || !host.isConnected || focus !== host) return;
      if (src === 'click') return; // klik na klaviaturu editoru se nepoužívá
      const p = H.spellIn(m, t.specs[cur.c], t.K);
      place(p);
    });
    const del = h('button', { class: 'btn ghost sm', onclick: () => { if (!fx[cur.c][cur.v]) { cols[cur.c][cur.v] = null; colors = null; render(); } } }, 'Smazat tón');
    const clr = h('button', { class: 'btn ghost sm', onclick: () => { cols.forEach((v, c) => v.forEach((_, i) => { if (!fx[c][i]) v[i] = null; })); cur = { c: 0, v: 0 }; advanceFrom(); colors = null; errs.innerHTML = ''; render(); } }, 'Vymazat vše');
    const playB = h('button', { class: 'btn ghost sm', onclick: () => play(cols) }, '▶ Přehrát');
    const chk = h('button', { class: 'btn primary', onclick: () => evaluate() }, 'Zkontrolovat');
    const solB = h('button', { class: 'btn ghost sm', onclick: () => showSolution() }, 'Vzorové řešení');
    function evaluate() {
      const res = H.check(cols, t.specs, t.K);
      colors = cols.map(() => [null, null, null, null]);
      res.forEach(r => r.voices.forEach(i => {
        const cs = r.pair ? [r.col - 1, r.col] : [r.col];
        cs.forEach(c => { if (colors[c][i] !== COLS.chyba) colors[c][i] = COLS[r.sev]; });
      }));
      render();
      const E = res.filter(r => r.sev === 'chyba'), W = res.filter(r => r.sev !== 'chyba');
      errs.innerHTML = '';
      if (!E.length) {
        errs.append(h('div', { class: 'okmsg' }, W.length ? `Bez chyb ✓ (${W.length} upozornění)` : 'Bez chyb ✓ Výborně.'));
      }
      const list = h('ul', {});
      [...E, ...W].forEach(r => list.append(h('li', { class: r.sev === 'chyba' ? 'e' : 'w' }, h('b', {}, r.pair ? `${r.col}.→${r.col + 1}. akord: ` : `${r.col + 1}. akord: `), r.msg)));
      if (E.length || W.length) errs.append(list);
      if (!E.length && t.onSolved) { done = true; render(); t.onSolved(true, false); }
    }
    function showSolution() {
      const sol = t.sol || H.solve(t.specs, t.K, t.specs.map((_, c) => { const f = {}; [0, 3].forEach(i => { if (fx[c][i]) f[i] = t.fixed[c][i]; }); return f; }));
      if (!sol) { errs.textContent = 'Řešení se nepodařilo najít.'; return; }
      const w = h('div', { class: 'qstaff sol' }, h('div', { class: 'hint' }, 'Vzorové řešení (jedna z možností):'));
      w.append(draw(sol, { K: t.K, specs: t.specs, scale: 1.2 }));
      w.append(h('button', { class: 'btn ghost sm', onclick: () => play(sol) }, '▶ Přehrát řešení'));
      errs.append(w);
      if (!done && t.onSolved) { done = true; render(); t.onSolved(false, true); }
    }
    focus = host; host.addEventListener('pointerdown', () => { focus = host; });
    host.append(h('p', { class: 'hint', html: 'Klikni do osnovy nebo hraj na MIDI / klávesnici počítače (<kbd>A</kbd>–<kbd>K</kbd>, oktáva <kbd>Q</kbd>/<kbd>X</kbd>). Tón se zapíše do zvýrazněného akordu a hlasu, potom se kurzor posune. Soprán a alt patří do horní osnovy, tenor a bas do dolní.' }), vRow, aRow, sw, h('div', { class: 'row2' }, chk, playB, del, clr, solB), errs);
    function advanceFrom() { if (fx[cur.c][cur.v] || cols[cur.c][cur.v]) advance(); }
    advanceFrom(); render();
    return { destroy: offB, cols };
  }

  /* cvičení: harmonizace zadaného basu / sopránu */
  function quiz(def) {
    return {
      id: def.id, title: def.title, desc: def.desc,
      options: def.options || [...(def.dur || def.minorOnly ? [] : [{ key: 'mode', label: 'Tónina', values: [['dur', 'durová'], ['moll', 'mollová'], ['mix', 'náhodně']] }]), { key: 'n', label: 'Počet akordů', values: [[4, '4'], [6, '6'], [8, '8']], def: def.n || 6 }],
      gen: o => {
        const tk = def.task ? def.task(o) : H.task({ level: def.level, n: o.n || def.n || 6, mode: def.dur ? 'dur' : def.minorOnly ? 'moll' : (o.mode || 'dur'), only: def.only, toks: def.toks ? pick(def.toks) : null, accs: def.accs });
        const which = def.given === 'mix' ? pick(['B', 'S']) : (def.given || 'B');
        const vi = which === 'B' ? 3 : 0;
        const fixed = tk.sol.map(v => { const r = [null, null, null, null]; r[vi] = v[vi]; return r; });
        const q = {
          html: def.html ? def.html(tk, which) : `<b>${tk.K.name}</b> – ${which === 'B' ? 'zadaný bas: doplň soprán, alt a tenor' : 'zadaný soprán: doplň alt, tenor a bas'}. Funkce jsou pod osnovou.`,
          explain: '',
          solutionPlay: () => play(tk.sol),
          custom: (host, finish, onClean) => {
            const ed = editor(host, { K: tk.K, specs: tk.specs, fixed, sol: null, onSolved: (ok, usedSol) => { q.explain = ok ? 'sazba je bez chyb' : 'zobrazeno vzorové řešení'; finish(ok); } });
            onClean(ed.destroy);
          },
        };
        return q;
      }
    };
  }
  return { draw, play, editor, quiz };
})();
