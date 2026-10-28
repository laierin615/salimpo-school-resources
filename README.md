# Salimpo 山海學習聚落

寧埔國小課程、教案、教材、文史、展演與競賽成果，以及評鑑和原民會訪視資料的圖文網站。

網站：<https://laierin615.github.io/salimpo-school-resources/>

## 內容

- 14個可點選的3D聚落地點：11個主島入口；兩座小外島：連到海岸阿美語競賽訓練場的「族語挑戰島」，和以阿美族女人島口傳為靈感、連到膽曼 Sa'opo 歌謠採譜網站的「女人島」；以及給老師用的第14站「村辦公室」。
- 聚落可以拖曳轉動與俯仰、平移；Ctrl／⌘＋滾輪、觸控板或雙指可以縮放，也有＋、−、復位按鈕。站牌號碼平常收起來，滑過、拖曳或點選時才浮現。
- 主選單用聚落站名：學校與部落、山海探索站、教案書屋、成果廣場、文史資料館、資料服務站、訪視評鑑會客室。
- 每一站一個族語詞（如 niyaro' 部落、dateng 野菜），首頁問候 Nga'ay ho!、頁尾 Aray!；全部取自 tatokem 已驗證詞庫，驗證腳本會再核對一次。
- 手繪Salimpo主Logo，保留原圖的山、太陽、彩色字母與筆觸，用於首頁、子頁、頁尾及網站圖示。
- 15個頁面、63筆資料入口、31個教案閱讀主題、25項展演及比賽成果；24項評鑑指標皆附學校做法與關聯頁面。
- 20卷完整閱讀內容，共1194頁PDF圖像及章節式文字、表格、照片。
- 114原始課程架構圖、115・116螺旋式課程設計、四個合作計畫。
- 「我們怎麼學」：113、114學年度10堂課的學習步驟卡，從開始動手、卡關重來到完成作品；照片中的姓名與臉已打上馬賽克，不連到原始 Padlet 留言板。
- 文史館15個主題入口與7篇完整文史內容；首頁循環六組族語與中文短句。
- 訪視評鑑會客室：分「原民會訪視」與「實驗教育評鑑」兩頁。原民會訪視為10月30日10:00、四大面向12項、三份官方表件、八場研習、經費彙整與29份核銷原件目錄；實驗教育評鑑為七大面向24項。每一項的佐證依計畫與文件、課程與教案、學習歷程與成果、部落與夥伴四類列出，另附四大文化領域與31個教案的對照、山海課程與部定領域統整表。
- 村辦公室：老師的工作小屋，輸入通關密碼才開門。裡面有打卡（只是效果，時間只留在那台裝置）、每週共備紀錄、115學年度各課程各年段教案紀錄、海岸阿美語詞資料庫與 Padlet 學校帳號。頂端列、每頁頁尾和聚落第14站都能進入。
- 星空 fo'is：把三美九向、四大文化領域、教案、學習步驟卡、成果、合作計畫與文史畫成一片可以互動的星空，像 Obsidian 的關聯圖。連線只取 `data.js` 已有的對應，不自己推測；可以拖曳、縮放、搜尋、依種類篩選，點星星看介紹再前往那一頁，也能用清單瀏覽。頂端列、每頁頁尾和夜晚的聚落天空都能進入。

## 發布與維護

GitHub Pages只發布 `dist/`。推送 `main` 分支會由 `.github/workflows/pages.yml` 驗證及自動發布。

```sh
node tools/verify-site.mjs
python3 -m http.server 8766 --directory dist
```

- 頁面及版面：`dist/*.html`、CSS、JS。
- 資料索引：`dist/data.js`。
- 完整閱讀：`dist/books/`。
- 主Logo：`dist/media/brand/salimpo-logo.png`。
- 3D場景與互動：`dist/village.js`、`dist/village-ui.js`。
- 學習步驟卡：`dist/journeys.*`，資料在 `data.js` 的 `journeys`，圖片在 `dist/media/journeys/`。
- 訪視評鑑會客室：`dist/room.js`、`dist/room.css`；佐證在 `data.js` 各訪視項目與評鑑指標的 `evidence`，教案的文化領域對照在 `curriculum115.lessonDirections`。
- 附件：`dist/attachments/`。
- 村辦公室：`dist/office.html`、`dist/office.js`、`dist/office.css`；加密後的連結 `dist/office-data.js` 由 `tools/build-office.mjs` 產生，不要手動改。
- 星空：`dist/stars.html`、`dist/stars.js`、`dist/stars.css`；星星與連線在瀏覽器裡由 `data.js` 算出，資料更新後星空跟著變，不用另外維護。

所有站內連結使用相對路徑，支援GitHub Pages專案子目錄。網站供持有網址者免登入瀏覽；只有村辦公室要輸入通關密碼。

### 村辦公室的連結與密碼

連結原文在 `.runtime/office-links.json`，密碼在 `.runtime/office-password.txt` 第一行；兩個檔都列在 `.gitignore`，不會上傳。網站上只有加密後的 `dist/office-data.js`（PBKDF2-SHA256 60萬次＋AES-256-GCM）。改了連結或換密碼後，重新加密，再驗證、推送：

```sh
node tools/build-office.mjs                    # 讀 .runtime/office-password.txt 第一行
OFFICE_PASSWORD='新密碼' node tools/build-office.mjs
node tools/build-office.mjs --check            # 確認現有 office-data.js 能用這組密碼解開
```

全校老師共用一組密碼，至少8個字元。密碼只擋住網站上的入口；文件能不能打開，仍由 Google 文件與 Padlet 的共用設定決定。

## 內容註記

3D場景是資料導覽示意。族語挑戰島開啟另一本校族語訓練網站。115文化學習場域撤案內容不納入。

教案閱讀主題數與完成詳案套數、實際授課節數分別核計。未載研習時長不推填。114核定減累計結報差額不表示已繳回；115呈現修正版預算，不視為正式核定或實支。

Logo由使用者提供手繪原圖，透過內建imagegen去除周圍拍攝背景並整理照明。Three.js與其MIT授權隨站封裝於 `dist/vendor/`。
