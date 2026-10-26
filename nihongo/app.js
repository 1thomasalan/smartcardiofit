// Japanese Daily Practice — one pattern a day. Plain JS; everything stays on this phone.
(function(){
const LS='nihongo.v1',$=id=>document.getElementById(id),Ls=window.LESSONS,N=Ls.length,STG=window.STAGES;
const DEF={les:{},activity:{},today:{},early:{},settings:{theme:'auto',voice:'',rate:.8,help:true,bell:true,vibrate:false,sayit:true,ahead:false,k:1}};
let S;try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(LS)||'{}'));S.settings=Object.assign({},DEF.settings,S.settings||{})}catch(e){S=JSON.parse(JSON.stringify(DEF))}
const save=()=>localStorage.setItem(LS,JSON.stringify(S));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ymd(d)};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2400)};
const buzz=p=>{if(S.settings.vibrate&&navigator.vibrate)navigator.vibrate(p)};
const PART=new Set(['は','を','に','が','で','と','の','か','ね','まで','から','も']);
const L$=n=>Ls[n-1];
const les=n=>S.les[n]||(S.les[n]={days:[],rating:null,ratedOn:null,check:false,mastered:null,srs:null});

// ---------- theme ----------
function applyTheme(){const t=S.settings.theme;let th=t;if(t==='auto'){const h=new Date().getHours();th=(h<6||h>=19)?'sumi':'washi'}
 document.body.dataset.theme=th;document.querySelector('meta[name=theme-color]').content=th==='sumi'?'#17171a':'#f3eee3';
 document.documentElement.style.setProperty('--k',S.settings.k)}
applyTheme();setInterval(applyTheme,60000);
document.body.insertAdjacentHTML('afterbegin',window.BRUSH_DEFS);
$('brandEnso').innerHTML=`<path d="${ensoPath(50,50,38,-1.8,5.5,1.5,9,7)}" class="ensof"/><rect x="62" y="60" width="18" height="18" rx="2" class="seal"/>`;

// ---------- sentences ----------
function sentence(L,i){const w=L.w[i];const toks=[];
 L.p.forEach(t=>{if(t==='_')toks.push({k:w[0],r:w[1],fill:1});else toks.push({k:t[0],r:t[1],p:PART.has(t[0]),h:(L.hl||[]).includes(t[0])})});
 if((L.hl||[]).includes(w[0]))toks.forEach(t=>{if(t.fill)t.h=1});
 const q=/\?$/.test(L.pe);
 let ro=toks.map(t=>t.r).join(' ');ro=ro.charAt(0).toUpperCase()+ro.slice(1)+(q?'?':'.');
 let en=L.se?L.se[i]:L.pe.replace('___',w[3]||w[2].toLowerCase());en=en.charAt(0).toUpperCase()+en.slice(1);
 return {toks,kana:toks.map(t=>t.k).join(' ')+'。',say:toks.map(t=>t.k).join('')+'。',ro,en}}
function patternTok(L){return L.p.map(t=>t==='_'?{blank:1}:{k:t[0],r:t[1],p:PART.has(t[0]),h:(L.hl||[]).includes(t[0])})}
function jpHTML(toks){const L=toks.length-1;return toks.map((t,i)=>{const e=i===L?'<span class="end">。</span>':'';return '<span class="w">'+(t.blank?'<span class="blank">＿＿</span>':`<span class="${t.p?'p':''} ${t.h?'h':''} ${t.fill?'fill':''}">${esc(t.k)}</span>`)+e+'</span>'}).join(' ')}
function patternRo(L){let r=L.p.map(t=>t==='_'?'___':t[1]).join(' ');return r.charAt(0).toUpperCase()+r.slice(1)+(/\?$/.test(L.pe)?'?':'.')}
function patternSay(L){return L.p.map(t=>t==='_'?'、':t[0]).join('')+'。'}

