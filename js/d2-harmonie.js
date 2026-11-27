/* Díl II – Harmonie: kapitoly 1–6 */
'use strict';
const HX = (() => {
  const keyPool = (mode, maxAcc = 3) => T.KEYS.filter(k => k.mode === mode && Math.abs(k.acc) <= maxAcc).map(k => k.acc);
  /* notová ukázka čtyřhlasu s přehráním */
  function demo(toks, acc = 0, mode = 'dur', cap, o = {}) {
    const K = H.key(acc, mode);
    const specs = toks.map(t => H.spec(t, K));
    const sol = o.sol || H.solve(specs, K);
    const w = h('div', { class: 'qstaff' });
    w.append(Satb.draw(sol, { K, specs, scale: o.scale || 1.2, minWidth: o.minWidth }));
    return Fig(h('div', {}, w, h('div', { class: 'row2' }, PlayBtn(o.btn || 'Přehrát', () => Satb.play(sol, o.dur || 1.0)))), cap);
  }
  /* pískoviště: volný zápis s kontrolou */
  function sandbox(presets) {
    const box = h('div', {});
    const keySel = h('select', {}, ...T.KEYS.filter(k => Math.abs(k.acc) <= 4).map(k => h('option', { value: `${k.acc},${k.mode}`, selected: k.acc === 0 && k.mode === 'dur' }, k.name)));
    const prSel = h('select', {}, ...presets.map((p, i) => h('option', { value: i }, p.join(' – '))));
    const host = h('div', {});
    const mk = () => {
      host.innerHTML = '';
      const [a, m] = keySel.value.split(','); const K = H.key(+a, m);
      const toks = presets[+prSel.value].filter(t => m === 'dur' || !['Sp', 'Sp6', 'Dp'].includes(t));
      const specs = toks.map(t => H.spec(t, K));
      Satb.editor(host, { K, specs, fixed: [] });
    };
    keySel.onchange = mk; prSel.onchange = mk;
    mk();
    return Wid('Pískoviště – piš libovolně, kontrola ukáže chyby', h('div', { class: 'wctl' }, h('label', {}, 'Tónina', keySel), h('label', {}, 'Průběh', prSel)), host);
  }
  /* --- cvičení: najdi chybu ve spojení dvou akordů --- */
  const ERRN = { par5: 'paralelní kvinty', par8: 'paralelní oktávy', ct: 'nerozvedený citlivý tón', sept: 'nerozvedená septima', zvkrok: 'zvětšený melodický krok' };
  function chyba(id, title, level, modes = ['dur']) {
    const PAIRS = [['T', 'S'], ['S', 'D'], ['D', 'T'], ['T', 'D'], ['S', 'T'], ['T', 'Tp'], ['Sp', 'D']].filter(p => level >= 4 || !p.some(x => x === 'Tp' || x === 'Sp'));
    if (level >= 3) PAIRS.push(['D7', 'T'], ['D7', 'T'], ['D65', 'T'], ['D2', 'T6']);
    const types = ['par5', 'par8', 'ct', ...(level >= 3 ? ['sept'] : []), 'zvkrok'];
    return {
      id, title, desc: 'Je ve spojení akordů chyba? Upozornění (skryté kvinty, zdvojení) se nepočítají.',
      gen: () => {
        for (let k = 0; k < 400; k++) {
          const mode = pick(modes); const K = H.key(pick(keyPool(mode, 2)), mode);
          const pr = pick(PAIRS); if (mode === 'moll' && pr.some(x => x === 'Sp')) continue;
          const sa = H.spec(pr[0], K), sb = H.spec(pr[1], K);
          const va = pick(H.voicings(sa, K)), vbs = H.voicings(sb, K, {}, sa);
          if (!va || !vbs.length) continue;
          const vb = pick(vbs.filter(v => Math.abs(T.midi(v.v[3]) - T.midi(va.v[3])) <= 7).concat(vbs).slice(0, 60));
          const iss = H.pairIssues(va.v, vb.v, sa, sb, K).filter(x => x.sev === 'chyba' && ERRN[x.type]);
          const all = H.pairIssues(va.v, vb.v, sa, sb, K).filter(x => x.sev === 'chyba');
          if (all.length !== iss.length) continue; // jiné chyby (skok, rozsah) nechceme
          const ts = [...new Set(iss.map(x => x.type))];
          if (ts.length > 1) continue;
          if (!ts.length && Math.random() > 0.3) continue;
          const ans = ts.length ? ERRN[ts[0]] : 'bez chyby';
          const cols = [va.v, vb.v];
          return {
            html: `<b>${K.name}</b>: je v tomto spojení chyba?`,
            node: (() => { const w = h('div', { class: 'qstaff' }); w.append(Satb.draw(cols, { K, specs: [sa, sb], scale: 1.3 })); return w; })(),
            choices: ['bez chyby', ...types.map(t => ERRN[t])], answer: ans,
            solutionPlay: () => Satb.play(cols),
            explain: iss.length ? iss.map(x => x.msg).join('; ') : 'spojení je správné',
          };
        }
      }
    };
  }
  /* --- cvičení: sluchové určení průběhu funkcí --- */
  function sluch(id, title, level, n = 4, modes = ['dur']) {
    return {
      id, title, desc: 'Zazní krátký průběh. Vyber správné pořadí funkcí.',
      gen: () => {
        const mode = pick(modes);
        const tk = H.task({ level, n, mode, accs: keyPool(mode, 3) });
        const lab = toks => toks.map(t => H.label(H.spec(t, tk.K))).join(' – ');
        const right = lab(tk.toks); const pool = new Set();
        for (let i = 0; i < 60 && pool.size < 8; i++) { const p = lab(H.progression(level, n, mode)); if (p !== right) pool.add(p); }
        return { html: `Jaký průběh zazněl? <span class="mut">(${tk.K.mode === 'dur' ? 'dur' : 'moll'})</span>`, play: () => Satb.play(tk.sol, 1.05), choices: makeChoices(right, [...pool], 4), answer: right, explain: right };
      }
    };
  }
  /* --- cvičení: harmonický rozbor jednoho akordu --- */
  function rozbor(id, title, level, modes = ['dur']) {
    return {
      id, title, desc: 'Urči funkci akordu s otazníkem (včetně obratu).',
      gen: () => {
        const mode = pick(modes);
        const tk = H.task({ level, n: 6, mode, accs: keyPool(mode, 3) });
        const ix = 1 + rnd(tk.specs.length - 1);
        const right = H.label(tk.specs[ix]);
        const toks = H.LEVEL[level].filter(t => mode === 'dur' || !['Sp', 'Sp6', 'DSp', 'D7Sp', 'sm', 'sm6'].includes(t));
        const pool = [...new Set(toks.map(t => H.label(H.spec(t, tk.K))))];
        return {
          html: `<b>${tk.K.name}</b>: jakou funkci má akord s otazníkem?`,
          node: (() => { const w = h('div', { class: 'qstaff' }); w.append(Satb.draw(tk.sol, { K: tk.K, specs: tk.specs, hideLab: c => c === ix, colors: tk.sol.map((_, c) => c === ix ? ['var(--accent)', 'var(--accent)', 'var(--accent)', 'var(--accent)'] : null) })); return w; })(),
          choices: makeChoices(right, pool, 6), answer: right,
          solutionPlay: () => Satb.play(tk.sol),
          explain: `${right} – tóny ${H.tones(tk.specs[ix], tk.K).map(t => T.base(t.step, t.alt)).join(', ')}`,
        };
      }
    };
  }
  /* poloha akordu */
  const polohaQ = {
    id: 'h-poloha', title: 'Poloha akordu', desc: 'Urči, jestli je akord v těsné, nebo široké poloze, a jaká je jeho melodická poloha (tón v sopránu).',
    gen: () => {
      const K = H.key(pick(keyPool('dur', 3)), 'dur');
      const s = H.spec(pick(['T', 'S', 'D']), K);
      const v = pick(H.voicings(s, K)).v;
      const tesna = T.midi(v[0]) - T.midi(v[2]) <= 12;
      const role = H.tones(s, K).find(t => H.same(t, v[0])).role;
      const mel = { 1: 'oktávová', 3: 'tercová', 5: 'kvintová' }[role];
      const ans = `${tesna ? 'těsná' : 'široká'}, ${mel}`;
      const ch = []; for (const a of ['těsná', 'široká']) for (const b of ['oktávová', 'tercová', 'kvintová']) ch.push(`${a}, ${b}`);
      return {
        html: `<b>${K.name}</b>, akord ${H.label(s)}: jaká je jeho poloha?`,
        node: (() => { const w = h('div', { class: 'qstaff' }); w.append(Satb.draw([v], { K, specs: [s], scale: 1.4, minWidth: 200 })); return w; })(),
        choices: ch, answer: ans, solutionPlay: () => Satb.play([v]),
        explain: `soprán–tenor ${T.midi(v[0]) - T.midi(v[2])} půltónů → ${tesna ? 'těsná (horní tři hlasy v rozsahu oktávy)' : 'široká'}; v sopránu ${T.name(v[0])} = ${{ 1: 'základní tón', 3: 'tercie', 5: 'kvinta' }[role]}`,
      };
    }
  };
  /* rozvod D7 – zadaný celý D7, doplnit T */
  const d7Q = {
    id: 'h-d7rozvod', title: 'Rozveď dominantní septakord', desc: 'První akord je zadaný celý. Doplň všechny čtyři hlasy následujícího akordu.',
    options: [{ key: 'mode', label: 'Tónina', values: [['dur', 'durová'], ['moll', 'mollová'], ['mix', 'náhodně']] }, { key: 'inv', label: 'Tvar D7', values: [['all', 'všechny'], ['D7', 'jen základní']] }],
    gen: o => {
      for (let k = 0; k < 50; k++) {
        const mode = o.mode === 'mix' ? pick(['dur', 'moll']) : o.mode;
        const K = H.key(pick(keyPool(mode, 3)), mode);
        const pr = o.inv === 'D7' ? ['D7', 'T'] : pick([['D7', 'T'], ['D65', 'T'], ['D43', 'T'], ['D43', 'T6'], ['D2', 'T6']]);
        const specs = pr.map(t => H.spec(t, K));
        const va = pick(H.voicings(specs[0], K));
        const sol = H.solve(specs, K, [{ 0: va.v[0], 3: va.v[3] }]);
        if (!sol || !sol[0].every((p, i) => T.eq(p, va.v[i]))) {
          // vezmi řešení s celým zadaným prvním akordem
          const L = H.voicings(specs[1], K, {}, specs[0]).filter(y => !H.pairIssues(va.v, y.v, specs[0], specs[1], K).some(z => z.sev === 'chyba'));
          if (!L.length) continue;
        }
        const q = {
          html: `<b>${K.name}</b>: rozveď ${H.label(specs[0])} do ${H.label(specs[1])}.`, explain: '',
          custom: (host, finish, onClean) => { const ed = Satb.editor(host, { K, specs, fixed: [va.v, null], onSolved: ok => { q.explain = ok ? 'správný rozvod' : 'zobrazeno vzorové řešení'; finish(ok); } }); onClean(ed.destroy); },
        };
        return q;
      }
    }
  };
  return { demo, sandbox, chyba, sluch, rozbor, polohaQ, d7Q, keyPool };
})();

