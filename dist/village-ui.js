(() => {
  const world=document.getElementById('village-world');
  const rows=[...document.querySelectorAll('[data-place]')];
  const places=rows.map((row,index)=>({id:row.dataset.place,index,title:row.querySelector('[data-place-title]').textContent,description:row.querySelector('[data-place-description]').textContent,category:row.dataset.category,url:row.getAttribute('href'),external:row.dataset.external==='true',go:row.dataset.go,go2:row.dataset.go2,url2:row.dataset.href2,listen:row.dataset.listen,ami:row.dataset.ami||'',amiZh:row.dataset.amiZh||''}));
  const labelRoot=document.getElementById('village-labels');
  const picker=document.getElementById('place-picker');
  const dots=document.getElementById('place-dots');
  const welcome=document.getElementById('village-welcome');
  const card=document.getElementById('place-card');
  const whispers=document.querySelector('.world-whispers'),pause=document.querySelector('.whisper-toggle');
  let whisperPaused=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function updateWhispers(){if(!whispers)return;whispers.classList.toggle('is-paused',whisperPaused);pause.setAttribute('aria-pressed',String(whisperPaused));pause.setAttribute('aria-label',whisperPaused?'繼續跑馬燈':'暫停跑馬燈');pause.textContent=whisperPaused?'繼續':'暫停';}
  pause?.addEventListener('click',()=>{whisperPaused=!whisperPaused;if(!whisperPaused)whispers.classList.add('motion-approved');updateWhispers();});updateWhispers();
  // 族語小語：從文史館〈短文〉每篇挑一句，每次打開都不一樣；讀不到時保留頁面原本的句子
  if(whispers)fetch('books/historyMuseum.json').then(r=>r.ok?r.json():Promise.reject()).then(book=>{
    const chapter=book.chapters.find(c=>c.topic==='short-stories');if(!chapter)return;
    const clean=t=>t.replace(/\u000b/g,' ').replace(/^\s*\d+\.\s*/,'').replace(/\s+/g,' ').trim();
    const esc=t=>t.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
    const starts=(window.SCHOOL_DATA?.historyMuseum?.topics.find(t=>t.id==='short-stories')?.sections||[{paragraph:0}]).map(s=>s.paragraph);
    const phrases=starts.map((start,i)=>{
      const blocks=chapter.blocks.slice(start,starts[i+1]??chapter.blocks.length).filter(b=>b.text.trim()),pairs=[];
      for(let j=0;j<blocks.length;){const ami=[],zh=[];while(j<blocks.length&&blocks[j].lang==='ami')ami.push(clean(blocks[j++].text));while(j<blocks.length&&blocks[j].lang!=='ami')zh.push(clean(blocks[j++].text));if(ami.length&&zh.length)pairs.push({ami:ami.join(' '),zh:zh.join(' ')});}
      const short=pairs.slice(1).filter(p=>p.ami.length<=60&&p.zh.length<=28),pool=short.length?short:pairs;
      return pool[Math.floor(Math.random()*pool.length)];
    }).filter(Boolean);
    if(phrases.length<3)return;
    const track=whispers.querySelector('.whisper-track'),copies=whispers.querySelectorAll('.whisper-copy'),before=copies[0].offsetWidth;
    const html=phrases.map(p=>`<div class="whisper-phrase"><span class="whisper-ami" lang="ami">${esc(p.ami)}</span><span class="whisper-zh" lang="zh-Hant">${esc(p.zh)}</span></div>`).join('');
    copies.forEach(c=>c.innerHTML=html);
    // 句子變多也維持原本的捲動速度（village.css 的 whisper-loop 是 110 秒）
    if(before)track.style.animationDuration=(110*copies[0].offsetWidth/before).toFixed(1)+'s';
  }).catch(()=>{});
  let selected=-1;
  places.forEach((place,i)=>{
    const pin=document.createElement('button');pin.type='button';pin.className='place-pin';pin.dataset.index=String(i);pin.setAttribute('aria-label',place.title);pin.setAttribute('aria-pressed','false');
    const name=document.createElement('span');name.className='pin-name';name.textContent=place.title.split(' · ')[0];pin.append(name);pin.addEventListener('click',()=>select(i));labelRoot.append(pin);
    const quick=document.createElement('button');quick.type='button';quick.textContent=place.title;quick.setAttribute('aria-pressed','false');quick.addEventListener('click',()=>select(i));picker.append(quick);
    const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',place.title);dot.setAttribute('aria-pressed','false');dot.addEventListener('click',()=>select(i));dots.append(dot);
  });
  // 竹筏不在逐站導覽裡：用自己的卡片，打開時先收起地點卡
  const raftCard=document.getElementById('raft-card');
  function showRaft(){select(-1);if(!raftCard)return;welcome.hidden=true;raftCard.hidden=false;raftPin.setAttribute('aria-pressed','true');raftQuick.setAttribute('aria-pressed','true');window.dispatchEvent(new CustomEvent('salimpo:raft'));}
  const raftPin=document.createElement('button');raftPin.type='button';raftPin.className='place-pin raft-pin';raftPin.setAttribute('aria-label','竹筏 Dadangoyan');raftPin.setAttribute('aria-pressed','false');raftPin.innerHTML='<span class="pin-name">竹筏</span>';raftPin.addEventListener('click',showRaft);labelRoot.append(raftPin);
  const raftQuick=document.createElement('button');raftQuick.type='button';raftQuick.textContent='竹筏';raftQuick.setAttribute('aria-pressed','false');raftQuick.addEventListener('click',showRaft);picker.append(raftQuick);
  document.getElementById('raft-close')?.addEventListener('click',()=>select(-1));
  // 村子裡的 singsi：點 3D 小人、頭上的名字或下方清單，跳出對話卡；一次說一則小知識，「再教我一個」換下一則，「考考我」出一題三選一，最後連到教案
  const singsiList=window.SALIMPO_SINGSI||[],singsiCard=document.getElementById('singsi-card'),$=id=>document.getElementById(id);
  const lessonTitle=id=>(window.SCHOOL_DATA?.lessons||[]).find(l=>l.id===id)?.title||id;
  let talking=-1,tip=0;
  const singsiPins=singsiList.map((s,i)=>{const pin=document.createElement('button');pin.type='button';pin.className='singsi-pin';pin.textContent=s.name;pin.setAttribute('aria-pressed','false');pin.addEventListener('click',()=>showSingsi(i));labelRoot.append(pin);return pin;});
  function sayTip(){const s=singsiList[talking],t=s.tips[tip];$('singsi-say').textContent=t.text;$('singsi-ami').textContent=t.ami;$('singsi-zh').textContent=t.zh;$('singsi-count').textContent=(tip+1)+' / '+s.tips.length;$('singsi-talk').hidden=false;$('singsi-quiz').hidden=true;singsiCard.classList.remove('is-quiz');}
  function askQuiz(){const s=singsiList[talking],box=$('singsi-options');$('singsi-question').textContent=s.quiz.q;$('singsi-result').textContent='';
    // 正確答案不固定在第一個：依 singsi 的順序輪流換位置
    box.replaceChildren(...s.quiz.options.map((_,k)=>(k+talking)%s.quiz.options.length).map(n=>{const b=document.createElement('button');b.type='button';b.textContent=s.quiz.options[n];b.addEventListener('click',()=>{const right=n===s.quiz.answer;b.classList.add(right?'is-right':'is-wrong');$('singsi-result').textContent=right?'答對了！':'再想想看';if(right)box.querySelectorAll('button').forEach(o=>o.disabled=true);});return b;}));
    $('singsi-talk').hidden=true;$('singsi-quiz').hidden=false;singsiCard.classList.add('is-quiz');}
  function hideSingsi(){if(talking<0)return;talking=-1;if(singsiCard){singsiCard.hidden=true;singsiCard.closest('.village-world')?.classList.remove('is-talking');}singsiPins.forEach(pin=>pin.setAttribute('aria-pressed','false'));window.dispatchEvent(new CustomEvent('salimpo:singsi',{detail:-1}));}
  function showSingsi(i){const s=singsiList[i];if(!s||!singsiCard)return;select(-1);talking=i;tip=0;welcome.hidden=true;singsiCard.hidden=false;
    // 桌機版對話卡靠到 singsi 的另一側，才看得到被點的人在說話；手機版先收起地點按鈕，讓卡片往下放
    singsiCard.dataset.side=(parseFloat(singsiPins[i].style.left)||0)>document.documentElement.clientWidth/2-22?'left':'right';singsiCard.closest('.village-world')?.classList.add('is-talking');
    $('singsi-where').textContent=s.where+' · '+s.prop;$('singsi-name').textContent=s.name;sayTip();
    $('singsi-links').replaceChildren(...[...(s.links||[]),...(s.lessons||[]).map(id=>({label:lessonTitle(id),href:'lessons.html?lesson='+encodeURIComponent(id)}))].map(link=>{const a=document.createElement('a');a.href=link.href;const out=/^https?:/.test(link.href);a.textContent=link.label+(out?' ↗':' →');if(out){a.target='_blank';a.rel='noopener noreferrer';}return a;}));
    singsiPins.forEach((pin,k)=>pin.setAttribute('aria-pressed',String(k===i)));window.dispatchEvent(new CustomEvent('salimpo:singsi',{detail:i}));}
  $('singsi-next')?.addEventListener('click',()=>{if(talking<0)return;tip=(tip+1)%singsiList[talking].tips.length;sayTip();});
  $('singsi-test')?.addEventListener('click',()=>{if(talking>=0)askQuiz();});
  $('singsi-close')?.addEventListener('click',()=>select(-1));
  // 下方清單「村子裡的 singsi」：點了回到聚落、打開那一位的對話卡
  $('singsi-rows')?.replaceChildren(...singsiList.map((s,i)=>{const li=document.createElement('li'),row=document.createElement('button'),name=document.createElement('span'),strong=document.createElement('strong'),prop=document.createElement('small'),say=document.createElement('span'),where=document.createElement('span');
    row.type='button';row.className='directory-row singsi-row';name.className='directory-name';strong.textContent=s.name;prop.className='singsi-prop';prop.textContent=s.prop;name.append(strong,prop);say.className='singsi-row-tip';say.textContent=s.tips[0].text;where.className='directory-type';where.textContent=s.where;row.append(name,say,where);
    row.addEventListener('click',()=>{showSingsi(i);world.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});});li.append(row);return li;}));
  function select(index){
    selected=index;const place=places[index];hideSingsi();
    if(raftCard)raftCard.hidden=true;raftPin.setAttribute('aria-pressed','false');raftQuick.setAttribute('aria-pressed','false');
    welcome.hidden=!!place;card.hidden=!place;
    if(place){document.getElementById('place-category').textContent=place.category;document.getElementById('place-title').textContent=place.title;document.getElementById('place-description').textContent=place.description;const ami=document.getElementById('place-ami');if(ami){ami.hidden=!place.ami;ami.querySelector('i').textContent=place.ami;ami.querySelector('span').textContent=place.amiZh;}const link=document.getElementById('place-link');link.href=place.url;link.textContent=place.go||(place.external?'出發到族語挑戰島 ↗':'走進這一站 →');window.dispatchEvent(new CustomEvent('salimpo:listen',{detail:place.listen||''}));if(place.external){link.target='_blank';link.rel='noopener noreferrer';}else{link.removeAttribute('target');link.removeAttribute('rel');}const link2=document.getElementById('place-link2');if(link2){link2.hidden=!place.url2;if(place.url2){link2.href=place.url2;link2.textContent=place.go2;}}document.getElementById('place-counter').textContent=(index+1)+' / '+places.length;}
    else document.getElementById('place-counter').textContent='探索聚落';
    [labelRoot,picker,dots].forEach(container=>[...container.children].forEach((button,i)=>{if(button!==raftPin&&button!==raftQuick)button.setAttribute('aria-pressed',String(i===selected));}));
    window.dispatchEvent(new CustomEvent('salimpo:place',{detail:index}));
  }
  document.getElementById('place-next').addEventListener('click',()=>select((selected+1)%places.length));
  document.getElementById('place-prev').addEventListener('click',()=>select(selected<0?places.length-1:(selected-1+places.length)%places.length));
  document.getElementById('place-close').addEventListener('click',()=>select(-1));
  window.SALIMPO_VILLAGE={places,select,raft:showRaft,singsi:showSingsi,get selected(){return selected;}};
  window.failVillage=()=>{if(world.classList.contains('scene-ready'))return;world.classList.add('scene-unavailable');document.getElementById('scene-loading').hidden=true;document.getElementById('scene-fallback').hidden=false;};
  setTimeout(()=>{if(!world.classList.contains('scene-ready'))window.failVillage();},15000);
})();
