// Streak — animated exercise demos (stick figure, SVG). No dependencies.
// Angles are absolute, in degrees: 0 = straight down, 90 = screen right, 180 = up, -90 = screen left.
// Side view: figure faces right. "l*" limbs are the far side (drawn darker), "r*" the near side.
// Front view: "l*" limbs are drawn on screen right, "r*" on screen left.
(function(G){
const L={torso:26,neck:9,head:7,ua:14,fa:13,th:19,sh:18,ft:6};
const dir=a=>{a=a*Math.PI/180;return[Math.sin(a),Math.cos(a)]};
const add=(p,a,len)=>{const d=dir(a);return[p[0]+d[0]*len,p[1]+d[1]*len]};
function ik(root,tgt,l1,l2,sign){
  let dx=tgt[0]-root[0],dy=tgt[1]-root[1],d=Math.hypot(dx,dy)||.001;
  const ux=dx/d,uy=dy/d;d=Math.max(Math.abs(l1-l2)+.01,Math.min(l1+l2-.01,d));
  const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  return [[root[0]+ux*a-uy*h*sign,root[1]+uy*a+ux*h*sign],[root[0]+ux*d,root[1]+uy*d]];
}
const SIDE={t:180,lu:-6,ll:4,ru:6,rl:12,lt:-3,ls:-3,rt:3,rs:3,lf:90,rf:90};
const FRONT={t:180,lu:14,ll:8,ru:-14,rl:-8,lt:5,ls:3,rt:-5,rs:-3,lf:75,rf:-75};
const P=(base,o)=>Object.assign({},base,o);
const S=o=>P(SIDE,o), F=o=>P(FRONT,o);

// ---- Library: k = keyframes (loop), d = seconds per full loop, v = view, a = x-anchor ('feet' or 'fixed'), props ----
const D={
 march:{v:'side',d:1.6,k:[S({rt:80,rs:0,ru:-35,rl:-20,lu:40,ll:85}),S({}),S({lt:80,ls:0,lu:-35,ll:-20,ru:40,rl:85}),S({})]},
 armcirc:{v:'front',d:1.6,k:[F({lu:90,ll:90,ru:-90,rl:-90}),F({lu:100,ll:100,ru:-100,rl:-100}),F({lu:90,ll:90,ru:-90,rl:-90}),F({lu:80,ll:80,ru:-80,rl:-80})],circle:1},
 hipcirc:{v:'front',d:2.4,k:[F({lu:40,ll:-60,ru:-40,rl:60,hx:-4,t:174}),F({lu:40,ll:-60,ru:-40,rl:60,dy:1.5}),F({lu:40,ll:-60,ru:-40,rl:60,hx:4,t:186}),F({lu:40,ll:-60,ru:-40,rl:60,dy:-1})],a:'fixed'},
 stepjack:{v:'front',d:2.4,k:[F({}),F({lt:28,ls:28,lu:148,ll:160,ru:-148,rl:-160}),F({}),F({rt:-28,rs:-28,lu:148,ll:160,ru:-148,rl:-160})],a:'fixed'},
 jacks:{v:'front',d:1.0,k:[F({dy:0}),F({dy:-5,lt:12,ls:12,rt:-12,rs:-12,lu:105,ll:115,ru:-105,rl:-115}),F({lt:24,ls:24,rt:-24,rs:-24,lu:148,ll:160,ru:-148,rl:-160}),F({dy:-5,lt:12,ls:12,rt:-12,rs:-12,lu:105,ll:115,ru:-105,rl:-115})],a:'fixed',air:1},
 highknee:{v:'side',d:1.1,k:[S({rt:95,rs:5,ru:-35,rl:-10,lu:45,ll:120}),S({}),S({lt:95,ls:5,lu:-35,ll:-10,ru:45,rl:120}),S({})]},
 shadow:{v:'side',d:1.2,k:[S({lt:-8,ls:-15,rt:12,rs:-2,ru:90,rl:90,lu:30,ll:155,t:175}),S({lt:-8,ls:-15,rt:12,rs:-2,ru:30,rl:155,lu:30,ll:155,t:178}),S({lt:-8,ls:-15,rt:12,rs:-2,lu:90,ll:90,ru:30,rl:155,t:172}),S({lt:-8,ls:-15,rt:12,rs:-2,ru:30,rl:155,lu:30,ll:155,t:178})]},
 skaters:{v:'front',d:2.2,k:[F({hx:-14,rt:-6,rs:6,lt:35,ls:55,lf:120,t:186,ru:-50,rl:-60,lu:-20,ll:-35}),F({}),F({hx:14,lt:6,ls:-6,rt:-35,rs:-55,rf:-120,t:174,lu:50,ll:60,ru:20,rl:35}),F({})],a:'fixed',hold:[.2,0,.2,0]},
 squat:{v:'side',d:3.0,k:[S({ru:85,rl:85,lu:80,ll:80}),S({t:148,lt:78,ls:-22,rt:78,rs:-22,ru:95,rl:95,lu:90,ll:90}),S({ru:85,rl:85,lu:80,ll:80})],hold:[0,.25,0]},
 chairsq:{v:'side',d:3.6,abs:1,kb:-1,k:[S({hx:52,hy:51,lax:52,lay:88,rax:52,ray:88,ru:85,rl:85,lu:80,ll:80}),S({hx:39,hy:58,t:148,lax:52,lay:88,rax:52,ray:88,ru:95,rl:95,lu:90,ll:90}),S({hx:52,hy:51,lax:52,lay:88,rax:52,ray:88,ru:85,rl:85,lu:80,ll:80})],props:[['chair',26]],hold:[0,.2,0]},
 lunge:{v:'side',d:4.4,abs:1,kb:-1,k:[S({hx:50,hy:51,lax:52,lay:88,rax:52,ray:88}),S({hx:44,hy:65,lax:24,lay:83,lf:20,rax:54,ray:88,ru:15,rl:10,lu:-10,ll:-5}),S({hx:50,hy:51,lax:52,lay:88,rax:52,ray:88}),S({hx:44,hy:65,rax:24,ray:83,rf:20,lax:54,lay:88,ru:-10,rl:-5,lu:15,ll:10})],hold:[0,.2,0,.2]},
 glute:{v:'side',d:3.4,k:[S({t:-87,hd:-90,lu:94,ll:94,ru:96,rl:96,lt:135,ls:15,rt:138,rs:18,lf:90,rf:90}),S({t:-68,hd:-80,lu:112,ll:96,ru:114,rl:98,lt:105,ls:-2,rt:108,rs:0}),S({t:-87,hd:-90,lu:94,ll:94,ru:96,rl:96,lt:135,ls:15,rt:138,rs:18})],a:'fixed',hold:[0,.3,0]},
 calf:{v:'side',d:2.4,k:[S({ru:70,rl:80}),S({ru:70,rl:80,lf:35,rf:35}),S({ru:70,rl:80})],props:[['wall',76]],cx:52,hold:[0,.2,0]},
 wallsit:{v:'side',d:4,k:[S({t:182,lt:90,ls:0,rt:90,rs:0,ru:70,rl:80,lu:70,ll:80}),S({t:180,lt:90,ls:0,rt:90,rs:0,ru:72,rl:82,lu:72,ll:82,dy:.6})],props:[['wall',20]],a:'fixed',hx:38},
 sideleg:{v:'front',d:2.6,k:[F({lu:40,ll:-60,ru:-40,rl:60}),F({lu:40,ll:-60,ru:-40,rl:60,lt:38,ls:38,t:174}),F({lu:40,ll:-60,ru:-40,rl:60})],a:'fixed'},
 wallpush:{v:'side',d:3.0,abs:1,kb:-1,eb:1,k:[S({hx:43.9,hy:53.7,t:158,hd:160,lax:30,lay:88,rax:30,ray:88,lhx:78,lhy:35,rhx:78,rhy:35}),S({hx:49.6,hy:56.6,t:148,hd:152,lax:30,lay:88,rax:30,ray:88,lhx:78,lhy:35,rhx:78,rhy:35}),S({hx:43.9,hy:53.7,t:158,hd:160,lax:30,lay:88,rax:30,ray:88,lhx:78,lhy:35,rhx:78,rhy:35})],props:[['wall',79]],hold:[0,.15,0]},
 inclpush:{v:'side',d:3.0,abs:1,kb:-1,eb:1,k:[S({hx:45.8,hy:55.7,t:140,hd:145,lax:22,lay:84,rax:22,ray:84,lf:40,rf:40,lhx:63,lhy:64,rhx:63,rhy:64}),S({hx:51.2,hy:61.2,t:128,hd:134,lax:22,lay:84,rax:22,ray:84,lf:40,rf:40,lhx:63,lhy:64,rhx:63,rhy:64}),S({hx:45.8,hy:55.7,t:140,hd:145,lax:22,lay:84,rax:22,ray:84,lf:40,rf:40,lhx:63,lhy:64,rhx:63,rhy:64})],props:[['box',59,24]],hold:[0,.15,0]},
 pushup:{v:'side',d:2.8,abs:1,kb:-1,eb:1,k:[S({hx:48.8,hy:70.3,t:110,hd:114,lax:14,lay:83,rax:14,ray:83,lf:15,rf:15,lhx:70.5,lhy:88,rhx:70.5,rhy:88}),S({hx:50.7,hy:78.7,t:96.7,hd:100,lax:14,lay:83,rax:14,ray:83,lf:15,rf:15,lhx:70.5,lhy:88,rhx:70.5,rhy:88}),S({hx:48.8,hy:70.3,t:110,hd:114,lax:14,lay:83,rax:14,ray:83,lf:15,rf:15,lhx:70.5,lhy:88,rhx:70.5,rhy:88})],hold:[0,.15,0]},
 dips:{v:'side',d:3.0,abs:1,kb:-1,eb:1,k:[S({hx:40,hy:60,t:180,lax:62,lay:88,rax:62,ray:88,lhx:37,lhy:62,rhx:37,rhy:62}),S({hx:42,hy:71,t:182,lax:62,lay:88,rax:62,ray:88,lhx:37,lhy:62,rhx:37,rhy:62}),S({hx:40,hy:60,t:180,lax:62,lay:88,rax:62,ray:88,lhx:37,lhy:62,rhx:37,rhy:62})],props:[['chair',26,'low']],hold:[0,.15,0]},
 ytw:{v:'front',d:4.5,k:[F({lu:150,ll:150,ru:-150,rl:-150}),F({lu:90,ll:90,ru:-90,rl:-90}),F({lu:50,ll:150,ru:-50,rl:-150}),F({lu:150,ll:150,ru:-150,rl:-150})],a:'fixed',hold:[.12,.12,.12,0]},
 punchup:{v:'front',d:1.8,k:[F({lu:168,ll:172,ru:-40,rl:-150}),F({lu:40,ll:150,ru:-40,rl:-150}),F({ru:-168,rl:-172,lu:40,ll:150}),F({lu:40,ll:150,ru:-40,rl:-150})],a:'fixed'},
 deadbug:{v:'side',d:3.6,k:[S({t:-90,hd:-90,lu:180,ll:180,ru:180,rl:180,lt:180,ls:90,rt:180,rs:90,lf:180,rf:180}),S({t:-90,hd:-90,lu:-125,ll:-125,ru:180,rl:180,lt:180,ls:90,rt:96,rs:96,lf:180,rf:180}),S({t:-90,hd:-90,lu:180,ll:180,ru:180,rl:180,lt:180,ls:90,rt:180,rs:90,lf:180,rf:180}),S({t:-90,hd:-90,ru:-125,rl:-125,lu:180,ll:180,rt:180,rs:90,lt:96,ls:96,lf:180,rf:180})],a:'fixed',hx:56},
 birddog:{v:'side',d:3.6,k:[S({t:90,hd:150,lu:0,ll:0,ru:0,rl:0,lt:0,ls:-90,rt:0,rs:-90,lf:180,rf:180}),S({t:90,hd:150,lu:0,ll:0,ru:100,rl:100,lt:-92,ls:-92,lf:-90,rt:0,rs:-90,rf:180}),S({t:90,hd:150,lu:0,ll:0,ru:0,rl:0,lt:0,ls:-90,rt:0,rs:-90,lf:180,rf:180}),S({t:90,hd:150,ru:0,rl:0,lu:100,ll:100,rt:-92,rs:-92,rf:-90,lt:0,ls:-90,lf:180})],a:'fixed',hx:46,hold:[0,.2,0,.2]},
 standcrunch:{v:'side',d:2.0,k:[S({ru:150,rl:-110,lu:150,ll:-110}),S({t:158,ru:110,rl:-150,lu:150,ll:-110,lt:70,ls:-5}),S({ru:150,rl:-110,lu:150,ll:-110}),S({t:158,lu:110,ll:-150,ru:150,rl:-110,rt:70,rs:-5})]},
 kneeplank:{v:'side',d:4,k:[S({t:104,hd:108,ru:0,rl:90,lu:0,ll:90,lt:-58,ls:-88,rt:-58,rs:-88,lf:-90,rf:-90}),S({t:103,hd:107,ru:0,rl:90,lu:0,ll:90,lt:-59,ls:-88,rt:-59,rs:-88,lf:-90,rf:-90,dy:-.5})],a:'fixed',hx:46},
 plank:{v:'side',d:4,k:[S({t:96,hd:100,ru:0,rl:90,lu:0,ll:90,lt:-84,ls:-84,rt:-84,rs:-84,lf:180,rf:180}),S({t:96,hd:100,ru:0,rl:90,lu:0,ll:90,lt:-84,ls:-84,rt:-84,rs:-84,lf:180,rf:180,dy:-.5})],a:'fixed',hx:48},
 sidebend:{v:'front',d:3.6,k:[F({}),F({t:160,hd:155,lu:150,ll:130,ru:-5,rl:-5}),F({}),F({t:200,hd:205,ru:-150,rl:-130,lu:5,ll:5})],a:'fixed',hold:[0,.15,0,.15]},
 hamstr:{v:'side',d:4,k:[S({t:170,rt:18,rs:18,rf:150,lt:-6,ls:-10,ru:20,rl:20,lu:20,ll:20}),S({t:122,hd:118,rt:22,rs:22,rf:150,lt:-10,ls:-20,ru:55,rl:40,lu:55,ll:40})],a:'fixed',hold:[0,.3]},
 quad:{v:'side',d:4,k:[S({lu:80,ll:85,ru:-20,rl:-20,rt:-22,rs:-160,rf:90}),S({lu:80,ll:85,ru:-20,rl:-20,rt:-28,rs:-165,rf:90,dy:.4})],props:[['wall',78]],a:'fixed',hx:52,grab:['R','aR',1]},
 chest:{v:'side',d:4,k:[S({ru:-25,rl:-25,lu:-25,ll:-25}),S({t:186,hd:192,ru:-48,rl:-48,lu:-48,ll:-48})],hold:[0,.3]},
 childpose:{v:'side',d:5,abs:1,kb:-1,k:[S({hx:36,hy:78,t:85,hd:100,lax:35,lay:86.5,rax:35,ray:86.5,lf:-95,rf:-95,lhx:90,lhy:86,rhx:90,rhy:86}),S({hx:36.5,hy:76.5,t:83,hd:98,lax:35,lay:86.5,rax:35,ray:86.5,lf:-95,rf:-95,lhx:90,lhy:86,rhx:90,rhy:86})],split:[.5,.5]},
 breathe:{v:'front',d:10,k:[F({}),F({lu:120,ll:130,ru:-120,rl:-130,dy:-.5}),F({})],a:'fixed',split:[.4,.6],breath:1},
};

function pose(id,t){
  const ex=D[id];if(!ex)return null;
  const k=ex.k,n=k.length;
  const ph=((t/ex.d)%1+1)%1;
  // split: custom segment lengths, no loop back; otherwise equal segments looping k[n-1] -> k[0]
  const w=ex.split||Array(n).fill(1/n);
  const hold=ex.hold||[];
  let acc=0;
  for(let i=0;i<w.length;i++){
    if(ph<acc+w[i]||i===w.length-1){
      const local=Math.min(1,(ph-acc)/w[i]),hf=hold[i]||0;
      let f=local<hf?0:(local-hf)/(1-hf);
      f=.5-.5*Math.cos(Math.PI*f);
      const A=k[i],B=k[(i+1)%n],o={};
      const val=(P,key)=>P[key]!=null?P[key]:key==='hd'?P.t:0;
      const keys=new Set([...Object.keys(A),...Object.keys(B)]);
      keys.forEach(key=>{const x=val(A,key),y=val(B,key);o[key]=x+(y-x)*f});
      return o;
    }
    acc+=w[i];
  }
}

function skeleton(id,p){
  const ex=D[id];const front=ex.v==='front';
  const hip=ex.abs?[p.hx,p.hy]:[50+(p.hx||0),50];
  const neck=add(hip,p.t,L.torso);
  const head=add(neck,p.hd??p.t,L.neck);
  const sh=add(neck,p.t+180,3);
  const off=a=>front?dir(p.t-90).map(v=>v*a):[0,0];
  const o6=off(7),o4=off(4.6);
  const shL=[sh[0]+o6[0],sh[1]+o6[1]],shR=[sh[0]-o6[0],sh[1]-o6[1]];
  const hpL=[hip[0]+o4[0],hip[1]+o4[1]],hpR=[hip[0]-o4[0],hip[1]-o4[1]];
  let eL=add(shL,p.lu,L.ua),hL=add(eL,p.ll,L.fa),eR=add(shR,p.ru,L.ua),hR=add(eR,p.rl,L.fa);
  let kL=add(hpL,p.lt,L.th),aL=add(kL,p.ls,L.sh),tL=add(aL,p.lf,L.ft);
  let kR=add(hpR,p.rt,L.th),aR=add(kR,p.rs,L.sh),tR=add(aR,p.rf,L.ft);
  const kb=ex.kb||1,eb=ex.eb||1;let r;
  if(p.lax!=null){r=ik(hpL,[p.lax,p.lay],L.th,L.sh,kb);kL=r[0];aL=r[1];tL=add(aL,p.lf,L.ft)}
  if(p.rax!=null){r=ik(hpR,[p.rax,p.ray],L.th,L.sh,kb);kR=r[0];aR=r[1];tR=add(aR,p.rf,L.ft)}
  if(ex.grab){const g={aL,aR,tL,tR}[ex.grab[1]];r=ik(ex.grab[0]==='L'?shL:shR,g,L.ua,L.fa,ex.grab[2]||1);if(ex.grab[0]==='L'){eL=r[0];hL=r[1]}else{eR=r[0];hR=r[1]}}
  if(p.lhx!=null){r=ik(shL,[p.lhx,p.lhy],L.ua,L.fa,eb);eL=r[0];hL=r[1]}
  if(p.rhx!=null){r=ik(shR,[p.rhx,p.rhy],L.ua,L.fa,eb);eR=r[0];hR=r[1]}
  return {hip,neck,head,shL,shR,hpL,hpR,eL,hL,eR,hR,kL,aL,tL,kR,aR,tR};
}
const FLOOR=88;
function placed(id,t){
  const ex=D[id],p=pose(id,t),s=skeleton(id,p);
  if(ex.abs)return s;
  const pts=[s.hip,s.neck,s.eL,s.hL,s.eR,s.hR,s.kL,s.aL,s.tL,s.kR,s.aR,s.tR];
  let maxY=Math.max(...pts.map(q=>q[1]),s.head[1]+L.head);
  let dy=FLOOR-maxY+(p.dy||0);
  let dx;
  if((ex.a||'feet')==='feet'){dx=(ex.cx||50)-(s.aL[0]+s.aR[0])/2}
  else{ // fixed: centre the first keyframe's bounding box once
    if(ex._dx==null){const p0=skeleton(id,ex.k[0]);const xs=[p0.hip,p0.neck,p0.head,p0.hL,p0.hR,p0.aL,p0.aR,p0.tL,p0.tR,p0.kL,p0.kR,p0.eL,p0.eR].map(q=>q[0]);ex._dx=(ex.hx!=null?ex.hx:50)-(Math.min(...xs)+Math.max(...xs))/2}
    dx=ex._dx;
  }
  for(const key in s){s[key]=[s[key][0]+dx,s[key][1]+dy]}
  return s;
}

const C={body:'#f4f4f7',near:'#ff7a35',far:'#9a4e2c',floor:'#34343f',prop:'#3a3a48'};
function propSVG(pr){
  const [type,x,extra]=pr;
  if(type==='wall')return `<rect x="${x}" y="4" width="7" height="${FLOOR-4}" rx="1.5" fill="url(#dmPr)"/><rect x="${x}" y="4" width="1.4" height="${FLOOR-4}" fill="#5c5c70"/>`;
  if(type==='box')return `<rect x="${x}" y="${FLOOR-extra}" width="26" height="${extra}" rx="3" fill="url(#dmPr)"/><rect x="${x}" y="${FLOOR-extra}" width="26" height="3.5" rx="1.5" fill="#5c5c70"/>`;
  if(type==='chair'){const seat=extra==='low'?FLOOR-26:FLOOR-28;return `<g fill="none" stroke="#565669" stroke-width="3.2" stroke-linecap="round"><line x1="${x-12}" y1="${seat}" x2="${x+10}" y2="${seat}"/><line x1="${x-12}" y1="${seat}" x2="${x-12}" y2="${seat-26}"/><line x1="${x-12}" y1="${seat}" x2="${x-12}" y2="${FLOOR}"/><line x1="${x+10}" y1="${seat}" x2="${x+10}" y2="${FLOOR}"/></g>`}
  return '';
}
// ---- Mannequin renderer: layered, shaded capsules + spheres (light from upper-left) ----
const PAL={near:['#ffc896','#ff7a35','#b9441a'],far:['#d48a60','#9c4f28','#5e2a12'],body:['#ffffff','#d9d9e3','#8e8ea0']};
const LX=-.55,LY=-.83; // light direction
const f1=v=>v.toFixed(1);
function capPath(a,b,r1,r2){
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||.001,nx=-dy/d,ny=dx/d;
  return `M${f1(a[0]+nx*r1)} ${f1(a[1]+ny*r1)}L${f1(b[0]+nx*r2)} ${f1(b[1]+ny*r2)}A${f1(r2)} ${f1(r2)} 0 0 0 ${f1(b[0]-nx*r2)} ${f1(b[1]-ny*r2)}L${f1(a[0]-nx*r1)} ${f1(a[1]-ny*r1)}A${f1(r1)} ${f1(r1)} 0 0 0 ${f1(a[0]+nx*r1)} ${f1(a[1]+ny*r1)}Z`;
}
function capsule(a,b,r1,r2,pal){
  const sh=(p,k)=>[p[0]+LX*k,p[1]+LY*k];
  const o1=Math.min(r1,r2)*.28;
  return `<path d="${capPath(a,b,r1,r2)}" fill="${pal[2]}"/>`+
   `<path d="${capPath(sh(a,o1),sh(b,o1),r1*.72,r2*.72)}" fill="${pal[1]}"/>`+
   `<path d="${capPath(sh(a,o1*2.1),sh(b,o1*2.1),r1*.22,r2*.22)}" fill="${pal[0]}" opacity=".75"/>`;
}
function sphere(c,r,grad){return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="url(#${grad})"/>`}
function limbSet(s,side,pal,g){
  const sfx=side;const hp=s['hp'+sfx],k=s['k'+sfx],an=s['a'+sfx],to=s['t'+sfx];
  return capsule(hp,k,4.3,3.3,pal)+sphere(k,3.2,g)+capsule(k,an,3.2,2.3,pal)+capsule(an,to,2.3,1.7,pal);
}
function armSet(s,side,pal,g){
  const shp=s['sh'+side],e=s['e'+side],h=s['h'+side];
  return sphere(shp,3.6,g)+capsule(shp,e,3.2,2.6,pal)+sphere(e,2.5,g)+capsule(e,h,2.5,1.9,pal)+sphere(h,2.4,g);
}
function figSVG(id,t){
  const ex=D[id],s=placed(id,t),front=ex.v==='front';
  // soft floor shadow under whatever is near the floor
  const pts=[s.hip,s.neck,s.head,s.hL,s.hR,s.kL,s.kR,s.aL,s.aR,s.tL,s.tR,s.eL,s.eR];
  const low=pts.filter(q=>q[1]>FLOOR-14);const xs=(low.length?low:pts).map(q=>q[0]);
  const minx=Math.min(...xs),maxx=Math.max(...xs);
  let g=`<ellipse cx="${f1((minx+maxx)/2)}" cy="${FLOOR+1.2}" rx="${f1((maxx-minx)/2+7)}" ry="3" fill="url(#dmSh)"/>`;
  const farP=front?PAL.near:PAL.far,farG=front?'dmJn':'dmJf';
  g+=limbSet(s,'L',farP,farG)+armSet(s,'L',farP,farG);
  // torso + pelvis + neck + head
  const nk=[(s.neck[0]*.4+s.head[0]*.6),(s.neck[1]*.4+s.head[1]*.6)];
  g+=capsule(s.neck,nk,2.6,2.6,PAL.body);
  if(front){
    g+=capsule(s.hpL,s.hpR,4.6,4.6,PAL.body);
    g+=capsule(s.hip,s.neck,5.8,7.6,PAL.body);
    g+=capsule(s.shL,s.shR,4.2,4.2,PAL.body);
  }else{
    g+=sphere(s.hip,5.6,'dmB');
    g+=capsule(s.hip,s.neck,5.6,6.4,PAL.body);
  }
  g+=sphere(s.head,L.head,'dmB');
  g+=limbSet(s,'R',PAL.near,'dmJn')+armSet(s,'R',PAL.near,'dmJn');
  return g;
}
const DEFS=`<defs>
<radialGradient id="dmJn" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffd2a8"/><stop offset=".45" stop-color="#ff7a35"/><stop offset="1" stop-color="#9c3812"/></radialGradient>
<radialGradient id="dmJf" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#e0a07a"/><stop offset=".45" stop-color="#9c4f28"/><stop offset="1" stop-color="#4e220e"/></radialGradient>
<radialGradient id="dmB" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d9d9e3"/><stop offset="1" stop-color="#7c7c8e"/></radialGradient>
<radialGradient id="dmSh"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="dmFl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2c38"/><stop offset="1" stop-color="#17171f" stop-opacity="0"/></linearGradient>
<linearGradient id="dmPr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a5c"/><stop offset="1" stop-color="#2c2c38"/></linearGradient>
</defs>`;
function staticSVG(id){
  const ex=D[id];if(!ex)return '';
  return DEFS+`<rect x="0" y="${FLOOR}" width="100" height="${100-FLOOR}" fill="url(#dmFl)"/><line x1="0" y1="${FLOOR}" x2="100" y2="${FLOOR}" stroke="#3a3a48" stroke-width=".8"/>`+(ex.props||[]).map(propSVG).join('');
}
// Public: markup for a demo, and a loop that animates every .demo on the page
function demoHTML(id,cls='',still){
  if(!D[id])return '';
  const t0=still?D[id].d*(D[id].split?D[id].split[0]:1/D[id].k.length):(typeof performance!=='undefined'?performance.now()/1000:0);
  return `<svg class="demo ${cls}${still?' still':''}" data-ex="${id}" viewBox="0 0 100 100" aria-label="How to do it">${staticSVG(id)}<g class="fig">${figSVG(id,t0)}</g></svg>`;
}
let raf=null;
function loop(now){
  const t=now/1000;
  document.querySelectorAll('svg.demo:not(.still)').forEach(el=>{const g=el.querySelector('.fig');if(g&&!el.closest('.paused'))g.innerHTML=figSVG(el.dataset.ex,t)});
  raf=requestAnimationFrame(loop);
}
function startDemos(){if(!raf&&typeof requestAnimationFrame!=='undefined')raf=requestAnimationFrame(loop)}
G.Demos={has:id=>!!D[id],html:demoHTML,start:startDemos,_placed:placed,_D:D,FLOOR,_props:id=>D[id].props||[]};
})(typeof window!=='undefined'?window:globalThis);