/* ============ II.1 Čtyřhlasá sazba ============ */
Chapters.push({
  id: 'h-sazba', part: 2, n: 1, title: 'Čtyřhlasá sazba', short: 'hlasy, rozsahy, poloha, zdvojení, paralely',
  lead: 'Harmonie se učí na čtyřhlasé sazbě soprán – alt – tenor – bas. V této kapitole jsou pravidla, podle kterých se akordy rozestavují a spojují.',
  quizzes: ['h-poloha', 'h-chyba1'],
  render(b) {
    const K = H.key(0, 'dur'); const s = H.spec('T', K);
    const all = H.voicings(s, K).filter(x => x.cost === 0);
    const vw = (() => {
      let i = 0; const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      const upd = () => {
        const v = all[i].v; sw.innerHTML = '';
        sw.append(Satb.draw([v], { K, specs: [s], scale: 1.5, minWidth: 220 }));
        const tesna = T.midi(v[0]) - T.midi(v[2]) <= 12;
        const role = H.tones(s, K).find(t => H.same(t, v[0])).role;
        out.innerHTML = `${i + 1}/${all.length}: <b>${tesna ? 'těsná' : 'široká'}</b> poloha, <b>${{ 1: 'oktávová', 3: 'tercová', 5: 'kvintová' }[role]}</b> melodická poloha · ${v.map(p => T.name(p)).join(' – ')}`;
        Satb.play([v]);
      };
      upd();
      return Wid('Rozestavení tónického kvintakordu C dur (zdvojený základní tón)', h('div', { class: 'wctl' }, h('button', { class: 'btn sm', onclick: () => { i = (i + all.length - 1) % all.length; upd(); } }, '◀ Předchozí'), h('button', { class: 'btn sm', onclick: () => { i = (i + 1) % all.length; upd(); } }, 'Další ▶')), sw, out);
    })();
    b.append(Sec('hlasy', 'Hlasy a jejich rozsahy',
      P_('Čtyřhlasá sazba napodobuje smíšený sbor. <b>Soprán</b> a <b>alt</b> píšeme do houslové osnovy, <b>tenor</b> a <b>bas</b> do basové. Každý hlas má svůj rozsah a ve cvičeních ho nepřekračujeme:'),
      Tbl(['Hlas', 'Rozsah', 'Osnova'], [['soprán', 'c¹ – g²', 'houslová'], ['alt', 'g – d²', 'houslová'], ['tenor', 'c – g¹', 'basová'], ['bas', 'F – d¹', 'basová']]),
      P_('<b>Rozestup</b> sousedních horních hlasů (soprán–alt, alt–tenor) nesmí být větší než oktáva. Mezi tenorem a basem může být větší, obvykle nejvýše duodecima. Hlasy se nesmí <b>křížit</b> (alt nad sopránem apod.).')));
    b.append(Sec('poloha', 'Poloha a zdvojení',
      P_('Kvintakord má tři tóny, ve čtyřhlasu proto jeden <b>zdvojujeme</b>. V základním tvaru zdvojujeme nejraději <b>základní tón</b>, méně často kvintu. Tercii zdvojujeme jen výjimečně. <b>Citlivý tón</b> (tercie dominanty) se nezdvojuje nikdy.'),
      h('ul', {},
        h('li', { html: '<b>těsná poloha</b>: soprán, alt a tenor jsou co nejblíž u sebe, mezi sopránem a tenorem je nejvýše oktáva,' }),
        h('li', { html: '<b>široká poloha</b>: mezi sousedními horními hlasy by se dal vložit další tón akordu,' }),
        h('li', { html: '<b>melodická poloha</b> podle tónu v sopránu: <b>oktávová</b> (základní tón), <b>tercová</b> (tercie), <b>kvintová</b> (kvinta).' })),
      vw));
    b.append(Sec('pravidla', 'Pravidla vedení hlasů',
      P_('Hlasy se pohybují co nejplynuleji, nejlépe krokem. Při spojování akordů rozlišujeme <b>pohyb přímý</b> (hlasy jdou stejným směrem), <b>protipohyb</b> (opačným směrem) a <b>pohyb boční</b> (jeden hlas stojí).'),
      Tbl(['Pravidlo', 'Hodnocení'], [
        ['<b>paralelní (souběžné) kvinty a oktávy</b> – dva hlasy jdou z čisté kvinty do čisté kvinty (z oktávy do oktávy), i v protipohybu', '<span class="e">chyba</span>'],
        ['citlivý tón v sopránu (a v klamném spoji v každém hlase) se rozvádí o půltón nahoru do tóniky', '<span class="e">chyba</span>'],
        ['septima dominantního septakordu se rozvádí o stupeň dolů', '<span class="e">chyba</span>'],
        ['zvětšený melodický krok (zv2, zv4) v kterémkoli hlase, skok větší než oktáva', '<span class="e">chyba</span>'],
        ['zdvojený citlivý tón, překřížení hlasů, rozestup nad oktávu, překročení rozsahu', '<span class="e">chyba</span>'],
        ['<b>skryté kvinty a oktávy</b> mezi krajními hlasy – přímým pohybem do čisté kvinty/oktávy, soprán skokem', '<span class="w">upozornění</span>'],
        ['zdvojená tercie, vynechaná kvinta, překročení hlasů, všechny hlasy stejným směrem, skok o septimu', '<span class="w">upozornění</span>'],
      ]),
      HX.demo(['T', 'S', 'D', 'T'], 0, 'dur', 'Vzorové spojení T – S – D – T v C dur: hlasy se pohybují co nejméně, společné tóny zůstávají.'),
      Box('tip', '<p>Kontrola v editoru ukazuje <b>chyby</b> červeně a <b>upozornění</b> žlutě. Cvičení je splněné, když v sazbě nezůstane žádná chyba.</p>'),
      HX.sandbox([['T', 'S', 'D', 'T'], ['T', 'D', 'T', 'S', 'D', 'T'], ['T', 'S6', 'K64', 'D', 'T'], ['T', 'D7', 'T'], ['T', 'Tp', 'Sp', 'D', 'T']])));
    b.append(Sec('cviceni', 'Cvičení', Ex(HX.polohaQ), Ex(HX.chyba('h-chyba1', 'Najdi chybu ve spojení', 1))));
  }
});

