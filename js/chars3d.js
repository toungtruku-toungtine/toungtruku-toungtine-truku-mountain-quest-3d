/* 3D 低多邊形太魯閣族角色（傳統服飾）
 * 男：白底黑紅直條紋無袖長衫、紅底菱形紋胸兜、幾何紋頭帶、額頭／下巴紋面 Patas
 * 女：苧麻白滾紅邊織花長袖衣裙、桃紅紫藍流蘇編織腰帶、彩色頭帶、額頭／雙頰紋面 Patas */
(function () {
  const cache = {};
  function tex(key, w, h, draw, rep) {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    t.anisotropy = 4; cache[key] = t; return t;
  }
  const dia = (g, x, y, s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.fill(); };
  const SKIN = '#e5ad83', PATAS = '#46566a';

  const T = {
    stripes: () => tex('stripes', 256, 64, (g, w, h) => {
      g.fillStyle = '#f7f2e6'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) { g.fillStyle = '#1d1d1b'; g.fillRect(x + 6, 0, 6, h); g.fillStyle = '#b3261e'; g.fillRect(x + 16, 0, 7, h); }
    }),
    chest: () => tex('chest', 128, 128, (g, w, h) => {
      g.fillStyle = '#b3261e'; g.fillRect(0, 0, w, h);
      for (let y = 22; y < h; y += 42) for (let x = 22; x < w; x += 42) { dia(g, x, y, 18, '#1d1d1b'); dia(g, x, y, 11, '#f7f2e6'); dia(g, x, y, 5, '#b3261e'); }
      g.strokeStyle = '#f7f2e6'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    }),
    dress: () => tex('dress', 256, 256, (g, w, h) => {
      g.fillStyle = '#f7f2e6'; g.fillRect(0, 0, w, h);
      for (let y = 14; y < h - 50; y += 28) for (let x = (y / 28 % 2) * 14 + 8; x < w; x += 28) { g.fillStyle = ['#b3261e', '#2f5d8a', '#2f6b3a'][(x + y) % 3]; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
      g.fillStyle = '#b3261e'; g.fillRect(0, h - 40, w, 26); g.fillStyle = '#1d1d1b'; for (let x = 8; x < w; x += 20) dia(g, x, h - 27, 7, '#1d1d1b');
    }),
    belt: () => tex('belt', 128, 32, (g, w, h) => {
      ['#d6336c', '#7048e8', '#1c7ed6', '#d6336c'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 8, w, 8); });
      g.fillStyle = '#fff'; for (let x = 0; x < w; x += 16) g.fillRect(x, 14, 6, 4);
    }),
    bandM: () => tex('bandM', 256, 32, (g, w, h) => { g.fillStyle = '#f7f2e6'; g.fillRect(0, 0, w, h); for (let x = 12; x < w; x += 24) { dia(g, x, 16, 11, '#b3261e'); dia(g, x, 16, 5, '#1d1d1b'); } g.fillStyle = '#1d1d1b'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); }),
    bandF: () => tex('bandF', 256, 32, (g, w, h) => { const cs = ['#b3261e', '#f2c230', '#2f9e44', '#1c7ed6']; for (let x = 0; x < w; x += 16) { g.fillStyle = cs[(x / 16) % 4]; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 16, 0); g.lineTo(x + 8, h); g.fill(); g.fillStyle = cs[(x / 16 + 2) % 4]; g.beginPath(); g.moveTo(x + 8, h); g.lineTo(x + 24, h); g.lineTo(x + 16, 0); g.fill(); } }),
    face: (gender, elder) => tex('face' + gender + (elder ? 'e' : ''), 512, 256, (g, w, h) => {
      g.fillStyle = SKIN; g.fillRect(0, 0, w, h);
      const cx = 128;
      // Patas 額紋
      g.fillStyle = PATAS; g.globalAlpha = .85; g.fillRect(cx - 9, 62, 18, 46); g.globalAlpha = 1;
      if (gender === 'm') { g.fillStyle = PATAS; g.globalAlpha = .8; g.fillRect(cx - 12, 186, 24, 20); g.globalAlpha = 1; }
      else { g.fillStyle = PATAS; g.globalAlpha = .6; g.beginPath(); g.moveTo(cx - 62, 150); g.quadraticCurveTo(cx, 200, cx + 62, 150); g.lineTo(cx + 62, 168); g.quadraticCurveTo(cx, 220, cx - 62, 168); g.fill(); g.globalAlpha = 1; }
      // 眼
      [-24, 24].forEach(dx => { g.fillStyle = '#2a1d17'; g.beginPath(); g.ellipse(cx + dx, 132, 8, 11, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + dx + 3, 127, 3, 0, 7); g.fill(); });
      if (elder) { g.strokeStyle = '#d8d2c8'; g.lineWidth = 4; [-24, 24].forEach(dx => { g.beginPath(); g.moveTo(cx + dx - 12, 112); g.lineTo(cx + dx + 12, 110); g.stroke(); }); }
      g.fillStyle = 'rgba(230,110,110,.35)'; [-44, 44].forEach(dx => { g.beginPath(); g.ellipse(cx + dx, 158, 10, 6, 0, 0, 7); g.fill(); });
      g.strokeStyle = '#7a3a2a'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.arc(cx, 160, 12, .3, Math.PI - .3); g.stroke();
    })
  };

  const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .85, flatShading: false }, o));
  const M = {};
  const getM = (k, f) => M[k] || (M[k] = f());

  /** opts: {gender:'m'|'f', elder, hair, bandAlt} */
  window.makeTrukuCharacter = function (opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const female = opts.gender === 'f';
    const skin = getM('skin', () => mat({ color: SKIN }));
    const hairC = opts.hair || (opts.elder ? 0xc9c4bb : 0x2a1d17);
    const hairM = mat({ color: hairC, roughness: .7 });
    const white = getM('white', () => mat({ color: 0xf7f2e6 }));
    const red = getM('red', () => mat({ color: 0xb3261e }));
    const parts = {};
    // legs
    [-0.12, 0.12].forEach((x, i) => {
      const leg = new THREE.Group(); leg.position.set(x, 0.46, 0);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.075, .07, .46, 8), skin); l.position.y = -0.23; leg.add(l);
      const wrap = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .18, 8), white); wrap.position.y = -0.22; leg.add(wrap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.1, .018, 6, 12), female ? getM('pink', () => mat({ color: 0xd6336c })) : red); ring.rotation.x = Math.PI / 2; ring.position.y = -0.14; leg.add(ring);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(.13, .06, .2), skin); foot.position.set(0, -0.44, .04); leg.add(foot);
      g.add(leg); parts['leg' + i] = leg;
    });
    // body
    if (!female) {
      const tunic = new THREE.Mesh(new THREE.CylinderGeometry(.27, .37, .78, 14), getM('tunic', () => mat({ map: T.stripes() }))); tunic.position.y = .82; g.add(tunic);
      const chest = new THREE.Mesh(new THREE.BoxGeometry(.38, .34, .05), getM('chest', () => mat({ map: T.chest() }))); chest.position.set(0, .98, .27); chest.rotation.x = -0.12; g.add(chest);
    } else {
      const dress = new THREE.Mesh(new THREE.CylinderGeometry(.26, .42, .84, 14), getM('dress', () => mat({ map: T.dress() }))); dress.position.y = .8; g.add(dress);
      const trim = new THREE.Mesh(new THREE.TorusGeometry(.13, .025, 6, 16, Math.PI), red); trim.position.set(0, 1.2, .2); trim.rotation.set(Math.PI * 0.5 + .35, 0, Math.PI); g.add(trim);
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(.31, .32, .1, 14), getM('belt', () => mat({ map: T.belt() }))); belt.position.y = .78; g.add(belt);
      const tc = [0xd6336c, 0x7048e8, 0x1c7ed6, 0xd6336c];
      tc.forEach((c, i) => { const t = new THREE.Mesh(new THREE.BoxGeometry(.03, .26, .03), mat({ color: c })); t.position.set(.1 + i * .045, .62, .29); t.rotation.z = -.1 + i * .06; g.add(t); });
      const neck = new THREE.Mesh(new THREE.TorusGeometry(.17, .025, 6, 18), getM('beads', () => mat({ color: 0x3b5bdb, roughness: .3 }))); neck.position.set(0, 1.18, .05); neck.rotation.x = Math.PI / 2 + .5; g.add(neck);
    }
    // arms
    [-1, 1].forEach((s, i) => {
      const arm = new THREE.Group(); arm.position.set(s * .31, 1.15, 0);
      const a = new THREE.Mesh(new THREE.CylinderGeometry(female ? .085 : .07, female ? .09 : .065, .5, 8), female ? white : skin); a.position.y = -0.25; arm.add(a);
      if (female) { const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.095, .095, .06, 8), red); cuff.position.y = -0.45; arm.add(cuff); }
      const hand = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), skin); hand.position.y = -0.52; arm.add(hand);
      arm.rotation.z = s * .18; g.add(arm); parts['arm' + i] = arm;
    });
    if (opts.elder) { const cane = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.25, 6), mat({ color: 0x7a5230 })); cane.position.set(.42, .62, .12); cane.rotation.z = -.08; g.add(cane); }
    // head
    const head = new THREE.Group(); head.position.y = 1.58; g.add(head); parts.head = head;
    const neckM = new THREE.Mesh(new THREE.CylinderGeometry(.08, .09, .14, 8), skin); neckM.position.y = -0.36; head.add(neckM);
    const face = new THREE.Mesh(new THREE.SphereGeometry(.36, 24, 16), mat({ map: T.face(female ? 'f' : 'm', opts.elder) })); head.add(face);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.38, 20, 12, 0, Math.PI * 2, 0, Math.PI * .42), hairM); cap.position.y = .02; cap.rotation.x = -.18; head.add(cap);
    const back = new THREE.Mesh(new THREE.SphereGeometry(.37, 16, 12), hairM); back.scale.set(1, 1, .7); back.position.set(0, .02, -.1); head.add(back);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.375, .055, 6, 28), getM(female ? 'bandF' : 'bandM', () => mat({ map: female ? T.bandF() : T.bandM() }))); band.rotation.x = Math.PI / 2 - .2; band.position.y = .12; head.add(band);
    if (female) {
      for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.08 - i * .006, 8, 6), hairM); b.position.set(.12, -.15 - i * .13, -.3 - i * .01); head.add(b); }
      const tie = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 6), red); tie.position.set(.12, -.88, -.31); head.add(tie);
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    g.userData.parts = parts; g.userData.phase = Math.random() * 6;
    g.scale.setScalar(opts.scale || .9);
    return g;
  };

  /** 動畫：idle 或 walking(0..1) */
  window.animateTruku = function (g, t, walk) {
    const p = g.userData.parts; if (!p) return;
    const ph = g.userData.phase;
    if (walk > 0.01) {
      const s = Math.sin(t * 10) * .6 * walk;
      p.leg0.rotation.x = s; p.leg1.rotation.x = -s; p.arm0.rotation.x = -s * .8; p.arm1.rotation.x = s * .8;
      p.head.position.y = 1.58 + Math.abs(Math.cos(t * 10)) * .04 * walk;
    } else {
      p.leg0.rotation.x *= .8; p.leg1.rotation.x *= .8; p.arm0.rotation.x *= .8; p.arm1.rotation.x = p.arm1.rotation.x * .8;
      p.head.position.y = 1.58 + Math.sin(t * 2 + ph) * .02;
      p.head.rotation.y = Math.sin(t * .7 + ph) * .25;
    }
  };
})();
