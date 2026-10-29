import * as THREE from './vendor/three.module.js';

const canvas=document.getElementById('village-canvas');
const world=document.getElementById('village-world');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const positions=[[-4,-2.1],[-.6,-3.5],[3.1,-2.7],[4.7,.8],[2.5,3.8],[-1.1,4.7],[-4.5,1.4],[-1.8,.1],[1.8,.4],[4.4,-1.6],[-4.8,-.7],[8.3,-5.3],[-8.3,5.3],[3.8,2.75],[-5.9,3.4]];
// 首頁站牌依序住進這些位置的房子；位置 3（原教材工坊）改成老師的修煉場；9（原文史資料館）、10（原訪視會客室）併站後是空房子，以後新增的站可以住進去；位置 14 是左岸望向女人島的古謠樹
const spots=[0,1,2,4,5,6,14,7,8,11,12,3,13],placeOf=spot=>spots.indexOf(spot);
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1.5:2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
}catch(error){window.failVillage?.();console.warn('3D scene unavailable:',error.message);}

if(renderer)buildVillage();

function buildVillage(){
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-12,12,9,-9,.1,160);
  const hemi=new THREE.HemisphereLight(0xeafaff,0x638359,2.3);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff1d2,3.2);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.04;sun.shadow.bias=-.0003;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xbce6f5,.65);fill.position.set(12,8,-12);scene.add(fill);
  const materials={};
  function material(color){const key=String(color);return materials[key]||(materials[key]=new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true}));}
  function mesh(geometry,color,parent=scene){const object=new THREE.Mesh(geometry,typeof color==='number'?material(color):color);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;}
  const geometry={box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(1,1,7),cylinder:new THREE.CylinderGeometry(1,1,1,10),leaf:new THREE.IcosahedronGeometry(1,0),rock:new THREE.DodecahedronGeometry(1,0)};
  function box(w,h,d,x,y,z,color,parent=scene){const o=mesh(geometry.box,color,parent);o.scale.set(w,h,d);o.position.set(x,y,z);return o;}
  function cylinder(radius,height,x,y,z,color,parent=scene,sides=10){const o=mesh(sides===10?geometry.cylinder:new THREE.CylinderGeometry(1,1,1,sides),color,parent);o.scale.set(radius,height,radius);o.position.set(x,y,z);return o;}
  function rock(size,x,y,z,color,parent=scene){const o=mesh(geometry.rock,color,parent);o.scale.set(size,size*.72,size);o.position.set(x,y,z);return o;}
  function beam(a,b,radius,color,parent=scene){const direction=new THREE.Vector3().subVectors(b,a);const o=cylinder(radius,direction.length(),0,0,0,color,parent,7);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return o;}
  let seed=7453;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  function roof(w,d,h,y,color,parent){const a=w/2,b=d/2;const vertices=[-a,y,-b,a,y,-b,0,y+h,-b,-a,y,b,a,y,b,0,y+h,b];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);g.computeVertexNormals();return mesh(g,color,parent);}

  const earth=mesh(new THREE.CylinderGeometry(7.75,6.9,1.25,48,1),0xb5a181);earth.position.y=-.67;
  const beach=mesh(new THREE.CylinderGeometry(8.02,7.9,.22,48),0xe7dcb5);beach.position.y=-.1;
  const topPositions=[],topColors=[],topIndices=[];const rings=7,segments=48;
  const greens=[0x91b969,0x9fc77a,0xaad182,0x82ad60];
  topPositions.push(0,.04,0);const color=new THREE.Color(greens[0]);topColors.push(color.r,color.g,color.b);
  for(let ring=1;ring<=rings;ring++)for(let i=0;i<segments;i++){const angle=i/segments*Math.PI*2;const radius=ring/rings*7.8;topPositions.push(Math.cos(angle)*radius,.055+random()*.035,Math.sin(angle)*radius);color.set(greens[Math.floor(random()*greens.length)]);topColors.push(color.r,color.g,color.b);}
  for(let i=0;i<segments;i++)topIndices.push(0,1+i,1+(i+1)%segments);
  for(let ring=1;ring<rings;ring++)for(let i=0;i<segments;i++){const a=1+(ring-1)*segments+i,b=1+(ring-1)*segments+(i+1)%segments,c=1+ring*segments+i,d=1+ring*segments+(i+1)%segments;topIndices.push(a,c,d,a,d,b);}
  const landGeo=new THREE.BufferGeometry();landGeo.setAttribute('position',new THREE.Float32BufferAttribute(topPositions,3));landGeo.setAttribute('color',new THREE.Float32BufferAttribute(topColors,3));landGeo.setIndex(topIndices.reduce((a,_,i)=>{if(i%3===0)a.push(topIndices[i],topIndices[i+2],topIndices[i+1]);return a;},[]));landGeo.computeVertexNormals();mesh(landGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));
  const seaMaterial=new THREE.MeshStandardMaterial({color:0x73bfc0,roughness:.75,metalness:.08});
  const water=mesh(new THREE.PlaneGeometry(180,180),seaMaterial);water.rotation.x=-Math.PI/2;water.position.y=-1.32;water.castShadow=false;
  const ripples=[];for(let i=0;i<3;i++){const ring=mesh(new THREE.RingGeometry(8.2+i*.37,8.26+i*.37,96),new THREE.MeshBasicMaterial({color:0xe5ffff,transparent:true,opacity:.25-i*.045,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-1.27+i*.01;ring.castShadow=false;ripples.push(ring);}
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;rock(.18+random()*.3,Math.cos(a)*7.7,-.65,Math.sin(a)*7.7,0x8b9b92);}
  // Small shoreline arcs make the surrounding water read as a sea, even in the overhead view.
  const surf=new THREE.Group();scene.add(surf);
  for(let row=0;row<3;row++)for(let i=0;i<9;i++){
    const angle=.05+i*.27+(row%2)*.11;
    const radius=8.9+row*.68+(i%3)*.08;
    const points=[];
    for(let step=0;step<=10;step++){
      const a=angle+(step-5)*.018;
      points.push(new THREE.Vector3(Math.cos(a)*radius,-1.245+row*.002,Math.sin(a)*radius));
    }
    const crest=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,.025,3,false),new THREE.MeshBasicMaterial({color:0xe5fffb,transparent:true,opacity:.65-row*.08,depthWrite:false}),surf);
    crest.castShadow=false;
  }
  // Shallow tidal pools sit beside the coastal learning station.
  for(const [x,z,s] of [[-3.1,5.45,1.02],[-.35,6.35,.66]]){
    const pool=mesh(new THREE.CircleGeometry(1,12),new THREE.MeshStandardMaterial({color:0x72bfc2,roughness:.55,metalness:.02,side:THREE.DoubleSide}));
    pool.rotation.x=-Math.PI/2;pool.position.set(x,.105,z);pool.scale.set(s,s*.68,1);pool.castShadow=false;
    for(let i=0;i<9;i++){
      const a=i/9*Math.PI*2,r=s*(.87+random()*.2);
      rock(.08+random()*.065,x+Math.cos(a)*r,.19,z+Math.sin(a)*r*.68,i%3?0xb1a98c:0xe8dcc0);
    }
  }

  const paverGeometry=new THREE.CylinderGeometry(.135,.16,.055,6);
  const pavers=[];
  function path(a,b,count=14){for(let i=0;i<count;i++){const t=i/(count-1);pavers.push(new THREE.Vector3(a[0]*(1-t)+b[0]*t,.13,a[1]*(1-t)+b[1]*t));}}
  // 0–10 在本島，11、12 是外島；13 村辦公室的步道在蓋房子時另外鋪，不改動這裡的亂數順序
  for(let i=0;i<11;i++)path(positions[i],[.4,1.5],15);
  for(let i=0;i<65;i++){const a=i/65*Math.PI*2;pavers.push(new THREE.Vector3(Math.cos(a)*5.85,.13,Math.sin(a)*5.85));}
  const stone=new THREE.InstancedMesh(paverGeometry,material(0xe1dfc7),pavers.length);const transform=new THREE.Object3D();pavers.forEach((p,i)=>{transform.position.copy(p);transform.rotation.y=random()*Math.PI;transform.scale.set(1+random()*.2,1,1);transform.updateMatrix();stone.setMatrixAt(i,transform.matrix);});stone.receiveShadow=true;scene.add(stone);

  const mountains=new THREE.Group();scene.add(mountains);
  [[-4.4,-5.5,1.35,.95],[-2.7,-5.75,2.3,1.35],[-.45,-5.75,3.45,1.8],[1.65,-5.85,2.65,1.5],[3.9,-5.5,1.45,1.02]].forEach(([x,z,h,r],i)=>{
    const peak=mesh(new THREE.ConeGeometry(r,h,5),[0x94aa83,0x779771,0x77936e,0x83a07a,0x9caf89][i],mountains);
    peak.position.set(x,h/2+.05,z);peak.rotation.y=i*.43;
    const upper=mesh(new THREE.ConeGeometry(r*.36,h*.32,5),[0xb8c3a6,0xa8bb9d,0xb5c4a5,0xa6b79b,0xc0c7aa][i],mountains);
    upper.position.set(x,h*.84+.05,z);upper.rotation.y=i*.43;
  });
  function tree(x,z,size=1,type=0){const group=new THREE.Group();group.position.set(x,.09,z);group.scale.setScalar(size);scene.add(group);cylinder(.07,.65,0,.35,0,0x876849,group,7);if(type===0){for(let i=0;i<2;i++){const crown=mesh(geometry.cone,i?0x5d9b5c:0x72b371,group);crown.scale.set(.46-i*.11,.73,.46-i*.11);crown.position.y=.72+i*.33;}}else{const crown=mesh(geometry.leaf,0x7db971,group);crown.scale.set(.52,.65,.52);crown.position.y=1.03;}return group;}
  for(let i=0;i<55;i++){const a=random()*Math.PI*2;const r=4.4+random()*2.85;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(positions.slice(0,13).some(([px,pz])=>Math.hypot(x-px,z-pz)<1.35)||Math.abs(x)<2.8&&z<-3.6||Math.hypot(x+3.1,z-5.45)<1.45||Math.hypot(x+.35,z-6.35)<.9)continue;const t=tree(x,z,.75+random()*.5,i%3===0?1:0);if(Math.hypot(x-positions[13][0],z-positions[13][1])<1.35||Math.hypot(x-positions[14][0],z-positions[14][1])<1.35)t.visible=false;}
  for(let i=0;i<12;i++)tree(-6.2+(i%3)*.4,-4.5+Math.floor(i/3)*.65,.65+random()*.3,1);
  const grassGeo=new THREE.ConeGeometry(.035,.14,3);const grass=new THREE.InstancedMesh(grassGeo,material(0x548a49),250);for(let i=0;i<250;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*7.2;transform.position.set(Math.cos(a)*r,.15,Math.sin(a)*r);transform.rotation.set(0,random()*6.28,random()*.2);transform.scale.setScalar(.75+random()*.7);transform.updateMatrix();grass.setMatrixAt(i,transform.matrix);}scene.add(grass);

  const buildings=[],lights=[];
  function building(i,color,roofColor,w=1.35,d=1.15,h=.95){const group=new THREE.Group();group.position.set(positions[i][0],.14,positions[i][1]);group.userData.placeIndex=placeOf(i);scene.add(group);box(w+.17,.14,d+.17,0,.07,0,0xd8cbb1,group);box(w,h,d,0,h/2+.14,0,color,group);roof(w+.24,d+.22,.55,h+.14,roofColor,group);box(.32,.6,.04,0,.44,d/2+.025,0x6c5640,group);for(const x of [-w*.29,w*.29]){box(.24,.27,.045,x,.72,d/2+.03,0xb0e3e0,group);box(.018,.27,.055,x,.72,d/2+.057,0xf8f1d9,group);}const windowLight=new THREE.PointLight(0xffc86d,0,2.5);windowLight.position.set(0,.6,d/2+.17);group.add(windowLight);lights.push(windowLight);buildings.push(group);return group;}
  const school=building(0,0xf0eadb,0x377b8e,1.65,1.3,1.04);box(1.35,.09,.5,0,.18,.96,0xb99866,school);box(.8,.15,.04,0,1.18,.72,0x31886b,school);for(let i=0;i<3;i++){const pole=beam(new THREE.Vector3(.9,.1,.8),new THREE.Vector3(.9,1.8,.8),.025,0xe8ede3,school);if(i===0)box(.31,.2,.02,1.05,1.6,.8,0x50b875,school);}
  const course=building(1,0xbf9271,0x9e634b,1.25,1.25,.9);box(1.6,.13,.52,0,.17,.91,0xc69c70,course);for(const x of [-.62,.62])beam(new THREE.Vector3(x,.2,.77),new THREE.Vector3(x,1.28,.77),.035,0x735536,course);
  const library=building(2,0xf0dec1,0x599579,1.5,1.25,1.15);for(let i=0;i<4;i++)box(.13,.4,.09,-.5+i*.16,.45,.76,[0xd88467,0x5c9aba,0xc9b66c,0x81a76f][i],library);box(1.35,.08,.24,0,.22,.78,0x8b694b,library);
  // 修煉場：門上掛綠色招牌，右邊牆上掛一塊寫了字的小黑板（研習講座），牆邊工作台上攤著編到一半的月桃葉蓆和一疊葉子，前面兩張小板凳
  const workshop=building(3,0xc6a080,0xc77656,1.2,1.1,.85);const workbench=box(.7,.11,.36,.8,.43,.65,0x9b7952,workshop);for(const x of [.5,1.1])box(.05,.4,.29,x,.24,.65,0x71523d,workshop);
  box(.44,.13,.04,0,.89,.575,0x2f7a5e,workshop);box(.3,.022,.01,0,.89,.6,0xf3e2a6,workshop);
  box(.36,.016,.26,.72,.493,.65,0xd2bf78,workshop);for(let k=0;k<4;k++){box(.36,.02,.03,.72,.496,.55+k*.066,0xa48a4c,workshop);box(.03,.022,.26,.6+k*.08,.498,.65,0xbfa65e,workshop);}
  for(const [k,r] of [[0,.2],[1,-.15],[2,.45]])box(.2,.012,.055,1.0,.5+k*.012,.62+k*.03,0x6f9e4f,workshop).rotation.y=r;
  for(const x of [.6,.98])cylinder(.07,.2,x,.1,1.02,0x8b6a47,workshop,10);
  box(.035,.32,.46,.615,.66,-.12,0x7a5c41,workshop);box(.03,.27,.41,.625,.66,-.12,0x2f4f3f,workshop);for(const [y,z,w] of [[.72,-.15,.3],[.66,-.17,.24],[.6,-.13,.28]])box(.006,.016,w,.642,y,z,0xf1efe3,workshop);
  const farm=building(4,0xddbe88,0x829468,.85,.85,.65);for(let row=0;row<3;row++){box(1.5,.09,.24,-.55,.12,.95+row*.38,0x806647,farm);for(let j=0;j<5;j++){const x=-1.1+j*.29;const stem=cylinder(.018,.22,x,.26,.95+row*.38,0x4e8b45,farm,5);const leaf=mesh(geometry.leaf,0x4f9c55,farm);leaf.scale.set(.11,.12,.11);leaf.position.set(x,.38,.95+row*.38);if(row===1)rock(.045,x+.055,.36,1.34,0xd6654c,farm);}}
  for(let j=0;j<5;j++){box(.045,.3,.045,-1.35+j*.62,.29,2.03,0xccb68b,farm);}box(2.5,.045,.045,-.12,.37,2.03,0xccb68b,farm);
  const ocean=building(5,0xe4e8dc,0x638fa3,.86,.86,.72);for(let j=0;j<8;j++)box(1.1,.055,.19,0,.11,1+j*.2,0xb9956e,ocean);for(const x of [-.5,.5])for(let j=0;j<3;j++)cylinder(.055,.75,x,-.15,1.05+j*.6,0x8b7257,ocean);
  const stage=new THREE.Group();stage.position.set(...[positions[6][0],.14,positions[6][1]]);stage.userData.placeIndex=placeOf(6);scene.add(stage);buildings.push(stage);
  // 成果廣場是露天景觀台、沒有屋頂：石砌圓台上鋪木板，一圈欄杆，朝村子中央留台階；台上有作品展示板和獎盃台，靠海那側放望遠鏡和長椅
  cylinder(1,.22,0,.11,0,0xd9c8a2,stage,24);cylinder(.96,.04,0,.24,0,0xc29a68,stage,24);for(let i=-3;i<=3;i++){const z=i*.24;box(2*Math.sqrt(.92*.92-z*z),.006,.012,0,.262,z,0x9a7650,stage);}
  const deckIn=Math.atan2(-positions[6][1],-positions[6][0]),deckSea=deckIn+Math.PI,around=a=>new THREE.Vector3(Math.cos(a)*.9,.54,Math.sin(a)*.9);
  const railPosts=[];for(let k=0;k<16;k++){const a=deckIn+.42+k/16*(Math.PI*2-.84);railPosts.push(a);cylinder(.022,.3,Math.cos(a)*.9,.41,Math.sin(a)*.9,0x8a6a48,stage,6);}
  railPosts.forEach((a,k)=>{if(k)beam(around(railPosts[k-1]),around(a),.016,0x8a6a48,stage);});
  const deckSteps=new THREE.Group();deckSteps.position.set(Math.cos(deckIn)*.98,0,Math.sin(deckIn)*.98);deckSteps.rotation.y=-(Math.PI/2+deckIn);stage.add(deckSteps);box(.6,.17,.16,0,.085,.02,0xc9b58c,deckSteps);box(.6,.085,.16,0,.043,-.14,0xc9b58c,deckSteps);
  for(const [side,colors] of [[1,[0xd6553f,0xf2c14e]],[-1,[0x5cc1d8,0x7ad86f]]]){const a=deckIn+side*1.75,board=new THREE.Group();board.position.set(Math.cos(a)*.55,.26,Math.sin(a)*.55);board.rotation.y=-(Math.PI/2+a)+Math.PI;stage.add(board);
    for(const x of [-.17,.17])beam(new THREE.Vector3(x,0,-.04),new THREE.Vector3(x*.8,.42,0),.012,0x6e5238,board);box(.42,.28,.025,0,.34,0,0x8a6a48,board);box(.17,.2,.01,-.095,.34,.016,colors[0],board);box(.17,.2,.01,.095,.34,.016,colors[1],board);}
  cylinder(.11,.16,0,.34,0,0xe9e4da,stage,10);const cup=mesh(new THREE.CylinderGeometry(.07,.035,.1,12),0xf2c14e,stage);cup.position.set(0,.48,0);cylinder(.025,.05,0,.44,0,0xf2c14e,stage,8);for(const s of [-1,1]){const handle=mesh(new THREE.TorusGeometry(.03,.008,5,10),0xf2c14e,stage);handle.position.set(s*.08,.49,0);}
  const scope=new THREE.Group();scope.position.set(Math.cos(deckSea)*.62,.26,Math.sin(deckSea)*.62);scope.rotation.y=-(Math.PI/2+deckSea);stage.add(scope);for(const a of [0,2.1,4.2])beam(new THREE.Vector3(Math.cos(a)*.08,0,Math.sin(a)*.08),new THREE.Vector3(0,.3,0),.01,0x4a5558,scope);
  const tube=mesh(new THREE.CylinderGeometry(.03,.042,.28,10),0x37758c,scope);tube.position.set(0,.34,-.03);tube.rotation.x=-(Math.PI/2-.25);
  const bench=new THREE.Group();bench.position.set(Math.cos(deckSea+.75)*.62,.26,Math.sin(deckSea+.75)*.62);bench.rotation.y=-(Math.PI/2+deckSea+.75);stage.add(bench);box(.42,.035,.13,0,.12,0,0xb58a5a,bench);for(const x of [-.17,.17])box(.03,.12,.11,x,.06,0,0x8a6a48,bench);

  const archive=building(7,0xe8e4d9,0x5b7f95,1.7,1.35,1.1);for(const x of [-.7,-.35,.35,.7])box(.09,1.02,.09,x,.69,.8,0xe7e8dd,archive);box(1.95,.1,.6,0,.19,.86,0xc8c9b4,archive);box(.75,.1,.04,0,1.19,.79,0x50a578,archive);
  const kiosk=building(8,0xddcca3,0x58a8a0,.95,.9,.65);box(.55,.42,.06,0,.81,.54,0x37758c,kiosk);box(.055,.2,.04,0,.8,.58,0xf8f1d9,kiosk);box(.055,.04,.04,0,.97,.58,0xf8f1d9,kiosk);
  const history=building(9,0xe8cda3,0x82785b,1.3,1.18,.94);for(const x of [-.54,.54])beam(new THREE.Vector3(x,.15,.75),new THREE.Vector3(x,1.3,.75),.035,0x806348,history);box(.82,.19,.045,0,1.18,.67,0x578875,history);for(let i=0;i<4;i++)box(.13,.31,.09,-.26+i*.15,.48,.72,[0xaf7d61,0x5b8290,0xb5a063,0x638367][i],history);
  // 村子裡的小人：大頭、圓臉、點點眼睛和腮紅，身體短短的；阿美族頭飾（白色頭帶加毛球）可以關掉。原點在腳底，高度約 0.42
  const smoothMaterials={};function smooth(color){return smoothMaterials[color]||(smoothMaterials[color]=new THREE.MeshStandardMaterial({color,roughness:.75}));}
  const chibiGeo={head:new THREE.SphereGeometry(.088,18,14),hair:new THREE.SphereGeometry(.094,18,10,0,Math.PI*2,0,Math.PI*.56),bun:new THREE.SphereGeometry(.04,10,8),eye:new THREE.SphereGeometry(.012,8,6),cheek:new THREE.SphereGeometry(.015,8,6),body:new THREE.CylinderGeometry(.048,.072,.13,14),skirt:new THREE.CylinderGeometry(.074,.08,.05,14),leg:new THREE.CylinderGeometry(.018,.018,.06,8),arm:new THREE.CylinderGeometry(.017,.019,.085,8),hand:new THREE.SphereGeometry(.022,8,6),band:new THREE.TorusGeometry(.086,.012,6,22),pom:new THREE.SphereGeometry(.022,10,8)};
  function chibi(parent,{top=0xd2453a,bottom=0x2f2d36,hair=0x2b2422,skin=0xe8c09a,band=true,pom=0xffd166,sing=false,elder=false}={}){
    const g=new THREE.Group();parent.add(g);const part=(geo,color,x,y,z,shadow=true)=>{const o=new THREE.Mesh(geo,smooth(color));o.position.set(x,y,z);o.castShadow=shadow;g.add(o);return o;};
    for(const x of [-.026,.026])part(chibiGeo.leg,0x5a4a42,x,.03,0);
    part(chibiGeo.skirt,bottom,0,.085,0);part(chibiGeo.body,top,0,.14,0);
    for(const s of [-1,1]){const arm=part(chibiGeo.arm,top,s*.066,.16,0);arm.rotation.z=s*.55;part(chibiGeo.hand,skin,s*.09,.125,.01,false);}
    part(chibiGeo.head,skin,0,.29,0);
    const cap=part(chibiGeo.hair,elder?0xe9e4da:hair,0,.296,-.006);cap.rotation.x=-.42;
    if(elder)part(chibiGeo.bun,0xe9e4da,0,.33,-.075);
    for(const x of [-.03,.03])part(chibiGeo.eye,0x2a2220,x,.296,.081,false);
    for(const x of [-.054,.054]){const c=part(chibiGeo.cheek,0xf2a0a0,x,.268,.069,false);c.scale.z=.45;}
    if(sing){const mouth=part(chibiGeo.eye,0x8a3a3a,0,.255,.084,false);mouth.scale.set(.9,1.1,.4);}
    if(band){const ring=part(chibiGeo.band,0xf3ead8,0,.33,0);ring.rotation.x=Math.PI/2-.25;part(chibiGeo.pom,pom,0,.36,.07,false);}
    return g;}
  // 古謠樹（位置 14，左岸望向女人島）：樹根是耆老傳下的古調，捲成金色的音符線；樹冠長出孩子哼的新旋律，音符往上飄
  const songTree=new THREE.Group();songTree.position.set(positions[14][0],.14,positions[14][1]);songTree.scale.setScalar(1.3);songTree.userData.placeIndex=placeOf(14);scene.add(songTree);buildings.push(songTree);
  cylinder(.6,.1,0,.05,0,0xb9a57a,songTree,20);
  beam(new THREE.Vector3(0,.05,0),new THREE.Vector3(.06,1.05,-.02),.13,0x5a3b24,songTree);
  for(const [a,l] of [[.05,.45],[3.05,.42],[3.9,.48],[5.2,.44]]){const tip=new THREE.Vector3(Math.cos(a)*l,.12,Math.sin(a)*l);beam(new THREE.Vector3(0,.22,0),tip,.045,0x5a3b24,songTree);
    const curl=mesh(new THREE.TorusGeometry(.11,.022,6,14,Math.PI*1.5),0xd49a2a,songTree);curl.position.copy(tip).setY(.16);curl.rotation.set(-Math.PI/2,0,a);curl.castShadow=false;}
  for(const [x,y,z,r,c] of [[0,1.25,0,.55,0x2f6b3a],[-.36,1.05,.18,.36,0x3c7d44],[.38,1.1,-.1,.38,0x35753f],[.05,1.58,.05,.34,0x4a8a4b]]){const crown=mesh(geometry.leaf,c,songTree);crown.scale.setScalar(r);crown.position.set(x,y,z);}
  for(const [x,y,z,c] of [[-.32,1.32,.42,0xd6553f],[.42,1.4,.25,0xf2c14e],[.15,1.05,.5,0xd6553f],[-.48,1.12,-.2,0xf2c14e]]){const fruit=mesh(geometry.leaf,c,songTree);fruit.scale.setScalar(.06);fruit.position.set(x,y,z);}
  // 樹下唱歌的人：兩位耆老（一位拄拐杖）帶三個孩子，在樹前圍成半圈往外唱
  const treeSingers=[];
  for(const [a,r,shirt,hair,s,cane] of [[1.05,.4,0xd2453a,0xe9e4da,1,true],[1.75,.38,0xd2453a,0xe9e4da,1,false],[.75,.47,0x5cc1d8,0x2b2422,.72,false],[1.4,.5,0xffd166,0x2b2422,.7,false],[2.1,.46,0x7ad86f,0x2b2422,.72,false]]){
    const g=new THREE.Group();g.position.set(Math.cos(a)*r,.1,Math.sin(a)*r);g.rotation.y=Math.atan2(Math.cos(a),Math.sin(a));g.scale.setScalar(s);songTree.add(g);
    chibi(g,{top:shirt,bottom:s<1?0x3b4a6b:0x2f2d36,hair,elder:s===1,sing:true,pom:[0xffd166,0x7ad86f,0x5cc1d8][treeSingers.length%3]});
    if(cane)beam(new THREE.Vector3(.1,0,.03),new THREE.Vector3(.095,.15,.02),.012,0x8a6a48,g);
    treeSingers.push({group:g,elder:s===1});}
  const singerNotes=[];
  for(let i=0;i<2;i++){const noteMaterial=new THREE.MeshStandardMaterial({color:[0xf2c14e,0xd6553f][i],roughness:.7,flatShading:true,transparent:true});const n=mesh(geometry.leaf,noteMaterial,songTree);n.scale.set(.045,.035,.04);n.castShadow=false;singerNotes.push({mesh:n,material:noteMaterial,a:[1,1.6][i]});}
  const treeNotes=[];
  for(let i=0;i<3;i++){const group=new THREE.Group();songTree.add(group);const noteMaterial=new THREE.MeshStandardMaterial({color:[0xd6553f,0xf2c14e,0x7bcdd0][i],emissive:0x5a3a00,emissiveIntensity:.25,roughness:.7,flatShading:true,transparent:true});
    const headNote=mesh(geometry.leaf,noteMaterial,group);headNote.scale.set(.075,.058,.062);headNote.rotation.z=.4;headNote.castShadow=false;
    const stem=box(.016,.24,.016,.062,.125,0,noteMaterial,group);stem.castShadow=false;
    if(i!==1){const flag=box(.1,.028,.016,.105,.23,0,noteMaterial,group);flag.rotation.z=-.6;flag.castShadow=false;}
    treeNotes.push({group,material:noteMaterial});}
  function animateSongTree(elapsed){treeSingers.forEach((p,i)=>{if(p.elder)p.group.rotation.z=Math.sin(elapsed*1.6+i)*.06;else p.group.position.y=.1+Math.abs(Math.sin(elapsed*3.2+i*.9))*.02;});singerNotes.forEach((n,i)=>{const t=(elapsed*.35+i*.5)%1;n.mesh.position.set(Math.cos(n.a)*.55,.42+t*.3,Math.sin(n.a)*.55);n.material.opacity=Math.sin(t*Math.PI);});treeNotes.forEach((n,i)=>{const t=(elapsed*.13+i/treeNotes.length)%1;n.group.position.set(Math.sin(t*4+i*2.1)*.45,1.55+t*1.3,Math.cos(t*3+i)*.3);n.group.rotation.y=elapsed*.5+i;n.material.opacity=Math.sin(t*Math.PI);});}
  const visitHouse=building(10,0xe6dfc5,0x419080,1.25,1.1,.93);box(.72,.18,.04,0,1.14,.63,0xc3a35f,visitHouse);box(1.4,.1,.38,0,.18,.8,0xc1ae83,visitHouse);
  // 第 14 站村辦公室：山牆上有小時鐘，門口招牌與雨遮，右邊公布欄、左邊紅色信箱
  const office=building(13,0xf3e7cf,0xb4553d,1.15,1,.88);box(.56,.14,.04,0,.95,.53,0x2f7a5e,office);box(.7,.05,.3,0,.8,.64,0xc9b48a,office);
  for(const [r,z,c] of [[.15,.64,0x6c5640],[.12,.66,0xf8f1d9]]){const face=cylinder(r,.05,0,1.27,z,c,office,24);face.rotation.x=Math.PI/2;}
  box(.018,.085,.01,0,1.3,.69,0x34393d,office);box(.065,.018,.01,.028,1.27,.69,0x34393d,office);
  for(const x of [.86,1.3])beam(new THREE.Vector3(x,0,.62),new THREE.Vector3(x,.86,.62),.03,0x7a5c41,office);box(.56,.36,.05,1.08,.66,.62,0xc89f6a,office);
  for(const [x,y,c] of [[.94,.7,0xf8f1d9],[1.1,.62,0xf2d27a],[1.24,.72,0xa9d1e6]])box(.12,.15,.012,x,y,.65,c,office);
  cylinder(.03,.5,-.86,.25,.62,0x7a5c41,office,6);box(.2,.15,.15,-.86,.56,.62,0xd6553f,office);
  const officeStones=new THREE.InstancedMesh(paverGeometry,material(0xe1dfc7),12);
  for(let i=0;i<12;i++){const t=i/11;transform.position.set(positions[13][0]*(1-t)+.4*t,.13,positions[13][1]*(1-t)+1.5*t);transform.rotation.y=i*1.7;transform.scale.set(1.1,1,1);transform.updateMatrix();officeStones.setMatrixAt(i,transform.matrix);}
  officeStones.receiveShadow=true;scene.add(officeStones);
  const treeStones=new THREE.InstancedMesh(paverGeometry,material(0xe1dfc7),8);
  for(let i=0;i<8;i++){const t=.13+i/7*.55;transform.position.set(positions[14][0]*(1-t)+.4*t,.13,positions[14][1]*(1-t)+1.5*t);transform.rotation.y=i*1.3;transform.scale.set(1.1,1,1);transform.updateMatrix();treeStones.setMatrixAt(i,transform.matrix);}
  treeStones.receiveShadow=true;scene.add(treeStones);
  // 外島不要像圓柱那樣整齊：岩壁、沙灘、草地共用一條起伏的海岸線，岩壁往下收窄、凹凸不一
  function coast(p,q,r){return a=>1+.14*Math.sin(2*a+p)+.08*Math.sin(3*a+q)+.05*Math.sin(5*a+r);}
  function islet(edge,radius,height,y,color,parent,bottom=1){
    const g=new THREE.CylinderGeometry(1,bottom,1,22,2),v=g.attributes.position;
    for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),z=v.getZ(i);if(!x&&!z)continue;const a=Math.atan2(z,x),k=edge(a)*(bottom<1?1+(y<0?.12*Math.sin(7*a+1.3):y<.5?.06*Math.sin(5*a+.4):0):1);v.setX(i,x*k);v.setZ(i,z*k);}
    g.computeVertexNormals();const o=mesh(g,color,parent);o.scale.set(radius,height,radius);o.position.y=y;return o;}
  // A separate island across a real water gap links to the language training site.
  const [islandX,islandZ]=positions[11];
  const outerIsland=new THREE.Group();outerIsland.position.set(islandX,0,islandZ);outerIsland.userData.placeIndex=placeOf(11);scene.add(outerIsland);buildings.push(outerIsland);
  const langCoast=coast(0,1.6,1.6);
  islet(langCoast,1.32,1.08,-.69,0xa8a082,outerIsland,.88);
  islet(langCoast,1.47,.18,-.07,0xe9dcb2,outerIsland);
  islet(a=>langCoast(a)*(1+.1*Math.sin(3*a+2.3)+.05*Math.sin(4*a+5)),1.19,.1,.06,0x96bd7a,outerIsland);
  // 族語挑戰島是木頭搭的障礙訓練場：終點瞭望台掛著鐘、繩網、攀爬牆、平衡木和跳木樁，孩子一關一關闖，最後上台敲鐘
  const courseGroup=new THREE.Group();courseGroup.position.set(-.05,.112,-.2);courseGroup.rotation.y=-.7;outerIsland.add(courseGroup);
  const courseAt=(u,v)=>new THREE.Vector3(u,0,v).applyAxisAngle(new THREE.Vector3(0,1,0),-.7).add(courseGroup.position);
  const LOG=0x8a6a48,PLANK=0xb58a5a,ROPE=0xe2cf9f,v3=(x,y,z)=>new THREE.Vector3(x,y,z);
  // 終點瞭望台在最後面：四根柱子撐起平台，前面一把梯子，台上掛鐘、插旗，柱頭的燈籠晚上會亮
  const tower=new THREE.Group();tower.position.set(-.85,0,.05);courseGroup.add(tower);
  for(const x of [-.15,.15])for(const z of [-.15,.15]){box(.04,.46,.04,x,.23,z,LOG,tower);box(.025,.14,.025,x,.53,z,LOG,tower);}
  box(.38,.04,.38,0,.44,0,PLANK,tower);for(const [x,z,w,d] of [[-.15,0,.024,.3],[0,-.15,.3,.024],[0,.15,.3,.024]])box(w,.022,d,x,.58,z,LOG,tower);
  for(const z of [-.08,.08])beam(v3(.34,0,z),v3(.17,.46,z),.012,LOG,tower);for(let k=1;k<=5;k++){const f=k/6;box(.016,.016,.16,.34-.17*f,.46*f,0,PLANK,tower);}
  for(const x of [-.13,.01])box(.018,.2,.018,x,.56,-.1,LOG,tower);box(.16,.02,.02,-.06,.66,-.1,LOG,tower);
  const bell=new THREE.Group();bell.position.set(-.06,.65,-.1);tower.add(bell);mesh(new THREE.CylinderGeometry(.022,.042,.06,12),0xe0b040,bell).position.y=-.04;
  cylinder(.012,.52,-.15,.72,.15,0xe9e4da,tower,6);
  const trainingFlag=new THREE.Group();trainingFlag.position.set(-.15,.9,.15);trainingFlag.rotation.y=Math.PI/2;tower.add(trainingFlag);box(.3,.17,.012,.15,0,0,0x2f9c95,trainingFlag);box(.3,.04,.014,.15,0,0,0xf2c14e,trainingFlag);
  const lampGlow=new THREE.MeshStandardMaterial({color:0xfff1c0,emissive:0xffcf7a,emissiveIntensity:0,roughness:.6});
  box(.066,.014,.066,.15,.607,-.15,LOG,tower);box(.05,.055,.05,.15,.641,-.15,lampGlow,tower).castShadow=false;box(.066,.014,.066,.15,.675,-.15,LOG,tower);
  const fieldLight=new THREE.PointLight(0xffd79a,0,3.2);fieldLight.position.set(.15,.66,-.15);tower.add(fieldLight);lights.push(fieldLight);
  // 右後方的繩網：從橫木斜斜拉到地上，孩子往上爬
  const net=new THREE.Group();net.position.set(-.5,0,-.48);courseGroup.add(net);
  for(const z of [-.2,.2])box(.04,.54,.04,0,.27,z,LOG,net);beam(v3(0,.5,-.24),v3(0,.5,.24),.02,LOG,net);beam(v3(.3,.02,-.2),v3(.3,.02,.2),.014,LOG,net);
  for(let k=-2;k<=2;k++)beam(v3(0,.5,k*.09),v3(.3,.02,k*.09),.006,ROPE,net);
  for(let k=1;k<=4;k++){const f=k/5;beam(v3(.3*f,.5-.48*f,-.19),v3(.3*f,.5-.48*f,.19),.006,ROPE,net);}
  // 左後方的 A 字攀爬牆，正面釘著彩色抓點
  const wall=new THREE.Group();wall.position.set(-.45,0,.5);courseGroup.add(wall);
  const slope=Math.atan2(.34,.2),side=Math.hypot(.34,.2);for(const s of [1,-1]){const panel=box(side,.025,.36,s*.1,.17,0,PLANK,wall);panel.rotation.z=-s*slope;}
  const holdGeo=new THREE.SphereGeometry(.018,6,5);
  for(const [f,z,color] of [[.2,-.08,0xd6553f],[.35,.09,0xf2c14e],[.45,-.13,0xd6553f],[.5,-.02,0x5cc1d8],[.65,.11,0x7ad86f],[.8,-.09,0xf2c14e]]){const hold=mesh(holdGeo,color,wall);hold.position.set(.2*f+.014,.34-.34*f+.008,z);}
  // 前面右邊是平衡木，中間兩道跨越木欄，左邊是高低不一的跳木樁
  for(const x of [.3,.58,.86])box(.03,.085,.06,x,.043,-.5,LOG,courseGroup);beam(v3(.24,.1,-.5),v3(.92,.1,-.5),.028,0xa47a52,courseGroup);
  const hurdles=[.3,.6];for(const x of hurdles){for(const z of [-.17,.11])box(.022,.1,.022,x,.05,z,LOG,courseGroup);beam(v3(x,.09,-.2),v3(x,.09,.14),.016,0xa47a52,courseGroup);}
  const stumps=[[.22,.42,.06],[.38,.58,.1],[.54,.42,.08],[.7,.58,.12],[.86,.44,.07]];
  for(const [x,z,h] of stumps){cylinder(.052,h,x,h/2,z,LOG,courseGroup);cylinder(.046,.006,x,h+.003,z,0xd9b98a,courseGroup);}
  const badgeBoard=new THREE.Group();badgeBoard.position.copy(courseAt(.25,.95));badgeBoard.rotation.y=.61;outerIsland.add(badgeBoard);
  for(const x of [-.2,.2])cylinder(.018,.5,x,.25,0,0x8a6a48,badgeBoard,6);
  box(.52,.3,.03,0,.42,0,0x2f6f73,badgeBoard);box(.52,.06,.036,0,.6,0,0xe3b650,badgeBoard);
  for(const [x,color] of [[-.15,0xf2c14e],[0,0xd6553f],[.15,0x5cc1d8]]){const badge=cylinder(.055,.02,x,.41,.022,color,badgeBoard,16);badge.rotation.x=Math.PI/2;}
  // 五個孩子：走平衡木、跨木欄、跳木樁、爬繩網，最後一個在台上敲鐘
  const kid=(parent,shirt,x,y,z,sing=false)=>{const g=new THREE.Group();g.scale.setScalar(.58);g.position.set(x,y,z);parent.add(g);chibi(g,{top:shirt,bottom:0x3b4a6b,pom:shirt,sing});return g;};
  const beamKid=kid(courseGroup,0xffd166,.29,.128,-.5),runKid=kid(courseGroup,0xb88495,.1,.006,-.03),stumpKid=kid(courseGroup,0x7ad86f,.22,.06,.42),netKid=kid(net,0xd6553f,.3,.09,0),bellKid=kid(tower,0x5cc1d8,.06,.46,.07,true);
  netKid.rotation.y=-Math.PI/2;bellKid.rotation.y=Math.PI/2;
  const pingpong=t=>1-Math.abs(t%2-1);
  function animateCourse(elapsed){
    const walk=elapsed*.2;beamKid.position.set(.29+pingpong(walk)*.57,.128+Math.abs(Math.sin(elapsed*7))*.008,-.5);beamKid.rotation.set(0,walk%2<1?Math.PI/2:-Math.PI/2,Math.sin(elapsed*2.6)*.13);
    const run=elapsed*.3,u=.1+pingpong(run)*.75,hop=Math.max(0,...hurdles.map(h=>1-Math.abs(u-h)/.09));runKid.position.set(u,.006+Math.abs(Math.sin(elapsed*11))*.012+Math.sin(hop*Math.PI/2)*.1,-.03);runKid.rotation.y=run%2<1?Math.PI/2:-Math.PI/2;
    const q=(elapsed*1.5)%8,i=Math.floor(q),f=q-i,[a,b]=i<4?[stumps[i],stumps[i+1]]:[stumps[8-i],stumps[7-i]];
    stumpKid.position.set(a[0]+(b[0]-a[0])*f,a[2]+(b[2]-a[2])*f+Math.sin(f*Math.PI)*.09,a[1]+(b[1]-a[1])*f);stumpKid.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
    const climb=.85-.6*(.5-.5*Math.cos(elapsed*.5));netKid.position.set(.3*climb+.04,.5-.48*climb+Math.abs(Math.sin(elapsed*5))*.012,Math.sin(elapsed*.8)*.05);
    bellKid.position.y=.46+Math.abs(Math.sin(elapsed*3))*.03;bell.rotation.x=Math.sin(elapsed*5)*.45;trainingFlag.rotation.y=Math.PI/2+Math.sin(elapsed*1.7)*.28;
  }
  animateCourse(0);
  for(const [a,size] of [[.35,.12],[1.2,.09],[1.75,.13],[2.6,.1],[3.4,.14],[4.15,.08],[4.85,.12],[5.65,.1]]){const r=1.39*langCoast(a);rock(size,islandX+Math.cos(a)*r,-.17,islandZ+Math.sin(a)*r,0x9baca0);}
  const wakeRing=new THREE.RingGeometry(1.6,1.64,48),wakeEdge=wakeRing.attributes.position;for(let i=0;i<wakeEdge.count;i++){const k=langCoast(Math.atan2(-wakeEdge.getY(i),wakeEdge.getX(i)));wakeEdge.setXY(i,wakeEdge.getX(i)*k,wakeEdge.getY(i)*k);}
  const islandWake=mesh(wakeRing,new THREE.MeshBasicMaterial({color:0xe5fffb,transparent:true,opacity:.46,side:THREE.DoubleSide}));islandWake.rotation.x=-Math.PI/2;islandWake.position.set(islandX,-1.24,islandZ);islandWake.castShadow=false;

  // 女人島：靈感來自阿美族女人島的口傳故事。女人們圍成一圈唱歌，鯨魚在外海來回游，連到 Sa'opo 歌謠採譜網站。
  const [songX,songZ]=positions[12];
  const songIsland=new THREE.Group();songIsland.position.set(songX,0,songZ);songIsland.userData.placeIndex=placeOf(12);scene.add(songIsland);buildings.push(songIsland);
  const songCoast=coast(.8,1.2,5.2);
  islet(songCoast,1.36,1.08,-.69,0xa89a86,songIsland,.88);
  islet(songCoast,1.52,.18,-.07,0xf1dec0,songIsland);
  islet(a=>songCoast(a)*(1+.1*Math.sin(3*a+2.3)+.05*Math.sin(4*a+5)),1.2,.1,.06,0xa5c27c,songIsland);
  cylinder(.64,.04,.12,.13,.1,0xe6d3a8,songIsland,18);
  const fire=new THREE.Group();fire.position.set(.12,.15,.1);songIsland.add(fire);
  for(let i=0;i<3;i++){const log=box(.3,.045,.045,0,.03,0,0x7a5638,fire);log.rotation.y=i*Math.PI/3;}
  const flameMaterial=new THREE.MeshStandardMaterial({color:0xffa340,emissive:0xff6a1a,emissiveIntensity:.7,roughness:.6,flatShading:true});
  const flame=mesh(geometry.cone,flameMaterial,fire);flame.scale.set(.085,.22,.085);flame.position.y=.15;flame.castShadow=false;
  const fireLight=new THREE.PointLight(0xff9a4a,0,3.2);fireLight.position.set(0,.45,0);fire.add(fireLight);lights.push(fireLight);
  const dance=new THREE.Group();dance.position.set(.12,.15,.1);songIsland.add(dance);const dancers=[];
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const woman=new THREE.Group();woman.position.set(Math.cos(a)*.46,0,Math.sin(a)*.46);woman.rotation.y=-a+Math.PI/2;dance.add(woman);
    chibi(woman,{pom:[0xffd166,0x7ad86f,0x5cc1d8][i%3],sing:true});
    dancers.push(woman);}
  const hands=mesh(new THREE.TorusGeometry(.46,.011,5,36),0xf3ead8,dance);hands.rotation.x=Math.PI/2;hands.position.y=.13;
  const palm=new THREE.Group();palm.position.set(-.82,.1,-.55);songIsland.add(palm);
  beam(new THREE.Vector3(0,0,0),new THREE.Vector3(-.12,1.15,-.1),.04,0x8a6a48,palm);
  for(let i=0;i<6;i++){const leaf=box(.5,.025,.11,0,0,0,i%2?0x5f9f55:0x76b862,palm);const a=i/6*Math.PI*2;leaf.position.set(-.12+Math.cos(a)*.22,1.13,-.1+Math.sin(a)*.22);leaf.rotation.set(0,-a,-.42);}
  for(let i=0;i<2;i++){const coco=mesh(geometry.leaf,0x6b4e33,palm);coco.scale.setScalar(.05);coco.position.set(-.1+i*.07,1.06,-.06);}
  const canoe=new THREE.Group();canoe.position.set(.95,.05,.82);canoe.rotation.y=.9;songIsland.add(canoe);
  const canoeHull=mesh(new THREE.CylinderGeometry(.13,.07,.62,5),0xbf7850,canoe);canoeHull.rotation.z=Math.PI/2;box(.34,.03,.12,0,.05,0,0xd9ba85,canoe);
  rock(.12,-.6,.12,.75,0xb1a98c,songIsland);rock(.09,.75,.1,-.62,0xe8dcc0,songIsland);
  const notes=[];
  for(let i=0;i<4;i++){const group=new THREE.Group();songIsland.add(group);const noteMaterial=new THREE.MeshStandardMaterial({color:[0xffd166,0xff9f68,0x7bcdd0,0xffd166][i],emissive:0x5a3a00,emissiveIntensity:.25,roughness:.7,flatShading:true,transparent:true});
    const headNote=mesh(geometry.leaf,noteMaterial,group);headNote.scale.set(.085,.065,.07);headNote.rotation.z=.4;headNote.castShadow=false;
    const stem=box(.018,.27,.018,.07,.14,0,noteMaterial,group);stem.castShadow=false;
    if(i%2){const flag=box(.11,.03,.018,.12,.26,0,noteMaterial,group);flag.rotation.z=-.6;flag.castShadow=false;}
    group.scale.setScalar(1.4);group.position.set(.12,1.1+i*.3,.1);notes.push({group,material:noteMaterial});}
  // 鯨魚在島前方面向鏡頭的海面來回游，避開主島；頭朝 +z，好讓 lookAt 直接轉向前進方向。
  const whale=new THREE.Group();scene.add(whale);whale.userData.placeIndex=placeOf(12);buildings.push(whale);
  const whaleBody=mesh(new THREE.SphereGeometry(1,12,8),0x4a6d85,whale);whaleBody.scale.set(.34,.26,.82);
  const whaleBelly=mesh(new THREE.SphereGeometry(1,12,8),0xd9e6e6,whale);whaleBelly.scale.set(.27,.16,.66);whaleBelly.position.set(0,-.1,.08);
  const tail=new THREE.Group();tail.position.set(0,.02,-.78);whale.add(tail);
  const tailBase=mesh(geometry.cone,0x4a6d85,tail);tailBase.scale.set(.12,.34,.09);tailBase.rotation.x=-Math.PI/2;tailBase.position.z=-.06;
  for(const s of [-1,1]){const fluke=box(.32,.03,.16,s*.17,0,-.22,0x4a6d85,tail);fluke.rotation.y=s*.42;}
  for(const s of [-1,1]){const fin=box(.26,.025,.11,s*.32,-.1,.16,0x42627a,whale);fin.rotation.set(0,s*.5,s*-.35);}
  for(const s of [-1,1]){const eye=mesh(geometry.leaf,0x1d2a33,whale);eye.scale.setScalar(.03);eye.position.set(s*.25,.03,.52);}
  const spout=new THREE.Group();spout.position.set(0,.24,.35);whale.add(spout);const spoutMaterial=new THREE.MeshStandardMaterial({color:0xf2fbff,roughness:.4,transparent:true,opacity:.85});
  for(const [x,y,z,s] of [[0,.08,0,.07],[-.06,.2,0,.06],[.06,.2,0,.06],[0,.3,0,.05]]){const drop=mesh(geometry.leaf,spoutMaterial,spout);drop.scale.setScalar(s);drop.position.set(x,y,z);drop.castShadow=false;}
  const songOut=1.3,songWhale=new THREE.Vector3(),songAhead=new THREE.Vector3();
  function whaleAt(a,target){return target.set(songX+Math.cos(a)*2.3,-1.27,songZ+Math.sin(a)*2.3);}
  whale.position.copy(whaleAt(songOut,songWhale));whale.lookAt(whaleAt(songOut+.1,songAhead));spout.visible=false;
  function animateSongIsland(elapsed){
    dance.rotation.y=elapsed*.32;dancers.forEach((d,i)=>{d.position.y=Math.abs(Math.sin(elapsed*3.2+i*.9))*.035;});
    flame.scale.set(.085+Math.sin(elapsed*7)*.01,.22+Math.sin(elapsed*9.3)*.045,.085);
    notes.forEach((n,i)=>{const t=(elapsed*.16+i/notes.length)%1;n.group.position.set(.12+Math.sin(t*5+i*1.7)*.32,.75+t*1.6,.1+Math.cos(t*4+i)*.22);n.group.rotation.y=elapsed*.6+i;n.material.opacity=Math.sin(t*Math.PI);});
    const a=songOut+Math.sin(elapsed*.12)*.85;whale.position.copy(whaleAt(a,songWhale));whale.position.y+=Math.sin(elapsed*1.3)*.04;
    whale.lookAt(whaleAt(a+Math.cos(elapsed*.12)*.05,songAhead).setY(whale.position.y));tail.rotation.x=Math.sin(elapsed*2.2)*.22;
    const puff=(elapsed*.2)%1;spout.visible=puff<.22;spout.scale.setScalar(.6+puff*3);}
  const selectionRing=mesh(new THREE.RingGeometry(1.05,1.17,40),new THREE.MeshBasicMaterial({color:0x1fd16c,transparent:true,opacity:.7,side:THREE.DoubleSide}));selectionRing.rotation.x=-Math.PI/2;selectionRing.position.y=.13;selectionRing.visible=false;selectionRing.castShadow=false;

  for(const [x,z] of [[-.2,2.1],[-3.1,2.9],[3.6,-.3],[.6,-1.7]]){cylinder(.055,.86,x,.49,z,0x786653);box(.2,.2,.2,x,1,z,0xe7d7ae);const lamp=new THREE.PointLight(0xffc36a,0,3);lamp.position.set(x,1.07,z);scene.add(lamp);lights.push(lamp);}
  const people=[];for(let i=0;i<6;i++){const person=new THREE.Group();scene.add(person);chibi(person,{top:[0x659ac5,0xcc8c5e,0x6a9b78,0xe4c272,0xb88495,0x77afa6][i],bottom:0x47565b,hair:[0x2b2422,0x4a3428][i%2],band:false}).scale.setScalar(1.15);people.push({group:person,phase:i*Math.PI/3,speed:.035+i*.005});}

  const clouds=[];for(let i=0;i<6;i++){const cloud=new THREE.Group();scene.add(cloud);const x=(i-2.5)*4,z=-5+(i%3)*5,y=4.3+(i%2)*.65;cloud.position.set(x,y,z);for(let j=0;j<4;j++){const puff=mesh(geometry.rock,0xf4f5eb,cloud);puff.position.set((j-1.5)*.47,Math.sin(j)*.16,0);puff.scale.set(.58,.42,.45);puff.castShadow=false;}clouds.push({group:cloud,x,y});}
  const nightMoon=mesh(new THREE.SphereGeometry(.48,12,8),new THREE.MeshBasicMaterial({color:0xffefd0}));nightMoon.position.set(-8,7,-6);nightMoon.castShadow=false;nightMoon.visible=false;
  const starVertices=[];for(let i=0;i<65;i++)starVertices.push((random()-.5)*36,5+random()*7,-12+random()*13);const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starVertices,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xe5edff,size:.065,transparent:true,opacity:.85}));scene.add(stars);

  const boat=new THREE.Group();boat.position.set(7,-.93,4.2);const hull=mesh(new THREE.CylinderGeometry(.3,.17,1.1,5),0xbf7850,boat);hull.rotation.z=Math.PI/2;box(.55,.05,.25,0,.04,0,0xd9ba85,boat);beam(new THREE.Vector3(0,.06,0),new THREE.Vector3(0,1.08,0),.018,0x8d7751,boat);const sailGeo=new THREE.BufferGeometry();sailGeo.setAttribute('position',new THREE.Float32BufferAttribute([.03,.2,0,.03,1.04,0,.54,.2,0],3));sailGeo.computeVertexNormals();mesh(sailGeo,new THREE.MeshStandardMaterial({color:0xf0e8d2,roughness:1,side:THREE.DoubleSide}),boat);
  const secondBoat=boat.clone();secondBoat.scale.setScalar(.62);secondBoat.position.set(-5.8,-.92,7.15);secondBoat.rotation.y=-.65;scene.add(secondBoat);
  // 竹筏 dadangoyan：取代原本的帆船。七根竹子並排、兩道橫木用黃藤綁住，船頭微微翹起，船上有人拿槳，竹子一半泡在水裡；點了打開竹筏卡（紀錄片、科展、教案、VR 作品），點海面會划過去
  const RAFT_Y=-1.37,raft=new THREE.Group();raft.position.set(8.75,RAFT_Y,1.6);raft.rotation.y=.35;raft.scale.setScalar(1.35);raft.userData.raft=true;scene.add(raft);
  for(let i=0;i<7;i++){const z=(i-3)*.105,bamboo=mesh(new THREE.CylinderGeometry(.05,.05,1.45,7),i%2?0xcdb86c:0xbfa95c,raft);bamboo.rotation.z=Math.PI/2;bamboo.position.set(0,.05,z);
    const tip=mesh(new THREE.CylinderGeometry(.045,.05,.32,7),i%2?0xcdb86c:0xbfa95c,raft);tip.position.set(.84,.11,z);tip.rotation.z=Math.PI/2+.38;}
  for(const x of [-.45,.35]){box(.07,.05,.8,x,.11,0,0x8a6a48,raft);for(const z of [-.32,0,.32])cylinder(.062,.035,x,.1,z,0x5a3b24,raft,6);}
  const rower=new THREE.Group();rower.position.set(-.2,.13,.05);rower.rotation.y=Math.PI/2;raft.add(rower);
  chibi(rower,{top:0xd2453a,skin:0xc99a74,band:false});
  const paddle=new THREE.Group();paddle.position.set(-.2,.33,.17);raft.add(paddle);beam(new THREE.Vector3(0,0,0),new THREE.Vector3(.05,-.5,.12),.014,0x8d7751,paddle);const blade=box(.07,.16,.02,.05,-.52,.12,0x8d7751,paddle);
  const raftNet=mesh(new THREE.CylinderGeometry(.09,.06,.12,8),0x9b7b4c,raft);raftNet.position.set(.3,.16,-.18);
  // 點海面時，目標處亮一圈；划的時候船尾留下水波
  const seaGlow=color=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
  const raftTarget=mesh(new THREE.RingGeometry(.2,.28,28),seaGlow(0xfff3c4));raftTarget.rotation.x=-Math.PI/2;raftTarget.position.y=-1.25;raftTarget.castShadow=raftTarget.receiveShadow=false;
  const wakes=[];for(let i=0;i<6;i++){const ring=mesh(new THREE.RingGeometry(.16,.21,22),seaGlow(0xeafffb));ring.rotation.x=-Math.PI/2;ring.position.y=-1.26;ring.castShadow=ring.receiveShadow=false;wakes.push({ring,born:-9});}
  // 海怪：照壁畫做——一大團往下垂的綠色長毛；頭頂兩側各橫伸一支暗紅色、兩頭圓圓的角，微微往上翹，中段往上分出一小叉（右邊那支比較長）；
  // 小小的黑眼睛往左看、兩團粉紅臉頰、一張和臉一樣寬的橘色月牙大嘴，嘴上兩排白點；兩手抱著一條藍色大魚，魚頭在左上、尾巴在右下
  // 上半身露出海面、一直面向鏡頭，身子微微往左轉、往後仰，從上面看下來就像壁畫；點了打開傳說故事卡，潛下去再從另一個地方冒出來
  const WATER_Y=-1.32,monster=new THREE.Group(),beast=new THREE.Group(),body=new THREE.Group(),ball=new THREE.SphereGeometry(1,12,8),fur=0x55893a,cy=.36;monster.userData.monster=true;monster.scale.setScalar(1.15);beast.rotation.x=-.3;body.rotation.y=-.5;beast.add(body);monster.add(beast);scene.add(monster);
  // 身體：圓頂、越往下越寬，右半邊比較蓬；表面一道道往下的毛紋，臉那一塊平順，眼睛和嘴巴才貼得上去
  const bodyGeo=new THREE.IcosahedronGeometry(1,5),bodyPos=bodyGeo.attributes.position,bulge=(x,y)=>(1+.05*(1-y))*(1+.1*Math.max(0,x))*(y>0&&y<1?Math.cbrt(1-y**3)/Math.sqrt(1-y*y):1);
  for(let i=0;i<bodyPos.count;i++){const x=bodyPos.getX(i),y=bodyPos.getY(i),z=bodyPos.getZ(i),around=Math.atan2(x,z),face=THREE.MathUtils.clamp((z-.45)/.25,0,1)*THREE.MathUtils.clamp((y+.1)/.3,0,1),r=1+(Math.sin(around*12+y*2)*.03+Math.sin(around*5-y*6)*.02)*(1-face),w=bulge(x,y)*r;bodyPos.setXYZ(i,x*w*.64,y*r*.8,z*w*.52);}
  bodyGeo.computeVertexNormals();mesh(bodyGeo,fur,body).position.y=cy;
  // 一撮撮往下垂的長毛：沿著身體的側面和後面一圈圈排下來（避開臉和抱魚的地方），三種綠交錯，全部併成一個網格
  const lock=new THREE.ConeGeometry(1,1,5).rotateX(Math.PI).translate(0,-.5,0).toNonIndexed().attributes.position,furPos=[],furColor=[],shade=new THREE.Color(),place=new THREE.Matrix4(),corner=new THREE.Vector3(),[bx,by,bz]=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
  [[.9,8,.16,1.4],[.58,14,.3,.5],[.26,16,.34,.32],[-.06,16,.38,.25],[.97,9,.14,.5]].forEach(([y,count,len,out],row)=>{for(let k=0;k<count;k++){const a=(k+row%2*.5)/count*Math.PI*2-Math.PI;if(row<4&&Math.abs(a)<(y>.4?.95:1.15)||row===4&&Math.abs(a)>.85)continue;/* 最後一排是額頭的瀏海 */
    const c=Math.sqrt(1-y*y),x=Math.sin(a)*c,z=Math.cos(a)*c,w=bulge(x,y),n=new THREE.Vector3(x/.64,0,z/.52).normalize();
    by.set(0,1,0).addScaledVector(n,-out).normalize();bz.copy(n).addScaledVector(by,-n.dot(by)).normalize();bx.crossVectors(by,bz);
    place.makeBasis(bx,by,bz).scale(corner.set(.065,len*(.85+.075*((k*7+row)%5)),.035)).setPosition(x*w*.64-n.x*.02,y*.8+cy,z*w*.52-n.z*.02);shade.set([0x447a2c,0x55893a,0x6e9f48][(k+row)%3]);
    for(let i=0;i<lock.count;i++){corner.fromBufferAttribute(lock,i).applyMatrix4(place);furPos.push(corner.x,corner.y,corner.z);furColor.push(shade.r,shade.g,shade.b);}}});
  const furGeo=new THREE.BufferGeometry();furGeo.setAttribute('position',new THREE.Float32BufferAttribute(furPos,3));furGeo.setAttribute('color',new THREE.Float32BufferAttribute(furColor,3));furGeo.computeVertexNormals();
  mesh(furGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:true}),body);
  // 角：暗紅色、兩頭圓圓的，從頭頂兩側往外橫伸、微微往上翹，中段往上分出一小叉；右邊那支比較長，兩支小叉都微微往左偏（照壁畫）
  const bark=document.createElement('canvas'),pen=bark.getContext('2d'),barkMap=new THREE.CanvasTexture(bark),up=new THREE.Vector3(0,1,0);bark.width=bark.height=64;pen.fillStyle='#5e2018';pen.fillRect(0,0,64,64);pen.strokeStyle='#8a3b22';pen.lineWidth=5;
  for(const x of [-64,-32,0,32]){pen.beginPath();pen.moveTo(x,0);pen.lineTo(x+64,64);pen.stroke();}barkMap.colorSpace=THREE.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=THREE.RepeatWrapping;barkMap.repeat.set(2,3);const hornColor=new THREE.MeshStandardMaterial({map:barkMap,roughness:.75});
  function horn(a,b,radius){const d=new THREE.Vector3().subVectors(b,a),o=mesh(new THREE.CapsuleGeometry(radius,d.length(),4,8),hornColor,body);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(up,d.normalize());}
  for(const [s,len,fork,rise,ahead] of [[1,.58,.62,.33,-.1],[-1,.3,.66,.14,.22]]){const root=new THREE.Vector3(s*.36,1,.08),tip=root.clone().add(new THREE.Vector3(s*.95,rise,ahead).normalize().multiplyScalar(len)),base=root.clone().lerp(tip,fork);
    horn(root,tip,.046);horn(base,base.clone().add(new THREE.Vector3(-.03,.12,0)),.04);}
  // 臉上的東西貼著身體表面：從前面往身體打一條線，找到表面的位置和朝向
  const skin=new THREE.Mesh(bodyGeo),feel=new THREE.Raycaster(),inward=new THREE.Vector3(0,0,-1),outward=new THREE.Vector3(0,0,1);skin.position.y=cy;skin.updateMatrixWorld();
  function onSkin(x,y){feel.set(new THREE.Vector3(x,y,2),inward);const hit=feel.intersectObject(skin)[0];return hit?{z:hit.point.z,normal:hit.face.normal}:{z:.4,normal:outward};}
  function stick(object,x,y,lift){const {z,normal}=onSkin(x,y);object.position.set(x,y,z).addScaledVector(normal,lift);object.quaternion.setFromUnitVectors(outward,normal);body.add(object);return object;}
  // 眼睛：黑眼珠偏左、右邊露出一彎白；臉頰兩團粉紅
  const eyes=[],white=new THREE.MeshBasicMaterial({color:0xfff8ec});
  for(const s of [-1,1]){const eye=stick(new THREE.Group(),s*.2,.97,.004);eyes.push(eye);
    const sclera=mesh(ball,white,eye);sclera.scale.set(.042,.049,.02);sclera.castShadow=false;const pupil=mesh(ball,smooth(0x17181c),eye);pupil.scale.set(.031,.04,.022);pupil.position.set(-.012,0,.006);
    stick(mesh(ball,smooth(0xc93347)),s*.35,.93,.004).scale.set(.055,.034,.018);}
  // 嘴巴：一彎和臉一樣寬的橘色月牙，上緣幾乎是平的，外面一圈深色的邊；上排六顆、下排四顆白點
  const lipTop=x=>.865+.008*(x/.34)**2,lipLow=x=>lipTop(x)-.1*Math.sin(Math.PI*THREE.MathUtils.clamp((x+.34)/.68,0,1))**.6;
  function lip(grow,lift,color){const positions=[],index=[];for(let i=0;i<=24;i++){const x=-.34-grow+(.68+grow*2)*i/24;for(const y of [lipTop(x)+grow,lipLow(x)-grow]){const {z,normal}=onSkin(x,y);positions.push(x+normal.x*lift,y+normal.y*lift,z+normal.z*lift);}if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(index);geo.computeVertexNormals();mesh(geo,smooth(color),body).castShadow=false;}
  lip(.012,.006,0x3a2516);lip(0,.012,0xe0600a);
  for(const [x,low] of [[-.27,0],[-.165,0],[-.06,0],[.045,0],[.15,0],[.255,0],[-.15,1],[-.05,1],[.05,1],[.15,1]])stick(mesh(new THREE.CircleGeometry(.019,10),white),x,lipTop(x)-(low?.068:.025),.02).castShadow=false;
  // 兩手抱著藍色大魚：魚身圓胖、頭圓、往尾巴收窄，背上淡紫色背鰭、身側一片深藍胸鰭、尾巴分叉一直拍；左手托著魚下巴，右手按在魚背上
  const fish=new THREE.Group();fish.position.set(-.17,.34,.62);fish.rotation.z=-.3;body.add(fish);
  const fishGeo=new THREE.IcosahedronGeometry(1,3),fishPos=fishGeo.attributes.position;
  for(let i=0;i<fishPos.count;i++){const x=fishPos.getX(i),y=fishPos.getY(i),z=fishPos.getZ(i),narrow=1-.45*Math.max(0,x)**2;fishPos.setXYZ(i,x*.5,y*narrow*(y>0?.35:.29),z*narrow*.14);}
  fishGeo.computeVertexNormals();mesh(fishGeo,smooth(0x3248b0),fish);
    function fin(points,color,parent,x,y,z){const o=mesh(new THREE.ShapeGeometry(new THREE.Shape(points.map(([a,b])=>new THREE.Vector2(a,b)))),new THREE.MeshStandardMaterial({color,roughness:.75,side:THREE.DoubleSide}),parent);o.position.set(x,y,z);return o;}
  fin([[-.2,.27],[-.12,.5],[-.02,.45],[.09,.51],[.19,.44],[.28,.38],[.39,.22],[.36,.12],[-.16,.16]],0xa49fe8,fish,0,0,0);
  fin([[0,0],[.14,-.04],[.38,-.2],[.17,-.14],[.02,-.12]],0x5d72d8,fish,-.2,.05,.145);
  const tailFin=new THREE.Group();tailFin.position.x=.46;fish.add(tailFin);fin([[0,.06],[.28,.3],[.2,.01],[.31,-.29],[0,-.06]],0x2a43a2,tailFin,0,0,0);
  const fishEye=mesh(ball,white,fish);fishEye.scale.setScalar(.034);fishEye.position.set(-.38,.12,.085);const pupil=mesh(ball,smooth(0x17181c),fish);pupil.scale.setScalar(.017);pupil.position.set(-.39,.12,.115);
  fish.updateMatrix();const grip=(x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(fish.matrix);
  for(const [shoulder,hand,size] of [[new THREE.Vector3(-.44,.5,.36),grip(-.4,-.2,.07),.8],[new THREE.Vector3(.5,.8,.2),grip(.32,.15,.12),1]]){const d=new THREE.Vector3().subVectors(hand,shoulder),arm=mesh(new THREE.CapsuleGeometry(.095,d.length(),3,10),fur,body);arm.position.copy(shoulder).add(hand).multiplyScalar(.5);arm.quaternion.setFromUnitVectors(up,d.normalize());
    const paw=mesh(new THREE.IcosahedronGeometry(1,1),fur,body);paw.scale.set(.12*size,.09*size,.06);paw.position.copy(hand);}
  // 身邊一圈白色水波；潛水和冒出來時各濺起兩圈水花
  const foam=mesh(new THREE.RingGeometry(.62,.78,32),new THREE.MeshBasicMaterial({color:0xeafffb,transparent:true,opacity:.4,side:THREE.DoubleSide,depthWrite:false}),monster);foam.rotation.x=-Math.PI/2;foam.position.y=.06;foam.castShadow=foam.receiveShadow=false;
  const splashes=[];for(let i=0;i<4;i++){const ring=mesh(new THREE.RingGeometry(.55,.66,32),seaGlow(0xeafffb));ring.rotation.x=-Math.PI/2;ring.position.y=-1.25;ring.castShadow=ring.receiveShadow=false;splashes.push({ring,born:-9});}
  function splash(t){for(const delay of [0,.28]){const s=splashes.reduce((a,b)=>a.born<b.born?a:b);s.ring.position.x=monster.position.x;s.ring.position.z=monster.position.z;s.size=monster.scale.x/1.3;s.born=t+delay;}}
  // 會冒出來的地方：主島外圈的海面，避開兩座小外島、女人島旁的鯨魚、小帆船和竹筏一開始停的地方；第一個是一打開首頁時的位置
  // 桌機看得到左右兩側，平板看得到島的後方，手機看得到島的前方，潛水時再挑當下畫面看得到的（spotView）
  const MONSTER_SPOTS=[[110,12.5],[0,11.5],[-10,10.5],[10,12.5],[20,13.5],[-20,12.5],[-50,11.5],[90,12.5],[100,11.5],[120,11.5],[130,13.5],[60,12.5],[80,11.5],[-80,12.5],[-170,11.5],[180,12.5]].map(([deg,r])=>[Math.cos(deg*Math.PI/180)*r,Math.sin(deg*Math.PI/180)*r]);
  let monsterSpot=0,monsterState='up',monsterSince=0,diveFrom=0,monsterChecked=false;
  function placeMonster(i){monsterSpot=i;monster.position.set(MONSTER_SPOTS[i][0],WATER_Y,MONSTER_SPOTS[i][1]);}
  placeMonster(0);
  const inBeast=o=>{for(;o;o=o.parent)if(o===beast)return true;return false;},probe=new THREE.Vector3(),probeAt=new THREE.Vector2(),covers=['.village-header','.world-caption','.world-whispers','.village-zoom','.sky-door'];
  // 這個地方在畫面上看不看得到：0 在畫面外、被上方標題蓋住或被島和房子擋住，1 只被下方卡片蓋住（手機上卡片會蓋住大半個海），2 完全看得到
  function spotView(i){camera.updateMatrixWorld();const [x,z]=MONSTER_SPOTS[i],box=canvas.getBoundingClientRect(),size=monster.scale.x,sideX=Math.cos(yaw)*.9*size,sideZ=-Math.sin(yaw)*.9*size;let l=1e9,t=1e9,r=-1e9,b=-1e9;
    for(const [s,y] of [[0,0],[0,1.4],[-1,.6],[1,1.15]])/* 左邊最外面是魚頭，右邊是長的那支角 */{probe.set(x+s*sideX,WATER_Y+y*size,z+s*sideZ).project(camera);const px=box.left+(probe.x*.5+.5)*box.width,py=box.top+(.5-probe.y*.5)*box.height;l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}
    if(l<box.left+8||r>box.right-8||t<box.top+8||b>box.bottom-(width<600?box.height*.22:8))return 0;
    const hit=selector=>[...document.querySelectorAll(selector)].some(el=>{const u=el.getBoundingClientRect();return u.width>0&&!(u.right<l-6||u.left>r+6||u.bottom<t-34||u.top>b+6);});/* 上面多留一點給名字 */
    if(covers.some(hit))return 0;
    for(const y of [.5,1.1]){probe.set(x,WATER_Y+y*size,z);const p=probe.clone().project(camera);probeAt.set(p.x,p.y);raycaster.setFromCamera(probeAt,camera);const far=probe.sub(raycaster.ray.origin).dot(raycaster.ray.direction)-.4;
      if(raycaster.intersectObjects(scene.children,true).some(h=>h.distance<far&&h.object.isMesh&&!h.object.material.transparent&&shown(h.object)&&!inBeast(h.object)))return 0;}
    return hit('.village-bottom')?1:2;}
  // 換一個地方冒出來：不回原地，也不冒在竹筏和竹筏要去的地方旁邊；挑看得最清楚的那幾個地方
  function nextMonsterSpot(){const near=[[raft.position.x,raft.position.z],...(raftGoal?[[raftGoal.x,raftGoal.z]]:[])],others=MONSTER_SPOTS.map((_,i)=>i).filter(i=>i!==monsterSpot),clear=others.filter(i=>near.every(([x,z])=>Math.hypot(MONSTER_SPOTS[i][0]-x,MONSTER_SPOTS[i][1]-z)>2.5)),pool=clear.length?clear:others;
    const view=pool.map(spotView),best=Math.max(...view),picks=pool.filter((_,k)=>view[k]===best);return picks[Math.floor(Math.random()*picks.length)];}
  // 減少動態效果時直接換位置，不做潛水動畫
  function diveMonster(){if(monsterState!=='up'&&monsterState!=='rise')return;if(reduced){placeMonster(nextMonsterSpot());return;}monsterState='dive';monsterSince=performance.now()/1000;diveFrom=beast.position.y;splash(monsterSince);}
  function animateMonster(t){const k=t-monsterSince;
    if(monsterState==='dive'){const p=Math.min(1,k/.6);beast.position.y=diveFrom+(-1.9-diveFrom)*p*p;beast.rotation.z=.3*p;foam.material.opacity=.4*(1-p);if(p>=1){monsterState='under';monsterSince=t;monster.visible=false;placeMonster(nextMonsterSpot());}}
    else if(monsterState==='under'){if(k>=1.3){monsterState='rise';monsterSince=t;monster.visible=true;beast.rotation.z=0;splash(t);}}
    else if(monsterState==='rise'){const p=Math.min(1,k/.8),q=p-1;beast.position.y=-1.9*(1-(1+2.70158*q*q*q+1.70158*q*q));foam.material.opacity=.4*p;if(p>=1){monsterState='up';monsterSince=t;}}
    else{beast.position.y=Math.sin(k*1.3)*.05;beast.rotation.z=Math.sin(k*.8)*.06;}
    tailFin.rotation.z=Math.sin(t*5)*.2;const blink=t%3.7<.14;eyes.forEach(e=>{e.scale.y=blink?.15:1;});
    splashes.forEach(s=>{const q=(t-s.born)/1.3;s.ring.material.opacity=q<0||q>1?0:.55*(1-q);s.ring.scale.setScalar((1+Math.max(0,q)*1.6)*(s.size||1));});}
  const birdsGeo=new THREE.BufferGeometry();birdsGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.15,0,0,0,.05,0,0,.05,0,.15,0,0],3));const birdMaterial=new THREE.LineBasicMaterial({color:0x678b8e});const birds=[];for(let i=0;i<4;i++){const bird=new THREE.LineSegments(birdsGeo,birdMaterial);scene.add(bird);birds.push(bird);}

  let night=false;function setTheme(theme){night=theme==='night';hemi.intensity=night?.7:2.3;hemi.color.set(night?0x9bb7eb:0xeafaff);sun.intensity=night?.5:3.2;sun.color.set(night?0xb0c4ed:0xfff1d2);fill.intensity=night?.25:.65;renderer.toneMappingExposure=night?.88:1.18;seaMaterial.color.set(night?0x173f59:0x73bfc0);stars.visible=night;nightMoon.visible=night;clouds.forEach(c=>c.group.visible=!night);lights.forEach(light=>light.intensity=night?2.2:0);lampGlow.emissiveIntensity=night?1.4:0;scene.fog=new THREE.Fog(night?0x102d45:0xb5ddd9,35,110);}
  setTheme(document.documentElement.dataset.theme);window.addEventListener('salimpo:theme',event=>setTheme(event.detail));
  // 村子裡的 singsi：11 位老師站在各站旁邊，手上拿著代表道具，頭上有對話泡泡；點一下跳出對話卡（文字在 singsi.js，順序和這裡一樣）
  // at 是腳底位置，y 是站的高度（勤偉站在成果廣場的景觀台上），turn 是面向（0.61 正對鏡頭）
  const SINGSI=[
    {at:[2.25,-1.65],turn:.35,top:0x3b6ea5,band:true,prop:'book'},
    {at:[-.1,6.6],turn:.85,top:0x2f8f9d,prop:'spear'},
    {at:[-5.5,4.35],turn:.95,top:0xd2453a,band:true,prop:'tube'},
    {at:[4.15,3.72],turn:.5,top:0x8e6bb8,prop:'notebook'},
    {at:[-1.2,1.5],turn:.61,top:0xe0a43a,prop:'wave'},
    {at:[-4.13,1.74],y:.4,turn:.55,top:0x5f9e6e,prop:'easel'},
    {at:[6.6,1.95],turn:.45,top:0xb76e4a,prop:'rattan'},
    {at:[1.1,1.25],turn:.5,top:0x4a7f6a,prop:'map'},
    {at:[-3.5,6.6],turn:.9,top:0x6aa0c8,prop:'leaf'},
    {at:[-2.6,-2.6],turn:.5,top:0xc75f86,prop:'lens'},
    {at:[.85,5.05],turn:.85,top:0xd9774a,prop:'basket'}
  ];
  const singsiFigures=[],singsiBubbles=[];let talkingTo=-1,singsiHover=-1,waveArm=null,tapTube=null;
  {
    const V=(x,y,z)=>new THREE.Vector3(x,y,z);
    // 對話泡泡：白色圓角框加三個綠點，所有 singsi 共用一張貼圖
    const paper=document.createElement('canvas');paper.width=128;paper.height=104;const c=paper.getContext('2d');
    c.fillStyle='#fff';c.strokeStyle='rgba(15,32,45,.22)';c.lineWidth=4;
    c.beginPath();c.moveTo(40,70);c.lineTo(34,98);c.lineTo(64,70);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(36,6);c.arcTo(122,6,122,76,30);c.arcTo(122,76,6,76,30);c.arcTo(6,76,6,6,30);c.arcTo(6,6,122,6,30);c.closePath();c.fill();c.stroke();c.fillRect(39,64,24,10);
    c.fillStyle='#1fd16c';for(const x of [40,64,88]){c.beginPath();c.arc(x,41,8,0,Math.PI*2);c.fill();}
    const texture=new THREE.CanvasTexture(paper);texture.colorSpace=THREE.SRGBColorSpace;
    const bubbleMaterial=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});
    // 看不見的圓柱讓小人比較好點，手機上也點得到
    const hitMaterial=new THREE.MeshBasicMaterial({visible:false}),hitGeo=new THREE.CylinderGeometry(.22,.22,.7,8);
    const glass=color=>new THREE.MeshStandardMaterial({color,transparent:true,opacity:.6,roughness:.15});
    SINGSI.forEach((s,i)=>{
      const g=new THREE.Group();g.position.set(s.at[0],s.y||.13,s.at[1]);g.rotation.y=s.turn;g.scale.setScalar(1.65);g.userData.singsi=i;scene.add(g);singsiFigures.push(g);
      const body=chibi(g,{top:s.top,hair:[0x2b2422,0x4a3428,0x3a2c26][i%3],band:!!s.band});
      const hit=new THREE.Mesh(hitGeo,hitMaterial);hit.position.y=.35;g.add(hit);
      const bubble=new THREE.Sprite(bubbleMaterial);bubble.scale.set(.28,.22,1);bubble.position.set(.07,.58,0);g.add(bubble);singsiBubbles.push(bubble);
      const p=s.prop;
      if(p==='book'){/* 族語書：翻開捧在胸前 */const book=new THREE.Group();book.position.set(0,.165,.09);book.rotation.x=-.75;g.add(book);for(const k of [-1,1]){box(.085,.11,.012,k*.042,0,0,0xc0392b,book).rotation.y=-k*.28;box(.075,.1,.006,k*.04,0,.009,0xfbf6e6,book).rotation.y=-k*.28;}}
      if(p==='spear'){/* 魚槍和綁在身上的浮球 */beam(V(.1,.02,.05),V(.12,.66,.02),.009,0x3d4448,g);const tip=mesh(geometry.cone,0xc9ced1,g);tip.scale.set(.016,.06,.016);tip.position.set(.121,.69,.02);const ball=mesh(new THREE.SphereGeometry(.05,12,10),0xf08a24,g);ball.position.set(-.13,.08,.06);beam(V(-.1,.11,.04),V(-.06,.13,.01),.004,0xe2cf9f,g);}
      if(p==='tube'){/* 竹筒：在地上敲出節奏 */tapTube=new THREE.Group();tapTube.position.set(.1,.15,.05);g.add(tapTube);cylinder(.03,.3,0,0,0,0x9fbf55,tapTube);for(const y of [-.07,.06])cylinder(.033,.012,0,y,0,0x7e9c3e,tapTube);}
      if(p==='notebook'){/* 筆記本和燒杯 */const note=new THREE.Group();note.position.set(-.1,.15,.06);note.rotation.set(-.4,.3,0);g.add(note);box(.075,.095,.014,0,0,0,0x3b7dd8,note);box(.06,.08,.004,0,0,.009,0xfbf6e6,note);const beaker=mesh(new THREE.CylinderGeometry(.03,.03,.07,12),glass(0xd8f1f6),g);beaker.position.set(.105,.16,.06);cylinder(.026,.035,.105,.145,.06,0x55c27a,g);}
      if(p==='wave'){/* 揮手打招呼：舉起一隻手左右搖 */body.children.filter(o=>(o.geometry===chibiGeo.arm||o.geometry===chibiGeo.hand)&&o.position.x>0).forEach(o=>o.visible=false);waveArm=new THREE.Group();waveArm.position.set(.06,.19,0);waveArm.rotation.z=-.55;body.add(waveArm);const arm=new THREE.Mesh(chibiGeo.arm,smooth(s.top));arm.position.y=.04;arm.castShadow=true;waveArm.add(arm);const palm=new THREE.Mesh(chibiGeo.hand,smooth(0xe8c09a));palm.position.y=.09;waveArm.add(palm);}
      if(p==='easel'){/* 畫板：旁邊立著畫架，手上拿畫筆 */const easel=new THREE.Group();easel.position.set(.24,0,.06);easel.rotation.y=-.5;g.add(easel);for(const x of [-.07,.07])beam(V(x,0,.03),V(x*.4,.36,0),.008,0x8a6a48,easel);beam(V(0,0,-.08),V(0,.33,-.01),.008,0x8a6a48,easel);box(.2,.16,.012,0,.27,.02,0xfbf6e6,easel);box(.07,.06,.004,-.04,.29,.028,0xd6553f,easel);box(.06,.05,.004,.05,.25,.028,0x5cc1d8,easel);box(.05,.04,.004,0,.22,.028,0x7ad86f,easel);beam(V(.08,.12,.03),V(.12,.2,.07),.006,0x6e4b32,g);}
      if(p==='rattan'){/* 一捆黃藤 */for(const [r,t,c] of [[.055,.016,0xc9a35a],[.04,.012,0xb48c45]]){const coil=mesh(new THREE.TorusGeometry(r,t,6,16),c,g);coil.position.set(0,.13,.088);coil.rotation.x=1.2;}}
      if(p==='map'){/* 部落地圖：兩手攤開 */const sheet=new THREE.Group();sheet.position.set(0,.16,.09);sheet.rotation.x=-.55;g.add(sheet);box(.18,.12,.006,0,0,0,0xf3ead8,sheet);box(.07,.05,.003,-.04,.015,.004,0x7cc06d,sheet);box(.18,.025,.003,0,-.035,.004,0x5cb8d6,sheet);box(.03,.03,.003,.05,.02,.004,0xd6553f,sheet);}
      if(p==='leaf'){/* 月桃葉：舉在手上 */const leaf=mesh(geometry.leaf,0x4f9c55,g);leaf.scale.set(.028,.12,.055);leaf.position.set(.11,.25,.05);leaf.rotation.z=-.35;beam(V(.095,.13,.04),V(.105,.17,.045),.006,0x3f7d3f,g);}
      if(p==='lens'){/* 放大鏡：拿在胸前看 */const lens=new THREE.Group();lens.position.set(.1,.19,.08);lens.rotation.set(0,-.3,-.4);g.add(lens);mesh(new THREE.TorusGeometry(.036,.008,6,18),0x3d4448,lens);const disc=mesh(new THREE.CylinderGeometry(.034,.034,.004,16),glass(0xcdeef7),lens);disc.rotation.x=Math.PI/2;beam(V(0,-.04,0),V(0,-.09,0),.008,0x6e4b32,lens);}
      if(p==='basket'){/* 一籃野番茄 */const basket=mesh(new THREE.CylinderGeometry(.07,.055,.06,12),0xa0784a,g);basket.position.set(0,.11,.09);const berry=new THREE.SphereGeometry(.02,8,6);for(const [x,z] of [[-.03,.075],[.02,.085],[.035,.105],[-.01,.11],[0,.09]])mesh(berry,0xd6453a,g).position.set(x,.15,z);}
    });
    // 淑樺 singsi 的家屋工地在修煉場右前方（避開低空的雲和散步的路線）：木頭骨架先立好、屋頂一半鋪了茅草，地上堆著木頭和黃藤
    const site=new THREE.Group();site.position.set(6.95,.13,1.15);site.rotation.y=.61;scene.add(site);
    for(const x of [-.42,.42])for(const z of [-.3,.3])box(.06,.62,.06,x,.31,z,0x8a6a48,site);
    for(const z of [-.3,.3])box(.92,.05,.05,0,.6,z,0x8a6a48,site);for(const x of [-.42,.42])box(.05,.05,.66,x,.6,0,0x8a6a48,site);
    beam(V(-.5,.9,0),V(.5,.9,0),.022,0x8a6a48,site);for(const x of [-.42,0,.42])for(const k of [-1,1])beam(V(x,.9,0),V(x,.6,k*.36),.013,0x8a6a48,site);
    box(.98,.035,.5,0,.76,.19,0xd8c27a,site).rotation.x=.69;
    for(const [x,z,r] of [[-.15,.62,0],[.05,.66,.2],[-.05,.7,-.1]])cylinder(.035,.5,x,.05,z,0x8a6a48,site).rotation.set(0,r,Math.PI/2);
    const pile=mesh(new THREE.TorusGeometry(.07,.018,6,16),0xc9a35a,site);pile.position.set(.4,.03,.55);pile.rotation.x=Math.PI/2;
  }
  // 小人輕輕晃、泡泡上下飄；秋霞 singsi 揮手、Madal singsi 敲竹筒；正在說話的那一位轉向鏡頭、開心地跳
  function animateSingsi(elapsed){singsiBubbles.forEach((b,i)=>{b.position.y=.58+Math.sin(elapsed*2.2+i*1.3)*.022;});if(waveArm)waveArm.rotation.z=-.55+Math.sin(elapsed*7)*.35;if(tapTube)tapTube.position.y=.15+Math.abs(Math.sin(elapsed*3.2))*.035;
    singsiFigures.forEach((g,i)=>{const s=SINGSI[i],talk=i===talkingTo;g.position.y=(s.y||.13)+(talk?Math.abs(Math.sin(elapsed*4.5))*.045:0);g.rotation.y=talk?THREE.MathUtils.lerp(g.rotation.y,.61,.15):s.turn+Math.sin(elapsed*.55+i)*.08;});}
  function hoverSingsi(i){if(i===singsiHover)return;singsiHover=i;document.querySelectorAll('.singsi-pin').forEach((pin,k)=>pin.classList.toggle('is-hover',k===i));}
  let selected=-1;const focus=new THREE.Vector3(0,0,0),targetFocus=new THREE.Vector3(0,0,0),pan=new THREE.Vector3(),targetPan=new THREE.Vector3();
  const VIEW={yaw:.61,pitch:Math.atan2(17,24)},RADIUS=Math.hypot(17,24),ZOOM=[.8,2.6],PITCH=[.32,1.25];
  let yaw=VIEW.yaw,targetYaw=VIEW.yaw,pitch=VIEW.pitch,targetPitch=VIEW.pitch,zoom=1,targetZoom=1,width=1,height=1;
  // 選到地點時鏡頭靠過去；放得越大，越把那一站擺到畫面中間
  function aimFocus(){const at=selected>=0?positions[spots[selected]]:talkingTo>=0?SINGSI[talkingTo].at:null;if(!at){targetFocus.set(0,0,0);return;}const [x,z]=at,base=selected>=0&&Math.hypot(x,z)>7?.55:.1,pull=base+(1-base)*THREE.MathUtils.clamp((targetZoom-1)/.8,0,1);targetFocus.set(x*pull,0,z*pull);}
  window.addEventListener('salimpo:place',event=>{selected=event.detail;selectionRing.visible=selected>=0;if(selected>=0){selectionRing.scale.setScalar(spots[selected]===14?.72:spots[selected]===11?1.3:1);selectionRing.position.set(positions[spots[selected]][0],.135,positions[spots[selected]][1]);targetPan.set(0,0,0);}aimFocus();});
  window.addEventListener('salimpo:singsi',event=>{talkingTo=event.detail;if(talkingTo>=0){const s=SINGSI[talkingTo];selectionRing.scale.setScalar(.36);selectionRing.position.set(s.at[0],(s.y||.13)+.01,s.at[1]);selectionRing.visible=true;targetPan.set(0,0,0);}else if(selected<0)selectionRing.visible=false;aimFocus();});
  function project(){const aspect=width/height;/* 左右兩座小外島在任何寬度都要完整入鏡 */const half=width<600?13/aspect:Math.max(9.65,13/aspect);camera.left=-half*aspect/zoom;camera.right=half*aspect/zoom;camera.top=half/zoom;camera.bottom=-half/zoom;camera.updateProjectionMatrix();}
  /* 手機畫面小，海怪放大一點才看得到、點得到 */
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;renderer.setSize(width,height,false);project();monster.scale.setScalar(width<600?1.4:1.15);}
  new ResizeObserver(resize).observe(canvas);resize();
  // 站名平常收起來：滑過、拖曳、點選或縮放聚落時才浮現，停下來一會兒再淡出
  const labelRoot=document.getElementById('village-labels'),hint=document.getElementById('village-hint'),zoomIn=document.querySelector('[data-zoom=in]'),zoomOut=document.querySelector('[data-zoom=out]');
  let revealTimer=0,hintTimer=0,hovered=-1,hoverAt=null;const hintAt={};
  function reveal(){labelRoot.classList.add('is-revealed');clearTimeout(revealTimer);revealTimer=setTimeout(()=>labelRoot.classList.remove('is-revealed'),2200);}
  labelRoot.addEventListener('pointermove',reveal);labelRoot.addEventListener('focusin',reveal);
  function showHint(key,text,once){const now=performance.now();if(!hint||(key in hintAt&&(once||now-hintAt[key]<8000)))return;hintAt[key]=now;hint.textContent=text;hint.classList.add('is-on');clearTimeout(hintTimer);hintTimer=setTimeout(()=>hint.classList.remove('is-on'),3000);}
  function setHover(index){if(index===hovered)return;hovered=index;document.querySelectorAll('.place-pin').forEach((pin,i)=>pin.classList.toggle('is-hover',i===index));canvas.classList.toggle('is-pointing',index>=0);}
  function zoomTo(value){targetZoom=THREE.MathUtils.clamp(value,...ZOOM);aimFocus();reveal();if(zoomIn)zoomIn.disabled=targetZoom>=ZOOM[1]-.001;if(zoomOut)zoomOut.disabled=targetZoom<=ZOOM[0]+.001;}
  // 拖著地面平移：手指下的那一點跟著手指走；放大後才能走得比較遠
  function panFrom(start,dx,dy){const unit=(camera.right-camera.left)/width,limit=2.5+7.5*THREE.MathUtils.clamp((targetZoom-1)/1.6,0,1);targetPan.copy(start).addScaledVector(new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),-dx*unit).addScaledVector(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),-dy*unit/Math.sin(pitch));if(targetPan.length()>limit)targetPan.setLength(limit);}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function placeAt(x,y){const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);for(const hit of raycaster.intersectObjects(buildings,true)){let item=hit.object;while(item&&item.userData.placeIndex===undefined)item=item.parent;if(item)return item.userData.placeIndex;}return -1;}
  function raftAt(x,y){const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObject(raft,true).length>0;}
  function singsiAt(x,y){const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(singsiFigures,true)[0];if(!hit)return -1;const wall=raycaster.intersectObjects(buildings,true)[0];if(wall&&wall.distance<hit.distance-.05)return -1;let item=hit.object;while(item&&item.userData.singsi===undefined)item=item.parent;return item?item.userData.singsi:-1;}
  // 海怪在水面上（或正在冒出來）時才點得到；看得到的第一個東西要是海怪，被島或房子擋住就不算
  function monsterAt(x,y){if(!monster.visible||monsterState==='dive')return false;const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);if(!raycaster.intersectObject(beast,true).length)return false;
    return inBeast(raycaster.intersectObjects(scene.children,true).find(h=>h.object.isMesh&&!h.object.material.transparent&&shown(h.object))?.object);}
  function pick(x,y){if(monsterAt(x,y)){window.SALIMPO_VILLAGE?.monster();reveal();return;}const who=singsiAt(x,y);if(who>=0)window.SALIMPO_VILLAGE?.singsi(who);else{const index=placeAt(x,y);if(index>=0)window.SALIMPO_VILLAGE?.select(index);else if(raftAt(x,y))window.SALIMPO_VILLAGE?.raft();else seaAt(x,y);}reveal();}
  window.addEventListener('salimpo:raft',()=>showHint('raft','點一下海面，竹筏就會划過去',true));
  // 點海怪、牠頭上的名字或快速選單（village-ui.js）都走這裡：潛下去換個地方冒出來
  window.addEventListener('salimpo:monster',()=>{diveMonster();showHint('monster','海怪潛進海裡，換個地方冒出來',true);});
  // 點到海面：竹筏划過去。終點留在主島、兩座小外島和小帆船外面，最遠到半徑 14
  let raftGoal=null,raftClock=0,wakeAt=0;
  const raftObstacles=[[...positions[11],2.6],[...positions[12],2.65],[secondBoat.position.x,secondBoat.position.z,1.25]];
  const shown=o=>{for(;o;o=o.parent)if(!o.visible)return false;return true;};
  function seaAt(x,y){const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(scene.children,true).find(h=>h.object.isMesh&&!h.object.material.transparent&&shown(h.object));if(hit?.object!==water)return;
    // 取同一條視線在竹子高度的點，竹筏停下來時剛好在指尖下
    const ray=raycaster.ray,goal=ray.origin.clone().addScaledVector(ray.direction,(RAFT_Y+.07-ray.origin.y)/ray.direction.y);
    for(let k=0;k<4;k++){const r=Math.hypot(goal.x,goal.z),limit=THREE.MathUtils.clamp(r,9.2,14);goal.x*=limit/r;goal.z*=limit/r;for(const [ox,oz,clear] of raftObstacles){const dx=goal.x-ox,dz=goal.z-oz,d=Math.hypot(dx,dz)||1;if(d<clear+.3){goal.x=ox+dx/d*(clear+.3);goal.z=oz+dz/d*(clear+.3);}}}
    if(Math.hypot(goal.x,goal.z)<9.1||raftObstacles.some(([ox,oz,clear])=>Math.hypot(goal.x-ox,goal.z-oz)<clear+.2))return;
    raftGoal={x:goal.x,z:goal.z,a:Math.atan2(goal.z,goal.x),r:Math.hypot(goal.x,goal.z)};raftTarget.position.set(goal.x,-1.25,goal.z);
    showHint('mikadot','竹筏划過去囉（mikadot 操槳行船）');}
  // 繞著主島划：角度一點一點轉、半徑往終點靠；經過小外島或小帆船時往外繞
  function clearRadius(a){let need=9.1;for(const [ox,oz,clear] of raftObstacles){const d=Math.hypot(ox,oz),off=Math.atan2(Math.sin(a-Math.atan2(oz,ox)),Math.cos(a-Math.atan2(oz,ox))),side=d*Math.sin(off);if(Math.cos(off)>0&&Math.abs(side)<clear)need=Math.max(need,d*Math.cos(off)+Math.sqrt(clear*clear-side*side));}return need;}
  function moveRaft(dt){const x=raft.position.x,z=raft.position.z,left=Math.hypot(raftGoal.x-x,raftGoal.z-z);if(left<.04){raftGoal=null;return;}
    const step=Math.min(left,(.5+Math.min(left,1.6))*1.3*dt),r0=Math.hypot(x,z),a0=Math.atan2(z,x),turn=Math.atan2(Math.sin(raftGoal.a-a0),Math.cos(raftGoal.a-a0));let nx,nz;
    if(left<1.2||Math.abs(turn)*r0<step){nx=x+(raftGoal.x-x)/left*step;nz=z+(raftGoal.z-z)/left*step;}
    else{const da=Math.sign(turn)*Math.min(Math.abs(turn),step/r0),a=a0+da,r=Math.max(r0+(raftGoal.r-r0)*da/turn,clearRadius(a));nx=Math.cos(a)*r;nz=Math.sin(a)*r;const mx=nx-x,mz=nz-z,m=Math.hypot(mx,mz);if(m>step){nx=x+mx/m*step;nz=z+mz/m*step;}}
    if(Math.hypot(nx-x,nz-z)>1e-4){const heading=Math.atan2(z-nz,nx-x);raft.rotation.y+=Math.atan2(Math.sin(heading-raft.rotation.y),Math.cos(heading-raft.rotation.y))*Math.min(1,dt*5);}
    raft.position.x=nx;raft.position.z=nz;}
  function wakeStep(elapsed,moving){if(moving&&elapsed-wakeAt>.3){wakeAt=elapsed;const wake=wakes.reduce((a,b)=>a.born<b.born?a:b),bow=raft.rotation.y;wake.ring.position.set(raft.position.x-Math.cos(bow)*.95,-1.26,raft.position.z+Math.sin(bow)*.95);wake.born=elapsed;}
    wakes.forEach(wake=>{const k=Math.min(1,(elapsed-wake.born)/1.6);wake.ring.material.opacity=.5*(1-k);wake.ring.scale.setScalar(1+k*1.8);});}
  const dragging=on=>canvas.classList.toggle('is-dragging',on);
  // 滑鼠：左鍵拖曳轉動與俯仰，右鍵或 Shift 拖曳平移，Ctrl／⌘＋滾輪（含觸控板雙指）縮放
  let down=null;
  canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')return;down={x:event.clientX,y:event.clientY,yaw:targetYaw,pitch:targetPitch,pan:targetPan.clone(),mode:event.button===2||event.shiftKey?'pan':'turn',moved:false};canvas.setPointerCapture(event.pointerId);reveal();});
  canvas.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;reveal();if(!down){hoverAt=[event.clientX,event.clientY];return;}const dx=event.clientX-down.x,dy=event.clientY-down.y;if(!down.moved&&Math.hypot(dx,dy)<5)return;down.moved=true;dragging(true);setHover(-1);if(down.mode==='pan')panFrom(down.pan,dx,dy);else{targetYaw=down.yaw-dx*.006;targetPitch=THREE.MathUtils.clamp(down.pitch+dy*.005,...PITCH);}});
  canvas.addEventListener('pointerup',event=>{if(event.pointerType==='touch')return;if(down&&!down.moved&&event.button===0)pick(event.clientX,event.clientY);down=null;dragging(false);});
  function resetPointer(){down=null;dragging(false);}
  canvas.addEventListener('pointercancel',resetPointer);canvas.addEventListener('lostpointercapture',resetPointer);
  canvas.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')showHint('intro','拖曳可以轉動聚落，按住 Ctrl 或 ⌘ 再滾動可以放大',true);});
  canvas.addEventListener('pointerleave',()=>{hoverAt=null;setHover(-1);hoverSingsi(-1);});
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
  canvas.addEventListener('wheel',event=>{if(!event.ctrlKey&&!event.metaKey){showHint('wheel','想放大聚落？按住 Ctrl 或 ⌘ 再滾動，或按＋');return;}event.preventDefault();zoomTo(targetZoom*(Math.abs(event.deltaY)>=40?(event.deltaY<0?1.15:1/1.15):Math.exp(-event.deltaY*.01)));},{passive:false});
  // 觸控：單指左右滑動轉動（上下滑照常捲動頁面），雙指張合縮放、一起移動平移
  let touch=null,gestureZoom=1;const fingers=event=>[...event.touches].filter(t=>t.touchType!=='stylus');
  canvas.addEventListener('touchstart',event=>{const list=fingers(event);reveal();showHint('intro','左右滑動可以轉動聚落，兩指張開可以放大',true);if(list.length>=2){const [a,b]=list;touch={mode:'pinch',dist:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,zoom:targetZoom,mx:(a.clientX+b.clientX)/2,my:(a.clientY+b.clientY)/2,pan:targetPan.clone()};dragging(true);}else if(list.length===1)touch={mode:'wait',x:list[0].clientX,y:list[0].clientY,yaw:targetYaw,time:performance.now(),tap:true};},{passive:true});
  canvas.addEventListener('touchmove',event=>{if(!touch)return;const list=fingers(event);reveal();if(touch.mode==='pinch'){if(list.length<2)return;event.preventDefault();const [a,b]=list;zoomTo(touch.zoom*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/touch.dist);panFrom(touch.pan,(a.clientX+b.clientX)/2-touch.mx,(a.clientY+b.clientY)/2-touch.my);return;}const t=list[0];if(!t)return;const dx=t.clientX-touch.x,dy=t.clientY-touch.y;if(touch.mode==='wait'){if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){touch.mode='turn';dragging(true);}else if(Math.abs(dy)>8)touch.mode='scroll';}if(touch.mode==='turn'){event.preventDefault();targetYaw=touch.yaw-dx*.008;}},{passive:false});
  function endTouch(event){if(!touch)return;const list=fingers(event);if(event.type==='touchend'&&touch.mode==='wait'&&touch.tap&&!list.length&&performance.now()-touch.time<700){const t=event.changedTouches[0];pick(t.clientX,t.clientY);event.preventDefault();}if(list.length===1&&touch.mode==='pinch')touch={mode:'wait',x:list[0].clientX,y:list[0].clientY,yaw:targetYaw,time:0,tap:false};else if(!list.length){touch=null;dragging(false);}}
  canvas.addEventListener('touchend',endTouch);canvas.addEventListener('touchcancel',endTouch);
  // Safari 的觸控板雙指縮放走 gesture 事件；iPad 上雙指已由 touch 處理，這裡跳過
  canvas.addEventListener('gesturestart',event=>{event.preventDefault();gestureZoom=targetZoom;});
  canvas.addEventListener('gesturechange',event=>{event.preventDefault();if(touch?.mode!=='pinch')zoomTo(gestureZoom*event.scale);});
  document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{const kind=button.dataset.zoom;if(kind==='in')zoomTo(targetZoom*1.25);else if(kind==='out')zoomTo(targetZoom/1.25);else{targetYaw=VIEW.yaw+Math.round((targetYaw-VIEW.yaw)/(Math.PI*2))*Math.PI*2;targetPitch=VIEW.pitch;targetPan.set(0,0,0);zoomTo(1);}}));
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();world.classList.remove('scene-ready');window.failVillage?.();});
  let visible=true;new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;}).observe(world);
  const point=new THREE.Vector3();
  // 站名放得下就整個顯示（最多往下挪一格）；還是擠的話先縮成小圓點（選到的那一站優先、竹筏最後），放大聚落或滑過時名稱再出現
  let pinWidths=null,singsiSizes=[];document.fonts?.ready.then(()=>{pinWidths=null;});
  function labels(){
    const pins=[...document.querySelectorAll('.place-pin')],talkers=[...document.querySelectorAll('.singsi-pin')];const mobile=width<600;const guard=document.querySelector('.world-whispers');const minY=guard?guard.offsetTop+guard.offsetHeight+(mobile?22:26):(mobile?230:239);
    if(!pinWidths||pinWidths.key!==width||pinWidths.length!==pins.length||singsiSizes.length!==talkers.length){pins.forEach(pin=>pin.classList.remove('is-dot'));pinWidths=pins.map(pin=>pin.offsetWidth);pinWidths.key=width;singsiSizes=talkers.map(pin=>[pin.offsetWidth,pin.offsetHeight]);}
    const screen=(x,y,z)=>{point.set(x,y,z).project(camera);return {x:(point.x*.5+.5)*width,y:Math.max(minY,(-point.y*.5+.5)*height+(mobile?28:0))};};
    const rank=entry=>pins[entry.i]?.getAttribute('aria-pressed')==='true'?2:pins[entry.i]?.matches('.raft-pin,.monster-pin')?0:1;
    /* 小外島的標籤浮高一點，不要蓋住島；竹筏和海怪的名字跟著它們在海上走，海怪潛在水裡時收起來、不占位置 */
    const seaPin=name=>pins.findIndex(pin=>pin.classList.contains(name)),under=monsterState!=='up',size=monster.scale.x,back=-.05*size,horns=screen(monster.position.x+Math.sin(yaw)*back,WATER_Y+1.42*size,monster.position.z+Math.cos(yaw)*back);/* 海怪的名字貼在頭頂上方，比角上的小叉再高一點 */
    const entries=[...spots.map((spot,i)=>{const [x,z]=positions[spot];return {i,...screen(x,Math.hypot(x,z)>7?3:1.4,z)};}),{i:seaPin('raft-pin'),...screen(raft.position.x,.9,raft.position.z)},{i:seaPin('monster-pin'),under,...horns,y:Math.max(minY,horns.y-(mobile?19:23))}].sort((a,b)=>rank(b)-rank(a)||a.y-b.y);
    const placed=[],fullH=mobile?26:32,dot=mobile?16:18,free=(x,y,w,h)=>!placed.some(o=>Math.abs(o.x-x)<(o.w+w)/2+3&&Math.abs(o.y-y)<(o.h+h)/2+3);
    /* singsi 的名字標籤跟著頭頂；正在說話的那位先占位，旁邊的站名讓開 */
    talkers.forEach((pin,i)=>{const s=SINGSI[i];if(!s)return;const at=screen(s.at[0],(s.y||.13)+1.1,s.at[1]);pin.style.left=at.x+'px';pin.style.top=at.y+'px';if(i===talkingTo&&singsiSizes[i]){const [w,h]=singsiSizes[i];placed.push({x:at.x,y:at.y-h/2,w,h});}});
    entries.forEach(entry=>{const pin=pins[entry.i];if(!pin)return;if('under' in entry){pin.classList.toggle('is-under',entry.under);if(entry.under){pin.style.left=entry.x+'px';pin.style.top=entry.y+'px';return;}}let w=pinWidths[entry.i],h=fullH,y=entry.y,x=THREE.MathUtils.clamp(entry.x,w/2+8,width-w/2-8);
      if(rank(entry)<2&&!free(x,y,w,h)){if(free(x,y+h+4,w,h))y+=h+4;else{w=h=dot;x=THREE.MathUtils.clamp(entry.x,w/2+8,width-w/2-8);for(let k=0;k<6&&!free(x,y,w,h);k++)y+=h+4;}}
      pin.classList.toggle('is-dot',w===dot);placed.push({x,y,w,h});pin.style.left=x+'px';pin.style.top=y+'px';});
  }

  let start=performance.now(),last=0;
  function frame(now){requestAnimationFrame(frame);if(document.hidden||!visible||now-last<1000/30)return;last=now;const elapsed=(now-start)/1000;
    yaw=THREE.MathUtils.lerp(yaw,targetYaw,.12);pitch=THREE.MathUtils.lerp(pitch,targetPitch,.12);if(Math.abs(zoom-targetZoom)>.0005){zoom=THREE.MathUtils.lerp(zoom,targetZoom,.18);project();}focus.lerp(targetFocus,.12);pan.lerp(targetPan,.18);
    const lookX=focus.x+pan.x,lookZ=focus.z+pan.z,flat=Math.cos(pitch)*RADIUS;camera.position.set(lookX+Math.sin(yaw)*flat,Math.sin(pitch)*RADIUS,lookZ+Math.cos(yaw)*flat);camera.lookAt(lookX,.05,lookZ);
    if(hoverAt&&!down){const beastHere=monsterAt(...hoverAt),who=beastHere?-1:singsiAt(...hoverAt);hoverSingsi(who);const index=beastHere||who>=0?-1:placeAt(...hoverAt);setHover(index);canvas.classList.toggle('is-pointing',beastHere||who>=0||index>=0||raftAt(...hoverAt));hoverAt=null;}
    const moving=!!raftGoal;if(moving)moveRaft(Math.min(.1,(now-raftClock)/1000));raftClock=now;raftTarget.material.opacity=moving?(reduced?.7:.45+Math.sin(elapsed*5)*.25):Math.max(0,raftTarget.material.opacity-.06);
    /* 海怪一直面向鏡頭；竹筏划到旁邊時，海怪也潛下去換地方 */
    monster.rotation.y=yaw;if(moving&&monsterState==='up'&&Math.hypot(raft.position.x-monster.position.x,raft.position.z-monster.position.z)<1.46*monster.scale.x)diveMonster();
    /* 第一個畫面：一開始的位置看不到（被卡片或標題蓋住）就換到看得到的地方 */
    if(!monsterChecked){monsterChecked=true;if(spotView(monsterSpot)<2)placeMonster(nextMonsterSpot());}
    if(!reduced){clouds.forEach((c,i)=>{c.group.position.x=c.x+Math.sin(elapsed*.12+i)*.35;c.group.position.y=c.y+Math.sin(elapsed*.18+i)*.06;});raft.position.y=RAFT_Y+Math.sin(elapsed*1.4)*.03;raft.rotation.z=Math.sin(elapsed*.9)*.03;paddle.rotation.z=raftGoal?Math.sin(elapsed*6)*.6:Math.sin(elapsed*1.6)*.35;secondBoat.position.y=-.92+Math.sin(elapsed*1.1+1)*.04;secondBoat.rotation.z=Math.sin(elapsed*.75+1)*.025;people.forEach(p=>{const a=p.phase+elapsed*p.speed;p.group.position.set(Math.cos(a)*5.85,.13,Math.sin(a)*5.85);p.group.rotation.y=-a;});birds.forEach((bird,i)=>{const a=elapsed*.13+i*1.6;bird.position.set(Math.cos(a)*9,3.6+Math.sin(a*.4+i)*.6,Math.sin(a)*7);bird.rotation.y=-a;});ripples.forEach((ring,i)=>{const pulse=1+Math.sin(elapsed*.5+i)*.007;ring.scale.set(pulse,pulse,1);});animateSongIsland(elapsed);animateSongTree(elapsed);animateCourse(elapsed);wakeStep(elapsed,moving);animateSingsi(elapsed);animateMonster(now/1000);}
    labels();renderer.render(scene,camera);
  }
  frame(performance.now());requestAnimationFrame(()=>requestAnimationFrame(()=>{/* 超過 15 秒才載好時，從備用清單切回 3D 版面 */world.classList.remove('scene-unavailable');world.classList.add('scene-ready');document.getElementById('scene-loading').hidden=true;document.getElementById('scene-fallback').hidden=true;}));
}
