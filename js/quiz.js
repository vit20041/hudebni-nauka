/* Obecný rámec cvičení: volby, klaviatura/MIDI, zpěv do mikrofonu, zápis do osnovy */
'use strict';
const Stats = {
  get(id) { return store.get('st:' + id, { n: 0, ok: 0, hist: [] }); },
  add(id, ok) {
    const s = this.get(id); s.n++; if (ok) s.ok++;
    s.hist.push(ok ? 1 : 0); if (s.hist.length > 30) s.hist.shift();
    s.t = Date.now(); store.set('st:' + id, s); Bus.emit('stats', id); return s;
  },
  pct(id) { const s = this.get(id); return s.hist.length ? Math.round(100 * s.hist.reduce((a, b) => a + b, 0) / s.hist.length) : null; },
  mastered(id) { const s = this.get(id); return s.hist.length >= 20 && this.pct(id) >= 90; },
};
const ALL_QUIZZES = {}; // id -> definice (pro přehled pokroku)

const Quiz = (() => {
  let active = null;
  const MODE_LABEL = { choice: 'Výběr', piano: 'Klaviatura / MIDI', sing: 'Zpěv', write: 'Zápis do osnovy' };

  function mount(host, def) {
    ALL_QUIZZES[def.id] = def;
    const opts = {};
    (def.options || []).forEach(o => { opts[o.key] = store.get(`qo:${def.id}:${o.key}`, o.def ?? o.values[0][0]); });
    const box = h('div', { class: 'quiz', id: 'q-' + def.id });
    const head = h('div', { class: 'qhead' },
      h('div', {}, h('h4', {}, def.title), def.desc ? h('p', { class: 'qdesc', html: def.desc }) : null),
      h('div', { class: 'qscore' }));
    const optRow = h('div', { class: 'qopts' });
    (def.options || []).forEach(o => {
      const sel = h('select', { 'aria-label': o.label, onchange: () => { opts[o.key] = isNaN(+sel.value) || sel.value === '' ? sel.value : +sel.value; store.set(`qo:${def.id}:${o.key}`, opts[o.key]); next(); } },
        ...o.values.map(([v, l]) => h('option', { value: v, selected: String(v) === String(opts[o.key]) }, l)));
      optRow.append(h('label', { class: 'qopt' }, h('span', {}, o.label), sel));
    });
    const modeRow = h('div', { class: 'qmodes', role: 'tablist' });
    const body = h('div', { class: 'qbody' });
    const prompt = h('div', { class: 'qprompt' });
    const input = h('div', { class: 'qinput' });
    const fb = h('div', { class: 'qfb', 'aria-live': 'polite' });
    const ctrl = h('div', { class: 'qctrl' });
    body.append(prompt, input, fb, ctrl);
    const start = h('button', { class: 'btn primary', onclick: () => { box.classList.add('live'); start.remove(); next(); } }, 'Začít cvičení');
    box.append(head, optRow, modeRow, body);
    body.append(start);
    host.append(box);
    let q = null, mode = null, done = false, cleanup = [];
    let modePref = store.get('qm:' + def.id, null);
    const score = () => {
      const s = Stats.get(def.id), p = Stats.pct(def.id);
      head.querySelector('.qscore').innerHTML = s.n ? `<b>${p} %</b><span>posledních ${s.hist.length} · celkem ${s.ok}/${s.n}</span>${Stats.mastered(def.id) ? '<i class="ok">zvládnuto</i>' : ''}` : '<span>zatím bez pokusu</span>';
    };
    score();

    function clean() { cleanup.forEach(f => f()); cleanup = []; }
    function next() {
      if (!box.classList.contains('live')) return;
      clean(); done = false;
      q = def.gen(opts);
      prompt.innerHTML = ''; input.innerHTML = ''; fb.innerHTML = ''; fb.className = 'qfb'; ctrl.innerHTML = '';
      if (q.html) prompt.append(h('div', { class: 'qtext', html: q.html }));
      if (q.staff) { const w = h('div', { class: 'qstaff' }); w.append(Staff.draw({ scale: 1.5, ...q.staff })); prompt.append(w); }
      if (q.node) prompt.append(q.node);
      if (q.play) {
        const pb = h('button', { class: 'btn', onclick: () => q.play() }, '▶ Přehrát znovu');
        prompt.append(pb);
        setTimeout(() => q.play(), 250);
      }
      const modes = [];
      if (q.choices) modes.push('choice');
      if (q.expect) modes.push('piano');
      if (q.write) modes.push('write');
      if (q.sing) modes.push('sing');
      if (q.custom) modes.length = 0;
      mode = q.custom ? 'custom' : modes.includes(modePref) ? modePref : modes[0];
      modeRow.innerHTML = '';
      if (modes.length > 1) modes.forEach(m => modeRow.append(h('button', {
        class: 'chip' + (m === mode ? ' on' : ''), role: 'tab', 'aria-selected': m === mode,
        onclick: () => { modePref = m; store.set('qm:' + def.id, m); mode = m; $$('.chip', modeRow).forEach(b => { b.classList.toggle('on', b.textContent === MODE_LABEL[m]); b.setAttribute('aria-selected', b.textContent === MODE_LABEL[m]); }); renderInput(); }
      }, MODE_LABEL[m])));
      renderInput();
      ctrl.append(h('button', { class: 'btn ghost', onclick: () => { if (!done) finish(false, true); } }, 'Ukázat řešení'));
      active = api;
    }

    function renderInput() {
      clean(); input.innerHTML = '';
      if (done) return;
      if (mode === 'choice') {
        const wrap = h('div', { class: 'choices' + (q.choices.length > 6 ? ' many' : '') });
        q.choices.forEach(c => {
          const val = typeof c === 'object' ? c.value : c, lab = typeof c === 'object' ? c.label : c;
          wrap.append(h('button', { class: 'choice', html: lab, onclick: e => { if (done) return; const ok = Array.isArray(q.answer) ? q.answer.includes(val) : val === q.answer; e.currentTarget.classList.add(ok ? 'good' : 'bad'); finish(ok); } }));
        });
        input.append(wrap);
      }
      if (mode === 'piano') pianoInput();
      if (mode === 'write') writeInput();
      if (mode === 'sing') singInput();
      if (mode === 'custom') q.custom(input, ok => finish(ok), f => cleanup.push(f));
    }

    function pianoInput() {
      const E = q.expect; const need = E.notes.length;
      const got = [];
      const show = h('div', { class: 'qgot' });
      const range = E.range || def.range || [48, 84];
      const pw = h('div', { class: 'qpiano' });
      input.append(h('p', { class: 'hint' }, E.hint || (need === 1 ? 'Zahraj tón na klaviatuře, MIDI klávesách nebo na klávesnici počítače (A–K).' : E.seq ? `Zahraj postupně ${need} tónů.` : `Zahraj ${need} tóny (najednou nebo postupně).`)), show, pw);
      const pi = Piano.create(pw, { from: range[0], to: range[1] });
      cleanup.push(() => pi.destroy());
      const reset = h('button', { class: 'btn ghost sm', onclick: () => { got.length = 0; upd(); } }, 'Smazat');
      if (need > 1) input.append(reset);
      const upd = () => { show.textContent = got.length ? got.map(m => T.name(T.spellMidi(m))).join(' · ') : ' '; };
      upd();
      const off = Bus.on('on', ({ m }) => {
        if (done || active !== api) return;
        if (!E.seq && got.includes(m)) return;
        got.push(m); upd();
        if (got.length >= need) {
          const norm = a => E.pc ? a.map(x => ((x % 12) + 12) % 12) : a;
          let ok;
          if (E.seq) ok = norm(got).every((x, i) => x === norm(E.notes)[i]);
          else { const A = [...new Set(norm(got))].sort((a, b) => a - b), B = [...new Set(norm(E.notes))].sort((a, b) => a - b); ok = A.length === B.length && A.every((x, i) => x === B[i]); }
          E.notes.forEach(m2 => pi.mark(m2, 'want'));
          finish(ok);
        }
      });
      cleanup.push(off);
    }

    function writeInput() {
      const W = q.write;
      const placed = [];
      let alt = 0;
      const host2 = h('div', { class: 'qstaff write' });
      const altRow = h('div', { class: 'altrow' });
      const ALTS = [[-2, '𝄫 dvojbéčko'], [-1, '♭ béčko'], [0, 'bez posuvky'], [1, '♯ křížek'], [2, '𝄪 dvojkřížek']];
      const useKey = W.key != null && W.key !== 0;
      ALTS.forEach(([a, l]) => altRow.append(h('button', { class: 'chip' + (a === 0 ? ' on' : ''), onclick: e => { alt = a; $$('.chip', altRow).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, l)));
      const need = W.target.length;
      const redraw = () => {
        host2.innerHTML = '';
        const items = (W.items || []).map(x => ({ ...x }));
        const slotItems = placed.map(p => ({ t: 'n', d: 'w', ps: [{ ...p, color: 'var(--accent)' }] }));
        const svg = Staff.draw({
          staves: W.staves || [{ clef: W.clef || 'g' }], key: W.key || 0,
          items: W.chord ? [...items, ...(placed.length ? [{ t: 'n', d: 'w', ps: placed.map(p => ({ ...p, color: 'var(--accent)' })) }] : [])] : [...items, ...slotItems],
          minWidth: 360, fit: true, scale: 1.6,
          interactive: {
            hint: true,
            alt: step => alt === 0 && useKey ? T.keyAlt(W.key, step) : alt,
            onClick: p => { if (done) return; placed.push(p); Snd.note(T.midi(p)); redraw(); if (placed.length >= need) check(); },
          },
        });
        host2.append(svg);
      };
      const check = () => {
        let ok;
        if (W.check) ok = W.check(placed);
        else if (W.chord) { const k = a => a.map(p => T.dia(p) * 10 + p.alt).sort((x, y) => x - y).join(); ok = k(placed) === k(W.target); }
        else ok = placed.every((p, i) => T.eq(p, W.target[i]));
        finish(ok, false, placed);
      };
      input.append(h('p', { class: 'hint', html: W.hint || 'Klikni do osnovy. Posuvku vyber předem tlačítkem.' }), altRow, host2,
        h('button', { class: 'btn ghost sm', onclick: () => { placed.pop(); redraw(); } }, 'Zpět'));
      redraw();
    }

    function singInput() {
      const Sg = q.sing; let idx = 0, since = 0;
      const tuner = h('div', { class: 'tuner' }, h('div', { class: 'tn' }, '–'), h('div', { class: 'tbar' }, h('i')), h('div', { class: 'tprog' }));
      const stBtn = h('button', { class: 'btn', onclick: async () => { const ok = await Mic.start(); stBtn.textContent = ok ? 'Mikrofon běží' : 'Mikrofon nepovolen'; stBtn.disabled = ok; } }, Mic.running ? 'Mikrofon běží' : '🎤 Zapnout mikrofon');
      if (Mic.running) stBtn.disabled = true;
      const toneBtn = h('button', { class: 'btn ghost', onclick: () => Snd.note(Sg.notes[idx], 0, 1.2) }, 'Zahrát tón, který mám zpívat');
      input.append(h('p', { class: 'hint', html: Sg.hint || 'Zazpívej (nebo zahraj na nástroj) požadovaný tón a chvíli ho drž. Oktáva nezáleží.' }), h('div', { class: 'row2' }, stBtn, toneBtn), tuner);
      const prog = () => { tuner.querySelector('.tprog').innerHTML = Sg.notes.map((m, i) => `<span class="${i < idx ? 'ok' : i === idx ? 'cur' : ''}">${Sg.labels ? Sg.labels[i] : T.name(T.spellMidi(m), { oct: false })}</span>`).join(''); };
      prog();
      const off = Mic.on(r => {
        if (done) return;
        const tn = tuner.querySelector('.tn'), bar = tuner.querySelector('.tbar i');
        if (!r) { tn.textContent = '–'; bar.style.left = '50%'; since = 0; return; }
        const tgt = Sg.notes[idx];
        // vzdálenost v centech od cíle, oktáva volná
        let diff = (r.midi - tgt) * 100;
        if (Sg.octFree !== false) diff = ((diff % 1200) + 1800) % 1200 - 600;
        tn.innerHTML = `${T.name(T.spellMidi(r.note))} <small>${r.cents > 0 ? '+' : ''}${r.cents} c</small>`;
        const c = Math.max(-100, Math.min(100, diff));
        bar.style.left = (50 + c / 2) + '%';
        bar.className = Math.abs(diff) < 40 ? 'good' : '';
        if (Math.abs(diff) < 40) {
          if (!since) since = performance.now();
          if (performance.now() - since > 400) { idx++; since = 0; prog(); if (idx >= Sg.notes.length) finish(true); }
        } else since = 0;
      });
      cleanup.push(off);
    }

    function finish(ok, gaveUp = false) {
      if (done) return; done = true;
      Stats.add(def.id, ok && !gaveUp); score();
      fb.className = 'qfb ' + (gaveUp ? 'show' : ok ? 'good' : 'bad');
      fb.innerHTML = `<b>${gaveUp ? 'Řešení' : ok ? 'Správně' : 'Špatně'}</b>${q.explain ? ' · ' + q.explain : ''}`;
      if (q.after) q.after(fb);
      if (mode === 'choice' && q.choices) {
        $$('.choice', input).forEach((b, i) => { const c = q.choices[i]; const val = typeof c === 'object' ? c.value : c; if (Array.isArray(q.answer) ? q.answer.includes(val) : val === q.answer) b.classList.add('right'); b.disabled = true; });
      }
      if (q.solutionStaff) { const w = h('div', { class: 'qstaff sol' }); w.append(Staff.draw({ scale: 1.3, ...q.solutionStaff })); fb.append(w); }
      if (q.onDone) q.onDone(ok);
      ctrl.innerHTML = '';
      const nb = h('button', { class: 'btn primary', onclick: next }, 'Další příklad  ⏎');
      ctrl.append(nb);
      if (q.play) ctrl.append(h('button', { class: 'btn ghost', onclick: () => q.play() }, '▶ Přehrát'));
      if (q.solutionPlay) ctrl.append(h('button', { class: 'btn ghost', onclick: () => q.solutionPlay() }, '▶ Přehrát řešení'));
      nb.focus({ preventScroll: true });
      Bus.emit('quizDone', { id: def.id, ok });
    }
    box.addEventListener('pointerdown', () => { if (box.classList.contains('live')) active = api; });
    const api = { next, box, destroy: () => clean() };
    return api;
  }
  addEventListener('keydown', e => {
    if (e.key === 'Enter' && active && active.box.isConnected) {
      const nb = active.box.querySelector('.qctrl .btn.primary');
      if (nb && document.activeElement !== nb) { e.preventDefault(); nb.click(); }
    }
  });
  return { mount, get active() { return active; } };
})();

/* pomocník pro tvorbu možností: správná + náhodné jiné (bez duplicit) */
function makeChoices(correct, pool, n = 4) {
  const rest = shuffle([...new Set(pool)].filter(x => x !== correct)).slice(0, n - 1);
  return shuffle([correct, ...rest]);
}
