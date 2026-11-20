/* Variant 3D — glue between the page and the 3D folder (folder.js, three.js bundle loaded on demand). */
(function () {
  var d = document, root = d.documentElement
  var rail = d.querySelector('.rail'), stage = d.querySelector('.rail__stage'), cv = d.querySelector('.rail__gl')
  var caps = [].slice.call(d.querySelectorAll('.cap__i')), nEl = d.querySelector('[data-n]'), docEl = d.querySelector('[data-doc]:not(.cap__i)')
  var src = [].slice.call(d.querySelectorAll('.sheets-src li')), lbl = src.pop(), N = src.length
  var pages = src.map(function (li) {
    return { doc: li.querySelector('b').textContent, svc: li.querySelector('i').textContent,
      rows: [].map.call(li.querySelectorAll('span'), function (s) { var e = s.querySelector('em').textContent; return [e, s.textContent.replace(e, '')] }) }
  })
  var T = N + 3, H = innerHeight, F = null, idx = -1, t = 0
  var PH = false
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x }
  function ss(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x) }
  function size() { H = innerHeight; if (PH) { if (F) place(); return } rail.style.setProperty('--rail-h', (H * (T * 0.9 + 1)) + 'px'); if (F) place() }
  function place() { var m = innerWidth < 760, o = ss(1, 2, t); F.resize(innerWidth, PH ? Math.round(H * 0.62) : innerHeight, m ? 0 : 0.2 + (-0.23 - 0.2) * o, m ? (PH ? 0 : -0.17) : 0.02) }
  function read() {
    if (PH) { t = 0.35; return }
    var r = rail.getBoundingClientRect(), span = rail.offsetHeight - H, p = clamp(-r.top / span, 0, 1)
    t = p * T
    stage.style.setProperty('--io', (1 - ss(0.5, 1.1, t)).toFixed(3))
    stage.style.setProperty('--ix', '0px')
    stage.style.setProperty('--co', (ss(1.6, 2.1, t) * (1 - ss(N + 2, N + 2.4, t))).toFixed(3))
    stage.style.setProperty('--fo', ss(N + 2.3, N + 2.8, t).toFixed(3))
    stage.classList.toggle('fo-on', t > N + 2.4)
    stage.style.setProperty('--pr', clamp((t - 2) / N, 0, 1).toFixed(4))
    var k = clamp(Math.floor(t - 2 + 0.25), 0, N - 1)
    if (k !== idx) { idx = k; caps.forEach(function (c, j) { c.classList.toggle('on', j === k) }); if (nEl) nEl.textContent = ('0' + (k + 1)).slice(-2); if (docEl) docEl.textContent = pages[k].doc }
  }
  var running = false, placed2 = false
  function loop() { if (!running) return; read(); if (F && !(PH && cv.getBoundingClientRect().bottom < 0)) { if (t < 2.2 || !placed2) { place(); placed2 = t >= 2.2 } F.tick(); F.update(t); F.render() } requestAnimationFrame(loop) }
  new IntersectionObserver(function (es) { var on = es[0].isIntersecting; if (on && !running) { running = true; requestAnimationFrame(loop) } running = on }).observe(rail)
  addEventListener('resize', size)
  addEventListener('pointermove', function (e) { if (F) F.pointer(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5) }, { passive: true })
  size(); read()
  var mark = new Image(); mark.src = 'img/pph-mark.svg'
  var ready = Promise.all([d.fonts ? d.fonts.load('300 56px IT') : 0, d.fonts ? d.fonts.load('400 20px IT') : 0, new Promise(function (r) { mark.onload = mark.onerror = r; setTimeout(r, 2000) })])
  ready.then(function () { return import('./folder.js') }).then(function (mod) {
    try {
      F = mod.createFolder(cv, { pages: pages, labels: { doc: lbl.querySelector('b').textContent, sign: lbl.querySelector('i').textContent }, mark: mark, mobile: innerWidth < 760 })
      place(); F.update(t); F.render(); cv.classList.add('ready')
    } catch (e) { root.classList.add('no-gl') }
  }).catch(function () { root.classList.add('no-gl') })
})()