// ---------- progress ----------
const today=()=>ymd();
function currentN(){for(let n=1;n<=N;n++)if(!les(n).mastered)return n;return N+1}
function waitingForTomorrow(cur){if(cur<2||cur>N)return false;const p=les(cur-1);return p.mastered===today()&&!S.settings.ahead&&!S.early[cur]}
function markActive(n){const t=today();S.activity[t]=true;const l=les(n);if(!l.days.includes(t))l.days.push(t);save();renderStreak()}
function streak(){let n=0,d=today();if(!S.activity[d])d=addDays(d,-1);while(S.activity[d]){n++;d=addDays(d,-1)}return n}
function bestStreak(){const ds=Object.keys(S.activity).sort();let b=0,c=0,prev=null;ds.forEach(d=>{c=prev&&addDays(prev,1)===d?c+1:1;b=Math.max(b,c);prev=d});return b}
const IV=[1,3,7,14,30,60];
function master(n,how){const l=les(n);if(l.mastered)return;l.mastered=today();l.how=how;l.srs={stage:0,due:addDays(today(),IV[0])};markActive(n);save();if(S.settings.bell)bell();buzz([30,60,30])}
function dueList(){const t=today(),cur=currentN();return Object.keys(S.les).map(Number).filter(n=>{const l=S.les[n];return l.mastered&&l.srs&&l.srs.due<=t&&n!==cur-1}).sort((a,b)=>S.les[a].srs.due<S.les[b].srs.due?-1:1)}
const BS={};function dayState(n,mode){if(mode==='browse')return BS[n]||(BS[n]={reps:{},steps:[0,0,0,0],hide:{},timer:0});const t=today();if(S.today.date!==t||S.today.n!==n)S.today={date:t,n,reps:{},steps:[0,0,0,0],hide:{},timer:0};return S.today}

// ---------- audio ----------
let ac;function actx(){ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}
function bell(g=.5){try{const a=actx(),t=a.currentTime,out=a.createGain();out.gain.value=g;out.connect(a.destination);
 [[1,1,6],[2.76,.45,4],[5.4,.2,2.5],[1.004,.6,6]].forEach(([r,amp,dec])=>{const o=a.createOscillator(),gg=a.createGain();o.type='sine';o.frequency.value=392*r;gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(amp*.2,t+.01);gg.gain.exponentialRampToValueAtTime(.0001,t+dec);o.connect(gg);gg.connect(out);o.start(t);o.stop(t+dec)})}catch(e){}}
