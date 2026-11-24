/* Variant 3 — hero parallax (word behind the towers), header state, sector tabs, stacking cards. */
(function () {
  var d = document, root = d.documentElement
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  var PH = innerWidth < 761; if (PH) root.classList.add('ph')   // phones: no stacking deck, no long pinned hero
  var hero = d.querySelector('.hero'), stage = d.querySelector('.hero__stage'), hd = d.querySelector('.hd')

  // reveal the word once the hero photo is decoded (or after 1.6 s on a slow link)
  var go = function () { root.classList.add('loaded') }

  var probe = new Image()
  probe.onload = probe.onerror = function () { requestAnimationFrame(go) }
  var m = matchMedia('(max-aspect-ratio: 4/5)').matches
  probe.src = 'img/p-hero' + (m ? '-m' : '') + (supportsAvif() ? '.avif' : '.webp')
  setTimeout(go, 1600)
  function supportsAvif() { try { return d.createElement('canvas').toDataURL('image/avif').indexOf('avif') > 0 } catch (e) { return false } }

  // tabs: filter the deck by sector
  var cards = [].slice.call(d.querySelectorAll('.sc'))
  d.querySelectorAll('.tab').forEach(function (t, _, all) {
    t.addEventListener('click', function () {
      all.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)) })
      var f = t.getAttribute('data-f')
      cards.forEach(function (c) { c.hidden = f !== 'all' && c.getAttribute('data-sec').indexOf(f) < 0 })
      var top = d.getElementById('services').querySelector('.deck').getBoundingClientRect().top + scrollY - 150
      if (scrollY > top) scrollTo({ top: top, behavior: 'smooth' })
      frame()
    })
  })

  // "discuss" buttons preselect the topic in the form
  d.querySelectorAll('[data-topic]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = d.querySelector('.ct__form select[name=topic]'), v = a.getAttribute('data-topic')
      if (sel) [].forEach.call(sel.options, function (o, i) { if (o.value === v || o.text === v) sel.selectedIndex = i })
    })
  })

  var ticking = false
  function frame() {
    ticking = false
    var vh = innerHeight
    // hero
    var hp = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight - vh)))
    if (!reduce) stage.style.setProperty('--p', hp.toFixed(4))
    hd.classList.toggle('hd--solid', scrollY > hero.offsetHeight - vh * 0.5 - 80)
    // stacking: a card recedes as the next one slides over it
    if (reduce) return
    var vis = cards.filter(function (c) { return !c.hidden })
    for (var i = 0; i < vis.length; i++) {
      var c = vis[i], n = vis[i + 1], s = 0
      if (n) {
        var ct = c.getBoundingClientRect(), nt = n.getBoundingClientRect().top
        s = Math.min(1, Math.max(0, 1 - (nt - ct.top) / ct.height))
      }
      var v = s.toFixed(3)
      if (c._s !== v) { c._s = v; c.firstElementChild.style.setProperty('--s', v) }
    }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame) } }, { passive: true })
  addEventListener('resize', frame)
  frame()

  // smooth wheel on desktop only
  addEventListener('load', function () {
    if (!window.Lenis || reduce || !matchMedia('(pointer: fine)').matches) return
    var lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
    ;(function raf(t) { lenis.raf(t); requestAnimationFrame(raf) })(0)
    lenis.on('scroll', frame)
    d.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href')
        if (id.length > 1 && d.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: id === '#contact' ? 0 : -40, duration: 1.4 }) }
      })
    })
  })
})()
