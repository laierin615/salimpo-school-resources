(() => {
 // 族語詞庫（教材書屋 › 族語教材）：族語大字、中文小字；點主題看一類，也可以輸入族語或中文找詞（不分大小寫，撇號和空格打不打都可以；一打字就從全部的詞裡找）
 const data=window.SALIMPO_WORDS,main=document.getElementById('main');if(!data||!main)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const plain=v=>String(v).toLowerCase().replace(/['’ʼ\s]/g,''),count=t=>data.words.filter(w=>w.topics.includes(t)).length;
 document.querySelector('a[href="library.html"]')?.setAttribute('aria-current','page');
 const asked=new URLSearchParams(location.search).get('topic');let topic=data.topics.includes(asked)?asked:'';
 main.innerHTML=`<header class="page-heading"><div class="breadcrumb"><a href="index.html">首頁</a><span>/</span><a href="library.html">教材書屋</a><span>/</span><span>族語詞庫</span></div><p class="ami-tag"><i class="ami" lang="ami">sowal</i><span>話語</span></p><h1>族語詞庫</h1><p>老師自編的海岸阿美語詞彙，挑出 tatokem 詞庫或阿美語萌典查得到、意思相符的 ${data.words.length} 個詞，分成 ${data.topics.length} 個主題。點主題看一類，也可以輸入族語或中文找詞。</p></header>
 <div class="page-body words-page"><div class="words-tools"><label class="words-search"><span>找一個詞</span><input id="words-q" type="search" placeholder="例如 aray、野菜" autocomplete="off" autocapitalize="off" spellcheck="false"></label><div class="words-topics" role="group" aria-label="主題">${['',...data.topics].map(t=>`<button type="button" class="words-topic" data-topic="${esc(t)}" aria-pressed="false">${t?esc(t):'全部'}<small>${t?count(t):data.words.length}</small></button>`).join('')}</div></div>
 <p class="words-count" id="words-count" role="status"></p><ul class="words-grid" id="words-grid"></ul><p class="words-empty" id="words-empty" hidden>找不到這個詞，換個寫法試試，或到<a href="https://amis.moedict.tw/" target="_blank" rel="noopener noreferrer">阿美語萌典</a>查。</p>
 <p class="words-source">詞彙來源：Salimpo 老師自編的《海岸阿美語詞資料庫》。中文意思對照 tatokem 詞庫與阿美語萌典（蔡中涵大辭典、潘世光字典）查核；例句還在複核，之後再補上。</p><p class="library-more"><a href="library.html#shelf-language">← 回教材書屋的族語教材</a></p></div>`;
 const q=document.getElementById('words-q'),grid=document.getElementById('words-grid'),say=document.getElementById('words-count'),empty=document.getElementById('words-empty');
 function draw(){const text=q.value.trim(),key=plain(text),list=data.words.filter(w=>text?plain(w.ami).includes(key)||w.zh.includes(text):!topic||w.topics.includes(topic));
  grid.innerHTML=list.map(w=>`<li class="word-card"><i class="ami" lang="ami">${esc(w.ami)}</i><span>${esc(w.zh)}</span></li>`).join('');empty.hidden=list.length>0;
  say.textContent=text?`找「${text}」：${list.length} 個詞`:topic?`${topic}：${list.length} 個詞`:`共 ${list.length} 個詞`;
  document.querySelectorAll('.words-topic').forEach(b=>b.setAttribute('aria-pressed',String(!text&&b.dataset.topic===topic)));}
 document.querySelectorAll('.words-topic').forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.topic;q.value='';const url=new URL(location.href);if(topic)url.searchParams.set('topic',topic);else url.searchParams.delete('topic');history.replaceState(null,'',url);draw();}));
 q.addEventListener('input',draw);draw();
})();