let voices=[],AUDIO={};
function loadVoices(){voices=(speechSynthesis.getVoices()||[]).filter(v=>/^ja/i.test(v.lang)||/japan|日本/i.test(v.name));if(document.querySelector('#v-settings.on'))renderSettings()}
if('speechSynthesis' in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
function voiceScore(v){const n=v.name;let s=0;if(/natural|online|neural/i.test(n))s+=8;if(/nanami|keita|aoi|daichi|mayu|naoki|shiori/i.test(n))s+=5;if(/google/i.test(n))s+=4;if(/kyoko|o-ren|hattori/i.test(n))s+=3;if(v.localService)s+=1;return s}
function pickVoice(){if(S.settings.voice){const v=voices.find(x=>x.name===S.settings.voice);if(v)return v}return voices.slice().sort((a,b)=>voiceScore(b)-voiceScore(a))[0]||null}
fetch('audio/map.json').then(r=>r.ok?r.json():{}).then(j=>{AUDIO=j||{}}).catch(()=>{});
let curEl=null,audioEl=null;
function stopSpeak(){try{speechSynthesis.cancel()}catch(e){}if(audioEl){audioEl.pause();audioEl=null}if(curEl){curEl.classList.remove('speaking');curEl=null}}
function speak(text,el){stopSpeak();const key=text.replace(/[\s　]/g,'');if(el){curEl=el;el.classList.add('speaking')}
 const done=()=>{if(el)el.classList.remove('speaking')};
 if(AUDIO[key]){audioEl=new Audio('audio/'+AUDIO[key]);audioEl.playbackRate=S.settings.rate<.7?.85:1;audioEl.onended=done;audioEl.play().catch(()=>tts(key,done));return}
 tts(key,done)}
function tts(text,done){if(!('speechSynthesis' in window)){toast('No Japanese voice on this device');done();return}
 const u=new SpeechSynthesisUtterance(text);const v=pickVoice();if(v)u.voice=v;u.lang='ja-JP';u.rate=S.settings.rate;u.onend=done;u.onerror=done;speechSynthesis.speak(u);
 if(!voices.length)setTimeout(()=>{if(!pickVoice())toast('Tip: add a Japanese voice in Android text-to-speech settings')},1500)}
document.addEventListener('click',e=>{const t=e.target.closest('[data-say]');if(!t)return;e.stopPropagation();speak(t.dataset.say,t.closest('.speakable')||t)});

// ---------- speech recognition ("Say it") ----------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const kata2hira=s=>s.replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const norm=s=>kata2hira(String(s)).replace(/[\s　。、．，？?！!「」]/g,'');
function scoreHeard(heard,toks){const h=norm(heard);const content=toks.filter(t=>!t.p&&!/^です/.test(t.k));if(!content.length)return 0;
 let hit=0;content.forEach(t=>{const k=norm(t.k),j=window.KJ[t.k];if(h.includes(k)||(j&&h.includes(norm(j)))||(j&&h.includes(j.replace(/ます$/,''))))hit++});return hit/content.length}
function sayIt(sObj,box,cb){if(!SR){toast('Speech check needs Chrome');return}
 const r=new SR();r.lang='ja-JP';r.maxAlternatives=5;r.interimResults=false;box.innerHTML='<span class="small">Listening… say it now</span>';
 r.onresult=ev=>{const alts=[...ev.results[0]].map(a=>a.transcript);let best=0,bt=alts[0];alts.forEach(a=>{const sc=scoreHeard(a,sObj.toks);if(sc>best){best=sc;bt=a}});
  const ok=best>=.7;box.innerHTML=`Heard: ${esc(bt)} <span class="small">(you said “${esc(sObj.en)}”)</span><br>${ok?'<b>That matches. Nice.</b>':'<span class="no">Not quite. Tap the line to listen, then try again.</span>'}`;if(ok){buzz(25)}cb&&cb(ok)};
 r.onerror=e=>{box.innerHTML=`<span class="no">${e.error==='not-allowed'?'Microphone blocked. Allow it in Chrome site settings.':'Didn’t catch that. Try again.'}</span>`};
 r.onnomatch=()=>{box.innerHTML='<span class="no">Didn’t catch that. Try again.</span>'};
 try{r.start()}catch(e){}}

// ---------- icons ----------
const SPK='<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const MIC='<svg viewBox="0 0 24 24" width="13" height="13" style="vertical-align:-2px"><path fill="currentColor" d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 9a7 7 0 0 0 14 0h-2a5 5 0 0 1-10 0zm6 8h2v-2h-2z"/></svg>';
const RATE_ICONS={shaky:'M20 50 Q30 38 40 50 Q50 62 60 50 Q70 38 80 50',getting:'M18 62 Q40 60 52 46 Q62 36 82 34',auto:''};
function rateSvg(k){if(k==='auto')return `<svg viewBox="0 0 100 100"><path d="${ensoPath(50,50,34,-1.8,5.7,1,7,2)}" class="ensof"/></svg>`;return `<svg viewBox="0 0 100 100"><path d="${RATE_ICONS[k]}" class="is" filter="url(#brush)"/></svg>`}

// ---------- streak pill ----------
function renderStreak(){const s=streak();$('streakPill').innerHTML=`<svg viewBox="0 0 100 100" width="16" height="16"><path d="${ensoPath(50,50,36,-1.8,5.6,1,10,1)}" class="ensof"/></svg><b>${s}</b> day${s===1?'':'s'}`;
 $('revDot').hidden=!dueList().length}

// ---------- TODAY ----------
let timerInt=null;
function renderToday(){const cur=currentN(),v=$('v-today');clearInterval(timerInt);
 if(cur>N){v.innerHTML=`<div class="done card"><div class="big">${motif('star')}</div><h1>All 60 patterns, mastered.</h1><p class="sub">おめでとう ございます. Omedetō gozaimasu. Congratulations. Keep your reviews going and revisit any pattern from the Journey.</p></div>`;return}
 if(waitingForTomorrow(cur)){const P=L$(cur-1),Nx=L$(cur);
  v.innerHTML=`<div class="done"><div class="big"><svg viewBox="0 0 200 200"><path d="${ensoPath(100,100,80,-1.7,5.6,1,12,cur)}" class="ensof"/><g transform="translate(70 70) scale(.6)" filter="url(#brush)">${motif('star').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></svg></div>
  <p class="eyebrow">Day ${cur-1} · mastered today</p><h1>${esc(P.t)}</h1><p class="sub">Beautiful work. Let it settle tonight. Tomorrow you’ll warm up with it, then meet:</p>
  <div class="card mt" style="text-align:left"><span class="badge">Day ${cur} · opens tomorrow</span><div style="font-size:20px;margin-top:8px">${esc(Nx.t)}</div></div>
  ${dueList().length?`<button class="btn shu mt" id="goRev">Do your ${dueList().length} review${dueList().length>1?'s':''}</button><br>`:''}
  <button class="link mt" id="early" style="margin-top:22px">I’d rather start Day ${cur} now</button></div>`;
  $('early').onclick=()=>{S.early[cur]=true;save();renderToday()};if($('goRev'))$('goRev').onclick=()=>show('review');return}
 v.innerHTML=lessonHTML(cur,'today');wireLesson(cur,'today')}

function lessonHTML(n,mode){const L=L$(n),l=les(n),ds=dayState(n,mode),t=today();const pd=l.days.includes(t)?l.days.length:l.days.length+1;
 const sents=L.w.map((_,i)=>sentence(L,i));const pt=patternTok(L);
 const warm=(mode==='today'&&n>1&&les(n-1).mastered&&!l.days.includes(t)&&pd===1)?warmHTML(n-1):'';
 const browse=mode==='browse';
 const h=S.settings.help;
 return `${browse?`<button class="link" id="back" style="margin:4px 0 14px">← Back</button>`:''}
 <div class="lesson"><div class="left">
  <p class="eyebrow">Day ${n} of ${N} · ${esc(STG[L.st])}</p>
  <h1>${esc(L.t)}</h1>
  <p class="small">${l.mastered?`<span class="badge shu">Mastered</span>`:`<span class="badge">Practice day ${Math.min(pd,9)}${pd<=3?' of 3':''}</span>`} Today’s lesson</p>
  <div class="hero">${scene(L,n)}</div>
  <div class="card pattern speakable"><p class="eyebrow">The pattern</p>
   <div><span class="jp" data-say="${esc(patternSay(L))}">${jpHTML(pt)}</span><button class="say" data-say="${esc(patternSay(L))}" aria-label="Listen">${SPK}</button></div>
   <div class="ro">${esc(patternRo(L))}</div><div class="en">${esc(L.pe)}</div>
   <div class="legend"><span><i style="background:var(--shu)"></i>little words (particles)</span><span><i style="background:var(--ai)"></i>your word</span></div>
  </div>
 </div><div class="right">
  ${warm}
  <div class="sec"><span class="n">1</span><h2>Learn just 3 words</h2></div>
  <div class="words">${L.w.map(w=>`<div class="word speakable" data-say="${esc(w[0])}">${motif(w[4],w[0])}<div class="k">${esc(w[0])}</div><div class="r">${esc(w[1])}</div><div class="e">${esc(w[2])}</div></div>`).join('')}</div>
  <div class="sec"><span class="n">2</span><h2>Practice: say these out loud</h2></div>
  <p class="small" style="margin:-6px 0 10px">Read each sentence three times, slowly. Tap a circle each time.</p>
  <div class="card">${sents.map((s,i)=>{const hid=ds.hide[i]!==undefined?ds.hide[i]:!h;const r=ds.reps[i]||0;return `<div class="sent ${hid?'hide':''}" data-i="${i}"><span class="num">${i+1}</span><div class="body speakable">
    <div><span class="jp" data-say="${esc(s.say)}">${jpHTML(s.toks)}</span><button class="say" data-say="${esc(s.say)}" aria-label="Listen">${SPK}</button></div>
    <div class="ro">${esc(s.ro)}</div><div class="en">${esc(s.en)}</div>
    <div class="reps">${[0,1,2].map(k=>`<button class="rep ${k<r?'on':''}" data-rep="${i}">${k+1}</button>`).join('')}
     <button class="chip ${hid?'on':''}" data-hide="${i}">${hid?'Show help':'Hide help'}</button>
     ${SR&&S.settings.sayit?`<button class="chip mic" data-sayit="${i}">${MIC} Say it</button>`:''}</div>
    <div class="heard" id="heard${i}"></div></div></div>`}).join('')}</div>
  <div class="sec"><span class="n">3</span><h2>Your five-minute routine</h2></div>
  <div class="card">${['Read the pattern out loud 3 times.','Say the 3 sentences out loud.','Look away and say them from memory.','Say one while actually doing it.'].map((s,i)=>`<div class="step ${ds.steps[i]?'on':''}" data-step="${i}"><span class="tick"></span><span class="ic">${motif(['book','talk','eye',L.sc][i])}</span><span class="tx">${s}</span></div>`).join('')}
   <div class="timer"><button id="tbtn" aria-label="Five-minute timer">${ensoProgress((ds.timer||0)/300)}</button><div class="tlabel"><b id="tval">${fmt(300-(ds.timer||0))}</b>Tap the circle for a quiet 5-minute timer</div></div></div>
  <div class="sec"><span class="n">4</span><h2>The one thing to remember today</h2></div>
  <div class="card remember"><div class="hanko" style="font-size:24px">1</div><p>${esc(L.tip)}</p></div>
  <p class="note">Tomorrow, <b>repeat this same lesson</b> before anything new. Stay on a pattern up to 3 days if you need to. Repetition is the whole method.</p>
  ${l.mastered&&browse?'':`<div class="sec"><span class="n">5</span><h2>How did it feel?</h2></div>
  <div class="rate">${[['shaky','Shaky','still reading'],['getting','Getting there','mostly smooth'],['auto','Automatic','comes out on its own']].map(([k,a,b])=>`<button data-rate="${k}" class="${l.ratedOn===t&&l.rating===k?'on':''}">${rateSvg(k)}${a}<small>${b}</small></button>`).join('')}</div>
  <div id="rateMsg"></div>
  <div class="card mt ctr"><p class="sub" style="margin:0 0 12px">Or prove it with a short recall check: listen and pick, English to Japanese, then say one from memory.</p><button class="btn" id="chk">Take the recall check</button></div>`}
 </div></div>`}
function warmHTML(p){const P=L$(p);const ss=P.w.map((_,i)=>sentence(P,i));
 return `<div class="card warm"><p class="eyebrow">Warm-up · Day ${p}</p><h2 style="margin-bottom:4px">${esc(P.t)}</h2><p class="small" style="margin:0 0 6px">Say yesterday’s three sentences once before the new pattern.</p>
 ${ss.map((s,i)=>`<div class="sent"><span class="num">${i+1}</span><div class="body speakable"><span class="jp" data-say="${esc(s.say)}">${jpHTML(s.toks)}</span><div class="en">${esc(s.en)}</div></div></div>`).join('')}</div>`}
const fmt=s=>`${Math.floor(s/60)}:${pad(Math.max(0,s)%60)}`;
function wireLesson(n,mode){const v=mode==='browse'?$('v-journey'):$('v-today');const ds=dayState(n,mode),L=L$(n),l=les(n);
 const sents=L.w.map((_,i)=>sentence(L,i));
 if($('back'))$('back').onclick=()=>{browseFrom==='review'?show('review'):show('journey')};
 v.querySelectorAll('[data-rep]').forEach(b=>b.onclick=e=>{e.stopPropagation();const i=+b.dataset.rep;ds.reps[i]=Math.min(3,(ds.reps[i]||0)+1);if(ds.reps[i]===3&&Object.values(ds.reps).filter(x=>x>=3).length===3){ds.steps[1]=1}save();buzz(10);rerender(n,mode)});
 v.querySelectorAll('[data-hide]').forEach(b=>b.onclick=e=>{e.stopPropagation();const i=+b.dataset.hide;const s=b.closest('.sent');const now=!s.classList.contains('hide');ds.hide[i]=now;save();s.classList.toggle('hide',now);b.classList.toggle('on',now);b.textContent=now?'Show help':'Hide help'});
 v.querySelectorAll('[data-sayit]').forEach(b=>b.onclick=e=>{e.stopPropagation();const i=+b.dataset.sayit;sayIt(sents[i],$('heard'+i))});
 v.querySelectorAll('[data-step]').forEach(s=>s.onclick=()=>{const i=+s.dataset.step;ds.steps[i]=ds.steps[i]?0:1;save();s.classList.toggle('on',!!ds.steps[i]);buzz(10);if(ds.steps.every(Boolean)){markActive(n);toast('Routine complete. よく できました. Well done.');if(S.settings.bell)bell(.35)}});
 const tb=$('tbtn');if(tb)tb.onclick=()=>{if(timerInt){clearInterval(timerInt);timerInt=null;return}actx();timerInt=setInterval(()=>{ds.timer=(ds.timer||0)+1;if(ds.timer>=300){clearInterval(timerInt);timerInt=null;ds.timer=300;if(S.settings.bell)bell();buzz([40,80,40]);toast('Five minutes. Lovely.')}save();tb.innerHTML=ensoProgress(ds.timer/300);$('tval').textContent=fmt(300-ds.timer)},1000)};
 v.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{const k=b.dataset.rate;l.rating=k;l.ratedOn=today();markActive(n);save();v.querySelectorAll('[data-rate]').forEach(x=>x.classList.toggle('on',x===b));
  const m=$('rateMsg');const days=l.days.length;
  if(k==='auto'){master(n,'rating');m.innerHTML=`<div class="card mt ctr"><h2>Automatic. Day ${n} mastered.</h2><p class="sub">${n<N?`Day ${n+1} opens tomorrow, after a quick warm-up with this one.`:'That was the last pattern.'}</p><button class="btn" id="okDone">Done for today</button></div>`;$('okDone').onclick=()=>{show('today')}}
  else{m.innerHTML=`<div class="card mt ctr"><p class="sub" style="margin:0">${k==='shaky'?'That’s normal. Repeat this same lesson tomorrow; it gets easier on day two.':'Close. One more day on this pattern will make it automatic.'}${days>=3?`<br><br>You’ve given this pattern ${days} days. Take the check, or move on when you feel ready.`:''}</p>${days>=3?`<button class="btn ghost mt" id="moveOn">Move on anyway</button>`:''}</div>`;if($('moveOn'))$('moveOn').onclick=()=>{master(n,'moved');toast('Moving on. It will come back in review.');renderAll()}}});
 if($('chk'))$('chk').onclick=()=>startCheck(n,'unlock')}
