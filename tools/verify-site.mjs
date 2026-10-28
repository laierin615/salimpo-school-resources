import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const dist=path.resolve('dist');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dist,'data.js'),'utf8'),context);
const data=context.window.SCHOOL_DATA;
assert.equal(data.resources.length,63);
assert.equal(data.eventIds.length,25);
assert.equal(data.indicators.length,24);
const ids=new Set(data.resources.map(r=>r.id));
assert.equal(ids.size,63);
for(const resource of data.resources){
  assert.ok(resource.title&&resource.summary);
  assert.ok(!('source' in resource));
  for(const id of resource.photos||[])assert.ok(data.assets[id]);
  for(const entry of resource.reading||[])assert.ok(data.books[entry.book]);
  for(const id of resource.related)assert.ok(ids.has(id),'Unknown related resource '+id);
}
for(const indicator of data.indicators){for(const id of indicator.related)assert.ok(ids.has(id));}
for(const name of ['index','about','learning','stories','reviews','resources','resource','reader','lessons','partnerships','journeys','museum','visits']){
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
for(const name of ['app.js','village-ui.js','reader.js','rich-ui.js','lessons.js','curriculum.js','partnerships.js','journeys.js','museum.js','visits.js','enhance.js','room.js'])new vm.Script(fs.readFileSync(path.join(dist,name),'utf8'));
const home=fs.readFileSync(path.join(dist,'index.html'),'utf8');
assert.equal([...home.matchAll(/data-place="/g)].length,13);
for(const asset of ['village.js','village-ui.js','village.css','village-theme.css','vendor/three.module.js','vendor/three.core.js','vendor/THREE-LICENSE.txt'])assert.ok(fs.existsSync(path.join(dist,asset)));
for(const a of Object.values(data.assets)){assert.ok(fs.existsSync(path.join(dist,a.src)));assert.ok(fs.existsSync(path.join(dist,a.thumb)));}
let pageImages=0;
for(const id of Object.keys(data.books)){const b=JSON.parse(fs.readFileSync(path.join(dist,'books',id+'.json'),'utf8'));if(b.format==='pages'){assert.equal(b.pages.length,b.count);for(const p of b.pages)assert.ok(fs.existsSync(path.join(dist,p.src)));pageImages+=b.count;}else{const check=blocks=>{for(const b of blocks){for(const img of b.images||[])assert.ok(data.assets[img]);if(b.kind==='table')for(const row of b.rows)for(const cell of row)check(cell);}};for(const c of b.chapters)check(c.blocks);}}
assert.equal(pageImages,1194);
assert.equal(data.lessons.length,31);
assert.equal(new Set(data.lessons.map(l=>l.id)).size,31);
for(const l of data.lessons){const b=JSON.parse(fs.readFileSync(path.join(dist,'books',l.book+'.json'),'utf8'));assert.ok(l.start>=1&&l.end<=b.count&&l.start<=l.end);assert.ok(l.band&&l.topic&&l.title);if(l.cover)assert.ok(data.assets[l.cover]);}
console.log(JSON.stringify({pages:13,lesson_themes:data.lessons.length,photos:Object.keys(data.assets).length,reading_volumes:Object.keys(data.books).length,readable_pages:pageImages,resource_records:data.resources.length,event_results:data.eventIds.length,official_indicators:24,local_links:'valid',internal_paths_in_deployment:false,script_syntax:'valid'}));

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
assert.equal(Object.keys(data.books).length,20);
assert.equal(Object.keys(data.assets).length,506);
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

assert.ok(home.includes('data-place="language-island"'));assert.ok(home.includes('data-place="song-island"'));assert.ok(home.includes('https://laierin615.github.io/saopo-songs-review/'));assert.ok(fs.existsSync(path.join(dist,'media/audio/saopo-tasoki-12s.mp3')));assert.ok(home.includes('https://laierin615.github.io/amis-language-competition/'));assert.ok(home.includes('salimpo-home-logo'));

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
for(const name of ['visits','reviews']){const html=fs.readFileSync(path.join(dist,name+'.html'),'utf8');assert.ok(html.includes('room.js?v=')&&html.includes('room.css?v='),'Room assets missing on '+name);}
console.log(`Room verified: ${visitItems.length} visit items and ${data.indicators.length} indicators, ${evidenceCount} evidence links resolve; 31 lessons mapped to directions.`);

// 主選單用聚落站名；聚落 13 站都有族語詞，若本機有 tatokem 詞庫，就核對全部是已驗證的詞
const navLine='<a href="about.html">學校與部落</a><a href="learning.html">山海探索站</a><a href="lessons.html">教案書屋</a><a href="stories.html">成果廣場</a><a href="museum.html">文史資料館</a><a href="resources.html">資料服務站</a><a href="visits.html">訪視評鑑會客室</a>';
const subpages=['about','learning','stories','reviews','resources','resource','reader','lessons','partnerships','journeys','museum','visits'];
for(const name of subpages)assert.ok(fs.readFileSync(path.join(dist,name+'.html'),'utf8').includes(navLine),'Main nav on '+name);
for(const name of ['index',...subpages])assert.ok(fs.readFileSync(path.join(dist,name+'.html'),'utf8').includes('lang="ami">Aray!</i>'),'Footer word on '+name);
const amiWords=[...home.matchAll(/data-ami="([^"]+)" data-ami-zh="([^"]+)"/g)].map(m=>m[1].replace(/&#x27;/g,"'"));
assert.equal(amiWords.length,13);
for(const control of ['data-zoom="in"','data-zoom="out"','data-zoom="reset"','id="village-hint"','id="place-ami"',"lang=\"ami\">Nga'ay ho!</i>"])assert.ok(home.includes(control),'Home missing '+control);
const appSource=fs.readFileSync(path.join(dist,'app.js'),'utf8'),stationWords=Function('return '+appSource.match(/const stationWords = (\{.*?\});/)[1])();
for(const [word] of Object.values(stationWords))assert.ok(amiWords.includes(word),'Station word not on the home stations: '+word);
const lexiconFile=path.join(os.homedir(),'.claude/mcp_servers/tatokem/lexicon/verified.json');
if(fs.existsSync(lexiconFile)){
  const verified=new Set(Object.values(JSON.parse(fs.readFileSync(lexiconFile,'utf8')).categories).flatMap(c=>Object.keys(c)).map(w=>w.toLowerCase()));
  for(const word of [...amiWords,'Aray',"Nga'ay ho"])assert.ok(verified.has(word.replace(/!$/,'').toLowerCase()),'Unverified Amis word '+word);
  console.log('Amis words verified against the tatokem lexicon: 13 stations, greeting and footer.');
}

