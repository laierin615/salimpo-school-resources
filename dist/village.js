import * as THREE from './vendor/three.module.js';

const canvas=document.getElementById('village-canvas');
const world=document.getElementById('village-world');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const positions=[[-4,-2.1],[-.6,-3.5],[3.1,-2.7],[4.7,.8],[2.5,3.8],[-1.1,4.7],[-4.5,1.4],[-1.8,.1],[1.8,.4],[4.4,-1.6],[-4.8,-.7],[8.3,-5.3],[-8.3,5.3]];
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
  for(let i=0;i<positions.length-2;i++)path(positions[i],[.4,1.5],15);
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
  for(let i=0;i<55;i++){const a=random()*Math.PI*2;const r=4.4+random()*2.85;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(positions.some(([px,pz])=>Math.hypot(x-px,z-pz)<1.35)||Math.abs(x)<2.8&&z<-3.6||Math.hypot(x+3.1,z-5.45)<1.45||Math.hypot(x+.35,z-6.35)<.9)continue;tree(x,z,.75+random()*.5,i%3===0?1:0);}
  for(let i=0;i<12;i++)tree(-6.2+(i%3)*.4,-4.5+Math.floor(i/3)*.65,.65+random()*.3,1);
  const grassGeo=new THREE.ConeGeometry(.035,.14,3);const grass=new THREE.InstancedMesh(grassGeo,material(0x548a49),250);for(let i=0;i<250;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*7.2;transform.position.set(Math.cos(a)*r,.15,Math.sin(a)*r);transform.rotation.set(0,random()*6.28,random()*.2);transform.scale.setScalar(.75+random()*.7);transform.updateMatrix();grass.setMatrixAt(i,transform.matrix);}scene.add(grass);

  const buildings=[],lights=[];
  function building(i,color,roofColor,w=1.35,d=1.15,h=.95){const group=new THREE.Group();group.position.set(positions[i][0],.14,positions[i][1]);group.userData.placeIndex=i;scene.add(group);box(w+.17,.14,d+.17,0,.07,0,0xd8cbb1,group);box(w,h,d,0,h/2+.14,0,color,group);roof(w+.24,d+.22,.55,h+.14,roofColor,group);box(.32,.6,.04,0,.44,d/2+.025,0x6c5640,group);for(const x of [-w*.29,w*.29]){box(.24,.27,.045,x,.72,d/2+.03,0xb0e3e0,group);box(.018,.27,.055,x,.72,d/2+.057,0xf8f1d9,group);}const windowLight=new THREE.PointLight(0xffc86d,0,2.5);windowLight.position.set(0,.6,d/2+.17);group.add(windowLight);lights.push(windowLight);buildings.push(group);return group;}
  const school=building(0,0xf0eadb,0x377b8e,1.65,1.3,1.04);box(1.35,.09,.5,0,.18,.96,0xb99866,school);box(.8,.15,.04,0,1.18,.72,0x31886b,school);for(let i=0;i<3;i++){const pole=beam(new THREE.Vector3(.9,.1,.8),new THREE.Vector3(.9,1.8,.8),.025,0xe8ede3,school);if(i===0)box(.31,.2,.02,1.05,1.6,.8,0x50b875,school);}
  const course=building(1,0xbf9271,0x9e634b,1.25,1.25,.9);box(1.6,.13,.52,0,.17,.91,0xc69c70,course);for(const x of [-.62,.62])beam(new THREE.Vector3(x,.2,.77),new THREE.Vector3(x,1.28,.77),.035,0x735536,course);
  const library=building(2,0xf0dec1,0x599579,1.5,1.25,1.15);for(let i=0;i<4;i++)box(.13,.4,.09,-.5+i*.16,.45,.76,[0xd88467,0x5c9aba,0xc9b66c,0x81a76f][i],library);box(1.35,.08,.24,0,.22,.78,0x8b694b,library);
  const workshop=building(3,0xc6a080,0xc77656,1.2,1.1,.85);const workbench=box(.7,.11,.36,.8,.43,.65,0x9b7952,workshop);for(const x of [.5,1.1])box(.05,.4,.29,x,.24,.65,0x71523d,workshop);rock(.14,.75,.65,.65,0xe1bd79,workshop);
  const farm=building(4,0xddbe88,0x829468,.85,.85,.65);for(let row=0;row<3;row++){box(1.5,.09,.24,-.55,.12,.95+row*.38,0x806647,farm);for(let j=0;j<5;j++){const x=-1.1+j*.29;const stem=cylinder(.018,.22,x,.26,.95+row*.38,0x4e8b45,farm,5);const leaf=mesh(geometry.leaf,0x4f9c55,farm);leaf.scale.set(.11,.12,.11);leaf.position.set(x,.38,.95+row*.38);if(row===1)rock(.045,x+.055,.36,1.34,0xd6654c,farm);}}
  for(let j=0;j<5;j++){box(.045,.3,.045,-1.35+j*.62,.29,2.03,0xccb68b,farm);}box(2.5,.045,.045,-.12,.37,2.03,0xccb68b,farm);
  const ocean=building(5,0xe4e8dc,0x638fa3,.86,.86,.72);for(let j=0;j<8;j++)box(1.1,.055,.19,0,.11,1+j*.2,0xb9956e,ocean);for(const x of [-.5,.5])for(let j=0;j<3;j++)cylinder(.055,.75,x,-.15,1.05+j*.6,0x8b7257,ocean);
  const stage=new THREE.Group();stage.position.set(...[positions[6][0],.14,positions[6][1]]);stage.userData.placeIndex=6;scene.add(stage);buildings.push(stage);cylinder(1,.22,0,.11,0,0xe8d6ad,stage,24);for(const x of [-.74,.74])for(const z of [-.55,.55])box(.055,1.15,.055,x,.79,z,0xc8bda2,stage);roof(1.85,1.45,.45,1.38,0xc59b68,stage);box(.45,.44,.26,-.48,.46,-.3,0x8c7152,stage);box(.45,.44,.26,.48,.46,-.3,0x8c7152,stage);
  const archive=building(7,0xe8e4d9,0x5b7f95,1.7,1.35,1.1);for(const x of [-.7,-.35,.35,.7])box(.09,1.02,.09,x,.69,.8,0xe7e8dd,archive);box(1.95,.1,.6,0,.19,.86,0xc8c9b4,archive);box(.75,.1,.04,0,1.19,.79,0x50a578,archive);
  const kiosk=building(8,0xddcca3,0x58a8a0,.95,.9,.65);box(.55,.42,.06,0,.81,.54,0x37758c,kiosk);box(.055,.2,.04,0,.8,.58,0xf8f1d9,kiosk);box(.055,.04,.04,0,.97,.58,0xf8f1d9,kiosk);
  const history=building(9,0xe8cda3,0x82785b,1.3,1.18,.94);for(const x of [-.54,.54])beam(new THREE.Vector3(x,.15,.75),new THREE.Vector3(x,1.3,.75),.035,0x806348,history);box(.82,.19,.045,0,1.18,.67,0x578875,history);for(let i=0;i<4;i++)box(.13,.31,.09,-.26+i*.15,.48,.72,[0xaf7d61,0x5b8290,0xb5a063,0x638367][i],history);
  const visitHouse=building(10,0xe6dfc5,0x419080,1.25,1.1,.93);box(.72,.18,.04,0,1.14,.63,0xc3a35f,visitHouse);box(1.4,.1,.38,0,.18,.8,0xc1ae83,visitHouse);
  // 外島不要像圓柱那樣整齊：岩壁、沙灘、草地共用一條起伏的海岸線，岩壁往下收窄、凹凸不一
  function coast(p,q,r){return a=>1+.14*Math.sin(2*a+p)+.08*Math.sin(3*a+q)+.05*Math.sin(5*a+r);}
  function islet(edge,radius,height,y,color,parent,bottom=1){
    const g=new THREE.CylinderGeometry(1,bottom,1,22,2),v=g.attributes.position;
    for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),z=v.getZ(i);if(!x&&!z)continue;const a=Math.atan2(z,x),k=edge(a)*(bottom<1?1+(y<0?.12*Math.sin(7*a+1.3):y<.5?.06*Math.sin(5*a+.4):0):1);v.setX(i,x*k);v.setZ(i,z*k);}
    g.computeVertexNormals();const o=mesh(g,color,parent);o.scale.set(radius,height,radius);o.position.y=y;return o;}
  // A separate island across a real water gap links to the language training site.
  const [islandX,islandZ]=positions[11];
  const outerIsland=new THREE.Group();outerIsland.position.set(islandX,0,islandZ);outerIsland.userData.placeIndex=11;scene.add(outerIsland);buildings.push(outerIsland);
  const langCoast=coast(0,1.6,1.6);
  islet(langCoast,1.32,1.08,-.69,0xa8a082,outerIsland,.88);
  islet(langCoast,1.47,.18,-.07,0xe9dcb2,outerIsland);
  islet(a=>langCoast(a)*(1+.1*Math.sin(3*a+2.3)+.05*Math.sin(4*a+5)),1.19,.1,.06,0x96bd7a,outerIsland);
  const languageHouse=building(11,0xeaddbd,0x38928d,.94,.9,.78);
  box(.54,.18,.05,0,1.03,.57,0xe3b650,languageHouse);
  for(const x of [-.42,.42])box(.055,.9,.055,x,.65,.67,0x8b6c4b,languageHouse);
  box(1.12,.1,.32,0,.18,.75,0xc5ab7c,languageHouse);
  const littleTree=tree(islandX-.7,islandZ-.4,.62,1);littleTree.userData.placeIndex=11;buildings.push(littleTree);
  for(const [a,size] of [[.35,.12],[1.2,.09],[1.75,.13],[2.6,.1],[3.4,.14],[4.15,.08],[4.85,.12],[5.65,.1]]){const r=1.39*langCoast(a);rock(size,islandX+Math.cos(a)*r,-.17,islandZ+Math.sin(a)*r,0x9baca0);}
  const wakeRing=new THREE.RingGeometry(1.6,1.64,48),wakeEdge=wakeRing.attributes.position;for(let i=0;i<wakeEdge.count;i++){const k=langCoast(Math.atan2(-wakeEdge.getY(i),wakeEdge.getX(i)));wakeEdge.setXY(i,wakeEdge.getX(i)*k,wakeEdge.getY(i)*k);}
  const islandWake=mesh(wakeRing,new THREE.MeshBasicMaterial({color:0xe5fffb,transparent:true,opacity:.46,side:THREE.DoubleSide}));islandWake.rotation.x=-Math.PI/2;islandWake.position.set(islandX,-1.24,islandZ);islandWake.castShadow=false;

  // 女人島：靈感來自阿美族女人島的口傳故事。女人們圍成一圈唱歌，鯨魚在外海來回游，連到 Sa'opo 歌謠採譜網站。
  const [songX,songZ]=positions[12];
  const songIsland=new THREE.Group();songIsland.position.set(songX,0,songZ);songIsland.userData.placeIndex=12;scene.add(songIsland);buildings.push(songIsland);
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
    const skirt=mesh(geometry.cone,0x2f2d36,woman);skirt.scale.set(.075,.17,.075);skirt.position.y=.085;skirt.rotation.x=Math.PI;
    cylinder(.077,.025,0,.045,0,0xd2453a,woman,7);
    cylinder(.05,.12,0,.22,0,0xd2453a,woman,6);
    const head=mesh(geometry.leaf,0xdcb391,woman);head.scale.set(.05,.058,.05);head.position.y=.33;
    const hair=mesh(geometry.leaf,0x2b2422,woman);hair.scale.set(.052,.04,.052);hair.position.set(0,.36,-.008);
    cylinder(.056,.018,0,.355,0,0xf3ead8,woman,8);
    const pom=mesh(geometry.leaf,[0xffd166,0x7ad86f,0x5cc1d8][i%3],woman);pom.scale.setScalar(.022);pom.position.set(0,.375,.05);
    dancers.push(woman);}
  const hands=mesh(new THREE.TorusGeometry(.46,.011,5,36),0xf3ead8,dance);hands.rotation.x=Math.PI/2;hands.position.y=.24;
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
  const whale=new THREE.Group();scene.add(whale);whale.userData.placeIndex=12;buildings.push(whale);
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
  const people=[];for(let i=0;i<6;i++){const person=new THREE.Group();scene.add(person);cylinder(.065,.17,0,.23,0,[0x659ac5,0xcc8c5e,0x6a9b78,0xe4c272,0xb88495,0x77afa6][i],person,6);const head=mesh(geometry.leaf,0xdcb391,person);head.scale.set(.065,.075,.065);head.position.y=.36;for(const x of [-.033,.033])box(.035,.12,.04,x,.085,0,0x47565b,person);people.push({group:person,phase:i*Math.PI/3,speed:.035+i*.005});}

  const clouds=[];for(let i=0;i<6;i++){const cloud=new THREE.Group();scene.add(cloud);const x=(i-2.5)*4,z=-5+(i%3)*5,y=4.3+(i%2)*.65;cloud.position.set(x,y,z);for(let j=0;j<4;j++){const puff=mesh(geometry.rock,0xf4f5eb,cloud);puff.position.set((j-1.5)*.47,Math.sin(j)*.16,0);puff.scale.set(.58,.42,.45);puff.castShadow=false;}clouds.push({group:cloud,x,y});}
  const nightMoon=mesh(new THREE.SphereGeometry(.48,12,8),new THREE.MeshBasicMaterial({color:0xffefd0}));nightMoon.position.set(-8,7,-6);nightMoon.castShadow=false;nightMoon.visible=false;
  const starVertices=[];for(let i=0;i<65;i++)starVertices.push((random()-.5)*36,5+random()*7,-12+random()*13);const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starVertices,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xe5edff,size:.065,transparent:true,opacity:.85}));scene.add(stars);

  const boat=new THREE.Group();boat.position.set(7,-.93,4.2);scene.add(boat);const hull=mesh(new THREE.CylinderGeometry(.3,.17,1.1,5),0xbf7850,boat);hull.rotation.z=Math.PI/2;box(.55,.05,.25,0,.04,0,0xd9ba85,boat);beam(new THREE.Vector3(0,.06,0),new THREE.Vector3(0,1.08,0),.018,0x8d7751,boat);const sailGeo=new THREE.BufferGeometry();sailGeo.setAttribute('position',new THREE.Float32BufferAttribute([.03,.2,0,.03,1.04,0,.54,.2,0],3));sailGeo.computeVertexNormals();mesh(sailGeo,new THREE.MeshStandardMaterial({color:0xf0e8d2,roughness:1,side:THREE.DoubleSide}),boat);
  const secondBoat=boat.clone();secondBoat.scale.setScalar(.62);secondBoat.position.set(-5.8,-.92,7.15);secondBoat.rotation.y=-.65;scene.add(secondBoat);
  const birdsGeo=new THREE.BufferGeometry();birdsGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.15,0,0,0,.05,0,0,.05,0,.15,0,0],3));const birdMaterial=new THREE.LineBasicMaterial({color:0x678b8e});const birds=[];for(let i=0;i<4;i++){const bird=new THREE.LineSegments(birdsGeo,birdMaterial);scene.add(bird);birds.push(bird);}

  let night=false;function setTheme(theme){night=theme==='night';hemi.intensity=night?.7:2.3;hemi.color.set(night?0x9bb7eb:0xeafaff);sun.intensity=night?.5:3.2;sun.color.set(night?0xb0c4ed:0xfff1d2);fill.intensity=night?.25:.65;renderer.toneMappingExposure=night?.88:1.18;seaMaterial.color.set(night?0x173f59:0x73bfc0);stars.visible=night;nightMoon.visible=night;clouds.forEach(c=>c.group.visible=!night);lights.forEach(light=>light.intensity=night?2.2:0);scene.fog=new THREE.Fog(night?0x102d45:0xb5ddd9,35,110);}
  setTheme(document.documentElement.dataset.theme);window.addEventListener('salimpo:theme',event=>setTheme(event.detail));
  let selected=-1;const focus=new THREE.Vector3(0,0,0),targetFocus=new THREE.Vector3(0,0,0);
  window.addEventListener('salimpo:place',event=>{selected=event.detail;selectionRing.visible=selected>=0;if(selected>=0){selectionRing.position.set(positions[selected][0],.135,positions[selected][1]);/* 選到小外島時鏡頭靠過去 */const pull=Math.hypot(...positions[selected])>7?.55:.1;targetFocus.set(positions[selected][0]*pull,0,positions[selected][1]*pull);}else targetFocus.set(0,0,0);});
  let yaw=.61,targetYaw=.61,zoom=1,width=1,height=1;
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;renderer.setSize(width,height,false);const aspect=width/height;/* 左右兩座小外島在任何寬度都要完整入鏡 */const half=width<600?13/aspect:Math.max(9.65,13/aspect);camera.left=-half*aspect/zoom;camera.right=half*aspect/zoom;camera.top=half/zoom;camera.bottom=-half/zoom;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvas);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null,dragging=false;
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,yaw:targetYaw,id:event.pointerId};dragging=false;if(event.pointerType==='mouse')canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!down)return;const dx=event.clientX-down.x,dy=event.clientY-down.y;if(Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)){dragging=true;targetYaw=down.yaw-dx*.006;canvas.classList.add('is-dragging');}});
  canvas.addEventListener('pointerup',event=>{if(down&&!dragging){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);for(const hit of raycaster.intersectObjects(buildings,true)){let item=hit.object;while(item&&item.userData.placeIndex===undefined)item=item.parent;if(item&&item.userData.placeIndex!==undefined){window.SALIMPO_VILLAGE?.select(item.userData.placeIndex);break;}}}down=null;dragging=false;canvas.classList.remove('is-dragging');});
  function resetPointer(){down=null;dragging=false;canvas.classList.remove('is-dragging');}
  canvas.addEventListener('pointercancel',resetPointer);canvas.addEventListener('lostpointercapture',resetPointer);
  canvas.addEventListener('wheel',event=>{if(!event.ctrlKey)return;event.preventDefault();zoom=THREE.MathUtils.clamp(zoom-event.deltaY*.002,.8,1.3);resize();},{passive:false});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();world.classList.remove('scene-ready');window.failVillage?.();});
  let visible=true;new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;}).observe(world);
  const point=new THREE.Vector3();
  function labels(){
    const pins=[...document.querySelectorAll('.place-pin')];const mobile=width<600;const entries=positions.map(([x,z],i)=>{/* 小外島的標籤浮高一點，不要蓋住島 */point.set(x,Math.hypot(x,z)>7?3:1.4,z).project(camera);return {i,x:(point.x*.5+.5)*width,y:(-point.y*.5+.5)*height+(mobile?28:0),w:mobile?(selected===i?130:30):pins[i]?.offsetWidth||130};}).sort((a,b)=>a.y-b.y);
    const placed=[];const guard=document.querySelector('.world-whispers');const minY=guard?guard.offsetTop+guard.offsetHeight+(mobile?22:26):(mobile?230:239);
    entries.forEach(entry=>{entry.x=THREE.MathUtils.clamp(entry.x,entry.w/2+8,width-entry.w/2-8);entry.y=Math.max(minY,entry.y);for(let attempts=0;attempts<8;attempts++){if(!placed.some(other=>Math.abs(other.x-entry.x)<(other.w+entry.w)/2+3&&Math.abs(other.y-entry.y)<(mobile?32:38)))break;entry.y+=mobile?33:38;}placed.push(entry);const pin=pins[entry.i];if(pin){pin.style.left=entry.x+'px';pin.style.top=entry.y+'px';}});
  }
  let start=performance.now(),last=0;
  function frame(now){requestAnimationFrame(frame);if(document.hidden||!visible||now-last<1000/30)return;last=now;const elapsed=(now-start)/1000;
    yaw=THREE.MathUtils.lerp(yaw,targetYaw,.12);focus.lerp(targetFocus,.12);camera.position.set(focus.x+Math.sin(yaw)*24,17,focus.z+Math.cos(yaw)*24);camera.lookAt(focus.x,.05,focus.z);
    if(!reduced){clouds.forEach((c,i)=>{c.group.position.x=c.x+Math.sin(elapsed*.12+i)*.35;c.group.position.y=c.y+Math.sin(elapsed*.18+i)*.06;});boat.position.y=-.95+Math.sin(elapsed*1.4)*.055;boat.rotation.z=Math.sin(elapsed*.9)*.035;secondBoat.position.y=-.92+Math.sin(elapsed*1.1+1)*.04;secondBoat.rotation.z=Math.sin(elapsed*.75+1)*.025;people.forEach(p=>{const a=p.phase+elapsed*p.speed;p.group.position.set(Math.cos(a)*5.85,.13,Math.sin(a)*5.85);p.group.rotation.y=-a;});birds.forEach((bird,i)=>{const a=elapsed*.13+i*1.6;bird.position.set(Math.cos(a)*9,3.6+Math.sin(a*.4+i)*.6,Math.sin(a)*7);bird.rotation.y=-a;});ripples.forEach((ring,i)=>{const pulse=1+Math.sin(elapsed*.5+i)*.007;ring.scale.set(pulse,pulse,1);});animateSongIsland(elapsed);}
    labels();renderer.render(scene,camera);
  }
  frame(performance.now());requestAnimationFrame(()=>requestAnimationFrame(()=>{/* 超過 15 秒才載好時，從備用清單切回 3D 版面 */world.classList.remove('scene-unavailable');world.classList.add('scene-ready');document.getElementById('scene-loading').hidden=true;document.getElementById('scene-fallback').hidden=true;}));
}