let browseFrom='journey';
function rerender(n,mode){const sc=$('main').scrollTop;if(mode==='browse'){$('v-journey').innerHTML=lessonHTML(n,'browse');wireLesson(n,'browse')}else renderToday();$('main').scrollTop=sc}

// ---------- RECALL CHECK ----------
function swapParticle(s){const map={'を':'に','に':'を','は':'が','が':'は','で':'に','と':'を','まで':'から','から':'まで','の':'を'};const toks=s.toks.map(t=>({...t}));const idx=toks.findIndex((t,i)=>t.p&&map[t.k]&&!(i===1&&t.k==='は'&&toks.filter(x=>map[x.k]).length>1));if(idx<0)return null;toks[idx].k=map[toks[idx].k];return {toks,kana:toks.map(t=>t.k).join(' ')+'。'}}
function startCheck(n,purpose){const L=L$(n);const ss=L.w.map((_,i)=>sentence(L,i));const ord=shuffle([0,1,2]);const [a,b,c]=ord;
 const q2opts=[{s:ss[b],ok:1},{s:ss[(b+1)%3]}];const sw=swapParticle(ss[b]);if(sw)q2opts.push({s:sw});else if(n>1){const P=L$(n-1);q2opts.push({s:sentence(P,Math.floor(Math.random()*3))})}else q2opts.push({s:ss[(b+2)%3]});
 const Q=[{type:'listen',s:ss[a],opts:shuffle(ss.map((s,i)=>({s,ok:i===a})))},{type:'pick',s:ss[b],opts:shuffle(q2opts)},{type:'recall',s:ss[c]}];
 let qi=0,score=0;const ov=$('ov'),box=$('ovin');ov.classList.add('on');
 function head(){return `<div class="ovtop"><button class="link" id="ovx">Close</button><div class="prog">${Q.map((_,i)=>`<i class="${i<=qi?'on':''}"></i>`).join('')}</div></div><p class="eyebrow">${purpose==='review'?'Review':'Recall check'} · Day ${n} · ${esc(L.t)}</p>`}
 function next(ok){if(ok)score++;qi++;if(qi<Q.length)draw();else finish()}
 function draw(){const q=Q[qi];let h=head();
  if(q.type==='listen'){h+=`<h2>Listen, then pick what you heard.</h2><button class="bigsay" id="play">${SPK}</button>${q.opts.map((o,i)=>`<button class="opt" data-o="${i}">${esc(o.s.kana)}</button>`).join('')}`}
  if(q.type==='pick'){h+=`<h2>How do you say this in Japanese?</h2><div class="card ctr" style="font-size:22px;font-style:italic">${esc(q.s.en)}</div>${q.opts.map((o,i)=>`<button class="opt" data-o="${i}">${esc(o.s.kana)}</button>`).join('')}`}
  if(q.type==='recall'){h+=`<h2>Say it from memory.</h2><div class="card ctr" style="font-size:22px;font-style:italic">${esc(q.s.en)}</div><p class="sub ctr">Look away and say it out loud. Then reveal.</p>
   ${SR&&S.settings.sayit?`<div class="ctr"><button class="chip mic" id="rsay">${MIC} Say it to check</button><div class="heard" id="rheard"></div></div>`:''}
   <div class="reveal" id="rv"><button class="btn ghost" id="rvb">Reveal</button></div>`}
  box.innerHTML=h;$('ovx').onclick=closeOv;
  if(q.type==='listen'){const p=()=>speak(q.s.say,$('play'));$('play').onclick=p;setTimeout(p,350)}
  box.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{const o=q.opts[+b.dataset.o];box.querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;if(q.opts[+x.dataset.o].ok)x.classList.add('ok')});if(!o.ok){b.classList.add('bad');buzz([20,40,20])}else buzz(20);
   speak(q.s.say);setTimeout(()=>next(!!o.ok),o.ok?1100:2200)});
  if(q.type==='recall'){let auto=null;if($('rsay'))$('rsay').onclick=()=>sayIt(q.s,$('rheard'),ok=>{auto=ok});
   $('rvb').onclick=()=>{$('rv').innerHTML=`<div class="speakable"><span class="jp" data-say="${esc(q.s.say)}">${jpHTML(q.s.toks)}</span></div><div class="ro">${esc(q.s.ro)}</div><p class="sub">Did you get it?</p><div class="row" style="justify-content:center"><button class="btn shu" id="gy">Got it</button><button class="btn ghost" id="gn">Not yet</button></div>`;speak(q.s.say);$('gy').onclick=()=>next(true);$('gn').onclick=()=>next(false)}}}
 function finish(){const pass=score===Q.length;const l=les(n);markActive(n);
  if(purpose==='unlock'){if(pass){l.check=true;master(n,'check')}}
  else{const s=l.srs||{stage:0};if(pass){s.stage=Math.min(IV.length-1,s.stage+1);s.due=addDays(today(),IV[s.stage])}else{s.stage=Math.max(0,s.stage-1);s.due=addDays(today(),1)}l.srs=s;l.lastReview=today()}
  save();if(pass&&S.settings.bell)bell();
  box.innerHTML=head()+`<div class="done"><div class="big"><svg viewBox="0 0 200 200"><path d="${ensoPath(100,100,80,-1.7,pass?5.9:3.6,1,12,n)}" class="ensof"/>${pass?'<rect x="122" y="122" width="40" height="40" rx="4" class="seal"/>':''}</svg></div>
   <h1>${score} of ${Q.length}${pass?'. Passed.':'.'}</h1><p class="sub">${purpose==='unlock'?(pass?`Day ${n} is mastered. ${n<N?`Day ${n+1} opens tomorrow.`:''}`:'Repeat this same lesson tomorrow and try again. That’s how it sticks.'):(pass?`See you again in ${IV[l.srs.stage]} days.`:'It comes back tomorrow for another pass.')}</p>
   <button class="btn mt" id="ovd">Done</button></div>`;$('ovd').onclick=closeOv;$('ovx').onclick=closeOv}
 draw()}
