/* PPH — one story: monogram window (01) → sky of documents (09) → descent → road of clients (12) → arrival. Optional sound. */
(function () {
  var d = document, root = d.documentElement, SRC = (d.currentScript && d.currentScript.src) || location.href
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.remove('js'); return }
  if (!window.PPH_onScene) return
  root.classList.add('own-hd')
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)) }
  var ss = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
  var W = innerWidth, H = innerHeight, k2 = 0, k3 = 0

  /* sound: off until the visitor turns it on; files load only then (~300 KB) */
  var SFX = (function () {
    var ctx = null, out = null, buf = {}, on = false, last = {}, amb = {}, base = (d.querySelector('meta[name=pph-sfx]') || {}).content || '../sfx/'
    // short sounds first, then the three ambience beds
    var names = ['key', 'key-hard', 'ui-toggle', 'whoosh', 'swoosh-wind', 'descent', 'land', 'fanfare', 'ui-send', 'ui-success', 'amb-city', 'amb-sky', 'amb-road', 'brass']
    function load() {
      names.reduce(function (pr, n) {
        if (buf[n]) return pr
        buf[n] = 'loading'
        var f = fetch(new URL(base + n + '.mp3', location.href)).then(function (r) { return r.arrayBuffer() })
          .then(function (a) { return new Promise(function (ok, no) { ctx.decodeAudioData(a, ok, no) }) })
          .then(function (b) { buf[n] = b; if (n.indexOf('amb-') === 0) startAmb(n) }).catch(function () { buf[n] = null })
        return n.indexOf('amb-') === 0 ? pr.then(function () { return f }) : pr
      }, Promise.resolve())
    }
    function startAmb(n) {
      if (amb[n] || !buf[n] || !buf[n].duration) return
      var g = ctx.createGain(); g.gain.value = 0; g.connect(out)
      var s = ctx.createBufferSource(); s.buffer = buf[n]; s.loop = true; s.loopStart = 0.06; s.loopEnd = buf[n].duration - 0.06
      s.connect(g); s.start(0, Math.random() * 8); amb[n] = g
    }
    function ensure() {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination); load() }
      if (ctx.state === 'suspended') ctx.resume()
      return true
    }
    return {
      get on() { return on },
      set: function (v) {
        on = v
        try { localStorage.setItem('pph-sound', v ? '1' : '0') } catch (e) {}
        if (v) { if (!ensure()) return; out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0.9, ctx.currentTime, 0.05) }
        else if (ctx) out.gain.setTargetAtTime(0, ctx.currentTime, 0.08)
      },
      play: function (n, vol, rate, gap) {
        if (!on || !ctx || ctx.state !== 'running') return
        var b = buf[n]; if (!b || !b.duration) return
        var t = ctx.currentTime; if (last[n] && t - last[n] < (gap == null ? 0.12 : gap)) return; last[n] = t
        var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.playbackRate.value = rate || 1; g.gain.value = vol == null ? 1 : vol
        s.connect(g); g.connect(out); s.start()
      },
      amb: function (lv) { if (!ctx) return; for (var n in amb) amb[n].gain.setTargetAtTime(on ? (lv[n] || 0) : 0, ctx.currentTime, 0.7) }
    }
  })()
  var marks = {}
  function cross(id, k, at, name, vol) {      // a transition sound when the scroll passes a point going down
    var was = marks[id]; marks[id] = k
    if (was != null && was < at && k >= at && k - was < 0.08) SFX.play(name, vol)
  }
  ;(function () {
    var end = d.querySelector('.hd__end'); if (!end) return
    var uz = root.lang === 'uz', b = d.createElement('button')
    b.type = 'button'; b.className = 'snd'; b.setAttribute('aria-pressed', 'false')
    b.innerHTML = '<i aria-hidden="true"><b></b><b></b><b></b><b></b></i><span>' + (uz ? 'Ovoz' : 'Звук') + '</span>'
    b.setAttribute('aria-label', uz ? 'Ovozni yoqish' : 'Включить звук')
    end.insertBefore(b, end.firstChild)
    function paint() { b.classList.toggle('on', SFX.on); b.setAttribute('aria-pressed', String(SFX.on)); b.setAttribute('aria-label', SFX.on ? (uz ? 'Ovozni o‘chirish' : 'Выключить звук') : (uz ? 'Ovozni yoqish' : 'Включить звук')) }
    b.addEventListener('click', function () { SFX.set(!SFX.on); paint(); setTimeout(function () { SFX.play('ui-toggle', 0.8) }, 60) })
    var saved = null; try { saved = localStorage.getItem('pph-sound') } catch (e) {}
    if (saved === '1') {                       // browsers need a gesture first: resume on the first tap or key
      var go = function () { SFX.set(true); paint(); removeEventListener('pointerdown', go, true); removeEventListener('keydown', go, true) }
      addEventListener('pointerdown', go, true); addEventListener('keydown', go, true)
    }
    d.addEventListener('pointerdown', function (e) { var t = e.target.closest && e.target.closest('a,button,select,label,input'); if (t && t !== b && !t.closest('.snd')) SFX.play('key-hard', 0.85, 0.96 + Math.random() * 0.08, 0.05) })
    d.addEventListener('keydown', function (e) {
      var t = e.target; if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') SFX.play('key-hard', 0.9, 0.9, 0.02); else if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') SFX.play('key', 0.8, 0.88 + Math.random() * 0.26, 0.02)
    })
    d.querySelectorAll('[data-pph-form]').forEach(function (f) {
      f.addEventListener('submit', function () { SFX.play('ui-send', 0.8) })
      var st = f.querySelector('[data-status]')
      if (st) new MutationObserver(function () { var inp = f.querySelector('input[type=tel],input[name=phone]'); if (st.textContent && inp && !inp.value) SFX.play('ui-success', 0.9) }).observe(st, { childList: true, characterData: true, subtree: true })
    })
  })()
  addEventListener('resize', function () { W = innerWidth; H = innerHeight })

  /* later acts load after the first screen is ready */
  function wake() {
    d.querySelectorAll('[data-srcset]').forEach(function (e) { e.srcset = e.getAttribute('data-srcset'); e.removeAttribute('data-srcset') })
    d.querySelectorAll('img[data-src]').forEach(function (e) { e.src = e.getAttribute('data-src'); e.removeAttribute('data-src') })
  }
  if (d.readyState === 'complete') setTimeout(wake, 150); else addEventListener('load', function () { setTimeout(wake, 150) })
  addEventListener('scroll', function once() { wake(); removeEventListener('scroll', once) }, { passive: true })

  /* smooth scroll on desktop */
  if (window.Lenis && matchMedia('(pointer: fine)').matches) {
    var lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
    ;(function raf(t) { lenis.raf(t); requestAnimationFrame(raf) })(0)
    d.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length > 1 && d.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: id === '#services' ? 0 : -70, duration: 1.6 }) } })
    })
  }

  /* header colour follows the act under it */
  var hd = d.querySelector('.hd'), themed = [].slice.call(d.querySelectorAll('[data-theme]')), darkOverride = false
  function headerTheme() {
    var y = 38, theme = 'light', solid = false
    themed.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { theme = s.getAttribute('data-theme'); solid = s.hasAttribute('data-solid') } })
    var dark = theme === 'dark' || darkOverride
    hd.classList.toggle('hd--dark', dark); hd.classList.toggle('hd--solid', solid)
  }
  addEventListener('scroll', headerTheme, { passive: true }); headerTheme()

  /* I. monogram → window → Nest One */
  var a1 = d.querySelector('.act1'), st1 = a1.querySelector('.stage'), win = a1.querySelector('.a1__win'),
      photo = a1.querySelector('.a1__photo'), ink = a1.querySelector('.a1__ink'), pimg = photo.querySelector('img'),
      copy = a1.querySelector('.a1__copy'), place = a1.querySelector('.a1__place'), hint = a1.querySelector('.a1__hint'), R
  function measure1() {
    var sr = st1.getBoundingClientRect(), wr = win.getBoundingClientRect(), w = sr.width, h = sr.height
    R = { x: wr.left - sr.left, y: wr.top - sr.top, w: wr.width, h: wr.height, W: w, H: h }
    R.S = Math.max(1.25 * w / (0.096 * R.w), 1.15 * h / R.h)
    var sc = Math.max(w / 2400, h / 1800), iw = 2400 * sc, ih = 1800 * sc
    var cx = (R.x + R.w * 0.5) / w, cy = (R.y + R.h * 0.5) / h
    var px = iw > w ? (0.628 * iw - cx * w) / (iw - w) : 0.5, py = ih > h ? (0.42 * ih - cy * h) / (ih - h) : 0.5
    pimg.style.objectPosition = (clamp(px, 0, 1) * 100).toFixed(2) + '% ' + (clamp(py, 0, 1) * 100).toFixed(2) + '%'
  }
  function act1(k) {
    if (!R) measure1()
    var e = ss(0.16, 0.86, k), s = Math.exp(Math.log(R.S) * e * e)
    var ax = R.x + R.w / 2, ay = R.y + R.h / 2, px = ax + (R.W / 2 - ax) * e, py = ay + (R.H / 2 - ay) * e
    var mw = R.w * s, mh = R.h * s
    st1.style.setProperty('--mw', mw.toFixed(1) + 'px'); st1.style.setProperty('--mh', mh.toFixed(1) + 'px')
    st1.style.setProperty('--mx', (px - mw / 2).toFixed(1) + 'px'); st1.style.setProperty('--my', (py - mh / 2).toFixed(1) + 'px')
    ink.style.opacity = String(1 - ss(0.03, 0.17, k))
    photo.classList.toggle('full', e >= 0.999)
    pimg.style.transform = 'translateY(' + (ss(0.86, 1, k) * 16).toFixed(2) + '%) scale(' + (1.12 - 0.12 * ss(0.3, 1, k)).toFixed(4) + ')'
    copy.style.opacity = String(1 - ss(0.0, 0.14, k)); copy.style.visibility = k > 0.16 ? 'hidden' : 'visible'
    hint.style.opacity = String(1 - ss(0, 0.05, k))
    place.style.opacity = String(ss(0.84, 0.95, k))
    darkOverride = k > 0.72 && k < 1
    k1 = k; cross('a1w', k, 0.22, 'whoosh', 0.6); cross('a1r', k, 0.84, 'swoosh-wind', 0.75)
  }
  addEventListener('resize', function () { R = null })
  PPH_onScene(a1, act1); act1(0)

  /* II. ten documents leave the clouds one by one */
  var a2 = d.querySelector('.act2'), cards = [].slice.call(a2.querySelectorAll('.card')),
      idx = [].slice.call(a2.querySelectorAll('.a2__idx li')), now = a2.querySelector('.a2__now b'), N = cards.length, last = -1
  var head2 = a2.querySelector('.a2__head'), stack2 = a2.querySelector('.stack'), now2 = a2.querySelector('.a2__now')
  function act2(k) {
    var inn = ss(0.002, 0.03, k), st2 = a2.querySelector('.stage')
    st2.style.webkitMaskImage = st2.style.maskImage = k > 0.012 ? 'none' : ''
    inn *= 1 - ss(0.86, 0.9, k)
    head2.style.opacity = stack2.style.opacity = now2.style.opacity = inn.toFixed(3)
    head2.style.transform = 'translateY(' + ((1 - inn) * 26).toFixed(1) + 'px)'
    stack2.style.marginTop = ((1 - inn) * 40).toFixed(1) + 'px'
    var raw = ss(0.06, 0.95, k) * (N - 1), fi = Math.floor(raw), p = Math.min(N - 1, fi + ss(0.28, 0.72, raw - fi))   // each document holds, then the next lifts
    cards.forEach(function (c, j) {
      var dd = j - p, t, o
      if (dd < -1.2) { c.style.opacity = '0'; c.style.visibility = 'hidden'; return }
      c.style.visibility = 'visible'
      if (dd < 0) {                               // leaving: lifts, turns and flies up out of the frame
        var q = -dd
        t = 'translate3d(' + (-q * 30) + '%,' + (-q * 150) + '%,' + (q * 160) + 'px) rotateX(' + (q * 38) + 'deg) rotateZ(' + (-q * 10) + 'deg)'
        o = 1 - ss(0.3, 0.62, q)
      } else {                                     // waiting in the pile behind
        var r = Math.min(dd, 5), tilt = dd < 0.5 ? ' rotateY(' + (pmx * 7).toFixed(2) + 'deg) rotateX(' + (-pmy * 5).toFixed(2) + 'deg)' : ''
        t = 'translate3d(' + (r * 14) + 'px,' + (-r * 16) + 'px,' + (-r * 70) + 'px) rotateZ(' + (r * 2.2) + 'deg)' + tilt
        o = dd > 3 ? clamp(4 - dd, 0, 1) : 1
      }
      c.style.transform = t; c.style.opacity = o.toFixed(3); c.style.zIndex = String(100 - j)
      c.style.setProperty('--dim', dd > 0 ? Math.min(dd, 3) * 0.035 : 0)
    })
    var a = clamp(Math.round(p), 0, N - 1)
    if (a !== last) { last = a; idx.forEach(function (li, i) { li.classList.toggle('on', i === a) }); now.textContent = (a < 9 ? '0' : '') + (a + 1) }
  }
  var pmx = 0, pmy = 0
  if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', function (e) { pmx = e.clientX / W - 0.5; pmy = e.clientY / H - 0.5; if (k2 > 0 && k2 < 1) act2(k2) }, { passive: true })
  PPH_onScene(a2, function (k) { k2 = k; act2(k) }); act2(0)
  ;(function () {
    var st = a2.querySelector('.stage'), pic = st.querySelector('.bg'), cv = d.createElement('canvas'), vis = false
    cv.className = 'gl'; cv.setAttribute('aria-hidden', 'true'); pic.parentNode.insertBefore(cv, pic.nextSibling)
    var L = Living(cv); if (!L) { cv.remove(); return }
    var zb = (d.querySelector('meta[name=pph-z]') || {}).content || 'img/', P = L.plate(pic.querySelector('img'), zb + 'z-sky.webp', { mode: 3, vp: [0.5, 0.45] })
    var sz = function () { L.size(st.clientWidth, st.clientHeight, Math.min(window.devicePixelRatio || 1, 1.5)) }; sz(); addEventListener('resize', sz)
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting }, { rootMargin: '30% 0px' }).observe(a2)
    ;(function loop(ms) {
      requestAnimationFrame(loop)
      if (!vis || !L.ready(P)) return
      if (!st.classList.contains('gl-on')) st.classList.add('gl-on')
      L.clear(); L.draw(P, { a: 1, z: 0.1 + k2 * 0.35, S: 1.08, px: -pmx * 0.6, py: -pmy * 0.6, t: (ms || 0) / 1000, wob: 0.0012 })
    })(0)
  })()

  /* Living photographs: a depth map (Depth Anything V2) under each real photo lets the camera move forward through it;
     clouds drift on a flow map and low sand mist blows across the road. ~1 KB of depth per plate, no video. */
  function Living(cv) {
    var gl = null
    try { gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' }) } catch (e) {}
    if (!gl) return null
    var VS = 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'
    var FS = [
      'precision highp float;varying vec2 v;uniform sampler2D C,D;uniform vec4 cov,dm,cam;uniform vec2 org,vp,pan;uniform float z,al,t,mist,mode,wob;uniform vec4 hole;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
      'float dep(vec2 u){return texture2D(D,u*dm.xy+dm.zw).r;}',
      'void main(){',
      ' vec2 q=org+(v-org-cam.yz)/cam.x;',
      ' q+=vec2(sin(t*.21),cos(t*.17))*wob;',
      ' vec2 u=q*cov.xy+cov.zw;',
      ' float d0=dep(u);u+=pan*(.004+.014*d0);',
      ' vec2 s=u;for(int i=0;i<6;i++){float d=dep(s);s=vp+(u-vp)/(1.+z*(.14+1.1*d*d));}',
      ' float d=dep(s);',
      ' vec3 c0=texture2D(C,s).rgb;',
      ' vec2 fu=s*dm.xy+dm.zw;',
      ' float m=mode<1.5?(1.-smoothstep(.02,.1,d))*(1.-smoothstep(vp.y-.07,vp.y-.015,s.y)):(mode<2.5?smoothstep(.45,.8,dot(c0,vec3(.33))):1.);',
      ' m*=1.-smoothstep(-.035,0.,min(min(fu.x-hole.x,hole.z-fu.x),min(fu.y-hole.y,hole.w-fu.y)));',
      ' vec2 fl=(vec2(.022,.004)+.012*vec2(n(s*3.+t*.03)-.5,n(s*3.+7.)-.5))*m;',
      ' float p1=fract(t*.045),p2=fract(t*.045+.5);',
      ' vec3 c=mix(texture2D(C,s-fl*p1).rgb,texture2D(C,s-fl*p2).rgb,abs(p1*2.-1.));',
      ' if(mist>0.){float band=smoothstep(.04,.3,d)*(1.-smoothstep(.55,.98,d));',
      '  vec2 mp=vec2((s.x-vp.x)/(.08+d*.9)*.8-t*.14,(s.y)*7./(.2+d));',
      '  float f=smoothstep(.45,.95,fb(mp+vec2(fb(mp*.5+t*.02),0.)));',
      '  c=mix(c,vec3(.70,.74,.79),f*band*mist);}',
      ' gl_FragColor=vec4(c,al);}'
    ].join('\n')
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s }
    var pr = gl.createProgram()
    try { gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)) } catch (e) { return null }
    gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null
    gl.useProgram(pr)
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    var pl = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0)
    var U = {}; ['C', 'D', 'cov', 'dm', 'cam', 'org', 'vp', 'pan', 'z', 'al', 't', 'mist', 'mode', 'wob', 'hole'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k) })
    gl.uniform1i(U.C, 0); gl.uniform1i(U.D, 1)
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    function tex(src, cb) {
      var t = gl.createTexture(), ok = false
      function up(img) {
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        ok = true; cb && cb(img)
      }
      if (typeof src === 'string') { var im = new Image(); im.decoding = 'async'; im.onload = function () { up(im) }; im.src = src }
      else if (src.complete && src.naturalWidth) up(src); else src.addEventListener('load', function () { up(src) }, { once: true })
      return { t: t, get ok() { return ok } }
    }
    var W = 1, H = 1
    return {
      plate: function (img, depth, opt) {         // img: <img> inside a <picture>; depth: url of the full-frame depth map
        var P = { iw: 16, ih: 9, mobile: false, cx: opt.cx || 0.5, vp: opt.vp || [0.5, 0.45], mode: opt.mode || 1, mist: opt.mist || 0, hole: opt.hole }
        P.c = tex(img, function (im) { P.iw = im.naturalWidth; P.ih = im.naturalHeight; P.mobile = /-m\.(avif|webp|jpg)/.test(im.currentSrc || im.src) })
        P.d = tex(depth)
        return P
      },
      size: function (w, h, dpr) { W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); gl.viewport(0, 0, cv.width, cv.height) },
      clear: function () { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT) },
      ready: function (P) { return P.c.ok && P.d.ok },
      draw: function (P, s) {                      // s: {a, z, S, tx, ty, ox, oy, px, py, t, wob}
        if (!P.c.ok || !P.d.ok || s.a <= 0.002) return
        var A = W / H, B = P.iw / P.ih, cx, cy, ox, oy
        if (A > B) { cx = 1; cy = B / A; ox = 0; oy = (1 - cy) / 2 } else { cx = A / B; cy = 1; ox = (1 - cx) / 2; oy = 0 }
        gl.uniform4f(U.cov, cx, cy, ox, oy)
        if (P.mobile) { var f = 0.3139; gl.uniform4f(U.dm, f, 1, P.cx - f / 2, 0) }
        else gl.uniform4f(U.dm, 1, 1, 0, 0)
        var vx = P.vp[0], vy = P.vp[1]
        if (P.mobile) vx = (P.vp[0] - (P.cx - 0.157)) / 0.3139
        gl.uniform2f(U.vp, vx, vy)
        var ho = P.hole || [2, 2, 2, 2]; gl.uniform4f(U.hole, ho[0], ho[1], ho[2], ho[3])
        gl.uniform4f(U.cam, s.S || 1, s.tx || 0, s.ty || 0, 0)
        gl.uniform2f(U.org, s.ox == null ? 0.5 : s.ox, s.oy == null ? 0.5 : s.oy)
        gl.uniform2f(U.pan, s.px || 0, s.py || 0)
        gl.uniform1f(U.z, s.z || 0); gl.uniform1f(U.al, s.a); gl.uniform1f(U.t, s.t || 0)
        gl.uniform1f(U.mist, P.mist * (s.mist == null ? 1 : s.mist)); gl.uniform1f(U.mode, P.mode); gl.uniform1f(U.wob, s.wob || 0)
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.c.t)
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, P.d.t)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
    }
  }

  /* III. the black-sand road (variant 12): down through the clouds onto the road, ten clients as milestones, the monogram ahead */
  var a3 = d.querySelector('.act3'), st3 = a3.querySelector('.stage'), cv3 = a3.querySelector('.gl3'),
      skyL = a3.querySelector('.bg--sky'), skyI = skyL.querySelector('img'), mist = a3.querySelector('.a3__mist'),
      hero = a3.querySelector('.a3__hero'), ixL = a3.querySelector('.a3__ix'), ixs = [].slice.call(ixL.querySelectorAll('li')),
      MK = [].slice.call(a3.querySelectorAll('.mk')), mc = a3.querySelector('.a3__mc'), kmBox = a3.querySelector('.a3__km'), km = kmBox.querySelector('b'),
      end3 = a3.querySelector('.a3__end'), veil = a3.querySelector('.a4__veil'), clientNames = ixs.map(function (li) { return li.firstChild.textContent })
  var road = null, kv = 0, sNow = 0, vis3 = false, mx = 0, my = 0, tx = 0, ty = 0, cur3 = -2, glOK = true
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches
  try { var tc = d.createElement('canvas'); glOK = !!(tc.getContext('webgl2') || tc.getContext('webgl')) } catch (e) { glOK = false }
  if (!glOK) root.classList.add('no-gl')
  if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', function (e) { tx = e.clientX / W - 0.5; ty = e.clientY / H - 0.5 }, { passive: true })
  function boot() {
    if (road || !glOK) return
    road = 'loading'
    import(new URL('sand.js', SRC).href).then(function (m) {
      road = m.createSand(cv3, { mobile: W < 760, markPath: JSON.parse(a3.querySelector('.road-data').textContent).mark })
      road.size(cv3.clientWidth, cv3.clientHeight)
      var lw = st3.clientWidth; addEventListener('resize', function () { if (Math.abs(st3.clientWidth - lw) < 2 && W < 1000) return; lw = st3.clientWidth; road.size(cv3.clientWidth, cv3.clientHeight) })
    }).catch(function () { glOK = false; road = null; root.classList.add('no-gl') })
  }
  if (d.readyState === 'complete') setTimeout(boot, 600); else addEventListener('load', function () { setTimeout(boot, 600) })
  new IntersectionObserver(function (es) { vis3 = es[0].isIntersecting; if (vis3) boot() }, { rootMargin: '120% 0px' }).observe(a3)

  var sOf = function (k) { return clamp((k - 0.045) / 0.915, 0, 1) }
  function ui3(k) {
    st3.style.opacity = a3.getBoundingClientRect().top <= 1 ? '1' : '0'
    skyL.style.opacity = String(1 - ss(0.02, 0.05, k))
    skyI.style.transform = 'scale(' + (1.12 + ss(0, 0.05, k) * 0.7).toFixed(4) + ')'
    mist.style.opacity = String(0.92 * ss(0.012, 0.032, k) * (1 - ss(0.04, 0.07, k)))
    var s = sOf(k)
    hero.style.opacity = String(ss(0.055, 0.075, k) * (1 - ss(0.05, 0.085, Math.max(s, sNow))))
    hero.style.transform = 'translateY(' + ((1 - ss(0.055, 0.085, k)) * 24).toFixed(1) + 'px)'
    ixL.style.opacity = String(ss(0.06, 0.1, s) * (1 - ss(0.9, 0.94, s)))
    kmBox.style.opacity = String(ss(0.05, 0.07, k) * (1 - ss(0.97, 0.99, k)))
    veil.style.opacity = String(0.55 * ss(0.975, 1, k))
    var dark = k > 0.03
    a3.setAttribute('data-theme', dark ? 'dark' : 'light'); headerTheme()
    cross('a3d', k, 0.015, 'descent', 0.9); cross('a3w', k, 0.05, 'land', 0.8); cross('a3c', k, 0.065, 'brass', 0.55); cross('a3b', k, 0.9, 'fanfare', 0.8)
  }
  function placeMarks(z, s) {
    var cur = -1
    MK.forEach(function (el, i) {
      var dz = z - road.MZ[i], op = ss(44, 32, dz) * (1 - ss(7, 2, dz)) * (dz > 0 ? 1 : 0) * ss(0.02, 0.05, s)
      if (op > 0.5) cur = i
      if (op < 0.01) { if (el.style.opacity !== '0') el.style.opacity = '0'; return }
      var p = road.project(i), sw = st3.clientWidth
      op *= ss(250, 340, p[0]) * ss(100, 150, p[1]) * (1 - ss(sw - 330, sw - 260, p[0]) * (W > 760 ? 1 : 0))   // never cut by the screen edge or the index
      if (op < 0.01) { el.style.opacity = '0'; return }
      el.style.opacity = op.toFixed(3); el.style.transform = 'translate3d(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px,0)'
    })
    if (cur !== cur3) {
      cur3 = cur
      ixs.forEach(function (li, i) { li.classList.toggle('on', i === cur) })
      mc.classList.toggle('on', cur >= 0 && s < 0.9)
      if (cur >= 0) { mc.querySelector('small').textContent = MK[cur].querySelector('small').textContent; mc.querySelector('img').src = MK[cur].querySelector('img').src; mc.querySelector('b').textContent = clientNames[cur] }
    }
  }
  ;(function loop(t) {
    requestAnimationFrame(loop)
    if (!vis3) return
    var r3 = st3.getBoundingClientRect(); if (r3.bottom <= 0 || r3.top >= H || st3.style.opacity === '0') return
    var target = sOf(k3)
    sNow += (target - sNow) * 0.06; if (Math.abs(target - sNow) < 1e-4) sNow = target
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04
    if (road && road.render) {
      var z = road.render(sNow, ss(0, 0.05, sNow), t || 0, mx, my, RM)
      km.textContent = ((road.Z0 - z) / 10).toFixed(1).replace('.', ',')
      placeMarks(z, sNow)
      var e = ss(0.935, 0.965, sNow) * (1 - ss(0.975, 0.99, k3))
      end3.style.opacity = e.toFixed(3); end3.classList.toggle('live', e > 0.5)
    } else km.textContent = (sNow * 35.5).toFixed(1).replace('.', ',')
  })(0)
  PPH_onScene(a3, function (k) { k3 = k; ui3(k) }); ui3(0)

  /* ambience: Tashkent street under Nest One, wind and birds in the sky, open desert on the road */
  var k1 = 0
  setInterval(function () {
    var r1 = d.querySelector('.act1').getBoundingClientRect(), on1 = r1.bottom > H * 0.4
    var city = on1 ? 0.75 * ss(0.12, 0.45, k1) * (1 - ss(0.9, 1, k1)) : 0
    var sky = (k2 > 0.005 && k2 < 0.995 ? 0.7 : 0) + (k1 > 0.86 && on1 ? 0.5 * ss(0.86, 1, k1) : 0)
    if (k3 > 0 && k3 < 0.06) sky = Math.max(sky, 0.75 * (1 - ss(0.035, 0.06, k3)))
    var road = k3 > 0.03 && k3 < 0.99 ? 0.65 * ss(0.03, 0.07, k3) * (1 - ss(0.96, 0.99, k3)) : 0
    SFX.amb({ 'amb-city': city, 'amb-sky': Math.min(sky, 0.75), 'amb-road': road })
  }, 200)
})()
