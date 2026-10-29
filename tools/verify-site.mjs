import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const dist=path.resolve('dist');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dist,'data.js'),'utf8'),context);
const data=context.window.SCHOOL_DATA;
assert.equal(data.resources.length,62);
assert.equal(data.eventIds.length,25);
assert.equal(data.indicators.length,24);
const ids=new Set(data.resources.map(r=>r.id));
assert.equal(ids.size,62);
for(const resource of data.resources){
  assert.ok(resource.title&&resource.summary);
  assert.ok(!('source' in resource));
  for(const id of resource.photos||[])assert.ok(data.assets[id]);
  for(const entry of resource.reading||[])assert.ok(data.books[entry.book]);
  for(const id of resource.related)assert.ok(ids.has(id),'Unknown related resource '+id);
}
for(const indicator of data.indicators){for(const id of indicator.related)assert.ok(ids.has(id));}
const pageNames=['index','about','learning','stories','reviews','resources','resource','reader','lessons','library','partnerships','journeys','museum','visits','reception','office','stars'];
for(const name of pageNames){
  const html=fs.readFileSync(path.join(dist,name+'.html'),'utf8');
  assert.ok(html.includes('lang="zh-Hant"'));
  assert.ok(html.includes('rel="icon"'));
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(url.startsWith('data:')||url.startsWith('#')||/^https?:/.test(url))continue;
    const target=url.split('?')[0].split('#')[0];
    assert.ok(fs.existsSync(path.join(dist,target)),`Missing link ${name}: ${url}`);
    if(url.startsWith('resource.html?'))assert.ok(ids.has(new URLSearchParams(url.split('?')[1]).get('id')));
  }
}
for(const filename of fs.readdirSync(dist,{recursive:true}).filter(name=>fs.statSync(path.join(dist,name)).isFile()&&/\.(html|js|css|json|txt)$/.test(name))){
  const content=fs.readFileSync(path.join(dist,filename),'utf8');
  for(const pattern of ['/Users/','source_repository_credential','relative_path','private_token'])assert.ok(!content.includes(pattern),'Private field in '+filename);
}
for(const name of ['app.js','village-ui.js','reader.js','rich-ui.js','lessons.js','library.js','curriculum.js','partnerships.js','journeys.js','museum.js','visits.js','enhance.js','room.js','media-links.js','office.js','office-data.js','stars.js'])new vm.Script(fs.readFileSync(path.join(dist,name),'utf8'));
const home=fs.readFileSync(path.join(dist,'index.html'),'utf8');
assert.equal([...home.matchAll(/data-place="/g)].length,12);
for(const asset of ['village.js','village-ui.js','village.css','village-theme.css','vendor/three.module.js','vendor/three.core.js','vendor/THREE-LICENSE.txt'])assert.ok(fs.existsSync(path.join(dist,asset)));
for(const a of Object.values(data.assets)){assert.ok(fs.existsSync(path.join(dist,a.src)));assert.ok(fs.existsSync(path.join(dist,a.thumb)));}
let pageImages=0;
for(const id of Object.keys(data.books)){const b=JSON.parse(fs.readFileSync(path.join(dist,'books',id+'.json'),'utf8'));if(b.format==='pages'){assert.equal(b.pages.length,b.count);for(const p of b.pages)assert.ok(fs.existsSync(path.join(dist,p.src)));pageImages+=b.count;}else{const check=blocks=>{for(const b of blocks){for(const img of b.images||[])assert.ok(data.assets[img]);if(b.kind==='table')for(const row of b.rows)for(const cell of row)check(cell);}};for(const c of b.chapters)check(c.blocks);}}
assert.equal(pageImages,1298);
assert.equal(data.lessons.length,31);
assert.equal(new Set(data.lessons.map(l=>l.id)).size,31);
for(const l of data.lessons){const b=JSON.parse(fs.readFileSync(path.join(dist,'books',l.book+'.json'),'utf8'));assert.ok(l.start>=1&&l.end<=b.count&&l.start<=l.end);assert.ok(l.band&&l.topic&&l.title);if(l.cover)assert.ok(data.assets[l.cover]);}
console.log(JSON.stringify({pages:pageNames.length,lesson_themes:data.lessons.length,photos:Object.keys(data.assets).length,reading_volumes:Object.keys(data.books).length,readable_pages:pageImages,resource_records:data.resources.length,event_results:data.eventIds.length,official_indicators:24,local_links:'valid',internal_paths_in_deployment:false,script_syntax:'valid'}));

for(const id of data.eventIds){const e=data.resources.find(r=>r.id===id);assert.ok(e?.event?.result&&e.section==='活動與成果');assert.ok(['展演成果','比賽成果','成果展'].includes(e.type));}
assert.equal(data.resources.filter(r=>r.section==='活動與成果').length,25);

assert.equal(data.curriculum115.cores.length,3);
assert.equal(data.curriculum115.cores.flatMap(c=>c.directions).length,9);
assert.equal(data.curriculum115.cores.flatMap(c=>c.directions).flatMap(d=>d.items).length,45);
assert.equal(data.curriculum115.themes.length,4);
assert.equal(data.resources.find(r=>r.id==='PLAN-002').year,115);
assert.equal(data.books.plan115.pages,40);

assert.equal(data.partnershipIds.length,4);
for(const id of data.partnershipIds){const r=data.resources.find(r=>r.id===id);assert.ok(r.collaboration.role&&r.collaboration.course&&r.collaboration.outputs);}

assert.equal(data.resources.find(r=>r.id==='EVENT-022').event.calendarYear,2026);

assert.equal(data.resources.find(r=>r.id==='PLAN-016').year,114);
assert.equal(data.assets['curriculum114-architecture'].src,'media/curriculum/114-map.png');
assert.equal(data.assets['plan115-architecture'].src,'media/curriculum/115-map.png');

assert.ok(!ids.has('COOP-005'));
assert.ok(!data.books.spaceProject);
assert.ok(!fs.existsSync(path.join(dist,'books/spaceProject.json')));
assert.equal(data.curriculum115.spiral.semesters.length,4);
assert.equal(data.curriculum115.spiral.relations.length,9);

const history=JSON.parse(fs.readFileSync(path.join(dist,'books/historyMuseum.json'),'utf8'));
assert.equal(data.historyMuseum.topics.length,15);
assert.equal(history.chapters.length,7);
for(const t of data.historyMuseum.topics){if(t.hasContent){assert.ok(history.chapters[t.chapter-1]);assert.ok(ids.has(t.resourceId));for(const s of t.sections)assert.ok(s.paragraph<history.chapters[t.chapter-1].blocks.length);}}
assert.equal(data.historyMuseum.topics.find(t=>t.id==='short-stories').sections.length,8);
assert.equal(Object.keys(data.books).length,25);
assert.equal(Object.keys(data.assets).length,528);
console.log('Museum index verified: 15 topics, 7 full articles; withdrawn plan absent.');

const visit=data.visit115;
assert.equal(visit.date,'2026-10-30');
assert.equal(visit.duration,120);
assert.equal(visit.groups.length,4);
assert.equal(visit.groups.flatMap(g=>g.items).length,12);
assert.equal(visit.groups.reduce((n,g)=>n+g.weight,0),100);
for(const g of visit.groups){assert.equal(g.items.reduce((n,i)=>n+i.weight,0),g.weight);for(const i of g.items)for(const id of i.resources)assert.ok(ids.has(id));}
assert.equal(visit.training.length,8);
assert.equal(visit.training.reduce((n,t)=>n+(t.hours||0),0),7);
assert.equal(visit.forms.length,3);
assert.equal(visit.finance.catalog.length,29);
assert.equal(visit.finance.catalog.reduce((n,x)=>n+x.pages,0),990);
assert.equal(visit.finance.items114.reduce((n,x)=>n+x.approved,0),1300000);
assert.equal(visit.finance.items114.reduce((n,x)=>n+x.reported,0),1226472);
assert.equal(visit.finance.items115.reduce((n,x)=>n+x.amount,0),1476963);
assert.equal(visit.finance.approved-visit.finance.reported,73528);
for(const f of visit.forms){const book=JSON.parse(fs.readFileSync(path.join(dist,'books',f.book+'.json'),'utf8'));assert.ok(book.chapters[f.chapter-1].blocks.some(b=>b.kind==='table'));}
for(const r of data.resources)assert.ok(Array.isArray(r.topics));
console.log('Visit verified: 12 items, 3 forms, 8 training records, 29-file finance catalog; amounts reconcile.');
{const b=data.visit115.briefing;assert.ok(b&&b.slides.length===22);for(const x of b.slides){const a=data.assets[x.photo];assert.ok(a&&a.width&&a.height&&x.title);}
const vjs=fs.readFileSync(path.join(dist,'visits.js'),'utf8');assert.ok(vjs.includes('id="briefing"')&&vjs.includes('href="#briefing"'));assert.ok(fs.readFileSync(path.join(dist,'rich-ui.js'),'utf8').includes('.slide-deck'));
console.log(`Briefing verified: ${b.slides.length} slides of the school briefing in the visit room, each with size and title.`);}

assert.ok(home.includes('data-place="language-island"'));assert.ok(home.includes('data-place="song-island"'));assert.ok(/data-place="song-tree"[^>]*href="https:\/\/laierin615\.github\.io\/radiw-guyao\/"/.test(home),'Song tree links to the Radiw site');assert.ok(home.includes('https://laierin615.github.io/saopo-songs-review/'));assert.ok(fs.existsSync(path.join(dist,'media/audio/saopo-tasoki-12s.mp3')));assert.ok(home.includes('https://laierin615.github.io/amis-language-competition/'));assert.ok(home.includes('salimpo-home-logo'));assert.ok(home.includes('https://qrcmd.ar2vr.com/?')&&home.includes('https://drive.google.com/file/d/1zpAEaW6---fXPW0mi3QrbSZ92hZCHDFR/view'),'Raft card links the AR2VR champion work and its video');for(const word of ['dadangoyan',"'aol",'fitonay',"'oway",'mikadot'])assert.ok(home.includes(`<i class="ami" lang="ami">${word}</i>`),'Raft word '+word);

// 我們怎麼學：10 堂課的步驟卡；每一步要有照片或替代的題目文字，關聯的教案與資料都要找得到
const lessonIds=new Set(data.lessons.map(l=>l.id));
assert.equal(data.journeys.length,10);
assert.equal(new Set(data.journeys.map(j=>j.id)).size,10);
for(const j of data.journeys){
  assert.ok(j.title&&j.short&&j.lead&&j.term);
  assert.ok(j.steps.length>=3&&j.steps.length<=4,'Steps '+j.id);
  for(const s of j.steps){assert.ok(s.title&&s.text);assert.ok(s.photo?data.assets[s.photo]&&s.alt:s.paper,'Step image '+j.id);}
  for(const id of j.lessons)assert.ok(lessonIds.has(id),'Unknown lesson '+id);
  for(const id of j.resources)assert.ok(ids.has(id),'Unknown resource '+id);
}
console.log('Journeys verified: 10 lessons in steps, images registered, links valid.');

// 訪視評鑑會客室：訪視 12 項與評鑑 24 項的佐證，依計畫、課程、成果、部落四類，每一條都要找得到
const journeyIds=new Set(data.journeys.map(j=>j.id)),evidenceKeys=['plan','course','results','community'];
const bookCache={},book=id=>bookCache[id]??=JSON.parse(fs.readFileSync(path.join(dist,'books',id+'.json'),'utf8'));
function checkRef(ref,owner){
  const kind=ref[0],rest=ref.slice(2);
  if(kind==='R')return assert.ok(ids.has(rest),`Unknown resource ${rest} in ${owner}`);
  if(kind==='J')return assert.ok(journeyIds.has(rest),`Unknown journey ${rest} in ${owner}`);
  const [target,label]=rest.split('|');assert.ok(label,`Missing label ${ref} in ${owner}`);
  if(kind==='P')return assert.ok(fs.existsSync(path.join(dist,target.split(/[?#]/)[0])),`Missing page ${target} in ${owner}`);
  if(kind==='U')return assert.ok(target.startsWith('https://'),`External link ${target} in ${owner}`);
  assert.equal(kind,'B',`Unknown reference ${ref} in ${owner}`);
  const [id,chapter]=target.split(':');assert.ok(data.books[id],`Unknown book ${id} in ${owner}`);
  if(chapter){const b=book(id);assert.ok(b.format==='pages'?+chapter<=b.count:b.chapters[+chapter-1],`Missing chapter ${target} in ${owner}`);}
}
const visitItems=visit.groups.flatMap(g=>g.items);let evidenceCount=0;
for(const owner of [...visitItems,...data.indicators]){
  const ev=owner.evidence;assert.ok(ev,'No evidence for '+owner.code);
  for(const key of Object.keys(ev))assert.ok([...evidenceKeys,'extra'].includes(key),`Unknown evidence group ${key}`);
  for(const key of evidenceKeys)for(const ref of ev[key]||[]){checkRef(ref,owner.code);evidenceCount++;}
  if(ev.extra)assert.ok(['domains','integrations'].includes(ev.extra));
}
for(const item of visitItems)assert.ok(evidenceKeys.some(k=>item.evidence[k]?.length),'Visit item without evidence '+item.code);
const directionCodes=new Set(data.curriculum115.cores.flatMap(c=>c.directions.map(d=>d.code))),lessonDirections=data.curriculum115.lessonDirections;
assert.equal(Object.keys(lessonDirections).length,31);
for(const [id,code] of Object.entries(lessonDirections)){assert.ok(lessonIds.has(id));assert.ok(directionCodes.has(code));}
for(const name of ['reception','visits','reviews']){const html=fs.readFileSync(path.join(dist,name+'.html'),'utf8');assert.ok(html.includes('room.js?v=')&&html.includes('room.css?v='),'Room assets missing on '+name);}
console.log(`Room verified: ${visitItems.length} visit items and ${data.indicators.length} indicators, ${evidenceCount} evidence links resolve; 31 lessons mapped to directions.`);

// 主選單用聚落站名；聚落 11 站中前 10 站有族語詞（村辦公室的詞待族語老師建議），若本機有 tatokem 詞庫，就核對全部（連同各頁大標題上的詞與星空的 fo'is）是已驗證的詞
const navLine='<a href="about.html">學校與部落</a><a href="lessons.html">山海探索站</a><a href="library.html">教材書屋</a><a href="stories.html">成果廣場</a><a href="resources.html">資料服務站</a><a href="reception.html">會客室</a>';
const subpages=pageNames.filter(name=>name!=='index');
for(const name of subpages)assert.ok(fs.readFileSync(path.join(dist,name+'.html'),'utf8').includes(navLine),'Main nav on '+name);
for(const name of ['index',...subpages])assert.ok(fs.readFileSync(path.join(dist,name+'.html'),'utf8').includes('lang="ami">Aray!</i>'),'Footer word on '+name);
const amiWords=[...home.matchAll(/data-ami="([^"]+)" data-ami-zh="([^"]+)"/g)].map(m=>m[1].replace(/&#x27;/g,"'"));
assert.equal(amiWords.length,11);
for(const control of ['data-zoom="in"','data-zoom="out"','data-zoom="reset"','id="village-hint"','id="place-ami"',"lang=\"ami\">Nga'ay ho!</i>"])assert.ok(home.includes(control),'Home missing '+control);
const appSource=fs.readFileSync(path.join(dist,'app.js'),'utf8'),stationWords=Function('return '+appSource.match(/const stationWords = (\{.*?\});/)[1])();
for(const [page,[word]] of Object.entries(stationWords))if(!['museum','reviews'].includes(page))assert.ok(amiWords.includes(word),'Station word not on the home stations: '+word);
const lexiconFile=path.join(os.homedir(),'.claude/mcp_servers/tatokem/lexicon/verified.json');
if(fs.existsSync(lexiconFile)){
  const verified=new Set(Object.values(JSON.parse(fs.readFileSync(lexiconFile,'utf8')).categories).flatMap(c=>Object.keys(c)).map(w=>w.toLowerCase()));
  for(const word of [...amiWords,...Object.values(stationWords).map(([word])=>word),'Aray',"Nga'ay ho","fo'is"])assert.ok(verified.has(word.replace(/!$/,'').toLowerCase()),'Unverified Amis word '+word);
  console.log('Amis words verified against the tatokem lexicon: 11 stations, page headings, greeting, footer and the star map.');
}


// Padlet 原板與影片連結：只連 Padlet、YouTube、Facebook，課程與主題要存在，標籤不放老師姓名中常見的「授課」字樣
const mediaContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'media-links.js'),'utf8'),mediaContext);
const media=mediaContext.window.SCHOOL_MEDIA,mediaLessonIds=new Set(data.lessons.map(l=>l.id));let mediaCount=0;
for(const [group,valid] of [['lessons',id=>mediaLessonIds.has(id)],['topics',t=>data.lessonTopics.includes(t)]])for(const [key,list] of Object.entries(media[group])){
  assert.ok(valid(key),'Unknown media '+group+' key '+key);
  for(const m of list){mediaCount++;assert.ok(/^https:\/\/(padlet\.com|www\.youtube\.com|www\.facebook\.com)\//.test(m.url),'Unexpected media host '+m.url);assert.ok(!/授課|老師/.test(m.label),'Teacher wording in media label '+m.label);}
}
assert.ok(fs.readFileSync(path.join(dist,'lessons.html'),'utf8').includes('media-links.js?v='),'media-links.js missing on lessons page');
console.log(`Media links verified: ${mediaCount} Padlet boards and videos on ${Object.keys(media.lessons).length} lessons and ${Object.keys(media.topics).length} topics.`);

// 山海探索站依主題整合：還沒填的「115上學期各科學習成果評量單」先不呈現（資料存在 archive/），會客室佐證也不列；教材工坊、教案書屋併進山海探索站，原本的房子留成空房子
assert.ok(!ids.has('PLAN-015')&&!data.books.assessment,'Blank assessment sheets must stay hidden');
for(const file of fs.readdirSync(dist).filter(f=>/\.(html|js)$/.test(f)))assert.ok(!/PLAN-015|book=assessment|B:assessment|type=學習單/.test(fs.readFileSync(path.join(dist,file),'utf8')),'Hidden assessment sheets linked from '+file);
for(const old of ['material','lesson','history','visit','archive'])assert.ok(!home.includes(`data-place="${old}"`),'Merged station still on the home village: '+old);
for(const [place,href] of [['course','resource.html?id=PLAN-002'],['library','library.html'],['farm','lessons.html?topic=農耕與食農'],['ocean','lessons.html'],['reception','reception.html']])assert.ok(new RegExp(`data-place="${place}"[^>]*href="${href.replace(/[?.]/g,'\\$&')}"`).test(home),'Home station link '+place);
for(const file of fs.readdirSync(dist).filter(f=>/\.(html|js)$/.test(f)&&f!=='lessons.js'))assert.ok(!fs.readFileSync(path.join(dist,file),'utf8').includes('view=materials'),'Old materials workshop linked from '+file);
const placeOrder=[...home.matchAll(/data-place="([^"]+)"/g)].map(m=>m[1]),villageJs=fs.readFileSync(path.join(dist,'village.js'),'utf8'),spots=JSON.parse(villageJs.match(/const spots=(\[[^\]]*\])/)[1]);
assert.equal(spots.length,[...home.matchAll(/data-place="/g)].length,'Every home station needs a house spot');assert.ok(villageJs.includes('function seaAt(')&&villageJs.includes('function moveRaft(')&&villageJs.includes('trackGroup'),'Raft paddles where the sea is clicked; language island is an outdoor training ground');assert.ok([3,9,10].every(n=>!spots.includes(n)),'Spots 3, 9 and 10 stay empty houses');assert.equal(spots[placeOrder.indexOf('song-tree')],14,'Song tree lives on the west shore at spot 14');assert.ok(home.includes('data-href2="https://laierin615.github.io/laierin615music/"'),'Song tree second link to 古調的現代新衣');assert.ok(home.includes('data-href2="https://laierin615.github.io/laierindateng/"'),'Farm second link to Dateng 野菜探險家');
// 主題頁與一課的頁面都依序是：影音資料、課程架構、教材、學生作品、教案
const lessonsJs=fs.readFileSync(path.join(dist,'lessons.js'),'utf8'),units=data.resources.filter(r=>r.type==='課程單元');
assert.ok(lessonsJs.includes("${mediaSection(k,'theme',true)}${structure(t,k,'theme')}${materials(k.units,'theme')}${worksSection(k,'theme')}${plans}"),'Theme page section order');
assert.ok(lessonsJs.includes("${mediaSection(k,'lesson',false)}${structure(l.topic,topicKit(l.topic),'lesson',l.id)}${materials(k.units,'lesson')}${worksSection(k,'lesson')}${plan}"),'Lesson page section order');
for(const l of data.lessons.filter(l=>l.resource))assert.equal(data.resources.find(r=>r.id===l.resource)?.type,'課程單元','Lesson material must be a course unit: '+l.id);
for(const u of units)for(const id of u.related)assert.ok(ids.has(id),'Unknown unit link '+id);
// 課程架構依課程內容產生：每一課有 2～4 個學習重點，每個主題有學習脈絡；每個課程單元都歸在某個主題
assert.deepEqual(Object.keys(data.lessonTopicFlows).sort(),[...data.lessonTopics].sort(),'Every topic needs a learning flow');
for(const l of data.lessons)assert.ok(Array.isArray(l.points)&&l.points.length>=2&&l.points.length<=4&&l.points.every(p=>p&&p.length<=16),'Learning points for '+l.id);
for(const [topic,list] of Object.entries(data.lessonTopicUnits))assert.ok(data.lessonTopics.includes(topic)&&list.every(id=>units.some(u=>u.id===id)),'Topic units for '+topic);
for(const u of units)assert.ok(data.lessons.some(l=>l.resource===u.id)||Object.values(data.lessonTopicUnits).some(list=>list.includes(u.id)),'Course unit without a topic '+u.id);
console.log(`Lesson themes verified: ${data.lessonTopics.length} topics with learning flows, ${data.lessons.length} lessons with learning points, ${units.length} units placed in topics; blank assessment sheets hidden.`);

// 教材書屋：四個書架；每本書在閱讀室翻得到、封面存在，下載的檔案是 PDF；閱讀室的麵包屑回到書屋
const shelves=data.library.shelves;
assert.equal(shelves.map(s=>s.id).join(),'history,picture,published,language');
let shelfBooks=0,shelfPdfs=0;
for(const shelf of shelves){
  assert.ok(shelf.title&&shelf.eyebrow&&shelf.text,'Shelf text '+shelf.id);
  assert.equal(shelf.id==='history',!shelf.items,'Only the history shelf is built from historyMuseum');
  for(const item of shelf.items||[]){
    shelfBooks++;assert.ok(data.books[item.book]&&item.title&&item.by&&item.text&&item.meta,'Shelf item '+item.book);
    assert.equal(item.pages,data.books[item.book].format==='pages'?data.books[item.book].pages:item.pages);
    assert.equal(item.pages,book(item.book).count,'Page count of '+item.book);
    assert.ok(fs.existsSync(path.join(dist,item.cover)),'Cover of '+item.book);
    for(const pdf of item.pdfs||[]){shelfPdfs++;const file=path.join(dist,pdf.href);assert.ok(pdf.href.startsWith('media/library/')&&fs.readFileSync(file).subarray(0,5).toString()==='%PDF-','PDF '+pdf.href);assert.ok(pdf.label&&pdf.name.endsWith('.pdf')&&/^\d+\.\d MB$/.test(pdf.size),'PDF fields '+pdf.href);}
  }
}
assert.equal(shelfBooks,8);assert.equal(shelfPdfs,9);
for(const file of fs.readdirSync(path.join(dist,'media/library')))assert.ok(shelves.some(s=>(s.items||[]).some(i=>(i.pdfs||[]).some(p=>p.href==='media/library/'+file))),'Unlisted file in media/library: '+file);
const readerJs=fs.readFileSync(path.join(dist,'reader.js'),'utf8');assert.ok(readerJs.includes("['library.html','教材書屋']")&&readerJs.includes("'reception.html','會客室'"),'Reader breadcrumbs for the library and the reception');
assert.ok(fs.readFileSync(path.join(dist,'museum.js'),'utf8').includes('<a href="library.html">教材書屋</a>'),'Museum breadcrumb to the library');
// 會客室：入口頁兩扇門，訪視與評鑑兩頁都有分頁；舊的山海探索站清單轉到主題課程或課程架構屋
const roomJs=fs.readFileSync(path.join(dist,'room.js'),'utf8');assert.ok(roomJs.includes("dataset.page==='reception'")&&roomJs.includes("door('visits.html'")&&roomJs.includes("door('reviews.html'"),'Reception doors');
assert.ok(fs.readFileSync(path.join(dist,'reception.html'),'utf8').includes('<h1>會客室</h1>'),'Reception heading');
assert.ok(appSource.includes("if(page==='learning')location.replace(")&&appSource.includes("'resource.html?id=PLAN-002'+location.hash"),'Old learning page redirect');
for(const file of fs.readdirSync(dist).filter(f=>/\.(html|js)$/.test(f)))assert.ok(!fs.readFileSync(path.join(dist,file),'utf8').includes('learning.html'),'Old learning page linked from '+file);
console.log(`Library verified: ${shelves.length} shelves, ${shelfBooks} books readable in the reading room, ${shelfPdfs} PDF downloads; reception doors and old learning links redirected.`);

// 村辦公室：網站上只能有加密後的連結；原文與密碼留在本機 .runtime，不會進到 dist
const officeHtml=fs.readFileSync(path.join(dist,'office.html'),'utf8'),officeData=fs.readFileSync(path.join(dist,'office-data.js'),'utf8');
assert.ok(officeHtml.includes('name="robots" content="noindex'),'Office page must not be indexed');
const officeVault=JSON.parse(officeData.slice(officeData.indexOf('{'),officeData.lastIndexOf('}')+1));
assert.ok(officeVault.v===1&&officeVault.iterations>=600000&&officeVault.salt&&officeVault.iv&&officeVault.data,'Office vault fields');
// 三份文件的代號只記 SHA-256（倉庫是公開的）；站內任何一段 44 字元的代號都不能對上
const officeDocHashes=new Set(['7c50c068d47332d5584cb09201d322a537d62724e4315cae1e607d9300b1f3f0','52db006f95d32b82a53a57b999bc54b95e5fcac3bbc03cef9129f7fb8190bb4f','f651c8c2a14de64d7fe22cd90b2cd1c910a80509c2c5a639c19fae8dc6613b50']);
const sha256=text=>crypto.createHash('sha256').update(text).digest('hex');
for(const file of fs.readdirSync(dist).filter(f=>/\.(html|js|css|json)$/.test(f))){
  const text=fs.readFileSync(path.join(dist,file),'utf8');
  for(const secret of ['office-password.txt','office-links.json"'])assert.ok(!text.includes(secret),`Office secret ${secret} leaked into ${file}`);
  for(const [token] of text.matchAll(/[\w-]{44,}/g))for(let i=0;i+44<=token.length;i++)assert.ok(!officeDocHashes.has(sha256(token.slice(i,i+44))),`Office document address leaked into ${file}`);
}
for(const page of ['index',...subpages])assert.ok(fs.readFileSync(path.join(dist,page+'.html'),'utf8').includes('href="office.html">村辦公室</a>'),'Office entrance missing on '+page);
assert.ok(home.includes('data-place="office"')&&home.includes('12 個地點'),'Office station missing on the home village');
console.log('Office verified: links encrypted, no document addresses in the site, entrance on every page and a 12th village station.');

// 星空 fo'is：星星與連線都由 data.js 算出；每顆星至少一條連線、連到存在的頁面與資料，每頁頁尾和首頁都有入口
const starContext={window:{SCHOOL_DATA:data}};vm.runInNewContext(fs.readFileSync(path.join(dist,'stars.js'),'utf8'),starContext);
const sky=starContext.window.SALIMPO_STARS.buildGraph(data),starIds=new Set(sky.nodes.map(n=>n.id)),starDegree=new Map();
assert.ok(sky.nodes.length>=100,'Too few stars: '+sky.nodes.length);
assert.equal(starIds.size,sky.nodes.length,'Duplicate star ids');
for(const {source,target} of sky.links){assert.ok(starIds.has(source)&&starIds.has(target)&&source!==target,`Bad star link ${source} - ${target}`);for(const id of [source,target])starDegree.set(id,(starDegree.get(id)||0)+1);}
const historyIds=new Set(data.historyMuseum.topics.map(t=>t.id));
for(const n of sky.nodes){
  assert.ok(starDegree.get(n.id)>0,'Star without links '+n.id);
  assert.ok(n.href&&fs.existsSync(path.join(dist,n.href.split(/[?#]/)[0])),'Star links to a missing page '+n.id);
  const [page,rest='']=n.href.split(/[?#]/),value=decodeURIComponent(rest.split('=').pop());
  if(page==='resource.html')assert.ok(ids.has(value),'Star links to an unknown resource '+n.id);
  if(rest.startsWith('lesson='))assert.ok(lessonIds.has(value),'Star links to an unknown lesson '+n.id);
  if(page==='journeys.html')assert.ok(journeyIds.has(value),'Star links to an unknown journey '+n.id);
  if(page==='museum.html'&&rest)assert.ok(historyIds.has(value),'Star links to an unknown history topic '+n.id);
}
// 四個星座的軸心就是原民會訪視指標 1-2 的四大文化領域，九向都歸到其中一個星座；老師指定美術與創作連到藝術美
const axisNames=starContext.window.SALIMPO_STARS.AXES.map(a=>a.name),domainItem=visit.groups.flatMap(g=>g.items).find(i=>i.code==='1-2'),axisStars=sky.nodes.filter(n=>n.kind==='四大文化領域');
assert.ok(domainItem&&axisNames.length===4&&axisNames.every(name=>domainItem.title.includes(name)),'Star axes differ from visit indicator 1-2');
assert.ok(axisStars.length===4&&axisStars.every(n=>n.label===n.axis)&&axisNames.every(name=>axisStars.some(n=>n.axis===name)),'Every cultural domain must be a star axis');
for(const n of sky.nodes.filter(n=>n.kind==='九向'))assert.ok(axisNames.includes(n.axis),'Direction without a constellation '+n.id);
assert.ok(sky.links.some(l=>[l.source,l.target].sort().join('|')==='core:B|eventDomain:美術與創作'),'美術與創作 must link to 藝術美');
const starsHtml=fs.readFileSync(path.join(dist,'stars.html'),'utf8');
assert.ok(starsHtml.includes(`lang="ami">fo'is</i>`)&&starsHtml.includes('id="sky-canvas"')&&starsHtml.includes('id="sky-list-groups"'),'Star map page incomplete');
for(const page of ['index',...subpages])assert.ok(fs.readFileSync(path.join(dist,page+'.html'),'utf8').includes('<a href="stars.html">星空</a></p>'),'Star map footer link missing on '+page);
for(const entrance of ['<a class="pill" href="stars.html">星空</a>','class="sky-door sky-door-top" href="stars.html"'])assert.ok(home.includes(entrance),'Home missing star entrance '+entrance);
const villageCss=fs.readFileSync(path.join(dist,'village.css'),'utf8');
assert.ok(villageCss.includes('[data-theme=night] .sky-door-top{')&&villageCss.includes('[data-theme=night] .village-header .pill[href="stars.html"]{'),'Night star entrances missing in village.css');
console.log(`Star map verified: ${sky.nodes.length} stars and ${sky.links.length} links from data.js, four constellations around the visit 1-2 cultural domains, every star linked to a page; entrance on every page and in the home night sky.`);