/* ============ II.2 Hlavní funkce a kadence ============ */
Chapters.push({
  id: 'h-funkce', part: 2, n: 2, title: 'Hlavní funkce T – S – D a kadence', short: 'tónika, subdominanta, dominanta; spojování; závěry',
  lead: 'Tři hlavní funkce, dva způsoby spojování akordů a harmonické závěry.',
  quizzes: ['h-bas1', 'h-sop1', 'h-sluch1', 'h-rozbor1'],
  render(b) {
    b.append(Sec('funkce', 'Tónika, subdominanta, dominanta',
      P_('Kvintakordy na I., IV. a V. stupni obsahují všechny tóny stupnice a v dur jsou všechny durové. Podle role v tónině jim říkáme <b>funkce</b>:'),
      h('ul', {},
        h('li', { html: '<b>tónika (T)</b> – I. stupeň, klid, střed tóniny,' }),
        h('li', { html: '<b>subdominanta (S)</b> – IV. stupeň, odklon od tóniky, směřuje k dominantě,' }),
        h('li', { html: '<b>dominanta (D)</b> – V. stupeň, napětí; obsahuje <b>citlivý tón</b>, který táhne do tóniky.' })),
      Box('def', '<p>Funkční značky vycházejí z teorie Huga Riemanna. Pod osnovou je píšeme velkými písmeny pro durové akordy (T, S, D) a malými pro mollové (t, s). Obrat se značí číslicemi (T⁶, D⁶₄, D⁷). V <a href="#/nastaveni">Nastavení</a> lze přepnout na stupňové značení (I, IV, V).</p>')));
    b.append(Sec('spojovani', 'Harmonické a melodické spojení',
      P_('<b>Harmonické spojení</b>: mají-li akordy společný tón, zůstane ve stejném hlase ležet a ostatní hlasy jdou nejkratší cestou (T → S, T → D, S → T, D → T).'),
      HX.demo(['T', 'S'], 0, 'dur', 'T → S: společný tón c zůstává ve stejném hlase.'),
      P_('<b>Melodické spojení</b>: akordy bez společného tónu (S → D). Horní tři hlasy jdou <b>protipohybem k basu</b> do nejbližších tónů. Tak se vyhneme paralelám.'),
      HX.demo(['S', 'D'], 0, 'dur', 'S → D: bas stoupá, horní hlasy klesají.')));
    b.append(Sec('kadence', 'Kadence (harmonické závěry)',
      Tbl(['Závěr', 'Funkce', 'Charakter'], [['autentický (dokonalý)', 'D – T', 'nejsilnější závěr; dokonalý, má-li v sopránu tóniku'], ['plagální', 'S – T', 'měkký, „amen“'], ['úplná kadence', 'T – S – D – T', 'obsahuje všechny hlavní funkce'], ['polovičný (otevřený) závěr', '… – D', 'končí na dominantě, otevírá pokračování (předvětí periody)']]),
      h('div', { class: 'rgrid' },
        HX.demo(['D', 'T'], 0, 'dur', 'autentický závěr'), HX.demo(['S', 'T'], 0, 'dur', 'plagální závěr'),
        HX.demo(['T', 'S', 'D', 'T'], 0, 'dur', 'úplná kadence'), HX.demo(['T', 'S', 'D'], 0, 'dur', 'polovičný závěr'))));
    b.append(Sec('cviceni', 'Cvičení',
      P_('V harmonizačních cvičeních je zadaný bas nebo soprán a funkce. Doplň ostatní hlasy a dej <b>Zkontrolovat</b>. Cvičení je splněné, když v sazbě není žádná chyba.'),
      Ex(Satb.quiz({ id: 'h-bas1', title: 'Harmonizace basu – T, S, D', level: 1, given: 'B', dur: true, options: [{ key: 'n', label: 'Počet akordů', values: [[4, '4'], [6, '6'], [8, '8']], def: 4 }] })),
      Ex(Satb.quiz({ id: 'h-sop1', title: 'Harmonizace sopránu – T, S, D', level: 1, given: 'S', dur: true, options: [{ key: 'n', label: 'Počet akordů', values: [[4, '4'], [6, '6'], [8, '8']], def: 4 }] })),
      Ex(HX.sluch('h-sluch1', 'Poznej funkce sluchem', 1, 4)),
      Ex(HX.rozbor('h-rozbor1', 'Harmonický rozbor', 1))));
  }
});