function closeOv(){stopSpeak();$('ov').classList.remove('on');renderAll()}

// ---------- JOURNEY ----------
function renderJourney(){const cur=currentN(),v=$('v-journey');const m=Object.values(S.les).filter(l=>l.mastered).length;
 const st=n=>les(n).mastered?'done':(n===cur?'cur':'lock');
 v.innerHTML=`<p class="eyebrow">Your journey</p><h1>${m} of ${N} patterns</h1>
 <div class="stats"><div class="stat"><b>${streak()}</b><span>STREAK</span></div><div class="stat"><b>${bestStreak()}</b><span>BEST</span></div><div class="stat"><b>${m}</b><span>MASTERED</span></div></div>
 ${weekHTML()}
 <div class="card mt" style="padding:10px 6px">${journey(Ls,st,cur,STG)}</div>`;
 v.querySelectorAll('.jn').forEach(g=>g.onclick=()=>{const n=+g.dataset.day;if(n===cur){show('today');return}if(les(n).mastered){openLesson(n,'journey');return}toast(`Opens after Day ${n-1} is mastered`)})}
function weekHTML(){const t=today();let h='<div class="week">';for(let i=6;i>=0;i--){const d=addDays(t,-i);const dt=new Date(d+'T12:00:00');h+=`<div class="wd ${S.activity[d]?'on':''} ${i===0?'today':''}"><i></i>${'SMTWTFS'[dt.getDay()]}</div>`}return h+'</div>'}
function openLesson(n,from){browseFrom=from;show('journey',true);$('v-journey').innerHTML=lessonHTML(n,'browse');wireLesson(n,'browse');$('main').scrollTop=0}

