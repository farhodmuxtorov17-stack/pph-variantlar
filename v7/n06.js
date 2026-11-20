/* n06 «Mist»: a soft fog field in raw WebGL with a glowing ring; words light up as you read, two circles meet in the venn. */
(function () {
  var d = document, root = d.documentElement
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  var PH = innerWidth < 761; if (PH) root.classList.add('ph')   // phones: no long pinned reading, the words are lit at once
  // words
  var h = d.querySelector('.words'), ws = []
  h.innerHTML = h.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>' }).join(' ')
  ws = [].slice.call(h.querySelectorAll('.w'))
  var intro = d.querySelector('.intro'), venn = d.querySelector('.venn'), cl = d.querySelector('.cl'), hd = d.querySelector('.hd')
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x }
  function ss(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x) }
  function prog(el) { var r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1) }
  // GL
  var cv = d.querySelector('.mist'), gl = cv.getContext('webgl', { alpha: false })
  var FS = ['precision highp float;varying vec2 v;uniform float T,S,RI,RR;uniform vec2 RC,R;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}',
    'void main(){vec2 u=v;vec2 q=vec2(u.x*R.x/R.y,u.y);',
    'float f=fb(q*1.6+vec2(T*.02,-T*.015))+.5*fb(q*3.+vec2(-T*.03,T*.01));',
    'vec3 dk=vec3(.30,.42,.39),md=vec3(.58,.66,.63),lt=vec3(.80,.85,.83),cr=vec3(.93,.95,.80);',
    'vec3 top=mix(dk,lt,S),bot=mix(md,cr*.98,S);vec3 c=mix(bot,top,smoothstep(.0,1.,u.y+f*.25-.12));',
    'c=mix(c,cr,smoothstep(.55,1.,f)*.25);',
    'vec2 p=(u-RC)*vec2(R.x/R.y,1.);float d=length(p);float ring=exp(-pow((d-RR)*34.,2.))*RI*.6;float halo=exp(-pow((d-RR)*7.,2.))*RI*.28;float core=exp(-d*d*12.)*RI*.35;vec2 qs=abs(mat2(.9239,-.3827,.3827,.9239)*p);float sd=min(max(qs.x,qs.y),(qs.x+qs.y)*.7071);float star=exp(-pow((sd-RR*.7)*120.,2.))*RI*.16;',
    'c+=cr*(ring*.9+star)+vec3(.9,.95,.7)*halo*.35+vec3(.2,.25,.22)*core*(1.-S);',
    'c+=(h(u*R+T)-.5)*.018;gl_FragColor=vec4(c,1.);}'].join('\n')
  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}'
  if (gl) {
    var sh = function (t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr)
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    var al = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0)
    var U = {}; ['T', 'S', 'RI', 'RR', 'RC', 'R'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k) })
    var size = function () { var s = Math.min(devicePixelRatio || 1, 1) * 0.6; cv.width = innerWidth * s; cv.height = innerHeight * s; gl.viewport(0, 0, cv.width, cv.height) }
    size(); addEventListener('resize', size)
  }
  var t0 = performance.now(), spin = 0
  function frame(now) {
    var H = innerHeight
    var pi = prog(intro), pv = prog(venn), vr = venn.getBoundingClientRect()
    var nw = Math.floor(pi * 1.15 * ws.length)
    for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < nw)
    root.style.setProperty('--v', ss(0.1, 0.6, pv).toFixed(3))
    var S = ss(H * 1.2, 0, vr.top)
    hd.style.setProperty('--hc', S > 0.5 ? '#1C2522' : '#fff'); hd.style.setProperty('--hbg', S > 0.5 ? 'rgba(236,240,228,.86)' : 'rgba(46,68,60,.42)')
    var cr = cl.getBoundingClientRect(), ci = 1 - Math.abs((cr.top + cr.height / 2 - H / 2) / H)
    var RI = Math.max(0.9 * (1 - S), 0.8 * ss(0.2, 0.8, ci)), RR = (innerWidth < 760 ? 0.27 : 0.34) + 0.04 * pi
    spin += reduce ? 0 : 0.04; cl.style.setProperty('--spin', spin.toFixed(2) + 'deg')
    if (gl) {
      gl.uniform1f(U.T, reduce ? 0 : (now - t0) / 1000); gl.uniform1f(U.S, S); gl.uniform1f(U.RI, RI); gl.uniform1f(U.RR, RR)
      gl.uniform2f(U.RC, 0.5, 0.5); gl.uniform2f(U.R, cv.width, cv.height); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
})()
