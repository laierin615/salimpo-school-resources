(() => {
  const data=window.SCHOOL_DATA,museum=data.historyMuseum,main=document.getElementById('main');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topics=museum.topics,articles=topics.filter(t=>t.hasContent);
  const card=t=>`<article class="museum-card"><a class="museum-card-art" href="resource.html?id=${t.resourceId}" tabindex="-1" aria-hidden="true"><img src="${esc(data.assets[t.cover].src)}" alt="" loading="lazy"></a><div class="museum-card-copy"><p class="eyebrow">${esc(t.subtitle)}</p><h3><a href="resource.html?id=${t.resourceId}">${esc(t.title)}</a></h3><p>${esc(t.summary)}</p><div class="tags">${t.tags.map(tag=>`<span class="tag">${esc(tag)}</span>`).join('')}</div><a class="text-link" href="resource.html?id=${t.resourceId}">翻開這篇文史 →</a></div></article>`;
  let bookPromise;
  const book=()=>bookPromise||(bookPromise=fetch('books/historyMuseum.json').then(r=>{if(!r.ok)throw new Error('history');return r.json();}));
  const normalized=text=>text.replace(/\u000b/g,'\n').trim();
  const paragraph=b=>`<p class="history-original ${b.lang==='ami'?'history-ami':''}" lang="${b.lang}" data-native-paragraph="${b.originalParagraph}">${esc(normalized(b.text))}</p>`;
  function bilingual(blocks){
    const content=blocks.filter(b=>b.text.trim());let html='',i=0;
    while(i<content.length){
      if(content[i].lang==='ami'){
        const am=[];while(i<content.length&&content[i].lang==='ami')am.push(content[i++]);
        const zh=[];while(i<content.length&&content[i].lang!=='ami')zh.push(content[i++]);
        html+=zh.length?`<div class="history-pair"><div class="history-language"><span class="language-label">族語</span>${am.map(paragraph).join('')}</div><div class="history-language"><span class="language-label">中文</span>${zh.map(paragraph).join('')}</div></div>`:`<div class="history-single">${am.map(paragraph).join('')}</div>`;
      }else html+=`<div class="history-single">${paragraph(content[i++])}</div>`;
    }
    return html;
  }
  window.showHistoryArticle=async id=>{
    const topic=topics.find(t=>t.id===id&&t.hasContent);if(!topic)return;
    document.title=topic.title+'｜Salimpo 文史資料館';
    main.innerHTML=`<header class="page-heading"><div class="breadcrumb"><a href="index.html">首頁</a><span>/</span><a href="library.html">教材書屋</a><span>/</span><a href="museum.html">文史資料館</a><span>/</span><span>${esc(topic.title)}</span></div><p class="eyebrow">${esc(topic.subtitle)}</p><h1>${esc(topic.title)}</h1><p>${esc(topic.summary)}</p></header><p class="history-loading" role="status">正在翻開文史筆記……</p>`;
    let volume;try{volume=await book();}catch{main.querySelector('.history-loading').innerHTML='這篇暫時打不開。<a class="text-link" href="museum.html">返回文史資料館 →</a>';return;}
    const chapter=volume.chapters[topic.chapter-1],sections=[...topic.sections];
    if(sections[0]?.paragraph>0)sections.unshift({paragraph:0,title:'翻開文史筆記'});
    const index=articles.findIndex(t=>t.id===id),prev=articles[index-1],next=articles[index+1];
    const body=sections.map((s,i)=>`<section class="history-section" id="history-section-${i+1}"><p class="eyebrow">${String(i+1).padStart(2,'0')} / 文史筆記</p><h2>${esc(s.title)}</h2>${bilingual(chapter.blocks.slice(s.paragraph,sections[i+1]?.paragraph??chapter.blocks.length))}</section>`).join('');
    main.innerHTML=`<header class="page-heading"><div class="breadcrumb"><a href="index.html">首頁</a><span>/</span><a href="library.html">教材書屋</a><span>/</span><a href="museum.html">文史資料館</a><span>/</span><span>${esc(topic.title)}</span></div><p class="eyebrow">${esc(topic.subtitle)}</p><h1>${esc(topic.title)}</h1><p>${esc(topic.summary)}</p></header><article class="page-body history-article"><div class="history-top"><img src="${esc(data.assets[topic.cover].src)}" alt="山海文史主題插畫" width="900" height="620"><div><p class="eyebrow">MASAO · CULTURAL STORIES</p><h2>讀族語，也讀部落的生活</h2><p>讓族語與中文相伴，沿著${esc(topic.title)}的記錄，一段一段讀進山海的記憶。</p><div class="tags">${topic.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><a class="text-link" href="#history-section-1">從第一段開始閱讀 ↓</a></div></div><div class="history-layout"><aside class="history-toc"><h2>這篇的閱讀地圖</h2><nav aria-label="文史文章段落">${sections.map((s,i)=>`<a href="#history-section-${i+1}">${String(i+1).padStart(2,'0')} ${esc(s.title)}</a>`).join('')}</nav><a class="text-link" href="reader.html?book=historyMuseum&chapter=${topic.chapter}">翻閱整本文史筆記 ↗</a></aside><div class="history-text">${body}</div></div><nav class="history-next" aria-label="上一篇與下一篇文史">${prev?`<a href="resource.html?id=${prev.resourceId}"><small>← 上一篇</small><strong>${esc(prev.title)}</strong></a>`:'<span></span>'}<a class="history-back" href="museum.html">回到文史資料館</a>${next?`<a href="resource.html?id=${next.resourceId}"><small>下一篇 →</small><strong>${esc(next.title)}</strong></a>`:'<span></span>'}</nav></article>`;
    // 從別頁連到某一段（例如首頁海怪卡連第 5 段「海祭傳說與部落記憶」）：內容是讀完筆記才放上去的，要自己捲過去
    if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView();
  };
  function showMuseum(){
    main.innerHTML=`<header class="page-heading museum-heading"><div class="breadcrumb"><a href="index.html">首頁</a><span>/</span><a href="library.html">教材書屋</a><span>/</span><span>文史資料館</span></div><p class="eyebrow">MASAO · 山海的記憶，族語的聲音</p><h1>文史資料館</h1><p>從海祭與漁撈，到部落的時節與校園日常。翻開Masao的文史筆記，讓族語和中文帶你走進一段段生活記憶。</p></header><div class="page-body museum-page"><section class="museum-opening"><div><p class="eyebrow">把故事，留在山海之間</p><h2>聽見族語，<br>也聽見部落的故事。</h2><p>海祭如何連起人與大海？漁撈之後，大家怎麼分享？一起從文字裡，讀懂部落生活的關係與時序。</p><a class="button primary" href="resource.html?id=HISTORY-001">從海祭開始讀 →</a></div><div class="museum-landscape" aria-hidden="true"><span class="museum-sun"></span><span class="museum-mountain first"></span><span class="museum-mountain second"></span><span class="museum-water"></span><span class="museum-book">族語<br>文化<br>記憶</span><span class="museum-landscape-word">SALIMPO</span></div></section><section class="museum-browse" id="museum-topics"><div class="museum-browse-title"><div><p class="eyebrow">選一個主題，翻開一段故事</p><h2>走進文史的15個門口</h2></div><label class="museum-search" for="museum-query">搜尋文史<input id="museum-query" type="search" placeholder="祭儀、族語或關鍵字" maxlength="100"></label></div><nav class="museum-topic-nav" aria-label="文史主題"><button type="button" data-topic="all" aria-pressed="true">全部文章</button>${topics.map(t=>`<button type="button" data-topic="${t.id}" aria-pressed="false">${esc(t.title)}</button>`).join('')}</nav><p id="museum-count" class="results-count" aria-live="polite"></p><div id="museum-articles" class="museum-grid"></div></section><section class="museum-reading-link"><div><p class="eyebrow">再多讀一點</p><h2>把文史接回課堂，把故事帶回生活</h2><p>從文史筆記走向教案、教材與兩年山海課程，繼續找教學與探究的靈感。</p></div><div class="detail-actions"><a class="button" href="reader.html?book=historyMuseum">翻閱整本文史筆記 →</a><a class="button" href="lessons.html">山海探索站 →</a><a class="text-link" href="resource.html?id=PLAN-002">115・116課程架構 →</a></div></section></div>`;
    let selected=new URLSearchParams(location.search).get('topic')||'all';if(selected!=='all'&&!topics.some(t=>t.id===selected))selected='all';
    const query=main.querySelector('#museum-query'),results=main.querySelector('#museum-articles');
    const searchTexts={};book().then(b=>{for(const c of b.chapters)searchTexts[c.topic]=c.blocks.map(x=>x.text).join(' ').toLocaleLowerCase();if(query.value.trim())draw(false);}).catch(()=>{});
    function draw(sync=true){const q=query.value.trim().toLocaleLowerCase();const filtered=articles.filter(t=>(selected==='all'||t.id===selected)&&(!q||[t.title,t.summary,t.subtitle,...t.tags,searchTexts[t.id]||''].join(' ').toLocaleLowerCase().includes(q)));
      main.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===selected)));
      main.querySelector('#museum-count').textContent=filtered.length?`${filtered.length} 篇文史 · 族語與中文相伴閱讀`:selected==='all'||topics.find(t=>t.id===selected)?.hasContent?'換個關鍵字，繼續找故事。':`${topics.find(t=>t.id===selected).title} · 主題入口`;
      results.innerHTML=filtered.length?filtered.map(card).join(''):`<div class="museum-empty"><h3>${selected==='all'||topics.find(t=>t.id===selected)?.hasContent?'這次還沒找到符合的文章':esc(topics.find(t=>t.id===selected).title)}</h3><p>${selected==='all'||topics.find(t=>t.id===selected)?.hasContent?'試試海祭、漁撈或校慶。':'這個主題目前沒有內文，先讀讀其他山海故事。'}</p><button type="button" class="button" id="museum-reset">看全部文章 →</button></div>`;
      main.querySelector('#museum-reset')?.addEventListener('click',()=>{selected='all';query.value='';draw();});
      if(sync){const url=new URL(location.href);if(selected==='all')url.searchParams.delete('topic');else url.searchParams.set('topic',selected);history.replaceState(null,'',url);}
    }
    main.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.topic;draw();}));query.addEventListener('input',()=>draw(false));draw(false);
  }
  if(document.body.dataset.page==='museum')showMuseum();
})();
