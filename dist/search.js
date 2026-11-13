// 全站搜尋（資料服務站）：關鍵字框除了找 63 筆資料入口，也找網站其他地方——教案、學習步驟卡、課程架構屋、族語詞、
// singsi 小知識、首頁故事卡、影音、電子報、評鑑指標、原民會訪視；閱讀室書頁全文要按按鈕才下載（約 0.6MB，省手機流量）。
// 索引由 tools/build-search.mjs 產生（search-index.json、search-books.json）；比對規則和清單共用 app.js 的 window.SalimpoText。
// 網址帶 ?q= 可以直接分享結果，按過書頁全文會多帶 &books=1。
(() => {
  const T=window.SalimpoText,query=document.getElementById('catalog-query'),results=document.getElementById('catalog-results');
  if(!T||!query||!results||document.body.dataset.page!=='resources')return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LATIN=/[a-z]/,FIRST=8,MORE=20,BOOK_FIRST=3;
  const panel=document.createElement('section');
  panel.className='site-search';panel.id='site-search';panel.hidden=true;panel.setAttribute('aria-labelledby','site-search-title');
  results.before(panel);
  // 讀螢幕的人也知道找到幾筆（清單的筆數本來就會念）
  const live=document.createElement('p');live.className='search-sr';live.setAttribute('role','status');
  document.getElementById('results-count')?.after(live);

  let core=null,corePromise=null,coreFailed=false,books=null,booksPromise=null,booksFailed=false;
  let booksWanted=new URLSearchParams(location.search).get('books')==='1';
  let kind='',limit=FIRST,openBooks=new Map(),lastKey='',timer=0,focusBooks=false;
  let filtered=['catalog-year','catalog-band','catalog-type','catalog-domain'].some(id=>document.getElementById(id)?.value);

  // 索引檔每次回伺服器確認有沒有更新（沒變就用快取，不重新下載）
  const get=file=>fetch(file,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(file+' '+r.status);return r.json();});
  const loadCore=()=>corePromise||(corePromise=get('search-index.json').then(j=>{core={kinds:j.kinds,books:j.books,docs:j.docs.map(([k,u,t,s,x],i)=>({k,u,i,t,s,x,ft:T.fold(t),fs:T.fold(s),fx:T.fold(x)}))};coreFailed=false;},e=>{corePromise=null;coreFailed=true;throw e;}));
  const loadBooks=()=>booksPromise||(booksPromise=get('search-books.json').then(j=>{books={list:j.books,docs:j.docs.map(([b,n,label,x],i)=>({b,n,i,label,x,fx:T.fold(x)}))};booksFailed=false;},e=>{booksPromise=null;booksFailed=true;throw e;}));

  // 比對：先照原樣找；有英文字母的詞（族語）再用去掉撇號的寫法找（查 taeman 找得到 Ta'eman）
  const bareOf=(d,f)=>d['b'+f]??=T.bare(d['f'+f]);
  const hit=(d,f,w)=>d['f'+f].includes(w)||(LATIN.test(w)&&bareOf(d,f).includes(T.bare(w)));
  // 標題命中最前，其次是摘要（族語詞的中文意思、教案的年段與簡介），再來是內文
  const score=(d,words)=>{let total=0;for(const w of words){let s=0;if(hit(d,'t',w))s+=d.ft===w?24:d.ft.startsWith(w)?18:12;if(d.fs&&hit(d,'s',w))s+=4;if(d.fx&&hit(d,'x',w))s+=1;if(!s)return 0;total+=s;}return total;};

  // 找到的位置：去掉撇號比對時，換算回原文的位置
  function bareSpans(f,bw){const idx=[];let b='';for(let i=0;i<f.length;i++)if(f[i]!=="'"){idx.push(i);b+=f[i];}const out=[];let j=0;while(bw&&(j=b.indexOf(bw,j))>=0){out.push([idx[j],idx[j+bw.length-1]+1]);j+=bw.length;}return out;}
  function spans(f,words){const out=[];for(const w of words){let i=0,found=false;while((i=f.indexOf(w,i))>=0){out.push([i,i+w.length]);i+=w.length;found=true;}if(!found&&LATIN.test(w))out.push(...bareSpans(f,T.bare(w)));}return out.sort((a,b)=>a[0]-b[0]);}
  // 標亮關鍵字（比對用的寫法和原文一樣長，位置可以直接對回原文）
  function mark(text,words){const f=T.fold(text);if(f.length!==text.length)return esc(text);let out='',pos=0;for(const [a,b] of spans(f,words)){if(a<pos)continue;out+=esc(text.slice(pos,a))+'<mark>'+esc(text.slice(a,b))+'</mark>';pos=b;}return out+esc(text.slice(pos));}
  // 片段：命中位置靠前就從頭顯示；否則往前留一小段、盡量從標點或空白後開始，後面多留一些，兩行內看得到關鍵字
  function cut(text,f,words){
    const s=spans(f,words)[0];if(!s)return '';
    let start=s[0]<=36?0:s[0]-24;
    if(start){const b=text.slice(start,s[0]).search(/[\s。，、；：！？」）]/);if(b>=0&&start+b+1<s[0])start+=b+1;}
    const end=Math.min(text.length,s[1]+80);
    return (start>0?'…':'')+mark(text.slice(start,end),words)+(end<text.length?'…':'');
  }
  function snippet(d,words){
    for(const f of ['s','x']){if(!d[f])continue;const part=cut(d[f],d['f'+f],words);if(part)return `<small>${part}</small>`;}
    const text=d.s||d.x;return text?`<small>${esc(text.slice(0,90))}${text.length>90?'…':''}</small>`:'';
  }

  const external=u=>/^https?:/.test(u);
  const row=(d,words)=>`<a class="catalog-row search-row" href="${esc(d.u)}"${external(d.u)?' target="_blank" rel="noopener noreferrer"':''}><span class="catalog-main"><span class="type-label">${esc(core.kinds[d.k])}</span><strong>${mark(d.t,words)}${external(d.u)?' ↗<span class="search-sr">（另開新視窗）</span>':''}</strong>${snippet(d,words)}</span></a>`;
  const chip=(k,label,n)=>`<button type="button" data-kind="${k}" aria-pressed="${kind===k}">${esc(label)}<b>${n}</b></button>`;

  function bookBlock(words,raw){
    const meta=core.books,unit=mode=>mode==='page'?'頁':'章';
    const ask=note=>`<div class="book-search"><button type="button" class="button book-search-go" data-books>在 ${meta.count} 卷書頁全文裡找「${esc(raw)}」</button><p class="search-note">${note||`閱讀室 ${meta.count} 卷書、${meta.units} 頁／章的文字，第一次要下載${esc(meta.size)}。`}</p></div>`;
    if(!booksWanted)return ask();
    if(!books)return booksFailed?ask('書頁全文沒有下載成功，請再按一次。'):`<div class="book-search"><p class="search-note" role="status">正在下載書頁全文（${esc(meta.size)}）……</p></div>`;
    const groups=new Map();
    for(const d of books.docs)if(words.every(w=>hit(d,'x',w))){if(!groups.has(d.b))groups.set(d.b,[]);groups.get(d.b).push(d);}
    const total=[...groups.values()].reduce((n,list)=>n+list.length,0);
    const head=`<div class="catalog-group-head"><h3 tabindex="-1">書頁全文<small>${total?`${groups.size} 卷・${total} 頁／章`:'沒有找到'}</small></h3></div>`;
    if(!total)return `<div class="book-search">${head}<p class="search-empty">${meta.count} 卷書頁全文裡沒有找到「${esc(raw)}」。書頁的文字是 PDF 轉出來的，可能有錯字或缺字。</p></div>`;
    const order=[...groups.entries()].sort((a,b)=>b[1].length-a[1].length||a[0]-b[0]);
    return `<div class="book-search">${head}${order.map(([b,list])=>{
      const [id,title,mode]=books.list[b],show=list.slice(0,openBooks.get(b)||BOOK_FIRST),rest=list.length-show.length,base=`reader.html?book=${encodeURIComponent(id)}`;
      return `<section class="book-hit" data-book="${b}"><h4><a href="${base}">${esc(title)}</a><small>${list.length} ${unit(mode)}</small></h4><div class="catalog-list search-list">${show.map(d=>`<a class="catalog-row search-row" href="${base}&amp;${mode}=${d.n}"><span class="catalog-main"><span class="type-label">第 ${d.n} ${unit(mode)}${d.label?`・${esc(d.label)}`:''}</span><small>${cut(d.x,d.fx,words)}</small></span></a>`).join('')}</div>${rest>0?`<button type="button" class="search-more" data-book-more="${b}">再顯示 ${Math.min(MORE,rest)} ${unit(mode)}${rest>MORE?`<small>這本還有 ${rest} ${unit(mode)}</small>`:''}</button>`:''}</section>`;
    }).join('')}<p class="search-note">書頁的文字是 PDF 轉出來的，可能有錯字或缺字；搜不到不代表書裡沒有。點結果會打開閱讀室的那一頁。</p></div>`;
  }

  // 資料入口沒找到、網站其他地方有找到時，清單的「沒找到」說明改成指向上面
  function syncEmpty(found){
    const box=results.querySelector('.empty-state');if(!box)return;
    const h=box.querySelector('h2'),p=box.querySelector('p');if(!h||!p)return;
    if(!box.dataset.h){box.dataset.h=h.textContent;box.dataset.p=p.textContent;}
    h.textContent=found?'資料入口裡沒有符合的資料':box.dataset.h;
    p.textContent=found?'上面是網站其他地方找到的結果；也可以換個關鍵字，或試試其他年段與類型。':box.dataset.p;
  }
  function syncURL(){const url=new URL(location.href);if(booksWanted&&query.value.trim())url.searchParams.set('books','1');else url.searchParams.delete('books');if(url.href!==location.href)history.replaceState(null,'',url);}

  function render(){
    const raw=query.value.trim(),words=T.terms(raw),key=words.join(' ');
    // 只打一個英文字母會找到太多，先不找；中文一個字就可以找
    if(!words.length||(words.join('').length<2&&LATIN.test(key))){panel.hidden=true;panel.innerHTML='';live.textContent='';lastKey='';syncEmpty(false);syncURL();return;}
    if(key!==lastKey){kind='';limit=FIRST;openBooks=new Map();lastKey=key;}
    panel.hidden=false;
    const title=n=>`<div class="catalog-group-head"><h2 id="site-search-title">網站其他地方也找到${n===undefined?'':`<small>${n} 筆</small>`}</h2></div>`;
    if(!core){
      panel.innerHTML=title()+(coreFailed?'<p class="search-note">全站搜尋暫時載入失敗。<button type="button" class="reset-button" data-retry>再試一次</button></p>':'<p class="search-note" role="status">正在準備全站搜尋……</p>');
      if(!coreFailed)loadCore().then(render,render);
      return;
    }
    if(booksWanted&&!books&&!booksPromise&&!booksFailed)loadBooks().then(render,render);
    const hits=[];for(const d of core.docs){const s=score(d,words);if(s)hits.push([s,d]);}
    hits.sort((a,b)=>b[0]-a[0]||a[1].k-b[1].k||a[1].i-b[1].i);
    const counts=new Map();for(const [,d] of hits)counts.set(d.k,(counts.get(d.k)||0)+1);
    if(kind!==''&&!counts.has(Number(kind)))kind='';
    const shown=hits.filter(([,d])=>kind===''||d.k===Number(kind)).map(([,d])=>d);
    const kinds=[...counts.keys()].sort((a,b)=>a-b),rest=shown.length-limit;
    // 剩下的超過一次顯示的量，才另外寫「還有幾筆」
    const more=rest>0?`<button type="button" class="search-more" data-more>再顯示 ${Math.min(MORE,rest)} 筆${rest>MORE?`<small>還有 ${rest} 筆</small>`:''}</button>`:'';
    panel.innerHTML=title(hits.length)
      +(filtered?'<p class="search-note">學年度、年段、類型只篩選下方的資料入口；這一區是網站其他地方的結果。</p>':'')
      +(hits.length?`<div class="search-kinds" role="group" aria-label="依種類看">${chip('','全部',hits.length)}${kinds.map(k=>chip(String(k),core.kinds[k],counts.get(k))).join('')}</div><div class="catalog-list search-list">${shown.slice(0,limit).map(d=>row(d,words)).join('')}</div>${more}`
        :`<p class="search-empty">網站其他地方沒有找到「${esc(raw)}」。</p>`)
      +bookBlock(words,raw);
    live.textContent=`網站其他地方也找到 ${hits.length} 筆`;
    // 按「在書頁全文裡找」之後，下載好就把焦點移到書頁結果的標題（用鍵盤的人不會掉回頁首）
    if(focusBooks&&books){focusBooks=false;panel.querySelector('.book-search h3')?.focus();}
    syncEmpty(hits.length>0);syncURL();
  }

  panel.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.kind!==undefined){kind=b.dataset.kind;limit=FIRST;render();panel.querySelector(`[data-kind="${kind}"]`)?.focus();}
    else if(b.hasAttribute('data-more')){const from=limit;limit+=MORE;render();panel.querySelector('.search-list')?.children[from]?.focus();}
    else if(b.hasAttribute('data-books')){booksWanted=true;booksFailed=false;focusBooks=true;render();}
    else if(b.dataset.bookMore!==undefined){const n=Number(b.dataset.bookMore),from=openBooks.get(n)||BOOK_FIRST;openBooks.set(n,from+MORE);render();panel.querySelector(`[data-book="${n}"] .search-list`)?.children[from]?.focus();}
    else if(b.hasAttribute('data-retry')){coreFailed=false;render();}
  });
  // app.js 的清單每次重畫都會通知（打字、換篩選、清除篩選）
  document.addEventListener('salimpo:catalog',e=>{filtered=Boolean(e.detail?.filtered);clearTimeout(timer);timer=setTimeout(render,120);});
  // 點進關鍵字框就先準備小索引，打字時不用等
  query.addEventListener('focus',()=>{loadCore().catch(()=>{});},{once:true});
  if(query.value.trim())render();
})();
