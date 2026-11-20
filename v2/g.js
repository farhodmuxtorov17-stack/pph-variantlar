/* PPH variant 2 — «Прозрачность». A glass monogram lives in a fixed light field; the page is glass over it. */
(function () {
  var d = document, root = d.documentElement, SRC = (d.currentScript && d.currentScript.src) || location.href
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer: fine)').matches
  var W = innerWidth, H = innerHeight
  addEventListener('resize', function () { W = innerWidth; H = innerHeight })
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)) }
  var ss = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

  // headline rises once fonts are in
  var go = function () { root.classList.add('ready') }
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { setTimeout(go, 80) }); else setTimeout(go, 300)
  setTimeout(go, 1500)

  // smooth scroll on desktop
  var lenis = null
  if (window.Lenis && fine && !RM) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 })
    ;(function raf(t) { lenis.raf(t); requestAnimationFrame(raf) })(0)
  }
  d.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'), el = id.length > 1 && d.querySelector(id); if (!el) return
      e.preventDefault(); if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.4 }); else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' })
    })
  })

  // nav: the section you are in
  var links = [].slice.call(d.querySelectorAll('.nav__links a')), secs = links.map(function (a) { return d.querySelector(a.getAttribute('href')) })
  function navOn() {
    var cur = -1; secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < H * 0.45) cur = i })
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur) })
  }
  addEventListener('scroll', navOn, { passive: true }); navOn()

  /* phones: the glass mark belongs to the first screen; below it the field dims so text reads cleanly */
  if (W < 761) {
    root.classList.add('ph')
    var veil = function () { root.style.setProperty('--veil', (0.5 * ss(H * 0.3, H * 1.05, scrollY)).toFixed(3)) }
    addEventListener('scroll', veil, { passive: true }); veil()
  }

  /* services: ten tabs, each opens its document; plays on its own until the visitor takes over */
  var tabs = [].slice.call(d.querySelectorAll('.svc__tab')), panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')) })
  var cur = 0, auto = !RM, t0 = performance.now(), DUR = 6500, svcVis = false
  function pick(i, focus) {
    i = (i + tabs.length) % tabs.length; if (i === cur && !focus) return
    tabs[cur].setAttribute('aria-selected', 'false'); tabs[cur].tabIndex = -1; tabs[cur].style.removeProperty('--p'); panels[cur].hidden = true
    cur = i; tabs[i].setAttribute('aria-selected', 'true'); tabs[i].tabIndex = 0; panels[i].hidden = false
    if (focus) tabs[i].focus()
    if (W < 900) tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: RM ? 'auto' : 'smooth' })
    t0 = performance.now()
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { auto = false; pick(i) })
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = k === 'ArrowDown' || k === 'ArrowRight' ? 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 0
      if (n) { e.preventDefault(); auto = false; pick(cur + n, true) }
      if (k === 'Home') { e.preventDefault(); auto = false; pick(0, true) } if (k === 'End') { e.preventDefault(); auto = false; pick(tabs.length - 1, true) }
    })
  })
  var ui = d.querySelector('.svc__ui')
  ui.addEventListener('pointerenter', function () { if (fine) auto = false })
  new IntersectionObserver(function (es) { svcVis = es[0].isIntersecting; t0 = performance.now() }, { threshold: 0.35 }).observe(ui)
  ;(function tick(now) {
    requestAnimationFrame(tick)
    if (!auto || !svcVis) return
    var p = (now - t0) / DUR
    tabs[cur].style.setProperty('--p', Math.min(1, p).toFixed(3))
    if (p >= 1) pick(cur + 1)
  })(0)

  /* sectors: a two-way glass switch */
  var seg = d.querySelector('.seg'), sb = [].slice.call(seg.querySelectorAll('button'))
  function sector(i, focus) {
    sb.forEach(function (b, j) { var on = j === i; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; d.getElementById(b.getAttribute('aria-controls')).hidden = !on })
    seg.classList.toggle('g', i === 1); if (focus) sb[i].focus()
  }
  sb.forEach(function (b, i) {
    b.addEventListener('click', function () { sector(i) })
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); sector(i ? 0 : 1, true) } })
  })

  /* the glass monogram: where it stands for each section */
  var POSE = {
    hero: { x: 0.52, y: 0.02, s: 0.82, rot: 0 },
    svc: { x: -0.72, y: -0.38, s: 0.6, rot: 0.9 },
    sec: { x: 0.68, y: -0.3, s: 0.75, rot: -0.7 },
    cl: { x: 0.05, y: 0.08, s: 1.3, rot: 1.57 },
    ct: { x: -0.62, y: -0.55, s: 0.7, rot: 3.14 }
  }
  var POSE_M = {
    hero: { x: 0, y: 0.5, s: 1, rot: 0 },
    svc: { x: 0.42, y: 0.86, s: 0.5, rot: 0.9 },
    sec: { x: -0.42, y: 0.86, s: 0.5, rot: -0.7 },
    cl: { x: 0.42, y: 0.86, s: 0.5, rot: 1.57 },
    ct: { x: -0.4, y: 0.86, s: 0.5, rot: 3.14 }
  }
  var posed = [].slice.call(d.querySelectorAll('[data-pose]'))
  function pose() {
    var P = W / H < 0.8 ? POSE_M : POSE, mid = H * 0.5, a = 0, f = 0
    for (var i = 0; i < posed.length; i++) {
      var r = posed[i].getBoundingClientRect()
      if (r.top <= mid) { a = i; f = clamp((mid - r.top) / Math.max(1, r.height), 0, 1) }
    }
    var p0 = P[posed[a].getAttribute('data-pose')], p1 = P[posed[Math.min(a + 1, posed.length - 1)].getAttribute('data-pose')], e = ss(0.45, 1, f)
    return { x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e, s: p0.s + (p1.s - p0.s) * e, rot: p0.rot + (p1.rot - p0.rot) * e }
  }

  var cv = d.querySelector('.field__gl'), G = null, mx = 0, my = 0, tx = 0, ty = 0, last = 0, mobile = W < 760
  if (fine) addEventListener('pointermove', function (e) { tx = e.clientX / W - 0.5; ty = e.clientY / H - 0.5 }, { passive: true })
  else addEventListener('deviceorientation', function (e) { if (e.gamma != null) { tx = clamp(e.gamma / 60, -0.5, 0.5); ty = clamp((e.beta - 45) / 80, -0.5, 0.5) } }, { passive: true })
  function boot() {
    if (G) return
    var ok = false
    try { var tc = d.createElement('canvas'); ok = !!(tc.getContext('webgl2') || tc.getContext('webgl')) } catch (e) {}
    if (!ok || (navigator.deviceMemory && navigator.deviceMemory < 3) || (navigator.connection && navigator.connection.saveData)) return
    G = 'loading'
    import(new URL('glass.js', SRC).href).then(function (m) {
      var mark = JSON.parse(d.querySelector('.mark-data').textContent).mark
      G = m.createGlass(cv, { mobile: mobile, markPath: mark })
      var sz = function () { G.size(innerWidth, innerHeight) }; sz(); addEventListener('resize', sz)
      var first = true
      ;(function frame(t) {
        requestAnimationFrame(frame)
        if (d.hidden) return
        if (mobile && t - last < 31) return            // 30 fps on phones: the glass panels above re-blur every frame
        last = t
        mx += (tx - mx) * 0.05; my += (ty - my) * 0.05
        var sp = clamp(scrollY / Math.max(1, root.scrollHeight - H), 0, 1)
        G.render(RM ? 0 : t, pose(), mx, my, sp)
        if (first) { first = false; requestAnimationFrame(function () { root.classList.add('gl-on') }) }
      })(0)
    }).catch(function () { G = null })
  }
  var start = function () { setTimeout(boot, mobile ? 900 : 300) }
  if (d.readyState === 'complete') start(); else addEventListener('load', start)
})()
