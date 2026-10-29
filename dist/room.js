(() => {
 // 會客室：入口頁，以及原民會訪視、實驗教育評鑑兩頁共用的分頁、佐證資料與文化領域區塊
 const d=window.SCHOOL_DATA;
 const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups={plan:'計畫與文件',course:'課程與教案',results:'學習歷程與成果',community:'部落與夥伴'};
 const books={report114b:'114下全紀錄',visit115Evidence:'訪視教學資料',visit115Official:'訪視計畫',visit115Finance:'經費資料',visit115Approvals:'核定函',plan:'學校與課程',plan115:'115實施計畫',plan114Approved:'114核定計畫',assessment:'評量單',slides:'場域導覽',visit:'評鑑訪視流程',cathayProject:'國泰圓夢',musicProject:'多元智能',scienceProject:'原資中心',expoProject:'東博',historyMuseum:'文史筆記'};
 const chip=(href,kind,label,external)=>`<a href="${e(href)}"${external?' target="_blank" rel="noopener noreferrer"':''}><small>${e(kind)}</small><span>${e(label)}${external?' ↗':''}</span></a>`;
 // 引用格式見 room-build：R 資源、J 步驟卡、P 站內頁、U 外部網站、B 閱讀章節
 function ref(x){
  const kind=x[0],rest=x.slice(2);
  if(kind==='R'){const r=d.resources.find(r=>r.id===rest);return r?chip(`resource.html?id=${rest}`,r.type,r.title):'';}
  if(kind==='J'){const j=d.journeys.find(j=>j.id===rest);return j?chip(`journeys.html#${rest}`,'步驟卡',j.title):'';}
  const [target,label,type]=rest.split('|');
  if(kind==='P')return chip(target,type||'網站',label);
  if(kind==='U')return chip(target,'互動網站',label,true);
  if(kind==='B'){const [book,chapter]=target.split(':');return chip(`reader.html?book=${book}${chapter?'&chapter='+chapter:''}`,books[book]||'閱讀',label);}
  return '';
 }
 function domains(){
  const c=d.curriculum115,dirs=c.lessonDirections||{},names=Object.fromEntries(c.cores.flatMap(core=>core.directions.map(x=>[x.code,x.title])));
  return `<div class="room-domains">${c.domains.map(([name,codes,text])=>{const list=codes.split('、'),lessons=d.lessons.filter(l=>list.includes(dirs[l.id]));return `<section><h5>${e(name)}<b>${lessons.length}</b></h5><p>${e(text)}</p><p class="room-dirs">${list.map(code=>`${e(code)} ${e(names[code])}`).join('・')}</p><ul>${lessons.map(l=>`<li><a href="lessons.html?lesson=${e(l.id)}"><small>${e(l.band)}</small>${e(l.title)}</a></li>`).join('')}</ul></section>`;}).join('')}</div>`;
 }
 const integrations=()=>`<div class="room-table" tabindex="0" role="region" aria-label="山海課程與部定領域統整"><table><thead><tr><th scope="col">年段</th><th scope="col">山海課程</th><th scope="col">統整的部定領域</th><th scope="col">節數</th></tr></thead><tbody>${d.curriculum115.integrations.map(row=>`<tr>${row.map(x=>`<td>${e(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 const extras={domains:()=>`<h4>四大文化領域 × ${d.lessons.length} 個教案</h4><p class="room-note">依課程架構的三美九向，把114學年度的教案分到四大文化領域。</p>${domains()}`,integrations:()=>`<h4>山海課程與部定領域統整</h4><p class="room-note">依115學年度實驗教育實施計畫。</p>${integrations()}`};
 const count=item=>Object.keys(groups).reduce((n,key)=>n+(item.evidence?.[key]?.length||0),0);
 function evidence(item){
  const ev=item.evidence||{};
  const lists=Object.entries(groups).filter(([key])=>ev[key]?.length).map(([key,title])=>`<section><h4>${title}<b>${ev[key].length}</b></h4><div class="room-chips">${ev[key].map(ref).join('')}</div></section>`).join('');
  const extra=extras[ev.extra]?`<div class="room-extra">${extras[ev.extra]()}</div>`:'';
  return lists||extra?`<div class="room-evidence">${extra}${lists?`<div class="room-groups">${lists}</div>`:''}</div>`:'';
 }
 function tabs(active){
  const v=d.visit115,items=v.groups.reduce((n,g)=>n+g.items.length,0);
  return `<nav class="room-tabs" aria-label="會客室">${[['visits','原民會訪視',`${v.dateLabel} · ${v.groups.length}大面向${items}項`],['reviews','實驗教育評鑑',`115學年度 · ${d.groups.length}大面向${d.indicators.length}項`]].map(([page,title,sub])=>`<a href="${page}.html"${page===active?' aria-current="page"':''}><b>${title}</b><small>${e(sub)}</small></a>`).join('')}</nav>`;
 }
 window.SalimpoRoom={tabs,evidence,count};
 // 入口頁：兩扇門，門下列出可以直接前往的段落
 if(document.body.dataset.page==='reception'){
  const v=d.visit115,items=v.groups.reduce((n,g)=>n+g.items.length,0);
  const door=(href,icon,eyebrow,title,sub,text,go,links)=>`<article class="reception-door"><a class="reception-door-main" href="${href}"><svg class="reception-icon" aria-hidden="true"><use href="media/icons.svg#${icon}"></use></svg><p class="eyebrow">${e(eyebrow)}</p><h2>${e(title)}</h2><p class="reception-sub">${e(sub)}</p><p>${e(text)}</p><span class="text-link">${e(go)} →</span></a><nav class="reception-quick" aria-label="${e(title)}：直接前往"><span>直接前往</span>${links.map(([to,label])=>`<a href="${e(to)}">${e(label)}</a>`).join('')}</nav></article>`;
  document.getElementById('main').insertAdjacentHTML('beforeend',`<div class="page-body reception-doors">${door('visits.html','st-visit','115年原住民族實驗教育訪視','原民會訪視',`${v.dateLabel} · ${v.groups.length}大面向${items}項`,'從課程地圖到孩子的作品與部落的陪伴，沿著四大面向走進寧埔的山海教育。','走進原民會訪視',[['visits.html#flow','訪視流程'],...(v.briefing?[['visits.html#briefing','學校簡報']]:[]),...v.groups.map(g=>[`visits.html#${g.id}`,g.title])])}${door('reviews.html','st-archive','115學年度 · 學校型態實驗教育','實驗教育評鑑',`${d.groups.length}大面向${d.indicators.length}項指標`,'從評鑑指標出發，一步步看見課程、學習成果與評鑑資料的關聯。','走進實驗教育評鑑',d.groups.map((name,i)=>[`reviews.html?group=${i+1}`,name]))}</div>`);
 }
 // 三頁的標題區右側放 QR code：手機一掃直接打開原民會訪視；點一下放大，投影或視訊時大家比較好掃（窄螢幕不顯示，見 room.css）
 const qrImg='media/qr/visits.svg',qrText='手機掃描，進入原民會訪視';
 function qr(){
  const h=document.querySelector('#main .page-heading');if(!h||h.querySelector('.room-qr'))return;
  h.classList.add('has-room-qr');
  h.insertAdjacentHTML('afterbegin',`<button type="button" class="room-qr" aria-label="放大 QR code：${qrText}"><img src="${qrImg}" alt="" width="112" height="112"><span>手機掃描<br>進入原民會訪視</span></button>`);
 }
 document.addEventListener('click',event=>{
  if(!event.target.closest('.room-qr'))return;
  let box=document.querySelector('.room-qr-dialog');
  if(!box){box=document.createElement('dialog');box.className='room-qr-dialog';box.innerHTML=`<img src="${qrImg}" alt="原民會訪視網頁的 QR code" width="480" height="480"><p>${qrText}</p><form method="dialog"><button type="submit">關閉</button></form>`;box.addEventListener('click',e=>{if(e.target===box)box.close();});document.body.append(box);}
  box.showModal();
 });
 const main=document.getElementById('main');
 if(main){qr();new MutationObserver(qr).observe(main,{childList:true,subtree:true});}
})();
