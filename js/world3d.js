/* Truku 山岳浮島 3D 世界：低多邊形群島、吊橋、角色、玩家移動、主題、小地圖 */
window.createWorld = function (wrap, Q, cb) {
  cb = cb || {};
  const V3 = THREE.Vector3;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);
  const labelLayer = document.createElement('div'); labelLayer.className = 'labels3d'; wrap.appendChild(labelLayer);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd6efe7, 60, 170);
  const camera = new THREE.PerspectiveCamera(42, wrap.clientWidth / wrap.clientHeight, 0.1, 400);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x5c7a6a, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
  sun.position.set(30, 50, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 140 });
  sun.shadow.bias = -0.0008; scene.add(sun);

  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, flatShading: true }, o || {}));
  const ROCK = mat(0x8b97a0), ROCK2 = mat(0x6f7c86), GRASS = mat(0x8fcf7a), GRASS2 = mat(0x6fb466), MARBLE = mat(0xeef0ec), SNOW = mat(0xffffff),
    PINE = mat(0x2f7d4f), PINE2 = mat(0x3f9a5a), TRUNK = mat(0x7a5230), WOOD = mat(0xb98a55), WOOD2 = mat(0x8c6239), ROPE = mat(0xd9c49a), REDM = mat(0xb3261e);
  const shadowy = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

  /* ---------- 海 ---------- */
  const seaGeo = new THREE.PlaneGeometry(320, 320, 64, 64); seaGeo.rotateX(-Math.PI / 2);
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x7fd6c2, roughness: .35, metalness: .05, flatShading: true });
  const sea = new THREE.Mesh(seaGeo, seaMat); sea.position.y = -3; sea.receiveShadow = true; scene.add(sea);
  const seaBase = seaGeo.attributes.position.array.slice();

  /* ---------- 島嶼配置 ---------- */
  const R0 = 25;
  const isl = Q.islands.map((d, k) => {
    const a = Math.PI * 0.75 + k / Q.islands.length * Math.PI * 2;
    return { d, id: d.id, x: Math.cos(a) * R0, z: Math.sin(a) * R0, r: 5.6, ang: a };
  });
  const hub = { d: Q.hub, id: 'hub', x: 0, z: 0, r: 7.2 };
  const all = [hub].concat(isl);
  const byId = id => all.find(i => i.id === id);
  const walkY = 0.06;
  const colliders = []; // {x,z,r}
  const clickables = [];
  const labels = [];
  const anims = [];
  const lanterns = [];

  function rockBase(r, depth) {
    const g = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .82, 2.2, 7), ROCK); b1.position.y = -1.2; g.add(b1);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(r * .82, r * .55, 2.4, 7), ROCK2); b2.position.y = -3.4; b2.rotation.y = .3; g.add(b2);
    const b3 = new THREE.Mesh(new THREE.ConeGeometry(r * .55, depth || 3, 7), ROCK2); b3.position.y = -6.1; b3.rotation.x = Math.PI; g.add(b3);
    // 大理石層
    const strata = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.005, r * .95, .35, 7), MARBLE); strata.position.y = -0.9; g.add(strata);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r, .28, 7), GRASS); top.position.y = -0.08; g.add(top);
    top.userData.ground = true;
    return g;
  }
  function pine(x, z, s) {
    const t = new THREE.Group(); t.position.set(x, walkY, z); t.scale.setScalar(s || 1);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, .5, 5), TRUNK); tr.position.y = .25; t.add(tr);
    [[.9, 1.1, .9], [.7, .9, 1.5], [.45, .7, 2.0]].forEach(([r, h, y], i) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), i % 2 ? PINE2 : PINE); c.position.y = y; t.add(c); });
    return t;
  }
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function lantern(parent, x, z) {
    const g = new THREE.Group(); g.position.set(x, walkY, z);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 1.4, 6), WOOD2); p.position.y = .7; g.add(p);
    const l = new THREE.Mesh(new THREE.BoxGeometry(.28, .32, .28), new THREE.MeshStandardMaterial({ color: 0xffd38a, emissive: 0xff9a3c, emissiveIntensity: .3 })); l.position.y = 1.5; g.add(l);
    lanterns.push(l.material); parent.add(g);
  }

  /* 各島地標 */
  const props = {
    datong(g) { // 石堆記號、綁草結、稜線旗
      for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(.42 - i * .08), ROCK); s.position.set(-1.2, walkY + .3 + i * .55, .6); s.rotation.y = i; g.add(s); }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.2, 6), WOOD2); pole.position.set(-1.2, 1.9, .6); g.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), new THREE.MeshStandardMaterial({ color: 0xb3261e, side: THREE.DoubleSide })); flag.position.set(-.8, 2.75, .6); g.add(flag);
      anims.push(t => { flag.rotation.y = Math.sin(t * 3) * .3; });
      const knot = new THREE.Mesh(new THREE.TorusGeometry(.18, .05, 6, 12), mat(0xc8b46a)); knot.position.set(1.4, .6, 1.2); g.add(knot);
      colliders.push({ g, x: -1.2, z: .6, r: .7 });
    },
    qingshui(g) { // 本地伺服器＋主權石
      const rack = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.6, .7), mat(0x26303a, { metalness: .4, roughness: .5 })); rack.position.set(-1.3, walkY + .8, .8); g.add(rack);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .02), new THREE.MeshBasicMaterial({ color: 0x40ff7a })); l.position.set(-1.55 + c * .1, walkY + .35 + r * .27, 1.16); g.add(l);
        anims.push(t => { l.material.color.setHex(Math.sin(t * 5 + r * 1.3 + c * 2.1) > .1 ? 0x40ff7a : 0x0d3b1c); });
      }
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.6), mat(0x77736b)); st.position.set(1.2, walkY + .5, 1.2); st.scale.y = .75; g.add(st);
      const rune = new THREE.Mesh(new THREE.PlaneGeometry(.7, .4), new THREE.MeshBasicMaterial({ map: canvasTex(128, 64, (x, w, h) => { x.fillStyle = '#fff'; x.font = '900 44px sans-serif'; x.textAlign = 'center'; x.fillText('AI', 64, 48); }), transparent: true })); rune.position.set(1.2, walkY + .55, 1.72); g.add(rune);
      colliders.push({ g, x: -1.3, z: .8, r: .8 }, { g, x: 1.2, z: 1.2, r: .7 });
    },
    dali(g) { // Baki 的木箱
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, .8, .9), WOOD); box.position.set(-1.1, walkY + .4, 1); g.add(box);
      const lid = new THREE.Group(); lid.position.set(-1.1, walkY + .8, .55); g.add(lid);
      const lm = new THREE.Mesh(new THREE.BoxGeometry(1.34, .14, .94), WOOD2); lm.position.z = .47; lid.add(lm);
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.32, .16, .02), REDM); band.position.set(-1.1, walkY + .55, 1.46); g.add(band);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(1.1, .05, .7), new THREE.MeshBasicMaterial({ color: 0xffd36b })); glow.position.set(-1.1, walkY + .79, 1); g.add(glow);
      anims.push(t => { lid.rotation.x = -.35 - Math.sin(t * 1.5) * .15; });
      colliders.push({ g, x: -1.1, z: 1, r: .85 });
    },
    zhuilu(g) { // 古道木欄與 Gaya 指標
      for (let i = 0; i < 7; i++) { const a = -1.2 + i * .35; const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .8, 5), WOOD2); p.position.set(Math.cos(a) * 3.6, walkY + .4, Math.sin(a) * 3.6); g.add(p); }
      const sign = new THREE.Group(); sign.position.set(1.5, walkY, 1.4); g.add(sign);
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.5, 6), WOOD2); sp.position.y = .75; sign.add(sp);
      const sb = new THREE.Mesh(new THREE.BoxGeometry(1.3, .5, .08), new THREE.MeshStandardMaterial({ map: canvasTex(256, 96, (x, w, h) => { x.fillStyle = '#f4ede1'; x.fillRect(0, 0, w, h); x.fillStyle = '#b3261e'; x.font = '900 52px serif'; x.textAlign = 'center'; x.fillText('Gaya', w / 2, 66); }) }));
      sb.position.y = 1.35; sign.add(sb); colliders.push({ g, x: 1.5, z: 1.4, r: .4 });
    },
    hilagan(g) { // 燒紅圓形水晶石＋巨人腳印
      const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(.9, 1), new THREE.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xff3d00, emissiveIntensity: .8, roughness: .4, flatShading: true }));
      stone.position.set(-1.1, walkY + .9, .9); g.add(stone);
      const pl = new THREE.PointLight(0xff7a1a, 2, 7, 1.5); pl.position.set(-1.1, 1.8, .9); g.add(pl);
      anims.push(t => { stone.material.emissiveIntensity = .7 + Math.sin(t * 3) * .25; pl.intensity = 1.6 + Math.sin(t * 3) * .5; stone.rotation.y = t * .3; });
      for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .02, 12), mat(0x4f7a46)); f.scale.set(1, 1, 1.8); f.position.set(1.4 + i * .1, walkY + .01, -.6 + i * 1.6); f.rotation.y = .2; g.add(f); }
      colliders.push({ g, x: -1.1, z: .9, r: 1.0 });
    },
    tianxiang(g) { // Durang 套頸陷阱
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .5, 6), WOOD2); base.position.set(-1, walkY + .25, 1); g.add(base);
      const curve = new THREE.QuadraticBezierCurve3(new V3(-1.9, walkY, .4), new V3(-2.2, 2.4, 1), new V3(-1, 1.4, 1));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, .06, 6), mat(0x9b7149)));
      const line = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.2, 4), ROPE); line.position.set(-1, .8, 1); g.add(line);
      const noose = new THREE.Mesh(new THREE.TorusGeometry(.35, .025, 6, 18), ROPE); noose.position.set(-1, walkY + .4, 1.4); g.add(noose);
      anims.push(t => { noose.rotation.y = Math.sin(t) * .3; });
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(.4, 6), mat(0x5fae5a, { side: THREE.DoubleSide })); leaf.rotation.x = -Math.PI / 2; leaf.position.set(-1, walkY + .02, 1.4); g.add(leaf);
      colliders.push({ g, x: -1.5, z: .9, r: .9 });
    },
    hehuan(g) { // THINK 石碑＋火炬
      'THINK'.split('').forEach((ch, i) => {
        const a = -.9 + i * .45; const s = new THREE.Mesh(new THREE.BoxGeometry(.45, .7, .15), new THREE.MeshStandardMaterial({ map: canvasTex(64, 96, (x, w, h) => { x.fillStyle = '#e7e9e6'; x.fillRect(0, 0, w, h); x.fillStyle = '#b3261e'; x.font = '900 60px serif'; x.textAlign = 'center'; x.fillText(ch, 32, 70); }) }));
        s.position.set(Math.cos(a) * 2.8, walkY + .35, Math.sin(a) * 2.8 + .2); s.lookAt(0, walkY + .35, 6); g.add(s);
      });
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 1.3, 6), WOOD2); tp.position.set(-1.4, walkY + .65, 1.3); g.add(tp);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 7), new THREE.MeshBasicMaterial({ color: 0xffa53c })); fl.position.set(-1.4, walkY + 1.6, 1.3); g.add(fl);
      anims.push(t => { fl.scale.set(1 + Math.sin(t * 9) * .1, 1 + Math.sin(t * 7) * .2, 1); });
      colliders.push({ g, x: -1.4, z: 1.3, r: .3 });
    },
    dayuling(g) { // 織布機＋音符
      const lo = new THREE.Group(); lo.position.set(-1.2, walkY, 1); g.add(lo);
      [-.6, .6].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.3, .08), WOOD2); p.position.set(x, .65, 0); lo.add(p); });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, .08, .08), WOOD2); bar.position.y = 1.28; lo.add(bar);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, map: canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#f4ede1'; x.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let xx = 0; xx < w; xx += 32) { x.fillStyle = (xx + y) / 32 % 2 ? '#b3261e' : '#1d1d1b'; x.beginPath(); x.moveTo(xx + 16, y + 2); x.lineTo(xx + 30, y + 16); x.lineTo(xx + 16, y + 30); x.lineTo(xx + 2, y + 16); x.fill(); } }) }));
      cloth.position.set(0, .72, .02); lo.add(cloth);
      const noteTex = canvasTex(64, 64, (x) => { x.fillStyle = '#b3261e'; x.font = '900 52px serif'; x.textAlign = 'center'; x.fillText('♪', 32, 50); });
      for (let i = 0; i < 3; i++) { const n = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, transparent: true })); n.scale.setScalar(.5); g.add(n); anims.push(t => { const k = (t * .4 + i / 3) % 1; n.position.set(1.4 + Math.sin(k * 6 + i) * .3, walkY + .8 + k * 2.2, 1); n.material.opacity = 1 - k; }); }
      colliders.push({ g, x: -1.2, z: 1, r: .8 });
    }
  };

  /* 建島 */
  const islandGroups = {};
  const chars = [];
  function placeChar(parent, key, x, z, faceTo, info) {
    const c = Q.characters[key];
    const ch = makeTrukuCharacter({ gender: c.gender, elder: c.elder });
    ch.position.set(x, walkY, z); ch.lookAt(faceTo.x, walkY, faceTo.z);
    parent.add(ch);
    ch.traverse(m => { if (m.isMesh) m.userData.char = info; });
    clickables.push(ch);
    chars.push(ch);
    addLabel(ch, `<b>${c.name}</b><small>${c.role}</small>`, 'tag char', new V3(0, 2.25, 0), () => cb.onCharacter && cb.onCharacter(info.island));
    return ch;
  }
  isl.forEach(I => {
    const g = new THREE.Group(); g.position.set(I.x, 0, I.z); scene.add(g); islandGroups[I.id] = g;
    g.add(rockBase(I.r));
    // 山峰：在外側
    const out = new V3(I.x, 0, I.z).normalize();
    const h = I.d.h || 1;
    const pr = 2.3 * h, ph = 4.6 * h;
    const px = out.x * 2.2, pz = out.z * 2.2;
    const peak = new THREE.Group(); peak.position.set(px, walkY, pz); g.add(peak);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(pr, ph, 7, 3), GRASS2); cone.position.y = ph / 2; peak.add(cone);
    const cliff = new THREE.Mesh(new THREE.ConeGeometry(pr * .55, ph * .78, 4), MARBLE); cliff.position.set(-out.x * pr * .35, ph * .39, -out.z * pr * .35); cliff.rotation.y = .5; peak.add(cliff);
    if (h >= 1.2) { const cap = new THREE.Mesh(new THREE.ConeGeometry(pr * .38, ph * .3, 7), SNOW); cap.position.y = ph * .86; peak.add(cap); }
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.2, 5), WOOD2); flagPole.position.y = ph + .5; peak.add(flagPole);
    const flag = new THREE.Mesh(new THREE.OctahedronGeometry(.32), new THREE.MeshStandardMaterial({ color: 0x9a9387, emissive: 0x000000, flatShading: true })); flag.position.y = ph + 1.25; peak.add(flag);
    I.flag = flag; anims.push(t => { flag.rotation.y = t * 1.2; });
    peak.traverse(m => { if (m.isMesh) m.userData.island = I.id; });
    colliders.push({ g, x: px, z: pz, r: pr * .92 });
    // 樹
    for (let k = 0; k < 6; k++) {
      const a = I.ang + Math.PI + (k - 2.5) * .55 + (k > 2 ? .9 : -.9) * 0; const rr = 4.3 + (k % 2) * .5;
      const ta = I.ang + Math.PI * .5 + k * .38 + (k > 2 ? Math.PI * .45 : 0);
      const tx = Math.cos(ta) * rr, tz = Math.sin(ta) * rr;
      g.add(pine(tx, tz, .65 + (k % 3) * .15)); colliders.push({ g, x: tx, z: tz, r: .45 });
    }
    // 地標
    const pg = new THREE.Group(); g.add(pg);
    const inward = Math.atan2(-I.z, -I.x);
    pg.rotation.y = -inward + Math.PI / 2;
    props[I.id] && props[I.id](pg);
    // 把 collider 從 pg 區域轉到島座標
    colliders.forEach(c => { if (c.g === pg) { const v = new V3(c.x, 0, c.z).applyEuler(pg.rotation); c.x = v.x; c.z = v.z; c.g = g; } });
    lantern(g, -out.z * 3.6, out.x * 3.6);
    // 角色：面向中央
    const inv = new V3(-out.x, 0, -out.z), side = new V3(-out.z, 0, out.x);
    const hp = inv.clone().multiplyScalar(2.6).add(side.clone().multiplyScalar(-1));
    const vp2 = inv.clone().multiplyScalar(2.4).add(side.clone().multiplyScalar(1.1));
    const faceTo = new V3(-I.x * .2, 0, -I.z * .2).sub(new V3(I.x, 0, I.z));
    I.host = placeChar(g, I.d.host, hp.x, hp.z, faceTo.clone(), { island: I.id, key: I.d.host });
    placeChar(g, I.d.villager, vp2.x, vp2.z, faceTo.clone(), { island: I.id, key: I.d.villager });
    I.hostWorld = new V3(I.x + hp.x, 0, I.z + hp.z);
    shadowy(g);
    g.traverse(m => { if (m.isMesh && !m.userData.char && !m.userData.island) m.userData.island = I.id; });
    clickables.push(g);
    addLabel(g, `<span class="num">${String(I.d.no).padStart(2, '0')}</span>${I.d.name}`, 'tag isl', new V3(px, ph + 2.1, pz), () => cb.onIsland && cb.onIsland(I.id), I.id);
  });

  /* 中央：布洛灣台地・桂竹家屋 */
  (function buildHub() {
    const g = new THREE.Group(); scene.add(g); islandGroups.hub = g;
    g.add(rockBase(hub.r, 4));
    const bambooTex = canvasTex(256, 128, (x, w, h) => { for (let i = 0; i < w; i += 16) { x.fillStyle = i / 16 % 2 ? '#c8b46a' : '#b5a05a'; x.fillRect(i, 0, 16, h); x.fillStyle = 'rgba(90,67,37,.5)'; x.fillRect(i, h * .33, 16, 3); x.fillRect(i, h * .7, 16, 3); } });
    bambooTex.wrapS = THREE.RepeatWrapping; bambooTex.repeat.set(2, 1);
    const house = new THREE.Group(); house.position.set(0, walkY, -2.2); g.add(house);
    const walls = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2, 3.2), new THREE.MeshStandardMaterial({ map: bambooTex, roughness: .8 })); walls.position.y = 1; house.add(walls);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.9, 4), mat(0x9b8350)); roof.position.y = 2.9; roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, .85); house.add(roof);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.3), mat(0x3e2b19)); door.position.set(0, .65, 1.61); house.add(door);
    const smoke = [];
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.25, 6, 5), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .6, flatShading: true })); house.add(s); smoke.push(s); }
    anims.push(t => smoke.forEach((s, i) => { const k = (t * .25 + i / 4) % 1; s.position.set(.8 + Math.sin(k * 5) * .2, 3.4 + k * 2.4, 0); s.scale.setScalar(.6 + k * 1.2); s.material.opacity = .55 * (1 - k); }));
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.13), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    if (window.ASSETS && ASSETS.poster) new THREE.TextureLoader().load(ASSETS.poster, t => { t.colorSpace = THREE.SRGBColorSpace; poster.material.map = t; poster.material.needsUpdate = true; });
    poster.position.set(1.5, 1.2, 1.62); house.add(poster);
    house.traverse(m => { if (m.isMesh) m.userData.house = true; });
    clickables.push(house);
    colliders.push({ g, x: 0, z: -2.2, r: 2.5 }, { g, x: -1.6, z: -2.2, r: 1.7 }, { g, x: 1.6, z: -2.2, r: 1.7 });
    // 火塘
    const fire = new THREE.Group(); fire.position.set(2.6, walkY, 2); g.add(fire);
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(.16), ROCK); s.position.set(Math.cos(i / 8 * 6.28) * .5, .1, Math.sin(i / 8 * 6.28) * .5); fire.add(s); }
    const fl = new THREE.Mesh(new THREE.ConeGeometry(.25, .7, 7), new THREE.MeshBasicMaterial({ color: 0xffa53c })); fl.position.y = .4; fire.add(fl);
    const fpl = new THREE.PointLight(0xff8a3c, 1.5, 6); fpl.position.y = 1; fire.add(fpl);
    anims.push(t => { fl.scale.set(1 + Math.sin(t * 9) * .1, 1 + Math.sin(t * 7) * .2, 1); fpl.intensity = 1.3 + Math.sin(t * 11) * .3; });
    colliders.push({ g, x: 2.6, z: 2, r: .7 });
    [[-5, -3], [5, -3.5], [-4.5, 3.2], [-2.5, -5.5], [3, -5.6]].forEach(([x, z], k) => { g.add(pine(x, z, .7 + (k % 2) * .2)); colliders.push({ g, x, z, r: .45 }); });
    lantern(g, -2.8, 1.2); lantern(g, 2.8, -.4);
    hub.host = placeChar(g, 'baki', -1, .6, new V3(0, 0, 10), { island: 'hub', key: 'baki' });
    placeChar(g, 'labi', -2.4, 1.6, new V3(0, 0, 10), { island: 'hub', key: 'labi' });
    placeChar(g, 'watan', 1.2, .9, new V3(0, 0, 10), { island: 'hub', key: 'watan' });
    hub.hostWorld = new V3(-1, 0, .6);
    shadowy(g);
    g.traverse(m => { if (m.isMesh && !m.userData.char && !m.userData.house) m.userData.island = 'hub'; });
    clickables.push(g);
    addLabel(g, `<span class="num">★</span>${Q.hub.name}`, 'tag isl hubtag', new V3(0, 5.6, -2.2), () => cb.onIsland && cb.onIsland('hub'), 'hub');
  })();

  /* ---------- 吊橋 ---------- */
  const bridges = [];
  function bridge(A, B) {
    const dir = new V3(B.x - A.x, 0, B.z - A.z); const L = dir.length(); dir.normalize();
    const a = new V3(A.x, 0, A.z).add(dir.clone().multiplyScalar(A.r - .4));
    const b = new V3(B.x, 0, B.z).add(dir.clone().multiplyScalar(-(B.r - .4)));
    const len = a.distanceTo(b); const n = Math.ceil(len / .42);
    const g = new THREE.Group(); scene.add(g);
    const plankGeo = new THREE.BoxGeometry(1.7, .1, .34);
    const inst = new THREE.InstancedMesh(plankGeo, WOOD, n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const yaw = Math.atan2(dir.x, dir.z);
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n; const p = a.clone().lerp(b, t); p.y = walkY - .08 + sag(t, len);
      q.setFromEuler(new THREE.Euler(0, yaw, 0)); m4.compose(p, q, new V3(1, 1, 1)); inst.setMatrixAt(i, m4);
    }
    inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
    const side = new V3(dir.z, 0, -dir.x);
    [-1, 1].forEach(s => {
      const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; const p = a.clone().lerp(b, t).add(side.clone().multiplyScalar(s * .85)); p.y = walkY + .75 + sag(t, len) * .7; pts.push(p); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .035, 5), ROPE));
      [a, b].forEach(e => { const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 1.3, 6), WOOD2); post.position.copy(e).add(side.clone().multiplyScalar(s * .85)); post.position.y = walkY + .5; post.castShadow = true; g.add(post); });
    });
    bridges.push({ a, b, len, dir });
  }
  function sag(t, len) { return -Math.sin(Math.PI * t) * Math.min(.9, len * .045); }
  isl.forEach(I => bridge(hub, I));
  for (let k = 0; k < isl.length - 1; k++) bridge(isl[k], isl[k + 1]);

  /* ---------- 點綴：小島、雲、船、老鷹、星星 ---------- */
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2 + .2, r = 40 + (k % 3) * 9;
    const s = new THREE.Group(); s.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    const rr = 1.4 + (k % 3) * .5; s.add(rockBase(rr, 2)); s.scale.setScalar(.8); s.position.y = -1;
    if (k % 2) s.add(pine(0, 0, .8)); scene.add(shadowy(s));
  }
  const clouds = [];
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: .92 });
  for (let k = 0; k < 9; k++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + Math.random(), 0), cloudM); s.position.set(j * 1.4 - 2, Math.random() * .6, Math.random()); c.add(s); }
    const ca = k / 9 * Math.PI * 2; c.userData.a = ca; c.userData.r = 48 + (k % 3) * 8; c.position.set(Math.cos(ca) * c.userData.r, 3 + (k % 3) * 1.5, Math.sin(ca) * c.userData.r); c.userData.v = .01 + Math.random() * .01; scene.add(c); clouds.push(c);
  }
  const boats = [];
  for (let k = 0; k < 4; k++) {
    const b = new THREE.Group(); const hull = new THREE.Mesh(new THREE.BoxGeometry(.6, .3, 2), WOOD2); b.add(hull);
    const a = k * 1.6 + .6, r = 33 + k * 3; b.position.set(Math.cos(a) * r, -2.8, Math.sin(a) * r); b.rotation.y = -a; b.userData.a = a; b.userData.r = r; scene.add(b); boats.push(b);
  }
  const eagles = [];
  for (let k = 0; k < 2; k++) {
    const e = new THREE.Group(); const wm = mat(0x3d2b1f, { side: THREE.DoubleSide });
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .35), wm); w1.position.x = -.65; e.add(w1); const w2 = w1.clone(); w2.position.x = .65; e.add(w2);
    const body = new THREE.Mesh(new THREE.ConeGeometry(.12, .6, 5), wm); body.rotation.x = Math.PI / 2; e.add(body);
    e.userData = { w1, w2, r: 18 + k * 14, h: 16 + k * 3, s: .12 + k * .05 }; scene.add(e); eagles.push(e);
  }
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 500; i++) { const a = Math.random() * 6.28, b = Math.random() * 1.2 + .15, r = 150; sp.push(Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .8, fog: false })); stars.visible = false; scene.add(stars);

  /* ---------- 玩家 ---------- */
  let player = null; const pState = { x: 0, z: 4.8, yaw: Math.PI, walk: 0 };
  const ring = new THREE.Mesh(new THREE.RingGeometry(.45, .6, 24), new THREE.MeshBasicMaterial({ color: 0xffc83d, transparent: true, opacity: .9 })); ring.rotation.x = -Math.PI / 2; scene.add(ring);
  let playerTag = null;
  function setPlayer(av, name) {
    if (player) scene.remove(player);
    player = makeTrukuCharacter({ gender: av.gender, hair: av.hair, scale: .95 });
    scene.add(player);
    if (playerTag) playerTag.el.remove(), labels.splice(labels.indexOf(playerTag), 1);
    playerTag = addLabel(player, `<b>${name || '我'}</b>`, 'tag me', new V3(0, 2.3, 0));
  }

  /* ---------- 標籤 ---------- */
  function addLabel(obj, html, cls, off, onClick, id) {
    const el = document.createElement(onClick ? 'button' : 'div'); el.className = cls; el.innerHTML = html; if (id) el.dataset.id = id;
    if (onClick) el.addEventListener('click', e => { e.stopPropagation(); onClick(); });
    labelLayer.appendChild(el); const L = { obj, el, off }; labels.push(L); return L;
  }

  /* ---------- 地面判定 ---------- */
  function surfaceAt(x, z) {
    for (const I of all) {
      const dx = x - I.x, dz = z - I.z; if (dx * dx + dz * dz < (I.r - .35) ** 2) {
        for (const c of colliders) { const g = c.g; const cx = g.position.x + c.x, cz = g.position.z + c.z; if ((x - cx) ** 2 + (z - cz) ** 2 < c.r * c.r) return null; }
        return walkY;
      }
    }
    for (const B of bridges) {
      const ab = B.b.clone().sub(B.a); const t = ((x - B.a.x) * ab.x + (z - B.a.z) * ab.z) / ab.lengthSq();
      if (t < -0.05 || t > 1.05) continue;
      const px = B.a.x + ab.x * t, pz = B.a.z + ab.z * t; if ((x - px) ** 2 + (z - pz) ** 2 < .62 * .62) return walkY + sag(Math.min(1, Math.max(0, t)), B.len);
    }
    return null;
  }

  /* ---------- 相機 ---------- */
  const cam = { tx: 0, ty: 0, tz: 0, theta: .65, phi: .95, dist: 78, gx: 0, gy: 0, gz: 0, gTheta: .65, gPhi: .95, gDist: 78, mode: 'overview' };
  function overviewDist() { const asp = wrap.clientWidth / wrap.clientHeight; return asp < .8 ? 125 : asp < 1.2 ? 100 : 86; }
  function home() { cam.mode = 'overview'; cam.gx = 0; cam.gy = 0; cam.gz = 0; cam.gDist = overviewDist(); cam.gPhi = .92; }
  function flyTo(id) {
    const I = byId(id); if (!I) return; cam.mode = 'island';
    cam.gx = I.x; cam.gy = wrap.clientWidth < 700 ? 6 : 1.5; cam.gz = I.z; cam.gDist = wrap.clientWidth < 700 ? 24 : 19; cam.gPhi = 1.02;
    const ang = Math.atan2(-I.x, -I.z); if (id !== 'hub') { let d = ang - cam.gTheta; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.gTheta += d; }
  }
  function follow() { cam.mode = 'follow'; cam.gDist = Math.min(cam.gDist, wrap.clientWidth < 700 ? 20 : 17); cam.gPhi = Math.min(cam.gPhi, 1.0); }
  home(); cam.dist = cam.gDist + 30; cam.theta = cam.gTheta - .6;

  // 指標控制
  const ptr = new Map(); let pinch = null, moved = false, downXY = null, rightDrag = false;
  const dom = renderer.domElement;
  dom.addEventListener('contextmenu', e => e.preventDefault());
  dom.addEventListener('pointerdown', e => {
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false; downXY = [e.clientX, e.clientY]; rightDrag = e.button === 2 || e.shiftKey;
    dom.setPointerCapture(e.pointerId);
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.gDist, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
  });
  dom.addEventListener('pointermove', e => {
    const p = ptr.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (downXY && Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 6) moved = true;
    if (ptr.size === 2 && pinch) {
      const [a, b] = [...ptr.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      cam.gDist = Math.min(150, Math.max(8, pinch.dist * pinch.d / d));
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; pan(mx - pinch.mx, my - pinch.my); pinch.mx = mx; pinch.my = my;
    } else if (moved) {
      if (rightDrag) pan(dx, dy);
      else { cam.gTheta -= dx * .006; cam.gPhi = Math.min(1.42, Math.max(.35, cam.gPhi - dy * .005)); }
    }
  });
  function pan(dx, dy) {
    if (cam.mode === 'follow') cam.mode = 'island';
    const k = cam.gDist * .0016; const s = Math.sin(cam.gTheta), c = Math.cos(cam.gTheta);
    cam.gx -= (dx * c + dy * s) * k; cam.gz -= (-dx * s + dy * c) * k;
    const r = Math.hypot(cam.gx, cam.gz); if (r > 45) { cam.gx *= 45 / r; cam.gz *= 45 / r; }
  }
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (!moved && e.type === 'pointerup' && downXY) pick(e); downXY = ptr.size ? downXY : null; };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);
  dom.addEventListener('wheel', e => { e.preventDefault(); const k = e.deltaMode === 1 ? 30 : 1; cam.gDist = Math.min(150, Math.max(8, cam.gDist * Math.exp(e.deltaY * k * (e.ctrlKey ? .01 : .0012)))); }, { passive: false });

  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function pick(e) {
    const r = dom.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera); const hit = ray.intersectObjects(clickables, true)[0]; if (!hit) return;
    const u = hit.object.userData;
    if (u.char) cb.onCharacter && cb.onCharacter(u.char.island);
    else if (u.house) cb.onHouse && cb.onHouse();
    else if (u.island) cb.onIsland && cb.onIsland(u.island);
  }

  /* ---------- 移動輸入 ---------- */
  const keys = {}; const joy = { x: 0, y: 0 };
  const isTyping = () => /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
  window.addEventListener('keydown', e => { if (isTyping() || !cb.canMove || !cb.canMove()) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys[k] = true; e.preventDefault(); } if (k === 'e' && near) cb.onTalk && cb.onTalk(near); });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  /* ---------- 主題 ---------- */
  const THEMES = {
    dawn: { bg: 0xcdeee5, sea: 0x7fd6c2, fog: [0xd6efe7, 60, 170], hemi: [0xffffff, 0x5c7a6a, .95], sun: [0xfff1d6, 1.6], lan: .3, stars: false },
    fog: { bg: 0xcfd8da, sea: 0x9fc1c0, fog: [0xd0d9db, 18, 85], hemi: [0xf2f6f7, 0x6c7d80, 1.0], sun: [0xf0f4f5, .9], lan: .6, stars: false },
    night: { bg: 0x0d1b30, sea: 0x1b3a58, fog: [0x0d1b30, 45, 150], hemi: [0x8aa4d6, 0x1a2333, .45], sun: [0x9fb6ff, .45], lan: 2.2, stars: true }
  };
  function setTheme(n) {
    const t = THEMES[n] || THEMES.dawn;
    scene.background = new THREE.Color(t.bg); seaMat.color.setHex(t.sea); scene.fog.color.setHex(t.fog[0]); scene.fog.near = t.fog[1]; scene.fog.far = t.fog[2];
    hemi.color.setHex(t.hemi[0]); hemi.groundColor.setHex(t.hemi[1]); hemi.intensity = t.hemi[2]; sun.color.setHex(t.sun[0]); sun.intensity = t.sun[1];
    lanterns.forEach(m => m.emissiveIntensity = t.lan); stars.visible = t.stars; cloudM.color.setHex(n === 'night' ? 0x6b7a99 : 0xffffff);
  }
  setTheme('dawn');
  let reduced = false;

  /* ---------- 迴圈 ---------- */
  const clock = new THREE.Clock(); let near = null, frame = 0, running = true;
  const tmp = new V3(), fwd = new V3(), right = new V3();
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(.1, clock.getDelta()); const t = clock.elapsedTime; frame++;
    if (cb.paused && cb.paused()) return;
    const at = reduced ? 0 : t;
    // 玩家
    if (player) {
      let mx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joy.x;
      let mz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joy.y;
      const m = Math.hypot(mx, mz);
      if (m > .08) {
        if (m > 1) { mx /= m; mz /= m; }
        fwd.set(-Math.sin(cam.theta), 0, -Math.cos(cam.theta)); right.set(-fwd.z, 0, fwd.x);
        const vx = (right.x * mx - fwd.x * mz) * 6.2 * dt, vz = (right.z * mx - fwd.z * mz) * 6.2 * dt;
        let nx = pState.x + vx, nz = pState.z + vz;
        if (surfaceAt(nx, nz) == null) { if (surfaceAt(nx, pState.z) != null) nz = pState.z; else if (surfaceAt(pState.x, nz) != null) nx = pState.x; else { nx = pState.x; nz = pState.z; } }
        pState.x = nx; pState.z = nz; const ty = Math.atan2(vx, vz); let d = ty - pState.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); pState.yaw += d * Math.min(1, dt * 12);
        pState.walk = Math.min(1, pState.walk + dt * 5);
        if (cam.mode !== 'follow') follow();
      } else pState.walk = Math.max(0, pState.walk - dt * 5);
      const y = surfaceAt(pState.x, pState.z); player.position.set(pState.x, y == null ? walkY : y, pState.z); player.rotation.y = pState.yaw;
      animateTruku(player, t, pState.walk);
      ring.position.set(pState.x, player.position.y + .03, pState.z); ring.scale.setScalar(1 + Math.sin(at * 4) * .08);
      // 靠近島主
      let best = null, bd = 3.3;
      all.forEach(I => { const d = Math.hypot(I.hostWorld.x - pState.x, I.hostWorld.z - pState.z); if (d < bd) { bd = d; best = I.id; } });
      if (best !== near) { near = best; cb.onNear && cb.onNear(near); }
      if (cam.mode === 'follow') { cam.gx = pState.x; cam.gy = 1; cam.gz = pState.z; }
    }
    chars.forEach(c => animateTruku(c, at, 0));
    // 相機
    const k = reduced ? .3 : .08;
    cam.tx += (cam.gx - cam.tx) * k; cam.ty += (cam.gy - cam.ty) * k; cam.tz += (cam.gz - cam.tz) * k;
    cam.theta += (cam.gTheta - cam.theta) * k; cam.phi += (cam.gPhi - cam.phi) * k; cam.dist += (cam.gDist - cam.dist) * k;
    if (cam.mode === 'overview' && !ptr.size && !reduced) cam.gTheta += dt * .025;
    camera.position.set(cam.tx + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta), cam.ty + cam.dist * Math.cos(cam.phi), cam.tz + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta));
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    // 動畫
    if (!reduced) {
      anims.forEach(f => f(t));
      if (frame % 2 === 0) {
        const pa = seaGeo.attributes.position; const arr = pa.array;
        for (let i = 0; i < arr.length; i += 3) arr[i + 1] = Math.sin(seaBase[i] * .18 + t * 1.1) * .22 + Math.cos(seaBase[i + 2] * .15 + t * .9) * .22;
        pa.needsUpdate = true; seaGeo.computeVertexNormals();
      }
      clouds.forEach(c => { c.userData.a += c.userData.v * dt; c.position.x = Math.cos(c.userData.a) * c.userData.r; c.position.z = Math.sin(c.userData.a) * c.userData.r; });
      boats.forEach((b, i) => { b.userData.a += dt * .03; const a = b.userData.a; b.position.set(Math.cos(a) * b.userData.r, -2.75 + Math.sin(t * 2 + i) * .12, Math.sin(a) * b.userData.r); b.rotation.y = -a; b.rotation.z = Math.sin(t * 1.6 + i) * .08; });
      eagles.forEach((e, i) => { const u = e.userData; const a = t * u.s + i * 3; e.position.set(Math.cos(a) * u.r, u.h + Math.sin(t) * .5, Math.sin(a) * u.r); e.rotation.y = -a; u.w1.rotation.z = Math.sin(t * 6) * .3; u.w2.rotation.z = -Math.sin(t * 6) * .3; });
    }
    renderer.render(scene, camera);
    // 標籤
    const w = wrap.clientWidth, h = wrap.clientHeight;
    labels.forEach(L => {
      tmp.copy(L.off); L.obj.localToWorld(tmp);
      const dist = tmp.distanceTo(camera.position); tmp.project(camera);
      const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1 && !(L.el.classList.contains('char') && dist > 34);
      L.el.style.display = vis ? '' : 'none';
      if (vis) L.el.style.transform = `translate(${((tmp.x + 1) / 2 * w).toFixed(1)}px,${((1 - tmp.y) / 2 * h).toFixed(1)}px) translate(-50%,-100%)`;
    });
    if (frame % 4 === 0 && cb.minimap) drawMini(cb.minimap);
  }
  requestAnimationFrame(loop);

  function drawMini(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, s = Math.min(W, H) / 70;
    g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(127,214,194,.55)'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H / 2);
    g.strokeStyle = '#b98a55'; g.lineWidth = 2.5; bridges.forEach(B => { g.beginPath(); g.moveTo(B.a.x * s, B.a.z * s); g.lineTo(B.b.x * s, B.b.z * s); g.stroke(); });
    all.forEach(I => { g.fillStyle = cb.isCleared && cb.isCleared(I.id) ? '#f2c230' : I.id === 'hub' ? '#2f6b3a' : '#8fcf7a'; g.beginPath(); g.arc(I.x * s, I.z * s, I.r * s, 0, 7); g.fill(); g.strokeStyle = '#1d1d1b'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#1d1d1b'; g.font = `700 ${Math.max(9, s * 3)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(I.d.no || '★', I.x * s, I.z * s); });
    // 視角方向
    g.strokeStyle = 'rgba(29,29,27,.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cam.tx * s, cam.tz * s, 6, 0, 7); g.stroke();
    if (player) { g.fillStyle = '#b3261e'; g.beginPath(); g.arc(pState.x * s, pState.z * s, 4, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
    g.restore();
  }

  const ro = new ResizeObserver(() => { renderer.setSize(wrap.clientWidth, wrap.clientHeight); camera.aspect = wrap.clientWidth / wrap.clientHeight; camera.updateProjectionMatrix(); if (cam.mode === 'overview') cam.gDist = overviewDist(); });
  ro.observe(wrap);

  return {
    flyTo, home, follow, setTheme, setPlayer,
    setReduced(v) { reduced = v; },
    setJoy(x, y) { joy.x = x; joy.y = y; },
    setCleared(map) { isl.forEach(I => { const on = !!map[I.id]; I.flag.material.color.setHex(on ? 0xf2c230 : 0x9a9387); I.flag.material.emissive.setHex(on ? 0x7a5a00 : 0); }); labelLayer.querySelectorAll('.isl').forEach(el => el.classList.toggle('done', !!map[el.dataset.id])); },
    teleport(id) {
      const I = byId(id); const v = new V3(-I.x, 0, -I.z); if (v.lengthSq() < .01) v.set(0, 0, 1); v.normalize();
      for (const k of [1.4, 2, 2.6, 1]) { const x = I.hostWorld.x + v.x * k + (id === 'hub' ? 0 : 0), z = I.hostWorld.z + v.z * k + (id === 'hub' ? 1.2 : 0); if (surfaceAt(x, z) != null) { pState.x = x; pState.z = z; break; } }
      pState.yaw = Math.atan2(I.hostWorld.x - pState.x, I.hostWorld.z - pState.z); follow();
    },
    get near() { return near; },
    debug: { surfaceAt, cam, pState }
  };
};
