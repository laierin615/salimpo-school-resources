(() => {
  const root = document.documentElement;
  const data = window.SCHOOL_DATA || {};
  const page = document.body.dataset.page;
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const icon = id => `<svg class="st-icon" aria-hidden="true"><use href="media/icons.svg#${id}"></use></svg>`;
  const stationIcons = {school:'st-school',course:'st-course',library:'st-book',farm:'st-farm',ocean:'st-ocean',stage:'st-stage',reception:'st-visit',search:'st-search','language-island':'st-island','song-island':'st-song','song-tree':'st-tree'};

  // 圖片：載入前顯示光澤色塊，載入後淡入
  root.classList.add('fx');
  const settle = img => img.classList.remove('fx-wait');
  const watch = img => {
    if (img.dataset.fx) return; img.dataset.fx = '1';
    if (img.complete && img.naturalWidth) return;
    img.classList.add('fx-wait');
    img.addEventListener('load', () => settle(img), {once:true});
    img.addEventListener('error', () => settle(img), {once:true});
    setTimeout(() => settle(img), 8000);
  };

  // 獎牌：依成果文字判斷金、銀、銅與獎章
  const medalOf = result => {
    if (/首獎|第一名|冠軍|特優|金熊|金牌/.test(result)) return ['gold', /首獎/.test(result) ? '首獎' : /特優/.test(result) ? '特優' : /金熊/.test(result) ? '金熊獎' : /冠軍/.test(result) ? '冠軍' : '第一名'];
    if (/第二名|亞軍|銀熊|銀牌/.test(result)) return ['silver', /銀熊/.test(result) ? '銀熊獎' : /亞軍/.test(result) ? '亞軍' : '第二名'];
    if (/第三名|季軍|銅|三等/.test(result)) return ['bronze', /三等/.test(result) ? '三等獎' : '第三名'];
    if (/優等|甲等|佳作|特別獎|領袖獎|入選|優選/.test(result)) return ['ribbon', (result.match(/優等|甲等|佳作|特別獎|領袖獎|入選|優選/) || ['獲獎'])[0]];
    return null;
  };
  const byTitle = new Map((data.resources || []).map(r => [r.title, r]));
  const decorate = el => {
    if (el.matches?.('.resource-card') && !el.querySelector('.medal')) {
      const r = byTitle.get(el.querySelector('h3')?.textContent.trim());
      const m = r?.event && medalOf(r.event.result || '');
      if (m) el.querySelector('.card-image')?.insertAdjacentHTML('afterbegin', `<span class="medal ${m[0]}"><i>★</i>${m[1]}</span>`);
    }
  };

  // 進場動畫：同一排依序浮上來
  const io = !calm && 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px'}) : null;
  const revealSel = '.resource-card,.directory-row,.indicator,.story-chapter,.detail-section,.reading-entry,.fx-stats li,.village-about-grid li,.museum-card,.photo-open,.lesson-card';
  const reveal = el => {
    if (!io || el.classList.contains('fx-reveal')) return;
    const siblings = [...el.parentElement.children];
    el.style.setProperty('--fx-delay', Math.min(siblings.indexOf(el) % 6, 5) * 0.07 + 's');
    el.classList.add('fx-reveal'); io.observe(el);
  };
  const scan = node => {
    if (node.nodeType !== 1) return;
    if (node.tagName === 'IMG') watch(node);
    node.querySelectorAll?.('img').forEach(watch);
    [node, ...(node.querySelectorAll?.(revealSel) || [])].filter(el => el.matches?.(revealSel)).forEach(el => { decorate(el); reveal(el); });
  };
  scan(document.body);
  new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(scan))).observe(document.body, {childList:true, subtree:true});

  // 首頁：站點圖示、地點卡圖示、山海數字
  if (page === 'home') {
    document.querySelectorAll('.directory-row[data-place]').forEach(row => { const id = stationIcons[row.dataset.place]; if (id) row.insertAdjacentHTML('beforeend', icon(id)); });
    const places = [...document.querySelectorAll('.directory-row[data-place]')].map(row => row.dataset.place);
    addEventListener('salimpo:place', e => {
      const card = document.getElementById('place-card'); card.querySelector('.st-icon')?.remove();
      const id = stationIcons[places[e.detail]]; if (id) card.querySelector('.place-meta')?.insertAdjacentHTML('beforebegin', icon(id));
    });
    const pages = Object.values(data.books || {}).reduce((sum, b) => sum + (b.pages || 0), 0);
    const photos = Object.keys(data.assets || {}).length;
    const stats = [
      ['st-stage', (data.eventIds || []).length, '項展演、比賽與社團成果'],
      ['st-book', (data.lessons || []).length, '個教案閱讀主題'],
      ['st-history', (data.historyMuseum?.topics || []).filter(t => t.hasContent).length, '篇族語文史'],
      ['st-ocean', photos, '張學習影像'],
      ['st-course', pages, '頁完整閱讀']
    ].filter(s => s[1] > 0);
    const target = document.getElementById('main');
    target?.insertAdjacentHTML('beforebegin', `<section class="fx-stats" aria-label="山海數字"><div class="container"><p class="eyebrow">SALIMPO IN NUMBERS</p><h2>山海裡，累積了這些</h2><ul>${stats.map(([i, n, label]) => `<li>${icon(i)}<div><b data-count="${n}">${calm ? n.toLocaleString() : 0}</b><span>${label}</span></div></li>`).join('')}</ul></div></section>`);
    if (!calm) {
      const counter = new IntersectionObserver(entries => entries.forEach(e => {
        if (!e.isIntersecting) return; counter.unobserve(e.target);
        const el = e.target, end = Number(el.dataset.count), t0 = performance.now();
        const step = now => { const p = Math.min(1, (now - t0) / 1200); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }), {threshold:.6});
      document.querySelectorAll('.fx-stats b[data-count]').forEach(b => counter.observe(b));
    }
  }

  // 女人島：地點卡上的「聽一小段」，只在按下時播放
  const listen = document.getElementById('place-listen');
  if (listen) {
    let clip = null;
    const stop = () => { clip?.pause(); listen.setAttribute('aria-pressed', 'false'); listen.textContent = '♪ 聽一小段'; };
    addEventListener('salimpo:place', stop);
    addEventListener('salimpo:listen', e => { stop(); if (clip && clip.dataset?.src !== e.detail) clip = null; listen.hidden = !e.detail; listen.dataset.src = e.detail; });
    listen.addEventListener('click', () => {
      if (clip && !clip.paused) { stop(); return; }
      clip = clip || Object.assign(new Audio(listen.dataset.src), {onended: stop});
      clip.currentTime = 0; clip.play().catch(stop);
      listen.setAttribute('aria-pressed', 'true'); listen.textContent = '■ 停止';
    });
  }

  // 活動與成果：年份時間軸（點一下就篩選）
  if (page === 'stories') {
    const select = document.getElementById('catalog-year');
    const events = (data.eventIds || []).map(id => data.resources.find(r => r.id === id)).filter(Boolean);
    const years = [...new Set(events.map(r => r.event.calendarYear).filter(Boolean))].sort((a, b) => b - a);
    if (select && years.length) {
      const bar = document.createElement('div'); bar.className = 'fx-timeline'; bar.setAttribute('aria-label', '依年份看成果');
      const chips = [['', '全部', events.length], ...years.map(y => [String(y), y, events.filter(r => r.event.calendarYear === y).length])];
      bar.innerHTML = chips.map(([v, label, n]) => `<button type="button" data-year="${v}" aria-pressed="${select.value === v}">${label}<small>${n} 項</small></button>`).join('');
      document.getElementById('catalog-form')?.before(bar);
      const sync = () => bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.year === select.value)));
      bar.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; select.value = b.dataset.year; select.dispatchEvent(new Event('change')); sync(); });
      select.addEventListener('change', sync);
      document.getElementById('catalog-reset')?.addEventListener('click', () => setTimeout(sync));
    }
  }

  // 回頂端小船
  const top = document.createElement('button');
  top.type = 'button'; top.className = 'fx-top'; top.setAttribute('aria-label', '回到頂端');
  top.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6v24M24 8l11 18H24" fill="#ffd166" stroke="#0f2030" stroke-width="2.6" stroke-linejoin="round"/><path d="M8 31h32l-5 8H13z" fill="#ff7a59" stroke="#0f2030" stroke-width="2.6" stroke-linejoin="round"/><path d="M4 43c4-2 6 2 10 0s6 2 10 0 6 2 10 0 6 2 10 0" fill="none" stroke="#1d8fb3" stroke-width="2.6" stroke-linecap="round"/></svg>';
  top.addEventListener('click', () => scrollTo({top:0, behavior: calm ? 'auto' : 'smooth'}));
  document.body.append(top);
  addEventListener('scroll', () => top.classList.toggle('is-on', scrollY > 700), {passive:true});
})();
