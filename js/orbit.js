/* 輕量環繞控制：拖曳旋轉、滾輪／雙指縮放（可離線、免模組） */
window.MiniOrbit = function (camera, dom, opt) {
  opt = Object.assign({ target: new THREE.Vector3(), dist: 8, min: 3, max: 16, theta: 0.6, phi: 1.1, minPhi: 0.25, maxPhi: 1.5, auto: false }, opt || {});
  const s = { theta: opt.theta, phi: opt.phi, dist: opt.dist, tt: opt.theta, tp: opt.phi, td: opt.dist, auto: opt.auto, moved: false };
  const pts = new Map(); let pinch0 = 0, d0 = 0;
  function apply() {
    s.theta += (s.tt - s.theta) * 0.18; s.phi += (s.tp - s.phi) * 0.18; s.dist += (s.td - s.dist) * 0.18;
    const t = opt.target;
    camera.position.set(t.x + s.dist * Math.sin(s.phi) * Math.sin(s.theta), t.y + s.dist * Math.cos(s.phi), t.z + s.dist * Math.sin(s.phi) * Math.cos(s.theta));
    camera.lookAt(t);
  }
  dom.addEventListener('pointerdown', e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY }); s.moved = false; dom.setPointerCapture(e.pointerId); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); d0 = s.td; } });
  dom.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    if (pts.size === 1) {
      s.tt -= (e.clientX - p.x) * 0.008; s.tp = Math.min(opt.maxPhi, Math.max(opt.minPhi, s.tp - (e.clientY - p.y) * 0.006));
    }
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) > 5) s.moved = true;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) s.td = Math.min(opt.max, Math.max(opt.min, d0 * pinch0 / d)); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);
  dom.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); s.td = Math.min(opt.max, Math.max(opt.min, s.td * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
  return {
    update(dt) { if (s.auto && !pts.size) s.tt += (dt || 0.016) * 0.35; apply(); },
    setAuto(v) { s.auto = v; }, get auto() { return s.auto; },
    get moved() { return s.moved; },
    reset() { s.tt = opt.theta; s.tp = opt.phi; s.td = opt.dist; }
  };
};
