// 全站搜尋索引：從 dist 裡的資料檔與靜態頁面產生兩個檔
//   dist/search-index.json：資料服務站「網站其他地方也找到」——教案、步驟卡、評鑑指標、族語詞、電子報、首頁故事卡等
//   dist/search-books.json：閱讀室書頁全文（約 0.5MB，按了「在書頁全文裡找」才下載）
// 63 筆資料入口不放進來：資料服務站原本的清單就搜得到（含 Masao 老師文史全文）。
// 只讀公開內容：不讀村辦公室（office*.js、.runtime/），也不讀 archive/。
// 用法：node tools/build-search.mjs           產生（內容沒變就不改檔）
//       node tools/build-search.mjs --check   只檢查：索引和資料同步、每筆連結都找得到（verify-site 也會呼叫）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = path.join(ROOT, 'dist');
export const CORE_FILE = 'search-index.json';
export const BOOKS_FILE = 'search-books.json';

// 種類的順序就是同分時的排序：課程內容在前，導覽與行政在後
const KINDS = ['教案', '學習步驟卡', '山海探索站主題', '課程架構屋', '文史資料館', '教材書屋', '族語詞', '首頁故事卡', '聚落的 singsi', '影音', '電子報', '評鑑指標', '原民會訪視', '首頁站牌', '網站頁面'];
// 不放進「網站頁面」：村辦公室（加密）、內容頁的外殼、會轉址的舊頁、資料服務站自己
const SKIP_PAGES = new Set(['office.html', 'reader.html', 'resource.html', 'learning.html', 'resources.html']);

// 文字清理：只做不改變意思的整理，畫面上的片段照原文顯示；比對時的寫法統一（全形半形、撇號、台／臺、大小寫）在瀏覽器做
const CJK = '\\u2e80-\\u2fff\\u3001-\\u303f\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef';
const JOIN = new RegExp(`([${CJK}])[ \\t\\r\\n\\u3000]+(?=[${CJK}])`, 'g');
const squash = v => String(v ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
// PDF 轉出來的文字常在詞中間斷行（「課程設」換行「計素材」）：中文字之間的空白和換行接回去
const squashPdf = v => squash(String(v ?? '').normalize('NFC').replace(JOIN, '$1'));
const join = (...parts) => squash(parts.flat(Infinity).filter(v => typeof v === 'string' || typeof v === 'number').join(' '));
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[e.toLowerCase()] ?? m));
// 每個結束標籤後補一個空白（族語和中文才不會黏在一起），再把中文字之間多出來的空白接回去（「山」「海」分開包的標題）
const htmlText = h => squashPdf(decode(String(h)
  .replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<\/[a-z][a-z0-9]*>/gi, '$& ')
  .replace(/<[^>]+>/g, '')));
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? decode(m[1]) : ''; };

function loadData(dist) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ['data.js', 'words-data.js', 'singsi.js', 'media-links.js']) {
    vm.runInContext(fs.readFileSync(path.join(dist, f), 'utf8'), ctx, { filename: f });
  }
  const w = ctx.window;
  if (!w.SCHOOL_DATA || !w.SALIMPO_WORDS || !w.SALIMPO_SINGSI || !w.SCHOOL_MEDIA) throw new Error('資料檔沒有載入完整（data.js、words-data.js、singsi.js、media-links.js）');
  return { data: w.SCHOOL_DATA, words: w.SALIMPO_WORDS, singsi: w.SALIMPO_SINGSI, media: w.SCHOOL_MEDIA };
}