/* ============ II.3 Sextakordy a kvartsextakordy ============ */
Chapters.push({
  id: 'h-obraty', part: 2, n: 3, title: 'Sextakordy a kvartsextakordy', short: 'zdvojení v obratech, kadenční K⁶₄',
  lead: 'Obraty hlavních funkcí zpestřují basovou linku. Kvartsextakord se používá jen ve třech přesně daných situacích.',
  quizzes: ['h-bas2', 'h-chyba2', 'h-rozbor2'],
  render(b) {
    b.append(Sec('sextakordy', 'Sextakordy',
      P_('V sextakordu je v basu tercie. Při zdvojení platí: <b>v durovém sextakordu nezdvojujeme tercii</b> (basový tón). Zdvojujeme základní tón nebo kvintu. V mollovém sextakordu je zdvojení tercie možné.'),
      P_('Sextakordy dovolují vést bas plynule, krokem. Například T – S⁶ – D vede bas c – a – g místo skoků.'),
      HX.demo(['T', 'S6', 'D', 'T'], 0, 'dur', 'T – S⁶ – D – T: bas jde krokem dolů.'),
      HX.demo(['T', 'D6', 'T'], 0, 'dur', 'D⁶ má v basu citlivý tón, ten jde do tóniky.')));
    b.append(Sec('kvartsextakordy', 'Kvartsextakordy',
      P_('Kvartsextakord (kvinta v basu) zní nestabilně, protože obsahuje kvartu nad basem. V harmonii se používá jen třemi způsoby. Vždy v něm <b>zdvojujeme basový tón</b>.'),
      h('ul', {},
        h('li', { html: '<b>kadenční kvartsextakord</b> – tónický kvintakord nad dominantním basem před dominantou (D⁶₄ – D⁵₃). Sexta a kvarta nad basem klesají o stupeň do kvinty a tercie dominanty. Stojí na těžké době,' }),
        h('li', { html: '<b>průchodný</b> – vznikne na lehké době mezi dvěma polohami téže funkce při krokovém pohybu basu (např. T – D⁶₄ – T⁶),' }),
        h('li', { html: '<b>prodlevový</b> – nad ležícím basem (např. T – S⁶₄ – T).' })),
      HX.demo(['T', 'S', 'K64', 'D', 'T'], 0, 'dur', 'Kadenční kvartsextakord: T – S – D⁶₄ – D – T.'),
      Box('def', '<p>Kadenční kvartsextakord se v české literatuře značí jako <b>D⁶₄ – ⁵₃</b>: chápe se jako zdržení dominanty. V některých učebnicích se značí jako T⁶₄. Funkčně ale patří k dominantě.</p>')));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(Satb.quiz({ id: 'h-bas2', title: 'Harmonizace basu – obraty a K⁶₄', level: 2, given: 'B', dur: true, options: [{ key: 'n', label: 'Počet akordů', values: [[5, '5'], [6, '6'], [8, '8']], def: 6 }] })),
      Ex(HX.chyba('h-chyba2', 'Najdi chybu ve spojení', 2)),
      Ex(HX.rozbor('h-rozbor2', 'Harmonický rozbor – obraty', 2))));
  }
});

