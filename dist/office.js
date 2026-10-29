// 村辦公室：用通關密碼在瀏覽器裡解開 office-data.js，再畫出打卡與工作檔案。
// 密碼與連結原文都不在網站上；同一個分頁內開過一次，重新整理不用再輸入，關掉分頁或按「鎖門」就清掉。
(() => {
  const vault = window.OFFICE_VAULT;
  const lock = document.getElementById('office-lock'), room = document.getElementById('office-room');
  const form = document.getElementById('office-form'), input = document.getElementById('office-password');
  const openButton = document.getElementById('office-open'), error = document.getElementById('office-error');
  const SESSION_KEY = 'salimpo-office-room';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;'}[c]));
  const store = {
    get: (area, key) => { try { return window[area].getItem(key); } catch { return null; } },
    set: (area, key, value) => { try { window[area].setItem(key, value); } catch {} },
    remove: (area, key) => { try { window[area].removeItem(key); } catch {} }
  };

  const fromB64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  async function unlock(password) {
    const subtle = window.crypto?.subtle;
    if (!subtle) throw new Error('這個瀏覽器不支援解鎖，請改用最新版 Chrome、Safari 或 Edge。');
    const base = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle.deriveKey({name: 'PBKDF2', salt: fromB64(vault.salt), iterations: vault.iterations, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
    const plain = await subtle.decrypt({name: 'AES-GCM', iv: fromB64(vault.iv)}, key, fromB64(vault.data));
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // 打卡只是效果：時間只存在這台裝置，用來顯示「今天幾點打卡」，不會傳到任何地方
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const punchKey = () => 'salimpo-office-punch-' + today();
  const readPunch = () => { try { return JSON.parse(store.get('localStorage', punchKey()) || '{}'); } catch { return {}; } };
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const messages = {
    in: `<i class="ami" lang="ami">Nga'ay ho!</i> 你好，今天也要 <i class="ami" lang="ami">Sa'icelen!</i>（加油）`,
    out: `<i class="ami" lang="ami">Aray!</i> 謝謝你今天的辛苦，回家路上小心。`
  };

  const linkItem = link => `<li><a class="${link.main ? 'is-main' : ''}" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer"><span class="office-kind">${link.kind === 'padlet' ? 'Padlet' : link.kind === 'folder' ? '資料夾' : '文件'}</span><span>${esc(link.label)}</span><span class="office-go" aria-hidden="true">↗</span></a></li>`;
  const grid = rows => `<div class="office-grid" role="group" aria-label="各年段教案紀錄">${rows.map(row => {
    const cells = ['低年級', '中年級', '高年級'].map(band => { const cell = row.cells.find(c => c.band === band); return cell ? `<a href="${esc(cell.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(row.course + ' ' + band)}">${band}</a>` : '<span></span>'; }).join('');
    return `<div class="office-grid-row"><b>${esc(row.course)}</b>${cells}</div>`;
  }).join('')}</div>`;

  function render(payload) {
    room.innerHTML = `<div class="office-bar"><p>歡迎回來，連結都會開新分頁。</p><button type="button" id="office-close">鎖門離開</button></div>
      <section class="office-card office-punch" aria-labelledby="punch-title">
        <div><h2 id="punch-title" class="visually-hidden">打卡</h2><div class="punch-clock" id="punch-clock">--:--</div><div class="punch-date" id="punch-date"></div><div class="punch-today" id="punch-today"></div></div>
        <div class="punch-buttons"><button type="button" class="punch-in" data-punch="in">上班打卡</button><button type="button" class="punch-out" data-punch="out">下班打卡</button></div>
        <div class="punch-stamp" id="punch-stamp" aria-hidden="true"><b></b><span></span></div>
        <p class="punch-message" id="punch-message" aria-live="polite"></p>
        <p class="punch-note">打卡只是好玩的效果：時間只顯示在這台裝置上，不會傳到任何地方。</p>
      </section>
      ${payload.groups.map(group => `<section class="office-card"><h2>${esc(group.title)}</h2>${group.note ? `<p>${esc(group.note)}</p>` : ''}<ul class="office-links">${group.links.map(linkItem).join('')}</ul>${group.grid ? grid(group.grid) : ''}</section>`).join('')}`;
    lock.hidden = true;
    room.hidden = false;

    const clock = document.getElementById('punch-clock'), date = document.getElementById('punch-date'), todayLine = document.getElementById('punch-today');
    const stamp = document.getElementById('punch-stamp'), message = document.getElementById('punch-message');
    const tick = () => { const d = new Date(); clock.textContent = hhmm(d); date.textContent = `${d.getMonth() + 1} 月 ${d.getDate()} 日 星期${weekdays[d.getDay()]}`; };
    const showToday = () => { const p = readPunch(); todayLine.innerHTML = `今天：上班 <b>${p.in || '—'}</b>｜下班 <b>${p.out || '—'}</b>`; };
    tick(); showToday();
    const timer = setInterval(tick, 1000 * 15);
    let stampTimer;
    room.querySelectorAll('[data-punch]').forEach(button => button.addEventListener('click', () => {
      const kind = button.dataset.punch, time = hhmm(new Date()), p = readPunch();
      p[kind] = time;
      store.set('localStorage', punchKey(), JSON.stringify(p));
      stamp.querySelector('b').textContent = kind === 'in' ? '上班' : '下班';
      stamp.querySelector('span').textContent = time;
      stamp.classList.remove('is-on'); void stamp.offsetWidth; stamp.classList.add('is-on');
      clearTimeout(stampTimer); stampTimer = setTimeout(() => stamp.classList.remove('is-on'), 2600);
      message.innerHTML = `${time} ${kind === 'in' ? '上班' : '下班'}打卡完成。${messages[kind]}`;
      showToday();
    }));
    document.getElementById('office-close').addEventListener('click', () => {
      clearInterval(timer);
      store.remove('sessionStorage', SESSION_KEY);
      room.hidden = true; room.innerHTML = '';
      lock.hidden = false; input.value = ''; input.focus();
    });
  }

  if (!vault) { error.textContent = '村辦公室暫時打不開，請稍後再試。'; error.hidden = false; form.hidden = true; return; }
  const saved = store.get('sessionStorage', SESSION_KEY);
  if (saved) { try { render(JSON.parse(saved)); } catch { store.remove('sessionStorage', SESSION_KEY); } }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.hidden = true;
    openButton.disabled = true; openButton.textContent = '開門中…';
    try {
      const payload = await unlock(input.value);
      store.set('sessionStorage', SESSION_KEY, JSON.stringify(payload));
      render(payload);
    } catch (e) {
      error.textContent = e instanceof Error && e.message.startsWith('這個瀏覽器') ? e.message : '密碼不對，再試一次。';
      error.hidden = false;
      input.select();
    } finally {
      openButton.disabled = false; openButton.textContent = '開門';
    }
  });
})();
