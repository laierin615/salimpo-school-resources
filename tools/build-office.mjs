// 村辦公室：把 .runtime/office-links.json 用通關密碼加密成 dist/office-data.js。
// 網站上只放加密後的內容；連結原文與密碼都只留在本機 .runtime（已列入 .gitignore）。
//   OFFICE_PASSWORD='…' node tools/build-office.mjs        用環境變數的密碼加密
//   node tools/build-office.mjs                            改讀 .runtime/office-password.txt 第一行
//   node tools/build-office.mjs --check                    只檢查現有 office-data.js 能不能用這組密碼解開
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto as crypto} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.join(root, '.runtime');
const out = path.join(root, 'dist', 'office-data.js');
const ITERATIONS = 600000;

const passwordFile = path.join(runtime, 'office-password.txt');
const password = (process.env.OFFICE_PASSWORD ?? (fs.existsSync(passwordFile) ? fs.readFileSync(passwordFile, 'utf8').split(/\r?\n/)[0] : '')).trim();
if (password.length < 8) {
  console.error('需要至少 8 個字元的通關密碼：設定 OFFICE_PASSWORD，或寫在 .runtime/office-password.txt 第一行。');
  process.exit(1);
}

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = bytes => Buffer.from(bytes).toString('base64');
const unb64 = text => new Uint8Array(Buffer.from(text, 'base64'));
const deriveKey = async (salt, usage) => {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, [usage]);
};
const decryptVault = async vault => JSON.parse(dec.decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: unb64(vault.iv)}, await deriveKey(unb64(vault.salt), 'decrypt'), unb64(vault.data))));
const readVault = () => {
  const text = fs.readFileSync(out, 'utf8');
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
};

if (process.argv.includes('--check')) {
  const payload = await decryptVault(readVault());
  console.log(`office-data.js 可以用這組密碼解開：${payload.groups.length} 組、${payload.groups.reduce((n, g) => n + g.links.length + (g.grid || []).reduce((m, row) => m + row.cells.length, 0), 0)} 個連結。`);
  process.exit(0);
}

// 把教案紀錄的分頁代號換成完整網址，網頁端只拿到可以直接點的連結
const source = JSON.parse(fs.readFileSync(path.join(runtime, 'office-links.json'), 'utf8'));
const tabUrl = (doc, tab) => `${doc}?tab=${tab}`;
const payload = {
  groups: source.groups.map(group => ({
    title: group.title,
    note: group.note || '',
    links: group.links.map(link => ({label: link.label, url: link.url || tabUrl(group.doc, link.tab), kind: link.kind || 'doc', main: !!link.main})),
    ...(group.grid ? {grid: group.grid.map(row => ({course: row.course, cells: row.cells.map(([band, tab]) => ({band, url: tabUrl(group.doc, tab)}))}))} : {})
  }))
};
for (const group of payload.groups) for (const url of [...group.links.map(l => l.url), ...(group.grid || []).flatMap(r => r.cells.map(c => c.url))])
  if (!/^https:\/\/(docs\.google\.com|drive\.google\.com\/drive\/folders|padlet\.com)\//.test(url)) throw new Error('只接受 Google 文件、雲端資料夾與 Padlet 連結：' + url);

const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const data = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await deriveKey(salt, 'encrypt'), enc.encode(JSON.stringify(payload))));
const vault = {v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data)};
fs.writeFileSync(out, `// 村辦公室連結（已加密，用 tools/build-office.mjs 產生，請勿手動修改）\nwindow.OFFICE_VAULT=${JSON.stringify(vault)};\n`);

// 寫完立刻解一次，確認同一組密碼打得開
const check = await decryptVault(readVault());
if (JSON.stringify(check) !== JSON.stringify(payload)) throw new Error('加密後解不回原文');
console.log(`已加密 ${payload.groups.length} 組連結到 dist/office-data.js（PBKDF2 ${ITERATIONS} 次＋AES-GCM），並確認可以解開。`);