/* ============ II.4 Dominantní septakord ============ */
Chapters.push({
  id: 'h-d7', part: 2, n: 4, title: 'Dominantní septakord', short: 'D⁷, úplný a neúplný, obraty a rozvody',
  lead: 'Dominanta se septimou má nejsilnější tah do tóniky. Septima i citlivý tón mají pevně daný rozvod.',
  quizzes: ['h-d7rozvod', 'h-bas3', 'h-sluch3'],
  render(b) {
    b.append(Sec('stavba', 'Stavba a rozvod',
      P_('<b>Dominantní septakord (D⁷)</b> je durový kvintakord na V. stupni s malou septimou: v C dur g – h – d – f. Obsahuje dva <b>citlivé tóny</b>: citlivý tón h (táhne o půltón nahoru do c) a septimu f (táhne o stupeň dolů do e).'),
      h('ul', {},
        h('li', { html: '<b>citlivý tón</b> jde nahoru do tóniky,' }),
        h('li', { html: '<b>septima</b> jde o stupeň dolů do tercie tóniky,' }),
        h('li', { html: 'ostatní tóny jdou nejkratší cestou. Kvinta dominanty jde do tóniky.' })),
      P_('Úplný D⁷ (všechny čtyři tóny) se v základním tvaru rozvádí do <b>neúplné tóniky</b> (ztrojený základní tón, bez kvinty). <b>Neúplný D⁷</b> (bez kvinty, se zdvojeným základem) se rozvádí do úplné tóniky.'),
      h('div', { class: 'rgrid' }, HX.demo(['D7', 'T'], 0, 'dur', 'úplný D⁷ → neúplná T'), HX.demo(['T', 'D7', 'T'], 0, 'dur', 'T – D⁷ – T'))));
    b.append(Sec('obraty', 'Obraty a jejich rozvody',
      Tbl(['Obrat', 'V basu', 'Rozvod', 'Poznámka'], [
        ['D⁶₅ (kvintsextakord)', 'citlivý tón', 'T', 'bas jde o půltón nahoru'],
        ['D⁴₃ (terckvartakord)', 'kvinta', 'T nebo T⁶', 'při T⁶ smí septima výjimečně stoupnout (paralelní decimy s basem)'],
        ['D² (sekundakord)', 'septima', 'T⁶', 'septima v basu klesá, tónika je proto v sextakordu'],
      ]),
      h('div', { class: 'rgrid' }, HX.demo(['D65', 'T'], 0, 'dur', 'D⁶₅ → T'), HX.demo(['D43', 'T'], 0, 'dur', 'D⁴₃ → T'), HX.demo(['D2', 'T6'], 0, 'dur', 'D² → T⁶'), HX.demo(['T', 'S', 'D2', 'T6', 'D43', 'T'], 0, 'dur', 'S – D² – T⁶ – D⁴₃ – T'))));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(HX.d7Q),
      Ex(Satb.quiz({ id: 'h-bas3', title: 'Harmonizace basu s D⁷', level: 3, given: 'B' })),
      Ex(HX.sluch('h-sluch3', 'Poznej průběh sluchem (s D⁷)', 3, 4))));
  }
});

