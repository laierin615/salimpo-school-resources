// 勇氣小學堂：全校兒少保護宣導的互動遊戲，約 10 分鐘，老師在投影幕上操作
(() => {
  const root = document.getElementById('brave');
  if (!root) return;

  const SCENARIOS = [
    {scene:'媽媽提醒你：「先把功課寫完，再看電視喔！」', safe:true, why:'這是關心。大人提醒你把事情做好，是在照顧你。'},
    {scene:'大人生氣的時候一直打你，打到身上瘀青、受傷。', safe:false, why:'不管你做錯什麼，都不可以被打到受傷。這不是你的錯，要說出來。'},
    {scene:'有大人常常罵你「你很笨」「我不要你了」。', safe:false, why:'難聽的話也會讓心受傷。你值得被好好對待。'},
    {scene:'阿嬤抱抱你，說：「你好棒！」', safe:true, why:'讓你覺得溫暖、安全的，就是好的對待。如果抱抱讓你不舒服，也可以說「不要」。'},
    {scene:'家裡的大人吵架、摔東西，你躲在房間裡很害怕。', safe:false, why:'看到大人打架、摔東西，心也會受傷。害怕的時候，可以說出來。'},
    {scene:'你發燒好幾天，都沒有人照顧你、帶你去看醫生。', safe:false, why:'生病的小朋友需要被照顧。沒有人照顧你，也要讓大人知道。'}
  ];
  const PHRASES = [
    {say:'不是我的錯', hint:'被打、被罵，不是因為你不乖。'},
    {say:'先保護自己', hint:'離開危險的地方，躲到安全的地方。'},
    {say:'找信任的大人說', hint:'說一次沒有人理，就再找下一個人說。'}
  ];
  const HELPERS = ['爸爸媽媽','阿公阿嬤','老師','校長','輔導老師','護理師','社工','警察'];
  const FEELINGS = ['害怕','難過','不舒服','睡不好'];
  const DIAL_RESULTS = {
    '113':{title:'113 保護專線', text:'24 小時都有人接，免費，小朋友自己也可以打。'},
    '110':{title:'110 報警', text:'有人正在打人、現在很危險的時候，馬上打。'}
  };
  const DISCLOSURE_STEPS = [
    '冷靜聽，先說「謝謝你告訴我」。',
    '不追問細節，不要孩子再說給別人聽。',
    '不承諾保密，改說「我會找能幫忙的大人一起保護你」。',
    '記下孩子的原話，24 小時內在「關懷e起來」通報，並告知輔導室與校長。',
    '不在全班面前處理，會後再私下陪孩子。'
  ];

  const STAGES = [
    {id:'intro', label:'開場', seconds:60, notes:['問全班：「什麼是勇氣？」請兩三位小朋友舉手回答。','按「看看答案」，帶大家念一次：「說出來，也是一種勇氣。」']},
    {id:'cards', label:'圈圈叉叉', seconds:210, notes:['念題目，請小朋友雙手在頭上比圈（可以）或交叉（不可以）。','看大家比完再公布。叉叉的題目要強調「這不是你的錯」。','時間不夠時，第 1 題和第 4 題可以快速帶過。']},
    {id:'phrases', label:'三句話', seconds:90, notes:['一句一句點開，每句請全班跟著念。','三句都開了以後按「大家一起念」，念三次，越來越大聲。']},
    {id:'circle', label:'安全圈', seconds:120, notes:['問：「你遇到困難會找誰？」小朋友說到誰就點誰，把安全圈填滿。','請一位小朋友上台按 1、1、3。提醒 113 是 24 小時、免費的保護專線。','加碼：現在很危險、有人正在打人，就打 110。']},
    {id:'practice', label:'勇氣練習', seconds:90, notes:['全班一起念第一句：「老師，我想跟你說一件事。」','請小朋友選一個心情，再按「說出來」，示範大人會怎麼回答。','對高年級補充：同學跟你說了不安全的事，陪他去找老師，不要到處說。']},
    {id:'ending', label:'收尾', seconds:30, notes:['全班一起喊：「說出來的人，最勇敢！」','提醒：下課想說的話，老師和輔導室都在。']}
  ];
  const TOTAL_SECONDS = STAGES.reduce((sum, stage) => sum + stage.seconds, 0);

  const freshState = () => ({stage:0, introShown:false, card:0, revealed:new Set(), phrases:new Set(), recite:0, circle:new Set(), dial:'', feeling:'', said:false});
  let state = freshState();
  const timer = {running:false, startedAt:0, banked:0};

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const minutesLabel = seconds => seconds >= 60 ? `${Math.floor(seconds / 60)} 分${seconds % 60 ? ` ${seconds % 60} 秒` : ''}` : `${seconds} 秒`;
  const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const elapsedSeconds = () => Math.floor((timer.banked + (timer.running ? Date.now() - timer.startedAt : 0)) / 1000);
  const mark = safe => `<span class="bv-mark ${safe ? 'mark-o' : 'mark-x'}" aria-hidden="true"></span>`;

  // 每一關的畫面：只依 state 產生 HTML，互動統一由 data-action 處理
  const views = {
    intro: () => `<div class="bv-center"><p class="bv-kicker">今天要練習一個超能力</p><h2 class="bv-hero">勇氣</h2><p class="bv-question">什麼是勇氣？舉手說說看！</p>${state.introShown ? '<p class="bv-answer bv-pop">敢把心裡的話說出來，<br>也是一種勇氣。</p>' : '<button type="button" class="bv-button primary" data-action="intro">看看答案</button>'}</div>`,
    cards: () => {
      const scenario = SCENARIOS[state.card];
      const shown = state.revealed.has(state.card);
      const dots = SCENARIOS.map((item, index) => `<button type="button" class="bv-dot${index === state.card ? ' is-current' : ''}${state.revealed.has(index) ? (item.safe ? ' is-o' : ' is-x') : ''}" data-action="card-go" data-index="${index}" aria-label="第 ${index + 1} 題"></button>`).join('');
      const verdict = shown ? `<div class="bv-verdict bv-pop">${mark(scenario.safe)}<strong>${scenario.safe ? '可以' : '不可以'}</strong></div><p class="bv-why">${esc(scenario.why)}</p>` : `<p class="bv-prompt">可以嗎？雙手比 <b>圈圈</b> 或 <b>叉叉</b>！</p><button type="button" class="bv-button primary" data-action="reveal">公布答案</button>`;
      const allDone = state.revealed.size === SCENARIOS.length;
      return `<div class="bv-cards"><div class="bv-dots" role="group" aria-label="題目">${dots}</div><article class="bv-card${shown ? (scenario.safe ? ' is-o' : ' is-x') : ''}"><p class="bv-count">第 ${state.card + 1} 題 / 共 ${SCENARIOS.length} 題</p><p class="bv-scene">${esc(scenario.scene)}</p>${verdict}</article><div class="bv-row"><button type="button" class="bv-button" data-action="card-prev"${state.card === 0 ? ' disabled' : ''}>上一題</button><button type="button" class="bv-button" data-action="card-next"${state.card === SCENARIOS.length - 1 ? ' disabled' : ''}>下一題</button></div>${allDone ? '<p class="bv-banner bv-pop">讓你受傷、害怕、沒人照顧，都不是你的錯，要說出來！</p>' : ''}</div>`;
    },
    phrases: () => {
      const cards = PHRASES.map((phrase, index) => state.phrases.has(index)
        ? `<div class="bv-phrase is-open bv-pop"><span class="bv-num">${index + 1}</span><strong>${esc(phrase.say)}</strong><small>${esc(phrase.hint)}</small></div>`
        : `<button type="button" class="bv-phrase" data-action="phrase" data-index="${index}"><span class="bv-num">${index + 1}</span><strong>第 ${index + 1} 句</strong><small>點我打開</small></button>`).join('');
      const allOpen = state.phrases.size === PHRASES.length;
      const cheer = state.recite >= 3 ? '<p class="bv-banner bv-pop">好響亮！記住這三句話，你就有勇氣。</p>' : '';
      return `<div class="bv-center"><h2 class="bv-title">遇到不安全的事，記住三句話</h2><div class="bv-phrases">${cards}</div>${allOpen ? `<button type="button" class="bv-button primary" data-action="recite">大家一起念（${state.recite} / 3）</button>` : ''}${cheer}</div>`;
    },
    circle: () => {
      const people = [...state.circle];
      const ringPosition = index => { const angle = (2 * Math.PI * index) / people.length; return `left:${(50 + 50 * Math.sin(angle)).toFixed(2)}%;top:${(50 - 50 * Math.cos(angle)).toFixed(2)}%`; };
      const ring = people.map((name, index) => `<span class="bv-person bv-pop" style="${ringPosition(index)}">${esc(name)}</span>`).join('');
      const chips = HELPERS.map(name => `<button type="button" class="bv-chip" data-action="helper" data-name="${esc(name)}" aria-pressed="${state.circle.has(name)}">${esc(name)}</button>`).join('');
      const keys = ['1','2','3','4','5','6','7','8','9','清除','0','撥出'].map(key => `<button type="button" class="bv-key${key.length > 1 ? ' is-word' : ''}" data-action="key" data-key="${key}">${key}</button>`).join('');
      const result = DIAL_RESULTS[state.dial];
      const screen = result ? `<div class="bv-dial-result bv-pop"><strong>${esc(result.title)}</strong><span>${esc(result.text)}</span></div>` : `<p class="bv-dial-screen" aria-label="撥號號碼">${esc(state.dial) || '請按 1、1、3'}</p>`;
      return `<div class="bv-split"><div><h2 class="bv-title">我的安全圈</h2><p class="bv-sub">遇到困難，你會找誰？</p><div class="bv-ring"><span class="bv-me">我</span>${ring}</div><div class="bv-chips" role="group" aria-label="信任的大人">${chips}</div></div><div><h2 class="bv-title">找不到人的時候</h2><p class="bv-sub">請一位小朋友上台撥號</p><div class="bv-phone">${screen}<div class="bv-keys">${keys}</div></div></div></div>`;
    },
    practice: () => {
      const feelings = FEELINGS.map(feeling => `<button type="button" class="bv-chip" data-action="feeling" data-name="${esc(feeling)}" aria-pressed="${state.feeling === feeling}">${esc(feeling)}</button>`).join('');
      const reply = state.said ? '<div class="bv-bubble is-adult bv-pop"><b>老師</b>謝謝你告訴我。這不是你的錯，我們一起想辦法。</div>' : '';
      return `<div class="bv-center"><h2 class="bv-title">勇氣練習：說出來</h2><div class="bv-bubble"><b>我</b>老師，我想跟你說一件事。</div><div class="bv-bubble"><b>我</b>我覺得 <span class="bv-blank">${esc(state.feeling) || '＿＿＿'}</span>。</div><div class="bv-chips" role="group" aria-label="選一個心情">${feelings}</div><button type="button" class="bv-button primary" data-action="say"${state.feeling ? '' : ' disabled'}>說出來</button>${reply}<p class="bv-tip"><b>高年級小提醒</b>同學跟你說了不安全的事：陪他去找老師，不要到處說。</p></div>`;
    },
    ending: () => `<div class="bv-center bv-finale"><p class="bv-kicker">今天學會的超能力</p><h2 class="bv-hero">說出來的人，<br>最勇敢！</h2><ol class="bv-recap">${PHRASES.map(phrase => `<li>${esc(phrase.say)}</li>`).join('')}</ol><p class="bv-sub">保護專線 <b class="bv-hotline">113</b> 24 小時都有人接</p><button type="button" class="bv-button" data-action="restart">再玩一次</button></div>`
  };

  const toggleInSet = (set, value) => (set.has(value) ? set.delete(value) : set.add(value), set);
  const pressKey = key => {
    if (key === '清除') return '';
    if (key === '撥出') return state.dial;
    return DIAL_RESULTS[state.dial] || state.dial.length >= 3 ? key : state.dial + key;
  };
  const actions = {
    intro: () => { state.introShown = true; },
    reveal: () => { state.revealed.add(state.card); },
    'card-prev': () => { state.card = Math.max(0, state.card - 1); },
    'card-next': () => { state.card = Math.min(SCENARIOS.length - 1, state.card + 1); },
    'card-go': button => { state.card = Number(button.dataset.index); },
    phrase: button => { state.phrases.add(Number(button.dataset.index)); },
    recite: () => { state.recite = Math.min(3, state.recite + 1); },
    helper: button => { toggleInSet(state.circle, button.dataset.name); },
    key: button => { state.dial = pressKey(button.dataset.key); },
    feeling: button => { state.feeling = button.dataset.name; state.said = false; },
    say: () => { state.said = true; },
    restart: () => { state = freshState(); }
  };

  root.innerHTML = `<div class="bv-bar"><ol class="bv-steps">${STAGES.map((stage, index) => `<li><button type="button" data-goto="${index}"><span>${index + 1}</span>${esc(stage.label)}<small>${minutesLabel(stage.seconds)}</small></button></li>`).join('')}</ol><div class="bv-tools"><button type="button" class="bv-timer" data-timer aria-label="開始或暫停計時"><span data-clock>00:00</span><small>/ ${clock(TOTAL_SECONDS)}</small></button><button type="button" class="bv-tool" data-notes aria-pressed="false">老師提示</button><button type="button" class="bv-tool" data-full>全螢幕</button></div></div><div class="bv-stage" data-stage tabindex="-1"></div><div class="bv-nav"><button type="button" class="bv-button" data-prev>← 上一關</button><span class="bv-progress" data-progress></span><button type="button" class="bv-button primary" data-next>下一關 →</button></div><aside class="bv-notes" data-notes-panel hidden aria-label="老師提示"><div data-stage-notes></div><section class="bv-disclosure"><h3>如果有孩子說出來</h3><ol>${DISCLOSURE_STEPS.map(step => `<li>${esc(step)}</li>`).join('')}</ol></section></aside><p class="visually-hidden" aria-live="polite" data-live></p>`;

  const stageEl = root.querySelector('[data-stage]');
  const notesPanel = root.querySelector('[data-notes-panel]');
  const notesButton = root.querySelector('[data-notes]');
  const live = root.querySelector('[data-live]');
  const clockEl = root.querySelector('[data-clock]');
  const timerButton = root.querySelector('[data-timer]');

  function render() {
    const stage = STAGES[state.stage];
    stageEl.dataset.view = stage.id;
    stageEl.innerHTML = views[stage.id]();
    root.querySelectorAll('[data-goto]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.goto) === state.stage)));
    root.querySelector('[data-prev]').disabled = state.stage === 0;
    root.querySelector('[data-next]').disabled = state.stage === STAGES.length - 1;
    root.querySelector('[data-progress]').textContent = `第 ${state.stage + 1} 關 / 共 ${STAGES.length} 關 · 建議 ${minutesLabel(stage.seconds)}`;
    root.querySelector('[data-stage-notes]').innerHTML = `<h3>${esc(stage.label)}（${minutesLabel(stage.seconds)}）</h3><ul>${stage.notes.map(note => `<li>${esc(note)}</li>`).join('')}</ul>`;
  }
  function goTo(index) {
    const next = Math.max(0, Math.min(STAGES.length - 1, index));
    if (next === state.stage) return;
    state.stage = next;
    if (!timer.running && elapsedSeconds() === 0) toggleTimer();
    render();
    live.textContent = `第 ${next + 1} 關：${STAGES[next].label}`;
    stageEl.focus({preventScroll:true});
  }
  function tick() {
    const seconds = elapsedSeconds();
    clockEl.textContent = clock(seconds);
    timerButton.classList.toggle('is-over', seconds > TOTAL_SECONDS);
  }
  function toggleTimer() {
    if (timer.running) timer.banked += Date.now() - timer.startedAt;
    else timer.startedAt = Date.now();
    timer.running = !timer.running;
    timerButton.classList.toggle('is-running', timer.running);
    tick();
  }
  function toggleNotes() {
    notesPanel.hidden = !notesPanel.hidden;
    notesButton.setAttribute('aria-pressed', String(!notesPanel.hidden));
  }
  function toggleFullscreen() {
    const request = document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.();
    Promise.resolve(request).catch(error => { live.textContent = `無法切換全螢幕：${error.message}`; });
  }

  stageEl.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    actions[button.dataset.action]?.(button);
    render();
    const focusTarget = stageEl.querySelector(`[data-action="${button.dataset.action}"]${button.dataset.index ? `[data-index="${button.dataset.index}"]` : ''}${button.dataset.name ? `[data-name="${CSS.escape(button.dataset.name)}"]` : ''}${button.dataset.key ? `[data-key="${button.dataset.key}"]` : ''}`);
    (focusTarget || stageEl).focus({preventScroll:true});
  });
  root.querySelectorAll('[data-goto]').forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.goto))));
  root.querySelector('[data-prev]').addEventListener('click', () => goTo(state.stage - 1));
  root.querySelector('[data-next]').addEventListener('click', () => goTo(state.stage + 1));
  timerButton.addEventListener('click', toggleTimer);
  notesButton.addEventListener('click', toggleNotes);
  root.querySelector('[data-full]').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => root.classList.toggle('is-full', document.fullscreenElement === root));
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest?.('input,textarea,select')) return;
    const keyActions = {ArrowRight:() => goTo(state.stage + 1), PageDown:() => goTo(state.stage + 1), ArrowLeft:() => goTo(state.stage - 1), PageUp:() => goTo(state.stage - 1), n:toggleNotes, N:toggleNotes, f:toggleFullscreen, F:toggleFullscreen};
    const run = keyActions[event.key];
    if (!run) return;
    event.preventDefault();
    run();
  });
  setInterval(() => { if (timer.running) tick(); }, 1000);
  render();
})();
