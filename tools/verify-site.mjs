import fs from 'node:fs';
import path from 'node:path';
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
for(const name of ['index','about','learning','stories','reviews','resources','resource','reader','lessons','partnerships','museum','visits']){
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
for(const name of ['app.js','village-ui.js','reader.js','rich-ui.js','lessons.js','curriculum.js','partnerships.js','museum.js','visits.js','enhance.js'])new vm.Script(fs.readFileSync(path.join(dist,name),'utf8'));
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
console.log(JSON.stringify({pages:12,lesson_themes:data.lessons.length,photos:Object.keys(data.assets).length,reading_volumes:Object.keys(data.books).length,readable_pages:pageImages,resource_records:data.resources.length,event_results:data.eventIds.length,official_indicators:24,local_links:'valid',internal_paths_in_deployment:false,script_syntax:'valid'}));

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
assert.equal(Object.keys(data.assets).length,471);
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
