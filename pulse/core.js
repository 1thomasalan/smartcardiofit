// Pulse core: pure data logic (CSV parse, Meta mapping, ranges, stats). No DOM.
(function(G){
const P={};
P.parseCSV=function(text){
  if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
  const rows=[];let row=[],f='',q=false,i=0,n=text.length;
  while(i<n){const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i+=2;continue;} q=false;i++;continue;} f+=c;i++;continue;}
    if(c==='"'){q=true;i++;continue;}
    if(c===','){row.push(f);f='';i++;continue;}
    if(c==='\r'){i++;continue;}
    if(c==='\n'){row.push(f);rows.push(row);row=[];f='';i++;continue;}
    f+=c;i++;}
  if(f!==''||row.length){row.push(f);rows.push(row);}
  return rows;
};
const num=v=>{if(v==null||v==='')return 0;const x=parseFloat(String(v).replace(/,/g,''));return isNaN(x)?0:x};
// Meta "MM/DD/YYYY HH:MM" in US Pacific -> UTC ms
function laOffsetMin(ms){
  const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(new Date(ms));
  const g=t=>+p.find(x=>x.type===t).value;
  const asUTC=Date.UTC(g('year'),g('month')-1,g('day'),g('hour')%24,g('minute'));
  return (asUTC-ms)/60000;
}
P.pacificToUTC=function(s){
  const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/.exec(s||'');if(!m)return null;
  const guess=Date.UTC(+m[3],+m[1]-1,+m[2],+m[4],+m[5]);
  let ms=guess-laOffsetMin(guess)*60000; ms=guess-laOffsetMin(ms)*60000; return ms;
};
const JSTD=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'});
P.jstKey=ms=>JSTD.format(new Date(ms));
P.todayKey=()=>P.jstKey(Date.now());
P.mapRows=function(rows){
  const h=rows[0].map(x=>x.trim());const ix=k=>h.indexOf(k);
  const plat=ix('Account username')>=0?'ig':(ix('Page name')>=0?'fb':null);
  if(!plat) throw new Error('Not a Meta Business Suite post export');
  const col=k=>{const j=ix(k);return r=>j>=0?r[j]:''};
  const id=col('Post ID'),page=plat==='ig'?col('Account username'):col('Page name'),link=col('Permalink'),type=col('Post type'),
    pt=col('Publish time'),title=col('Title'),desc=col('Description'),views=col('Views'),reach=col('Reach'),
    rx=plat==='ig'?col('Likes'):col('Reactions'),cm=col('Comments'),sh=col('Shares'),sv=col('Saves'),lc=col('Link Clicks'),fo=col('Follows'),tc=col('Total clicks');
  const out=[];
  for(let k=1;k<rows.length;k++){const r=rows[k];if(!r||r.length<3||!id(r))continue;
    const t=P.pacificToUTC(pt(r));if(t==null)continue;
    let cap=(title(r)||'');const d2=desc(r)||'';cap=cap&&d2?cap+' — '+d2:(cap||d2);
    out.push({id:id(r),plat,page:page(r)||'',link:link(r),type:type(r),t,d:P.jstKey(t),cap:cap.replace(/\s+/g,' ').trim().slice(0,280),
      v:num(views(r)),re:num(reach(r)),rx:num(rx(r)),cm:num(cm(r)),sh:num(sh(r)),sv:num(sv(r)),lc:num(lc(r)),tc:num(tc(r)),fo:num(fo(r))});
  }
  return {plat,rows:out};
};
P.merge=function(existing,incoming){const m=new Map(existing.map(r=>[r.id,r]));let add=0,upd=0;
  for(const r of incoming){if(m.has(r.id)){upd++;const o=m.get(r.id);if(!r.re&&o.re)r.re=o.re;}else add++;m.set(r.id,r);}
  return {posts:[...m.values()],add,upd};
};
// date keys
const toD=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))};
const toK=d=>d.toISOString().slice(0,10);
P.addDays=(k,n)=>{const d=toD(k);d.setUTCDate(d.getUTCDate()+n);return toK(d)};
P.daysBetween=(a,b)=>Math.round((toD(b)-toD(a))/864e5)+1;
P.preset=function(name,today){today=today||P.todayKey();const d=toD(today);const y=d.getUTCFullYear(),m=d.getUTCMonth();
  let s,e,cs,ce;
  if(name==='lastweek'){const dow=(d.getUTCDay()+6)%7;e=P.addDays(today,-dow-1);s=P.addDays(e,-6);}
  else if(name==='7'){e=P.addDays(today,-1);s=P.addDays(e,-6);}
  else if(name==='30'){e=P.addDays(today,-1);s=P.addDays(e,-29);}
  else if(name==='month'){s=toK(new Date(Date.UTC(y,m,1)));e=today;cs=toK(new Date(Date.UTC(y,m-1,1)));ce=toK(new Date(Date.UTC(y,m,0)));}
  else if(name==='lastmonth'){s=toK(new Date(Date.UTC(y,m-1,1)));e=toK(new Date(Date.UTC(y,m,0)));cs=toK(new Date(Date.UTC(y,m-2,1)));ce=toK(new Date(Date.UTC(y,m-1,0)));}
  else if(name==='ytd'){s=y+'-01-01';e=today;cs=(y-1)+'-01-01';ce=(y-1)+e.slice(4);}
  if(!cs){const n=P.daysBetween(s,e);ce=P.addDays(s,-1);cs=P.addDays(ce,-(n-1));}
  return {s,e,cs,ce};
};
P.compareFor=function(s,e){const n=P.daysBetween(s,e);const ce=P.addDays(s,-1);return {cs:P.addDays(ce,-(n-1)),ce}};
P.eng=r=>r.rx+r.cm+r.sh+r.sv;
const med=a=>{if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y);const h=b.length>>1;return b.length%2?b[h]:(b[h-1]+b[h])/2};
P.median=med;
P.filter=(posts,s,e,f)=>posts.filter(r=>r.d>=s&&r.d<=e&&(!f||f==='all'||r.plat===f));
P.totals=function(list){const t={n:list.length,v:0,e:0,lc:0,fo:0,fb:{n:0,v:0,e:0},ig:{n:0,v:0,e:0}};
  for(const r of list){const e=P.eng(r);t.v+=r.v;t.e+=e;t.lc+=r.lc;t.fo+=r.fo;const p=t[r.plat];p.n++;p.v+=r.v;p.e+=e;}
  t.med=med(list.map(r=>r.v));t.epk=t.v?t.e/t.v*1000:0;return t;};
