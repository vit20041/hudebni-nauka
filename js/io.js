/* Vstupy: klaviatura na obrazovce, MIDI, klávesnice počítače, mikrofon */
'use strict';
const Bus = (() => {
  const L = {};
  return {
    on(ev, f) { (L[ev] = L[ev] || []).push(f); return () => { L[ev] = L[ev].filter(g => g !== f); }; },
    emit(ev, d) { (L[ev] || []).slice().forEach(f => f(d)); },
  };
})();
/* aktuálně držené tóny (ze všech zdrojů) */
const Held = new Set();
function noteOn(m, src, vel = 0.8) {
  if (Held.has(m) && src !== 'click') return;
  Held.add(m);
  if (src !== 'silent') Snd.note(m, 0, 1.6, vel);
  Bus.emit('on', { m, src });
  Bus.emit('held', [...Held]);
}
function noteOff(m, src) {
  if (!Held.has(m)) return;
  Held.delete(m);
  Bus.emit('off', { m, src });
  Bus.emit('held', [...Held]);
}

/* ---------- klaviatura (SVG) ---------- */
const Piano = (() => {
  const BLACK = new Set([1, 3, 6, 8, 10]);
  function create(host, o = {}) {
    const from = o.from ?? 48, to = o.to ?? 84;
    const whites = []; for (let m = from; m <= to; m++) if (!BLACK.has(m % 12)) whites.push(m);
    const WW = 24, WH = o.h || 110, BW = 15, BH = WH * 0.62;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${whites.length * WW + 1} ${WH + 1}`);
    svg.setAttribute('class', 'piano');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Klaviatura');
    const keys = new Map();
    const mk = (m, x, w, hh, black) => {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', 0.5); r.setAttribute('width', w); r.setAttribute('height', hh);
      r.setAttribute('rx', black ? 2 : 3);
      r.setAttribute('class', black ? 'kb' : 'kw');
      r.dataset.m = m;
      keys.set(m, r); return r;
    };
    const gw = document.createElementNS(NS, 'g'), gb = document.createElementNS(NS, 'g'), gl = document.createElementNS(NS, 'g');
    whites.forEach((m, i) => {
      gw.append(mk(m, i * WW + 0.5, WW, WH, false));
      if (o.labels !== false && m % 12 === 0) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', i * WW + WW / 2 + 0.5); t.setAttribute('y', WH - 8); t.setAttribute('class', 'klab');
        t.setAttribute('text-anchor', 'middle');
        t.textContent = T.name(T.P(0, 0, Math.floor(m / 12) - 1));
        gl.append(t);
      }
    });
    whites.forEach((m, i) => {
      if (m + 1 <= to && BLACK.has((m + 1) % 12)) gb.append(mk(m + 1, (i + 1) * WW - BW / 2 + 0.5, BW, BH, true));
    });
    svg.append(gw, gl, gb);
    host.append(svg);
    let down = null;
    const at = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY); return t && t.dataset && t.dataset.m ? +t.dataset.m : null; };
    svg.addEventListener('pointerdown', ev => {
      const m = at(ev); if (m == null) return;
      ev.preventDefault(); svg.setPointerCapture(ev.pointerId);
      down = m; noteOn(m, 'click');
    });
    svg.addEventListener('pointermove', ev => {
      if (down == null) return; const m = at(ev);
      if (m != null && m !== down) { noteOff(down, 'click'); down = m; noteOn(m, 'click'); }
    });
    const up = () => { if (down != null) { noteOff(down, 'click'); down = null; } };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    const offH = Bus.on('held', hs => { keys.forEach((r, m) => r.classList.toggle('on', hs.includes(m))); });
    const api = {
      svg,
      mark(m, cls) { const r = keys.get(m); if (r) r.classList.add(cls); },
      unmark(cls) { keys.forEach(r => r.classList.remove(cls)); },
      destroy() { offH(); svg.remove(); },
      range: [from, to],
    };
    return api;
  }
  return { create };
})();

/* ---------- klávesnice počítače: A W S E D F T G Z/Y H U J K O L P ---------- */
const KeyMap = (() => {
  const MAP = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyZ: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
  let base = store.get('kbBase', 60), enabled = store.get('kbOn', true);
  const typing = () => { const a = document.activeElement; return a && ((a.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes(a.type)) || a.tagName === 'TEXTAREA' || a.isContentEditable); };
  // po výběru v rozbalovacím seznamu vrátit fokus stránce, aby šlo hned hrát z klávesnice
  document.addEventListener('change', e => { if (e.target.tagName === 'SELECT') e.target.blur(); });
  addEventListener('keydown', e => {
    if (!enabled || e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing()) return;
    if (e.code === 'KeyX') { base = Math.min(96, base + 12); store.set('kbBase', base); Bus.emit('kbBase', base); return; }
    if (e.code === 'KeyQ') { base = Math.max(24, base - 12); store.set('kbBase', base); Bus.emit('kbBase', base); return; }
    if (MAP[e.code] == null) return;
    e.preventDefault(); noteOn(base + MAP[e.code], 'kb');
  });
  addEventListener('keyup', e => { if (MAP[e.code] != null) noteOff(base + MAP[e.code], 'kb'); });
  return { get base() { return base; }, get enabled() { return enabled; }, set enabled(v) { enabled = v; store.set('kbOn', v); } };
})();

/* ---------- MIDI ---------- */
const Midi = (() => {
  let access = null, status = 'off', names = [];
  const supported = !!navigator.requestMIDIAccess;
  function onMsg(e) {
    const [st, d1, d2] = e.data; const cmd = st & 0xf0;
    if (cmd === 0x90 && d2 > 0) noteOn(d1, 'midi', 0.35 + 0.65 * d2 / 127);
    else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) noteOff(d1, 'midi');
  }
  function bind() {
    names = [];
    access.inputs.forEach(inp => { inp.onmidimessage = onMsg; names.push(inp.name); });
    status = names.length ? 'on' : 'none';
    Bus.emit('midi', { status, names });
  }
  async function start() {
    if (!supported) { status = 'unsupported'; Bus.emit('midi', { status, names }); return; }
    try {
      access = await navigator.requestMIDIAccess();
      access.onstatechange = bind; bind();
      store.set('midiOn', true);
    } catch { status = 'denied'; Bus.emit('midi', { status, names }); }
  }
  return { start, supported, get status() { return status; }, get names() { return names; } };
})();

/* ---------- mikrofon: detekce výšky tónu (autokorelace s parabolickou interpolací) ---------- */
const Mic = (() => {
  let stream = null, an = null, buf = null, raf = 0, listeners = new Set(), running = false;
  function detect(b, sr) {
    const n = b.length;
    let rms = 0; for (let i = 0; i < n; i++) rms += b[i] * b[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.012) return { f: 0, rms, clarity: 0 };
    // ořez okrajů pod prahem
    let r1 = 0, r2 = n - 1; const th = 0.2;
    for (let i = 0; i < n / 2; i++) if (Math.abs(b[i]) < th) { r1 = i; break; }
    for (let i = 1; i < n / 2; i++) if (Math.abs(b[n - i]) < th) { r2 = n - i; break; }
    const x = b.slice(r1, r2); const m = x.length;
    const minLag = Math.floor(sr / 1100), maxLag = Math.min(Math.floor(sr / 60), m - 1);
    const c = new Float32Array(maxLag + 2);
    for (let lag = 0; lag <= maxLag + 1; lag++) { let s = 0; for (let i = 0; i < m - lag; i++) s += x[i] * x[i + lag]; c[lag] = s; }
    let d = minLag; while (d < maxLag && c[d] > c[d + 1]) d++;
    let best = -1, bi = -1;
    for (let i = d; i <= maxLag; i++) if (c[i] > best) { best = c[i]; bi = i; }
    if (bi <= 0 || c[0] <= 0) return { f: 0, rms, clarity: 0 };
    const clarity = best / c[0];
    const y1 = c[bi - 1], y2 = c[bi], y3 = c[bi + 1];
    const a = (y1 + y3 - 2 * y2) / 2, bb = (y3 - y1) / 2;
    const T0 = a ? bi - bb / (2 * a) : bi;
    return { f: sr / T0, rms, clarity };
  }
  function loop() {
    an.getFloatTimeDomainData(buf);
    const r = detect(buf, an.context.sampleRate);
    let res = null;
    if (r.f > 60 && r.f < 1100 && r.clarity > 0.85) {
      const mf = 69 + 12 * Math.log2(r.f / 440);
      const m = Math.round(mf);
      res = { f: r.f, midi: mf, note: m, cents: Math.round((mf - m) * 100), rms: r.rms };
    }
    listeners.forEach(f => f(res));
    raf = requestAnimationFrame(loop);
  }
  async function start() {
    if (running) return true;
    const ctx = Snd.ensure();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) { Bus.emit('mic', { status: 'denied' }); return false; }
    const src = ctx.createMediaStreamSource(stream);
    an = ctx.createAnalyser(); an.fftSize = 2048; buf = new Float32Array(an.fftSize);
    src.connect(an);
    running = true; loop();
    Bus.emit('mic', { status: 'on' });
    return true;
  }
  function stop() {
    cancelAnimationFrame(raf); running = false;
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; Bus.emit('mic', { status: 'off' });
  }
  return { start, stop, on(f) { listeners.add(f); return () => listeners.delete(f); }, get running() { return running; } };
})();
