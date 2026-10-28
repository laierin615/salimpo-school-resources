(() => {
 // 教材書屋：Masao 老師的文史資料、我們的繪本、出的書與族語教材；每本書都能在閱讀室翻閱，有 PDF 的可以下載
 const data=window.SCHOOL_DATA,main=document.getElementById('main'),shelves=data.library?.shelves||[],museum=data.historyMuseum;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const heads=(eyebrow,title,note,id)=>`<div class="album-heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h2 id="${id}">${esc(title)}</h2></div>${note?`<p>${esc(note)}</p>`:''}</div>`;
 const read=item=>'reader.html?book='+encodeURIComponent(item.book);
 const pdfs=list=>list?.length?`<div class="library-pdfs"><span>下載 PDF</span>${list.map(p=>`<a href="${esc(p.href)}" download="${esc(p.name)}">${esc(p.label)}<small>${esc(p.size)}</small></a>`).join('')}</div>`:'';
 const book=item=>`<article class="library-book"><a class="library-cover" href="${read(item)}" tabindex="-1" aria-hidden="true"><img src="${esc(item.cover)}" alt="" loading="lazy" decoding="async"></a><div class="library-copy">${item.ami?`<p class="library-ami"><i class="ami" lang="ami">${esc(item.ami)}</i></p>`:''}<h3><a href="${read(item)}">${esc(item.title)}</a></h3><p class="library-by">${esc(item.by)}</p><p>${esc(item.text)}</p><p class="library-meta">${esc(item.meta)} · ${item.pages} 頁</p><a class="text-link" href="${read(item)}">在網站上翻閱 →</a>${pdfs(item.pdfs)}</div></article>`;
 // 文史資料：有內文的每一篇是一本筆記，整個文史資料館與整本文史筆記放在下面
 const articles=museum.topics.filter(t=>t.hasContent);
 const note=t=>`<a class="library-note" href="resource.html?id=${esc(t.resourceId)}"><img src="${esc(data.assets[t.cover].thumb)}" alt="" loading="lazy" decoding="async"><small>${esc(t.subtitle)}</small><strong>${esc(t.title)}</strong></a>`;
 const history=()=>`<div class="library-notes">${articles.map(note).join('')}</div><div class="detail-actions"><a class="button primary" href="museum.html">走進文史資料館：${museum.topics.length} 個主題 →</a><a class="button" href="reader.html?book=historyMuseum">翻閱整本文史筆記 →</a></div>`;
 document.querySelector('a[href="library.html"]')?.setAttribute('aria-current','page');
 main.innerHTML=`<header class="page-heading"><div class="breadcrumb"><a href="index.html">首頁</a><span>/</span><span>教材書屋</span></div><h1>教材書屋</h1><p>翻開 Masao 老師的文史筆記、我們的繪本、出版的山海之書與族語教材。每一本都能在網站上翻閱，繪本和族語教材也可以下載 PDF。</p><nav class="kit-nav" aria-label="書架"><span>書架</span>${shelves.map(s=>`<a href="#shelf-${s.id}">${esc(s.title)}</a>`).join('')}</nav></header><div class="page-body library-page">${shelves.map(s=>`<section class="kit-section library-shelf" id="shelf-${s.id}" aria-labelledby="shelf-${s.id}-title">${heads(s.eyebrow,s.title,s.text,`shelf-${s.id}-title`)}${s.id==='history'?history():`<div class="library-books">${(s.items||[]).map(book).join('')}</div>`}</section>`).join('')}<p class="library-more">想找課堂上用的學習單與簡報？到<a href="lessons.html">山海探索站</a>依主題找，或到<a href="resources.html">資料服務站</a>輸入關鍵字。</p></div>`;
 location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
})();
