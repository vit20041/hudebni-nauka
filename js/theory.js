/* Hudební teorie: tóny, intervaly, stupnice, akordy (české názvosloví) */
'use strict';
const T = (() => {
  const STEPS = ['c', 'd', 'e', 'f', 'g', 'a', 'h'];
  const SEMI = [0, 2, 4, 5, 7, 9, 11];
  const OCT_NAMES = ['subkontra', 'kontra', 'velká', 'malá', 'jednočárkovaná', 'dvoučárkovaná', 'tříčárkovaná', 'čtyřčárkovaná', 'pětičárkovaná'];
  const SUP = ['', '¹', '²', '³', '⁴', '⁵'];
  const SUB = ['', '₁', '₂'];

  const P = (step, alt = 0, oct = 4) => ({ step, alt, oct });
  const midi = p => 12 * (p.oct + 1) + SEMI[p.step] + p.alt;
  const dia = p => p.step + 7 * p.oct;
  const fromDia = (d, alt = 0) => P(((d % 7) + 7) % 7, alt, Math.floor(d / 7));
  const eq = (a, b) => a.step === b.step && a.alt === b.alt && a.oct === b.oct;
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  /* název tónu bez oktávy: c, cis, ces, es, as, b, heses … */
  function base(step, alt) {
    const b = STEPS[step];
    if (alt === 0) return b;
    if (alt > 0) return b + 'is'.repeat(alt);
    if (step === 6) return alt === -1 ? 'b' : 'heses';
    if (step === 2) return alt === -1 ? 'es' : 'eses';
    if (step === 5) return alt === -1 ? 'as' : 'asas';
    return b + 'es'.repeat(-alt);
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* plný název s oktávou podle české (Helmholtzovy) konvence:
     subkontra C₂, kontra C₁, velká C, malá c, jednočárkovaná c¹ … */
  function name(p, opt = {}) {
    const b = base(p.step, p.alt);
    if (opt.oct === false) return b;
    if (p.oct <= 2) return cap(b) + (opt.html ? (p.oct < 2 ? `<sub>${2 - p.oct}</sub>` : '') : SUB[2 - p.oct]);
    if (p.oct === 3) return b;
    const n = p.oct - 3;
    return b + (opt.html ? `<sup>${n}</sup>` : SUP[n]);
  }
  const octName = o => OCT_NAMES[o] || '';

  /* ----- intervaly ----- */
  const IVN = ['prima', 'sekunda', 'tercie', 'kvarta', 'kvinta', 'sexta', 'septima', 'oktáva', 'nona', 'decima', 'undecima', 'duodecima', 'tercdecima', 'kvartdecima', 'kvintdecima'];
  const Q = { č: 'čistá', v: 'velká', m: 'malá', zv: 'zvětšená', zm: 'zmenšená', dzv: 'dvojzvětšená', dzm: 'dvojzmenšená' };
  const isPerf = n => [1, 4, 5].includes(((n - 1) % 7) + 1);
  const refSemis = n => SEMI[(n - 1) % 7] + 12 * Math.floor((n - 1) / 7);
  function qualFromDelta(n, d) {
    if (isPerf(n)) return { 0: 'č', 1: 'zv', '-1': 'zm', 2: 'dzv', '-2': 'dzm' }[d];
    return { 0: 'v', '-1': 'm', 1: 'zv', '-2': 'zm', 2: 'dzv', '-3': 'dzm' }[d];
  }
  function deltaFromQual(n, q) {
    if (isPerf(n)) return { č: 0, zv: 1, zm: -1, dzv: 2, dzm: -2 }[q];
    return { v: 0, m: -1, zv: 1, zm: -2, dzv: 2, dzm: -3 }[q];
  }
  /* interval mezi dvěma tóny (směr nezáleží, měří se od nižšího) */
  function interval(a, b) {
    let lo = a, hi = b;
    if (dia(b) < dia(a) || (dia(b) === dia(a) && midi(b) < midi(a))) { lo = b; hi = a; }
    const num = dia(hi) - dia(lo) + 1;
    const semis = midi(hi) - midi(lo);
    const q = qualFromDelta(num, semis - refSemis(num));
    return { num, semis, q, abbr: q ? q + num : '?', name: q ? `${Q[q]} ${IVN[num - 1] || num + '.'}` : `${num}. stupeň (neobvyklá alterace)` };
  }
  /* postav interval z tónu p: num (1..15), q ('v','m','č'...), dir +1 nahoru / -1 dolů */
  function build(p, num, q, dir = 1) {
    const d2 = dia(p) + (num - 1) * dir;
    const nat = fromDia(d2, 0);
    const want = midi(p) + dir * (refSemis(num) + deltaFromQual(num, q));
    const alt = want - midi(nat);
    if (Math.abs(alt) > 2) return null;
    return fromDia(d2, alt);
  }
  const parseIv = s => { const m = /^(dzv|dzm|zv|zm|č|v|m)(\d+)$/.exec(s); return m ? { q: m[1], num: +m[2] } : null; };
  const ivName = s => { const x = parseIv(s); return x ? `${Q[x.q]} ${IVN[x.num - 1]}` : s; };
  /* 4. pád: „postav čistou kvartu“ */
  const ivAcc = s => {
    const x = parseIv(s); if (!x) return s;
    const n = IVN[x.num - 1];
    return Q[x.q].replace(/á$/, 'ou') + ' ' + (n === 'tercie' ? 'tercii' : n.replace(/a$/, 'u'));
  };
  const up = (p, s) => { const x = parseIv(s); return build(p, x.num, x.q, 1); };
  const down = (p, s) => { const x = parseIv(s); return build(p, x.num, x.q, -1); };
  /* obrat intervalu v rámci oktávy */
  function invert(s) {
    const x = parseIv(s); const n = 9 - x.num;
    const q = { č: 'č', v: 'm', m: 'v', zv: 'zm', zm: 'zv', dzv: 'dzm', dzm: 'dzv' }[x.q];
    return q + n;
  }
  /* konsonance / disonance (pro jednoduché intervaly) */
  function consonance(s) {
    const x = parseIv(s); const n = ((x.num - 1) % 7) + 1;
    if (x.q === 'č' && (n === 1 || n === 5)) return 'dokonalá konsonance';
    if (x.q === 'č' && n === 4) return 'konsonance (v harmonii nad basem disonance)';
    if ((x.q === 'v' || x.q === 'm') && (n === 3 || n === 6)) return 'nedokonalá konsonance';
    return 'disonance';
  }

  /* ----- předznamenání a tóniny ----- */
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // f c g d a e h
  const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];  // h e a d g c f
  function keyAlt(acc, step) {
    if (acc > 0) return SHARP_ORDER.slice(0, acc).includes(step) ? 1 : 0;
    if (acc < 0) return FLAT_ORDER.slice(0, -acc).includes(step) ? -1 : 0;
    return 0;
  }
  const MAJ = [[0, 0, 0], [4, 0, 1], [1, 0, 2], [5, 0, 3], [2, 0, 4], [6, 0, 5], [3, 1, 6], [0, 1, 7], [3, 0, -1], [6, -1, -2], [2, -1, -3], [5, -1, -4], [1, -1, -5], [4, -1, -6], [0, -1, -7]];
  const KEYS = [];
  for (const [s, a, acc] of MAJ) {
    const t = P(s, a, 4);
    const m = down(t, 'm3'); m.oct = 4;
    KEYS.push({ mode: 'dur', tonic: t, acc, name: cap(base(s, a)) + ' dur' });
    KEYS.push({ mode: 'moll', tonic: m, acc, name: base(m.step, m.alt) + ' moll' });
  }
  KEYS.sort((x, y) => x.acc - y.acc || (x.mode === 'dur' ? -1 : 1));
  const keyByAcc = (acc, mode) => KEYS.find(k => k.acc === acc && k.mode === mode);
  const accText = acc => acc === 0 ? 'bez předznamenání' : acc > 0 ? `${acc} ${acc === 1 ? 'křížek' : acc < 5 ? 'křížky' : 'křížků'}` : `${-acc} ${acc === -1 ? 'béčko' : acc > -5 ? 'béčka' : 'béček'}`;
  const accList = acc => acc > 0 ? SHARP_ORDER.slice(0, acc).map(s => base(s, 1)) : FLAT_ORDER.slice(0, -acc).map(s => base(s, -1));

  /* ----- stupnice ----- */
  const SCALES = {
    dur: { n: 'durová (jónská)', iv: ['č1', 'v2', 'v3', 'č4', 'č5', 'v6', 'v7'] },
    aiol: { n: 'mollová aiolská (přirozená)', iv: ['č1', 'v2', 'm3', 'č4', 'č5', 'm6', 'm7'] },
    harm: { n: 'mollová harmonická', iv: ['č1', 'v2', 'm3', 'č4', 'č5', 'm6', 'v7'] },
    mel: { n: 'mollová melodická', iv: ['č1', 'v2', 'm3', 'č4', 'č5', 'v6', 'v7'], down: 'aiol' },
    dor: { n: 'dórská', iv: ['č1', 'v2', 'm3', 'č4', 'č5', 'v6', 'm7'] },
    fryg: { n: 'frygická', iv: ['č1', 'm2', 'm3', 'č4', 'č5', 'm6', 'm7'] },
    lyd: { n: 'lydická', iv: ['č1', 'v2', 'v3', 'zv4', 'č5', 'v6', 'v7'] },
    mix: { n: 'mixolydická', iv: ['č1', 'v2', 'v3', 'č4', 'č5', 'v6', 'm7'] },
    lokr: { n: 'lokrická', iv: ['č1', 'm2', 'm3', 'č4', 'zm5', 'm6', 'm7'] },
    pent: { n: 'pentatonika durová', iv: ['č1', 'v2', 'v3', 'č5', 'v6'] },
    pentm: { n: 'pentatonika mollová', iv: ['č1', 'm3', 'č4', 'č5', 'm7'] },
    celo: { n: 'celotónová', iv: ['č1', 'v2', 'v3', 'zv4', 'zv5', 'zv6'] },
  };
  /* vzestupná stupnice včetně oktávy */
  function scale(tonic, kind) {
    const s = SCALES[kind];
    const out = s.iv.map(iv => up(tonic, iv));
    out.push(up(tonic, 'č8'));
    return out;
  }
  /* sestupná (u melodické mollové se vrací aiolská) */
  function scaleDown(tonic, kind) {
    const k = SCALES[kind].down || kind;
    return scale(tonic, k).reverse();
  }

  /* ----- akordy ----- */
  const CHORDS = {
    dur: { n: 'durový kvintakord', iv: ['č1', 'v3', 'č5'] },
    moll: { n: 'mollový kvintakord', iv: ['č1', 'm3', 'č5'] },
    zv: { n: 'zvětšený kvintakord', iv: ['č1', 'v3', 'zv5'] },
    zm: { n: 'zmenšený kvintakord', iv: ['č1', 'm3', 'zm5'] },
    v7: { n: 'velký septakord', iv: ['č1', 'v3', 'č5', 'v7'], alt: 'velký durový' },
    d7: { n: 'malý (dominantní) septakord', iv: ['č1', 'v3', 'č5', 'm7'], alt: 'malý durový' },
    m7: { n: 'malý mollový septakord', iv: ['č1', 'm3', 'č5', 'm7'] },
    mv7: { n: 'velký mollový septakord', iv: ['č1', 'm3', 'č5', 'v7'] },
    hz7: { n: 'malý zmenšený septakord', iv: ['č1', 'm3', 'zm5', 'm7'], alt: 'polozmenšený' },
    zm7: { n: 'zmenšený septakord', iv: ['č1', 'm3', 'zm5', 'zm7'] },
    zv7: { n: 'zvětšený septakord', iv: ['č1', 'v3', 'zv5', 'v7'] },
    d9v: { n: 'velký nónový akord (dominantní)', iv: ['č1', 'v3', 'č5', 'm7', 'v9'] },
    d9m: { n: 'malý nónový akord (dominantní)', iv: ['č1', 'v3', 'č5', 'm7', 'm9'] },
  };
  const INV3 = ['základní tvar (kvintakord)', '1. obrat – sextakord', '2. obrat – kvartsextakord'];
  const INV4 = ['základní tvar (septakord)', '1. obrat – kvintsextakord', '2. obrat – terckvartakord', '3. obrat – sekundakord'];
  const INVSIG3 = ['5', '6', '6/4'];
  const INVSIG4 = ['7', '6/5', '4/3', '2'];
  /* tóny akordu v těsné poloze; inv = obrat (spodní tóny se přenesou o oktávu výš) */
  function chord(root, kind, inv = 0) {
    let ps = CHORDS[kind].iv.map(iv => up(root, iv));
    for (let i = 0; i < inv; i++) { const x = ps.shift(); ps.push(P(x.step, x.alt, x.oct + 1)); }
    return ps;
  }

  /* rozpoznání akordu z MIDI čísel (pro laboratoř; pravopis je zjednodušený) */
  const PREF = [[0, 0], [0, 1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
  function spellMidi(m) { const pc = ((m % 12) + 12) % 12; const [s, a] = PREF[pc]; const oct = Math.floor((m - SEMI[s] - a) / 12) - 1; return P(s, a, oct); }
  function identify(midis) {
    const ms = [...new Set(midis)].sort((a, b) => a - b);
    if (ms.length === 0) return null;
    if (ms.length === 1) return { text: name(spellMidi(ms[0])) };
    if (ms.length === 2) {
      const s = ms[1] - ms[0];
      const NAMES = ['čistá prima', 'malá sekunda', 'velká sekunda', 'malá tercie', 'velká tercie', 'čistá kvarta', 'zvětšená kvarta / zmenšená kvinta', 'čistá kvinta', 'malá sexta', 'velká sexta', 'malá septima', 'velká septima', 'čistá oktáva'];
      const simple = s % 12, oct = Math.floor(s / 12);
      let t = simple === 0 && oct > 0 ? (oct === 1 ? 'čistá oktáva' : `${oct} oktávy`) : NAMES[simple] + (oct ? ` + ${oct} okt.` : '');
      return { text: t, semis: s };
    }
    const pcs = [...new Set(ms.map(m => m % 12))];
    const bass = ms[0] % 12;
    const tbl = Object.entries(CHORDS).filter(([k]) => !k.startsWith('d9'));
    for (const r of pcs) {
      const set = pcs.map(p => (p - r + 12) % 12).sort((a, b) => a - b).join(',');
      for (const [k, c] of tbl) {
        const root = P(0, 0, 4);
        const cs = c.iv.map(iv => (midi(up(root, iv)) - 60 + 120) % 12).sort((a, b) => a - b).join(',');
        if (cs === set) {
          const ivs = c.iv.map(iv => (midi(up(root, iv)) - 60) % 12);
          const inv = ivs.indexOf((bass - r + 12) % 12);
          const invT = (c.iv.length === 3 ? INV3 : INV4)[inv];
          const rn = spellMidi(r + 60);
          return { text: `${cap(base(rn.step, rn.alt))} – ${c.n}`, sub: invT, kind: k };
        }
      }
    }
    return { text: 'neurčený souzvuk', sub: pcs.length + ' různých tónů' };
  }

  return { STEPS, SEMI, P, midi, dia, fromDia, eq, freq, base, cap, name, octName, OCT_NAMES, IVN, Q, interval, build, parseIv, ivName, ivAcc, up, down, invert, consonance, isPerf, keyAlt, SHARP_ORDER, FLAT_ORDER, KEYS, keyByAcc, accText, accList, SCALES, scale, scaleDown, CHORDS, INV3, INV4, INVSIG3, INVSIG4, chord, spellMidi, identify };
})();

/* pomocné */
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem('hn:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('hn:' + k, JSON.stringify(v)); } catch { } },
};
