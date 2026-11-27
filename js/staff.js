/* Notová osnova: vlastní SVG sazba s fontem Bravura (SMuFL) */
'use strict';
const Staff = (() => {
  const S = 10;                 // mezera mezi linkami v px (souřadnice viewBoxu)
  const FS = 4 * S;             // velikost fontu: 1 em = 4 mezery
  const NS = 'http://www.w3.org/2000/svg';
  const G = {
    g: '', f: '', c: '', perc: '',
    w: '', h: '', q: '',
    acc: { '-2': '', '-1': '', 0: '', 1: '', 2: '' },
    rest: { w: '', h: '', q: '', 8: '', 16: '' },
    flagU: { 8: '', 16: '' }, flagD: { 8: '', 16: '' },
    dot: '', ts: d => String.fromCharCode(0xE080 + d), common: '', cut: '',
    tup3: '', fermata: '', fermataB: '',
  };
  const ACCW = { '-2': 1.65, '-1': 0.95, 0: 0.7, 1: 1.0, 2: 1.0 };
  const NW = { w: 1.69, h: 1.18, q: 1.18, 8: 1.18, 16: 1.18 };
  const SPACING = { w: 5.2, h: 4.2, q: 3.3, 8: 2.7, 16: 2.3 };
  // spodní linka osnovy pro jednotlivé klíče (diatonický index)
  const BOTTOM = { g: 30, f: 18, alt: 24, ten: 22, perc: 30 };
  const CLEF_POS = { g: 2, f: 6, alt: 4, ten: 6, perc: 4 };
  const CLEF_GLYPH = { g: G.g, f: G.f, alt: G.c, ten: G.c, perc: G.perc };
  const SHARP_POS = [8, 5, 9, 6, 3, 7, 4], FLAT_POS = [4, 7, 3, 6, 2, 5, 1];
  const KEYSHIFT = { g: 0, f: -2, alt: -1 };

  function el(tag, a = {}, txt) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(a)) if (v != null) e.setAttribute(k, v);
    if (txt != null) e.textContent = txt;
    return e;
  }
  const glyph = (ch, x, y, a = {}) => el('text', { x, y, 'font-family': 'Bravura', 'font-size': FS, ...a }, ch);
  const posOf = (p, clef) => T.dia(p) - BOTTOM[clef];

  /* hlavní kreslení
     o = { staves:[{clef}], key, time:[n,d]|'C', items:[…], names, interactive, minWidth, fit } */
  function draw(o) {
    const staves = o.staves || [{ clef: o.clef || 'g' }];
    const key = o.key || 0;
    const items = o.items || [];
    const multi = staves.length > 1;
    // svislá geometrie: rozsah poloh podle obsahu
    let lo = staves.map(() => -3), hi = staves.map(() => 11);
    const staffOf = (p, it) => p.st != null ? p.st : it.st != null ? it.st : (multi ? (T.midi(p) >= 60 ? 0 : 1) : 0);
    for (const it of items) if (it.ps) for (const p of it.ps) {
      const si = staffOf(p, it); const c = staves[si].clef; const pos = c === 'perc' ? 4 : posOf(p, c);
      lo[si] = Math.min(lo[si], pos - 4); hi[si] = Math.max(hi[si], pos + 4);
    }
    if (o.interactive) { lo = lo.map(v => Math.min(v, -6)); hi = hi.map(v => Math.max(v, 14)); }
    if (o.names || items.some(it => it.lab)) lo[staves.length - 1] -= 3;
    const tops = []; let y = 0;
    staves.forEach((st, i) => {
      y += (Math.max(hi[i], 8) - 8) / 2 * S + (i === 0 ? S : 0);
      tops.push(y); // y horní linky
      y += 4 * S + (-Math.min(lo[i], 0)) / 2 * S + (i < staves.length - 1 ? S : 0);
    });
    const H = y + S;
    const yPos = (si, pos) => tops[si] + 4 * S - pos * S / 2;

    const svg = el('svg', { class: 'staff', role: 'img' });
    const gStaff = el('g', { class: 'lines' });
    const gMain = el('g', { class: 'notes' });
    svg.append(gStaff, gMain);

    // vodorovné rozvržení
    let x = (multi ? 2.2 : 0.8) * S;
    const x0 = x;
    staves.forEach((st, si) => {
      if (st.clef && o.clef !== false) {
        const ch = CLEF_GLYPH[st.clef];
        gMain.append(glyph(ch, x + 0.3 * S, yPos(si, CLEF_POS[st.clef])));
      }
    });
    if (o.clef !== false) x += 3.6 * S;
    // předznamenání
    if (key) {
      const n = Math.abs(key);
      staves.forEach((st, si) => {
        const sh = KEYSHIFT[st.clef]; if (sh == null) return;
        const arr = key > 0 ? SHARP_POS : FLAT_POS;
        for (let i = 0; i < n; i++) gMain.append(glyph(G.acc[key > 0 ? 1 : -1], x + i * 1.05 * S, yPos(si, arr[i] + sh)));
      });
      x += n * 1.05 * S + 0.8 * S;
    }
    if (o.time) {
      staves.forEach((st, si) => {
        if (o.time === 'C' || o.time === '¢') gMain.append(glyph(o.time === 'C' ? G.common : G.cut, x, yPos(si, 4)));
        else {
          const [a, b] = o.time;
          const ta = String(a).split('').map(d => G.ts(+d)).join(''), tb = String(b).split('').map(d => G.ts(+d)).join('');
          const wa = String(a).length, wb = String(b).length, wm = Math.max(wa, wb);
          gMain.append(glyph(ta, x + (wm - wa) * 0.9 * S, yPos(si, 6)), glyph(tb, x + (wm - wb) * 0.9 * S, yPos(si, 2)));
        }
      });
      x += 3 * S;
    }
    x += (o.lead || 0.6) * S;
    const xStart = x;

    // první průchod: šířky prvků
    let measAcc = staves.map(() => ({}));
    const indep = o.indep != null ? o.indep : !o.time;
    const placed = [];
    for (const it of items) {
      const P = { it, x: 0, w: 0 };
      if (it.t === 'b') { P.w = (it.s === '|' ? 1.6 : 2.2) * S; }
      else if (it.t === 'sp') { P.w = (it.w || 2) * S; }
      else {
        const d = it.d || 'q';
        let accw = 0;
        if (it.ps) for (const p of it.ps) {
          const si = staffOf(p, it); const c = staves[si].clef;
          if (c === 'perc') continue;
          const dpos = T.dia(p); const ma = measAcc[si];
          const cur = ma[dpos] != null ? ma[dpos] : T.keyAlt(key, p.step);
          const show = p.acc === true || (p.acc !== false && p.alt !== cur);
          p._show = show; if (show) { ma[dpos] = p.alt; accw = Math.max(accw, ACCW[p.alt] + 0.3); }
        }
        const nAcc = it.ps ? it.ps.filter(p => p._show).length : 0;
        P.acc = accw * (nAcc > 1 ? 1.9 : 1) * S;
        P.w = P.acc + (o.spacing || SPACING[d] || 3) * S + (it.dots ? 0.9 * S : 0) + (it.gap || 0) * S;
      }
      // bez taktového označení jde o samostatné ukázky: posuvky platí jen pro jednu notu/akord
      if (it.t === 'b' || (indep && it.t === 'n')) measAcc = staves.map(() => ({}));
      placed.push(P);
    }
    const natural = placed.reduce((a, P) => a + P.w, 0);
    let W = xStart + natural + S;
    let k = 1;
    if (o.minWidth && W < o.minWidth) { k = (o.minWidth - xStart - S) / Math.max(natural, 1); W = o.minWidth; }
    // linky osnovy (kreslí se až po zjištění šířky)
    const xEnd = W - 0.5 * S;
    staves.forEach((st, si) => {
      const lines = st.clef === 'perc' ? [4] : [0, 2, 4, 6, 8];
      for (const l of lines) gStaff.append(el('line', { x1: x0, x2: xEnd, y1: yPos(si, l), y2: yPos(si, l), class: 'ln' }));
      if (st.clef === 'perc') { gStaff.append(el('line', { x1: x0, x2: x0, y1: yPos(si, 6), y2: yPos(si, 2), class: 'ln' })); }
    });
    if (multi) {
      gStaff.append(el('line', { x1: x0, x2: x0, y1: yPos(0, 8), y2: yPos(staves.length - 1, 0), class: 'bar' }));
      if (o.brace !== false) gMain.append(el('text', { x: x0 - 1.2 * S, y: yPos(staves.length - 1, 0), 'font-family': 'Bravura', 'font-size': (yPos(staves.length - 1, 0) - yPos(0, 8)), }, ''));
    }

    // druhý průchod: kreslení
    x = xStart;
    const xs = [];
    const heads = []; // pro ligatury a trámce
    placed.forEach((P, idx) => {
      const it = P.it; const w = P.w * k;
      const col = it.color || null;
      const g = el('g', { class: 'it' + (it.cls ? ' ' + it.cls : ''), fill: col, stroke: col, 'data-i': idx });
      gMain.append(g);
      if (it.t === 'b') {
        const bx = x + w / 2;
        staves.forEach((st, si) => {
          const y1 = yPos(si, st.clef === 'perc' ? 6 : 8), y2 = yPos(si, st.clef === 'perc' ? 2 : 0);
          const yb = multi && si < staves.length - 1 ? yPos(si + 1, 8) : y2;
          const thin = (xx) => g.append(el('line', { x1: xx, x2: xx, y1, y2: yb, class: 'bar' }));
          const thick = (xx) => g.append(el('rect', { x: xx - 2.5, y: y1, width: 5, height: yb - y1, class: 'thick' }));
          const dots = (xx) => { for (const pp of [3, 5]) g.append(el('circle', { cx: xx, cy: yPos(si, pp), r: 2.4, class: 'rdot' })); };
          if (it.s === '|') thin(bx);
          else if (it.s === '||') { thin(bx - 3); thin(bx + 3); }
          else if (it.s === '|.') { thin(bx - 5); thick(bx + 3); }
          else if (it.s === ':|') { dots(bx - 11); thin(bx - 5); thick(bx + 3); }
          else if (it.s === '|:') { thick(bx - 5); thin(bx + 3); dots(bx + 9); }
        });
        xs.push(bx); x += w; return;
      }
      if (it.t === 'sp') {
        if (it.lab) g.append(el('text', { x: x + w / 2, y: yPos(0, 4) + 0.8 * S, class: 'qmark', 'text-anchor': 'middle' }, it.lab));
        xs.push(x + w / 2); x += w; return;
      }
      const d = it.d || 'q';
      const nx = x + P.acc;
      xs.push(nx + NW[d] * S / 2);
      if (it.t === 'r') {
        const si = it.st || 0;
        const rp = d === 'w' ? 6 : 4;
        g.append(glyph(G.rest[d], nx, yPos(si, staves[si].clef === 'perc' && d === 'w' ? 4 : rp)));
        if (d === 'w' && staves[si].clef === 'perc') { /* celá pomlka visí pod linkou */ }
        if (it.dots) g.append(glyph(G.dot, nx + 1.6 * S, yPos(si, 5)));
        if (it.lab) labelBelow(g, nx + 0.6 * S, it.lab);
        x += w; return;
      }
      // nota / akord – po osnovách
      const bySt = {};
      for (const p of it.ps) { const si = staffOf(p, it); (bySt[si] = bySt[si] || []).push(p); }
      for (const [siS, ps] of Object.entries(bySt)) {
        const si = +siS; const clef = staves[si].clef;
        const items2 = ps.map(p => ({ p, pos: clef === 'perc' ? 4 : posOf(p, clef) })).sort((a, b) => a.pos - b.pos);
        const avg = (items2[0].pos + items2[items2.length - 1].pos) / 2;
        const up = it.stem ? it.stem === 'up' : (clef === 'perc' ? true : avg < 4);
        const nw = NW[d] * S;
        // posun sousedních hlaviček (sekundy)
        if (up) { for (let i = 1; i < items2.length; i++) if (items2[i].pos - items2[i - 1].pos === 1 && !items2[i - 1].shift) items2[i].shift = 1; }
        else { for (let i = items2.length - 2; i >= 0; i--) if (items2[i + 1].pos - items2[i].pos === 1 && !items2[i + 1].shift) items2[i].shift = -1; }
        // pomocné linky
        const hasShift = items2.some(q => q.shift);
        const lx1 = nx - 0.35 * S - (hasShift && !up ? nw : 0), lx2 = nx + nw + 0.35 * S + (hasShift && up ? nw : 0);
        if (clef !== 'perc') {
          const minP = items2[0].pos, maxP = items2[items2.length - 1].pos;
          for (let l = -2; l >= minP; l -= 2) g.append(el('line', { x1: lx1, x2: lx2, y1: yPos(si, l), y2: yPos(si, l), class: 'ledger' }));
          for (let l = 10; l <= maxP; l += 2) g.append(el('line', { x1: lx1, x2: lx2, y1: yPos(si, l), y2: yPos(si, l), class: 'ledger' }));
        }
        // posuvky (sloupce odshora)
        const accs = items2.filter(q => q.p._show).sort((a, b) => b.pos - a.pos);
        const cols = [];
        for (const q of accs) {
          let c = 0; while ((cols[c] || []).some(pp => Math.abs(pp - q.pos) < 6)) c++;
          (cols[c] = cols[c] || []).push(q.pos); q.col = c;
        }
        for (const q of accs) {
          const ax = nx - (ACCW[q.p.alt] + 0.25) * S - q.col * 1.15 * S - (q.shift === -1 ? nw : 0);
          g.append(glyph(G.acc[q.p.alt], ax, yPos(si, q.pos), { fill: q.p.color || null }));
        }
        // hlavičky
        for (const q of items2) {
          const hx = nx + (q.shift || 0) * (nw - 0.1 * S);
          const ch = d === 'w' ? G.w : d === 'h' ? G.h : G.q;
          const hd = glyph(ch, hx, yPos(si, q.pos), { fill: q.p.color || null, class: 'head' });
          g.append(hd);
          heads.push({ idx, si, pos: q.pos, x: hx, w: nw, p: q.p, up });
          if (it.dots) {
            const dp = q.pos % 2 === 0 ? q.pos + 1 : q.pos;
            for (let k2 = 0; k2 < it.dots; k2++) g.append(glyph(G.dot, nx + nw + (0.45 + k2 * 0.6) * S + (hasShift && up ? nw : 0), yPos(si, dp)));
          }
        }
        // nožička a praporek
        if (d !== 'w') {
          const top = items2[items2.length - 1].pos, bot = items2[0].pos;
          let sx, y1, y2;
          if (up) { sx = nx + nw - 0.6; y1 = yPos(si, bot) - 1.5; y2 = Math.min(yPos(si, top) - 3.5 * S, yPos(si, 4)); }
          else { sx = nx + 0.6; y1 = yPos(si, top) + 1.5; y2 = Math.max(yPos(si, bot) + 3.5 * S, yPos(si, 4)); }
          if (it.stemY != null) y2 = it.stemY;
          const stem = el('line', { x1: sx, x2: sx, y1, y2, class: 'stem' });
          g.append(stem);
          P.stem = { sx, y1, y2, up, si, g };
          if ((d === '8' || d === '16') && !it.beam) g.append(glyph((up ? G.flagU : G.flagD)[d], sx - 0.6, y2));
        }
      }
      if (it.lab || o.names) {
        const t = it.lab != null ? it.lab : it.ps.map(p => T.name(p)).join(' ');
        labelBelow(g, nx + NW[d] * S / 2, t);
      }
      if (it.fermata) g.append(glyph(G.fermata, nx - 0.3 * S, yPos(0, Math.max(10, hi[0] - 2))));
      x += w;
    });
    // trámce (vodorovné, jen pro shodný směr nožiček)
    let grp = [];
    placed.forEach((P) => {
      if (P.it.beam === 'start') grp = [P];
      else if (P.it.beam === 'cont' || P.it.beam === 'end') grp.push(P);
      if (P.it.beam === 'end' && grp.length > 1 && grp.every(q => q.stem)) {
        const up = grp[0].stem.up;
        const yb = up ? Math.min(...grp.map(q => q.stem.y2)) : Math.max(...grp.map(q => q.stem.y2));
        grp.forEach(q => q.stem.g.querySelector('.stem').setAttribute('y2', yb));
        const first = grp[0].stem.sx, last = grp[grp.length - 1].stem.sx;
        const bt = 0.5 * S, dy = up ? 0 : -bt;
        gMain.append(el('rect', { x: first - 0.6, y: yb + dy, width: last - first + 1.2, height: bt, class: 'beam' }));
        // druhý trámec pro šestnáctiny
        for (let i = 0; i < grp.length; i++) {
          if ((grp[i].it.d || 'q') !== '16') continue;
          const sx = grp[i].stem.sx;
          const nb = grp[i + 1] && grp[i + 1].it.d === '16', pb = grp[i - 1] && grp[i - 1].it.d === '16';
          const y2b = yb + (up ? 0.75 * S : -0.75 * S) + dy;
          if (nb) gMain.append(el('rect', { x: sx - 0.6, y: y2b, width: grp[i + 1].stem.sx - sx + 1.2, height: bt, class: 'beam' }));
          else if (!pb) { const dir = i === grp.length - 1 ? -1 : 1; gMain.append(el('rect', { x: dir > 0 ? sx - 0.6 : sx - 1.1 * S, y: y2b, width: 1.1 * S + 0.6, height: bt, class: 'beam' })); }
        }
        grp = [];
      }
    });
    // triolové závorky
    placed.forEach((P, i) => {
      if (P.it.tup !== 'start') return;
      let j = i; while (j < placed.length && placed[j].it.tup !== 'end') j++;
      const a = placed[i], b = placed[j]; if (!b) return;
      const x1 = a.stem ? a.stem.sx - 1.2 * S : xs[i] - S, x2 = b.stem ? b.stem.sx + 0.3 * S : xs[j] + S;
      const yTop = Math.min(...placed.slice(i, j + 1).map(q => q.stem ? Math.min(q.stem.y2, q.stem.y1) : yPos(0, 8))) - 1.2 * S;
      const mid = (x1 + x2) / 2;
      if (!placed.slice(i, j + 1).every(q => q.it.beam)) {
        gMain.append(el('path', { d: `M${x1} ${yTop + 6}V${yTop}H${mid - 7}M${mid + 7} ${yTop}H${x2}V${yTop + 6}`, class: 'tup' }));
      }
      gMain.append(glyph(G.tup3, mid - 0.45 * S, yTop + 0.55 * S, { 'font-size': FS * 0.8 }));
    });
    // ligatury
    placed.forEach((P, i) => {
      if (!P.it.tie) return;
      const nxt = placed.slice(i + 1).find(q => q.it.t === 'n');
      if (!nxt) return;
      const a = heads.find(hh => hh.idx === i), bi = placed.indexOf(nxt), b = heads.find(hh => hh.idx === bi);
      if (!a || !b) return;
      const up = a.up; const yy = yPos(a.si, a.pos) + (up ? 0.7 * S : -0.7 * S);
      const xa = a.x + a.w + 1, xb = b.x - 1, c = up ? 0.9 * S : -0.9 * S;
      gMain.append(el('path', { d: `M${xa} ${yy}Q${(xa + xb) / 2} ${yy + c} ${xb} ${yy}Q${(xa + xb) / 2} ${yy + c * 1.35} ${xa} ${yy}Z`, class: 'tie' }));
    });

    function labelBelow(g, cx, t) {
      const yb = yPos(staves.length - 1, Math.min(lo[staves.length - 1] + 2, -3));
      const tx = el('text', { x: cx, y: yb, class: 'lab', 'text-anchor': 'middle' });
      // „D̸“ (přeškrtnuté D): kombinující lomítko nahradíme vlastním přeškrtnutím
      String(t).split(/(D̸)/).forEach(part => {
        if (part === 'D̸') { tx.append(el('tspan', {}, 'D'), el('tspan', { dx: '-0.62em', class: 'dsl' }, '/')); }
        else if (part) tx.append(el('tspan', part.startsWith('⁹') ? { dx: '0.08em' } : {}, part));
      });
      g.append(tx);
    }

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W * (o.scale || 1));
    svg.setAttribute('height', H * (o.scale || 1));
    if (o.fit) { svg.removeAttribute('width'); svg.removeAttribute('height'); svg.style.width = '100%'; svg.style.maxWidth = W * (o.scale || 1.25) + 'px'; }

    // interaktivní vstup – klik na osnovu
    if (o.interactive) {
      const I = o.interactive;
      const ghost = el('g', { class: 'ghost', 'pointer-events': 'none', visibility: 'hidden' });
      svg.append(ghost);
      const hit = el('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent', class: 'hit' });
      svg.append(hit);
      const locate = ev => {
        const r = svg.getBoundingClientRect();
        const sx = (ev.clientX - r.left) * W / r.width, sy = (ev.clientY - r.top) * H / r.height;
        let best = null;
        staves.forEach((st, si) => {
          if (st.clef === 'perc' || (I.staff != null && I.staff !== si)) return;
          const pos = Math.round((tops[si] + 4 * S - sy) / (S / 2));
          const d = Math.abs(yPos(si, pos) - sy);
          const cl = Math.max(-6, Math.min(14, pos));
          if (!best || d < best.d) best = { si, pos: cl, d };
        });
        if (!best) return null;
        const clef = staves[best.si].clef;
        const dd = BOTTOM[clef] + best.pos;
        const alt = I.alt ? I.alt(((dd % 7) + 7) % 7) : T.keyAlt(key, ((dd % 7) + 7) % 7);
        return { ...best, x: I.x != null ? I.x : sx, pitch: T.fromDia(dd, alt) };
      };
      const showGhost = L => {
        ghost.innerHTML = '';
        if (!L) { ghost.setAttribute('visibility', 'hidden'); return; }
        ghost.setAttribute('visibility', 'visible');
        const gx = L.x - NW.w * S / 2;
        for (let l = -2; l >= L.pos; l -= 2) ghost.append(el('line', { x1: gx - 4, x2: gx + NW.w * S + 4, y1: yPos(L.si, l), y2: yPos(L.si, l), class: 'ledger' }));
        for (let l = 10; l <= L.pos; l += 2) ghost.append(el('line', { x1: gx - 4, x2: gx + NW.w * S + 4, y1: yPos(L.si, l), y2: yPos(L.si, l), class: 'ledger' }));
        if (L.pitch.alt !== T.keyAlt(key, L.pitch.step)) ghost.append(glyph(G.acc[L.pitch.alt], gx - (ACCW[L.pitch.alt] + 0.3) * S, yPos(L.si, L.pos)));
        ghost.append(glyph(G.w, gx, yPos(L.si, L.pos)));
        if (I.hint) ghost.append(el('text', { x: gx + NW.w * S + 6, y: yPos(L.si, L.pos) - 8, class: 'ghostlab' }, T.name(L.pitch)));
      };
      hit.addEventListener('pointermove', ev => showGhost(locate(ev)));
      hit.addEventListener('pointerleave', () => showGhost(null));
      hit.addEventListener('pointerdown', ev => { ev.preventDefault(); const L = locate(ev); if (L && I.onClick) I.onClick(L.pitch, L.si, L); });
    }
    svg._xs = xs; svg._yPos = yPos; svg._W = W;
    return svg;
  }

  /* zjednodušené volání: jeden tón / akord / melodie */
  const one = (ps, opt = {}) => draw({ clef: opt.clef || 'g', key: opt.key || 0, items: [{ t: 'n', d: opt.d || 'w', ps: Array.isArray(ps) ? ps : [ps] }], ...opt });
  const seq = (list, opt = {}) => draw({ clef: opt.clef || 'g', key: opt.key || 0, items: list.map((p, i) => ({ t: 'n', d: opt.d || 'w', ps: Array.isArray(p) ? p : [p], lab: opt.labs ? opt.labs[i] : undefined, color: opt.colors ? opt.colors[i] : undefined })), ...opt });
  return { draw, one, seq, posOf, BOTTOM, S, G };
})();
