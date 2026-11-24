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

  // phones: cards rise into view one by one
  if (PH && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }) }, { rootMargin: '0px 0px -8% 0px' })
    cards.forEach(function (c) { io.observe(c) })
  } else cards.forEach(function (c) { c.classList.add('in') })

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
    if (reduce || PH) return
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

/* motion set — runs after the language pass in pph.js, so translated text gets split too */
;(function () {
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  // 1) headings: wrap every word so it can rise out of a blur
  function words(el) {
    var i = 0
    ;(function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = d.createDocumentFragment()
          c.nodeValue.split(/(\s+)/).forEach(function (p) {
            if (!p) return
            if (/^\s+$/.test(p)) { f.appendChild(d.createTextNode(p)); return }
            var s = d.createElement('span'); s.className = 'wd'; s.style.setProperty('--w', i++); s.textContent = p; f.appendChild(s)
          })
          c.parentNode.replaceChild(f, c)
        } else if (c.nodeType === 1) walk(c)
      })
    })(el)
  }
  d.querySelectorAll('.hero__title em, .head__t').forEach(words)

  // 2) hero facts count up once the hero has loaded
  var counted = false
  function count() {
    if (counted) return; counted = true
    d.querySelectorAll('.hero__facts dt').forEach(function (dt) {
      var to = parseInt(dt.textContent, 10); if (!to || reduce) return
      var t0 = 0
      dt.textContent = '0'
      requestAnimationFrame(function f(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1500); dt.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f) })
    })
  }
  setTimeout(count, 1300)

  // 3) seal: stamp a card's document once its footer is well in view
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.closest('.sc').classList.add('stamped'); so.unobserve(e.target) } })
    }, { threshold: 0.9 })
    d.querySelectorAll('.sc__doc').forEach(function (el) { so.observe(el) })
  } else d.querySelectorAll('.sc').forEach(function (c) { c.classList.add('stamped') })

  // 4) steps line follows the scroll through the process section
  var steps = d.querySelector('.steps'), items = steps ? [].slice.call(steps.children) : []
  function line() {
    if (!steps) return
    var r = steps.getBoundingClientRect(), vh = innerHeight
    var p = Math.min(1, Math.max(0, (vh * 0.78 - r.top) / (r.height * 0.92)))
    steps.style.setProperty('--p', p.toFixed(3))
    items.forEach(function (s, i) { s.classList.toggle('on', reduce || p >= i / (items.length - 1) - 0.02) })
  }
  var tk = false
  addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; line() }) } }, { passive: true })
  addEventListener('resize', line); line()

  // 5) clients ribbon: a second copy of the logos makes the loop seamless
  var tr = d.querySelector('.cl__track')
  if (tr) { var cp = tr.firstElementChild.cloneNode(true); cp.setAttribute('aria-hidden', 'true'); cp.querySelectorAll('img').forEach(function (i) { i.alt = '' }); tr.appendChild(cp) }

  // 6) magnetic buttons, mouse only
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    d.querySelectorAll('.mag').forEach(function (m) {
      var zone = m.parentNode
      zone.addEventListener('mousemove', function (e) {
        var r = m.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2)
        if (Math.hypot(x, y) < 160) { m.style.transform = 'translate(' + x * .25 + 'px,' + y * .35 + 'px)'; m.firstChild.style.transform = 'translate(' + x * .1 + 'px,' + y * .14 + 'px)' }
        else { m.style.transform = ''; m.firstChild.style.transform = '' }
      })
      zone.addEventListener('mouseleave', function () { m.style.transform = ''; m.firstChild.style.transform = '' })
    })
  }
})()
