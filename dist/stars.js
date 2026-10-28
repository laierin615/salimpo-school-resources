// 星空 fo'is：把網站裡的課程、文化、成果與文史畫成一片可以互動的星空，像 Obsidian 的關聯圖。
// 連線只用 data.js 已有的對應：課→九向／主題／課程、九向→三美／四大文化領域、步驟卡→課與相關資料、
// 成果→成果主題、合作計畫與課程單元→相關資料、文史→相同標籤；不自己推測關係。沒有任何連線的星，接到它所在的館。
(() => {
  const GROUPS = [
    {id: 'culture', name: '文化核心', color: '#ffcf6e'},
    {id: 'theme', name: '主題與課程', color: '#6fd3ff'},
    {id: 'lesson', name: '課', color: '#e3eeff'},
    {id: 'journey', name: '學習步驟卡', color: '#c8f26b'},
    {id: 'event', name: '成果', color: '#ff9a7a'},
    {id: 'coop', name: '合作計畫', color: '#4fe3c1'},
    {id: 'history', name: '文史', color: '#c3a8ff'}
  ];
  const KINDS = ['三美', '四大文化領域', '九向', '教案主題', '課程', '課程單元', '課', '學習步驟卡', '成果主題', '成果', '合作計畫', '文史', '館別'];
  const SIZE = {三美: 10, 四大文化領域: 8.5, 九向: 7, 教案主題: 7, 課程: 7, 課程單元: 5.5, 課: 4.2, 學習步驟卡: 5, 成果主題: 6.5, 成果: 4.2, 合作計畫: 6, 文史: 5.5, 館別: 7};
  const NAMED = new Set(['三美', '四大文化領域', '九向', '教案主題', '課程', '成果主題', '合作計畫', '館別']);  // 平常就顯示名字的大星
  const SHOWN = new Set(['學習步驟卡', '課程單元', '文史']);  // 數量少的小星，位置夠就顯示名字
  const HUBS = {history: ['hub:museum', '文史資料館', 'museum.html'], event: ['hub:stories', '成果廣場', 'stories.html'], journey: ['hub:journeys', '我們怎麼學', 'journeys.html'], lesson: ['hub:lessons', '教案書屋', 'lessons.html'], theme: ['hub:lessons', '教案書屋', 'lessons.html'], coop: ['hub:partners', '合作計畫', 'partnerships.html'], culture: ['hub:learning', '山海探索站', 'learning.html']};

  function buildGraph(d) {
    const nodes = [], links = [], byId = new Map(), pairs = new Set();
    const add = (id, group, kind, label, more = {}) => {
      if (!byId.has(id)) { const n = {id, group, kind, label, title: label, summary: '', meta: '', href: '', ...more}; nodes.push(n); byId.set(id, n); }
      return byId.get(id);
    };
    const link = (a, b) => {
      const key = a < b ? a + '|' + b : b + '|' + a;
      if (a !== b && byId.has(a) && byId.has(b) && !pairs.has(key)) { pairs.add(key); links.push({source: a, target: b}); }
    };
    const term = (year, semester) => year ? year + '學年度' + (semester === 1 ? '上學期' : semester === 2 ? '下學期' : '') : '';
    const c = d.curriculum115 || {};

    // 三美九向與四大文化領域
    for (const core of c.cores || []) {
      add('core:' + core.code, 'culture', '三美', core.title, {summary: core.description || '', href: 'learning.html#course-core'});
      for (const dir of core.directions || []) {
        add('dir:' + dir.code, 'culture', '九向', dir.title, {meta: `${dir.code}・${core.title}`, summary: (dir.items || []).join('、'), href: 'learning.html#course-core'});
        link('dir:' + dir.code, 'core:' + core.code);
      }
    }
    for (const [name, codes, text] of c.domains || []) {
      add('domain:' + name, 'culture', '四大文化領域', name.replace(/（.*）/, ''), {title: name, meta: codes, summary: text || '', href: 'learning.html#course-integration'});
      for (const code of String(codes).split(/[、,，\s]+/)) link('domain:' + name, 'dir:' + code);
    }

    // 教案主題、課程與每一堂課
    for (const topic of d.lessonTopics || []) add('topic:' + topic, 'theme', '教案主題', topic, {href: 'lessons.html?topic=' + encodeURIComponent(topic)});
    for (const l of d.lessons || []) {
      if (l.course) add('course:' + l.course, 'theme', '課程', l.course, {href: 'lessons.html?q=' + encodeURIComponent(l.course)});
      add('lesson:' + l.id, 'lesson', '課', l.title, {summary: l.summary || '', meta: [l.band, l.course, term(l.year, l.semester)].filter(Boolean).join('・'), href: 'lessons.html?lesson=' + encodeURIComponent(l.id)});
      link('lesson:' + l.id, 'topic:' + l.topic);
      link('lesson:' + l.id, 'course:' + l.course);
      link('lesson:' + l.id, 'dir:' + (c.lessonDirections || {})[l.id]);
    }

    // 成果、合作計畫，以及步驟卡或合作計畫提到的課程單元（它們把課和成果接起來）
    const res = new Map((d.resources || []).map(r => [r.id, r]));
    const head = title => title.split('｜')[0];
    const addResource = (id, group, kind, label) => {
      const r = res.get(id);
      return r && add('res:' + id, group, kind, label(r.title), {title: r.title, summary: r.summary || '', meta: [r.year ? r.year + '學年度' : '', ...(r.bands || [])].filter(Boolean).join('・'), href: 'resource.html?id=' + encodeURIComponent(id)});
    };
    for (const domain of d.eventDomains || []) add('eventDomain:' + domain, 'event', '成果主題', domain, {href: 'stories.html?domain=' + encodeURIComponent(domain)});
    for (const id of d.eventIds || []) {
      addResource(id, 'event', '成果', head);
      for (const topic of res.get(id)?.topics || []) link('res:' + id, 'eventDomain:' + topic);
    }
    for (const id of d.partnershipIds || []) addResource(id, 'coop', '合作計畫', head);
    const mentioned = [...(d.journeys || []).flatMap(j => j.resources || []), ...(d.partnershipIds || []).flatMap(id => res.get(id)?.related || [])];
    // 課程單元用冒號後的短名；短名和別的星同名（例如教案主題「服飾與工藝」）就用全名
    const unitName = title => { const tail = title.split('：').pop(); return nodes.some(n => n.label === tail) ? title.replace('：', '・') : tail; };
    for (const id of mentioned) if (res.get(id)?.type === '課程單元') {
      addResource(id, 'theme', '課程單元', unitName);
      for (const topic of res.get(id).topics || []) link('res:' + id, 'topic:' + topic);
    }
    for (const j of d.journeys || []) {
      add('journey:' + j.id, 'journey', '學習步驟卡', j.short || j.title, {title: j.title, summary: j.lead || '', meta: [j.band, j.course, j.term].filter(Boolean).join('・'), href: 'journeys.html#' + encodeURIComponent(j.id)});
      for (const id of j.lessons || []) link('journey:' + j.id, 'lesson:' + id);
      for (const id of j.resources || []) link('journey:' + j.id, 'res:' + id);
      link('journey:' + j.id, 'course:' + j.course);
    }
    for (const n of nodes) if (n.id.startsWith('res:')) for (const id of res.get(n.id.slice(4)).related || []) link(n.id, 'res:' + id);

    // 文史：有完整內容的主題；標籤相同就連，標籤和九向同名也連
    const dirByTitle = new Map((c.cores || []).flatMap(core => core.directions || []).map(dir => [dir.title, 'dir:' + dir.code]));
    const stories = (d.historyMuseum?.topics || []).filter(t => t.hasContent);
    for (const t of stories) {
      add('history:' + t.id, 'history', '文史', t.title, {title: t.subtitle ? `${t.title}｜${t.subtitle}` : t.title, summary: t.summary || '', meta: (t.tags || []).join('、'), href: 'museum.html?topic=' + encodeURIComponent(t.id)});
      for (const tag of t.tags || []) if (dirByTitle.has(tag)) link('history:' + t.id, dirByTitle.get(tag));
    }
    stories.forEach((a, i) => stories.slice(i + 1).forEach(b => { if ((a.tags || []).some(tag => (b.tags || []).includes(tag))) link('history:' + a.id, 'history:' + b.id); }));

    const linked = new Set(links.flatMap(l => [l.source, l.target]));
    for (const n of [...nodes]) if (!linked.has(n.id) && HUBS[n.group]) {
      const [id, label, href] = HUBS[n.group];
      add(id, n.group, '館別', label, {href});
      link(n.id, id);
    }
    return {nodes, links};
  }

  window.SALIMPO_STARS = {buildGraph, GROUPS};
  const sky = typeof document !== 'undefined' && document.getElementById('sky');
  if (!sky || !window.SCHOOL_DATA) return;

  const {nodes, links} = buildGraph(window.SCHOOL_DATA);
  const group = Object.fromEntries(GROUPS.map(g => [g.id, g]));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const near = new Map(nodes.map(n => [n.id, new Set()]));
  for (const l of links) { l.a = byId.get(l.source); l.b = byId.get(l.target); near.get(l.source).add(l.target); near.get(l.target).add(l.source); }
  for (const n of nodes) { n.deg = near.get(n.id).size; n.r = (SIZE[n.kind] || 5) + Math.sqrt(n.deg) * 1.1; }
  for (const l of links) { l.k = 1 / Math.min(l.a.deg, l.b.deg); l.bias = l.a.deg / (l.a.deg + l.b.deg); l.rest = 30 + 4.2 * (l.a.r + l.b.r); }

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;'}[c]));
  const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const motion = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const byKind = (a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.label.localeCompare(b.label, 'zh-Hant');

  // 力導向排列：互斥＋連線彈簧＋向中心；用固定亂數種子先跑完，所以每次打開的星空都一樣
  let seed = 115;
  const rand = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (const n of nodes) { const a = rand() * Math.PI * 2, r = 40 + rand() * 320; n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; n.vx = n.vy = 0; }
  let alpha = 1, dragging = null;
  function tick() {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || .01, min = a.r + b.r + 16;
        let w = -(50 + 11 * (a.r + b.r)) * alpha / d2;
        if (d2 < min * min) w -= (min - Math.sqrt(d2)) / Math.sqrt(d2) * .3;
        a.vx += dx * w; a.vy += dy * w; b.vx -= dx * w; b.vy -= dy * w;
      }
    }
    for (const l of links) {
      const a = l.a, b = l.b;
      let dx = b.x + b.vx - a.x - a.vx, dy = b.y + b.vy - a.y - a.vy;
      const d = Math.hypot(dx, dy) || .01, s = (d - l.rest) / d * alpha * l.k;
      dx *= s; dy *= s;
      b.vx -= dx * l.bias; b.vy -= dy * l.bias; a.vx += dx * (1 - l.bias); a.vy += dy * (1 - l.bias);
    }
    for (const n of nodes) {
      if (n === dragging) { n.vx = n.vy = 0; continue; }
      n.vx = (n.vx - n.x * .015 * alpha) * .6; n.vy = (n.vy - n.y * .015 * alpha) * .6;
      n.x += n.vx; n.y += n.vy;
    }
  }
  for (let i = 0; i < 320; i++) { tick(); alpha *= .978; }
  alpha = 0;

  const canvas = document.getElementById('sky-canvas'), ctx = canvas.getContext('2d');
  const card = document.getElementById('sky-card'), tip = document.getElementById('sky-tip'), status = document.getElementById('sky-status');
  const legend = document.getElementById('sky-legend'), form = document.getElementById('sky-search'), input = document.getElementById('sky-q');
  let W = 0, H = 0, dpr = 1, backdrop = null, fitted = false;
  const cam = {x: 0, y: 0, k: 1}, MIN = .1, MAX = 3.2;
  const toScreen = (x, y) => [(x - cam.x) * cam.k + W / 2, (y - cam.y) * cam.k + H / 2];
  const toWorld = (x, y) => [(x - W / 2) / cam.k + cam.x, (y - H / 2) / cam.k + cam.y];
  const starR = n => n.r * Math.pow(cam.k, .55);
  const hidden = new Set();
  const visible = n => !hidden.has(n.group);
  let hovered = null, selected = null;

  // 每種星的光暈先畫好，畫面上只要貼圖
  const glow = Object.fromEntries(GROUPS.map(g => {
    const c = document.createElement('canvas'), x = c.getContext('2d'), grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    c.width = c.height = 64;
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.16, hexA(g.color, .95)); grad.addColorStop(.4, hexA(g.color, .3)); grad.addColorStop(1, hexA(g.color, 0));
    x.fillStyle = grad; x.fillRect(0, 0, 64, 64);
    return [g.id, c];
  }));

  // 夜空底圖：漸層、斜斜的銀河光帶與細小星點；另有一些會閃爍的星塵
  function makeBackdrop() {
    backdrop = document.createElement('canvas');
    backdrop.width = Math.round(W * dpr); backdrop.height = Math.round(H * dpr);
    const b = backdrop.getContext('2d'), sky = b.createLinearGradient(0, 0, 0, H);
    b.scale(dpr, dpr);
    sky.addColorStop(0, '#040a18'); sky.addColorStop(.62, '#0a1a33'); sky.addColorStop(1, '#0f3049');
    b.fillStyle = sky; b.fillRect(0, 0, W, H);
    let s = 7;
    const r = () => (s = s * 16807 % 2147483647) / 2147483647, band = t => H * (.86 - .72 * t);
    for (let i = 0; i < 46; i++) {
      const t = r(), x = t * W, y = band(t) + (r() - .5) * H * .1, rad = H * (.12 + r() * .14), g = b.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(150,175,255,.05)'); g.addColorStop(1, 'rgba(150,175,255,0)');
      b.fillStyle = g; b.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    b.fillStyle = '#dfe8ff';
    for (let i = 0, count = Math.round(W * H / 700); i < count; i++) {
      const t = r(), inBand = r() < .6, x = inBand ? t * W : r() * W, y = inBand ? band(t) + (r() + r() + r() - 1.5) / 1.5 * H * .09 : r() * H, size = r() < .9 ? .7 : 1.3;
      b.globalAlpha = .12 + r() * .4; b.fillRect(x, y, size, size);
    }
  }
  const dust = Array.from({length: 110}, () => ({x: rand(), y: rand(), s: rand() < .85 ? 1 : 1.8, a: .35 + rand() * .55, v: .0008 + rand() * .002, p: rand() * 7}));
  let meteor = null, nextMeteor = performance.now() + 5000;

  const widths = new Map();
  const face = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif', TINY = '600 11px ' + face, FONT = '600 12px ' + face, BIG = '700 13px ' + face;
  const measure = (text, font) => { const key = font + text; if (!widths.has(key)) { ctx.font = font; widths.set(key, ctx.measureText(text).width); } return widths.get(key); };

  function draw(time) {
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(backdrop, 0, 0, W, H);
    const px = -cam.x * cam.k * .04, py = -cam.y * cam.k * .04;
    ctx.fillStyle = '#fff';
    for (const s of dust) {
      ctx.globalAlpha = motion ? s.a * (.55 + .45 * Math.sin(time * s.v + s.p)) : s.a;
      ctx.fillRect(((s.x * W + px) % W + W) % W, ((s.y * H + py) % H + H) % H, s.s, s.s);
    }
    if (motion) {
      if (!meteor && time > nextMeteor) meteor = {t0: time, x: W * (.35 + rand() * .6), y: H * rand() * .35};
      if (meteor) {
        const p = (time - meteor.t0) / 900, x = meteor.x - p * 220, y = meteor.y + p * 120, g = ctx.createLinearGradient(x, y, x + 90, y - 50);
        if (p >= 1) { meteor = null; nextMeteor = time + 7000 + rand() * 9000; }
        else { g.addColorStop(0, `rgba(255,255,255,${.8 * (1 - p)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y - 50); ctx.stroke(); }
      }
    }

    const focus = hovered || selected, lit = focus && new Set([focus.id, ...near.get(focus.id)]);
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
    ctx.strokeStyle = lit ? 'rgba(160,195,255,.07)' : 'rgba(160,195,255,.18)';
    ctx.beginPath();
    for (const l of links) {
      if (!visible(l.a) || !visible(l.b) || (focus && (l.a === focus || l.b === focus))) continue;
      const [x1, y1] = toScreen(l.a.x, l.a.y), [x2, y2] = toScreen(l.b.x, l.b.y);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    if (focus) {
      const [fx, fy] = toScreen(focus.x, focus.y);
      ctx.strokeStyle = hexA(group[focus.group].color, .8); ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const id of near.get(focus.id)) { const o = byId.get(id); if (!visible(o)) continue; const [x, y] = toScreen(o.x, o.y); ctx.moveTo(fx, fy); ctx.lineTo(x, y); }
      ctx.stroke();
    }

    for (const n of nodes) {
      if (!visible(n)) continue;
      const [x, y] = toScreen(n.x, n.y), r = starR(n), color = group[n.group].color;
      if (x < -60 || y < -60 || x > W + 60 || y > H + 60) continue;
      ctx.globalAlpha = lit && !lit.has(n.id) ? .16 : 1;
      ctx.drawImage(glow[n.group], x - r * 3, y - r * 3, r * 6, r * 6);
      if (NAMED.has(n.kind)) {
        ctx.strokeStyle = hexA(color, .45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - r * 2.6, y); ctx.lineTo(x + r * 2.6, y); ctx.moveTo(x, y - r * 2.6); ctx.lineTo(x, y + r * 2.6); ctx.stroke();
      }
      if (n === selected) {
        ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x, y, r * 1.9 + (motion ? Math.sin(time / 300) * 1.5 : 0), 0, Math.PI * 2); ctx.stroke();
      }
    }

    // 名字：大星平常就顯示，放大或滑到某顆星時再多顯示；互相重疊的就先略過
    const wanted = [];
    for (const n of nodes) {
      if (!visible(n)) continue;
      const p = n === selected ? 5 : n === hovered ? 4.5 : lit ? (lit.has(n.id) ? 3 : 0) : NAMED.has(n.kind) ? 2 : SHOWN.has(n.kind) && cam.k >= .3 ? 1.5 : cam.k >= 1.35 ? 1 : 0;
      if (p) wanted.push([p, n]);
    }
    wanted.sort((a, b) => b[0] - a[0] || b[1].r - a[1].r);
    const boxes = [];
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1;
    const small = cam.k < .5;  // 拉遠看全景時字小一號
    for (const [p, n] of wanted) {
      const [x, y0] = toScreen(n.x, n.y), y = y0 + starR(n) * 1.3 + 3, font = NAMED.has(n.kind) || p >= 4.5 ? (small ? FONT : BIG) : (small ? TINY : FONT), w = measure(n.label, font) + 6;
      const box = [x - w / 2, y, x + w / 2, y + 17];
      if (p < 4.5 && boxes.some(b => b[0] < box[2] && box[0] < b[2] && b[1] < box[3] && box[1] < b[3])) continue;
      boxes.push(box);
      ctx.font = font; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(3,8,20,.9)'; ctx.strokeText(n.label, x, y);
      ctx.fillStyle = NAMED.has(n.kind) ? group[n.group].color : '#eef4ff'; ctx.fillText(n.label, x, y);
    }
  }

  // 畫面更新：排列還在動、拖曳中或鏡頭移動時每格都畫；平常只讓星塵閃爍，降到每秒二十幾格，看不到星空就停
  let raf = 0, lastDraw = 0, tween = null, inView = true;
  function frame(time) {
    raf = 0;
    const busy = alpha > .003 || dragging || tween;
    if (busy || time - lastDraw > 45) {
      if (alpha > .003 || dragging) { tick(); alpha = dragging ? Math.max(alpha, .25) : alpha * .96; }
      if (tween) {
        const p = Math.min(1, (time - tween.t0) / tween.ms), e = p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        for (const key of ['x', 'y', 'k']) cam[key] = tween.from[key] + (tween.to[key] - tween.from[key]) * e;
        if (p === 1) tween = null;
      }
      draw(time); lastDraw = time;
    }
    if (busy || (motion && inView && !document.hidden)) raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function go(x, y, k, animate) {
    if (!animate || !motion) { Object.assign(cam, {x, y, k}); tween = null; }
    else tween = {from: {...cam}, to: {x, y, k}, t0: performance.now(), ms: 520};
    wake();
  }
  function fit(animate) {
    const shown = nodes.filter(visible);
    if (!shown.length) return;
    const xs = shown.map(n => n.x), ys = shown.map(n => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    // 留邊用螢幕像素算：左右要放得下名字、右邊還有縮放按鈕，名字寫在星星下方所以下緣多留一點
    const k = clamp(Math.min((W - 150) / (x1 - x0 || 1), (H - 100) / (y1 - y0 || 1)), MIN, 1.6);
    go((x0 + x1) / 2 + 22 / k, (y0 + y1) / 2 + 14 / k, k, animate);
  }
  function zoomAt(sx, sy, f) {
    const [wx, wy] = toWorld(sx, sy);
    tween = null; cam.k = clamp(cam.k * f, MIN, MAX); cam.x = wx - (sx - W / 2) / cam.k; cam.y = wy - (sy - H / 2) / cam.k;
    wake();
  }
  function resize() {
    const rect = sky.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    makeBackdrop();
    if (!fitted && W && H) {
      // 第一次量到大小才排鏡頭：星空的長邊和畫面不同方向（例如直立的手機）就整片轉 90 度；
      // 網址帶著某顆星（#lesson:L-A-01）就直接飛過去
      fitted = true;
      const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
      if ((W >= H) !== (Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys))) for (const n of nodes) [n.x, n.y] = [n.y, -n.x];
      fit(false);
      const start = byId.get(decodeURIComponent(location.hash.slice(1)));
      if (start) select(start, true);
    }
    draw(performance.now());
  }

  // 介紹卡：種類、名字、簡介、前往那一頁，以及相連的星星（點了就飛過去）
  function select(n, fly) {
    selected = n || null; hovered = null;
    sky.classList.toggle('has-card', !!selected);
    try { history.replaceState(null, '', selected ? '#' + encodeURIComponent(selected.id) : location.pathname + location.search); } catch {}
    if (!selected) { card.hidden = true; card.innerHTML = ''; wake(); return; }
    const others = [...near.get(n.id)].map(id => byId.get(id)).sort(byKind), kinds = [...new Set(others.map(o => o.kind))];
    card.innerHTML = `<div class="sky-card-head"><span class="sky-chip" style="--c:${group[n.group].color}">${esc(n.kind)}</span><button type="button" class="sky-card-close" aria-label="關閉介紹">×</button></div>
      <h2>${esc(n.title)}</h2>${n.meta ? `<p class="sky-card-meta">${esc(n.meta)}</p>` : ''}${n.summary ? `<p class="sky-card-summary">${esc(n.summary)}</p>` : ''}
      ${n.href ? `<a class="sky-card-go" href="${esc(n.href)}">前往這一頁 →</a>` : ''}
      <h3>相連的星星 <span>${others.length}</span></h3>
      <div class="sky-card-near">${kinds.map(kind => `<p><b>${esc(kind)}</b>${others.filter(o => o.kind === kind).map(o => `<button type="button" data-star="${esc(o.id)}" style="--c:${group[o.group].color}">${esc(o.label)}</button>`).join('')}</p>`).join('')}</div>`;
    card.hidden = false; card.scrollTop = 0;
    status.textContent = `${n.kind}：${n.title}，相連 ${others.length} 顆星。`;
    if (fly) {
      const k = Math.max(cam.k, 1.25), wide = W > 620;
      go(n.x - (wide ? 175 : 0) / k, n.y + (wide ? 0 : H * .24) / k, k, true);
    }
    wake();
  }
  card.addEventListener('click', e => {
    const star = e.target.closest('[data-star]');
    if (star) select(byId.get(star.dataset.star), true);
    else if (e.target.closest('.sky-card-close')) { select(null); canvas.focus({preventScroll: true}); }
  });

  function hit(sx, sy) {
    let best = null, bestD = Infinity;
    for (const n of nodes) {
      if (!visible(n)) continue;
      const [x, y] = toScreen(n.x, n.y), d = Math.hypot(x - sx, y - sy);
      if (d < Math.max(starR(n) * 1.4, 11) && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  // 滑鼠與觸控：按住星星可以拖動它，按住空白處拖曳整片星空，兩指縮放；沒有移動就當作點一下
  const pointers = new Map();
  let press = null, pinch = null;
  const at = e => { const rect = canvas.getBoundingClientRect(); return [e.clientX - rect.left, e.clientY - rect.top]; };
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    sky.classList.add('touched');
    pointers.set(e.pointerId, at(e));
    if (pointers.size === 2) {
      const [[x1, y1], [x2, y2]] = [...pointers.values()];
      pinch = {d: Math.hypot(x2 - x1, y2 - y1) || 1, k: cam.k, world: toWorld((x1 + x2) / 2, (y1 + y2) / 2)};
      if (dragging) dragging = null;
      press = null; return;
    }
    const [x, y] = at(e);
    press = {node: hit(x, y), x, y, moved: 0};
    tween = null;
  });
  canvas.addEventListener('pointermove', e => {
    const [x, y] = at(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [x, y]);
    if (pinch && pointers.size === 2) {
      const [[x1, y1], [x2, y2]] = [...pointers.values()], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      cam.k = clamp(pinch.k * Math.hypot(x2 - x1, y2 - y1) / pinch.d, MIN, MAX);
      cam.x = pinch.world[0] - (mx - W / 2) / cam.k; cam.y = pinch.world[1] - (my - H / 2) / cam.k;
      wake(); return;
    }
    if (!press) {
      const n = e.pointerType === 'mouse' ? hit(x, y) : null;
      if (n !== hovered) { hovered = n; canvas.style.cursor = n ? 'pointer' : 'grab'; wake(); }
      return;
    }
    press.moved += Math.abs(x - press.x) + Math.abs(y - press.y);
    if (press.moved < 5) return;
    if (press.node) { [press.node.x, press.node.y] = toWorld(x, y); dragging = press.node; alpha = Math.max(alpha, .3); }
    else { cam.x -= (x - press.x) / cam.k; cam.y -= (y - press.y) / cam.k; canvas.style.cursor = 'grabbing'; }
    press.x = x; press.y = y;
    wake();
  });
  const release = e => {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; return; }
    if (!press) return;
    if (press.moved < 5) select(press.node, false);
    dragging = null; press = null;
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
    wake();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (hovered && !press) { hovered = null; wake(); } });
  let tipTimer;
  canvas.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) {
      tip.textContent = '按住 Ctrl（Mac 按 ⌘）再滾動，就能縮放星空'; tip.hidden = false;
      clearTimeout(tipTimer); tipTimer = setTimeout(() => { tip.hidden = true; }, 1600);
      return;
    }
    e.preventDefault();
    const [x, y] = at(e);
    zoomAt(x, y, Math.exp(-e.deltaY * .0025));
  }, {passive: false});
  canvas.addEventListener('keydown', e => {
    const step = 60 / cam.k, pan = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]}[e.key];
    if (pan) { tween = null; cam.x += pan[0]; cam.y += pan[1]; wake(); }
    else if (e.key === '+' || e.key === '=') zoomAt(W / 2, H / 2, 1.25);
    else if (e.key === '-' || e.key === '_') zoomAt(W / 2, H / 2, .8);
    else if (e.key === '0') fit(true);
    else if (e.key === 'Escape') select(null);
    else return;
    e.preventDefault();
  });
  sky.querySelector('.sky-zoom').addEventListener('click', e => {
    const zoom = e.target.closest('[data-zoom]')?.dataset.zoom;
    if (zoom === 'fit') fit(true); else if (zoom) zoomAt(W / 2, H / 2, zoom === 'in' ? 1.3 : 1 / 1.3);
  });

  // 依種類顯示或隱藏
  legend.innerHTML = GROUPS.filter(g => nodes.some(n => n.group === g.id)).map(g => `<button type="button" class="sky-legend-chip" data-group="${g.id}" aria-pressed="true" style="--c:${g.color}"><span aria-hidden="true"></span>${g.name}<small>${nodes.filter(n => n.group === g.id).length}</small></button>`).join('');
  function showGroup(id, on) {
    if (on) hidden.delete(id); else hidden.add(id);
    legend.querySelector(`[data-group="${id}"]`)?.setAttribute('aria-pressed', String(on));
    if (selected && !visible(selected)) select(null);
    wake();
  }
  legend.addEventListener('click', e => { const chip = e.target.closest('[data-group]'); if (chip) showGroup(chip.dataset.group, chip.getAttribute('aria-pressed') !== 'true'); });

  // 找一顆星：同名的星在後面加上年段等資料，好分辨
  const sameName = nodes.reduce((m, n) => (m[n.label] = (m[n.label] || 0) + 1, m), {});
  for (const n of nodes) n.find = sameName[n.label] > 1 ? `${n.label}（${n.meta || n.kind}）` : n.label;
  document.getElementById('sky-names').innerHTML = [...nodes].sort(byKind).map(n => `<option value="${esc(n.find)}">${esc(n.kind)}</option>`).join('');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    const n = nodes.find(n => n.find === q) || nodes.find(n => n.label === q) || nodes.find(n => n.find.includes(q) || n.title.includes(q));
    if (!n) { status.textContent = `找不到「${q}」，換個詞試試。`; tip.textContent = status.textContent; tip.hidden = false; clearTimeout(tipTimer); tipTimer = setTimeout(() => { tip.hidden = true; }, 2200); return; }
    if (!visible(n)) showGroup(n.group, true);
    sky.scrollIntoView({block: 'nearest', behavior: motion ? 'smooth' : 'auto'});
    select(n, true);
  });
  input.addEventListener('change', () => { if (nodes.some(n => n.find === input.value)) form.requestSubmit(); });

  // 清單：不方便看動畫或用鍵盤瀏覽時，所有星星都在這裡
  document.getElementById('sky-list-groups').innerHTML = GROUPS.map(g => {
    const items = nodes.filter(n => n.group === g.id).sort(byKind);
    return items.length ? `<section><h3 style="--c:${g.color}">${g.name}<small>${items.length}</small></h3><ul>${items.map(n => `<li><a href="${esc(n.href)}">${esc(n.label)}</a><span>${esc(n.kind)}</span></li>`).join('')}</ul></section>` : '';
  }).join('');
  document.getElementById('sky-count').textContent = `${nodes.length} 顆星、${links.length} 條連線，來自網站裡的課程架構、教案、學習步驟卡、成果與文史。`;

  new ResizeObserver(resize).observe(sky);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; wake(); }).observe(sky);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('hashchange', () => { const n = byId.get(decodeURIComponent(location.hash.slice(1))); if (n && n !== selected) select(n, true); });
  canvas.style.cursor = 'grab';
  wake();
})();