/* ============ II.5 Vedlejší funkce a klamný spoj ============ */
Chapters.push({
  id: 'h-vedlejsi', part: 2, n: 5, title: 'Vedlejší funkce a klamný spoj', short: 'Tp, Sp, Dp; D → Tp',
  lead: 'Mollové kvintakordy na II., III. a VI. stupni dur zastupují hlavní funkce a obohacují harmonii.',
  quizzes: ['h-bas4', 'h-sop4', 'h-rozbor4', 'h-chyba4'],
  render(b) {
    b.append(Sec('paralely', 'Paralely hlavních funkcí',
      P_('Každá hlavní funkce v dur má <b>paralelu</b>, tedy mollový kvintakord o malou tercii níž. Paralela má s hlavní funkcí dva společné tóny:'),
      Tbl(['Funkce', 'Stupeň', 'V C dur', 'Zastupuje'], [['Tp – tóniková paralela', 'VI.', 'a – c – e', 'tóniku (hlavně v klamném spoji)'], ['Sp – subdominantová paralela', 'II.', 'd – f – a', 'subdominantu, vede k D (Sp – D – T)'], ['Dp – dominantová paralela', 'III.', 'e – g – h', 'dominantu (méně častá)']]),
      P_('Subdominantová paralela se často používá v sextakordu (Sp⁶, bas f). Ten patří k nejčastějším předdominantním akordům.'),
      h('div', { class: 'rgrid' }, HX.demo(['T', 'Sp', 'D', 'T'], 0, 'dur', 'T – Sp – D – T'), HX.demo(['T', 'Sp6', 'K64', 'D', 'T'], 0, 'dur', 'T – Sp⁶ – D⁶₄ – D – T'))));
    b.append(Sec('klamny', 'Klamný spoj',
      P_('Když dominanta místo do tóniky postoupí do <b>tónikové paralely</b> (D → Tp, V → VI), vzniká <b>klamný spoj</b> (klamný závěr). Ucho čeká tóniku, a proto spoj překvapí.'),
      h('ul', {}, h('li', { html: '<b>citlivý tón jde vždy nahoru</b> do tóniky (ve všech hlasech),' }), h('li', { html: 'ostatní hlasy jdou <b>proti basu</b> (bas stoupá o sekundu, horní hlasy klesají),' }), h('li', { html: 'v Tp je proto <b>zdvojená tercie</b>. Tady je to správně a kontrola to neoznačí.' })),
      HX.demo(['T', 'S', 'D', 'Tp', 'S', 'D', 'T'], 0, 'dur', 'T – S – D – Tp (klamný spoj) – S – D – T')));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(Satb.quiz({ id: 'h-bas4', title: 'Harmonizace basu – vedlejší funkce', level: 4, given: 'B', dur: true })),
      Ex(Satb.quiz({ id: 'h-sop4', title: 'Harmonizace sopránu – vedlejší funkce', level: 4, given: 'S', dur: true })),
      Ex(HX.rozbor('h-rozbor4', 'Harmonický rozbor – všechny funkce', 4)),
      Ex(HX.chyba('h-chyba4', 'Najdi chybu – i s D⁷ a klamným spojem', 4))));
  }
});

