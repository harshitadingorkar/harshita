// The living ground. A pale cream sheet with a soft sage that gathers at the map's origin, after an
// old folded print and a limewashed wall. On arrival the sage starts as a seed at the centre and grows out into the
// cream; going from the map to the work it keeps spreading until the whole screen is sage; going back it draws in.
// The painted field is worked out once (four colour layers and a distance field, baked into textures), so each frame
// of the spread is only a cheap blend: it runs at the screen's full rate, and it is still the rest of the time.
(() => {
  const de = document.documentElement, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  de.classList.add('wash');

  const NOISE = `precision highp float;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(.8, .6, -.6, .8); for (int i = 0; i < 6; i++) { v += a * n(p); p = m * p * 2.03 + 11.7; a *= .5; } return v; }
`;
  // the bake: one layer per pass. 0 sage by day, 1 cream by day, 2 sage at dusk, 3 cream at dusk, 4 the bloom's distance field
  const BAKE = NOISE + `uniform vec2 R; uniform vec2 S; uniform vec2 L; uniform vec2 O; uniform float P;
void main(){
  vec2 uv = gl_FragCoord.xy / R, p = (gl_FragCoord.xy - .5 * R) / min(R.x, R.y) + S;
  vec2 q = vec2(fbm(p * 1.05), fbm(p * 1.05 + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p * 1.25 + 2.6 * q + vec2(1.7, 9.2)), fbm(p * 1.25 + 2.6 * q + vec2(8.3, 2.8)));
  float f = fbm(p * 1.5 + 2.2 * r);
  float sweep = fbm(vec2(p.x * .55, p.y * 3.4) + 1.4 * q);
  float m = mix(f, sweep, .42) + (n(p * 9. + r * 3.) - .5) * .05;
  if (P > 3.5) {
    // how far each point is from the origin, made ragged by the same field so the bloom's edge is a stain, not a circle
    vec2 o = (gl_FragCoord.xy - O) / min(R.x, R.y);
    float d = clamp((length(o * vec2(.86, 1.)) + (f - .5) * .28 + (r.y - .5) * .2 + .5) / 3., 0., 1.) * 65535.;
    gl_FragColor = vec4(floor(d / 256.) / 255., mod(d, 256.) / 255., 0., 1.); return;
  }
  vec3 c;
  // sage: a cool, quiet leaf-in-shade green with a little grey in it, a shade deeper where the brush went over twice
  if (P < .5) { c = mix(vec3(.776, .812, .725), vec3(.851, .871, .808), smoothstep(.3, .74, m));   // #c6cfb9 → #d9dece
    c = mix(c, vec3(.69, .749, .655), smoothstep(.52, .86, r.x) * .3);                            // #b0bfa7
    c = mix(c, vec3(.89, .894, .839), smoothstep(.58, .9, q.y) * .24); }                          // #e3e4d6
  else if (P < 1.5) { c = mix(vec3(.957, .937, .894), vec3(.973, .957, .922), smoothstep(.3, .75, m));  // #f4efe4 → #f8f4eb
    c = mix(c, vec3(.965, .929, .898), smoothstep(.55, .9, q.x) * .3); }                          // a blush where it was handled
  else if (P < 2.5) { c = mix(vec3(.153, .176, .149), vec3(.192, .216, .184), smoothstep(.3, .74, m));  // dusk sage #272d26 → #31372f
    c = mix(c, vec3(.13, .16, .135), smoothstep(.52, .86, r.x) * .4); }
  else { c = mix(vec3(.098, .106, .094), vec3(.122, .129, .114), smoothstep(.3, .75, m)); }
  float D = P > 1.5 ? 1. : 0.;
  float dl = length((uv - L) * vec2(R.x / R.y, 1.));
  c *= 1. + mix(.04, .05, D) * (1. - smoothstep(0., 1.1, dl));
  c *= mix(1., mix(.96, .85, D), smoothstep(.5, 1.3, length((uv - .5) * vec2(1.15, 1.))));
  c += (h(gl_FragCoord.xy + S * 97.) - .5) / 255.;
  gl_FragColor = vec4(c, 1.);
}`;
  // each frame: blend the baked layers by how far the sage has reached
  const MIX = `precision mediump float;
uniform vec2 R; uniform sampler2D tG, tC, tGd, tCd, tD; uniform float D, G, F, K;
void main(){
  vec2 uv = gl_FragCoord.xy / R;
  vec4 e = texture2D(tD, uv); float dist = (e.r * 255. * 256. + e.g * 255.) / 65535. * 3. - .5;
  vec3 sage = mix(texture2D(tG, uv).rgb, texture2D(tGd, uv).rgb, D), cream = mix(texture2D(tC, uv).rgb, texture2D(tCd, uv).rgb, D);
  float bloom = 1. - smoothstep(G - F, G + F * .6, dist);
  float heart = 1. - smoothstep(0., max(G, .05) + F, dist);
  vec3 c = mix(cream, sage, bloom * mix(mix(.62, 1., heart), 1., 1. - K));
  // on the map the bloom has a deeper heart, the way damp gathers in the middle of a sheet; it evens out as the sage covers the work
  c = mix(c, mix(vec3(.62, .69, .6), vec3(.17, .2, .165), D), K * .5 * (1. - smoothstep(0., .5, dist)) * smoothstep(-.3, .1, G));   // #9eb099
  gl_FragColor = vec4(c, 1.);
}`;
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  const seed = [Math.random() * 40, Math.random() * 40], hour = new Date().getHours(), light = [hour < 13 ? .26 : .74, .78];
  const cv = document.createElement('canvas'); cv.id = 'wash'; cv.setAttribute('aria-hidden', 'true');
  let gl, bake, mix, UB = {}, UM = {}, tex = [], fb, scale = 1, O = [0, 0], FULL = 1.6;
  const SEED = -.34, MAP = .4, F = .3;
  const st = { g: SEED, d: de.dataset.theme === 'dark' ? 1 : 0, from: SEED, to: SEED, t0: 0, dur: 1, ease: x => x, raf: 0, dt: null };

  const prog = fs => { const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null; };
  function setup() {
    gl = cv.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: false }); if (!gl) return false;
    bake = prog(BAKE); mix = prog(MIX); if (!bake || !mix) return false;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const k of ['R', 'S', 'L', 'O', 'P']) UB[k] = gl.getUniformLocation(bake, k);
    for (const k of ['R', 'tG', 'tC', 'tGd', 'tCd', 'tD', 'D', 'G', 'F', 'K']) UM[k] = gl.getUniformLocation(mix, k);
    fb = gl.createFramebuffer();
    return true;
  }
  function origin() {
    const hub = document.querySelector('.m-hub')?.getBoundingClientRect();
    const x = hub && hub.width ? hub.left + hub.width / 2 : innerWidth / 2, y = hub && hub.width ? hub.top + hub.height / 2 : innerHeight * .56;
    // the sage is full once it has passed the farthest corner, ragged edge and all
    const md = Math.max(...[[0, 0], [innerWidth, 0], [0, innerHeight], [innerWidth, innerHeight]].map(([cx, cy]) => Math.hypot((cx - x) * .86, cy - y))) / Math.min(innerWidth, innerHeight);
    FULL = md + .26 + F;
    return [x * scale, cv.height - y * scale];
  }
  function bakeAll() {
    scale = Math.min(1, 1800 / innerWidth); cv.width = Math.round(innerWidth * scale); cv.height = Math.round(innerHeight * scale);
    O = origin();
    tex.forEach(t => gl.deleteTexture(t)); tex = [];
    gl.useProgram(bake); gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(UB.R, cv.width, cv.height); gl.uniform2f(UB.S, seed[0], seed[1]); gl.uniform2f(UB.L, light[0], light[1]); gl.uniform2f(UB.O, O[0], O[1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    for (let i = 0; i < 5; i++) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cv.width, cv.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.uniform1f(UB.P, i); gl.drawArrays(gl.TRIANGLES, 0, 3); tex.push(t);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(mix); gl.uniform2f(UM.R, cv.width, cv.height);
    ['tG', 'tC', 'tGd', 'tCd', 'tD'].forEach((k, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[i]); gl.uniform1i(UM[k], i); });
    gl.uniform1f(UM.F, F);
  }
  function draw(gv = st.g) {
    gl.uniform1f(UM.D, st.d); gl.uniform1f(UM.G, gv); gl.uniform1f(UM.K, Math.max(0, Math.min(1, (FULL - gv) / (FULL - MAP))));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  // a still of the fully covered field, for the surfaces laid on top (the case sheet, the work header)
  let still = null;
  function snapshot() {
    draw(FULL); cv.toBlob(b => { if (!b) return; if (still) URL.revokeObjectURL(still); still = URL.createObjectURL(b); de.style.setProperty('--wash', `url(${still})`); }, 'image/jpeg', .94);
    draw();
  }
  // easing as CSS writes it, so the spread moves like the rest of the site
  const bez = (x1, y1, x2, y2) => t => { if (t <= 0 || t >= 1) return t; let a = 0, b = 1, u = t;
    for (let i = 0; i < 22; i++) { u = (a + b) / 2; const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u; if (x < t) a = u; else b = u; }
    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u; };
  const grow = bez(.22, .9, .3, 1), spread = bez(.45, .05, .18, 1), gather = bez(.55, 0, .3, 1);
  function go(to, dur, ease) {
    if (RM) { st.g = to; draw(); return; }
    Object.assign(st, { from: st.g, to, t0: performance.now(), dur, ease });
    if (!st.raf) st.raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    const k = Math.min(1, (now - st.t0) / st.dur); st.g = st.from + (st.to - st.from) * st.ease(k);
    if (st.dt) { const j = Math.min(1, (now - st.dt.t0) / 600); st.d = st.dt.from + (st.dt.to - st.dt.from) * (1 - Math.pow(1 - j, 3)); if (j >= 1) { st.dt = null; snapshot(); } }
    draw();
    st.raf = k < 1 || st.dt ? requestAnimationFrame(tick) : 0;
  }
  const onWork = () => document.body.classList.contains('show-index');

  function start() {
    if (!setup()) { de.classList.add('wash-flat'); return; }
    document.body.prepend(cv); bakeAll(); draw(); snapshot();
    // arrival: a seed of sage at the origin grows out into the cream, slower while the intro is speaking
    const intro = !!document.getElementById('intro');
    setTimeout(() => go(onWork() ? FULL : MAP, intro ? 2800 : 1900, grow), intro ? 350 : 120);
    // map ⇄ work: the sage spreads out until it covers the screen, or draws back in to its bloom
    let was = onWork();
    new MutationObserver(() => { const now = onWork(); if (now === was) return; was = now; go(now ? FULL : MAP, now ? 1250 : 1100, now ? spread : gather); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(() => { const to = de.dataset.theme === 'dark' ? 1 : 0; if (to === st.d && !st.dt) return;
      if (RM) { st.d = to; draw(); snapshot(); return; } st.dt = { from: st.d, to, t0: performance.now() }; if (!st.raf) st.raf = requestAnimationFrame(tick); })
      .observe(de, { attributes: true, attributeFilter: ['data-theme'] });
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { bakeAll(); draw(); snapshot(); }, 220); });
  }
  if (document.readyState === 'complete') requestAnimationFrame(start); else addEventListener('load', () => requestAnimationFrame(start));
})();
