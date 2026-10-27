// Sound, from the first prototype: every point has a note — higher on the map is higher in
// pitch, further right is further into your right ear. Off until the visitor turns it on.
(() => {
  const SCALE = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25, 739.99];
  let ctx = null, out = null, last = 0;
  const key = 'sound';
  const on = () => { try { return localStorage.getItem(key) === 'on'; } catch { return false; } };
  function wake() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = .9;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      out.connect(lp); lp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  function tone(freq, pan = 0, peak = .05, delay = 0, len = 1.4) {
    if (!ctx || !out) return;
    const t = ctx.currentTime + delay, env = ctx.createGain();
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(peak, t + .008); env.gain.exponentialRampToValueAtTime(.0001, t + len);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p) p.pan.value = pan;
    const a = ctx.createOscillator(); a.type = 'sine'; a.frequency.value = freq;
    const b = ctx.createOscillator(); b.type = 'triangle'; b.frequency.value = freq * 2;
    const bg = ctx.createGain(); bg.gain.value = .12;
    a.connect(env); b.connect(bg); bg.connect(env);
    if (p) { env.connect(p); p.connect(out); } else env.connect(out);
    a.start(t); b.start(t); a.stop(t + len + .1); b.stop(t + len + .1);
  }
  // A short breath of filtered noise: paper turning over.
  function flick(delay = 0) {
    if (!ctx || !out) return;
    const t = ctx.currentTime + delay, n = ctx.sampleRate * .22, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = .7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
    s.connect(bp); bp.connect(g); g.connect(out); s.start(t);
  }
  const ready = () => ctx && ctx.state === 'running' && on();
  window.portfolioSound = {
    on, wake,
    set(v) { try { localStorage.setItem(key, v ? 'on' : 'off'); } catch {} if (v) { wake(); tone(SCALE[3], -.2, .05); tone(SCALE[5], .2, .04, .12); } },
    pluck(x, y) { if (!ready()) return; const now = performance.now(); if (now - last < 60) return; last = now; const i = Math.max(0, Math.min(SCALE.length - 1, Math.round(((y + 1) / 2) * (SCALE.length - 1)))); tone(SCALE[i], Math.max(-1, Math.min(1, x * .8)), .05); },
    chime() { if (!on()) return; wake(); tone(SCALE[3], -.2, .05); tone(SCALE[5], .2, .04, .12); },
    tap() { if (ready()) tone(SCALE[0] / 2, 0, .06, 0, .5); },
    flick() { if (ready()) flick(); },
    // two soft notes: up when the map opens out, down when it folds into a list
    steps(up) { if (!ready()) return; const [a, b] = up ? [SCALE[2], SCALE[5]] : [SCALE[5], SCALE[2]]; tone(a, -.15, .035, 0, .7); tone(b, .15, .03, .09, .9); },
    dusk(dark) { if (!ready()) return; tone(dark ? SCALE[0] : SCALE[7], 0, .035, 0, 1.6); tone(dark ? SCALE[2] / 2 : SCALE[9], 0, .02, .14, 1.8); },
  };
  // Someone who left sound on gets it back at their first click or keypress.
  if (on()) { const h = () => wake(); addEventListener('pointerdown', h, { once: true }); addEventListener('keydown', h, { once: true }); }
})();
