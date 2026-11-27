/* Zvuk: vzorky klavíru Salamander Grand Piano (CC-BY 3.0, Alexander Holm) s náhradní syntézou */
'use strict';
const Snd = (() => {
  let ctx = null, master = null, comp = null;
  const buffers = new Map(); // midi -> AudioBuffer
  let loading = null, loaded = false;
  const BASE = 'https://tonejs.github.io/audio/salamander/';
  // vzorky po malé tercii: C, Ds, Fs, A
  const SAMPLE_NOTES = [];
  for (let o = 0; o <= 8; o++) for (const [n, pc] of [['C', 0], ['Ds', 3], ['Fs', 6], ['A', 9]]) {
    const m = 12 * (o + 1) + pc;
    if (m >= 21 && m <= 108) SAMPLE_NOTES.push({ m, file: n + o });
  }
  let volume = store.get('vol', 0.8);

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = volume;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    if (!loading) loading = loadSamples();
    return ctx;
  }
  async function loadSamples() {
    // nejprve střední rejstřík, potom zbytek
    const order = SAMPLE_NOTES.slice().sort((a, b) => Math.abs(a.m - 64) - Math.abs(b.m - 64));
    let ok = 0;
    await Promise.all(order.map(async ({ m, file }, i) => {
      try {
        await new Promise(r => setTimeout(r, i * 25));
        const res = await fetch(BASE + file + '.mp3');
        if (!res.ok) throw 0;
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        buffers.set(m, buf); ok++;
      } catch { }
    }));
    loaded = ok > 0;
    document.dispatchEvent(new CustomEvent('audio-status', { detail: { loaded, ok } }));
  }
  function nearest(m) {
    let best = null, bd = 99;
    for (const k of buffers.keys()) { const d = Math.abs(k - m); if (d < bd) { bd = d; best = k; } }
    return bd <= 4 ? best : null;
  }
  /* zahraj tón: m = MIDI, t = začátek (s od teď), dur = délka (s) */
  function note(m, t = 0, dur = 1.2, vel = 0.8) {
    ensure();
    const when = ctx.currentTime + t + 0.01;
    const k = nearest(m);
    const g = ctx.createGain();
    g.connect(master);
    if (k != null) {
      const src = ctx.createBufferSource();
      src.buffer = buffers.get(k);
      src.playbackRate.value = Math.pow(2, (m - k) / 12);
      g.gain.setValueAtTime(vel, when);
      g.gain.setValueAtTime(vel, when + dur);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur + 0.35);
      src.connect(g); src.start(when); src.stop(when + dur + 0.4);
      return;
    }
    // syntéza: několik harmonických s exponenciálním doznívem
    const f = T.freq(m);
    const parts = [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [5, 0.05]];
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vel * 0.32, when + 0.008);
    g.gain.exponentialRampToValueAtTime(vel * 0.12, when + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur + 0.3);
    for (const [hn, a] of parts) {
      if (f * hn > 12000) continue;
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.frequency.value = f * hn * (1 + 0.0004 * hn * hn);
      og.gain.value = a;
      o.connect(og); og.connect(g); o.start(when); o.stop(when + dur + 0.4);
    }
  }
  const chord = (ms, t = 0, dur = 1.6) => ms.forEach(m => note(m, t, dur, 0.6));
  const melody = (ms, step = 0.6, dur = 0.55, t0 = 0) => ms.forEach((m, i) => note(m, t0 + i * step, dur));
  /* kliknutí metronomu */
  function click(t = 0, accent = false) {
    ensure();
    const when = ctx.currentTime + t + 0.01;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = accent ? 1760 : 1175;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(accent ? 0.28 : 0.16, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + 0.06);
  }
  /* bicí zvuk pro rytmus (dřívko) */
  function wood(t = 0, vel = 1) {
    ensure();
    const when = ctx.currentTime + t + 0.01;
    const o = ctx.createOscillator(); const g = ctx.createGain(); const bp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(900, when); o.frequency.exponentialRampToValueAtTime(600, when + 0.05);
    bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 2;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.5 * vel, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
    o.connect(bp); bp.connect(g); g.connect(master); o.start(when); o.stop(when + 0.15);
  }
  function setVolume(v) { volume = v; store.set('vol', v); if (master) master.gain.value = v; }
  const now = () => (ensure(), ctx.currentTime);
  function stopAll() { if (!ctx) return; master.disconnect(); master = ctx.createGain(); master.gain.value = volume; master.connect(comp); }
  return { ensure, note, chord, melody, click, wood, setVolume, get volume() { return volume; }, now, stopAll, get loaded() { return loaded; }, get ctx() { return ctx; } };
})();