P.series=function(list,s,e){const n=P.daysBetween(s,e);const step=n>120?'month':(n>45?'week':'day');const b=new Map();
  const keyOf=d=>{if(step==='day')return d;if(step==='month')return d.slice(0,7)+'-01';const dt=toD(d);const dow=(dt.getUTCDay()+6)%7;return P.addDays(d,-dow)};
  let k=keyOf(s);while(k<=e){b.set(k,{k,fb:0,ig:0});k=step==='day'?P.addDays(k,1):step==='week'?P.addDays(k,7):(()=>{const d=toD(k);d.setUTCMonth(d.getUTCMonth()+1);return toK(d)})();}
  for(const r of list){const x=b.get(keyOf(r.d));if(x)x[r.plat]+=r.v;}
  return {step,pts:[...b.values()]};};
P.byPage=function(list){const m=new Map();for(const r of list){const k=r.plat+'|'+r.page;if(!m.has(k))m.set(k,{plat:r.plat,page:r.page,rows:[]});m.get(k).rows.push(r);}
  return [...m.values()].map(g=>({...g,...P.totals(g.rows)})).sort((a,b)=>b.v-a.v);};
P.byType=function(list){const m=new Map();for(const r of list){const k=r.plat+'|'+r.type;if(!m.has(k))m.set(k,[]);m.get(k).push(r);}
  return [...m.entries()].map(([k,rows])=>({plat:k.split('|')[0],type:k.split('|')[1],n:rows.length,med:med(rows.map(r=>r.v)),epk:(()=>{const v=rows.reduce((a,r)=>a+r.v,0);return v?rows.reduce((a,r)=>a+P.eng(r),0)/v*1000:0})()})).filter(x=>x.n>=3).sort((a,b)=>b.med-a.med);};
