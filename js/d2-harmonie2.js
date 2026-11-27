/* Díl II – Harmonie: kapitoly 7–8 (vedlejší dominanty a modulace, alterace) */
'use strict';
const HX2 = (() => {
  /* zobrazení libovolného čtyřhlasu (specs + sol) s přehráním */
  function show(K, specs, sol, cap, o = {}) {
    const w = h('div', { class: 'qstaff' });
    w.append(Satb.draw(sol, { K, specs, scale: o.scale || 1.2, colors: o.colors }));
    return Fig(h('div', {}, w, h('div', { class: 'row2' }, PlayBtn('Přehrát', () => Satb.play(sol, 1.0)))), cap);
  }
  /* modulace – generátor s volbou příbuznosti */
  function modWidget() {
    const host = h('div', {});
    const out = h('div', { class: 'wout' });
    const sel = h('select', {}, h('option', { value: 'dur' }, 'z durové tóniny'), h('option', { value: 'moll' }, 'z mollové tóniny'));
    const gen = () => {
      const m = H.modTask({ mode: sel.value });
      host.innerHTML = '';
      if (!m) { out.textContent = 'Nepodařilo se sestavit, zkus znovu.'; return; }
      const colors = m.sol.map((_, c) => c === m.pivotAt ? ['var(--accent)', 'var(--accent)', 'var(--accent)', 'var(--accent)'] : null);
      const w = h('div', { class: 'qstaff' }); w.append(Satb.draw(m.sol, { K: m.K, specs: m.specs, colors, scale: 1.25 }));
      host.append(w);
      out.innerHTML = `<b>${m.K.name}</b> → <b>${m.K2.name}</b> (${m.rel}). Společný akord je zvýrazněný: ${H.label(m.specs[m.pivotAt])}.`;
      host._sol = m.sol;
      Satb.play(m.sol, 1.0);
    };
    sel.onchange = gen;
    setTimeout(gen);
    return Wid('Generátor modulací', h('div', { class: 'wctl' }, h('label', {}, 'Výchozí tónina', sel), h('button', { class: 'btn sm', onclick: gen }, 'Nová modulace'), PlayBtn('Přehrát', () => host._sol && Satb.play(host._sol, 1.0))), host, out);
  }
  /* zvětšené sextakordy – ruční sazba v c moll s rozvodem */
  function aug6(kind, tonic) {
    const t = tonic; // c¹
    const as = T.down(T.up(t, 'm6'), 'č8'), fis = T.up(t, 'zv4'), c2 = T.up(t, 'č8'), d2 = T.up(t, 'v9'), es = T.up(t, 'm3');
    if (kind === 'It') return [c2, fis, t, as];
    if (kind === 'Fr') return [d2, fis, t, as];
    return [fis, es, t, as]; // německý
  }
  return { show, modWidget, aug6 };
})();

/* sdílené cvičení (kapitola i stránka Sluchová výchova) */
const MOD_KAM = {
  id: 'h-modul-kam', title: 'Kam se modulovalo?', desc: 'Poslechni si modulaci (výchozí tónina je zadaná) a urči cílovou tóninu.',
  gen: () => {
    const m = H.modTask({});
    const rels = H.REL[m.K.mode].map(([, d, md]) => T.keyByAcc(m.K.acc + d, md)).filter(Boolean).map(k => k.name);
    return {
      html: `Výchozí tónina: <b>${m.K.name}</b>. Kam se modulovalo?`,
      play: () => Satb.play(m.sol, 1.0),
      choices: makeChoices(m.K2.name, rels, 4), answer: m.K2.name,
      after: fb => { const w = h('div', { class: 'qstaff sol' }); w.append(Satb.draw(m.sol, { K: m.K, specs: m.specs, scale: 1.1 })); fb.append(w); },
      explain: `${m.K2.name} – ${m.rel}; společný akord ${H.label(m.specs[m.pivotAt])}`,
    };
  }
};