function coreDocs(dist, { data, words, singsi, media }) {
  const docs = [];
  const add = (kind, url, title, summary, text) => {
    const k = KINDS.indexOf(kind);
    if (k < 0) throw new Error('未知的種類：' + kind);
    docs.push([k, url, squash(title), squash(summary), squash(text)]);
  };
  const term = (year, semester) => year ? `${year}學年度${semester === 1 ? '上' : semester === 2 ? '下' : ''}學期` : '';
  const lessonTitle = id => data.lessons.find(l => l.id === id)?.title || '';

  // 教案：目標、詞彙、學習重點
  for (const l of data.lessons) {
    add('教案', `lessons.html?lesson=${encodeURIComponent(l.id)}`, l.title, join(`${l.band}・${l.course}・${term(l.year, l.semester)}`, l.summary), join(l.topic, l.points, l.objectives, l.vocabulary));
  }
  // 學習步驟卡：每一步和同學的話
  for (const j of data.journeys) {
    add('學習步驟卡', `journeys.html#${encodeURIComponent(j.id)}`, j.title, join(`${j.term}・${j.band}・${j.course}`, j.lead),
      join((j.steps || []).map(s => [s.title, s.text]), (j.voices || []).map(v => typeof v === 'string' ? v : [v.text, v.about])));
  }
  // 山海探索站的九個主題
  for (const t of data.lessonTopics || []) {
    add('山海探索站主題', `lessons.html?topic=${encodeURIComponent(t)}`, t, data.lessonTopicFlows?.[t] || '', '');
  }
  // 課程架構屋（課程地圖）：三美九方向、主題、學習深度、跨領域整合
  const c = data.curriculum115;
  if (c) {
    const map = '#course-core';
    for (const core of c.cores || []) for (const d of core.directions || []) {
      add('課程架構屋', `resource.html?id=PLAN-002${map}`, `${d.code} ${d.title}`, `${core.code} ${core.title}：${core.description}`, join(d.items));
    }
    if (c.spiral) add('課程架構屋', 'resource.html?id=PLAN-002#course-spiral', '兩年四學期的山海課程', c.spiral.intro, join(c.spiral.systems, (c.themes || []).map(t => [t.title, t.subtitle, t.steps, t.note])));
    for (const p of c.progress || []) add('課程架構屋', 'resource.html?id=PLAN-002#course-progress', `${p.band}｜${p.label}`, p.identity, p.text);
    if (c.integrations || c.domains) add('課程架構屋', 'resource.html?id=PLAN-002#course-integration', '跨領域整合與文化領域', '', join(c.integrations, c.domains));
  }
  // 文史資料館：有全文的 7 篇在資料入口裡；這裡放其他主題入口
  for (const t of data.historyMuseum?.topics || []) {
    if (t.hasContent && data.resources.some(r => r.id === t.resourceId)) continue;
    add('文史資料館', `museum.html?topic=${encodeURIComponent(t.id)}`, t.title, join(t.subtitle, t.summary), join(t.tags));
  }
  // 教材書屋的書
  for (const s of data.library?.shelves || []) for (const it of s.items || []) {
    add('教材書屋', `reader.html?book=${encodeURIComponent(it.book)}`, join(it.ami, it.title), join(it.by, it.meta), join(s.title, it.text));
  }
  // 族語詞庫：連到族語詞庫頁並帶上這個詞
  for (const w of words.words) {
    add('族語詞', `words.html?q=${encodeURIComponent(w.ami)}`, w.ami, w.zh, join(w.topics));
  }
  // 聚落的 singsi：小知識與族語詞，點了回首頁打開那一位的對話卡
  for (const p of singsi) {
    add('聚落的 singsi', `index.html#singsi-${encodeURIComponent(p.id)}`, p.name, join(p.where, p.prop), join(p.intro, (p.tips || []).map(t => [t.text, t.ami, t.zh])));
  }
  // 影片與 Padlet：連到放這段影音的教案或主題
  const seen = new Set();
  for (const [lessonId, list] of Object.entries(media.lessons || {})) for (const m of list) {
    if (seen.has(m.url)) continue; seen.add(m.url);
    add('影音', `lessons.html?lesson=${encodeURIComponent(lessonId)}`, m.label, `${m.type === 'video' ? '影片' : 'Padlet'}・${lessonTitle(lessonId)}`, '');
  }
  for (const [topic, list] of Object.entries(media.topics || {})) for (const m of list) {
    if (seen.has(m.url)) continue; seen.add(m.url);
    add('影音', `lessons.html?topic=${encodeURIComponent(topic)}`, m.label, `${m.type === 'video' ? '影片' : 'Padlet'}・${topic}`, '');
  }
  // 評鑑指標
  for (const i of data.indicators) {
    add('評鑑指標', `reviews.html?group=${i.group}#indicator-${i.code}`, `${i.code} ${i.title}`, i.description, join(i.groupName, i.practice));
  }
  // 原民會訪視的四大面向
  for (const g of data.visit115?.groups || []) {
    add('原民會訪視', `visits.html#${encodeURIComponent(g.id)}`, g.title, g.intro, join((g.items || []).map(it => [it.code, it.title])));
  }

  // 首頁（index.html 的靜態文字）：站牌、竹筏卡、海怪卡
  const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  for (const m of home.matchAll(/<a class="directory-row"([^>]*)>([\s\S]*?)<\/a>/g)) {
    const tag = m[1], inner = m[2];
    const title = htmlText((inner.match(/<strong data-place-title>([\s\S]*?)<\/strong>/) || [])[1] || '');
    const desc = htmlText((inner.match(/<span data-place-description>([\s\S]*?)<\/span>/) || [])[1] || '');
    add('首頁站牌', attr(tag, 'href'), title, desc, join(attr(tag, 'data-ami'), attr(tag, 'data-ami-zh'), attr(tag, 'data-category'), attr(tag, 'data-go2').replace(/[↗→]/g, '')));
  }
  for (const id of ['raft-card', 'monster-card']) {
    const start = home.indexOf(`id="${id}"`);
    if (start < 0) throw new Error(`index.html 找不到 #${id}`);
    const card = home.slice(start, home.indexOf('</article>', start));
    const title = htmlText((card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '');
    const meta = htmlText((card.match(/<p class="place-meta">([\s\S]*?)<\/p>/) || [])[1] || '');
    const desc = htmlText((card.match(/<p class="raft-desc">([\s\S]*?)<\/p>/) || [])[1] || '');
    const words = htmlText((card.match(/<ul class="raft-words"[^>]*>([\s\S]*?)<\/ul>/) || [])[1] || '');
    const links = [...card.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(a => [htmlText(a[2]).replace(/[▶↗→]/g, ''), attr(a[1], 'title')]);
    // 錨點用 #raft、#monster（不對應元素），首頁打開卡片時不會把聚落捲走
    add('首頁故事卡', `index.html#${id.replace(/-card$/, '')}`, title, join(meta, desc), join(words, links));
  }

  // 電子報：每一版一筆
  const newsRoot = path.join(dist, 'newsletter');
  for (const dir of fs.readdirSync(newsRoot).sort()) {
    const file = path.join(newsRoot, dir, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const issue = htmlText((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || dir);
    const starts = [...html.matchAll(/<section id="(ban\d+)"/g)];
    starts.forEach((s, n) => {
      const part = html.slice(s.index, starts[n + 1]?.index ?? html.indexOf('</body>'));
      const heading = htmlText((part.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '');
      add('電子報', `newsletter/${dir}/#${s[1]}`, `${issue}・第${n + 1}版`, heading, htmlText(part));
    });
  }

  // 網站頁面：標題和頁面說明（星空、勇氣小學堂、老師的工寮等頁的內容不在資料檔裡，至少找得到頁面）
  for (const f of fs.readdirSync(dist).filter(f => f.endsWith('.html')).sort()) {
    if (SKIP_PAGES.has(f)) continue;
    const html = fs.readFileSync(path.join(dist, f), 'utf8');
    const title = htmlText((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || f).replace(/｜Salimpo 山海學習聚落$/, '');
    const desc = attr((html.match(/<meta name="description"[^>]*>/) || [''])[0], 'content');
    add('網站頁面', f, f === 'index.html' ? '首頁｜山海學習聚落' : title, desc, '');
  }
  return docs;
}

// 書頁全文：閱讀室的每一頁（掃描頁）或每一章（文件）一筆；Masao 文史筆記已在資料入口裡，不重複
function bookDocs(dist, { data }) {
  const books = [], docs = [];
  const blockText = blocks => (blocks || []).map(b => b.kind === 'table' ? (b.rows || []).map(row => row.map(cell => blockText(cell)).join(' ')).join(' ') : [b.text, b.caption].filter(Boolean).join(' ')).join(' ');
  for (const id of Object.keys(data.books)) {
    if (id === 'historyMuseum') continue;
    const book = JSON.parse(fs.readFileSync(path.join(dist, 'books', id + '.json'), 'utf8'));
    const pageMode = book.format === 'pages';
    const b = books.length;
    books.push([id, squash(book.title || data.books[id].title), pageMode ? 'page' : 'chapter']);
    if (pageMode) {
      const chapters = [...(book.chapters || [])].sort((x, y) => x.page - y.page);
      (book.pages || []).forEach((page, i) => {
        const text = squashPdf([page.note, page.text].filter(Boolean).join('\n'));
        if (text.length < 2) return; // 純圖片頁沒有文字
        const chapter = chapters.filter(ch => ch.page <= i + 1).pop();
        docs.push([b, i + 1, squash(chapter?.title || ''), text]);
      });
    } else {
      (book.chapters || []).forEach((chapter, i) => {
        const text = squashPdf(blockText(chapter.blocks));
        if (!text && !chapter.title) return;
        docs.push([b, i + 1, squash(chapter.title), text]);
      });
    }
  }
  return { books, docs };
}

// 每筆連結都要指到網站裡找得到的東西
function checkUrls(dist, { data, words, singsi }, core, books) {
  const problems = [];
  const has = (list, v) => list.includes(v);
  const lessonIds = data.lessons.map(l => l.id), journeyIds = data.journeys.map(j => j.id);
  const visitIds = (data.visit115?.groups || []).map(g => g.id), topicIds = (data.historyMuseum?.topics || []).map(t => t.id);
  const curriculumIds = [...fs.readFileSync(path.join(dist, 'curriculum.js'), 'utf8').matchAll(/id="(course-[a-z-]+)"/g)].map(m => m[1]);
  const bookCache = {};
  const book = id => bookCache[id] ??= JSON.parse(fs.readFileSync(path.join(dist, 'books', id + '.json'), 'utf8'));
  const check = (url, label) => {
    const u = new URL(url, 'https://site.invalid/');
    const file = decodeURIComponent(u.pathname.slice(1)) || 'index.html';
    const target = file.endsWith('/') ? file + 'index.html' : file;
    const hash = decodeURIComponent(u.hash.slice(1)), q = k => u.searchParams.get(k);
    const fail = why => problems.push(`${label}：${url}（${why}）`);
    // 首頁站牌有三站連到姊妹網站（族語競賽、古謠等），其他都要是站內相對連結
    if (/^https:\/\//.test(url) && label === '首頁站牌') return;
    if (/^[a-z]+:/i.test(url) || url.startsWith('/')) return fail('要用站內相對連結');
    if (!fs.existsSync(path.join(dist, target))) return fail('檔案不存在');
    if (target === 'resource.html') {
      if (!data.resources.some(r => r.id === q('id'))) fail('沒有這筆資料');
      if (hash && q('id') === 'PLAN-002' && !has(curriculumIds, hash)) fail('課程架構屋沒有這個段落');
    }
    if (target === 'lessons.html') {
      if (q('lesson') && !has(lessonIds, q('lesson'))) fail('沒有這份教案');
      if (q('topic') && !has(data.lessonTopics || [], q('topic'))) fail('沒有這個主題');
    }
    if (target === 'journeys.html' && hash && !has(journeyIds, hash)) fail('沒有這張步驟卡');
    if (target === 'museum.html' && q('topic') && !has(topicIds, q('topic'))) fail('沒有這個文史主題');
    if (target === 'words.html' && q('q') && !words.words.some(w => w.ami === q('q'))) fail('族語詞庫沒有這個詞');
    if (target === 'visits.html' && hash && !has(visitIds, hash)) fail('沒有這個訪視面向');
    if (target === 'reviews.html' && (q('group') || hash)) {
      const g = Number(q('group'));
      if (!(g >= 1 && g <= 7)) fail('面向編號不對');
      if (hash && !data.indicators.some(i => `indicator-${i.code}` === hash && i.group === g)) fail('這個面向沒有這項指標');
    }
    if (target === 'index.html' && hash && !(hash === 'raft' || hash === 'monster' || singsi.some(p => `singsi-${p.id}` === hash))) fail('首頁沒有這張卡');
    if (target.startsWith('newsletter/') && hash && !fs.readFileSync(path.join(dist, target), 'utf8').includes(`id="${hash}"`)) fail('電子報沒有這一版');
    if (target === 'reader.html') {
      const id = q('book');
      if (!data.books[id]) return fail('閱讀室沒有這本書');
      const b = book(id), n = Number(q('page') || q('chapter') || 1);
      const total = b.format === 'pages' ? b.count : (b.chapters || []).length;
      if (!(Number.isInteger(n) && n >= 1 && n <= total)) fail('頁碼或章節超出範圍');
      if (q('page') && b.format !== 'pages') fail('這本書要用 chapter');
      if (q('chapter') && b.format === 'pages') fail('這本書要用 page');
    }
  };
  for (const [k, url] of core.docs) check(url, KINDS[k]);
  for (const [b, n] of books.docs) {
    const [id, , mode] = books.books[b];
    check(`reader.html?book=${encodeURIComponent(id)}&${mode}=${n}`, '書頁全文');
  }
  return problems;
}

export function buildSearch(dist = DIST) {
  const loaded = loadData(dist);
  const books = { v: 1, ...bookDocs(dist, loaded) };
  const booksJson = JSON.stringify(books);
  // 書頁全文的按鈕要寫「幾卷、幾頁、要下載多少」：放在小索引裡，按之前就知道
  const mb = Math.max(0.1, Math.round(zlib.gzipSync(booksJson, { level: 9 }).length / 1048576 * 10) / 10);
  const bookMeta = { count: books.books.length, units: books.docs.length, size: `約 ${mb}MB` };
  const core = { v: 1, kinds: KINDS, books: bookMeta, docs: coreDocs(dist, loaded) };
  return { core: JSON.stringify(core), books: booksJson, problems: checkUrls(dist, loaded, core, books), stats: { core, books } };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const checkOnly = process.argv.includes('--check');
  const result = buildSearch();
  const files = [[CORE_FILE, result.core], [BOOKS_FILE, result.books]];
  const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + 'KB';
  const gz = s => (zlib.gzipSync(s, { level: 9 }).length / 1024).toFixed(0) + 'KB';
  if (result.problems.length) console.error('連結有問題：\n  ' + result.problems.join('\n  '));
  let stale = [];
  for (const [name, text] of files) {
    const file = path.join(DIST, name);
    const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text;
    if (checkOnly) { if (!same) stale.push(name); continue; }
    if (!same) fs.writeFileSync(file, text);
    console.log(`${same ? '沒變' : '已更新'} dist/${name}：${kb(text)}（壓縮後約 ${gz(text)}）`);
  }
  const counts = {};
  for (const [k] of result.stats.core.docs) counts[KINDS[k]] = (counts[KINDS[k]] || 0) + 1;
  if (!checkOnly) {
    console.log('網站其他地方：' + Object.entries(counts).map(([k, n]) => `${k} ${n}`).join('、'));
    console.log(`書頁全文：${result.stats.books.books.length} 卷、${result.stats.books.docs.length} 頁／章`);
  }
  if (stale.length) console.error(`搜尋索引過期：${stale.join('、')}。請執行 node tools/build-search.mjs`);
  if (result.problems.length || stale.length) process.exit(1);
  if (checkOnly) console.log('搜尋索引和資料同步，連結都找得到。');
}
