(() => {
 const data=window.SCHOOL_DATA;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // 這一站自己的研習照片（113 上學期成果報告掃描頁、114 上學期成果報告、自評佐證附冊裁出），登記進全站照片清單，點了用同一個放大窗
 const own={'113-wuling-1':[530,398],'113-wuling-2':[519,385],'113-trail-1':[518,334],'113-trail-2':[509,316],'113-fengbin-1':[495,374],'113-fengbin-2':[522,372],'113-shaman-1':[484,362],'113-shaman-2':[517,384],'114-wine-1':[607,394],'114-wine-2':[608,394],'114-stitch-1':[695,425],'114-weave-2':[871,653],'114-expert-1':[573,430]};
 for(const [id,[width,height]] of Object.entries(own))data.assets['training-'+id]={src:`media/training/${id}.webp`,thumb:`media/training/${id}-thumb.webp`,width,height};
 const photo=(id,caption)=>({id:own[id]?'training-'+id:id,caption});
 const lesson=id=>{const l=data.lessons.find(x=>x.id===id);return l&&{href:'lessons.html?lesson='+encodeURIComponent(id),label:`教案：${l.title}（${l.band}）`};};
 const record=id=>{const r=data.resources.find(x=>x.id===id);return r&&{href:'resource.html?id='+encodeURIComponent(id),label:r.title};};
 const topic=t=>({href:'lessons.html?topic='+encodeURIComponent(t),label:`主題課程：${t}`});
 const steps=id=>{const j=(data.journeys||[]).find(x=>x.id===id);return j&&{href:'journeys.html#'+id,label:`步驟卡：${j.short||j.title}`};};
 const site=(href,label)=>({href,label,external:true});
 const report114a={href:'reader.html?book=report114a&page=39',label:'114 學年度上學期成果報告（教師培訓）'};
 const report114b={href:'reader.html?book=report114b&chapter=15',label:'114 學年度下學期成果報告（教師培訓與專業成長）'};
 const years=[
  {id:'y113',year:'113 學年度',tag:'籌備期',title:'先認識部落，再學寫課程',
   lead:'113 學年度是實驗教育的籌備期。老師從部落的編織、祭儀、古道、家屋和醃肉學起，也到花蓮兩所阿美族實驗學校參訪、共備，學習寫教案、做田野調查，為 114 學年度的主題課程做準備。學校辦理的文化研習（含兩次校際參訪）共 10 場、29 小時。',
   note:'時數依教師研習紀錄。資料來源：教師研習紀錄、各場研習的課程表與成果紀錄、113 學年度上學期成果報告、115 學年度自我評鑑佐證附冊。',
   relationLabel:'對應課程',
   sessions:[
    {id:'t-113-wuling',date:'113.08.27',time:'10:00–12:00',title:'武陵國小入校分享實驗文化課',place:'本校會議室',lecturer:'莊鵬輝、江念珍（武陵國小）',
     content:'武陵國小入校輔導，說明教案怎麼寫，也分享他們的實驗文化課。',
     points:['分享實驗教育課程經驗，說明課程架構','帶老師實作編寫教案與教材','分享怎麼蒐集教材'],
     photos:[photo('113-wuling-1','武陵國小入校說明教案編寫'),photo('113-wuling-2','武陵國小入校分享實驗文化課')],
     relation:'參考實驗學校的教案寫法，作為撰寫本校文化課程教案的參考。',links:[{href:'lessons.html',label:'山海探索站：各年段教案'}]},
    {id:'t-1131009',date:'113.10.09',hours:3,title:'原住民傳統編織',place:'本校',
     content:'阿美族文化課程研習：認識原住民傳統編織與工藝文化。',
     relation:'對應主題：傳統工藝。',links:[lesson('L-A-02'),lesson('L-B-05'),topic('服飾與工藝')]},
    {id:'t-1131016',date:'113.10.16',hours:3,title:'巫師祭典文化探究',place:'本校',lecturer:'太巴塱部落巫師',
     content:'邀請太巴塱部落的巫師入校，分享阿美族的祭儀文化。',
     photos:[photo('113-shaman-1','邀請太巴塱巫師入校分享祭儀文化'),photo('113-shaman-2','邀請太巴塱巫師入校分享祭儀文化')],
     relation:'對應主題：祭儀文化。',links:[lesson('L-A-18'),topic('祭典與生活')]},
    {id:'t-1131113',date:'113.11.13',hours:3,title:'原鄉大庄古道踏查',place:'大庄古道',lecturer:'部落耆老',
     content:'部落耆老帶著老師走大庄古道，邊走邊說明先人留下的文化軌跡。',
     photos:[photo('113-trail-1','探索大庄古道'),photo('113-trail-2','部落耆老帶領並說明先人的文化軌跡')],
     relation:'對應主題：部落踏查。',links:[lesson('L-A-20'),lesson('L-A-07'),topic('部落與歷史')]},
    {id:'t-1131127',date:'113.11.27',hours:3,title:'認識部落',place:'本校會議室',lecturer:'馬撒歐‧尼卡爾（文化指導員）',
     content:'阿美族文化課程研習：講師用〈阿美族社會階層〉簡報介紹學校所在部落的文化與生活，校長提出問題請講師解答，老師們再一起討論、共作教案。',
     points:['部落 niyaro\' 與八個氏族','母系家庭','年齡階級與集會所','飲食：hakhak 糯米飯、siraw 醃肉'],
     relation:'對應主題：部落文化。',links:[lesson('L-A-07'),topic('部落與歷史')]},
    {id:'t-1131204',date:'113.12.04',time:'13:00–16:00',hours:3,title:'參訪豐濱國小阿美族聖山 Cilangasan 實驗學校',place:'花蓮縣豐濱國小',lecturer:'陳仙萱校長、黃宣文組長、黃青好主任（豐濱國小）',
     content:'阿美族實驗教育計畫研討：到豐濱國小觀摩民族教育課程與校園空間，三位講者各分享約一小時。',
     points:['評量規準怎麼用（項目與等第）','低、中、高年級的教案怎麼寫','用 Padlet 存放課程資料','課程設計規劃與 AI 工具的使用'],
     photos:[photo('113-fengbin-1','參訪豐濱國小'),photo('113-fengbin-2','陳仙萱校長分享文化課')],
     relation:'校際參訪：觀摩阿美族實驗學校的民族教育課程與校園空間。'},
    {id:'t-1140121',dateLabel:'114.01.21–01.23',time:'每天 8:00–16:00',days:3,title:'花蓮縣豐濱國小寒假共備',place:'花蓮縣豐濱國小',people:'課研主任、東華大學協作人力、民族教育教師、族語教師、文化指導員，共 5 人',
     content:'上學期參訪豐濱國小後，豐濱國小邀請本校老師參加寒假共備。寒假跨縣到豐濱國小共同備課三天，學習實驗課程的教案格式與共備機制。',
     relation:'對應：教案格式與共備機制。'},
    {id:'t-1140305',date:'114.03.05',hours:2,title:'阿美族家屋參訪實察',place:'成功家屋（校外實察）',
     content:'到成功家屋實地參訪阿美族傳統家屋，也體驗飛魚編織。',
     points:['講師說明飛魚的製作方式和材料','老師動手編飛魚，完成的作品一起展示','認識以前打獵時隨身帶的容器'],
     relation:'對應主題：家屋實察。',links:[lesson('L-A-12'),lesson('L-B-08'),steps('house-math')]},
    {id:'t-1140326',date:'114.03.26',hours:3,title:'文化課程增能之田調流程',place:'本校',
     content:'學習文化課程的田野調查流程。',
     relation:'對應主題：田野調查方法。',links:[topic('部落與歷史')]},
    {id:'t-1140409',date:'114.04.09',time:'13:00–16:00',hours:3,title:'文化課程撰寫指導工作坊',place:'本校自然教室',lecturer:'陳仙萱校長、黃青好主任、黃宣文組長（豐濱國小）',
     content:'豐濱國小三位講者入校，帶老師練習把部落文化寫成課程與教案，也用 AI 檢視課程邏輯。',
     points:['陳仙萱校長：課程設計回饋','黃青好主任：編寫教案與教材','黃宣文組長：示範用 AI 優化課程內容','老師分組用 AI 檢視課程邏輯，再用 Padlet 把教案用語分類'],
     relation:'對應主題：教案撰寫。',links:[{href:'lessons.html',label:'山海探索站：各年段教案'}]},
    {id:'t-1140430',date:'114.04.30',hours:3,title:'參訪永豐國小 Cilamitay 阿美族實驗小學',place:'花蓮縣永豐國小',lecturer:'鄭語謙主任、李郁城主任（永豐國小）',
     content:'到花蓮縣富里鄉永豐國小 Cilamitay 阿美族實驗小學參訪，交流實驗教育的行政與課程經驗。',
     points:['鄭語謙主任帶校園巡禮，介紹校舍怎麼搭配課程','李郁城主任分享文化課程設計規劃','綜合座談'],
     relation:'校際參訪：行政與課程經驗交流。'},
    {id:'t-1140604',date:'114.06.04',hours:3,title:'文化課程增能－醃肉製程探究',place:'本校',
     content:'探究阿美族醃肉（siraw）的製作過程。',
     relation:'對應主題：飲食文化。低年級「生活禁忌」教案也教 siraw 醃肉的製作禁忌。',links:[lesson('L-A-17'),lesson('L-A-03')]}
   ]},
  {id:'y114',year:'114 學年度',tag:'實施第一年',title:'研習主題，轉化成課堂單元',
   lead:'114 學年度是實驗課程實施的第一年。8 場校本研習各有對應的課堂單元：老師先在研習裡動手做，再轉化成課堂活動，學生的作品和成果展呈現學習成果。文化專家也定期入校，和老師一起備課。',
   note:'時數依教師研習紀錄；研習內容依各場研習的課程表、成果紀錄與成果報告；「帶回課堂」與「學生成果」依 115 年原民會訪視簡報〈教師進修：研習主題與課堂轉化〉。',
   more:{href:'visits.html#training',label:'原民會訪視專區：八場研習，文化走進教學'},
   relationLabel:'帶回課堂',impactLabel:'學生成果',
   sessions:[
    {id:'t-1140924',date:'114.09.24',time:'14:00–16:00',hours:2,title:'釀酒文化',place:'本校會議室',lecturer:'王勤偉（民族教育教師）',people:'全校教師 12 人',
     content:'認識阿美族傳統釀酒文化，透過操作體驗，把傳統知識轉成課程教材。',
     points:['教案設計簡介','酒麴的製作與實作','酒釀的製作與實作：混合糯米和酒麴、裝罐'],
     photos:[photo('114-wine-1','釀酒課程設計實作'),photo('114-wine-2','釀酒課程設計實作')],
     relation:'生活美飲食文化單元',impact:'人文信仰課程實作',links:[lesson('L-A-03'),lesson('L-A-18')],source:report114a},
    {id:'t-1141119',date:'114.11.19',hours:2,title:'傳統服飾、編織與課程設計（十字繡 PBL）',place:'本校',lecturer:'外聘講師、課研處',people:'全校教師 12 人',
     content:'從阿美族工藝文化和十字繡（Mitesel）實作出發，學習用 PBL 專題式學習設計跨領域文化課程。',
     photos:[photo('114-stitch-1','十字繡課程設計實作')],
     relation:'中年級十字繡、串珠課程',impact:'成果展十字繡闖關；線上教材十字繡',links:[lesson('L-B-05'),steps('cross-stitch'),steps('beading'),site('https://salimpo-curriculum.nbps14467101.chatgpt.site/#/mitesel','線上教材：Mitesel 十字繡'),record('EVENT-003')],source:report114a},
    {id:'t-1141203',date:'114.12.03',hours:3,title:'「發現天生科學家」科學博覽會講座',place:'本校會議室',lecturer:'賴奕芸老師（本校）',people:'全校教師 12 人',
     content:'臺東縣原住民族教育資源中心子計畫的研習，在本校辦理。用像 RPG 遊戲的介面帶老師走過科展選題：從生活經驗聚焦研究問題，把耆老的口傳智慧轉成可以測量的科學數據。',
     points:['示範用科技工具做顯微觀察、控制變因、蒐集數據','案例：獵人生火、清潔植物無患子、咬人貓和咬人狗的焮毛'],
     photos:[photo('photo-b69860cc9fcfd275','原科解密研習現場'),photo('photo-7cb4c0126688e9ef','原科解密研習現場'),photo('photo-1f7487a37c210a6f','原科解密研習現場')],
     relation:'高年級漁獵科展專題',impact:'銀熊獎、科學傳播獎',links:[lesson('L-B-07'),record('EVENT-004'),site('https://laierin615.github.io/yuan-ke-jie-mi/','原科解密網站')],source:{href:'reader.html?book=scienceProject',label:'原資中心｜兩場文化科學研習圖文'}},
    {id:'t-1141210',date:'114.12.10',hours:2,title:'傳統狩獵文化與生態智慧',place:'本校',lecturer:'部落耆老、獵人',people:'全校教師 12 人',
     content:'認識阿美族狩獵文化與在地生活知識，累積文化課程的設計素材。',
     relation:'高年級 Mipacing 漁獵專題',impact:'線上教材 Mipacing；成果展漁獵展點',links:[lesson('L-B-07'),record('STORY-003'),site('https://mipacing-pov-game.nbps14467101.chatgpt.site/game','線上教材：Mipacing 情境遊戲')],source:report114a},
    {id:'t-1141224',date:'114.12.24',hours:2,title:'野菜運用與共享飲食文化課程設計',place:'本校',lecturer:'部落耆老、文化指導員',people:'全校教師 12 人',
     content:'探討部落共食的文化脈絡，把生活、分享和課程設計連在一起。',
     relation:'成果展完功宴設計',impact:'部落家長共辦 Pakelang 完功宴',links:[record('EVENT-003'),steps('exhibition')],source:report114a},
    {id:'t-1150401',date:'115.04.01',time:'13:30–15:30',hours:2,title:'原民教育×戶外探索',place:'本校會議室',lecturer:'高睿哲老師',
     content:'協助老師把原民教育、戶外探索和在地場域轉成課程任務，強化戶外踏查前的安全規劃、文化敏感性與學習引導。',
     photos:[photo('photo-17c6a4a196f7caf4','115.4.1 原民教育與戶外探索研習')],
     relation:'戶外踏查安全與文化敏感性',impact:'山野教育、漁獵海洋教育',links:[lesson('L-B-07'),topic('山林與植物')],source:report114b},
    {id:'t-1150422',date:'115.04.22',hours:2,title:'實驗教育課程發展與教學實踐（月桃葉編織）',place:'本校會議室',lecturer:'吳鳳美老師',
     content:'認識月桃葉的材料處理、編織技法與工藝文化，老師動手用月桃葉編杯袋，再把植物材料、手作技藝和課程設計連在一起，作為自然素材工藝課程與實作評量的基礎。',
     photos:[photo('photo-06928c7f44a6e304','115.4.22 月桃葉編織研習'),photo('114-weave-2','老師完成月桃葉編織作品')],
     relation:'串珠、Loma\' 藤綁、竹編',impact:'成果展 Loma\' 家屋模型',links:[lesson('L-B-08'),record('STORY-002'),steps('house-math')],source:report114b},
    {id:'t-1150513',date:'115.05.13',hours:3,title:'文化融入素養導向教學與評量（桌遊）',place:'本校會議室',lecturer:'陳昱豪老師',
     content:'把族語詞彙、部落生活知識、山海文化經驗和遊戲機制結合，設計學生容易參與、討論和反覆練習的學習活動；老師先實際體驗，再討論怎麼轉化成課程。',
     photos:[photo('photo-40e8c145dfc8637e','115.5.13 桌遊融入阿美族文化研習')],
     relation:'族語詞彙遊戲化',impact:'族語認證練習',links:[topic('族語與故事')],source:report114b},
    {id:'t-114-experts',dateLabel:'114.12.02–115.01.28',title:'文化專家入校共備',place:'本校',lecturer:'Masao Nikar 馬撒歐‧尼卡爾（阿美語文史）、Madal Arik 陳祈宏（阿美族語音樂創作）',
     content:'114 學年度上學期，文化專家入校和老師一起備課 12 次：討論山野教育課程、整理場地和教具、整理漁獵資料、撰寫教材和專題族語內容，也一起做科展研究。每週二老師還有共同備課，一起學族語、分享授課內容。',
     photos:[photo('114-expert-1','114.12.04 文化專家共備：山野教育課程討論')],
     relation:'教案文化用語校訂、教材書稿',impact:'114.12.18 全校山野課程（膽曼山區）；族語教材與科展研究',links:[{href:'library.html',label:'教材書屋：族語教材'},record('EVENT-004')]}
   ]}
 ];
 // 卡片從日期最新的排到最舊：114 學年度在前；有日期範圍的看最後一天，沒有確切日期的排在該學年度最後
 const dayKey=s=>{const d=[...String(s.date||s.dateLabel||'').matchAll(/(\d{3})\.(\d{2})\.(\d{2})/g)].pop();return d?+d[1]*10000+ +d[2]*100+ +d[3]:0;};
 const shown=[...years].reverse().map(y=>({...y,sessions:[...y.sessions].sort((a,b)=>dayKey(b)-dayKey(a))}));
 const week='日一二三四五六';
 const when=s=>{const bits=[];if(s.date){const [y,m,d]=s.date.split('.').map(Number);bits.push('星期'+week[new Date(Date.UTC(y+1911,m-1,d)).getUTCDay()]);}if(s.time)bits.push(s.time);if(s.hours)bits.push(s.hours+' 小時');if(s.days)bits.push(s.days+' 天');return bits;};
 const fact=(label,value)=>value?`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`:'';
 const link=l=>`<a class="text-link" href="${esc(l.href)}"${l.external?' target="_blank" rel="noopener"':''}>${esc(l.label)}${l.external?' ↗':'&nbsp;→'}</a>`;
 const card=(y,s)=>{const links=(s.links||[]).filter(Boolean),shots=s.photos||[];
  return `<li class="training-card" id="${esc(s.id)}"><p class="training-when"><b>${esc(s.dateLabel||s.date)}</b>${when(s).map(b=>`<span>${esc(b)}</span>`).join('')}</p><h3>${esc(s.title)}</h3><dl class="training-facts">${fact('地點',s.place)}${fact('講師',s.lecturer)}${fact('參加',s.people)}</dl><p class="training-content">${esc(s.content)}</p>${s.points?.length?`<ul class="training-points">${s.points.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}${shots.length?`<div class="photo-gallery training-photos count-${shots.length}">${shots.map(p=>{const a=data.assets[p.id];return a?`<button class="photo-open" type="button" data-photo="${esc(p.id)}" data-caption="${esc(s.title)}｜${esc(p.caption)}" aria-label="放大照片：${esc(p.caption)}"><img src="${esc(a.thumb)}" alt="${esc(p.caption)}" width="${a.width}" height="${a.height}" loading="lazy" decoding="async"><span>放大觀看 ↗</span></button>`:'';}).join('')}</div>`:''}<div class="training-link"><p><span>${esc(y.relationLabel)}</span>${esc(s.relation)}</p>${s.impact&&y.impactLabel?`<p><span>${esc(y.impactLabel)}</span>${esc(s.impact)}</p>`:''}</div>${links.length?`<div class="training-go">${links.map(link).join('')}</div>`:''}${s.source?`<p class="training-source">出處：<a href="${esc(s.source.href)}">${esc(s.source.label)} ↗</a></p>`:''}</li>`;};
 const main=document.getElementById('main');
 main.innerHTML=`<header class="page-heading"><div class="breadcrumb"><a href="index.html">首頁</a><span>/</span><span>老師的工寮</span></div><p class="ami-tag"><i class="ami" lang="ami">talo'an</i><span>工寮</span></p><h1>老師的工寮：先學會，再帶回課堂。</h1><p>talo'an 是阿美語的「工寮」，田邊、山邊搭的小屋，也可以指部落的集會所。113、114 學年度，老師在這裡參加文化研習、到實驗學校參訪共備，也請文化專家入校。每一張卡片寫下研習的時間、地點、講師、內容和對應的課程；114 學年度的卡片也寫出帶回課堂的單元和學生成果。</p></header>
<div class="page-body training-page"><nav class="topic-nav" aria-label="學年度">${shown.map(y=>`<a href="#${y.id}">${esc(y.year)}｜${esc(y.tag)}</a>`).join('')}</nav><p class="training-note">卡片從最新的研習排起。點照片可以放大，卡片下方可以連到相關的教案和學生成果。</p>
${shown.map(y=>`<section class="training-year" id="${y.id}"><div class="training-year-head"><p class="eyebrow">${esc(y.year)} · ${esc(y.tag)} · ${y.sessions.length} 張卡片</p><h2>${esc(y.title)}</h2><p>${esc(y.lead)}</p>${y.more?`<p>${link(y.more)}</p>`:''}</div><ol class="training-list">${y.sessions.map(s=>card(y,s)).join('')}</ol><p class="training-year-note">${esc(y.note)}</p></section>`).join('')}
<section class="training-next"><h2>研習之後，去哪裡看課程和成果？</h2><p>老師帶回課堂的單元在山海探索站；學生的作品、成果展和比賽在成果廣場。評鑑指標 3-3「教師專業成長」的佐證放在會客室。</p><div class="detail-actions"><a class="button primary" href="lessons.html">山海探索站 →</a><a class="button" href="stories.html">成果廣場 →</a><a class="button" href="reviews.html?group=3">會客室：3-3 教師專業成長 →</a></div></section></div>`;
 if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target)requestAnimationFrame(()=>target.scrollIntoView());}
})();
