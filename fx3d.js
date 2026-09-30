/* ---------- 3D layer (added on top; the page itself is unchanged) ----------
   One WebGL canvas, re-parented into whichever scene is active. Each slide gets
   its own themed object built from the security / integration vocabulary:
   globe, data stream, hex shield, target, hub network, radar, lattice, KPI bars. */
(function () {
  if (typeof THREE === "undefined") return;
  const GOLD = 0xe2b45a, WHITE = 0xf4f6fb, RED = 0xc8102e, SKY = 0x9fc3ff;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement; cv.className = "fx3d"; cv.setAttribute("aria-hidden", "true");
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100); camera.position.set(0, 0, 9);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, .55));
  const key = new THREE.DirectionalLight(0xfff1d6, .9); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc3ff, .6); rim.position.set(-4, -2, -3); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);       // positioned on the photo side
  const stage = new THREE.Group(); root.add(stage);      // current slide object
  const dust = makeDust(); scene.add(dust);

  /* ---------- helpers ---------- */
  function mat(color, opacity, extra) { return new THREE.MeshBasicMaterial(Object.assign({ color, transparent: true, opacity, depthWrite: false }, extra || {})); }
  function lineMat(color, opacity) { return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }); }
  function wire(geo, color, opacity) { return new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(color, opacity)); }
  function ring(r, tube, color, opacity, seg) { return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, seg || 96), mat(color, opacity)); }
  function points(n, spread, color, size, opacity) {
    const g = new THREE.BufferGeometry(); const a = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) a[i] = (Math.random() - .5) * spread;
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false }));
  }
  function makeDust() { const p = points(260, 16, WHITE, .045, .5); p.position.z = -2; return p; }
  function hexRing(r, color, opacity) {
    const g = new THREE.RingGeometry(r * .965, r, 6, 1); const m = new THREE.Mesh(g, mat(color, opacity, { side: THREE.DoubleSide })); m.rotation.z = Math.PI / 6; return m;
  }

  /* ---------- slide objects ---------- */
  const builders = {
    globe(g) {
      const geo = new THREE.IcosahedronGeometry(2, 2);
      g.add(wire(geo, GOLD, .5));
      g.add(new THREE.Mesh(geo, mat(SKY, .05)));
      const inner = new THREE.Points(geo, new THREE.PointsMaterial({ color: WHITE, size: .06, transparent: true, opacity: .8 })); g.add(inner);
      const r1 = ring(2.7, .012, GOLD, .7); r1.rotation.x = Math.PI / 2.4; g.add(r1);
      const r2 = ring(3.1, .008, WHITE, .55); r2.rotation.x = Math.PI / 2; r2.rotation.y = .5; g.add(r2);
      const sats = new THREE.Group(); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 10), mat(i % 2 ? RED : WHITE, .95)); s.userData.a = i / 6 * Math.PI * 2; sats.add(s); } g.add(sats);
      return t => { g.rotation.y = t * .18; g.rotation.x = Math.sin(t * .2) * .15; r1.rotation.z = t * .3; r2.rotation.z = -t * .2;
        sats.children.forEach((s, i) => { const a = s.userData.a + t * (.35 + i * .04); s.position.set(Math.cos(a) * 2.7, Math.sin(a) * .5, Math.sin(a) * 2.7); }); };
    },
    flow(g) {
      const N = 900, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), seed = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) { seed[i * 2] = Math.random(); seed[i * 2 + 1] = Math.random(); }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: GOLD, size: .07, transparent: true, opacity: .85, depthWrite: false })); g.add(pts);
      const lanes = new THREE.Group(); for (let i = 0; i < 5; i++) { const l = ring(1.2 + i * .55, .006, WHITE, .16 - i * .02); l.rotation.x = Math.PI / 2; l.position.y = -1.6; lanes.add(l); } g.add(lanes);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(.55, 0), mat(WHITE, .18)); g.add(core); g.add(wire(new THREE.OctahedronGeometry(.55, 0), GOLD, .9));
      return t => {
        for (let i = 0; i < N; i++) { const u = (seed[i * 2] + t * .07 * (0.6 + seed[i * 2 + 1])) % 1; const a = u * Math.PI * 2 * 3 + seed[i * 2 + 1] * 6; const r = .6 + u * 3.4;
          pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 2] = Math.sin(a) * r; pos[i * 3 + 1] = -1.6 + u * 3.6 + Math.sin(t + i) * .05; }
        geo.attributes.position.needsUpdate = true; core.rotation.y = t * .6; core.rotation.x = t * .3; g.children[3].rotation.copy(core.rotation); lanes.rotation.y = -t * .1;
      };
    },
    shield(g) {
      const rings = [2.7, 2.05, 1.45].map((r, i) => { const h = hexRing(r, i === 1 ? WHITE : GOLD, .5 - i * .08); g.add(h); return h; });
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(.7, 1), mat(SKY, .12)); g.add(core); const cw = wire(new THREE.OctahedronGeometry(.7, 1), WHITE, .7); g.add(cw);
      const dots = points(120, 6.5, GOLD, .05, .7); g.add(dots);
      return t => { rings.forEach((h, i) => { h.rotation.z = Math.PI / 6 + t * (i % 2 ? -.12 : .12) * (i + 1); h.scale.setScalar(1 + Math.sin(t * 1.4 + i) * .02); });
        core.rotation.y = cw.rotation.y = t * .5; core.rotation.x = cw.rotation.x = t * .25; const s = 1 + Math.sin(t * 2) * .06; core.scale.setScalar(s); cw.scale.setScalar(s); dots.rotation.y = t * .05; };
    },
    target(g) {
      const rs = [1.1, 1.9, 2.7].map((r, i) => { const m = ring(r, .01, i === 1 ? WHITE : GOLD, .55); g.add(m); return m; });
      const cross = new THREE.Group();
      [[0, 1], [1, 0]].forEach(([x, y]) => { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.2 * x, -3.2 * y, 0), new THREE.Vector3(3.2 * x, 3.2 * y, 0)]); cross.add(new THREE.Line(geo, lineMat(WHITE, .35))); });
      g.add(cross);
      const arc = new THREE.Mesh(new THREE.RingGeometry(2.85, 3.05, 64, 1, 0, Math.PI * .6), mat(RED, .85, { side: THREE.DoubleSide })); g.add(arc);
      const rise = points(160, 7, GOLD, .05, .8); g.add(rise); const rp = rise.geometry.attributes.position;
      return t => { rs.forEach((r, i) => r.rotation.z = t * .1 * (i + 1)); cross.rotation.z = -t * .08; arc.rotation.z = -t * .9;
        for (let i = 0; i < rp.count; i++) { let y = rp.getY(i) + .012; if (y > 3.5) y = -3.5; rp.setY(i, y); } rp.needsUpdate = true; };
    },
    hub(g) {
      const hubM = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 24), mat(GOLD, .9)); g.add(hubM);
      g.add(ring(.7, .012, WHITE, .5));
      const nodes = [], N = 7, lineGeo = new THREE.BufferGeometry(), lp = new Float32Array(N * 6); lineGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
      g.add(new THREE.LineSegments(lineGeo, lineMat(GOLD, .45)));
      for (let i = 0; i < N; i++) { const n = new THREE.Group(); const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.22, 0), mat(WHITE, .9)); n.add(m); n.add(wire(new THREE.IcosahedronGeometry(.34, 0), GOLD, .6));
        n.userData = { a: i / N * Math.PI * 2, r: 2.4 + (i % 2) * .5, h: (i % 3 - 1) * .8 }; g.add(n); nodes.push(n); }
      const pk = points(90, 7, SKY, .05, .6); g.add(pk);
      return t => { nodes.forEach((n, i) => { const a = n.userData.a + t * .22; n.position.set(Math.cos(a) * n.userData.r, n.userData.h + Math.sin(t + i) * .15, Math.sin(a) * n.userData.r); n.rotation.y = t;
          lp[i * 6] = 0; lp[i * 6 + 1] = 0; lp[i * 6 + 2] = 0; lp[i * 6 + 3] = n.position.x; lp[i * 6 + 4] = n.position.y; lp[i * 6 + 5] = n.position.z; });
        lineGeo.attributes.position.needsUpdate = true; hubM.scale.setScalar(1 + Math.sin(t * 3) * .05); g.rotation.x = .35; pk.rotation.y = -t * .05; };
    },
    radar(g) {
      const disc = new THREE.Group(); disc.rotation.x = -Math.PI / 2.6; g.add(disc);
      [1, 2, 3].forEach(r => disc.add(ring(r, .008, WHITE, .35)));
      const sweep = new THREE.Mesh(new THREE.CircleGeometry(3, 48, 0, Math.PI / 3), mat(RED, .28, { side: THREE.DoubleSide })); disc.add(sweep);
      const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 0, 0)]), lineMat(RED, .95)); disc.add(edge);
      const blips = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 10), mat(GOLD, 1)); const a = Math.random() * Math.PI * 2, r = .6 + Math.random() * 2.3; b.position.set(Math.cos(a) * r, Math.sin(a) * r, .02); b.userData.a = a; disc.add(b); blips.push(b); }
      const grid = new THREE.GridHelper(7, 14, 0xf4f6fb, 0xf4f6fb); grid.material.transparent = true; grid.material.opacity = .08; grid.rotation.x = Math.PI / 2; disc.add(grid);
      return t => { const a = (t * 1.1) % (Math.PI * 2); sweep.rotation.z = a - Math.PI / 3; edge.rotation.z = a;
        blips.forEach(b => { let d = (a - b.userData.a) % (Math.PI * 2); if (d < 0) d += Math.PI * 2; b.material.opacity = Math.max(.08, 1 - d / 2.2); b.scale.setScalar(1 + Math.max(0, .6 - d) * 1.5); }); g.rotation.y = Math.sin(t * .25) * .12; };
    },
    lattice(g) {
      const cubes = new THREE.Group(); const n = 3, s = 1.05;
      for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) { const c = new THREE.Group(); const geo = new THREE.BoxGeometry(.5, .5, .5);
        c.add(new THREE.Mesh(geo, mat(SKY, .08))); c.add(wire(geo, (x + y + z) % 2 ? GOLD : WHITE, .55)); c.position.set((x - 1) * s, (y - 1) * s, (z - 1) * s); c.userData.p = x * 7 + y * 3 + z; cubes.add(c); }
      g.add(cubes); const halo = ring(3.2, .01, GOLD, .5); g.add(halo);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 16), mat(RED, .95)); g.add(eye);
      return t => { cubes.rotation.y = t * .25; cubes.rotation.x = Math.sin(t * .3) * .4; cubes.children.forEach(c => { const k = 1 + Math.sin(t * 2 + c.userData.p) * .12; c.scale.setScalar(k); });
        halo.rotation.x = Math.PI / 2 + Math.sin(t * .4) * .3; halo.rotation.z = t * .2; eye.position.set(Math.cos(t * .8) * 3.2, Math.sin(t * .8) * .4, Math.sin(t * .8) * 3.2); };
    },
    bars(g) {
      const bars = [], N = 5;
      for (let i = 0; i < N; i++) { const geo = new THREE.BoxGeometry(.5, 1, .5); geo.translate(0, .5, 0); const b = new THREE.Group(); b.add(new THREE.Mesh(geo, mat(i === 2 ? RED : GOLD, .55))); b.add(wire(geo, WHITE, .5));
        b.position.set((i - 2) * .85, -1.6, 0); b.userData.i = i; g.add(b); bars.push(b); }
      const base = ring(3, .01, WHITE, .35); base.rotation.x = Math.PI / 2; base.position.y = -1.6; g.add(base);
      const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 40 }, (_, i) => new THREE.Vector3(-2.3 + i * .12, 0, .6))), lineMat(SKY, .8)); g.add(trail); const tp = trail.geometry.attributes.position;
      return t => { bars.forEach(b => { b.scale.y = 1.2 + Math.sin(t * .9 + b.userData.i * 1.3) * .9 + 1.0; });
        for (let i = 0; i < tp.count; i++) tp.setY(i, -.2 + Math.sin(i * .35 + t * 1.5) * .5 + i * .05); tp.needsUpdate = true; g.rotation.y = Math.sin(t * .2) * .45; g.rotation.x = .15; };
    }
  };
  const plan = { 1: "globe", 2: "flow", 3: "shield", 4: "target", 5: "hub", 6: "hub", 7: "radar", 8: "lattice", 9: "bars", 10: "shield", 11: "globe" };

  /* ---------- lifecycle ---------- */
  let tick = null, shownAt = 0, cur = 0;
  function show(n) {
    if (n === cur) return; cur = n;
    while (stage.children.length) { const c = stage.children[0]; stage.remove(c); c.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
    const g = new THREE.Group(); stage.add(g); tick = builders[plan[n] || "globe"](g); shownAt = performance.now();
    const host = document.querySelector('.scene[data-n="' + n + '"]');
    if (host && cv.parentNode !== host) host.insertBefore(cv, host.querySelector(".wrap")); resize();
  }
  function resize() {
    const w = cv.parentNode ? cv.parentNode.clientWidth : innerWidth, h = cv.parentNode ? cv.parentNode.clientHeight : innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z, vw = vh * camera.aspect;
    if (w > 640) { root.position.set(-vw * .24, 0, 0); root.scale.setScalar(Math.min(1, vw / 14)); }
    else { root.position.set(0, vh * .27, 0); root.scale.setScalar(.45); }
  }
  addEventListener("resize", resize);
  const mouse = { x: 0, y: 0 }; addEventListener("pointermove", e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; }, { passive: true });
  const clock = new THREE.Clock(); let hidden = false; document.addEventListener("visibilitychange", () => hidden = document.hidden);
  function frame() {
    requestAnimationFrame(frame); if (hidden || !cv.parentNode) return;
    const t = reduce ? 1.5 : clock.getElapsedTime();
    const k = Math.min(1, (performance.now() - shownAt) / 900), e = 1 - Math.pow(1 - k, 3);
    stage.scale.setScalar(.6 + .4 * e); stage.rotation.y = (1 - e) * -.8;
    stage.traverse(o => { if (o.material && o.userData.op === undefined) o.userData.op = o.material.opacity; if (o.material) o.material.opacity = o.userData.op * e; });
    root.rotation.y += ((mouse.x * .5) - root.rotation.y) * .04; root.rotation.x += ((mouse.y * .3) - root.rotation.x) * .04;
    dust.rotation.y = t * .02; dust.position.y = Math.sin(t * .1) * .3;
    if (tick) tick(t); renderer.render(scene, camera);
  }
  new MutationObserver(ms => ms.forEach(m => { if (m.target.classList.contains("active")) show(+m.target.dataset.n); }))
    .observe(document.getElementById("deck"), { attributes: true, attributeFilter: ["class"], subtree: true });
  const first = document.querySelector(".scene.active") || document.querySelector(".scene"); show(+first.dataset.n); frame();
})();
