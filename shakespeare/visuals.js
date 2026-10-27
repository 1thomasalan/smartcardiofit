// Shakespeare visual library: animated SVG metaphors, one per lesson kind.
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
K.web=v=>{
 const n=v.nodes||[];let s='';const P=n.slice(0,5).map((t,i)=>{const a=(-90+i*72)*Math.PI/180;return[180+120*Math.cos(a)*1.05,118+82*Math.sin(a)]});
 P.forEach(([x,y],i)=>{s+=`<path d="M180 118 L${x} ${y}" class="vline"/>`;const [x2,y2]=P[(i+1)%P.length];s+=`<path d="M${x} ${y} L${x2} ${y2}" class="vline" opacity=".5"/>`;
  s+=`<circle r="2.6" class="vgold-f"><animateMotion dur="3s" begin="${i*.6}s" repeatCount="indefinite" path="M180 118 L${x} ${y}"/></circle>`});
 P.forEach(([x,y],i)=>{s+=`<circle cx="${x}" cy="${y}" r="7" class="vgold-s vbg-f" stroke-width="1.4"/>`+T(x,y+(y<118?-12:22),n[i],'vt',11.5)});
 s+=`<circle cx="180" cy="118" r="26" fill="url(#glw)"/><circle cx="180" cy="118" r="11" class="vgold-f"/>`+T(180,152,v.center||'','vt',12.5,'middle','font-weight="600"');
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
K.candle=v=>{
 let s='';
 s+=`<circle cx="180" cy="70" r="70" fill="url(#glw)"><animate attributeName="opacity" values=".6;1;.7;.9;.6" dur="3s" repeatCount="indefinite"/></circle>`;
 s+=`<g><rect x="164" y="88" width="32" height="110" rx="3" class="vcandle"><animate attributeName="y" values="88;150;88" dur="24s" repeatCount="indefinite"/><animate attributeName="height" values="110;48;110" dur="24s" repeatCount="indefinite"/></rect></g>`;
 s+=`<g><path d="M180 60 C170 74 172 84 180 86 C188 84 190 74 180 60Z" class="vflame"><animateTransform attributeName="transform" type="translate" values="0 0;0 62;0 0" dur="24s" repeatCount="indefinite" additive="sum"/></path></g>`;
 s+=`<path d="M140 198 H220" class="vmut-s" stroke-width="2"/>`;
 s+=T(180,222,v.label||'','vt',13)+T(300,40,'BRIEF CANDLE','vcap',8);
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

const curtains=()=>`<path d="M0 0 H70 Q52 90 66 230 H0Z" class="vcurtain"/><path d="M360 0 H290 Q308 90 294 230 H360Z" class="vcurtain"/><path d="M0 0 H360 V18 Q300 30 240 18 Q180 32 120 18 Q60 30 0 18Z" class="vcurtain"/>`;
K.spotlight=v=>{let s='';
 s+=`<path d="M180 -10 L120 196 H240Z" class="vbeam"><animate attributeName="opacity" values=".12;.26;.12" dur="5s" repeatCount="indefinite"/></path>`;
 s+=`<ellipse cx="180" cy="196" rx="70" ry="12" class="vgold-f" opacity=".25"/><path d="M40 204 H320" class="vmut-s" opacity=".5"/>`;
 s+=`<g><circle cx="180" cy="134" r="11" class="vink-f"/><path d="M164 190 Q166 152 180 148 Q194 152 196 190Z" class="vink-f"/><animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="4s" repeatCount="indefinite"/></g>`;
 s+=curtains();s+=T(180,226,v.label||'','vt',15)+(v.sub?T(180,50,String(v.sub).toUpperCase(),'vcap',8):'');return wrap(s)};
K.crown=v=>{const w=v.weights||[];let s='';
 s+=`<circle cx="180" cy="112" r="64" fill="url(#glw)"><animate attributeName="opacity" values=".5;.9;.5" dur="6s" repeatCount="indefinite"/></circle>`;
 s+=`<g><path d="M136 134 L130 86 L156 106 L180 74 L204 106 L230 86 L224 134Z" class="vgold-f"/><rect x="134" y="134" width="92" height="14" rx="3" class="vgold-f"/>
 <circle cx="180" cy="74" r="4" class="vcrim-f"/><circle cx="130" cy="86" r="3.5" class="vcrim-f"/><circle cx="230" cy="86" r="3.5" class="vcrim-f"/><circle cx="180" cy="141" r="3.5" class="vcrim-f"/>
 <animateTransform attributeName="transform" type="translate" values="0 0;0 5;0 0" dur="5s" repeatCount="indefinite"/></g>`;
 const P=[[60,60],[300,70],[180,196]];w.slice(0,3).forEach((t,i)=>{const[x,y]=P[i];s+=`<g opacity="0">${T(x,y,t,'vmut',12)}<animateTransform attributeName="transform" type="translate" values="0 -6;0 6" dur="6s" begin="${i*2}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="6s" begin="${i*2}s" repeatCount="indefinite"/></g>`});
 s+=T(180,224,v.label||'','vt',13);return wrap(s)};
K.hourglass=v=>{let s='';
 s+=`<circle cx="180" cy="115" r="80" fill="url(#glw)" opacity=".5"/>`;
 s+=`<path d="M140 30 H220 M140 200 H220" class="vink-s" stroke-width="4" stroke-linecap="round"/>`;
 s+=`<path d="M148 34 C148 90 176 100 176 115 C176 130 148 140 148 196 H212 C212 140 184 130 184 115 C184 100 212 90 212 34Z" class="vglass"/>`;
 s+=`<path d="M153 50 H207 C204 84 184 96 180 110 C176 96 156 84 153 50Z" class="vsand"><animate attributeName="d" dur="10s" repeatCount="indefinite" values="M153 50 H207 C204 84 184 96 180 110 C176 96 156 84 153 50Z;M168 92 H192 C190 100 184 104 180 110 C176 104 170 100 168 92Z;M153 50 H207 C204 84 184 96 180 110 C176 96 156 84 153 50Z"/></path>`;
 s+=`<path d="M180 112 V190" class="vgold-s" stroke-width="1.6" stroke-dasharray="2 3"><animate attributeName="stroke-dashoffset" from="10" to="0" dur=".6s" repeatCount="indefinite"/></path>`;
 s+=`<path d="M152 192 Q180 160 208 192Z" class="vsand"><animate attributeName="d" dur="10s" repeatCount="indefinite" values="M168 192 Q180 186 192 192Z;M152 192 Q180 150 208 192Z;M168 192 Q180 186 192 192Z"/></path>`;
 s+=T(80,80,v.top||'','vt',13)+T(280,170,v.bottom||'','vt',13)+T(80,98,'NOW','vcap',8)+T(280,188,'SOON','vcap',8);return wrap(s)};
K.masks=v=>{let s='';
 const face=(cx,happy,cls)=>`<path d="M${cx-38} 70 Q${cx} 54 ${cx+38} 70 Q${cx+40} 130 ${cx} 160 Q${cx-40} 130 ${cx-38} 70Z" class="${cls}"/>
 <path d="M${cx-24} 96 q8 ${happy?-8:8} 16 0 M${cx+8} 96 q8 ${happy?-8:8} 16 0" class="vbg-f" stroke="var(--bg)" stroke-width="5" fill="none" stroke-linecap="round"/>
 <path d="M${cx-18} ${happy?122:132} Q${cx} ${happy?140:116} ${cx+18} ${happy?122:132}" stroke="var(--bg)" stroke-width="5" fill="none" stroke-linecap="round"/>`;
 s+=`<g><g transform="rotate(-10 130 110)">${face(130,true,'vgold-f')}</g><animateTransform attributeName="transform" type="rotate" values="-3 130 110;3 130 110;-3 130 110" dur="6s" repeatCount="indefinite"/></g>`;
 s+=`<g><g transform="rotate(10 230 110)">${face(230,false,'vcrim-f')}</g><animateTransform attributeName="transform" type="rotate" values="3 230 110;-3 230 110;3 230 110" dur="6s" repeatCount="indefinite"/></g>`;
 s+=`<path d="M100 170 Q180 200 260 170" class="vgold-s" fill="none" stroke-width="1.5"/>`;
 s+=T(120,206,v.comic||'','vt',13)+T(240,206,v.tragic||'','vt',13);return wrap(s)};
K.tide=v=>{const it=v.items||[];let s='';
 s+=`<circle cx="290" cy="50" r="18" class="vmoon"/><circle cx="290" cy="50" r="40" fill="url(#glw)"/>`;
 s+=`<g><path d="M-20 150 Q40 132 100 150 T220 150 T340 150 T460 150 V240 H-20Z" class="vwater"/><animateTransform attributeName="transform" type="translate" values="0 26;-60 -10;0 26" dur="10s" repeatCount="indefinite"/></g>`;
 s+=`<g><path d="M-20 168 Q40 152 100 168 T220 168 T340 168 T460 168 V240 H-20Z" fill="url(#wat)"/><animateTransform attributeName="transform" type="translate" values="-40 20;0 -6;-40 20" dur="10s" repeatCount="indefinite"/></g>`;
 s+=`<g><path d="M150 0 L210 0 L196 10 L164 10Z" class="vwood"/><path d="M180 -2 V-44" class="vink-s" stroke-width="1.6"/><path d="M182 -42 L206 -16 H182Z" class="vcard"/><animateTransform attributeName="transform" type="translate" values="0 172;0 132;0 172" dur="10s" repeatCount="indefinite"/></g>`;
 it.slice(0,3).forEach((t,i)=>{s+=`<g opacity="0">${T(60+i*120,0,t,'vmut',11.5)}<animateTransform attributeName="transform" type="translate" values="0 200;0 120" dur="10s" begin="${i*1.5}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="10s" begin="${i*1.5}s" repeatCount="indefinite"/></g>`});
 s+=T(80,40,v.label||'','vt',14,'middle')+T(80,58,'AT THE FLOOD','vcap',8);return wrap(s)};
K.ladder=v=>{const r=v.rungs||[];let s='';
 s+=`<path d="M130 210 L160 20 M230 210 L200 20" class="vwood" stroke="var(--ink2)" stroke-width="3"/>`;
 const ys=[186,140,94,48];ys.forEach((y,i)=>{const t=(210-y)/190,l=130+30*t,rr=230-30*t;s+=`<path d="M${l} ${y} H${rr}" class="vink-s" stroke-width="3"/>`+T(i%2?rr+14:l-14,y+4,pick(r,i),'vt',12,i%2?'start':'end')});
 s+=`<g><circle cx="0" cy="-22" r="7" class="vcrim-f"/><path d="M-8 0 Q0 -16 8 0Z" class="vcrim-f"/><animateMotion dur="9s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;.6;.8;1" calcMode="linear" path="M180 186 L180 48"/></g>`;
 s+=`<circle cx="180" cy="24" r="22" fill="url(#glw)"><animate attributeName="opacity" values=".3;1;.3" dur="9s" repeatCount="indefinite"/></circle>`;return wrap(s)};
K.rain=v=>{const it=v.items||[];let s='';
 s+=`<path d="M70 40 q10 -24 36 -16 q14 -20 38 -6 q24 -8 30 14 q20 4 12 22 H76 q-20 -4 -6 -14Z" class="vcloud"/><path d="M190 34 q10 -20 32 -14 q14 -16 34 -4 q22 -4 26 14 q16 6 8 20 H196 q-16 -4 -6 -16Z" class="vcloud"/>`;
 for(let i=0;i<22;i++){const x=80+((i*37)%200),d=1.4+(i%4)*.25;s+=`<path d="M${x} 60 l-2 8" class="vgold-s" stroke-width="1.6" stroke-linecap="round" opacity=".8"><animateTransform attributeName="transform" type="translate" values="0 0;-10 120" dur="${d}s" begin="${(i%7)*.2}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.9;0" dur="${d}s" begin="${(i%7)*.2}s" repeatCount="indefinite"/></path>`}
 s+=`<path d="M20 190 H340" class="vmut-s" opacity=".5"/>`;
 it.slice(0,3).forEach((t,i)=>{s+=`<g>${T(70+i*110,182,t,'vt',12)}<animate attributeName="opacity" values=".5;1;.5" dur="4s" begin="${i}s" repeatCount="indefinite"/></g>`});
 s+=T(180,214,v.label||'','vgold-t',13);return wrap(s)};
K.eye=v=>{const it=v.items||[];let s='';
 s+=`<circle cx="180" cy="110" r="70" class="vgem-glow"><animate attributeName="r" values="60;78;60" dur="5s" repeatCount="indefinite"/></circle>`;
 s+=`<path d="M100 110 Q180 50 260 110 Q180 170 100 110Z" class="vcard"/>`;
 s+=`<circle cx="180" cy="110" r="30" class="veye"><animate attributeName="r" values="26;32;26" dur="5s" repeatCount="indefinite"/></circle><circle cx="180" cy="110" r="12" class="vink-f"/><circle cx="188" cy="102" r="4" fill="#fff" opacity=".8"/>`;
 it.slice(0,3).forEach((t,i)=>{const sx=[30,330,180][i],sy=[50,60,215][i];s+=`<g>${T(0,0,t,'vmut',11.5)}<animateTransform attributeName="transform" type="translate" values="${sx} ${sy};180 114" dur="6s" begin="${i*2}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.2;.8;1" dur="6s" begin="${i*2}s" repeatCount="indefinite"/></g>`});
 s+=T(180,30,v.label||'','vt',13)+T(180,196,'IT FEEDS ON WHAT IT SEES','vcap',8);return wrap(s)};
K.rose=v=>{let s='';
 s+=`<path d="M180 210 C176 170 186 150 180 120" class="vgreen-s" fill="none"/><path d="M180 172 q-24 -6 -30 -24 q22 2 30 24z M181 160 q20 -10 32 -2 q-14 14 -32 2z" class="vgreen-f"/>`;
 s+=`<circle cx="180" cy="96" r="60" fill="url(#glw)" opacity=".6"/>`;
 for(let i=0;i<6;i++){const a=i*60;s+=`<g transform="rotate(${a} 180 96)"><ellipse cx="180" cy="80" rx="14" ry="22" class="vpetal"><animate attributeName="cy" values="92;76;92" dur="8s" repeatCount="indefinite"/></ellipse></g>`}
 s+=`<circle cx="180" cy="96" r="12" class="vcrim-f"/><circle cx="180" cy="96" r="5" class="vgold-f"/>`;
 s+=T(180,226,v.label||'','vt',13);return wrap(s)};
K.storm=v=>{const w=v.words||[];let s='';
 s+=`<path d="M40 50 q14 -30 50 -20 q20 -26 54 -8 q34 -10 42 18 q30 6 16 30 H48 q-28 -4 -8 -20Z" class="vcloud"/><path d="M180 44 q14 -26 46 -18 q20 -22 48 -4 q30 -6 36 18 q24 8 12 28 H186 q-22 -4 -6 -24Z" class="vcloud"/>`;
 s+=`<path d="M150 74 L136 112 H152 L140 150 L172 102 H156 L168 74Z" class="vbolt"><animate attributeName="opacity" values="0;0;1;0;1;0;0" keyTimes="0;.6;.62;.66;.68;.72;1" dur="5s" repeatCount="indefinite"/></path>`;
 w.slice(0,3).forEach((t,i)=>{s+=`<g opacity="0">${T(0,0,t,'vmut',11.5)}<animateTransform attributeName="transform" type="translate" values="-40 ${110+i*20};400 ${100+i*22}" dur="6s" begin="${i*2}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="6s" begin="${i*2}s" repeatCount="indefinite"/></g>`});
 s+=`<path d="M120 200 L160 170 L190 186 L230 160 L260 200Z" class="vrock"/><circle cx="215" cy="176" r="18" fill="url(#glw)"/>`;
 s+=T(190,222,v.label||'','vt',13);return wrap(s)};
K.mirror=v=>{let s='';
 s+=`<ellipse cx="240" cy="102" rx="58" ry="78" class="vcard"/><ellipse cx="240" cy="102" rx="58" ry="78" class="vgold-s" fill="none" stroke-width="4"/><ellipse cx="240" cy="102" rx="48" ry="68" fill="url(#glw)" opacity=".5"/>`;
 s+=`<g><circle cx="100" cy="92" r="14" class="vink-f"/><path d="M78 170 Q80 118 100 112 Q120 118 122 170Z" class="vink-f"/></g>`;
 s+=`<g opacity=".55"><circle cx="240" cy="86" r="13" class="vgold-f"/><path d="M220 158 Q222 112 240 106 Q258 112 260 158Z" class="vgold-f"/><animate attributeName="opacity" values=".25;.85;.25" dur="6s" repeatCount="indefinite"/></g>`;
 s+=`<path d="M240 180 V196 M220 196 H260" class="vgold-s" stroke-width="3"/>`;
 s+=T(100,198,v.outer||'','vt',13)+T(240,218,v.inner||'','vgold-t',13);return wrap(s)};
K.dream=v=>{let s='';
 for(let i=0;i<24;i++){const x=(i*83)%360,y=(i*41)%150;s+=`<circle cx="${x}" cy="${y}" r="${i%3?0.9:1.4}" class="vmut-f"><animate attributeName="opacity" values=".2;.9;.2" dur="${3+i%4}s" repeatCount="indefinite"/></circle>`}
 s+=`<path d="M200 50 a36 36 0 1 0 30 56 a30 30 0 1 1 -30 -56z" class="vmoon"/><circle cx="196" cy="86" r="60" fill="url(#glw)" opacity=".6"/>`;
 [[60,150,7],[200,170,9],[120,120,11]].forEach(([x,y,d],i)=>s+=`<g><path d="M${x} ${y} q10 -18 30 -10 q14 -14 32 0 q20 0 18 14 H${x-6} q-12 -4 6 -4Z" class="vcloud" opacity=".85"/><animateTransform attributeName="transform" type="translate" values="-30 0;40 0;-30 0" dur="${d*2}s" repeatCount="indefinite"/></g>`);
 s+=T(180,214,v.label||'','vt',14);return wrap(s)};
K.quill=v=>{const ln=v.lines||[];let s='';
 s+=`<clipPath id="qclip"><rect x="50" y="34" width="260" height="170" rx="6"/></clipPath><rect x="50" y="34" width="260" height="170" rx="6" class="vcard"/><g clip-path="url(#qclip)">`;
 ln.slice(0,3).forEach((t,i)=>{const y=86+i*38;s+=`<g>${T(80,y,t,'vt',15,'start','font-style="italic"')}<rect x="76" y="${y-18}" width="230" height="26" class="vbg-f" style="fill:var(--card2)"><animate attributeName="x" values="76;76;310;310" keyTimes="0;${(i*.25).toFixed(2)};${(i*.25+.25).toFixed(2)};1" dur="9s" repeatCount="indefinite"/></rect></g>`});
 s+=`</g>`;
 s+=`<g><path d="M0 0 L-6 -10 C10 -40 40 -64 70 -70 C56 -44 30 -20 -2 -8Z" class="vgold-f"/><path d="M0 0 L-6 -10" class="vink-s" stroke-width="2"/><animateMotion dur="9s" repeatCount="indefinite" keyTimes="0;.25;.26;.5;.51;.75;1" keyPoints="0;.33;.33;.66;.66;1;1" path="M80 92 L300 92 M80 130 L300 130 M80 168 L300 168" calcMode="linear"/></g>`;
 return wrap(s)};
K.globe=v=>{let s='';
 s+=`<rect x="0" y="0" width="360" height="190" class="vdawn"/>`;
 s+=`<path d="M90 190 V110 L180 84 L270 110 V190Z" class="vwood"/><path d="M80 112 L180 70 L280 112 L270 120 L180 84 L90 120Z" class="vthatch"/>`;
 for(let i=0;i<6;i++){s+=`<path d="M${104+i*30} 124 V190" stroke="var(--ink2)" stroke-width="1.5" opacity=".5"/>`}
 for(let i=0;i<5;i++){s+=`<rect x="${112+i*30}" y="140" width="12" height="18" rx="6" class="vgold-f" opacity=".5"><animate attributeName="opacity" values=".3;.8;.3" dur="${3+i}s" repeatCount="indefinite"/></rect>`}
 s+=`<path d="M180 70 V36" class="vink-s" stroke-width="2"/><path d="M181 36 Q196 32 210 38 Q196 44 181 46Z" class="vcrim-f"><animate attributeName="d" dur="2s" repeatCount="indefinite" values="M181 36 Q196 32 210 38 Q196 44 181 46Z;M181 36 Q196 40 210 34 Q196 48 181 46Z;M181 36 Q196 32 210 38 Q196 44 181 46Z"/></path>`;
 s+=`<rect x="0" y="190" width="360" height="40" class="vland"/>`+T(180,214,v.label||'','vt',13);return wrap(s)};
window.Visual={render(v){try{return (K[v&&v.kind]||K.globe)(v||{})}catch(e){console.error(e);return K.globe({label:''})}},kinds:Object.keys(K)};
})();
