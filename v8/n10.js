/* n10 «Core»: gold dust drifts in the light beam over the archive corridor; the hero slowly pushes in as you scroll. */
(function () {
  var root = document.documentElement, geo = document.querySelector('.geo'), raf = 0
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  function up() {
    raf = 0; var H = innerHeight
    root.style.setProperty('--hp', Math.min(1, scrollY / H).toFixed(3))
    var r = geo.getBoundingClientRect(); root.style.setProperty('--gp', Math.max(-1, Math.min(1, (H - r.top) / (H + r.height) * 2 - 1)).toFixed(3))
  }
  if (!reduce) { addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(up) }, { passive: true }); up() }

  var cv = document.querySelector('.dust'), x = cv.getContext('2d'), W, H, P = [], dpr = Math.min(devicePixelRatio || 1, 2)
  function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0) }
  size(); addEventListener('resize', size)
  var n = W < 700 ? 70 : 160
  for (var i = 0; i < n; i++) P.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .3, s: Math.random() * .00025 + .00008, ph: Math.random() * 6.28 })
  var vis = true
  new IntersectionObserver(function (e) { vis = e[0].isIntersecting }).observe(cv)
  function draw(t) {
    requestAnimationFrame(draw); if (!vis) return
    x.clearRect(0, 0, W, H)
    for (var i = 0; i < P.length; i++) {
      var p = P[i]
      if (!reduce) { p.y -= p.s; p.x += Math.sin(t * .0004 + p.ph) * .00012; if (p.y < -.02) { p.y = 1.02; p.x = Math.random() } }
      var bx = Math.abs(p.x - .62) < .16 ? 1 : .35, a = (.35 + .65 * Math.abs(Math.sin(t * .001 + p.ph))) * bx
      x.fillStyle = 'rgba(230,203,142,' + a.toFixed(2) + ')'; x.beginPath(); x.arc(p.x * W, p.y * H, p.r, 0, 6.283); x.fill()
    }
  }
  requestAnimationFrame(draw)
})()
