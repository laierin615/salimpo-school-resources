(() => {
  const world=document.getElementById('village-world');
  const rows=[...document.querySelectorAll('[data-place]')];
  const places=rows.map((row,index)=>({id:row.dataset.place,index,title:row.querySelector('[data-place-title]').textContent,description:row.querySelector('[data-place-description]').textContent,category:row.dataset.category,url:row.getAttribute('href'),external:row.dataset.external==='true',go:row.dataset.go,listen:row.dataset.listen}));
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
  const number=i=>String(i+1).padStart(2,'0');
  places.forEach((place,i)=>{
    const pin=document.createElement('button');pin.type='button';pin.className='place-pin';pin.dataset.index=String(i);pin.setAttribute('aria-label',number(i)+' '+place.title);pin.setAttribute('aria-pressed','false');
    const badge=document.createElement('b');badge.textContent=number(i);const name=document.createElement('span');name.className='pin-name';name.textContent=place.title;pin.append(badge,name);pin.addEventListener('click',()=>select(i));labelRoot.append(pin);
    const quick=document.createElement('button');quick.type='button';quick.textContent=number(i)+' '+place.title;quick.setAttribute('aria-pressed','false');quick.addEventListener('click',()=>select(i));picker.append(quick);
    const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',number(i)+' '+place.title);dot.setAttribute('aria-pressed','false');dot.addEventListener('click',()=>select(i));dots.append(dot);
  });
  function select(index){
    selected=index;const place=places[index];
    welcome.hidden=!!place;card.hidden=!place;
    if(place){document.getElementById('place-number').textContent=number(index);document.getElementById('place-category').textContent=place.category;document.getElementById('place-title').textContent=place.title;document.getElementById('place-description').textContent=place.description;const link=document.getElementById('place-link');link.href=place.url;link.textContent=place.go||(place.external?'出發到族語挑戰島 ↗':'走進這一站 →');window.dispatchEvent(new CustomEvent('salimpo:listen',{detail:place.listen||''}));if(place.external){link.target='_blank';link.rel='noopener noreferrer';}else{link.removeAttribute('target');link.removeAttribute('rel');}document.getElementById('place-counter').textContent=number(index)+' / '+places.length;}
    else document.getElementById('place-counter').textContent='探索聚落';
    [labelRoot,picker,dots].forEach(container=>[...container.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected))));
    window.dispatchEvent(new CustomEvent('salimpo:place',{detail:index}));
  }
  document.getElementById('place-next').addEventListener('click',()=>select((selected+1)%places.length));
  document.getElementById('place-prev').addEventListener('click',()=>select(selected<0?places.length-1:(selected-1+places.length)%places.length));
  document.getElementById('place-close').addEventListener('click',()=>select(-1));
  window.SALIMPO_VILLAGE={places,select,get selected(){return selected;}};
  window.failVillage=()=>{if(world.classList.contains('scene-ready'))return;world.classList.add('scene-unavailable');document.getElementById('scene-loading').hidden=true;document.getElementById('scene-fallback').hidden=false;};
  setTimeout(()=>{if(!world.classList.contains('scene-ready'))window.failVillage();},15000);
})();
