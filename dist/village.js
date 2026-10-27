import * as THREE from './vendor/three.module.js';

const canvas=document.getElementById('village-canvas');
const world=document.getElementById('village-world');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const positions=[[-4,-2.1],[-.6,-3.5],[3.1,-2.7],[4.7,.8],[2.5,3.8],[-1.1,4.7],[-4.5,1.4],[-1.8,.1],[1.8,.4],[4.4,-1.6],[-4.8,-.7],[8.3,-5.3]];
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
  for(let i=0;i<positions.length-1;i++)path(positions[i],[.4,1.5],15);
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
  // A separate island across a real water gap links to the language training site.
  const [islandX,islandZ]=positions[11];
  const outerIsland=new THREE.Group();outerIsland.position.set(islandX,0,islandZ);outerIsland.userData.placeIndex=11;scene.add(outerIsland);buildings.push(outerIsland);
  cylinder(1.32,1.08,0,-.69,0,0xa8a082,outerIsland,14);
  cylinder(1.47,.18,0,-.07,0,0xe9dcb2,outerIsland,14);
  cylinder(1.19,.1,0,.06,0,0x96bd7a,outerIsland,14);
  const languageHouse=building(11,0xeaddbd,0x38928d,.94,.9,.78);
  box(.54,.18,.05,0,1.03,.57,0xe3b650,languageHouse);
  for(const x of [-.42,.42])box(.055,.9,.055,x,.65,.67,0x8b6c4b,languageHouse);
  box(1.12,.1,.32,0,.18,.75,0xc5ab7c,languageHouse);
  const littleTree=tree(islandX-.7,islandZ-.4,.62,1);littleTree.userData.placeIndex=11;buildings.push(littleTree);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rock(.11,islandX+Math.cos(a)*1.39,-.17,islandZ+Math.sin(a)*1.39,0x9baca0);}
  const islandWake=mesh(new THREE.RingGeometry(1.6,1.64,48),new THREE.MeshBasicMaterial({color:0xe5fffb,transparent:true,opacity:.46,side:THREE.DoubleSide}));islandWake.rotation.x=-Math.PI/2;islandWake.position.set(islandX,-1.24,islandZ);islandWake.castShadow=false;
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
  window.addEventListener('salimpo:place',event=>{selected=event.detail;selectionRing.visible=selected>=0;if(selected>=0){selectionRing.position.set(positions[selected][0],.135,positions[selected][1]);targetFocus.set(positions[selected][0]*.1,0,positions[selected][1]*.1);}else targetFocus.set(0,0,0);});
  let yaw=.61,targetYaw=.61,zoom=1,width=1,height=1;
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;renderer.setSize(width,height,false);const aspect=width/height;const half=width<600?12/aspect:9.65;camera.left=-half*aspect/zoom;camera.right=half*aspect/zoom;camera.top=half/zoom;camera.bottom=-half/zoom;camera.updateProjectionMatrix();}
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
    const pins=[...document.querySelectorAll('.place-pin')];const mobile=width<600;const entries=positions.map(([x,z],i)=>{point.set(x,1.4,z).project(camera);return {i,x:(point.x*.5+.5)*width,y:(-point.y*.5+.5)*height+(mobile?28:0),w:mobile?(selected===i?130:30):pins[i]?.offsetWidth||130};}).sort((a,b)=>a.y-b.y);
    const placed=[];const guard=document.querySelector('.world-whispers');const minY=guard?guard.offsetTop+guard.offsetHeight+(mobile?22:26):(mobile?230:239);
    entries.forEach(entry=>{entry.x=THREE.MathUtils.clamp(entry.x,entry.w/2+8,width-entry.w/2-8);entry.y=Math.max(minY,entry.y);for(let attempts=0;attempts<8;attempts++){if(!placed.some(other=>Math.abs(other.x-entry.x)<(other.w+entry.w)/2+3&&Math.abs(other.y-entry.y)<(mobile?32:38)))break;entry.y+=mobile?33:38;}placed.push(entry);const pin=pins[entry.i];if(pin){pin.style.left=entry.x+'px';pin.style.top=entry.y+'px';}});
  }
  let start=performance.now(),last=0;
  function frame(now){requestAnimationFrame(frame);if(document.hidden||!visible||now-last<1000/30)return;last=now;const elapsed=(now-start)/1000;
    yaw=THREE.MathUtils.lerp(yaw,targetYaw,.12);focus.lerp(targetFocus,.12);camera.position.set(focus.x+Math.sin(yaw)*24,17,focus.z+Math.cos(yaw)*24);camera.lookAt(focus.x,.05,focus.z);
    if(!reduced){clouds.forEach((c,i)=>{c.group.position.x=c.x+Math.sin(elapsed*.12+i)*.35;c.group.position.y=c.y+Math.sin(elapsed*.18+i)*.06;});boat.position.y=-.95+Math.sin(elapsed*1.4)*.055;boat.rotation.z=Math.sin(elapsed*.9)*.035;secondBoat.position.y=-.92+Math.sin(elapsed*1.1+1)*.04;secondBoat.rotation.z=Math.sin(elapsed*.75+1)*.025;people.forEach(p=>{const a=p.phase+elapsed*p.speed;p.group.position.set(Math.cos(a)*5.85,.13,Math.sin(a)*5.85);p.group.rotation.y=-a;});birds.forEach((bird,i)=>{const a=elapsed*.13+i*1.6;bird.position.set(Math.cos(a)*9,3.6+Math.sin(a*.4+i)*.6,Math.sin(a)*7);bird.rotation.y=-a;});ripples.forEach((ring,i)=>{const pulse=1+Math.sin(elapsed*.5+i)*.007;ring.scale.set(pulse,pulse,1);});}
    labels();renderer.render(scene,camera);
  }
  frame(performance.now());requestAnimationFrame(()=>requestAnimationFrame(()=>{world.classList.add('scene-ready');document.getElementById('scene-loading').hidden=true;document.getElementById('scene-fallback').hidden=true;}));
}
