/* Truku 山岳學習島：主程式 */
(function () {
  const Q = window.QUEST;
  const $ = s => document.querySelector(s);
  const KEY = 'truku-mountain-quest-3d-v1';
  const ALL = [Q.hub].concat(Q.islands);
  const byId = id => ALL.find(i => i.id === id);

  /* ---------------- 進度 ---------------- */
  const blankLamp = () => Q.lamp.faces.map(f => Object.assign({ on: true }, f));
  let state = load();
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
    s = s || {};
    s.name = s.name || ''; s.cleared = s.cleared || {}; s.best = s.best || {};
    if (!Array.isArray(s.lamp) || s.lamp.length !== Q.lamp.faces.length) s.lamp = blankLamp();
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }
  const clearedCount = () => Q.islands.filter(i => state.cleared[i.id]).length;
  const allClear = () => clearedCount() === Q.islands.length;

  function toast(msg, ms) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), ms || 2600);
  }
  function download(name, href) { const a = document.createElement('a'); a.download = name; a.href = href; document.body.appendChild(a); a.click(); a.remove(); }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- 信物圖示 ---------------- */
  function badgeSVG(icon, on) {
    const c = on ? '#b3261e' : '#9a9387', k = '#1d1d1b';
    const inner = {
      eye: `<path d="M24 8L40 24L24 40L8 24Z" fill="${k}"/><path d="M24 14L34 24L24 34L14 24Z" fill="#f7efe0"/><path d="M24 19L29 24L24 29L19 24Z" fill="${c}"/>`,
      stone: `<ellipse cx="24" cy="27" rx="15" ry="12" fill="#6f6a62"/><path d="M14 24 Q24 14 34 24" stroke="#f7efe0" stroke-width="2" fill="none"/><text x="24" y="31" font-size="10" text-anchor="middle" fill="#fff" font-weight="900">AI</text>`,
      key: `<rect x="10" y="16" width="22" height="16" rx="3" fill="#7a5230"/><circle cx="33" cy="24" r="6" fill="none" stroke="${c}" stroke-width="3"/><path d="M27 24H14M18 24v4M22 24v3" stroke="${c}" stroke-width="3"/>`,
      path: `<path d="M8 40 Q20 30 16 22 T30 8" stroke="${c}" stroke-width="5" fill="none" stroke-dasharray="4 3"/><path d="M30 40L40 30" stroke="${k}" stroke-width="3"/>`,
      crystal: `<circle cx="24" cy="27" r="12" fill="${on ? '#ff7a1a' : '#bdb5a7'}"/><circle cx="21" cy="24" r="4" fill="#fff2b0" opacity=".8"/><path d="M16 12q3-4 0-8M24 12q3-4 0-8M32 12q3-4 0-8" stroke="${c}" stroke-width="2" fill="none"/>`,
      bow: `<path d="M14 6 Q36 24 14 42" stroke="#6b3e1e" stroke-width="4" fill="none"/><path d="M14 6V42" stroke="${k}" stroke-width="1.5"/><path d="M8 24H42" stroke="${c}" stroke-width="3"/><path d="M42 24l-6-4v8z" fill="${c}"/>`,
      torch: `<path d="M20 26h8l-2 16h-4z" fill="#7a5230"/><path d="M24 6 C32 14 30 22 24 26 C18 22 16 14 24 6Z" fill="${on ? '#ff9a3c' : '#bdb5a7'}"/><text x="24" y="22" font-size="8" text-anchor="middle" fill="${k}" font-weight="900">T</text>`,
      weave: `<rect x="6" y="16" width="36" height="16" fill="${c}"/><path d="M12 24l4-5 4 5-4 5zM22 24l4-5 4 5-4 5zM32 24l4-5 4 5-4 5z" fill="${k}"/><path d="M6 16h36M6 32h36" stroke="${k}" stroke-width="2"/>`
    }[icon] || '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="23" fill="${on ? '#fff6d6' : '#efe9de'}" stroke="${on ? '#8a6a00' : '#c9c0b0'}" stroke-width="2"/>${inner}</svg>`;
  }

  /* ---------------- 3D 世界與介面 ---------------- */
  const stage = $('#stage');
  let lastCard = null;
  let world = null;
  const mini = $('#minimap');
  const canMove = () => !panel.classList.contains('open') && !$('#modal').classList.contains('on') && !$('#onboard').classList.contains('on');
  try {
    world = createWorld(stage, Q, {
      onIsland: id => showCard(id),
      onCharacter: id => { showCard(id); openIsland(id, 'talk'); },
      onHouse: () => openIsland('hub', 'house'),
      onNear: id => showNear(id),
      onTalk: id => openIsland(id, 'talk'),
      canMove, paused: () => $('#modal').classList.contains('on') || (panel.classList.contains('open') && innerWidth < 900), minimap: mini, isCleared: id => !!state.cleared[id]
    });
  } catch (err) {
    console.warn(err);
    stage.innerHTML = '<div class="nogl"><h2>此裝置無法顯示 3D 群島</h2><p>請改用「文字清單」進入各島學習，所有教材、對話與測驗都能正常使用。</p></div>';
  }

  /* 島嶼卡（鏡頭飛入後） */
  function showCard(id) {
    const i = byId(id); if (!i) return; lastCard = id;
    world && world.flyTo(id);
    const done = state.cleared[id];
    $('#isleCard').innerHTML = `<p class="eyebrow">EXPLORE THIS ISLAND・${i.no ? '第 ' + i.no + ' 座山' : '中央島'}</p>
      <h2><span class="num">${i.no ? String(i.no).padStart(2, '0') : '★'}</span>${i.name}</h2><p class="sub">${esc(i.sub)}</p>
      ${done ? `<p class="got">✓ 已取得信物「${i.badge}」</p>` : i.badge ? `<p class="small">登頂信物：${i.badge}</p>` : ''}
      <div class="row">${id === 'hub' ? '<button class="btn primary" data-o="house">走進 3D 家屋</button>' : ''}
        <button class="btn ${id === 'hub' ? '' : 'primary'}" data-o="md">教材</button><button class="btn" data-o="talk">${id === 'hub' ? '和 Baki 說話' : '島主與島民'}</button>
        ${i.quiz ? '<button class="btn" data-o="quiz">登頂測驗</button>' : ''}</div>
      <div class="row"><button class="linkbtn" data-o="walk">🚶 走到這座島</button><button class="linkbtn" data-o="home">⌖ 回到全景</button></div>`;
    $('#isleCard').classList.add('on');
    markBar(id);
  }
  $('#isleCard').addEventListener('click', e => {
    const b = e.target.closest('[data-o]'); if (!b) return; const o = b.dataset.o;
    if (o === 'home') { hideCard(); world && world.home(); }
    else if (o === 'walk') { world && world.teleport(lastCard); hideCard(); }
    else openIsland(lastCard, o);
  });
  function hideCard() { $('#isleCard').classList.remove('on'); markBar(null); }

  /* 靠近島主提示 */
  function showNear(id) {
    const n = $('#nearTip');
    if (!id) { n.classList.remove('on'); return; }
    const i = byId(id), h = Q.characters[i.host];
    n.innerHTML = `<span>${charSVG(i.host)}</span><span>你來到 <b>${i.name}</b>！<br><small>按 <kbd>E</kbd> 或點這裡和 ${h.name} 說話</small></span>`;
    n.classList.add('on'); n.onclick = () => openIsland(id, 'talk');
  }

  /* 側欄課程清單 */
  const TAGS = { datong: 'AI 素養', qingshui: 'AI 素養', dali: 'AI 素養', zhuilu: '文化 Gaya', hilagan: '文化 Gaya', tianxiang: '科學探究', hehuan: 'AI 素養', dayuling: '人機共創' };
  function renderList() {
    const q = ($('#search').value || '').trim(), f = $('#filter').value;
    const list = Q.islands.filter(i => (!f || TAGS[i.id] === f) && (!q || (i.name + i.sub + TAGS[i.id] + i.badge).includes(q)));
    $('#courseList').innerHTML = list.map(i => `<li><button data-go="${i.id}" class="${state.cleared[i.id] ? 'done' : ''}"><span class="n">${String(i.no).padStart(2, '0')}</span><span class="t"><b>${i.name}</b><small>${esc(i.sub)}</small><em>${TAGS[i.id]}${state.cleared[i.id] ? '・✓ ' + i.badge : ''}</em></span><span class="go">↗</span></button></li>`).join('') || '<li class="small">找不到符合的島嶼</li>';
  }
  $('#search').oninput = renderList; $('#filter').onchange = renderList;
  $('#courseList').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { showCard(b.dataset.go); if (innerWidth < 900) $('#side').classList.remove('open'); } });
  $('#goHub').onclick = () => { showCard('hub'); if (innerWidth < 900) $('#side').classList.remove('open'); };
  $('#btnSide').onclick = () => $('#side').classList.toggle('open');

  /* 底部島嶼列 */
  function renderBar() {
    $('#isleBar').innerHTML = ALL.map(i => `<button data-go="${i.id}" class="${state.cleared[i.id] ? 'done' : ''}"><span class="n">${i.no ? String(i.no).padStart(2, '0') : '★'}</span><span><b>${i.name}</b><small>${i.no ? (state.cleared[i.id] ? '✓ ' + i.badge : '尚未登頂') : '起點・家屋'}</small></span></button>`).join('');
  }
  function markBar(id) { $('#isleBar').querySelectorAll('button').forEach(b => b.classList.toggle('cur', b.dataset.go === id)); }
  $('#isleBar').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) showCard(b.dataset.go); });

  function renderProgress() {
    const n = clearedCount();
    $('#stampN').textContent = n; $('#stampT').textContent = Q.islands.length;
    $('#lampLock').textContent = allClear() ? '✨' : '🔒';
    $('#btnLamp').classList.toggle('unlocked', allClear());
    $('#readN').textContent = `${n} / ${Q.islands.length} 已登頂`;
    $('#readBar').style.width = (n / Q.islands.length * 100) + '%';
    renderList(); renderBar(); world && world.setCleared(state.cleared);
  }
  function closeDrawer() { if (innerWidth < 900) $('#side').classList.remove('open'); }
  function hideHint() { }
  function flyTo(i) { showCard(i.id); }

  /* 地圖控制 */
  $('#zIn').onclick = () => world && (world.debug.cam.gDist = Math.max(8, world.debug.cam.gDist / 1.3));
  $('#zOut').onclick = () => world && (world.debug.cam.gDist = Math.min(150, world.debug.cam.gDist * 1.3));
  $('#zHome').onclick = () => { hideCard(); world && world.home(); };
  $('#zMe').onclick = () => { hideCard(); world && world.follow(); };

  /* 主題・減少動態・音景 */
  document.querySelectorAll('input[name=theme]').forEach(r => r.onchange = () => { state.theme = r.value; save(); world && world.setTheme(r.value); document.body.dataset.theme = r.value; });
  $('#reduce').onchange = e => { state.reduced = e.target.checked; save(); world && world.setReduced(e.target.checked); };
  const audio = { ctx: null, gain: null, on: false };
  function startAudio() {
    if (audio.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = audio.ctx = new C(); const gain = audio.gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
    // 溪水／風：濾波雜訊
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; src.connect(lp); lp.connect(gain); src.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08; lg.gain.value = 400; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    // 鳥鳴
    (function chirp() {
      if (!audio.ctx) return;
      if (audio.on) {
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); const f = 2200 + Math.random() * 1600;
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.4, t + .08); o.frequency.exponentialRampToValueAtTime(f * .9, t + .16);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.linearRampToValueAtTime(0, t + .18);
        o.connect(g); g.connect(gain); o.start(t); o.stop(t + .2);
      }
      setTimeout(chirp, 900 + Math.random() * 3200);
    })();
  }
  function setVol() { if (audio.gain) audio.gain.gain.setTargetAtTime(audio.on ? $('#vol').value / 100 * .5 : 0, audio.ctx.currentTime, .3); $('#volV').textContent = $('#vol').value + '%'; }
  $('#sound').onclick = () => { startAudio(); audio.on = !audio.on; audio.ctx && audio.ctx.resume(); $('#sound').textContent = audio.on ? '♫ 關閉音景' : '♫ 開啟音景'; $('#sound').setAttribute('aria-pressed', audio.on); setVol(); };
  $('#vol').oninput = setVol;

  /* 搖桿 */
  (function joystick() {
    const j = $('#joy'), k = $('#joyKnob'); let id = null, cx = 0, cy = 0;
    j.addEventListener('pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); });
    j.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
    const end = () => { id = null; k.style.transform = ''; world && world.setJoy(0, 0); };
    j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
    function move(e) {
      if (!canMove()) return;
      let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), R = 40; if (m > R) { dx *= R / m; dy *= R / m; }
      k.style.transform = `translate(${dx}px,${dy}px)`; world && world.setJoy(dx / R, dy / R);
    }
  })();

  /* 文字清單（無障礙／低效能替代） */
  $('#btnText').onclick = () => {
    openModal(head('文字清單・全部島嶼') + `<p class="small">不用 3D 也能完整學習：每座島都可直接開啟教材、對話與測驗。</p><ol class="textlist">${ALL.map(i => `<li><div><b>${i.no ? '第 ' + i.no + ' 座山｜' : '中央島｜'}${i.name}</b>${state.cleared[i.id] ? ' <span class="got">✓ ' + i.badge + '</span>' : ''}<br><small>${esc(i.sub)}</small><br><small>島主：${Q.characters[i.host].name}（${Q.characters[i.host].role}）</small></div>
      <div class="row">${i.id === 'hub' ? `<button class="btn" data-t="hub|house">3D 家屋</button>` : ''}<button class="btn" data-t="${i.id}|md">教材</button><button class="btn" data-t="${i.id}|talk">對話</button>${i.quiz ? `<button class="btn primary" data-t="${i.id}|quiz">測驗</button>` : ''}</div></li>`).join('')}</ol>`);
    $('#modalCard').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const [id, t] = b.dataset.t.split('|'); closeModal(); openIsland(id, t); });
  };

  /* 玩法說明 */
  $('#btnHelp').onclick = () => openModal(head('怎麼玩') + `<ol class="help">
    <li><b>移動</b>：鍵盤 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 或方向鍵；手機用左下搖桿。走過吊橋到各座山。</li>
    <li><b>對話</b>：走近島主會出現提示，按 <kbd>E</kbd> 或點提示；也可以直接點 3D 角色或名牌。</li>
    <li><b>鏡頭</b>：拖曳旋轉、滾輪／雙指縮放、右鍵（或 Shift＋拖曳）平移。點山頭名牌，鏡頭會飛過去。</li>
    <li><b>登頂</b>：每座山 4 題答對 ${Q.passScore} 題，取得信物；八個信物集滿可領 PNG 證書並解鎖「智創洄瀾光雕盒」。</li>
    <li><b>主題</b>：晨光／海霧／夜海；「減少動態」會停止動畫，適合容易暈的同學或較慢的電腦。</li>
    <li><b>進度</b>：存在這台裝置的瀏覽器，可從「進度」匯出、匯入。</li></ol>`);

  /* 開場選角 */
  const AV = Q.avatars;
  function openOnboard(force) {
    if (state.avatar && !force) return;
    let pick = state.avatar || AV[0].id;
    const ob = $('#onboard');
    ob.innerHTML = `<div class="ob-card"><div class="ob-art"><p class="eyebrow">TRUKU・EXPLORE・COLLECT</p><h2>走進太魯閣的山，<br>把 Gaya 一座座帶回家。</h2><div class="ob-chars">${['baki', 'labi', 'watan'].map(k => charSVG(k)).join('')}</div></div>
      <div class="ob-form"><p class="eyebrow">Truku 山岳學習島・選擇角色</p><h2>選擇你的<br>小小 Snaw Balay</h2>
      <p class="small">穿上太魯閣族傳統服飾，走過吊橋，拜訪八座山的島主，集滿 8 個信物。</p>
      <p class="lbl2">選一位你的角色</p><div class="avs">${AV.map(a => `<button data-av="${a.id}" class="${a.id === pick ? 'sel' : ''}" aria-label="${a.label}">${charSVG(a.id)}<small>${a.label}</small></button>`).join('')}</div>
      <div class="field"><label for="obName">座號或暱稱 <small class="small">不用填真實姓名</small></label><input id="obName" maxlength="16" placeholder="例如：601 Labi" value="${esc(state.name)}"></div>
      <button class="btn primary big" id="obGo">從布洛灣台地出發 →</button></div></div>`;
    ob.classList.add('on');
    ob.querySelectorAll('[data-av]').forEach(b => b.onclick = () => { pick = b.dataset.av; ob.querySelectorAll('[data-av]').forEach(x => x.classList.toggle('sel', x === b)); });
    $('#obGo').onclick = () => {
      state.avatar = pick; state.name = $('#obName').value.trim() || state.name; save();
      ob.classList.remove('on'); applyAvatar(); showCard('hub');
      toast('用 WASD／搖桿走走看，靠近 Baki 按 E 說話！', 3600);
    };
  }
  function applyAvatar() {
    const a = AV.find(x => x.id === state.avatar) || AV[0];
    world && world.setPlayer(a, state.name || a.label);
    $('#meChip').innerHTML = `${charSVG(a.id)}<span>${esc(state.name || a.label)}</span>`;
  }
  $('#meChip').onclick = () => openOnboard(true);

  /* ---------------- Markdown 教材同步 ---------------- */
  async function getMD(path) {
    try {
      if (location.protocol === 'file:') throw 0;
      const r = await fetch(path + '?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw 0;
      return { text: await r.text(), live: true };
    } catch (e) {
      return { text: (window.CONTENT && window.CONTENT[path]) || '# 找不到教材\n請確認檔案：' + path, live: false };
    }
  }
  marked.setOptions({ gfm: true, breaks: false });

  /* ---------------- 島嶼面板 ---------------- */
  let cur = null, house = null, tab = null, opened = 0;
  const panel = $('#panel');
  function openIsland(id, first) {
    const i = byId(id); cur = i; closeDrawer(); hideHint(); lastCard = id; world && world.flyTo(id);
    $('#panelNo').textContent = i.no || '★';
    $('#panelTitle').textContent = i.no ? `第 ${i.no} 座山｜${i.name}` : `中央島｜${i.name}`;
    $('#panelSub').textContent = i.sub + (state.cleared[i.id] ? `　✓ 已取得「${i.badge}」` : '');
    const tabs = i.id === 'hub' ? [['house', '3D 家屋'], ['md', '教材'], ['talk', '對話']] : [['md', '教材'], ['talk', '島主與島民'], ['quiz', '登頂測驗']];
    $('#tabs').innerHTML = tabs.map(([k, t]) => `<button role="tab" data-tab="${k}">${t}</button>`).join('');
    panel.classList.add('open'); $('#scrim').classList.add('on');
    showTab(first && tabs.some(t => t[0] === first) ? first : tabs[0][0]);
    $('#isleCard').classList.remove('on');
  }
  function closePanel() {
    panel.classList.remove('open'); $('#scrim').classList.remove('on');
    if (lastCard) showCard(lastCard);
    if (house) { house.dispose(); house = null; }
  }
  $('#panelClose').onclick = closePanel;
  $('#scrim').onclick = () => { closePanel(); closeModal(); };
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });

  async function showTab(k) {
    tab = k;
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === k));
    if (house) { house.dispose(); house = null; }
    const body = $('#panelBody'); body.scrollTop = 0; const i = cur;
    if (k === 'md') {
      body.innerHTML = '<p class="small">讀取教材中…</p>';
      const r = await getMD(i.md); if (tab !== 'md' || cur !== i) return;
      body.innerHTML = `<article class="md">${marked.parse(r.text)}</article>
        <div class="md-src">📄 教材檔：<code>${i.md}</code>（${r.live ? '即時讀取 Markdown' : '內嵌備份；以本機伺服器開啟可即時同步'}）</div>`;
      body.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
    } else if (k === 'talk') renderTalk(body, i);
    else if (k === 'quiz') renderQuiz(body, i);
    else if (k === 'house') {
      body.innerHTML = `<div class="three-wrap" id="houseWrap"><div class="three-ctl">
        <button class="btn" data-mode="trad" aria-pressed="true">傳統桂竹家屋</button>
        <button class="btn" data-mode="ai" aria-pressed="false">主權 AI 基地</button>
        <button class="btn ghost" data-reset style="background:#fffaf1">重設視角</button></div></div>
        <p class="three-cap">拖曳旋轉、滾輪／雙指縮放。切換模式看看：火塘的 <b>熱傳導・熱對流・熱輻射</b>，以及部落自己的 <b>本地伺服器</b>。</p>
        <div class="row"><button class="btn primary" id="goTalk">和 Baki 說話</button><button class="btn" id="goFirst">出發到第 1 座山：大同</button></div>`;
      try { house = createHouse3D($('#houseWrap')); } catch (err) { $('#houseWrap').innerHTML = '<p style="color:#fff;padding:20px">此裝置無法顯示 3D（WebGL 未啟用）。</p>'; }
      body.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { house && house.setMode(b.dataset.mode); body.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      body.querySelector('[data-reset]').onclick = () => house && house.reset();
      $('#goTalk').onclick = () => showTab('talk');
      $('#goFirst').onclick = () => { closePanel(); const d = byId('datong'); flyTo(d); setTimeout(() => openIsland('datong'), 500); };
    }
  }

  /* ---------------- 對話 ---------------- */
  function renderTalk(body, i) {
    const cast = i.id === 'hub' ? ['baki', 'labi', 'watan'] : [i.host, i.villager];
    let idx = 0;
    body.innerHTML = `<div class="stage">${cast.map(c => `<div class="actor" data-c="${c}">${charSVG(c)}<br><span class="nm">${Q.characters[c].name}</span></div>`).join('')}</div>
      <div class="bubble" id="bubble" aria-live="polite"></div>
      <div class="dlg-ctl"><button class="btn" id="prevL">◀ 上一句</button><span class="small" id="lineNo"></span><button class="btn primary" id="nextL">下一句 ▶</button></div>
      <p class="small" style="margin-top:14px">想問 ${Q.characters[i.host].name}：</p>
      <div class="chips">${i.ask.map((a, n) => `<button class="chip" data-ask="${n}">${esc(a[0])}</button>`).join('')}
      ${i.quiz ? '<button class="chip" data-quiz>我準備好登頂測驗了！</button>' : ''}</div>
      <p class="small" style="margin-top:16px">角色服飾：男性白底黑紅直條紋無袖長衫、紅底菱形紋胸兜、幾何紋頭帶與額頭／下巴紋面；女性苧麻白滾紅邊織花長袖衣裙、桃紅紫藍流蘇腰帶、彩色頭帶與額頭／雙頰紋面。</p>`;
    const say = (c, t) => {
      body.querySelectorAll('.actor').forEach(a => a.classList.toggle('talking', a.dataset.c === c));
      $('#bubble').innerHTML = `<b>${Q.characters[c].name}</b>（${Q.characters[c].role}）：${esc(t)}`;
    };
    const show = () => { const [c, t] = i.dialog[idx]; say(c, t); $('#lineNo').textContent = `${idx + 1} / ${i.dialog.length}`; $('#prevL').disabled = idx === 0; $('#nextL').textContent = idx === i.dialog.length - 1 ? '從頭再聽 ↺' : '下一句 ▶'; };
    $('#prevL').onclick = () => { idx = Math.max(0, idx - 1); show(); };
    $('#nextL').onclick = () => { idx = idx === i.dialog.length - 1 ? 0 : idx + 1; show(); };
    body.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => { const a = i.ask[+b.dataset.ask]; say(i.host, a[1]); });
    const qz = body.querySelector('[data-quiz]'); if (qz) qz.onclick = () => showTab('quiz');
    show();
  }

  /* ---------------- 測驗 ---------------- */
  function renderQuiz(body, i) {
    body.innerHTML = `<p>${Q.characters[i.host].name}：「答對 ${Q.passScore} 題以上（共 ${i.quiz.length} 題），就能登頂取得 <b>${i.badge}</b>！」</p>
      <form id="qf">${i.quiz.map((q, n) => `<div class="q" data-n="${n}"><h3>${n + 1}. ${esc(q.q)}</h3><div class="opts">${q.o.map((o, m) => `<label><input type="radio" name="q${n}" value="${m}"><span>${esc(o)}</span></label>`).join('')}</div><div class="exp"></div></div>`).join('')}
      <div class="row"><button class="btn primary" type="submit">交卷</button><span class="small" id="bestS">最佳成績：${state.best[i.id] != null ? state.best[i.id] + ' / ' + i.quiz.length : '尚未作答'}</span></div></form><div id="qres"></div>`;
    $('#qf').onsubmit = e => {
      e.preventDefault();
      const ans = i.quiz.map((q, n) => { const c = body.querySelector(`input[name=q${n}]:checked`); return c ? +c.value : -1; });
      if (ans.includes(-1)) { toast('還有題目沒作答喔！'); body.querySelector(`.q[data-n="${ans.indexOf(-1)}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      let score = 0;
      i.quiz.forEach((q, n) => {
        const ok = ans[n] === q.a; if (ok) score++;
        const box = body.querySelector(`.q[data-n="${n}"]`); box.classList.remove('right', 'wrong'); box.classList.add(ok ? 'right' : 'wrong', 'show');
        box.querySelector('.exp').innerHTML = (ok ? '✅ 答對了！' : `❌ 正確答案：${esc(q.o[q.a])}。`) + ' ' + esc(q.e);
      });
      state.best[i.id] = Math.max(state.best[i.id] || 0, score);
      const pass = score >= Q.passScore, first = pass && !state.cleared[i.id];
      if (pass && !state.cleared[i.id]) state.cleared[i.id] = { score, date: new Date().toISOString() };
      save(); renderProgress(); $('#bestS').textContent = `最佳成績：${state.best[i.id]} / ${i.quiz.length}`;
      const next = Q.islands.find(x => x.no === i.no + 1);
      $('#qres').innerHTML = pass
        ? `<div class="result ok">${badgeSVG(i.badgeIcon, true).replace('<svg', '<svg width="56" height="56"')}<div>登頂成功！${score}/${i.quiz.length}，取得信物「${i.badge}」。${allClear() ? '<br>🎉 八座山全部登頂！可以領證書、點亮光雕盒了！' : ''}</div>
           ${next ? `<button class="btn primary" id="goNext">前往第 ${next.no} 座山：${next.name}</button>` : ''}${allClear() ? '<button class="btn primary" id="goCert">領取紀念證書</button><button class="btn" id="goLamp">點亮光雕盒</button>' : ''}</div>`
        : `<div class="result no">${score}/${i.quiz.length}，還差一點！看看上面的說明，再到「教材」複習後重考。<button class="btn" id="retry">重新作答</button></div>`;
      $('#qres').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (first) { toast(`取得信物「${i.badge}」！`); $('#panelSub').textContent = i.sub + `　✓ 已取得「${i.badge}」`; }
      if (first && allClear()) setTimeout(() => toast('🎉 智創洄瀾光雕盒已解鎖！', 3500), 2700);
      const g = $('#goNext'); if (g) g.onclick = () => { closePanel(); flyTo(next); setTimeout(() => openIsland(next.id), 500); };
      const r = $('#retry'); if (r) r.onclick = () => renderQuiz(body, i);
      const c = $('#goCert'); if (c) c.onclick = () => { closePanel(); openCert(); };
      const l = $('#goLamp'); if (l) l.onclick = () => { closePanel(); openLamp(); };
    };
  }

  /* ---------------- Modal ---------------- */
  let lamp = null;
  function openModal(html) { $('#modalCard').innerHTML = html; $('#modal').classList.add('on'); $('#scrim').classList.add('on'); $('#modalCard').scrollTop = 0; }
  function closeModal() { if (lamp) { lamp.dispose(); lamp = null; } $('#modal').classList.remove('on'); if (!panel.classList.contains('open')) $('#scrim').classList.remove('on'); }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); if (e.target.closest('[data-x]')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#modal').classList.contains('on')) closeModal(); else if (panel.classList.contains('open')) closePanel(); else { hideCard(); } } });
  const head = t => `<div class="mhead"><h2>${t}</h2><button class="iconbtn" data-x aria-label="關閉">✕</button></div>`;
  const badgeGrid = () => `<div class="badges">${Q.islands.map(i => `<div class="badge ${state.cleared[i.id] ? 'on' : ''}">${badgeSVG(i.badgeIcon, !!state.cleared[i.id])}<b>${i.badge}</b><small class="small">${i.name}</small></div>`).join('')}</div>`;

  /* 進度匯入匯出 */
  $('#btnProgress').onclick = () => {
    openModal(head('學習進度') + `<p>已登頂 <b>${clearedCount()} / ${Q.islands.length}</b> 座山。進度存在這台裝置的瀏覽器中；換電腦時請先匯出，再到新電腦匯入。</p>${badgeGrid()}
      <div class="field"><label for="nm">學習者姓名（證書使用）</label><input id="nm" value="${esc(state.name)}" maxlength="20" placeholder="例如：Labi 林小美"></div>
      <div class="row"><button class="btn primary" id="exp">匯出進度 (.json)</button><label class="btn" for="imp" style="display:inline-block">匯入進度</label><input type="file" id="imp" accept=".json,application/json" hidden><button class="btn ghost" id="rst">全部重來</button></div>`);
    $('#nm').oninput = e => { state.name = e.target.value.trim(); save(); };
    $('#exp').onclick = () => {
      const data = Object.assign({ app: 'truku-mountain-quest', version: 1, exportedAt: new Date().toISOString() }, state);
      download(`Truku山岳學習島_進度_${state.name || '學習者'}.json`, URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })));
      toast('已匯出進度檔');
    };
    $('#imp').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => {
        const d = JSON.parse(t); if (d.app !== 'truku-mountain-quest') throw new Error('bad');
        state = { name: d.name || '', avatar: d.avatar || state.avatar, theme: d.theme, cleared: d.cleared || {}, best: d.best || {}, lamp: Array.isArray(d.lamp) && d.lamp.length === Q.lamp.faces.length ? d.lamp : blankLamp() };
        save(); renderProgress(); toast('已匯入進度'); $('#btnProgress').click();
      }).catch(() => toast('這不是 Truku 山岳學習島的進度檔'));
    };
    $('#rst').onclick = () => { if (confirm('確定清除所有登頂紀錄與光雕盒設計？')) { state = { name: '', cleared: {}, best: {}, lamp: blankLamp() }; save(); renderProgress(); closeModal(); toast('已重設'); openOnboard(true); } };
  };

  /* 證書 */
  const svgImg = svg => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  async function drawCert(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    g.fillStyle = '#f4ede1'; g.fillRect(0, 0, W, H);
    const band = (y, h) => { g.fillStyle = '#b3261e'; g.fillRect(0, y, W, h); for (let x = 0; x < W; x += h) { g.fillStyle = '#1d1d1b'; g.beginPath(); g.moveTo(x + h / 2, y + 4); g.lineTo(x + h - 4, y + h / 2); g.lineTo(x + h / 2, y + h - 4); g.lineTo(x + 4, y + h / 2); g.fill(); g.fillStyle = '#f4ede1'; g.beginPath(); g.moveTo(x + h / 2, y + h * .3); g.lineTo(x + h * .7, y + h / 2); g.lineTo(x + h / 2, y + h * .7); g.lineTo(x + h * .3, y + h / 2); g.fill(); } };
    band(0, 56); band(H - 56, 56);
    g.strokeStyle = '#1d1d1b'; g.lineWidth = 4; g.strokeRect(40, 80, W - 80, H - 160);
    g.textAlign = 'center'; g.fillStyle = '#b3261e'; g.font = '700 30px "Noto Sans TC","Microsoft JhengHei",sans-serif';
    g.fillText('Truku 山岳學習島・太魯閣國家公園', W / 2, 150);
    g.fillStyle = '#1d1d1b'; g.font = '900 78px "Noto Serif TC","PMingLiU","Microsoft JhengHei",serif'; g.fillText('登頂紀念證書', W / 2, 250);
    g.font = '900 64px "Noto Serif TC","PMingLiU","Microsoft JhengHei",serif'; g.fillStyle = '#1f3a2b';
    g.fillText(state.name || '學習者', W / 2, 360);
    g.fillRect(W / 2 - 260, 382, 520, 3);
    g.fillStyle = '#1d1d1b'; g.font = '30px "Noto Sans TC","Microsoft JhengHei",sans-serif';
    ['已登上大同、清水山、大禮、錐麓古道、西拉岸、天祥、合歡山、大禹嶺八座學習山岳，', '認識主權 AI、Baki 的誠實、Gaya 與巨人傳說，並以 THINK 鷹架完成人機共創。'].forEach((t, k) => g.fillText(t, W / 2, 445 + k * 46));
    const imgs = await Promise.all(Q.islands.map(i => svgImg(badgeSVG(i.badgeIcon, true))));
    Q.islands.forEach((i, k) => { const x = 230 + k * 163, y = 560; if (imgs[k]) g.drawImage(imgs[k], x - 52, y, 104, 104); g.font = '700 24px "Noto Sans TC","Microsoft JhengHei",sans-serif'; g.fillStyle = '#1d1d1b'; g.fillText(i.badge, x, y + 136); g.font = '20px "Noto Sans TC","Microsoft JhengHei",sans-serif'; g.fillStyle = '#6a645a'; g.fillText(i.name, x, y + 164); });
    const [baki, girl] = await Promise.all([svgImg(charSVG('baki')), svgImg(charSVG('labi'))]);
    if (baki) g.drawImage(baki, 70, 760, 156, 260); if (girl) g.drawImage(girl, W - 226, 760, 156, 260);
    g.fillStyle = '#1f3a2b'; g.font = '700 26px "Noto Sans TC","Microsoft JhengHei",sans-serif';
    g.fillText('建構原鄉知識本土型 LLM 並應用 AI 做探究與創用', W / 2, 820);
    g.font = '22px "Noto Sans TC","Microsoft JhengHei",sans-serif'; g.fillStyle = '#6a645a';
    g.fillText('以太魯閣族狩獵文化與 Gaya 為本位的人機共創探究教學', W / 2, 858);
    g.fillText('花蓮縣秀林鄉 三棧國小・銅門國小　｜　https://ai.truku.tw/showcase', W / 2, 894);
    const d = new Date(); g.fillStyle = '#1d1d1b'; g.font = '700 26px "Noto Sans TC","Microsoft JhengHei",sans-serif';
    g.fillText(`頒發：部落長者 Baki　　${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`, W / 2, 970);
    g.save(); g.translate(W - 300, 960); g.rotate(-.12); g.strokeStyle = '#b3261e'; g.lineWidth = 5; g.strokeRect(-70, -50, 140, 80); g.fillStyle = '#b3261e'; g.font = '900 30px serif'; g.fillText('Smalu', 0, 2); g.restore();
  }
  function openCert() {
    if (!allClear()) {
      openModal(head('紀念證書') + `<div class="locked-box"><p>完成 <b>八座山</b> 的登頂測驗，就能領取 PNG 紀念證書。</p><p>目前：<b>${clearedCount()} / ${Q.islands.length}</b></p>${badgeGrid()}</div>`);
      return;
    }
    openModal(head('登頂紀念證書') + `<div class="field"><label for="cn">證書上的姓名</label><input id="cn" value="${esc(state.name)}" maxlength="20" placeholder="輸入姓名"></div>
      <canvas id="cv" class="cert-preview" width="1600" height="1130"></canvas>
      <div class="row" style="margin-top:10px"><button class="btn primary" id="dl">下載 PNG 證書</button><button class="btn" id="toLamp">點亮光雕盒 ✨</button></div>`);
    const cv = $('#cv'); drawCert(cv);
    $('#cn').oninput = e => { state.name = e.target.value.trim(); save(); drawCert(cv); };
    $('#dl').onclick = async () => { await drawCert(cv); download(`Truku山岳學習島_證書_${state.name || '學習者'}.png`, cv.toDataURL('image/png')); toast('證書已下載'); };
    $('#toLamp').onclick = () => { closeModal(); openLamp(); };
  }
  $('#btnCert').onclick = openCert;

  /* 光雕盒 */
  function openLamp() {
    if (!allClear()) {
      openModal(head('智創洄瀾光雕盒 🔒') + `<div class="locked-box"><p>通過全部八座山的測驗後，就能解鎖「2026 科技賦能・智創洄瀾光雕盒」：自由旋轉、點亮五面圓窗、自訂文化圖騰與共創金句，並匯出成果。</p><p>目前：<b>${clearedCount()} / ${Q.islands.length}</b></p>${badgeGrid()}</div>`);
      return;
    }
    const L = Q.lamp, faces = state.lamp; let sel = 0;
    const colors = [['#b3261e', '太魯閣紅'], ['#1d1d1b', '墨黑'], ['#2f6b3a', '山林綠'], ['#1f4e79', '溪水藍'], ['#7a3e9d', '織帶紫'], ['#d6336c', '桃紅'], ['#c27c0e', '水晶金']];
    openModal(head('2026 科技賦能・智創洄瀾光雕盒') + `<div class="lamp-grid">
      <div><div class="lamp-stage" id="lampStage"><div class="lamp-tip">拖曳旋轉・滾輪縮放・點一面開關燈</div></div>
        <div class="row" style="margin-top:8px"><button class="btn" id="allOn">全部點亮</button><button class="btn" id="allOff">全部熄滅</button><button class="btn" id="spin" aria-pressed="true">自動旋轉：開</button></div></div>
      <div>
        <div class="facebtns" id="fbtn"></div>
        <div class="field"><label for="fmotif">文化圖騰</label><select id="fmotif">${Object.entries(L.motifs).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div class="field"><label for="fcolor">主色</label><select id="fcolor">${colors.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></div>
        <div class="field"><label for="ftext">共創金句（可換行）</label><textarea id="ftext" maxlength="60"></textarea></div>
        <div class="chips" id="quotes">${L.quotes.map((q, n) => `<button class="chip" data-q="${n}">${esc(q)}</button>`).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn" id="fon"></button><button class="btn ghost" id="freset">恢復影片原設計</button></div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="lpng">匯出成果 PNG</button><button class="btn" id="ljson">匯出設計 JSON</button></div>
        <p class="small">設計會自動存在進度裡；匯出進度檔時一併帶走。</p>
      </div></div>`);
    lamp = createLamp($('#lampStage'), faces, { onPick: key => { const n = faces.findIndex(f => f.key === key); sel = n; faces[n].on = !faces[n].on; commit(); } });
    function syncForm() {
      const f = faces[sel];
      $('#fbtn').innerHTML = faces.map((x, n) => `<button class="${n === sel ? 'sel' : ''}" data-f="${n}"><span class="bulb ${x.on ? 'on' : ''}"></span>${x.label}</button>`).join('');
      $('#fmotif').value = f.motif; $('#fcolor').value = f.color; $('#ftext').value = f.text; $('#fon').textContent = f.on ? '💡 這一面：熄燈' : '💡 這一面：點亮';
    }
    function commit() { save(); lamp && lamp.refresh(); syncForm(); }
    $('#fbtn').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { sel = +b.dataset.f; syncForm(); } };
    $('#fmotif').onchange = e => { faces[sel].motif = e.target.value; commit(); };
    $('#fcolor').onchange = e => { faces[sel].color = e.target.value; commit(); };
    $('#ftext').oninput = e => { faces[sel].text = e.target.value; save(); lamp.refresh(); };
    $('#quotes').onclick = e => { const b = e.target.closest('[data-q]'); if (b) { faces[sel].text = L.quotes[+b.dataset.q]; commit(); } };
    $('#fon').onclick = () => { faces[sel].on = !faces[sel].on; commit(); };
    $('#allOn').onclick = () => { faces.forEach(f => f.on = true); commit(); };
    $('#allOff').onclick = () => { faces.forEach(f => f.on = false); commit(); };
    $('#spin').onclick = e => { lamp.ctl.setAuto(!lamp.ctl.auto); e.target.textContent = '自動旋轉：' + (lamp.ctl.auto ? '開' : '關'); };
    $('#freset').onclick = () => { const d = blankLamp()[sel]; faces[sel] = d; commit(); };
    $('#ljson').onclick = () => download(`光雕盒設計_${state.name || '學習者'}.json`, URL.createObjectURL(new Blob([JSON.stringify({ app: 'truku-lamp', faces }, null, 2)], { type: 'application/json' })));
    $('#lpng').onclick = () => {
      const snap = lamp.snapshot(), out = document.createElement('canvas'); out.width = 1200; out.height = 1500;
      const g = out.getContext('2d'); const bg = g.createRadialGradient(600, 700, 50, 600, 700, 900); bg.addColorStop(0, '#3a2a1c'); bg.addColorStop(1, '#120d09'); g.fillStyle = bg; g.fillRect(0, 0, 1200, 1500);
      g.textAlign = 'center'; g.fillStyle = '#ffcf6b'; g.font = '900 52px "Noto Serif TC","PMingLiU","Microsoft JhengHei",serif'; g.fillText('2026 科技賦能・智創洄瀾光雕盒', 600, 90);
      g.fillStyle = '#f4ede1'; g.font = '28px "Noto Sans TC","Microsoft JhengHei",sans-serif'; g.fillText(`創作者：${state.name || '學習者'}　｜　Truku 山岳學習島`, 600, 140);
      const sw = snap.width, sh = snap.height, sc = Math.min(1100 / sw, 860 / sh); g.drawImage(snap, 600 - sw * sc / 2, 180 + (860 - sh * sc) / 2, sw * sc, sh * sc);
      const mini = document.createElement('canvas'); mini.width = mini.height = 200;
      faces.forEach((f, n) => { drawLampFace(mini, f, true); g.drawImage(mini, 50 + n * 224, 1080, 200, 200); g.fillStyle = '#f4ede1'; g.font = '700 24px "Noto Sans TC","Microsoft JhengHei",sans-serif'; g.fillText(f.label + (f.on ? ' 💡' : ''), 150 + n * 224, 1316); });
      g.fillStyle = '#c9bfae'; g.font = '22px "Noto Sans TC","Microsoft JhengHei",sans-serif';
      g.fillText('建構原鄉知識本土型 LLM 並應用 AI 做探究與創用　｜　https://ai.truku.tw/showcase', 600, 1420);
      download(`智創洄瀾光雕盒_${state.name || '學習者'}.png`, out.toDataURL('image/png')); toast('光雕盒成果已匯出');
    };
    syncForm();
  }
  $('#btnLamp').onclick = openLamp;


  /* ---------------- 啟動 ---------------- */
  if (state.theme) { const r = document.querySelector(`input[name=theme][value=${state.theme}]`); if (r) { r.checked = true; world && world.setTheme(state.theme); document.body.dataset.theme = state.theme; } }
  if (state.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches) { $('#reduce').checked = true; world && world.setReduced(true); }
  if (innerWidth >= 900) $('#side').classList.add('open');
  renderProgress(); applyAvatar();
  const m = location.hash.match(/island=(\w+)/);
  if (m && byId(m[1])) { if (!state.avatar) { state.avatar = AV[0].id; applyAvatar(); } openIsland(m[1]); }
  else if (!state.avatar) openOnboard(); else showCard('hub');
  window.__quest = { state: () => state, openIsland, openCert, openLamp, showCard, world: () => world, setState(s) { state = s; save(); renderProgress(); } };
})();
