/* PPH shared: language, reveal, scroll variables, form. No dependencies, ~3 KB. */
(function () {
  var d = document, root = d.documentElement
  root.classList.add('js')
  try { history.scrollRestoration = 'manual' } catch (e) {}
  if (!location.hash) {
    var touched = false, mark = function () { touched = true }
    ;['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (e) { addEventListener(e, mark, { passive: true, once: true }) })
    scrollTo(0, 0)
    var top0 = function () { if (!touched && scrollY) scrollTo(0, 0) }
    ;[60, 300, 900, 1800].forEach(function (t) { setTimeout(top0, t) })
    addEventListener('load', top0)
  }

  /* ---------- language ---------- */
  function getLang() {
    var q = new URLSearchParams(location.search).get('lang')
    if (q === 'uz' || q === 'ru') { try { localStorage.setItem('pph-lang', q) } catch (e) {} return q }
    try { var s = localStorage.getItem('pph-lang'); if (s === 'uz' || s === 'ru') return s } catch (e) {}
    return 'ru'
  }
  var lang = getLang(), UZ = window.PPH_UZ || {}
  function tr(s) { return lang === 'uz' && UZ[s] ? UZ[s] : s }
  window.PPH_T = tr
  function applyLang() {
    root.lang = lang
    d.querySelectorAll('[data-lang]').forEach(function (a) {
      a.setAttribute('aria-current', String(a.getAttribute('data-lang') === lang))
      var u = new URL(location.href); u.searchParams.set('lang', a.getAttribute('data-lang')); a.href = u.search + u.hash
    })
    if (lang === 'ru') return
    d.title = tr(d.title)
    var m = d.querySelector('meta[name="description"]'); if (m) m.content = tr(m.content)
    var w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT), n, list = []
    while ((n = w.nextNode())) list.push(n)
    list.forEach(function (t) { var raw = t.nodeValue, k = raw.trim(); if (k && UZ[k]) t.nodeValue = raw.replace(k, UZ[k]) })
    d.querySelectorAll('[aria-label],[placeholder],[alt]').forEach(function (el) {
      ['aria-label', 'placeholder', 'alt'].forEach(function (at) { var v = el.getAttribute(at); if (v && UZ[v]) el.setAttribute(at, UZ[v]) })
    })
  }
  applyLang()

  /* ---------- reveal on view ---------- */
  var rv = d.querySelectorAll('[data-rv]')
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { rootMargin: innerWidth < 761 ? '0px 0px 12% 0px' : '0px 0px -8% 0px' })
    rv.forEach(function (el) { io.observe(el) })
  } else rv.forEach(function (el) { el.classList.add('in') })

  /* ---------- scroll variables: --sy (px) and per-scene --k (0..1) ---------- */
  var scenes = [].slice.call(d.querySelectorAll('[data-scene]')), ticking = false
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  function update() {
    ticking = false
    var vh = innerHeight
    root.style.setProperty('--sy', String(scrollY))
    scenes.forEach(function (s) {
      var r = s.getBoundingClientRect(), span = Math.max(1, r.height - vh)
      var k = Math.min(1, Math.max(0, -r.top / span))
      s.style.setProperty('--k', k.toFixed(4))
      if (s._cb) s._cb(k)
    })
    var hd = d.querySelector('.hd'); if (hd && !root.classList.contains('own-hd')) hd.classList.toggle('hd--solid', scrollY > vh * .6)
  }
  window.PPH_onScene = function (el, cb) { el._cb = cb }
  if (!reduce) {
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update) } }, { passive: true })
    addEventListener('resize', update)
  }
  update()

  /* ---------- form ---------- */
  d.querySelectorAll('form[data-pph-form]').forEach(function (f) {
    var st = f.querySelector('[data-status]')
    f.addEventListener('submit', function (e) {
      e.preventDefault()
      var tel = f.querySelector('[name=phone]')
      if (!tel.value.replace(/\D/g, '').match(/\d{9,}/)) { st.textContent = tr('Укажите номер телефона, чтобы мы могли перезвонить'); tel.focus(); return }
      st.textContent = tr('Отправляем…')
      var body = new URLSearchParams(new FormData(f)).toString()
      fetch(f.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) { if (!r.ok) throw 0; f.reset(); st.textContent = tr('Спасибо! Перезвоним в рабочее время.') })
        .catch(function () { st.textContent = tr('Не получилось отправить. Позвоните нам: +998 77 499-09-09') })
    })
  })
})()