/* ============ II.7 Vedlejší dominanty a modulace ============ */
Chapters.push({
  id: 'h-modulace', part: 2, n: 7, title: 'Vedlejší dominanty a modulace', short: '(D), (D⁷), dvojitá dominanta; modulace přes společný akord',
  lead: 'Každý durový nebo mollový akord tóniny si může půjčit vlastní dominantu. Odtud je už jen krok k modulaci, tedy přechodu do jiné tóniny.',
  quizzes: ['h-bas5', 'h-rozbor5', 'h-modul', 'h-modul-kam'],
  render(b) {
    const C = H.key(0, 'dur');
    b.append(Sec('vedlejsi', 'Vedlejší dominanty',
      P_('<b>Vedlejší (mimotonální) dominanta</b> je dominanta, nebo dominantní septakord, k jinému akordu tóniny než k tónice. Cílový akord se na okamžik stane „tónikou“. Vedlejší dominanta obsahuje tóny mimo tóninu, nejčastěji vlastní citlivý tón.'),
      P_('Značí se <b>v závorce</b> před cílovým akordem: (D), (D⁷), (D⁶₅). Ve stupňovém značení se píše V⁷/IV („dominanta ke čtvrtému stupni“).'),
      Tbl(['Vedlejší dominanta', 'K akordu', 'V C dur', 'Nový tón'], [
        ['(D⁷) S', 'subdominantě (IV.)', 'c – e – g – <b>b</b>', 'b (septima) jde do a'],
        ['(D) D – <b>dvojitá dominanta</b>', 'dominantě (V.)', 'd – <b>fis</b> – a (– c)', 'fis jde do g'],
        ['(D⁷) Sp', 'Sp (II.)', 'a – <b>cis</b> – e – g', 'cis jde do d'],
        ['(D⁷) Tp', 'Tp (VI.)', 'e – <b>gis</b> – h – d', 'gis jde do a'],
      ]),
      h('ul', {},
        h('li', { html: 'vlastní <b>citlivý tón</b> vedlejší dominanty se rozvádí o půltón nahoru do základního tónu cílového akordu,' }),
        h('li', { html: '<b>septima</b> jde o stupeň dolů,' }),
        h('li', { html: 'chromatický krok (f → fis, c → cis) má zůstat <b>v jednom hlase</b>. Když se tón změní v jiném hlase, vznikne <b>nepravý vztah</b> a kontrola to označí upozorněním.' })),
      h('div', { class: 'rgrid' },
        HX.demo(['T', 'D7S', 'S', 'D', 'T'], 0, 'dur', 'T – (D⁷) – S – D – T'),
        HX.demo(['T', 'S', 'DD', 'D', 'T'], 0, 'dur', 'dvojitá dominanta: T – S – (D) – D – T'),
        HX.demo(['T', 'D7Tp', 'Tp', 'S', 'D7', 'T'], 0, 'dur', 'T – (D⁷) – Tp – S – D⁷ – T'),
        HX.demo(['T', 'Sp', 'DD', 'K64', 'D', 'T'], 0, 'dur', 'Sp – (D) – D⁶₄ – D – T')),
      Box('tip', '<p><b>Dvojitá dominanta</b> (dominanta dominanty, v C dur d–fis–a) je nejčastější vedlejší dominanta. Často ji následuje kadenční kvartsextakord.</p>')));

    b.append(Sec('modulace', 'Modulace',
      P_('<b>Modulace</b> je trvalý přechod do nové tóniny. Nová tónina se musí potvrdit kadencí. Krátké vybočení, které se do původní tóniny hned vrací (třeba vedlejší dominanta), modulace není.'),
      P_('<b>Diatonická modulace</b> do příbuzné tóniny využívá <b>společný (přechodný) akord</b>, který patří do obou tónin. Má proto dvojí funkci: v C dur je a moll Tp, v G dur Sp. Postup:'),
      h('ol', {},
        h('li', { html: 'potvrzení výchozí tóniny (např. T – S – D),' }),
        h('li', { html: '<b>společný akord</b> se značkou staré i nové funkce (T = S),' }),
        h('li', { html: '<b>modulační akord</b> – dominanta nové tóniny, nejlépe D⁷ s novým citlivým tónem,' }),
        h('li', { html: 'kadence v nové tónině.' })),
      Tbl(['Výchozí C dur →', 'Nová tónina', 'Předznamenání'], [['dominantová tónina', 'G dur', '+1 ♯'], ['subdominantová tónina', 'F dur', '+1 ♭'], ['paralelní moll', 'a moll', 'stejné'], ['mollová tónina III. stupně', 'e moll', '+1 ♯'], ['mollová tónina II. stupně', 'd moll', '+1 ♭']]),
      HX2.modWidget(),
      Box('def', '<p>V notách se předznamenání při krátké modulaci nemění, nové tóny se píšou jako náhodné posuvky. Při delším pobytu v nové tónině se předznamenání změní, a to na začátku taktu za dvojitou čarou.</p>')));

    const modDef = {
      id: 'h-modul', title: 'Harmonizace basu s modulací', level: 5,
      options: [{ key: 'mode', label: 'Výchozí tónina', values: [['dur', 'durová'], ['moll', 'mollová'], ['mix', 'náhodně']] }],
      task: o => H.modTask({ mode: o.mode }),
      html: tk => `Modulace <b>${tk.K.name}</b> → <b>${tk.K2.name}</b> (${tk.rel}): zadaný bas, doplň soprán, alt a tenor.`,
    };
    b.append(Sec('cviceni', 'Cvičení',
      Ex(Satb.quiz({ id: 'h-bas5', title: 'Harmonizace basu s vedlejšími dominantami', level: 5, given: 'B', dur: true })),
      Ex(HX.rozbor('h-rozbor5', 'Rozbor – vedlejší dominanty', 5)),
      Ex(Satb.quiz(modDef)),
      Ex(MOD_KAM)));
  }
});