/* ============ II.6 Mollová harmonie ============ */
Chapters.push({
  id: 'h-moll', part: 2, n: 6, title: 'Mollová harmonie', short: 't, s, D z harmonické moll; zv2; tP',
  lead: 'V moll se pro dominantu používá harmonická mollová stupnice. Zvýšený VII. stupeň přináší citlivý tón, ale i nebezpečnou zvětšenou sekundu.',
  quizzes: ['h-bas-moll', 'h-chyba-moll', 'h-sluch-moll'],
  render(b) {
    b.append(Sec('funkce', 'Funkce v moll',
      P_('Mollová tónika (t) a subdominanta (s) jsou mollové kvintakordy. Dominanta se bere z <b>harmonické</b> mollové stupnice se zvýšeným VII. stupněm, takže je <b>durová (D)</b> a obsahuje citlivý tón. Zvýšený tón píšeme vždy jako náhodnou posuvku.'),
      h('div', { class: 'rgrid' }, HX.demo(['T', 'S', 'D', 'T'], -3, 'moll', 'c moll: t – s – D – t'), HX.demo(['T', 'S6', 'K64', 'D7', 'T'], 0, 'moll', 'a moll: t – s⁶ – D⁶₄ – D⁷ – t')),
      Box('pozor', '<p>Mezi VI. a VII. stupněm harmonické moll je <b>zvětšená sekunda</b> (v a moll f – gis). Ve spojení s → D proto nesmí žádný hlas jít přímo z VI. na VII. stupeň. Kontrola takový krok označí jako chybu.</p>'),
      P_('Klamný spoj v moll vede D → tP (VI. stupeň, durový kvintakord). I tady jde citlivý tón nahoru a tercie tP se zdvojuje.'),
      HX.demo(['T', 'S', 'D', 'Tp', 'S', 'D', 'T'], -1, 'moll', 'd moll: t – s – D – tP – s – D – t'),
      Box('tip', '<p>Opačně se v dur používá <b>mollová subdominanta</b> (v C dur f – as – c), přejatá ze stejnojmenné moll. Probereme ji spolu s dalšími přejatými akordy v kapitole o alteraci.</p>')));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(Satb.quiz({ id: 'h-bas-moll', title: 'Harmonizace basu v moll', level: 3, given: 'B', minorOnly: true })),
      Ex(HX.chyba('h-chyba-moll', 'Najdi chybu v moll', 3, ['moll'])),
      Ex(HX.sluch('h-sluch-moll', 'Kadence v dur a moll sluchem', 2, 4, ['dur', 'moll']))));
  }
});
App.EarSets.push(['Harmonické funkce', [HX.sluch('h-sluch1', 'Poznej funkce sluchem', 1, 4), HX.sluch('h-sluch3', 'Poznej průběh sluchem (s D⁷)', 3, 4)]]);
