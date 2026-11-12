/* 太魯閣族傳統服飾角色（SVG 自繪）
 * 男：白底黑紅直條紋無袖長衫、紅底菱形紋胸兜、幾何紋頭帶、額頭／下巴紋面 Patas
 * 女：苧麻白滾紅邊織花長袖衣裙、桃紅紫藍流蘇編織腰帶、彩色頭帶、額頭／雙頰紋面 Patas */
(function () {
  let uid = 0;
  const SKIN = '#e9b48a', SKIN_D = '#c98c62', PATAS = '#4b5a6a';

  function diamondRow(x, y, w, n, c1, c2) {
    let s = '';
    const step = w / n;
    for (let i = 0; i < n; i++) {
      const cx = x + step * (i + 0.5);
      s += `<path d="M${cx} ${y - step * 0.45}L${cx + step * 0.45} ${y}L${cx} ${y + step * 0.45}L${cx - step * 0.45} ${y}Z" fill="${c1}"/>`;
      s += `<path d="M${cx} ${y - step * 0.2}L${cx + step * 0.2} ${y}L${cx} ${y + step * 0.2}L${cx - step * 0.2} ${y}Z" fill="${c2}"/>`;
    }
    return s;
  }

  function male(o, id) {
    const hair = o.elder ? '#bfbab2' : '#2a1d17';
    return `
    <defs>
      <pattern id="st${id}" width="12" height="10" patternUnits="userSpaceOnUse">
        <rect width="12" height="10" fill="#f7f2e6"/>
        <rect x="2" width="2.2" height="10" fill="#1d1d1b"/>
        <rect x="6" width="2.2" height="10" fill="#b3261e"/>
      </pattern>
    </defs>
    <ellipse cx="60" cy="194" rx="30" ry="5" fill="rgba(0,0,0,.18)"/>
    <!-- legs -->
    <rect x="44" y="150" width="11" height="38" rx="4" fill="${SKIN}"/>
    <rect x="65" y="150" width="11" height="38" rx="4" fill="${SKIN}"/>
    <rect x="42" y="166" width="15" height="16" rx="3" fill="#f7f2e6" stroke="#b3261e" stroke-width="1.5"/>
    <rect x="63" y="166" width="15" height="16" rx="3" fill="#f7f2e6" stroke="#b3261e" stroke-width="1.5"/>
    <!-- arms (sleeveless) -->
    <path d="M33 92 Q22 112 26 134" stroke="${SKIN}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="M87 92 Q98 112 94 134" stroke="${SKIN}" stroke-width="10" stroke-linecap="round" fill="none"/>
    ${o.elder ? '<path d="M98 100 L106 192" stroke="#7a5230" stroke-width="4" stroke-linecap="round"/>' : ''}
    <!-- long sleeveless tunic -->
    <path d="M36 86 L84 86 L90 160 L30 160 Z" fill="url(#st${id})" stroke="#1d1d1b" stroke-width="1.5"/>
    <!-- red diamond chest piece -->
    <path d="M44 88 L76 88 L74 124 L46 124 Z" fill="#b3261e" stroke="#1d1d1b" stroke-width="1.2"/>
    ${diamondRow(46, 98, 28, 3, '#1d1d1b', '#f7f2e6')}
    ${diamondRow(46, 113, 28, 3, '#f7f2e6', '#1d1d1b')}
    <path d="M46 124 L74 124" stroke="#f7f2e6" stroke-width="2"/>
    <!-- head -->
    <rect x="54" y="72" width="12" height="14" fill="${SKIN_D}"/>
    <ellipse cx="60" cy="52" rx="26" ry="28" fill="${SKIN}"/>
    <path d="M34 50 Q34 22 60 22 Q86 22 86 50 Q80 36 60 36 Q40 36 34 50Z" fill="${hair}"/>
    <!-- geometric headband -->
    <rect x="33" y="35" width="54" height="9" rx="3" fill="#f7f2e6" stroke="#1d1d1b" stroke-width="1"/>
    ${diamondRow(35, 39.5, 50, 6, '#b3261e', '#1d1d1b')}
    <!-- Patas: forehead + chin -->
    <rect x="57" y="44" width="6" height="10" rx="1.5" fill="${PATAS}" opacity=".85"/>
    <rect x="56" y="70" width="8" height="7" rx="2" fill="${PATAS}" opacity=".8"/>
    <!-- face -->
    <ellipse cx="50" cy="58" rx="3.2" ry="3.8" fill="#2a1d17"/><ellipse cx="70" cy="58" rx="3.2" ry="3.8" fill="#2a1d17"/>
    <circle cx="51" cy="57" r="1" fill="#fff"/><circle cx="71" cy="57" r="1" fill="#fff"/>
    ${o.elder ? '<path d="M44 52 Q50 49 55 52 M65 52 Q70 49 76 52" stroke="#9a948a" stroke-width="2" fill="none"/>' : ''}
    <path d="M53 66 Q60 71 67 66" stroke="#7a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="44" cy="64" rx="4" ry="2.4" fill="#e88" opacity=".35"/><ellipse cx="76" cy="64" rx="4" ry="2.4" fill="#e88" opacity=".35"/>`;
  }

  function female(o, id) {
    const hair = o.elder ? '#c9c4bb' : '#3a2418';
    return `
    <defs>
      <pattern id="fl${id}" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#f7f2e6"/>
        <circle cx="4" cy="4" r="1.5" fill="#b3261e"/><circle cx="11" cy="10" r="1.3" fill="#2f5d8a"/>
        <circle cx="11" cy="3" r="0.9" fill="#2f6b3a"/>
      </pattern>
    </defs>
    <ellipse cx="60" cy="194" rx="30" ry="5" fill="rgba(0,0,0,.18)"/>
    <!-- braid -->
    <path d="M78 50 Q96 90 88 140" stroke="${hair}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M82 70 l8 4 M85 86 l8 3 M86 102 l8 3 M86 118 l7 3" stroke="#1a100b" stroke-width="1.4" opacity=".5"/>
    <!-- legs + leg wraps -->
    <rect x="46" y="156" width="10" height="32" rx="4" fill="${SKIN}"/>
    <rect x="64" y="156" width="10" height="32" rx="4" fill="${SKIN}"/>
    <rect x="44" y="164" width="14" height="18" rx="3" fill="#f7f2e6" stroke="#d6336c" stroke-width="1.8"/>
    <rect x="62" y="164" width="14" height="18" rx="3" fill="#f7f2e6" stroke="#d6336c" stroke-width="1.8"/>
    <!-- long sleeves -->
    <path d="M38 90 Q22 112 28 136" stroke="#f7f2e6" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M82 90 Q98 112 92 136" stroke="#f7f2e6" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M24 128 L33 132 M87 132 L96 128" stroke="#b3261e" stroke-width="3"/>
    <circle cx="29" cy="138" r="5" fill="${SKIN}"/><circle cx="91" cy="138" r="5" fill="${SKIN}"/>
    <!-- ramie dress with red trim -->
    <path d="M38 86 L82 86 L92 162 L28 162 Z" fill="url(#fl${id})" stroke="#b3261e" stroke-width="2.5"/>
    <path d="M30 156 L90 156" stroke="#b3261e" stroke-width="3"/>
    <path d="M52 86 L60 100 L68 86" stroke="#b3261e" stroke-width="2.5" fill="none"/>
    <!-- bead necklace -->
    <path d="M48 88 Q60 108 72 88" stroke="#3b5bdb" stroke-width="3" fill="none" stroke-dasharray="2 2"/>
    <!-- pink/purple/blue tassel belt -->
    <rect x="34" y="118" width="52" height="8" rx="3" fill="#d6336c"/>
    <path d="M34 120 h52" stroke="#7048e8" stroke-width="2" stroke-dasharray="4 3"/>
    <path d="M34 124 h52" stroke="#1c7ed6" stroke-width="2" stroke-dasharray="3 4"/>
    <path d="M70 126 l-2 22 M74 126 l1 22 M78 126 l4 20" stroke="#d6336c" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M72 126 l-1 20 M76 126 l3 21" stroke="#7048e8" stroke-width="2" stroke-linecap="round"/>
    <path d="M74 126 l0 21" stroke="#1c7ed6" stroke-width="2" stroke-linecap="round"/>
    <!-- head -->
    <rect x="54" y="72" width="12" height="14" fill="${SKIN_D}"/>
    <ellipse cx="60" cy="52" rx="26" ry="28" fill="${SKIN}"/>
    <path d="M33 54 Q30 20 60 20 Q90 20 87 54 Q82 34 60 34 Q38 34 33 54Z" fill="${hair}"/>
    <!-- colorful headband -->
    <rect x="32" y="33" width="56" height="9" rx="4" fill="#b3261e"/>
    <path d="M34 37.5 h52" stroke="#f2c230" stroke-width="2.4" stroke-dasharray="5 3"/>
    <path d="M34 40 h52" stroke="#2f9e44" stroke-width="1.6" stroke-dasharray="3 5"/>
    <!-- Patas: forehead + both cheeks -->
    <rect x="57" y="43" width="6" height="10" rx="1.5" fill="${PATAS}" opacity=".85"/>
    <path d="M36 62 Q48 78 60 75 Q72 78 84 62 L84 68 Q72 84 60 81 Q48 84 36 68 Z" fill="${PATAS}" opacity=".55"/>
    <!-- face -->
    <ellipse cx="50" cy="57" rx="3.6" ry="4.2" fill="#2a1d17"/><ellipse cx="70" cy="57" rx="3.6" ry="4.2" fill="#2a1d17"/>
    <circle cx="51.2" cy="55.8" r="1.2" fill="#fff"/><circle cx="71.2" cy="55.8" r="1.2" fill="#fff"/>
    <path d="M54 66 Q60 70 66 66" stroke="#7a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }

  window.charSVG = function (key, cls) {
    const o = (window.QUEST.characters[key]) || { gender: 'm' };
    const id = 'c' + (uid++);
    const body = o.gender === 'f' ? female(o, id) : male(o, id);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="${cls || 'char'}" viewBox="0 0 120 200" role="img" aria-label="${o.name || ''}：太魯閣族傳統服飾">${body}</svg>`;
  };
})();
