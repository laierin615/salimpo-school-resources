# Salimpo 山海學習聚落

寧埔國小課程、教案、教材、文史、展演與競賽成果，以及評鑑和原民會訪視資料的圖文網站。

網站：<https://laierin615.github.io/salimpo-school-resources/>

## 內容

- 12個可點選的3D聚落地點：11個主島入口，以及連到海岸阿美語競賽訓練場的「族語挑戰島」小外島。
- 手繪Salimpo主Logo，保留原圖的山、太陽、彩色字母與筆觸，用於首頁、子頁、頁尾及網站圖示。
- 12個頁面、63筆資料入口、31個教案閱讀主題、25項展演及比賽成果；24項評鑑指標皆附學校做法與關聯頁面。
- 20卷完整閱讀內容，共1194頁PDF圖像及章節式文字、表格、照片。
- 114原始課程架構圖、115・116螺旋式課程設計、四個合作計畫。
- 文史館15個主題入口與7篇完整文史內容；首頁循環六組族語與中文短句。
- 原民會訪視專區：10月30日10:00、四大面向12項、三份官方表件、八場研習、經費彙整與29份核銷原件目錄。

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
- 附件：`dist/attachments/`。

所有站內連結使用相對路徑，支援GitHub Pages專案子目錄。網站供持有網址者免登入瀏覽。

## 內容註記

3D場景是資料導覽示意。族語挑戰島開啟另一本校族語訓練網站。115文化學習場域撤案內容不納入。

教案閱讀主題數與完成詳案套數、實際授課節數分別核計。未載研習時長不推填。114核定減累計結報差額不表示已繳回；115呈現修正版預算，不視為正式核定或實支。

Logo由使用者提供手繪原圖，透過內建imagegen去除周圍拍攝背景並整理照明。Three.js與其MIT授權隨站封裝於 `dist/vendor/`。