/* ============ II.8 Alterace a neapolský sextakord ============ */
Chapters.push({
  id: 'h-alterace', part: 2, n: 8, title: 'Alterace a neapolský sextakord', short: 'mollová subdominanta v dur, N⁶, zmenšený septakord, zvětšené sextakordy',
  lead: 'Chromaticky změněné (alterované) akordy zostřují tah k cíli. Snížené tóny táhnou dolů, zvýšené nahoru.',
  quizzes: ['h-bas6', 'h-alt-urci', 'h-rozbor6'],
  render(b) {
    b.append(Sec('princip', 'Co je alterace',
      P_('<b>Alterace</b> je chromatická změna tónu akordu o půltón. Zvýšený tón se chová jako citlivý tón a pokračuje <b>nahoru</b>, snížený tón pokračuje <b>dolů</b>. Alterované akordy vznikají také <b>přejímáním</b> ze stejnojmenné tóniny (mixtura dur–moll).')));
    b.append(Sec('sm', 'Mollová subdominanta v dur',
      P_('V dur můžeme použít subdominantu ze stejnojmenné moll: v C dur <b>f – as – c</b> místo f – a – c. Snížená tercie (as) klesá do g. Značí se malým <b>s</b>.'),
      h('div', { class: 'rgrid' }, HX.demo(['T', 'S', 'sm', 'D', 'T'], 0, 'dur', 'T – S – s – D – T (a → as v jednom hlase)'), HX.demo(['T', 'sm', 'K64', 'D7', 'T'], 0, 'dur', 'T – s – D⁶₄ – D⁷ – T'))));
    b.append(Sec('neapol', 'Neapolský sextakord',
      P_('<b>Neapolský sextakord (N⁶)</b> je durový kvintakord na <b>sníženém II. stupni</b>, používaný v sextakordu. V c moll i v C dur je to <b>des – f – as</b> s basem f. Funkčně patří k subdominantě.'),
      h('ul', {},
        h('li', { html: 'zdvojuje se <b>basový tón</b> (tercie, f), snížený základní tón se nezdvojuje,' }),
        h('li', { html: 'snížený tón des klesá: buď přímo k citlivému tónu h (melodická zmenšená tercie), nebo přes c v kadenčním kvartsextakordu,' }),
        h('li', { html: 'v N⁶ → D je přípustný nepravý vztah des – d, kontrola ho u neapolského sextakordu nehlásí.' })),
      h('div', { class: 'rgrid' }, HX.demo(['T', 'N6', 'D7', 'T'], -3, 'moll', 'c moll: t – N⁶ – D⁷ – t'), HX.demo(['T', 'N6', 'K64', 'D', 'T'], -3, 'moll', 'c moll: t – N⁶ – D⁶₄ – D – t'), HX.demo(['T', 'N6', 'K64', 'D7', 'T'], 0, 'dur', 'C dur: T – N⁶ – D⁶₄ – D⁷ – T'))));
    b.append(Sec('zmensene', 'Zmenšený septakord',
      P_('Na zvýšeném VII. stupni harmonické moll vzniká <b>zmenšený septakord</b> (v a moll gis – h – d – f), složený ze tří malých tercií. Funkčně je to dominantní nónový akord bez základního tónu, značí se <b>přeškrtnutým D⁹</b> (<span class="dsl">D</span>⁹). Citlivý tón jde nahoru, septima (f) dolů. Do tóniky se rozvádí jako dominanta.'),
      P_('V dur se používá alterovaný, se sníženou septimou (v C dur h – d – f – as). Protože se oktáva dělí na stejné malé tercie, zní každý zmenšený septakord enharmonicky stejně jako tři další. Proto se hodí k <b>enharmonické modulaci</b> do vzdálených tónin.'),
      h('div', { class: 'rgrid' }, HX.demo(['T', 'S', 'VII7', 'T'], 0, 'moll', 'a moll: t – s – <span class="dsl">D</span>⁹ – t'), HX.demo(['T', 'Tp', 'VII7', 'T'], 0, 'dur', 'C dur: T – Tp – <span class="dsl">D</span>⁹ (h–d–f–as) – T'))));
    // zvětšené sextakordy – ruční sazba v c moll
    const K = H.key(-3, 'moll'); const c1 = T.P(0, 0, 4);
    const lab = (l, d) => ({ lab: l, labDeg: d || l, tn: [] });
    const D = [T.P(1, 0, 5), T.P(4, 0, 4), T.P(6, 0, 3), T.P(4, 0, 3)]; // d² g¹ h g
    const It = HX2.aug6('It', c1), Fr = HX2.aug6('Fr', c1), Ger = HX2.aug6('Ger', c1);
    const K64 = [T.P(4, 0, 4), T.P(2, -1, 4), T.P(0, 0, 4), T.P(4, 0, 3)], Dg = [T.P(4, 0, 4), T.P(1, 0, 4), T.P(6, 0, 3), T.P(4, 0, 3)];
    b.append(Sec('zvetsene', 'Zvětšené sextakordy',
      P_('Mezi basem na sníženém VI. stupni (as) a zvýšeným IV. stupněm (fis) je <b>zvětšená sexta</b>. Oba tóny se rozbíhají do oktávy na dominantě g. Podle dalších tónů rozlišujeme tři druhy:'),
      Tbl(['Druh', 'Tóny v c moll', 'Rozvod'], [['italský', 'as – c – fis', 'do D'], ['francouzský', 'as – c – d – fis', 'do D'], ['německý', 'as – c – es – fis', 'do D⁶₄ – D, aby nevznikly paralelní kvinty (as–es → g–d)']]),
      h('div', { class: 'rgrid' },
        HX2.show(K, [lab('It⁺⁶'), lab('D')], [It, D], 'italský zvětšený sextakord → D'),
        HX2.show(K, [lab('Fr⁺⁶'), lab('D')], [Fr, D], 'francouzský → D'),
        HX2.show(K, [lab('Ger⁺⁶'), lab('D⁶₄'), lab('D')], [Ger, K64, Dg], 'německý → D⁶₄ → D')),
      Box('pozor', '<p>Zvětšené sextakordy jsou zde jen jako ukázka. Editor je zatím automaticky nekontroluje.</p>')));

    const TYPES = ['neapolský sextakord', 'mollová subdominanta v dur', 'zmenšený septakord', 'vedlejší dominanta', 'zvětšený sextakord'];
    b.append(Sec('cviceni', 'Cvičení',
      Ex(Satb.quiz({ id: 'h-bas6', title: 'Harmonizace basu s alterovanými akordy', level: 6, given: 'B' })),
      Ex({
        id: 'h-alt-urci', title: 'Urči alterovaný akord', desc: 'Podívej se na akord (a poslechni si ho) a urči, o jaký alterovaný akord jde.',
        gen: () => {
          for (let k = 0; k < 40; k++) {
            const type = pick(TYPES);
            let K2, v, nm;
            if (type === 'zvětšený sextakord') {
              const kk = pick(T.KEYS.filter(x => x.mode === 'moll' && Math.abs(x.acc) <= 3));
              K2 = H.key(kk.acc, 'moll');
              const t = T.P(K2.tonic.step, K2.tonic.alt, 4);
              const sub = pick(['It', 'Fr', 'Ger']); v = HX2.aug6(sub, t);
              if (v.some(p => Math.abs(p.alt) > 2) || T.midi(v[0]) > 79 || T.midi(v[3]) < 41) continue;
              nm = { It: 'italský', Fr: 'francouzský', Ger: 'německý' }[sub] + ' zvětšený sextakord';
            } else {
              const mode = type === 'mollová subdominanta v dur' ? 'dur' : pick(['dur', 'moll']);
              const kk = pick(T.KEYS.filter(x => x.mode === mode && Math.abs(x.acc) <= 3));
              K2 = H.key(kk.acc, mode);
              const tok = { 'neapolský sextakord': 'N6', 'mollová subdominanta v dur': 'sm', 'zmenšený septakord': 'VII7', 'vedlejší dominanta': pick(['D7S', 'DD', 'D7D', 'D7Tp']) }[type];
              if (mode === 'moll' && tok === 'D7Tp') continue;
              const s = H.spec(tok, K2); const vs = H.voicings(s, K2); if (!vs.length) continue;
              v = pick(vs).v; nm = type + ` (${H.label(s)})`;
            }
            return {
              html: `<b>${K2.name}</b>: o jaký alterovaný akord jde?`,
              node: (() => { const w = h('div', { class: 'qstaff' }); w.append(Satb.draw([v], { K: K2, specs: [{ lab: '?', labDeg: '?', tn: [] }], scale: 1.4, minWidth: 200 })); return w; })(),
              choices: TYPES, answer: type,
              solutionPlay: () => Satb.play([v], 1.4),
              explain: `${nm}: ${v.slice().reverse().map(p => T.name(p, { oct: false })).join(' – ')} (zdola)`,
            };
          }
        }
      }),
      Ex(HX.rozbor('h-rozbor6', 'Rozbor – alterované akordy', 6))));
  }
});
App.EarSets.push(['Modulace', [MOD_KAM]]);
