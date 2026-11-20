/* PPH "Objects" — one fixed WebGL canvas shows the rendered objects.
   Each render has a depth map: the cursor (or the phone's slow drift) moves the camera with real parallax,
   fog drifts through the scene, and objects change with a noise dissolve as you scroll. Raw WebGL, no library. */
(function () {
  var d = document, root = d.documentElement
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  var cv = d.querySelector('.gl'), show = d.querySelector('.show'), hero = d.querySelector('.hero'), ct = d.querySelector('.ct')
  var sts = [].slice.call(d.querySelectorAll('.st')), cards = [].slice.call(d.querySelectorAll('.card__i')), idxs = [].slice.call(d.querySelectorAll('.idx li'))
  var nEl = d.querySelector('[data-n]'), preN = d.querySelector('[data-pre]'), pre = d.querySelector('.pre')
  var names = ['hero', 's01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10']
  var mob = matchMedia('(max-aspect-ratio: 4/5)').matches
  var PH = false
  var avif = (function () { try { return d.createElement('canvas').toDataURL('image/avif').indexOf('avif') > 0 } catch (e) { return false } })()
  function url(n, depth) { return 'img/x/' + n + (mob ? '-m' : '') + (depth ? '-d.webp' : (avif ? '.avif' : '.webp')) }

  // ---------- preloader: waits for the first render only ----------
  var shown = false
  function ready() { if (shown) return; shown = true; root.classList.add('ready') }
  setTimeout(ready, 4000)
  var pp = 0, pt = setInterval(function () { pp = Math.min(pp + 3 + Math.random() * 6, 92); setP(pp) }, 90)
  function setP(v) { if (pre) pre.style.setProperty('--p', v / 100); if (preN) preN.textContent = Math.round(v) }

  var gl = cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false })
  if (!gl) { clearInterval(pt); setP(100); setTimeout(ready, 300); return }

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}'
  var FS = [
    'precision highp float;varying vec2 v;',
    'uniform sampler2D A,DA,B,DB;uniform float M,T,K,DK;uniform vec2 R,I,P;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}',
    'vec2 cov(vec2 u){float r=R.x/R.y,ir=I.x/I.y;vec2 s=r>ir?vec2(1.,ir/r):vec2(r/ir,1.);return (u-.5)*s+.5;}',
    'vec3 smp(sampler2D t,sampler2D dm,vec2 u,float z){vec2 c=cov(u);c=(c-.5)/z+.5;float dp=texture2D(dm,c).r;vec2 o=P*(dp-.42)*.028;',
    'vec2 c2=c-o;dp=texture2D(dm,c2).r;c2=c-P*(dp-.42)*.028;return texture2D(t,c2).rgb;}',
    'void main(){float z=1.04+.012*sin(T*.21);',
    'vec3 a=smp(A,DA,v,z);vec3 b=smp(B,DB,v,z);',
    'float q=fb(v*vec2(3.,2.)+T*.03);float m=smoothstep(q-.18,q+.18,M*1.36-.18);',
    'vec3 c=mix(a,b,m);float e=1.-abs(m-.5)*2.;c+=vec3(.55,.6,.66)*e*e*.22*step(.001,M)*step(M,.999);',
    // drifting fog, a little stronger near the floor
    'float f=fb(vec2(v.x*2.2+T*.018,v.y*3.4-T*.006));c+=vec3(.42,.47,.53)*f*f*(.05+.07*(1.-v.y));',
    // light breathing in the beam (top-left)
    'c*=1.+.035*sin(T*.7+v.x*2.)*(1.-v.y)*(1.-v.x);',
    'c*=DK;vec2 w=v-.5;c*=1.-dot(w,w)*.55;c+=(h(v*R+T)-.5)*.022;',
    'gl_FragColor=vec4(c,1.);}'].join('\n')
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o }
  var pr = gl.createProgram()
  try { gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw 0 }
  catch (e) { clearInterval(pt); setP(100); setTimeout(ready, 300); return }
  gl.useProgram(pr)
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  var al = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0)
  var U = {}; ['A', 'DA', 'B', 'DB', 'M', 'T', 'K', 'DK', 'R', 'I', 'P'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k) })
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.uniform1i(U.A, 0); gl.uniform1i(U.DA, 1); gl.uniform1i(U.B, 2); gl.uniform1i(U.DB, 3)

  // ---------- textures, loaded lazily ----------
  var tex = {}, black = mk(null)
  function mk(img) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    if (img) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([10, 12, 15]))
    return t
  }
  var imgW = 1920, imgH = 1072
  function load(k) {
    var n = names[k]; if (tex[n]) return tex[n].p
    var o = tex[n] = { c: null, d: null }
    function im(src) { return new Promise(function (res) { var i = new Image(); i.decoding = 'async'; i.onload = function () { res(i) }; i.onerror = function () { res(null) }; i.src = src }) }
    o.p = Promise.all([im(url(n)), im(url(n, true))]).then(function (r) {
      if (r[0]) { o.c = mk(r[0]); imgW = r[0].naturalWidth; imgH = r[0].naturalHeight }
      if (r[1]) o.d = mk(r[1])
      return o
    })
    return o.p
  }
  function get(k) { var o = tex[names[k]]; return o && o.c ? o : null }

  // ---------- layout ----------
  var W, H, dpr
  function size() {
    dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 1.75)
    W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    gl.viewport(0, 0, cv.width, cv.height)
    placePins()
  }
  // the callouts sit on points of the hero render; map image coords to screen with the same cover maths
  var pins = [].slice.call(d.querySelectorAll('.pin'))
  function placePins() {
    var r = W / H, ir = imgW / imgH, sx = 1, sy = 1
    if (r > ir) sy = ir / r; else sx = r / ir
    pins.forEach(function (p) {
      var a = p.getAttribute('data-at').split(',').map(Number)
      var u = (a[0] - 0.5) / sx * 1.04 + 0.5, vv = (a[1] - 0.5) / sy * 1.04 + 0.5
      p.style.setProperty('--x', (u * 100).toFixed(2) + '%'); p.style.setProperty('--y', (vv * 100).toFixed(2) + '%')
    })
  }

  // ---------- scroll timeline ----------
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x }
  function ss(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x) }
  var cur = -1, mx = 0, my = 0, tx = 0, ty = 0
  function scene() {
    // returns [indexA, indexB, mix, darkness]
    if (PH) { var hb = hero.getBoundingClientRect(); return [0, 0, 0, 1 - 0.7 * ss(0, H * 0.9, -hb.top)] }
    var hr = hero.getBoundingClientRect(), sr = show.getBoundingClientRect(), cr = ct.getBoundingClientRect()
    var span = show.offsetHeight - H, p = clamp(-sr.top / span, 0, 1) * 10 // 0..10 inside the collection
    var k
    if (sr.top > 0) { // between hero and the first object
      var f = clamp(1 - sr.top / H, 0, 1)
      return [0, 1, ss(0.15, 0.95, f), 1]
    }
    if (sr.bottom > H * 0.4) {
      k = Math.min(Math.floor(p), 9); var fr = p - k
      setCur(k, p / 10)
      if (k >= 9) return [10, 10, 0, 1]
      return [k + 1, k + 2, ss(0.72, 1, fr), 1]
    }
    // after the collection: dark, then the monolith returns behind the contact form
    var back = clamp(1 - cr.top / H, 0, 1)
    return [10, 0, ss(0.2, 0.9, back), 0.55 + 0.25 * ss(0.4, 1, back)]
  }
  function setCur(k, pr) {
    show.style.setProperty('--pr', pr.toFixed(4))
    if (k === cur) return; cur = k
    sts.forEach(function (s, i) { s.classList.toggle('on', i === k) })
    cards.forEach(function (c, i) { c.classList.toggle('on', i === k) })
    idxs.forEach(function (c, i) { c.classList.toggle('on', i === k) })
    if (nEl) nEl.textContent = ('0' + (k + 1)).slice(-2)
    for (var j = k; j < Math.min(k + 3, 10); j++) load(j + 1)
  }
  idxs.forEach(function (li, i) {
    li.querySelector('button').addEventListener('click', function () {
      var top = show.getBoundingClientRect().top + scrollY + (show.offsetHeight - H) * (i + 0.5) / 10
      scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' })
    })
  })
  addEventListener('pointermove', function (e) { tx = (e.clientX / W - 0.5) * 2; ty = (e.clientY / H - 0.5) * 2 }, { passive: true })

  var t0 = performance.now(), last = -1
  function frame(now) {
    requestAnimationFrame(frame)
    if (d.hidden) return
    var t = (now - t0) / 1000
    var s = scene()
    var a = get(s[0]) || get(0), b = get(s[1]) || a
    if (!a) return
    // drift on touch screens, cursor elsewhere
    var px = mob ? Math.sin(t * 0.35) * 0.6 : tx, py = mob ? Math.cos(t * 0.27) * 0.3 : ty
    mx += (px - mx) * 0.05; my += (py - my) * 0.05
    if (reduce) { mx = my = 0; t = 0 }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.c)
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, a.d || black)
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, b.c)
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, b.d || black)
    gl.uniform1f(U.M, b === a ? 0 : s[2]); gl.uniform1f(U.T, t); gl.uniform1f(U.DK, s[3])
    gl.uniform2f(U.R, W, H); gl.uniform2f(U.I, imgW, imgH); gl.uniform2f(U.P, mx, -my)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  addEventListener('resize', size)
  size()
  load(0).then(function () {
    clearInterval(pt); setP(100); placePins()
    cv.classList.add('on'); setTimeout(ready, 350)
    requestAnimationFrame(frame)
    load(1); load(2)
  })
})()
