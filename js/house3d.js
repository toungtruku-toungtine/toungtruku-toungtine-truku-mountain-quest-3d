/* 中央島 3D 室內：傳統桂竹家屋 ⇄ 主權 AI 基地 */
window.createHouse3D = function (wrap) {
  const W = () => wrap.clientWidth, H = () => wrap.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b1410);
  scene.fog = new THREE.Fog(0x1b1410, 14, 26);
  const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 100);
  const ctl = MiniOrbit(camera, renderer.domElement, { target: new THREE.Vector3(0, 1.2, 0), dist: 8.6, min: 4, max: 15, theta: 0.45, phi: 1.12, maxPhi: 1.45 });

  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x3a2a1a, 0.75));
  const sun = new THREE.DirectionalLight(0xfff3e0, 0.55); sun.position.set(4, 8, 6); scene.add(sun);
  const fireLight = new THREE.PointLight(0xff8a3c, 2.2, 9, 1.6); fireLight.position.set(0, 0.8, 0.4); scene.add(fireLight);

  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  // floor
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7.5, 48), M(0x6b4a2f));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const slate = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 6.4), M(0x7d5b3c));
  slate.rotation.x = -Math.PI / 2; slate.position.y = 0.01; scene.add(slate);

  // 桂竹牆（Instanced）
  const bambooGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.2, 10);
  const bambooMat = M(0xc8b46a, { roughness: 0.6 });
  const spots = [];
  for (let x = -4.1; x <= 4.1; x += 0.19) spots.push([x, -3.1]);
  for (let z = -3.0; z <= 2.6; z += 0.19) { spots.push([-4.2, z]); spots.push([4.2, z]); }
  const bamboo = new THREE.InstancedMesh(bambooGeo, bambooMat, spots.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  spots.forEach((p, i) => { m4.makeTranslation(p[0], 1.6, p[1]); bamboo.setMatrixAt(i, m4); col.setHSL(0.13 + Math.random() * 0.02, 0.45, 0.48 + Math.random() * 0.1); bamboo.setColorAt(i, col); });
  scene.add(bamboo);
  // 竹節橫箍
  [0.5, 1.6, 2.7].forEach(y => {
    const b1 = box(8.6, 0.08, 0.08, M(0x5a4325)); b1.position.set(0, y, -3.0); scene.add(b1);
    [-4.1, 4.1].forEach(x => { const b2 = box(0.08, 0.08, 5.8, M(0x5a4325)); b2.position.set(x, y, -0.2); scene.add(b2); });
  });
  // 屋頂樑架
  for (let x = -4; x <= 4; x += 1) {
    const r = box(0.1, 0.1, 4.2, M(0x4a3420)); r.position.set(x, 3.6, -1.1); r.rotation.x = 0.45; scene.add(r);
  }
  const ridge = box(8.6, 0.16, 0.16, M(0x3e2b19)); ridge.position.set(0, 4.5, -2.9); scene.add(ridge);
  const thatch = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 3.2), M(0x8a7a4a, { side: THREE.DoubleSide, transparent: true, opacity: 0.35 }));
  thatch.position.set(0, 3.95, -1.6); thatch.rotation.x = -1.1; scene.add(thatch);

  // 火塘
  const hearth = new THREE.Group(); scene.add(hearth); hearth.position.set(0, 0, 0.4);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), M(0x77736b));
    st.position.set(Math.cos(a) * 0.75, 0.12, Math.sin(a) * 0.75); hearth.add(st);
  }
  for (let i = 0; i < 3; i++) {
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 8), M(0x3d2614));
    lg.rotation.z = Math.PI / 2; lg.rotation.y = i * 1.05; lg.position.y = 0.1; hearth.add(lg);
  }
  const flames = [];
  [[0, 0.75, 0xffb02e], [0.12, 0.5, 0xff6a1a], [-0.1, 0.55, 0xff8a3c]].forEach(([x, h, c]) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, h, 12), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
    f.position.set(x, 0.2 + h / 2, 0); hearth.add(f); flames.push(f);
  });
  // 鍋（熱傳導）
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0x2b2b2b, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
  pot.rotation.x = Math.PI; pot.position.set(0, 1.25, 0); hearth.add(pot);
  const tri = box(0.04, 1.4, 0.04, M(0x3d2614)); tri.position.set(0, 0.95, 0); hearth.add(tri);
  // 熱對流粒子
  const parts = [];
  const pMat = new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 26; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), pMat.clone()); p.userData.t = Math.random(); hearth.add(p); parts.push(p); }

  // ---------- 傳統物件 ----------
  const trad = new THREE.Group(); scene.add(trad);
  // 弓與箭
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 8, 30, Math.PI * 0.9), M(0x6b3e1e));
  bow.position.set(-4.05, 2.1, -1.2); bow.rotation.y = Math.PI / 2; bow.rotation.z = Math.PI * 0.05 + Math.PI / 2; trad.add(bow);
  for (let i = 0; i < 3; i++) { const ar = box(0.02, 0.02, 1.2, M(0x9a7044)); ar.position.set(-4.0, 1.6 - i * 0.12, -1.2); trad.add(ar); }
  // 織布機 + 菱形紋布
  const loom = new THREE.Group(); loom.position.set(2.6, 0, -1.9); trad.add(loom);
  [[-0.7, 0], [0.7, 0]].forEach(([x]) => { const p = box(0.08, 1.4, 0.08, M(0x5a3b20)); p.position.set(x, 0.7, 0); loom.add(p); });
  const bar = box(1.6, 0.08, 0.08, M(0x5a3b20)); bar.position.set(0, 1.35, 0); loom.add(bar);
  const weave = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1), new THREE.MeshStandardMaterial({ map: weaveTexture(), side: THREE.DoubleSide }));
  weave.position.set(0, 0.75, 0.03); loom.add(weave);
  // 獸骨架（懸掛動物骨頭）
  const skulls = new THREE.Group(); skulls.position.set(-1.8, 2.75, -2.9); trad.add(skulls);
  const sbar = box(2.6, 0.06, 0.06, M(0x3e2b19)); skulls.add(sbar);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M(0xece4d2)); s.scale.set(1, 0.8, 1.2); s.position.set(-1 + i * 0.5, -0.2, 0.05); skulls.add(s);
    const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.28, 6), M(0xd8cdb4)); h1.position.set(-1.07 + i * 0.5, -0.02, 0.05); h1.rotation.z = 0.5; skulls.add(h1);
    const h2 = h1.clone(); h2.position.x = -0.93 + i * 0.5; h2.rotation.z = -0.5; skulls.add(h2);
  }
  // 竹籃
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.45, 14, 1, true), M(0xb08a4a, { side: THREE.DoubleSide, wireframe: false }));
  basket.position.set(-2.6, 0.23, 1.3); trad.add(basket);

  // ---------- 主權 AI 基地物件 ----------
  const ai = new THREE.Group(); scene.add(ai);
  const rack = box(0.9, 1.9, 0.8, M(0x1e2326, { metalness: 0.4, roughness: 0.5 })); rack.position.set(-2.8, 0.95, -2.2); ai.add(rack);
  const leds = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0x40ff7a }));
    l.position.set(-3.05 + c * 0.08, 0.4 + r * 0.25, -1.79); ai.add(l); leds.push(l);
  }
  for (let r = 0; r < 6; r++) { const sl = box(0.7, 0.02, 0.01, M(0x40484d)); sl.position.set(-2.75, 0.33 + r * 0.25, -1.79); ai.add(sl); }
  const desk = box(1.8, 0.08, 0.8, M(0x7a5733)); desk.position.set(2.4, 0.8, 1.2); ai.add(desk);
  [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]].forEach(([x, z]) => { const lg = box(0.06, 0.8, 0.06, M(0x5a3b20)); lg.position.set(2.4 + x, 0.4, 1.2 + z); ai.add(lg); });
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.72), new THREE.MeshBasicMaterial({ map: screenTexture() }));
  mon.position.set(2.4, 1.32, 0.95); mon.rotation.y = -0.35; ai.add(mon);
  const monBack = box(1.26, 0.78, 0.05, M(0x111111)); monBack.position.set(2.41, 1.32, 0.92); monBack.rotation.y = -0.35; ai.add(monBack);
  // cable
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.4, 0.2, -1.8), new THREE.Vector3(-0.8, 0.03, 1.8), new THREE.Vector3(1.6, 0.03, 1.6), new THREE.Vector3(2.2, 0.8, 1.2)]);
  ai.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.025, 6), M(0x222222)));

  // 海報（AI 模式）與直條（兩模式皆有）
  const loader = new THREE.TextureLoader();
  const A = window.ASSETS || {};
  const posterMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  if (A.poster) loader.load(A.poster, t => { t.colorSpace = THREE.SRGBColorSpace; posterMat.map = t; posterMat.needsUpdate = true; });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.98), posterMat); poster.position.set(0.6, 2.0, -2.95); ai.add(poster);
  const coupMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  if (A.couplet) loader.load(A.couplet, t => { t.colorSpace = THREE.SRGBColorSpace; coupMat.map = t; coupMat.needsUpdate = true; });
  const coup = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 2.25), coupMat); coup.position.set(4.05, 1.7, 0.6); coup.rotation.y = -Math.PI / 2; scene.add(coup);

  // ---------- 標籤 ----------
  const labels = [
    { t: '火塘', p: [0, 1.9, 0.4], m: 'both' },
    { t: '🔥 熱輻射：火光直接照暖身體', p: [1.3, 0.9, 1.6], m: 'trad', hot: 1 },
    { t: '🔥 熱對流：熱空氣往上升', p: [0, 2.6, 0.4], m: 'trad', hot: 1 },
    { t: '🔥 熱傳導：鍋子由下往上變燙', p: [-0.9, 1.4, 0.4], m: 'trad', hot: 1 },
    { t: '桂竹牆（桂竹結構與外層材質）', p: [-4.1, 3.3, 1.5], m: 'trad' },
    { t: '弓 arrow', p: [-4.0, 2.9, -1.2], m: 'trad' },
    { t: '織布機・菱形紋', p: [2.6, 1.6, -1.9], m: 'trad' },
    { t: '獸骨架（懸掛動物骨頭）', p: [-1.8, 3.1, -2.9], m: 'trad' },
    { t: '本地伺服器：Gemma3:12B・RTX 5080', p: [-2.8, 2.1, -2.2], m: 'ai', hot: 1 },
    { t: '知識庫：族語詞典・論文・田野調查・校本教材', p: [-2.8, 0.2, -1.6], m: 'ai' },
    { t: 'ai.truku.tw：Docker＋Ollama', p: [2.4, 2.0, 0.95], m: 'ai' },
    { t: '主權 AI：在地算力・開放模型・資料自主', p: [0.6, 3.15, -2.9], m: 'ai', hot: 1 },
    { t: '祖靈織紋傳古訓', p: [4.0, 2.95, 0.6], m: 'both' }
  ].map(l => { const d = document.createElement('div'); d.className = 'lbl' + (l.hot ? ' hot' : ''); d.textContent = l.t; wrap.appendChild(d); l.el = d; l.v = new THREE.Vector3(...l.p); return l; });

  let mode = 'trad';
  function setMode(m) {
    mode = m; trad.visible = m === 'trad'; ai.visible = m === 'ai';
    scene.background.set(m === 'ai' ? 0x10171a : 0x1b1410); scene.fog.color.set(m === 'ai' ? 0x10171a : 0x1b1410);
  }
  setMode('trad');

  let raf = 0, last = performance.now(), running = true;
  const tmp = new THREE.Vector3();
  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctl.update(dt);
    const t = now / 1000;
    flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i) * 0.08, 1 + Math.sin(t * 7 + i * 2) * 0.15, 1); });
    fireLight.intensity = 2 + Math.sin(t * 11) * 0.3 + Math.sin(t * 5.3) * 0.2;
    parts.forEach(p => { p.userData.t = (p.userData.t + dt * 0.35) % 1; const k = p.userData.t; p.position.set(Math.sin(k * 9 + p.id) * 0.25 * k, 0.5 + k * 2.6, Math.cos(k * 7 + p.id) * 0.2 * k); p.material.opacity = 0.55 * (1 - k); });
    if (ai.visible) leds.forEach((l, i) => l.material.color.setHex(Math.sin(t * 6 + i * 1.7) > 0.2 ? 0x40ff7a : 0x0d3b1c));
    renderer.render(scene, camera);
    const w = W(), h = H();
    labels.forEach(l => {
      const show = l.m === 'both' || l.m === mode;
      tmp.copy(l.v).project(camera);
      const vis = show && tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      l.el.style.display = vis ? 'block' : 'none';
      if (vis) { l.el.style.left = ((tmp.x + 1) / 2 * w) + 'px'; l.el.style.top = ((1 - tmp.y) / 2 * h) + 'px'; }
    });
  }
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
  ro.observe(wrap);

  function weaveTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#f4ede1'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) {
      g.fillStyle = (x / 32 + y / 32) % 2 ? '#b3261e' : '#1d1d1b';
      g.beginPath(); g.moveTo(x + 16, y + 2); g.lineTo(x + 30, y + 16); g.lineTo(x + 16, y + 30); g.lineTo(x + 2, y + 16); g.fill();
      g.fillStyle = '#f4ede1'; g.beginPath(); g.moveTo(x + 16, y + 10); g.lineTo(x + 22, y + 16); g.lineTo(x + 16, y + 22); g.lineTo(x + 10, y + 16); g.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function screenTexture() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 307; const g = c.getContext('2d');
    g.fillStyle = '#fbf7ef'; g.fillRect(0, 0, 512, 307);
    g.fillStyle = '#1f3a2b'; g.fillRect(0, 0, 512, 40);
    g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText('AI Truku  ·  ai.truku.tw', 14, 28);
    g.fillStyle = '#1d1d1b'; g.font = '17px sans-serif';
    ['學生：請你介紹這個套索陷阱', '（pakay nu pangki\'an）', '', 'Baki：laqi，聽 Baki 說……', '藤蔓編圈、木棍控制開合，', '不能影響其他動物的活動。'].forEach((s, i) => g.fillText(s, 18, 78 + i * 34));
    g.fillStyle = '#b3261e'; g.fillRect(380, 70, 110, 80); g.fillStyle = '#2f6b3a'; g.fillRect(380, 160, 110, 80);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  return {
    setMode, get mode() { return mode; },
    reset() { ctl.reset(); },
    dispose() { running = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); wrap.innerHTML = ''; }
  };
};
