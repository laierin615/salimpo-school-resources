(() => {
 // 訪視評鑑會客室：原民會訪視與實驗教育評鑑兩頁共用的分頁、佐證資料與文化領域區塊
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
  return `<nav class="room-tabs" aria-label="訪視評鑑會客室">${[['visits','原民會訪視',`${v.dateLabel} · ${v.groups.length}大面向${items}項`],['reviews','實驗教育評鑑',`115學年度 · ${d.groups.length}大面向${d.indicators.length}項`]].map(([page,title,sub])=>`<a href="${page}.html"${page===active?' aria-current="page"':''}><b>${title}</b><small>${e(sub)}</small></a>`).join('')}</nav>`;
 }
 window.SalimpoRoom={tabs,evidence,count};
})();
