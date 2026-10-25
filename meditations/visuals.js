// Meditations visual library: animated SVG metaphors, one per lesson kind.
(function(){
const W=360,H=230;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T=(x,y,s,cls='vt',size=12,anchor='middle',extra='')=>`<text x="${x}" y="${y}" class="${cls}" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const wrap=(inner,defs='')=>`<svg viewBox="0 0 ${W} ${H}" class="viz" role="img" xmlns="http://www.w3.org/2000/svg"><defs>
<radialGradient id="glw" cx="50%" cy="50%" r="50%"><stop offset="0" class="sg1"/><stop offset="1" class="sg0"/></radialGradient>
<linearGradient id="wat" x1="0" x2="1"><stop offset="0" class="sw0"/><stop offset=".5" class="sw1"/><stop offset="1" class="sw0"/></linearGradient>
${defs}</defs>${inner}</svg>`;
const pick=(a,i,d='')=>Array.isArray(a)&&a[i]!=null?a[i]:d;

const K={};
K.circles=v=>{
 const inn=v.inner||[],out=v.outer||[];let s='';
 s+=`<circle cx="180" cy="115" r="106" class="vline" fill="none" stroke-dasharray="3 7"><animateTransform attributeName="transform" type="rotate" from="0 180 115" to="360 180 115" dur="60s" repeatCount="indefinite"/></circle>`;
 s+=`<circle cx="180" cy="115" r="72" fill="url(#glw)" opacity=".5"><animate attributeName="r" values="62;76;62" dur="8s" repeatCount="indefinite"/></circle>`;
 s+=`<circle cx="180" cy="115" r="54" class="vgold-f" opacity=".12"/><circle cx="180" cy="115" r="54" class="vgold-s" fill="none" stroke-width="1.5"/>`;
 s+=T(180,82,'IN YOUR POWER','vcap',8.5);
 inn.slice(0,3).forEach((t,i)=>s+=T(180,104+i*17,t,'vt',12.5));
 const ang=[-152,-28,90];out.slice(0,3).forEach((t,i)=>{const a=ang[i]*Math.PI/180,x=180+86*Math.cos(a),y=115+86*Math.sin(a)+4;s+=T(x,y,t,'vmut',11.5)});
 s+=T(40,22,'NOT IN YOUR POWER','vcap',8.5,'start');
 return wrap(s);
};
K.filter=v=>{
 const st=v.steps||[];let s='';
 s+=`<rect x="14" y="70" width="92" height="50" rx="10" class="vcard"/>`+T(60,100,pick(st,0),'vt',11.5);
 s+=`<ellipse cx="180" cy="95" rx="30" ry="50" class="vgold-f" opacity=".14"/><ellipse cx="180" cy="95" rx="30" ry="50" class="vgold-s" fill="none" stroke-width="1.5"/>`;
 s+=T(180,30,'JUDGMENT','vcap',8.5)+T(180,99,pick(st,1),'vt',10.5);
 s+=`<rect x="254" y="70" width="92" height="50" rx="10" class="vcard"/>`+T(300,100,pick(st,2),'vt',11.5);
 s+=`<path d="M108 95 H148 M212 95 H252" class="vline" stroke-dasharray="2 4"/>`;
 for(let i=0;i<4;i++)s+=`<circle r="3.2" class="vgold-f"><animateMotion dur="4s" begin="${i}s" repeatCount="indefinite" path="M100 95 H260"/><animate attributeName="opacity" values="0;1;1;0" dur="4s" begin="${i}s" repeatCount="indefinite"/></circle>`;
 if(v.alt){s+=`<path d="M180 148 v14" class="vgold-s" stroke-width="1.2"/>`+`<rect x="70" y="166" width="220" height="40" rx="20" class="vgold-f" opacity=".12"/>`+T(180,183,'OR CHOOSE','vcap',8)+T(180,199,v.alt,'vgold-t',12)}
 return wrap(s);
};
K.citadel=v=>{
 const wv=v.waves||[];let s='';
 s+=`<path d="M0 182 Q90 170 180 182 T360 182 V230 H0Z" class="vwater"/>`;
 s+=`<path d="M128 186 L146 120 L160 128 L172 92 L188 104 L198 84 L214 112 L226 106 L236 186Z" class="vrock"/>`;
 s+=`<path d="M164 100 h12 v-8 h6 v8 h6 v-8 h6 v8 h6 v18 h-36z" class="vgold-f" opacity=".85"/>`;
 s+=`<circle cx="182" cy="96" r="48" fill="url(#glw)" opacity=".35"><animate attributeName="opacity" values=".2;.45;.2" dur="7s" repeatCount="indefinite"/></circle>`;
 s+=T(182,206,v.core||'','vt',13);
 wv.slice(0,3).forEach((t,i)=>{const left=i!==1,y=150+i*12,d=i*1.6;const from=left?-60:420,to=left?110:250;
  s+=`<g opacity="0"><path d="M-30 0 q15 -12 30 0 t30 0" class="vwave" fill="none"/>${T(0,-12,t,'vmut',11)}
  <animateTransform attributeName="transform" type="translate" values="${from} ${y};${to} ${y}" dur="5s" begin="${d}s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.2;.8;1" dur="5s" begin="${d}s" repeatCount="indefinite"/></g>`});
 return wrap(s);
};
K.river=v=>{
 const it=v.items||[];let s='';
 s+=`<path d="M-10 120 C80 70 140 170 220 120 S330 80 370 110 V160 C330 130 300 190 220 168 S80 120 -10 170Z" fill="url(#wat)" opacity=".7"/>`;
 for(let i=0;i<3;i++)s+=`<path d="M-10 ${132+i*10} C80 ${90+i*10} 140 ${180+i*6} 220 ${136+i*8} S330 ${100+i*10} 370 ${124+i*10}" class="vflow" fill="none" stroke-dasharray="6 14"><animate attributeName="stroke-dashoffset" from="40" to="0" dur="${2+i*.6}s" repeatCount="indefinite"/></path>`;
 it.slice(0,4).forEach((t,i)=>{s+=`<g opacity="0"><ellipse rx="7" ry="4" class="vgold-f"/>${T(0,-10,t,'vt',11.5)}
 <animateMotion dur="12s" begin="${i*3}s" repeatCount="indefinite" path="M-20 140 C80 100 140 186 220 148 S330 110 380 136"/>
 <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.85;1" dur="12s" begin="${i*3}s" repeatCount="indefinite"/></g>`});
 s+=T(180,24,'TIME IS A RIVER','vcap',8.5);
 return wrap(s);
};
K.zoom=v=>{
 const lv=v.levels||[];const R=[14,40,70,104];let s='';
 for(let i=0;i<30;i++){const x=(i*97)%360,y=(i*53)%230;s+=`<circle cx="${x}" cy="${y}" r="${i%3?0.8:1.3}" class="vmut-f"><animate attributeName="opacity" values=".2;.8;.2" dur="${3+i%5}s" repeatCount="indefinite"/></circle>`}
 R.forEach((r,i)=>{s+=`<g opacity=".25"><circle cx="180" cy="118" r="${r}" class="${i==0?'vgold-f':'vgold-s'}" fill="${i==0?'':'none'}" ${i==0?'opacity=".9"':''} stroke-width="1.2"/>${T(180,118-r-5+(i==0?24+r:0),pick(lv,i),i==0?'vt':'vmut',i==0?11:11)}
 <animate attributeName="opacity" values=".25;1;1;.25" keyTimes="0;.15;.7;1" dur="8s" begin="${i*1.4}s" repeatCount="indefinite"/></g>`});
 s+=T(180,226,'ZOOM OUT','vcap',8);
 return wrap(s);
};
K.now=v=>{
 let s='';
 s+=`<path d="M20 120 H170" class="vmut-s" stroke-width="1.5" opacity=".5"/><path d="M190 120 H340" class="vmut-s" stroke-width="1.5" stroke-dasharray="4 6" opacity=".5"/>`;
 s+=`<g>${Array.from({length:18},(_,i)=>`<path d="M${20+i*20} 114 v12" class="vmut-s" opacity=".35"/>`).join('')}<animateTransform attributeName="transform" type="translate" from="0 0" to="-20 0" dur="2s" repeatCount="indefinite"/></g>`;
 s+=`<circle cx="180" cy="120" r="40" fill="url(#glw)"><animate attributeName="r" values="30;46;30" dur="4s" repeatCount="indefinite"/></circle><circle cx="180" cy="120" r="8" class="vgold-f"/>`;
 s+=T(180,80,v.now||'Now','vt',15)+T(70,150,v.past||'Past','vmut',12)+T(290,150,v.future||'Future','vmut',12);
 s+=T(70,170,'gone','vcap',8)+T(290,170,'not yet','vcap',8)+T(180,170,'THE ONLY MOMENT YOU HOLD','vcap',8);
 return wrap(s);
};
K.candle=v=>{
 let s='';
 s+=`<circle cx="180" cy="70" r="70" fill="url(#glw)"><animate attributeName="opacity" values=".6;1;.7;.9;.6" dur="3s" repeatCount="indefinite"/></circle>`;
 s+=`<g><rect x="164" y="88" width="32" height="110" rx="3" class="vcandle"><animate attributeName="y" values="88;150;88" dur="24s" repeatCount="indefinite"/><animate attributeName="height" values="110;48;110" dur="24s" repeatCount="indefinite"/></rect></g>`;
 s+=`<g><path d="M180 60 C170 74 172 84 180 86 C188 84 190 74 180 60Z" class="vflame"><animateTransform attributeName="transform" type="translate" values="0 0;0 62;0 0" dur="24s" repeatCount="indefinite" additive="sum"/></path></g>`;
 s+=`<path d="M140 198 H220" class="vmut-s" stroke-width="2"/>`;
 s+=T(180,222,v.label||'','vt',13)+T(300,40,'WHILE YOU LIVE','vcap',8);
 return wrap(s);
};
K.web=v=>{
 const n=v.nodes||[];let s='';const P=n.slice(0,5).map((t,i)=>{const a=(-90+i*72)*Math.PI/180;return[180+120*Math.cos(a)*1.05,118+82*Math.sin(a)]});
 P.forEach(([x,y],i)=>{s+=`<path d="M180 118 L${x} ${y}" class="vline"/>`;const [x2,y2]=P[(i+1)%P.length];s+=`<path d="M${x} ${y} L${x2} ${y2}" class="vline" opacity=".5"/>`;
  s+=`<circle r="2.6" class="vgold-f"><animateMotion dur="3s" begin="${i*.6}s" repeatCount="indefinite" path="M180 118 L${x} ${y}"/></circle>`});
 P.forEach(([x,y],i)=>{s+=`<circle cx="${x}" cy="${y}" r="7" class="vgold-s vbg-f" stroke-width="1.4"/>`+T(x,y+(y<118?-12:22),n[i],'vt',11.5)});
 s+=`<circle cx="180" cy="118" r="26" fill="url(#glw)"/><circle cx="180" cy="118" r="11" class="vgold-f"/>`+T(180,152,v.center||'','vt',12.5,'middle','font-weight="600"');
 return wrap(s);
};
K.hive=v=>{
 let s='';const hx=(cx,cy,r)=>`M${[0,1,2,3,4,5].map(i=>{const a=(60*i-30)*Math.PI/180;return(cx+r*Math.cos(a)).toFixed(1)+' '+(cy+r*Math.sin(a)).toFixed(1)}).join(' L')}Z`;
 [[180,110],[160,110-0],[200,110],[170,93],[190,93],[170,127],[190,127]].forEach(([x,y],i)=>{});
 const cells=[[0,0],[-1,0],[1,0],[-.5,-.87],[.5,-.87],[-.5,.87],[.5,.87]];
 cells.forEach(([a,b],i)=>s+=`<path d="${hx(180+a*24,112+b*24,13)}" class="vgold-f" opacity="${i?.35:.8}"><animate attributeName="opacity" values="${i?'.25;.6;.25':'.7;1;.7'}" dur="${4+i}s" repeatCount="indefinite"/></path>`);
 for(let i=0;i<6;i++){const rx=70+i*10,ry=40+i*7,dur=6+i*1.3;s+=`<g><ellipse rx="4" ry="2.6" class="vink-f"/><ellipse cx="-1" cy="-3" rx="3" ry="1.6" class="vwing"/><animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto" path="M${180+rx} 112 A${rx} ${ry} 0 1 ${i%2} ${180-rx} 112 A${rx} ${ry} 0 1 ${i%2} ${180+rx} 112"/></g>`}
 s+=T(180,214,v.label||'','vt',13)+T(180,24,'BEE AND SWARM','vcap',8.5);
 return wrap(s);
};
K.orbit=v=>{
 const it=v.items||[];let s='';
 [[70,34],[110,56],[150,80]].forEach(([rx,ry],i)=>{s+=`<ellipse cx="180" cy="118" rx="${rx}" ry="${ry}" class="vline" fill="none"/>`;
  s+=`<g><circle r="6" class="vgold-f"/>${T(0,-11,pick(it,i),'vt',11.5)}<animateMotion dur="${14+i*6}s" repeatCount="indefinite" path="M${180+rx} 118 A${rx} ${ry} 0 1 1 ${180-rx} 118 A${rx} ${ry} 0 1 1 ${180+rx} 118"/></g>`});
 s+=`<circle cx="180" cy="118" r="34" fill="url(#glw)"><animate attributeName="r" values="28;38;28" dur="6s" repeatCount="indefinite"/></circle><circle cx="180" cy="118" r="13" class="vgold-f"/>`+T(180,122+0,'','vt',1);
 s+=T(180,226,v.center||'','vt',13);
 return wrap(s);
};
K.gem=v=>{
 const r=v.rays||[];let s='';
 s+=`<circle cx="180" cy="112" r="70" class="vgem-glow"><animate attributeName="r" values="60;76;60" dur="6s" repeatCount="indefinite"/></circle>`;
 s+=`<path d="M180 62 L214 92 L202 152 L158 152 L146 92Z" class="vgem"/><path d="M180 62 L192 92 L180 152 L168 92Z M146 92 H214" class="vgem-l" fill="none"/>`;
 s+=`<path d="M164 80 l6 -6" class="vgem-l"><animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite"/></path>`;
 const pos=[[40,50,'start'],[320,60,'end'],[60,200,'start']];
 r.slice(0,3).forEach((t,i)=>{const[x,y,a]=pos[i];s+=`<g opacity="0">${T(x,y,t,'vmut',11.5,a)}<animate attributeName="opacity" values="0;1;0" dur="6s" begin="${i*2}s" repeatCount="indefinite"/></g>`});
 s+=T(180,180,v.label||'','vt',13)+T(180,200,'STILL GREEN','vcap',8);
 return wrap(s);
};
K.seed=v=>{
 const st=v.stages||[];let s='';
 s+=`<path d="M20 170 H340" class="vmut-s" opacity=".4"/>`;
 const xs=[55,140,225,310];
 const art=[
  `<ellipse cx="0" cy="-6" rx="7" ry="5" class="vgold-f"/>`,
  `<path d="M0 0 v-22" class="vgreen-s"/><path d="M0 -14 q-12 -4 -14 -14 q12 2 14 14z M0 -18 q10 -6 14 -16 q-12 0 -14 16z" class="vgreen-f"/>`,
  `<path d="M0 0 v-50" class="vtrunk-s"/><circle cx="0" cy="-62" r="26" class="vgreen-f"/><circle cx="-16" cy="-50" r="16" class="vgreen-f"/><circle cx="16" cy="-50" r="16" class="vgreen-f"/>`,
  `<path d="M0 0 v-44" class="vtrunk-s"/><path d="M0 -40 l-14 -16 M0 -32 l16 -14 M0 -46 l6 -14" class="vtrunk-s"/><path d="M14 -70 q8 2 6 10 q-8 -2 -6 -10z" class="vgold-f"><animateMotion dur="5s" repeatCount="indefinite" path="M0 0 q-14 30 6 60 t-6 40"/><animate attributeName="opacity" values="1;1;0" dur="5s" repeatCount="indefinite"/></path>`];
 xs.forEach((x,i)=>{s+=`<g transform="translate(${x} 170)" opacity=".3">${art[i]}<animate attributeName="opacity" values=".3;1;1;.3" keyTimes="0;.12;.4;1" dur="10s" begin="${i*2.5}s" repeatCount="indefinite"/></g>`+T(x,195,pick(st,i),'vt',11.5)});
 s+=`<path d="M70 210 Q180 236 290 210" class="vmut-s" fill="none" stroke-dasharray="3 5" opacity=".5"/>`;
 return wrap(s);
};
K.sunrise=v=>{
 let s='';
 s+=`<rect x="0" y="0" width="360" height="160" class="vdawn"/>`;
 s+=`<g><circle cx="180" cy="160" r="36" class="vsun"/><circle cx="180" cy="160" r="70" fill="url(#glw)"/>
 ${Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180;return`<path d="M${180+48*Math.cos(a)} ${160+48*Math.sin(a)} L${180+62*Math.cos(a)} ${160+62*Math.sin(a)}" class="vgold-s" stroke-width="1.5"/>`}).join('')}
 <animateTransform attributeName="transform" type="translate" values="0 40;0 -18;0 -18;0 40" keyTimes="0;.45;.85;1" dur="12s" repeatCount="indefinite"/></g>`;
 s+=`<rect x="0" y="160" width="360" height="70" class="vland"/><path d="M0 160 H360" class="vmut-s" opacity=".4"/>`;
 s+=T(180,200,v.label||'','vt',13);
 return wrap(s);
};
K.scale=v=>{
 const tilt=v.tilt==='right'?8:-8;let s='';
 s+=`<path d="M180 70 V190 M150 196 H210" class="vink-s" stroke-width="2"/><circle cx="180" cy="66" r="5" class="vgold-f"/>`;
 s+=`<g><path d="M80 70 H280" class="vink-s" stroke-width="2"/>
 <path d="M80 70 L60 130 M80 70 L100 130 M280 70 L260 130 M280 70 L300 130" class="vline"/>
 <path d="M50 130 Q80 150 110 130Z M250 130 Q280 150 310 130Z" class="vgold-f" opacity=".6"/>
 ${T(80,166,v.left||'','vt',12)}${T(280,166,v.right||'','vt',12)}
 <animateTransform attributeName="transform" type="rotate" values="0 180 70;${tilt} 180 70;${tilt} 180 70;0 180 70" keyTimes="0;.3;.8;1" dur="8s" repeatCount="indefinite"/></g>`;
 return wrap(s);
};
K.fountain=v=>{
 let s='';
 s+=`<path d="M110 170 Q180 200 250 170 L240 190 Q180 214 120 190Z" class="vrock"/><ellipse cx="180" cy="170" rx="70" ry="10" fill="url(#wat)"/>`;
 s+=`<circle cx="180" cy="160" r="40" fill="url(#glw)"/>`;
 for(let i=0;i<10;i++){const dx=(i%2?1:-1)*(20+i*6),h=60+(i%3)*18;s+=`<circle r="2.6" class="vdrop"><animateMotion dur="${2+i%3*.4}s" begin="${i*.25}s" repeatCount="indefinite" path="M180 166 Q${180+dx/2} ${166-h*1.6} ${180+dx} 168"/></circle>`}
 s+=T(180,222,v.label||'','vt',13)+T(180,28,'LOOK WITHIN','vcap',8.5);
 return wrap(s);
};
window.Visual={render(v){try{return (K[v&&v.kind]||K.sunrise)(v||{})}catch(e){console.error(e);return K.sunrise({label:''})}},kinds:Object.keys(K)};
})();