// ---------- REVIEW ----------
function renderReview(){const v=$('v-review');const due=dueList();const learned=Object.keys(S.les).map(Number).filter(n=>S.les[n].mastered).sort((a,b)=>a-b);
 v.innerHTML=`<p class="eyebrow">Spaced review</p><h1>${due.length?`${due.length} pattern${due.length>1?'s':''} to refresh`:'Nothing due today'}</h1>
 <p class="sub">Older patterns come back at 1, 3, 7, 14, 30 and 60 days, so nothing fades.</p>
 ${due.length?`<div class="card">${due.map(n=>itemHTML(n,'due')).join('')}</div>`:''}
 <div class="sec"><h2>Everything you’ve learned</h2></div>
 ${learned.length?`<div class="card">${learned.map(n=>itemHTML(n,'all')).join('')}</div>`:`<div class="card ctr"><p class="sub">Master your first pattern and it will live here.</p></div>`}`;
 v.querySelectorAll('[data-rev]').forEach(b=>b.onclick=()=>startCheck(+b.dataset.rev,'review'));
 v.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openLesson(+b.dataset.open,'review'))}
function itemHTML(n,kind){const L=L$(n),l=les(n);const due=l.srs?l.srs.due:'';
 return `<div class="li" ${kind==='due'?`data-rev="${n}"`:`data-open="${n}"`}>${motif(L.sc)}<div class="t"><div>${esc(L.t)}</div><small>Day ${n} · ${kind==='due'?'tap to review':`next review ${due===today()?'today':due}`}</small></div>${kind==='due'?'<span class="badge shu">Review</span>':''}</div>`}

