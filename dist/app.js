(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  menu?.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    nav.classList.toggle('is-open', expanded);
    menu.textContent = expanded ? '收起選單' : '選單';
  });

  let themeButton = document.getElementById('theme-toggle');
  if (!themeButton && document.querySelector('.header-inner')) {
    themeButton = document.createElement('button');
    themeButton.id = 'theme-toggle'; themeButton.className = 'pill inner-theme';
    themeButton.type = 'button'; themeButton.setAttribute('aria-label','切換白天與夜晚');
    document.querySelector('.header-inner').insertBefore(themeButton, menu);
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeButton) { themeButton.textContent = theme === 'night' ? '夜晚' : '白天'; themeButton.setAttribute('aria-pressed',String(theme === 'night')); }
    window.dispatchEvent(new CustomEvent('salimpo:theme',{detail:theme}));
  }
  try { applyTheme(localStorage.getItem('salimpo-theme') || 'day'); } catch { applyTheme('day'); }
  themeButton?.addEventListener('click',()=> {
    const theme = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
    try { localStorage.setItem('salimpo-theme',theme); } catch {}
    applyTheme(theme);
  });

  const data = window.SCHOOL_DATA;
  const resources = data.resources;
  const main = document.getElementById('main');
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const resourceURL = id => 'resource.html?id=' + encodeURIComponent(id);
  const resourceById = id => resources.find(resource => resource.id === id);
  const term = resource => resource.termLabel || resource.event?.dateLabel || (resource.year ? `${resource.year}${resource.semester === 1 ? '上' : resource.semester === 2 ? '下' : '學年度'}` : '課程總覽');
  const tags = resource => [...resource.bands,...resource.topics];
  const pageTitles = {visits:'原民會訪視專區',museum:'文史資料館',partnerships:'合作計畫',journeys:'我們怎麼學',about:'認識學校',learning:'課程與教材',stories:'活動與成果',reviews:'評鑑與訪視',resources:'資料查找',resource:'資料內容'};
  if (pageTitles[page]) {
    document.title = `${pageTitles[page]}｜Salimpo 學校資料館`;
    nav?.querySelectorAll('a').forEach(a => { if (a.getAttribute('href') === `${page}.html`) a.setAttribute('aria-current','page'); });
  }
  const heading = (title,description,parent='') => `<header class="page-heading"><div class="breadcrumb"><a href="index.html">首頁</a><span>/</span>${parent?`<a href="${parent.url}">${esc(parent.title)}</a><span>/</span>`:''}<span>${esc(title)}</span></div><h1>${esc(title)}</h1>${description?`<p>${esc(description)}</p>`:''}</header>`;
  const asset = id => data.assets?.[id];
  const cover = (resource,thumb=false) => {const a=asset(resource.cover);return a?(thumb?a.thumb:a.src):resource.coverPage;};
  const illustration = r => `<div class="editorial-cover ${esc(r.coverStyle||'learning')}" aria-hidden="true"><span>${esc(r.type)}</span><b>${r.event?(r.event.result.includes('首獎')?'全國首獎':r.event.result.includes('第一名')?'第一名':r.event.result.includes('金熊')?'金熊獎':r.event.result.includes('優等')?'優等':r.event.result.includes('第三名')?'第三名':'精彩成果'):r.coverStyle==='reviews'?'24':r.coverStyle==='assessment'?'學習的<br>新發現':'山海之間'}</b><i>Salimpo · Learning Stories</i></div>`;
  const card = resource => `<article class="resource-card visual-card"><a class="card-image ${resource.coverFit==='contain'?'image-contain':''}" href="${resourceURL(resource.id)}" tabindex="-1" aria-hidden="true">${cover(resource,true)?`<img src="${esc(cover(resource,true))}" alt="" loading="lazy" decoding="async">`:illustration(resource)}</a><div class="card-copy"><span class="type-label">${esc(resource.type)}</span><h3><a href="${resourceURL(resource.id)}">${esc(resource.title)}</a></h3><div class="meta-line"><span>${esc(term(resource))}</span>${resource.bands.map(band=>`<span>${esc(band)}</span>`).join('')}</div><p>${esc(resource.summary)}</p>${resource.event?`<p class="event-result"><span>成果亮點</span>${esc(resource.event.result)}</p>`:''}<div class="tags">${resource.topics.map(topic=>`<span class="tag">${esc(topic)}</span>`).join('')}</div><div class="card-bottom"><a class="text-link" href="${resourceURL(resource.id)}" aria-label="查看${esc(resource.title)}">${resource.event?'看看這次的精彩 →':'走進這段故事 →'}</a>${resource.photos?.length?`<span>${resource.photos.length} 張影像</span>`:''}</div></div></article>`;
  const journeyLinks = match => (data.journeys||[]).filter(match).map(j=>`<a class="reading-entry" href="journeys.html#${esc(j.id)}"><span>我們怎麼學</span><strong>${esc(j.title)}</strong><small>${[j.term,j.band].filter(Boolean).map(esc).join(' · ')} · ${j.steps.length} 個步驟 <b>↗</b></small></a>`).join('');
  const journeyCallout = () => data.journeys?.length ? `<section class="partner-callout"><div><p class="eyebrow">成果背後的學習路徑</p><h2>一件作品，是怎麼一步步完成的？</h2><p>${data.journeys.length}堂課的步驟卡：畫草圖、試配色、卡關了重來，再把作品說給大家聽。</p></div><a class="button" href="journeys.html">看看我們怎麼學 →</a></section>` : '';
  const readingURL = entry =>`reader.html?book=${encodeURIComponent(entry.book)}${entry.page?'&page='+entry.page:''}${entry.chapter?'&chapter='+entry.chapter:''}`;
  const readingLinks = r => (r.reading||[]).map(entry=>`<a class="reading-entry" href="${readingURL(entry)}"><span>繼續閱讀</span><strong>${esc(entry.label)}</strong><small>${data.books?.[entry.book]?.pages?data.books[entry.book].pages+' 頁':'章節式圖文閱讀'} <b>↗</b></small></a>`).join('');
  const photoButton = (id,title,index,label='學習影像') => {const a=asset(id);return a?`<button type="button" class="photo-open" data-photo="${esc(id)}" data-caption="${esc(title)}｜${esc(label)} ${index+1}" aria-label="放大${esc(title)}照片${index+1}"><img src="${esc(a.thumb)}" alt="${esc(title)}的${esc(label)}" loading="lazy" decoding="async"><span>放大觀看 ↗</span></button>`:'';};
  function bindGallery(r){let shown=24;const photos=r.photos||[];const grid=document.getElementById('photo-gallery');if(!grid)return;const draw=()=>{grid.innerHTML=photos.slice(0,shown).map((id,i)=>photoButton(id,r.title,i,r.photoCaptions?.[id]||r.photoLabel||r.event?.imageLabel||'學習影像')).join('');const button=document.getElementById('gallery-more');if(button){button.hidden=shown>=photos.length;button.textContent=`再看更多照片（${Math.max(0,photos.length-shown)} 張）`;}};document.getElementById('gallery-more')?.addEventListener('click',()=>{shown+=24;draw();});draw();}
  const relatedList = ids => `<div class="related-list">${ids.map(resourceById).filter(Boolean).map(resource=>`<a href="${resourceURL(resource.id)}"><span>${esc(resource.title)}</span><span>${esc(resource.type)}</span></a>`).join('')}</div>`;
  const empty = () => `<div class="empty-state"><h2>這裡還沒找到符合的資料</h2><p>換個關鍵字，或試試其他年段與類型。</p><button type="button" class="button" id="empty-reset">清除篩選</button></div>`;
  function setupCatalog(scope) {
    const records = resources.filter(scope).sort((a,b)=>page==='stories'?(b.event.sortDate.localeCompare(a.event.sortDate)):0);
    const types = [...new Set(records.map(r=>r.type))];
    const years = [...new Set(records.map(r=>page==='stories'?r.event.calendarYear:r.year).filter(Boolean))].sort((a,b)=>b-a);
    const options = (values, selected) => values.map(value=>`<option value="${esc(value)}" ${String(selected)===String(value)?'selected':''}>${esc(value)}</option>`).join('');
    const title=pageTitles[page];
    const description=page==='learning'?'從山海主題出發，翻找課程設計、教案與學習單的線索。':page==='stories'?'從舞台上的歌聲，到競賽裡的亮眼表現，一起看見寧埔師生的精彩。':'想找一份資料？用關鍵字、學年度或年段，快速找到它。';
    main.innerHTML=heading(title,description)+`<div class="page-body">${page==='learning'&&window.curriculumIntro?window.curriculumIntro():''}${page==='learning'?`<nav class="topic-nav" aria-label="教學資料類型"><a href="learning.html">全部教學資料</a><a href="learning.html?type=課程單元">課程單元</a><a href="lessons.html">教案書屋</a><a href="journeys.html">我們怎麼學</a><a href="learning.html?type=學習單">教材與學習單</a><a href="learning.html?type=課程架構">課程架構</a><a href="partnerships.html">合作計畫</a></nav>`:''}${page==='stories'?`${journeyCallout()}${window.partnershipCallout?.()||''}<nav class="topic-nav" aria-label="成果資料類型"><a href="stories.html">全部精彩</a><a href="stories.html?type=展演成果">展演成果</a><a href="stories.html?type=比賽成果">比賽成果</a><a href="stories.html?type=成果展">成果展</a></nav>`:''}<form class="filters ${page==='stories'?'event-filters':''}" id="catalog-form" role="search" aria-label="搜尋${esc(title)}"><label class="filter-field" for="catalog-query">關鍵字<input id="catalog-query" name="q" type="search" value="${esc(params.get('q')||'')}" placeholder="${page==='stories'?'展演、比賽或獎項名稱':'課程、主題或資料名稱'}" maxlength="100"></label><label class="filter-field" for="catalog-year">${page==='stories'?'年份':'學年度'}<select id="catalog-year" name="year"><option value="">${page==='stories'?'全部年份':'全部學年度'}</option>${options(years,params.get('year'))}</select></label><label class="filter-field" for="catalog-band">年段<select id="catalog-band" name="band"><option value="">全部年段</option>${options(page==='stories'?['低年級','中年級','高年級','跨年段','教師團隊']:['低年級','中年級','高年級','跨年段'],params.get('band'))}</select></label><label class="filter-field" for="catalog-type">資料類型<select id="catalog-type" name="type"><option value="">全部類型</option>${options(types,params.get('type'))}</select></label>${page==='stories'?`<label class="filter-field" for="catalog-domain">主題<select id="catalog-domain"><option value="">全部主題</option>${options(data.eventDomains,params.get('domain'))}</select></label>`:''}</form><div class="results-top"><p id="results-count" class="results-count" role="status" aria-live="polite"></p><button type="button" class="reset-button" id="catalog-reset">清除篩選</button></div><div class="resource-grid" id="catalog-results"></div></div>`;
    const form=main.querySelector('#catalog-form');
    const query=main.querySelector('#catalog-query');
    const year=main.querySelector('#catalog-year');
    const band=main.querySelector('#catalog-band');
    const type=main.querySelector('#catalog-type');
    const domain=main.querySelector('#catalog-domain');
    function draw(sync=true){
      const q=query.value.trim().toLocaleLowerCase();
      const list=records.filter(r=>{
        const searchable=[r.title,r.summary,r.type,term(r),...tags(r),r.event?.venue||'',r.event?.result||'',...r.sections.map(s=>s.text)].join(' ').toLocaleLowerCase();
        return (!q||q.split(/\s+/).every(word=>searchable.includes(word)))&&(!year.value||String(page==='stories'?r.event.calendarYear:r.year)===year.value)&&(!band.value||r.bands.includes(band.value))&&(!type.value||r.type===type.value)&&(!domain?.value||r.event?.domain===domain.value);
      });
      main.querySelector('#results-count').textContent=page==='stories'?`找到 ${list.length} 項精彩 · 展演、比賽與成果展`:`找到了 ${list.length} 筆資料（本區共 ${records.length} 筆）`;
      main.querySelector('#catalog-results').innerHTML=list.length?list.map(card).join(''):empty();
      main.querySelector('#empty-reset')?.addEventListener('click',reset);
      if(sync){const url=new URL(location.href);url.search='';for(const [key,value] of [['q',query.value.trim()],['year',year.value],['band',band.value],['type',type.value],['domain',domain?.value||'']]){if(value)url.searchParams.set(key,value);}history.replaceState(null,'',url);}
    }
    function reset(){query.value='';year.value='';band.value='';type.value='';if(domain)domain.value='';draw();query.focus();}
    form.addEventListener('submit',event=>{event.preventDefault();draw();});
    query.addEventListener('input',()=>draw());
    [year,band,type,domain].filter(Boolean).forEach(control=>control.addEventListener('change',()=>draw()));
    main.querySelector('#catalog-reset').addEventListener('click',reset);
    draw(false);
  }
  function showAbout(){
    main.innerHTML=heading('從部落、山與海出發','從部落生活到山海課程，跟著孩子一起發現學習的風景。')+`<div class="page-body split-layout"><div class="prose"><section class="detail-section"><h2>以行求知，用中學</h2><p>學校以「發掘『美』好的山海智慧，培養孩子以行求知、用中學的態度」為願景。山、海與部落生活，都是孩子帶著問題出發的教室。</p><p>從農耕、田野觀察到工藝、家屋與科學探究，孩子動手試、一起做，最後把發現說給更多人聽。</p></section><h2>課程中的三個連結</h2><ol class="framework-list"><li><div><h3>生活與場域</h3><p>從農耕、野菜、潮間帶與部落生活，累積觀察與操作的經驗。</p></div></li><li><div><h3>文化與表達</h3><p>以族語、工藝、樂舞及家屋的學習，練習理解、製作與說明。</p></div></li><li><div><h3>探究與分享</h3><p>將在地知識與科學探究連結，透過紀錄、研究及成果發表分享學習。</p></div></li></ol><div class="detail-actions"><a class="button primary" href="learning.html">瀏覽課程</a><a class="button" href="resource.html?id=PLAN-002">閱讀課程架構</a></div><h2>網站中的資料</h2><p>課程連結教案、教材、活動與成果；同一筆資料能從不同入口查找。各學年度的實施紀錄與正式計畫版本分別保存。</p><p>沿著不同主題瀏覽，也能從搜尋入口回頭找到同一份資料。</p></div><aside class="side-info"><h2>學校資料</h2><dl class="info-dl"><div><dt>學校</dt><dd>臺東縣長濱鄉寧埔國民小學</dd></div><div><dt>課程特色</dt><dd>阿美山海文化實驗教育</dd></div><div><dt>這裡可以看</dt><dd>學校理念、課程與年度成果</dd></div><div><dt>延伸探索</dt><dd>從課程主題連到教案與成果</dd></div></dl></aside></div>`;
  }
  function showResource(){
    const r=resourceById(params.get('id'));
    if(!r){main.innerHTML=heading('這段故事暫時找不到','回到資料查找，換個入口再看看。')+`<a class="button primary" href="resources.html">查找資料</a>`;return;}
    document.title=`${r.title}｜Salimpo 山海故事`;
    if(r.historyTopic&&window.showHistoryArticle){window.showHistoryArticle(r.historyTopic);return;}
    if(r.curriculum===115&&window.renderCurriculum115){main.innerHTML=heading(r.title,r.summary,{title:'課程與教材',url:'learning.html'})+window.renderCurriculum115();return;}
    const route=r.section==='原民會訪視'?'visits.html':r.section==='課程與教材'?'learning.html':r.section==='合作計畫'?'partnerships.html':r.section==='活動與成果'?'stories.html':r.section==='認識學校'?'about.html':'reviews.html';
    main.innerHTML=heading(r.title,r.summary,{title:r.section,url:route})+`<article class="page-body rich-story"><div class="story-hero ${r.coverFit==='contain'?'image-contain':''}">${cover(r)?`<img src="${esc(cover(r))}" alt="${esc(r.title)}的${esc(r.photoLabel||(r.event?'成果紀錄':'學習現場'))}" fetchpriority="high">`:illustration(r)}</div><div class="story-facts"><span>${esc(r.type)}</span><span>${esc(term(r))}</span>${r.bands.map(b=>`<span>${esc(b)}</span>`).join('')}${r.event?.venue?`<span>${esc(r.event.venue)}</span>`:''}${r.photos?.length?`<span>${r.photos.length} 張${r.collaboration?'':r.event?'成果':'學習'}影像</span>`:''}</div>${r.id==='PLAN-016'?'<div class="detail-actions year-map-actions"><a class="button" href="media/curriculum/114-map.png" target="_blank" rel="noopener noreferrer">開啟114高清大圖 ↗</a><a class="button" href="media/curriculum/114-map.png" download="114課程架構圖.png">下載114 PNG</a><a class="button primary" href="resource.html?id=PLAN-002#course-map">看115・116螺旋式課程圖 →</a></div>':''}${window.partnershipDetail?.(r)||''}${r.event?`<div class="event-detail-result"><span>成果亮點</span><strong>${esc(r.event.result)}</strong></div>`:''}<div class="story-layout"><div>${r.sections.map((section,i)=>`<section class="story-chapter" id="chapter-${i+1}"><p class="chapter-number">${String(i+1).padStart(2,'0')} / LEARNING STORY</p><h2>${esc(section.title)}</h2><p>${esc(section.text)}</p></section>`).join('')}</div><aside class="story-reading"><p class="eyebrow">EXPLORE MORE</p><h2>${r.event?'更多精彩':'故事，還有下一頁'}</h2>${readingLinks(r)}${journeyLinks(j=>j.resources.includes(r.id))}${r.id==='LIB-001'?'<a class="reading-entry" href="lessons.html"><strong>按主題找教案</strong><small>31 個單元 · 年段與學期篩選 ↗</small></a>':''}${r.id==='PLAN-013'?'<a class="reading-entry" href="reviews.html"><strong>閱讀全部24項評鑑指標</strong><small>七大面向 ↗</small></a>':''}<nav aria-label="本文章節">${r.sections.map((c,i)=>`<a href="#chapter-${i+1}">${String(i+1).padStart(2,'0')} ${esc(c.title)}</a>`).join('')}</nav></aside></div>${window.partnershipMedia?.(r)||''}${r.photos?.length?`<section class="story-album"><div class="album-heading"><div><p class="eyebrow">MOMENTS IN SALIMPO</p><h2>${esc(r.photoLabel||r.event?.imageLabel||'把學習的瞬間留下來')}</h2></div><p>${r.photos.length} 張影像 · 點照片可以放大</p></div><div class="photo-gallery" id="photo-gallery"></div><button type="button" class="pill gallery-more" id="gallery-more">再看更多照片</button></section>`:''}${r.related.length?`<section class="story-related"><h2>沿著這段故事，繼續走</h2><div class="resource-grid">${(r.collaboration?r.related:r.related.slice(0,4)).map(resourceById).filter(Boolean).map(card).join('')}</div></section>`:''}</article>`;
    bindGallery(r);
  }
  function showHomeFeatures(){const root=document.getElementById('home-stories');if(!root)return;root.innerHTML=`<div class="container"><div class="album-heading"><div><p class="eyebrow">OUR DAYS, OUR STORIES</p><h2>山海裡的每一天</h2></div><a class="text-link" href="learning.html">更多課程與學習紀錄 →</a></div><div class="home-photo-stories">${(data.features||[]).slice(0,3).map(resourceById).filter(Boolean).map(card).join('')}</div>${window.partnershipCallout?.()||''}<div class="reading-shelf"><div><p class="eyebrow">OPEN A NEW CHAPTER</p><h2>翻開一整學期的精彩</h2><p>教案、課程與成果，一頁一頁慢慢看。</p></div>${['PLAN-011','PLAN-012','LIB-001'].map(resourceById).filter(Boolean).map(r=>readingLinks(r)).join('')}</div></div>`;}
  function showReviews(){
    let group=Number(params.get('group')||0);if(!Number.isInteger(group)||group<0||group>7)group=0;
    main.innerHTML=heading('評鑑與訪視','從指標出發，一步步找到課程、成果與評鑑資料的關聯。')+`<div class="page-body"><section class="report-highlight"><p class="eyebrow">115學年度 · 實驗教育評鑑</p><h2>七大面向，24項指標</h2><p>從七大面向出發，點選指標，就能看見相關的課程與學習成果。</p><a href="resource.html?id=PLAN-014">查看訪視流程與導覽資料</a></section><div class="review-layout"><nav class="review-nav" aria-label="評鑑面向"><button type="button" data-group="0" aria-pressed="${group===0}">全部指標</button>${data.groups.map((name,i)=>`<button type="button" data-group="${i+1}" aria-pressed="${group===i+1}">${i+1}. ${esc(name)}</button>`).join('')}</nav><section aria-label="當次指標"><div class="results-top"><h2 id="indicator-heading"></h2><span class="results-count" id="indicator-count" role="status" aria-live="polite"></span></div><div class="indicator-list" id="indicator-results"></div></section></div></div>`;
    function draw(sync=false){
      const records=data.indicators.filter(item=>!group||item.group===group);
      main.querySelector('#indicator-heading').textContent=group?data.groups[group-1]:'全部評鑑指標';
      main.querySelector('#indicator-count').textContent=`${records.length} 項指標`;
      main.querySelector('#indicator-results').innerHTML=records.map(item=>`<article class="indicator"><div class="indicator-head"><span class="indicator-code">${esc(item.code)}</span><h3>${esc(item.title)}</h3></div><p>${esc(item.description)}</p>${item.practice?`<p class="indicator-practice"><b>學校做法</b>${esc(item.practice)}</p>`:''}${item.related.length?`<div class="related-links">${item.related.map(resourceById).filter(Boolean).map(r=>`<a href="${resourceURL(r.id)}">${esc(r.title)}</a>`).join('')}</div>`:''}</article>`).join('');
      main.querySelectorAll('[data-group]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.group)===group)));
      if(sync){const url=new URL(location.href);if(group)url.searchParams.set('group',String(group));else url.searchParams.delete('group');history.replaceState(null,'',url);}
    }
    main.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{group=Number(button.dataset.group);draw(true);}));draw();
  }
  if(page==='home')showHomeFeatures();
  if(page==='partnerships')window.showPartnerships();
  if(page==='journeys')window.showJourneys();
  if(page==='about'){showAbout();const school=resourceById('PLAN-001');if(cover(school))main.querySelector('.page-body').insertAdjacentHTML('beforebegin',`<div class="about-photo"><img src="${esc(cover(school))}" alt="Salimpo 山海課程學習現場"></div>`);main.querySelector('.prose').insertAdjacentHTML('beforeend',`<div class="detail-actions">${readingLinks(school)}</div>`);}

  if(page==='learning'&&params.get('type')==='教案')location.replace('lessons.html');
  else if(page==='learning')setupCatalog(resource=>resource.section==='課程與教材');
  if(page==='stories')setupCatalog(resource=>Boolean(resource.event));
  if(page==='resources')setupCatalog(()=>true);
  if(page==='resource')showResource();
  if(page==='reviews'){showReviews();main.querySelector('.page-body')?.insertAdjacentHTML('afterbegin','<div class="notice"><strong>115年原民會訪視</strong><p>10月30日（五）10:00 · 四大面向與官方表件。</p><a class="text-link" href="visits.html">走進原民會訪視專區 →</a></div>');}
})();