P.fmt=n=>{n=+n||0;if(n>=1e6)return (n/1e6).toFixed(n>=1e7?1:2).replace(/\.?0+$/,'')+'M';if(n>=1e4)return Math.round(n/1e3)+'K';if(n>=1e3)return (n/1e3).toFixed(1).replace(/\.0$/,'')+'K';return Math.round(n).toLocaleString('en-US')};
P.pct=(a,b)=>b?((a-b)/b*100):null;
P.short=p=>(p||'').replace(/^MCCS Okinawa\s*-\s*/,'').replace(/^MCCS Okinawa /,'')||'MCCS Okinawa';
P.label=r=>{const c=(r.cap||'').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'').replace(/\s+/g,' ').trim();const s=c.split(/(?<=[.!?])\s|—/)[0]||c;return s.length>60?s.slice(0,58).trim()+'…':(s||'Untitled post')};
P.fmtDate=(k,o)=>toD(k).toLocaleDateString('en-US',Object.assign({timeZone:'UTC',month:'short',day:'numeric'},o||{}));
P.rangeLabel=(s,e)=>{const sy=s.slice(0,4),ey=e.slice(0,4);return sy===ey?`${P.fmtDate(s)} – ${P.fmtDate(e)}, ${ey}`:`${P.fmtDate(s,{year:'numeric'})} – ${P.fmtDate(e,{year:'numeric'})}`};
P.summary=function(cur,prev,list,s,e){const out=[],next=[];const d=P.pct(cur.v,prev.v);
  out.push(`Posts earned ${P.fmt(cur.v)} views across ${cur.n} posts${d!=null&&prev.n?`, ${d>=0?'up':'down'} ${Math.abs(d).toFixed(1)}% from the prior period`:''}.`);
  if(cur.ig.n&&cur.fb.n){const pp=cur.ig.n/cur.n*100,pe=cur.e?cur.ig.e/cur.e*100:0;out.push(`Instagram delivered ${pe.toFixed(0)}% of engagement from ${pp.toFixed(0)}% of posts.`);
    if(pe>pp*2)next.push('Move more effort to Instagram, especially carousels and reels.');}
  const top=[...list].sort((a,b)=>b.v-a.v)[0];if(top)out.push(`Top post: “${P.label(top)}” (${P.short(top.page)}) with ${P.fmt(top.v)} views.`);
  const lcTop=[...list].sort((a,b)=>b.lc-a.lc)[0];if(lcTop&&lcTop.lc>0&&cur.lc)out.push(`${cur.lc.toLocaleString('en-US')} link clicks; “${P.label(lcTop)}” drove ${Math.round(lcTop.lc/cur.lc*100)}% of them.`);
  const fb=list.filter(r=>r.plat==='fb').sort((a,b)=>b.v-a.v);if(fb.length>=20){const k=Math.ceil(fb.length/10);const sh=fb.slice(0,k).reduce((a,r)=>a+r.v,0)/(cur.fb.v||1)*100;if(sh>35)next.push(`Post fewer, stronger Facebook posts: the top 10% earned ${sh.toFixed(0)}% of views.`);}
  const ty=P.byType(list)[0];if(ty)next.push(`Lean into ${ty.type.replace(/^IG /,'Instagram ')}s: best median views (${P.fmt(ty.med)}).`);
  return {out:out.slice(0,3),next:next.slice(0,3)};
};
G.Pulse=P;
})(typeof window!=='undefined'?window:globalThis);
