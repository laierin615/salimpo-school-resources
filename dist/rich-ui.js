(() => {
 const data=window.SCHOOL_DATA;let dialog,photos=[],index=0;
 function render(){const button=photos[index];const asset=data.assets[button.dataset.photo];dialog.querySelector('img').src=asset.src;dialog.querySelector('img').alt=button.dataset.caption||'學習紀錄';dialog.querySelector('[data-caption]').textContent=button.dataset.caption||'學習紀錄';dialog.querySelector('[data-count]').textContent=`${index+1} / ${photos.length}`;}
 document.addEventListener('click',event=>{const button=event.target.closest('.photo-open');if(!button)return;
  const group=button.closest('.photo-gallery,.doc-pictures')||document;photos=[...group.querySelectorAll('.photo-open')];index=photos.indexOf(button);
  if(!dialog){dialog=document.createElement('dialog');dialog.className='photo-dialog';dialog.innerHTML='<header><p data-caption></p><button type="button" data-close aria-label="關閉照片">關閉 ×</button></header><img alt=""><footer><button type="button" data-prev>← 上一張</button><span data-count></span><button type="button" data-next>下一張 →</button></footer>';document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('[data-prev]').onclick=()=>{index=(index-1+photos.length)%photos.length;render();};dialog.querySelector('[data-next]').onclick=()=>{index=(index+1)%photos.length;render();};dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();dialog.querySelector('[data-prev]').click();}if(e.key==='ArrowRight'){e.preventDefault();dialog.querySelector('[data-next]').click();}});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
  render();dialog.showModal();
 });
})();
