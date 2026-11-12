/* 智創洄瀾光雕盒：3D 互動發光木盒方塊燈（五面圓窗） */
(function () {
  const ORDER = ['front', 'right', 'back', 'left', 'top'];

  function motif(g, kind, cx, cy, r, color) {
    g.save(); g.translate(cx, cy); g.lineJoin = 'round';
    const dia = (s, fill) => { g.beginPath(); g.moveTo(0, -s); g.lineTo(s, 0); g.lineTo(0, s); g.lineTo(-s, 0); g.closePath(); g.fillStyle = fill; g.fill(); };
    if (kind === 'diamond') { dia(r, '#1d1d1b'); dia(r * .78, '#f7efe0'); dia(r * .6, color); dia(r * .38, '#1d1d1b'); dia(r * .18, '#f7efe0'); }
    else if (kind === 'eye') {
      g.strokeStyle = '#1d1d1b'; g.lineWidth = r * .08;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a * r * .55, b * r * .55); g.lineTo(a * r * .9, b * r * .9); g.stroke(); g.beginPath(); g.arc(a * r * .95, b * r * .95, r * .1, 0, 7); g.fillStyle = color; g.fill(); });
      dia(r * .8, '#1d1d1b'); dia(r * .62, '#f7efe0'); dia(r * .48, color); dia(r * .3, '#1d1d1b'); dia(r * .14, color);
    } else if (kind === 'mountain') {
      g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(r * .35, -r * .35, r * .28, 0, 7); g.fill();
      g.fillStyle = color; g.beginPath(); g.moveTo(-r, r * .6); g.lineTo(-r * .35, -r * .45); g.lineTo(0, r * .05); g.lineTo(r * .4, -r * .6); g.lineTo(r, r * .6); g.closePath(); g.fill();
      g.fillStyle = '#f7efe0'; g.beginPath(); g.moveTo(-r * .35, -r * .45); g.lineTo(-r * .2, -r * .2); g.lineTo(-r * .5, -r * .2); g.fill(); g.beginPath(); g.moveTo(r * .4, -r * .6); g.lineTo(r * .58, -r * .3); g.lineTo(r * .22, -r * .3); g.fill();
    } else if (kind === 'weave') {
      g.fillStyle = color; g.fillRect(-r, -r * .45, r * 2, r * .9);
      for (let i = -2; i <= 2; i++) { g.save(); g.translate(i * r * .42, 0); dia(r * .26, '#1d1d1b'); dia(r * .16, '#f7efe0'); dia(r * .07, color); g.restore(); }
      g.fillStyle = '#1d1d1b'; g.fillRect(-r, -r * .5, r * 2, r * .08); g.fillRect(-r, r * .42, r * 2, r * .08);
    } else if (kind === 'crystal') {
      const gr = g.createRadialGradient(0, 0, r * .1, 0, 0, r * .8); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(.5, '#ff7a1a'); gr.addColorStop(1, '#a01d0e');
      g.fillStyle = gr; g.beginPath(); g.arc(0, r * .1, r * .62, 0, 7); g.fill();
      g.strokeStyle = color; g.lineWidth = r * .07; g.lineCap = 'round';
      [-.4, 0, .4].forEach(x => { g.beginPath(); g.moveTo(x * r, -r * .6); g.bezierCurveTo(x * r + r * .15, -r * .75, x * r - r * .15, -r * .9, x * r, -r * 1.05); g.stroke(); });
    } else if (kind === 'bow') {
      g.strokeStyle = '#6b3e1e'; g.lineWidth = r * .1; g.beginPath(); g.arc(-r * .2, 0, r * .85, -1.2, 1.2); g.stroke();
      g.strokeStyle = '#1d1d1b'; g.lineWidth = r * .03; g.beginPath(); g.moveTo(-r * .2 + Math.cos(-1.2) * r * .85, Math.sin(-1.2) * r * .85); g.lineTo(-r * .2 + Math.cos(1.2) * r * .85, Math.sin(1.2) * r * .85); g.stroke();
      g.strokeStyle = color; g.lineWidth = r * .06; g.beginPath(); g.moveTo(-r * .2, 0); g.lineTo(r, 0); g.stroke();
      g.fillStyle = color; g.beginPath(); g.moveTo(r * 1.05, 0); g.lineTo(r * .8, -r * .14); g.lineTo(r * .8, r * .14); g.fill();
    } else if (kind === 'lily') {
      g.strokeStyle = '#2f6b3a'; g.lineWidth = r * .06; g.beginPath(); g.moveTo(0, r * .2); g.lineTo(0, r); g.stroke();
      for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.fillStyle = '#ffffff'; g.strokeStyle = '#c9b98f'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -r * .42, r * .16, r * .45, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
      g.fillStyle = color; g.beginPath(); g.arc(0, 0, r * .12, 0, 7); g.fill();
    }
    g.restore();
  }

  function wrapLines(g, text, maxW) {
    const out = [];
    String(text || '').split('\n').forEach(par => {
      let line = '';
      for (const ch of par) { if (g.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
      out.push(line);
    });
    return out.slice(0, 5);
  }

  /** 畫一面木板：圓窗內是圖騰＋金句 */
  window.drawLampFace = function (c, face, lit) {
    const g = c.getContext('2d'), S = c.width;
    g.clearRect(0, 0, S, S);
    // 木板
    const wood = g.createLinearGradient(0, 0, S, S);
    wood.addColorStop(0, lit ? '#f0d6ae' : '#a77e55'); wood.addColorStop(1, lit ? '#e2bd8a' : '#8c6642');
    g.fillStyle = wood; g.fillRect(0, 0, S, S);
    g.globalAlpha = .12; g.strokeStyle = '#5a3b20';
    for (let y = 8; y < S; y += 14) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(S * .3, y + 6, S * .6, y - 6, S, y + 3); g.stroke(); }
    g.globalAlpha = 1;
    // 榫槽
    g.fillStyle = lit ? '#ff9a3c' : '#3a2616';
    [[.08, .06], [.84, .06], [.08, .9], [.84, .9]].forEach(([x, y]) => g.fillRect(x * S, y * S, S * .08, S * .035));
    const cx = S / 2, cy = S / 2, R = S * .4;
    // 窗外光暈
    if (lit) { const gl = g.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.18); gl.addColorStop(0, 'rgba(255,170,60,.95)'); gl.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, R * 1.18, 0, 7); g.fill(); }
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
    const bg = g.createRadialGradient(cx, cy * .8, R * .1, cx, cy, R);
    bg.addColorStop(0, '#fffbe9'); bg.addColorStop(1, '#f6dfb4');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    // 織紋邊帶
    g.fillStyle = face.color; g.fillRect(cx - R, cy + R * .62, R * 2, R * .4);
    for (let x = cx - R; x < cx + R; x += R * .18) { g.fillStyle = '#1d1d1b'; g.beginPath(); g.moveTo(x + R * .09, cy + R * .67); g.lineTo(x + R * .17, cy + R * .8); g.lineTo(x + R * .09, cy + R * .93); g.lineTo(x + R * .01, cy + R * .8); g.fill(); g.fillStyle = '#f7efe0'; g.beginPath(); g.arc(x + R * .09, cy + R * .8, R * .025, 0, 7); g.fill(); }
    motif(g, face.motif, cx, cy - R * .42, R * .32, face.color);
    // 金句
    let fs = S * .085; g.textAlign = 'center'; g.textBaseline = 'middle';
    let lines;
    for (; fs > S * .04; fs -= 2) { g.font = `900 ${fs}px "Noto Serif TC","PMingLiU","Microsoft JhengHei",serif`; lines = wrapLines(g, face.text, R * 1.62); if (lines.length * fs * 1.2 < R * .78) break; }
    const y0 = cy + R * .2 - (lines.length - 1) * fs * 1.2 / 2;
    lines.forEach((ln, i) => { g.lineWidth = fs * .16; g.strokeStyle = '#fffbe9'; g.strokeText(ln, cx, y0 + i * fs * 1.2); g.fillStyle = face.color; g.fillText(ln, cx, y0 + i * fs * 1.2); });
    if (!lit) { g.fillStyle = 'rgba(30,20,10,.55)'; g.fillRect(0, 0, S, S); }
    g.restore();
    g.lineWidth = S * .018; g.strokeStyle = lit ? '#ff8a1e' : '#5a3b20'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  };

  window.createLamp = function (wrap, faces, opts) {
    opts = opts || {};
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const W = () => wrap.clientWidth, H = () => wrap.clientHeight;
    renderer.setSize(W(), H()); wrap.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 50);
    const ctl = MiniOrbit(camera, renderer.domElement, { target: new THREE.Vector3(0, 0.15, 0), dist: 6.4, min: 3.6, max: 10, theta: 0.6, phi: 1.12, minPhi: 0.2, maxPhi: 1.5, auto: true });
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const glow = new THREE.PointLight(0xff9a3c, 0, 8, 1.5); glow.position.set(0, 0.2, 0); scene.add(glow);

    // ground glow
    const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gg = gc.getContext('2d');
    const rg = gg.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, 'rgba(255,160,60,.9)'); rg.addColorStop(1, 'rgba(255,160,60,0)'); gg.fillStyle = rg; gg.fillRect(0, 0, 256, 256);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1.01; scene.add(ground);
    const table = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshStandardMaterial({ color: 0x3b2c20, roughness: 0.9 }));
    table.rotation.x = -Math.PI / 2; table.position.y = -1.02; scene.add(table);

    const box = new THREE.Group(); scene.add(box);
    const conf = {
      front: { p: [0, 0, 1.0], r: [0, 0, 0] }, back: { p: [0, 0, -1.0], r: [0, Math.PI, 0] },
      right: { p: [1.0, 0, 0], r: [0, Math.PI / 2, 0] }, left: { p: [-1.0, 0, 0], r: [0, -Math.PI / 2, 0] },
      top: { p: [0, 1.0, 0], r: [-Math.PI / 2, 0, 0] }
    };
    const meshes = {};
    faces.forEach(f => {
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex }));
      const k = conf[f.key]; m.position.set(...k.p); m.rotation.set(...k.r); m.userData.key = f.key;
      box.add(m); meshes[f.key] = { m, c, tex };
    });
    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshStandardMaterial({ color: 0x8c6642 }));
    bottom.rotation.x = Math.PI / 2; bottom.position.y = -1; box.add(bottom);
    // 木框
    const fr = new THREE.MeshStandardMaterial({ color: 0x9b7149, roughness: 0.8 });
    const e = 2.06, t = 0.07;
    [[e, t, t], [t, e, t], [t, t, e]].forEach((s, axis) => {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        const bm = new THREE.Mesh(new THREE.BoxGeometry(...s), fr);
        const p = [0, 0, 0]; const o = [0, 1, 2].filter(i => i !== axis); p[o[0]] = a; p[o[1]] = b; bm.position.set(...p); box.add(bm);
      });
    });

    function refresh() {
      let lit = 0;
      faces.forEach(f => { const o = meshes[f.key]; drawLampFace(o.c, f, f.on); o.tex.needsUpdate = true; if (f.on) lit++; });
      glow.intensity = lit * 1.2; ground.material.opacity = lit / faces.length;
    }
    refresh();

    // 點面切換燈光
    const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
    renderer.domElement.addEventListener('click', ev => {
      if (ctl.moved) return;
      const r = renderer.domElement.getBoundingClientRect();
      v2.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const hit = ray.intersectObjects(Object.values(meshes).map(o => o.m))[0];
      if (hit && opts.onPick) opts.onPick(hit.object.userData.key);
    });

    let raf = 0, last = performance.now(), running = true;
    function loop(now) { if (!running) return; raf = requestAnimationFrame(loop); ctl.update(Math.min(.05, (now - last) / 1000)); last = now; renderer.render(scene, camera); }
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
    ro.observe(wrap);

    return {
      refresh, ctl,
      snapshot() { renderer.render(scene, camera); return renderer.domElement; },
      dispose() { running = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); wrap.querySelector('canvas') && wrap.querySelector('canvas').remove(); }
    };
  };
  window.LAMP_ORDER = ORDER;
})();
