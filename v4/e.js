/* Variant 3A — Bento: run each tile's animation only while it is on screen; the document pile. */
(function () {
  var d = document
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('on', e.isIntersecting) })
  }, { rootMargin: '-8% 0px' })
  d.querySelectorAll('[data-anim]').forEach(function (el) { io.observe(el) })

  // the pile of documents: the top sheet is stamped, then leaves; the next document comes up
  var sheets = [].slice.call(d.querySelectorAll('.sheet'))
  var names = [].map.call(d.querySelectorAll('[data-docs] li'), function (li) { return li.textContent })
  var next = sheets.length
  function cycle() {
    var top = sheets[0]
    top.classList.add('stamped')
    setTimeout(function () {
      top.classList.add('out')
      setTimeout(function () {
        sheets.push(sheets.shift())
        top.classList.remove('out', 'stamped')
        top.querySelector('.sheet__t').textContent = names[next++ % names.length]
        sheets.forEach(function (s, k) { s.style.setProperty('--k', k) })
      }, 650)
    }, 1100)
  }
  if (!reduce && sheets.length) setInterval(function () { if (!d.hidden) cycle() }, 3200)

  // the counter counts up once
  var n = d.querySelector('[data-count]')
  if (n && !reduce) {
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return
      o.disconnect()
      var t0 = performance.now(), end = +n.getAttribute('data-count')
      ;(function f(t) { var k = Math.min(1, (t - t0) / 1400); n.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f) })(t0)
    })
    o.observe(n)
  }
})()