// ---------- SETTINGS ----------
function renderSettings(){const v=$('v-settings'),s=S.settings;const vs=voices;
 const seg=(key,opts)=>`<div class="seg">${opts.map(([val,lab])=>`<button data-seg="${key}" data-val="${val}" class="${String(s[key])===String(val)?'on':''}">${lab}</button>`).join('')}</div>`;
 const sw=key=>`<button class="sw ${s[key]?'on':''}" data-sw="${key}" aria-label="${key}"></button>`;
 v.innerHTML=`<p class="eyebrow">Settings</p><h1>Make it yours</h1>
 <div class="card">
  <div class="set"><div><label>Japanese voice</label><small>${vs.length?vs.length+' found on this device':'None found yet. Android: Settings › Text-to-speech › install Japanese.'}</small></div><select id="voice"><option value="">Best available</option>${vs.map(x=>`<option ${x.name===s.voice?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
  <div class="set"><div><label>Speaking speed</label><small>Slow is great for the first days</small></div>${seg('rate',[[.6,'Slow'],[.8,'Gentle'],[1,'Natural']])}</div>
  <div class="set"><div><label>Test the voice</label><small>わたし は みず を のみます。</small></div><button class="say" data-say="わたしはみずをのみます。">${SPK}</button></div>
  <div class="set"><div><label>Show romaji & English</label><small>Off starts every sentence on kana only</small></div>${sw('help')}</div>
  <div class="set"><div><label>“Say it” speech check</label><small>${SR?'Chrome listens in Japanese and checks you':'Needs Chrome'}</small></div>${sw('sayit')}</div>
 </div>
 <div class="card">
  <div class="set"><div><label>Theme</label><small>Auto is ink-dark before 6 AM and after 7 PM</small></div>${seg('theme',[['auto','Auto'],['washi','Washi'],['sumi','Sumi']])}</div>
  <div class="set"><div><label>Text size</label></div>${seg('k',[[.9,'A−'],[1,'A'],[1.15,'A+']])}</div>
  <div class="set"><div><label>Soft bell</label><small>On completion</small></div>${sw('bell')}</div>
  <div class="set"><div><label>Vibration</label></div>${sw('vibrate')}</div>
  <div class="set"><div><label>Open next lesson the same day</label><small>Off keeps it to one new pattern a day</small></div>${sw('ahead')}</div>
 </div>
 <div class="card">
  <div class="set"><div><label>Export progress</label><small>Save a backup file</small></div><button class="btn ghost" id="exp">Export</button></div>
  <div class="set"><div><label>Import progress</label><small>Restore from a backup file</small></div><button class="btn ghost" id="imp">Import</button><input type="file" id="impf" accept="application/json" hidden></div>
  <div class="set"><div><label>Start over</label><small>Erase progress on this phone</small></div><button class="btn ghost" id="reset">Reset</button></div>
 </div>
 <p class="small ctr">Japanese Daily Practice · 60 patterns · works offline<br>Native recordings can be added later; they play automatically when present.</p>`;
 $('voice').onchange=e=>{s.voice=e.target.value;save();speak('わたしはみずをのみます。')};
 v.querySelectorAll('[data-seg]').forEach(b=>b.onclick=()=>{const k=b.dataset.seg,val=b.dataset.val;s[k]=isNaN(+val)?val:+val;save();applyTheme();renderSettings();if(k==='rate')speak('わたしはみずをのみます。')});
 v.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const k=b.dataset.sw;s[k]=!s[k];save();b.classList.toggle('on',s[k]);if(k==='bell'&&s[k])bell(.35);if(k==='vibrate'&&s[k])buzz(40)});
 $('exp').onclick=()=>{const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`nihongo-progress-${today()}.json`;a.click();toast('Backup saved')};
 $('imp').onclick=()=>$('impf').click();
 $('impf').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{const j=JSON.parse(t);if(!j.les)throw 0;S=Object.assign({},DEF,j);S.settings=Object.assign({},DEF.settings,j.settings||{});save();applyTheme();renderAll();toast('Progress restored')}).catch(()=>toast('That file didn’t look like a backup'))};
 $('reset').onclick=()=>{if(confirm('Erase all progress on this phone?')){localStorage.removeItem(LS);location.reload()}}}

// ---------- nav ----------
let curView='today';
function show(name,keep){curView=name;stopSpeak();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+name));document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===name));
 if(!keep){({today:renderToday,journey:renderJourney,review:renderReview,settings:renderSettings})[name]();$('main').scrollTop=0}}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>show(b.dataset.v));
function renderAll(){renderStreak();show(curView)}
// deep link for previews: #day=N opens a lesson
const hm=location.hash.match(/day=(\d+)/);
renderStreak();show('today');
if(hm){const n=+hm[1];if(n>=1&&n<=N){openLesson(n,'journey')}}
const hv=location.hash.match(/view=(\w+)/);if(hv&&['journey','review','settings'].includes(hv[1]))show(hv[1]);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){applyTheme();if(curView==='today'&&S.today.date!==today())renderToday();renderStreak()}});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
