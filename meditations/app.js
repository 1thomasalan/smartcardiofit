// Meditations — a daily Stoic study path. Plain JS, data stays on the device.
(function(){
const LS='med.v1',$=id=>document.getElementById(id),Ls=window.LESSONS,N=Ls.length;
const byDay=d=>Ls[d-1];
const DEF={start:null,done:{},journal:{},saved:[],srs:{},activity:{},answers:{},
 settings:{theme:'auto',voice:'',rate:.9,narrator:true,ambient:'off',ambVol:.4,bell:true,vibrate:false,ahead:false,fs:1}};
let S;try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(LS)||'{}'));S.settings=Object.assign({},DEF.settings,S.settings||{})}catch(e){S=JSON.parse(JSON.stringify(DEF))}
const save=()=>localStorage.setItem(LS,JSON.stringify(S));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ymd(d)};
const diffDays=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
const ROMAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const refFmt=r=>{const[b,s]=r.split('.');return`Book ${ROMAN[b]} · ${s}`};
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)};
const buzz=p=>{if(S.settings.vibrate&&navigator.vibrate)navigator.vibrate(p)};

// ---------- theme ----------
function applyTheme(){const t=S.settings.theme;let th=t;if(t==='auto'){const h=new Date().getHours();th=(h<6||h>=19)?'night':'dawn'}
 document.body.dataset.theme=th;document.querySelector('meta[name=theme-color]').content=th==='night'?'#12141b':'#efe7da';
 document.documentElement.style.setProperty('--fs',S.settings.fs)}
applyTheme();setInterval(applyTheme,60000);

// ---------- progress logic ----------
const isDone=d=>!!S.done[d];
function unlocked(d){if(d===1)return true;const p=S.done[d-1];if(!p)return false;return S.settings.ahead||p.date<ymd()}
function currentDay(){for(let d=1;d<=N;d++)if(!isDone(d))return d;return N+1}
function streak(){let n=0,d=ymd();if(!S.activity[d])d=addDays(d,-1);while(S.activity[d]){n++;d=addDays(d,-1)}return n}
function bestStreak(){const ds=Object.keys(S.activity).sort();let b=0,c=0,prev=null;ds.forEach(d=>{c=prev&&diffDays(prev,d)===1?c+1:1;b=Math.max(b,c);prev=d});return b}
const BOX=[0,1,3,7,16,35,80];
function dueList(){const t=ymd();return Object.keys(S.srs).map(Number).filter(d=>S.srs[d].due<=t).sort((a,b)=>S.srs[a].due<S.srs[b].due?-1:1)}
function markActive(){S.activity[ymd()]=true}

// ---------- audio: bell, ambient, speech ----------
let ac;function ctx(){ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}
function bell(gain=.55){const a=ctx(),t=a.currentTime,out=a.createGain();out.gain.value=gain;out.connect(a.destination);
 const dl=a.createDelay();dl.delayTime.value=.13;const fb=a.createGain();fb.gain.value=.25;const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;out.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(a.destination);
 [[1,1,9],[2.76,.5,6],[5.40,.25,4],[8.93,.12,2.5],[1.006,.6,9]].forEach(([r,amp,dec])=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=220*r;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp*.22,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dec);o.connect(g);g.connect(out);o.start(t);o.stop(t+dec+.1)})}
let amb=null;
function noiseBuf(a,kind){const len=a.sampleRate*4,b=a.createBuffer(2,len,a.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;if(kind==='brown'){last=(last+.02*w)/1.02;d[i]=last*3.5}else d[i]=w}}return b}
function startAmbient(kind=S.settings.ambient){stopAmbient();if(kind==='off')return;
 const a=ctx(),t=a.currentTime,master=a.createGain();master.gain.setValueAtTime(0,t);master.gain.linearRampToValueAtTime(S.settings.ambVol*.6,t+3);master.connect(a.destination);
 const nodes=[];const src=b=>{const s=a.createBufferSource();s.buffer=b;s.loop=true;s.start();nodes.push(s);return s};
 const lfo=(f,depth,target)=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.value=depth;o.connect(g);g.connect(target);o.start();nodes.push(o)};
 if(kind==='rain'){const s=src(noiseBuf(a,'white'));const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4500;const g=a.createGain();g.gain.value=.3;s.connect(hp);hp.connect(lp);lp.connect(g);g.connect(master);const s2=src(noiseBuf(a,'brown'));const g2=a.createGain();g2.gain.value=.5;s2.connect(g2);g2.connect(master)}
 if(kind==='sea'){const s=src(noiseBuf(a,'brown'));const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=650;const g=a.createGain();g.gain.value=.55;lfo(.075,.45,g.gain);lfo(.075,400,lp.frequency);s.connect(lp);lp.connect(g);g.connect(master)}
 if(kind==='hearth'){const s=src(noiseBuf(a,'brown'));const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=500;const g=a.createGain();g.gain.value=.6;s.connect(lp);lp.connect(g);g.connect(master);
  const cr=a.createGain();cr.gain.value=0;const n2=src(noiseBuf(a,'white'));const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2500;n2.connect(bp);bp.connect(cr);cr.connect(master);
  const tick=()=>{if(!amb||amb.kind!=='hearth')return;const tt=a.currentTime;cr.gain.setValueAtTime(.0,tt);cr.gain.linearRampToValueAtTime(.25*Math.random(),tt+.005);cr.gain.exponentialRampToValueAtTime(.0001,tt+.05);amb.to=setTimeout(tick,80+Math.random()*600)};setTimeout(tick,300)}
 if(kind==='temple'){[110,165,220.5].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=f;g.gain.value=[.18,.06,.05][i];lfo(.05+i*.03,g.gain.value*.6,g.gain);o.connect(g);g.connect(master);o.start();nodes.push(o)});const s=src(noiseBuf(a,'brown'));const g=a.createGain();g.gain.value=.15;s.connect(g);g.connect(master)}
 amb={kind,master,nodes}}
function stopAmbient(){if(!amb)return;const a=ctx(),m=amb.master,ns=amb.nodes;clearTimeout(amb.to);m.gain.cancelScheduledValues(a.currentTime);m.gain.setValueAtTime(m.gain.value,a.currentTime);m.gain.linearRampToValueAtTime(0,a.currentTime+1.2);setTimeout(()=>{ns.forEach(n=>{try{n.stop()}catch(e){}});m.disconnect()},1400);amb=null}
let ambOn=false;
function setAmb(on){ambOn=on;$('ambBtn').classList.toggle('on',on);if(on){if(S.settings.ambient==='off'){S.settings.ambient='rain';save()}startAmbient()}else stopAmbient()}
$('ambBtn').onclick=()=>{setAmb(!ambOn);toast(ambOn?'Ambient: '+AMBN[S.settings.ambient]:'Ambient off')};
const AMBN={off:'Off',rain:'Rain',sea:'Sea',hearth:'Hearth',temple:'Temple'};

// speech
let voices=[];function loadVoices(){voices=(speechSynthesis.getVoices()||[]).filter(v=>/^en/i.test(v.lang))}
if('speechSynthesis' in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
function pickVoice(){if(!voices.length)loadVoices();return voices.find(v=>v.name===S.settings.voice)||voices.find(v=>/en-GB/i.test(v.lang)&&/male|daniel|george|arthur/i.test(v.name))||voices.find(v=>/en-GB/i.test(v.lang))||voices[0]}
let speaking=null,audioEl=null;
function stopSpeak(){speaking=null;try{speechSynthesis.cancel()}catch(e){}if(audioEl){audioEl.pause();audioEl=null}document.querySelectorAll('.reading').forEach(e=>e.classList.remove('reading'));document.querySelectorAll('[data-say].on').forEach(b=>{b.classList.remove('on');b.querySelector('span').textContent=b.dataset.label})}
function sayText(text,el,done){const token={};speaking=token;const parts=text.replace(/--/g,', ').match(/[^.!?;:]+[.!?;:]*\s*/g)||[text];let i=0;el&&el.classList.add('reading');
 const next=()=>{if(speaking!==token)return;if(i>=parts.length){el&&el.classList.remove('reading');done&&done();return}
  const u=new SpeechSynthesisUtterance(parts[i++].trim());const v=pickVoice();if(v)u.voice=v;u.lang=v?v.lang:'en-GB';u.rate=S.settings.rate;u.pitch=.95;u.onend=next;u.onerror=next;speechSynthesis.speak(u)};next()}
function playNarration(day,el,done,kind,fb){kind=kind||'d';const token={};speaking=token;el&&el.classList.add('reading');audioEl=new Audio(`audio/${kind}${pad(day)}.mp3`);audioEl.playbackRate=Math.max(.8,Math.min(1.2,S.settings.rate/.9));
 audioEl.onended=()=>{el&&el.classList.remove('reading');if(speaking===token)done&&done()};audioEl.onerror=()=>{el&&el.classList.remove('reading');if(speaking!==token)return;fb?fb():sayText(byDay(day).passage,el,done)};audioEl.play().catch(()=>audioEl.onerror())}

// ---------- rendering: tabs ----------
let tab='today';
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
function render(){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
 const due=dueList().length;const bd=$('dueBadge');bd.hidden=!due;bd.textContent=due;
 const v=$('inner');v.innerHTML=({today:vToday,path:vPath,review:vReview,map:vMap,saved:vSaved})[tab]();$('view').scrollTop=0;
 v.querySelectorAll('[data-open]').forEach(e=>e.onclick=()=>openLesson(+e.dataset.open));
 (afterRender[tab]||(()=>{}))()}
const afterRender={};

function greet(){const h=new Date().getHours();return h<5?'The quiet hour, Alan':h<12?'Good morning, Alan':h<17?'Good afternoon, Alan':'Good evening, Alan'}
const LAUREL=`<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M60 106c-26-14-38-36-36-66M60 106c26-14 38-36 36-66"/>${[0,1,2,3,4].map(i=>{const y=88-i*13,x=34-i*1.8;return`<path d="M${x+4} ${y}c-10-2-14-8-14-14 8 0 13 6 14 14z" fill="currentColor" opacity=".25"/><path d="M${120-x-4} ${y}c10-2 14-8 14-14-8 0-13 6-14 14z" fill="currentColor" opacity=".25"/>`}).join('')}</svg>`;

function vToday(){const cd=currentDay(),st=streak(),due=dueList().length,doneN=Object.keys(S.done).length;let hero;
 if(cd>N){hero=`<div class="card hero"><div class="eyebrow">Path complete</div><h2>You walked all ${N} days.</h2><p class="muted">Keep the teachings alive with daily review. The deck will keep spacing them out.</p><button class="btn gold" data-tab-go="review">Review now</button></div>`}
 else{const l=byDay(cd),open=unlocked(cd);
  hero=`<div class="card hero"><div class="eyebrow">Day ${cd} of ${N} · ${esc(l.theme)}</div>${Visual.render(l.visual)}<h2>${esc(l.title)}</h2><div class="ref">${refFmt(l.ref)}</div><blockquote>${esc(l.passage)}</blockquote>
  <div class="row" style="margin-top:16px">${open?`<button class="btn gold" data-open="${cd}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>${doneN?'Begin today\u2019s lesson':'Begin Day 1'}</button>`:
  `<div><p style="margin:0 0 12px">Today\u2019s lesson is done. Day ${cd} opens tomorrow at dawn.</p><div class="row"><button class="btn ghost sm" data-open="${cd-1}">Revisit Day ${cd-1}</button><button class="btn ghost sm" id="aheadBtn">Study ahead</button></div></div>`}</div></div>`}
 const days=[...Array(14)].map((_,i)=>{const d=addDays(ymd(),i-13);return`<i class="${S.activity[d]?'on':''} ${i===13?'today':''}" title="${d}"></i>`}).join('');
 const thoughtDays=Object.keys(S.done).map(Number);const td=thoughtDays.length?thoughtDays[(new Date().getDate()*7)%thoughtDays.length]:null;
 return`<div class="greet"><div class="eyebrow">${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div><h1>${greet()}</h1><p>${esc(DAWN[new Date().getDate()%DAWN.length])}</p></div>
 <div class="homegrid"><div>${hero}</div><div>
  <div class="grid2"><div class="card stat"><b>${st}</b><span>Day streak</span></div><div class="card stat"><b>${doneN}<small class="muted" style="font-size:16px"> / ${N}</small></b><span>Lessons kept</span></div></div>
  <div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">Spaced review</div><div style="font-size:20px;margin-top:4px">${due?`${due} card${due>1?'s':''} ready`:'All caught up'}</div></div><button class="btn ${due?'gold':'ghost'} sm" id="goReview">${due?'Review':'Practice'}</button></div>
  <div class="dots">${days}</div><div class="small" style="margin-top:8px">Last 14 days · best streak ${bestStreak()}</div></div>
  ${td?`<div class="card" style="margin-top:14px" data-open="${td}"><div class="eyebrow">To carry today · ${refFmt(byDay(td).ref)}</div><p class="thought" style="margin:8px 0 0">${esc(byDay(td).key)}</p></div>`:''}
 </div></div>`}
afterRender.today=()=>{const a=$('aheadBtn');if(a)a.onclick=()=>{const cd=currentDay();S.done[cd-1].date='0000-00-00';save();render();openLesson(cd)};const g=$('goReview');if(g)g.onclick=()=>{tab='review';render()};document.querySelectorAll('[data-tab-go]').forEach(b=>b.onclick=()=>{tab=b.dataset.tabGo;render()})};
const DAWN=['The morning is the best hour for the mind.','Begin where you are. The day is still unwritten.','Quiet first. Then the work of a human being.','A few lines, read slowly, carried all day.','The citadel is built one morning at a time.'];

// ---------- path & journey ----------
function journeySVG(){const books={};Object.keys(S.done).forEach(d=>{const b=+byDay(+d).ref.split('.')[0];books[b]=(books[b]||0)+1});const total={};Ls.forEach(l=>{const b=+l.ref.split('.')[0];total[b]=(total[b]||0)+1});
 const W=360,H=210;const pts=[...Array(12)].map((_,i)=>{const row=Math.floor(i/4),col=i%4,x=row%2?300-col*80:60+col*80;return[x,40+row*65]});
 let path=`M${pts[0][0]} ${pts[0][1]}`;for(let i=1;i<12;i++){const[a,b]=pts[i-1],[c,d]=pts[i];path+=a===c||b===d?` L${c} ${d}`:` C${a+(a>180?50:-50)} ${b} ${c+(c>180?50:-50)} ${d} ${c} ${d}`}
 let s=`<svg class="journey" viewBox="0 0 ${W} ${H}"><path d="${path}" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round"/><path d="${path}" fill="none" stroke="var(--gold2)" stroke-width="1.2" stroke-dasharray="2 6" opacity=".7"/>`;
 pts.forEach(([x,y],i)=>{const b=i+1,n=books[b]||0,t=total[b]||0,lit=n>0,full=t&&n>=t;
  s+=`<circle cx="${x}" cy="${y}" r="17" fill="${lit?'var(--gold2)':'var(--bg)'}" stroke="${lit?'var(--gold)':'var(--line)'}" stroke-width="1.5" ${lit?'':'opacity=".9"'}/>${full?`<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="var(--gold)" stroke-width="1"/>`:''}
  <text x="${x}" y="${y+4.5}" text-anchor="middle" font-size="12.5" fill="${lit?'#fff':'var(--mut)'}" class="st">${ROMAN[b]}</text><text x="${x}" y="${y+33}" text-anchor="middle" font-size="9" fill="var(--mut)" font-family="system-ui">${n}/${t}</text>`});
 return s+'</svg>'}
function vPath(){const cd=currentDay();const themes=[];Ls.forEach(l=>{let t=themes.find(x=>x.name===l.theme);if(!t)themes.push(t={name:l.theme,ls:[]});t.ls.push(l)});
 return`<div class="greet"><div class="eyebrow">The journey</div><h1>Across the twelve books</h1><p>Each station lights as you study a passage from that book.</p></div>
 <div class="card" style="margin-top:16px">${journeySVG()}</div>
 ${themes.map((t,ti)=>`<div class="theme-block"><h4>${esc(t.name)} <small>${t.ls.filter(l=>isDone(l.day)).length}/${t.ls.length}</small></h4><div class="stones">${t.ls.map(l=>{const st=isDone(l.day)?'done':l.day===cd&&unlocked(l.day)?'cur':unlocked(l.day)?'':'locked';
  return`<button class="stone ${st}" ${st==='locked'?'':`data-open="${l.day}"`}><span class="n">DAY ${l.day} · ${l.ref}${st==='done'?' ✓':''}</span><span class="t">${esc(l.title)}</span></button>`}).join('')}</div></div>`).join('')}`}

// ---------- review (spaced repetition) ----------
let R=null;
function vReview(){const due=dueList();const deck=Object.keys(S.srs).length;
 if(R&&R.i<R.q.length)return reviewCard();
 if(R&&R.i>=R.q.length){const r=R;R=null;return`<div class="greet"><div class="eyebrow">Review complete</div><h1>Well kept.</h1><p>${r.got} of ${r.q.length} remembered. The deck will space them out again.</p></div><div class="card" style="margin-top:20px;text-align:center"><div class="laurel" style="margin:0 auto">${LAUREL}</div><button class="btn ghost" onclick="this.closest('main')&&0" id="backToday">Back to Today</button></div>`}
 return`<div class="greet"><div class="eyebrow">Spaced review</div><h1>${due.length?`${due.length} ready to recall`:'Nothing due today'}</h1><p>${deck?`Your deck holds ${deck} teaching${deck>1?'s':''}. Each comes back just before you\u2019d forget it: 1, 3, 7, 16, 35 days.`:'Finish your first lesson to start your deck.'}</p></div>
 <div class="row" style="margin-top:20px">${due.length?`<button class="btn gold" id="startRev">Begin review</button>`:''}${deck?`<button class="btn ghost" id="practice">Practice 5 at random</button>`:''}</div>
 ${deck?`<div class="section-t"><h3>Your deck</h3><span class="small">box 1 → 6</span></div><div class="card">${Object.keys(S.srs).map(Number).sort((a,b)=>a-b).map(d=>{const c=S.srs[d];return`<div class="opt" data-open="${d}" style="cursor:pointer"><label>Day ${d} · ${esc(byDay(d).title)}</label><span class="small">${'●'.repeat(c.box)}${'○'.repeat(6-c.box)} · ${c.due<=ymd()?'due':c.due.slice(5)}</span></div>`}).join('')}</div>`:''}`}
function startReview(list){R={q:list.map((d,i)=>({d,mode:(S.srs[d].reviews||0)%2?'quiz':'card'})),i:0,got:0,flip:false};render()}
afterRender.review=()=>{const a=$('startRev');if(a)a.onclick=()=>startReview(dueList().slice(0,20));const p=$('practice');if(p)p.onclick=()=>{const k=Object.keys(S.srs).map(Number).sort(()=>Math.random()-.5).slice(0,5);R={q:k.map(d=>({d,mode:Math.random()<.5?'quiz':'card',practice:true})),i:0,got:0};render()};
 const b=$('backToday');if(b)b.onclick=()=>{tab='today';render()};
 if(!R||R.i>=R.q.length)return;const it=R.q[R.i],l=byDay(it.d);
 const f=$('flash');if(f&&it.mode==='card')f.onclick=()=>{if(!f.classList.contains('flip')){f.classList.add('flip');$('rate').hidden=false}};
 document.querySelectorAll('#rate button').forEach(b=>b.onclick=e=>{e.stopPropagation();grade(+b.dataset.g)});
 document.querySelectorAll('.rq .opts button').forEach(b=>b.onclick=()=>{const qi=+b.parentNode.dataset.qi,q=l.quiz[qi],ok=+b.dataset.i===q.answer;const box=b.closest('.q');if(box.classList.contains('answered'))return;box.classList.add('answered');
  box.querySelectorAll('button').forEach(x=>{if(+x.dataset.i===q.answer)x.classList.add('right');else if(x===b)x.classList.add('wrong')});buzz(ok?20:[30,40,30]);setTimeout(()=>{const n=$('nextQ');n.hidden=false;n.onclick=()=>grade(ok?2:0)},300)})};
function reviewCard(){const it=R.q[R.i],l=byDay(it.d),pct=Math.round(R.i/R.q.length*100);
 const head=`<div class="row" style="justify-content:space-between"><span class="eyebrow">${it.practice?'Practice':'Review'} · ${R.i+1} of ${R.q.length}</span><span class="small">Day ${l.day} · ${refFmt(l.ref)}</span></div><div class="pbar"><i style="width:${pct}%"></i></div>`;
 if(it.mode==='card')return head+`<div class="card flash" id="flash"><div class="eyebrow" style="margin-bottom:12px">${esc(l.theme)}</div><div class="front">${esc(l.cardFront)}</div><div class="small" style="margin-top:18px">Recall it, then tap to reveal</div>
 <div class="back"><div class="eyebrow rlab">Remember</div><p class="quote">“${esc(l.key)}”</p><div class="eyebrow rlab">In plain words</div><p class="plain">${esc(l.plain)}</p><div class="eyebrow rlab">Marcus, ${refFmt(l.ref)}</div><blockquote>${esc(l.passage.length>220?l.passage.slice(0,220).replace(/\s\S*$/,'')+' …':l.passage)}</blockquote></div></div>
 <div class="rate" id="rate" hidden><button data-g="0">Again<small>tomorrow</small></button><button data-g="1">Hazy<small>soon</small></button><button data-g="2">Got it<small>later</small></button></div>`;
 const qi=(S.srs[l.day].qi||0)%l.quiz.length,q=l.quiz[qi];
 return head+`<div class="card" style="margin-top:16px">${Visual.render(l.visual)}</div><div class="q rq"><p>${esc(q.q)}</p><div class="opts" data-qi="${qi}">${q.options.map((o,i)=>`<button data-i="${i}">${esc(o)}</button>`).join('')}</div><div class="why">${esc(q.why)}<div class="rkeep"><div class="eyebrow rlab">Remember</div><p class="quote">“${esc(l.key)}”</p><div class="eyebrow rlab">In plain words</div><p class="plain">${esc(l.plain)}</p></div></div></div><div style="text-align:center"><button class="btn gold" id="nextQ" hidden>Continue</button></div>`}
function grade(g){const it=R.q[R.i],c=S.srs[it.d];if(!it.practice){c.box=g===0?1:g===1?Math.max(1,c.box):Math.min(6,c.box+1);c.due=addDays(ymd(),g===0?1:BOX[c.box]);c.reviews=(c.reviews||0)+1;if(it.mode==='quiz')c.qi=(c.qi||0)+1;markActive()}
 if(g===2)R.got++;R.i++;save();render()}

// ---------- concept map ----------
const CONCEPTS=['control','judgment','citadel','reason','present','impermanence','change','perspective','smallness','death','time','others','anger','kinship','forgiveness','duty','community','work','nature','logos','connection','acceptance','virtue','character','simplicity','fame','gratitude','morning'];
let CPOS=null;
function layout(){if(CPOS)return CPOS;const idx={};CONCEPTS.forEach((c,i)=>idx[c]=i);const n=CONCEPTS.length;const P=CONCEPTS.map((c,i)=>{const a=i/n*Math.PI*2;return{x:Math.cos(a)*120,y:Math.sin(a)*90,vx:0,vy:0}});
 const E={};Ls.forEach(l=>{const cs=l.concepts.filter(c=>c in idx);for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const k=[idx[cs[i]],idx[cs[j]]].sort((a,b)=>a-b).join('-');E[k]=(E[k]||0)+1}});
 const edges=Object.entries(E).map(([k,w])=>[...k.split('-').map(Number),w]);
 for(let it=0;it<400;it++){for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){let dx=P[i].x-P[j].x,dy=P[i].y-P[j].y,d2=dx*dx+dy*dy+.01,f=900/d2;P[i].vx+=dx*f*.02;P[i].vy+=dy*f*.02;P[j].vx-=dx*f*.02;P[j].vy-=dy*f*.02}
  edges.forEach(([a,b,w])=>{const dx=P[b].x-P[a].x,dy=P[b].y-P[a].y,d=Math.sqrt(dx*dx+dy*dy)+.01,f=(d-55)*.004*Math.min(w,3);P[a].vx+=dx/d*f*d*.1;P[a].vy+=dy/d*f*d*.1;P[b].vx-=dx/d*f*d*.1;P[b].vy-=dy/d*f*d*.1});
  P.forEach(p=>{p.vx-=p.x*.004;p.vy-=p.y*.006;p.x+=p.vx;p.y+=p.vy;p.vx*=.6;p.vy*=.6})}
 const xs=P.map(p=>p.x),ys=P.map(p=>p.y),mx=Math.min(...xs),Mx=Math.max(...xs),my=Math.min(...ys),My=Math.max(...ys);
 CPOS={pos:P.map(p=>({x:30+(p.x-mx)/(Mx-mx)*300,y:26+(p.y-my)/(My-my)*228})),edges};return CPOS}
let selC=null;
function vMap(){const {pos,edges}=layout();const done=Object.keys(S.done).map(Number);const cnt={};const ecnt={};
 done.forEach(d=>{const cs=byDay(d).concepts;cs.forEach(c=>cnt[c]=(cnt[c]||0)+1);for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const k=[CONCEPTS.indexOf(cs[i]),CONCEPTS.indexOf(cs[j])].sort((a,b)=>a-b).join('-');ecnt[k]=(ecnt[k]||0)+1}});
 const lit=Object.keys(cnt).length;
 let s=`<svg class="cmap" viewBox="0 0 360 280">`;
 edges.forEach(([a,b])=>{const k=a+'-'+b,on=ecnt[k];s+=`<line x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}" stroke="${on?'var(--gold)':'var(--line)'}" stroke-width="${on?Math.min(1+on*.6,3):.6}" opacity="${on?.7:.5}"/>`});
 CONCEPTS.forEach((c,i)=>{const p=pos[i],n=cnt[c]||0,r=n?6+Math.min(n,8)*1.4:3;s+=`<g data-c="${c}" style="cursor:pointer">${n?`<circle cx="${p.x}" cy="${p.y}" r="${r+8}" fill="var(--gold2)" opacity="${selC===c?.35:.12}"/>`:''}<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${n?'var(--gold2)':'var(--mut)'}" opacity="${n?1:.35}"/>
  <text x="${p.x}" y="${p.y-r-5}" text-anchor="middle" font-size="${n?11:9}" fill="${n?'var(--ink)':'var(--mut)'}" opacity="${n?1:.55}">${c}</text><circle cx="${p.x}" cy="${p.y}" r="18" fill="transparent"/></g>`});
 s+='</svg>';
 const list=selC?Ls.filter(l=>l.concepts.includes(selC)):[];
 return`<div class="greet"><div class="eyebrow">Concept map</div><h1>${lit} of ${CONCEPTS.length} ideas awake</h1><p>Each lesson lights its ideas and the threads between them. Tap an idea.</p></div>
 <div class="card" style="margin-top:16px;padding:10px">${s}</div>
 ${selC?`<div class="section-t"><h3 style="text-transform:capitalize">${esc(selC)}</h3><span class="small">${list.length} lessons</span></div><div class="stones">${list.map(l=>{const st=isDone(l.day)?'done':unlocked(l.day)?'':'locked';return`<button class="stone ${st}" ${st==='locked'?'':`data-open="${l.day}"`}><span class="n">DAY ${l.day} · ${l.ref}</span><span class="t">${st==='locked'?'Not yet unlocked':esc(l.title)}</span></button>`}).join('')}</div>`:''}`}
afterRender.map=()=>document.querySelectorAll('[data-c]').forEach(g=>g.onclick=()=>{selC=g.dataset.c;render();setTimeout(()=>$('view').scrollTo({top:9999,behavior:'smooth'}),50)});

// ---------- saved ----------
function vSaved(){const sv=S.saved.slice().reverse();
 return`<div class="greet"><div class="eyebrow">Saved passages</div><h1>Your commonplace book</h1><p>${sv.length?`${sv.length} passage${sv.length>1?'s':''} kept close.`:'Tap the ribbon on any lesson to keep its passage here.'}</p></div>
 ${sv.map(d=>{const l=byDay(d);return`<div class="card saved"><div class="row" style="justify-content:space-between"><span class="eyebrow">${refFmt(l.ref)} · Day ${d}</span><span class="row" style="gap:4px"><button class="ic" data-copy="${d}" aria-label="Copy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg></button><button class="ic" data-unsave="${d}" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span></div>
  <blockquote>${esc(l.passage)}</blockquote><div class="small" style="cursor:pointer" data-open="${d}">${esc(l.title)} → open lesson</div></div>`}).join('')}`}
afterRender.saved=()=>{document.querySelectorAll('[data-unsave]').forEach(b=>b.onclick=()=>{S.saved=S.saved.filter(x=>x!==+b.dataset.unsave);save();render()});
 document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{const l=byDay(+b.dataset.copy);const t=`"${l.passage}" (Marcus Aurelius, Meditations ${l.ref}, tr. George Long)`;(navigator.share?navigator.share({text:t}):navigator.clipboard.writeText(t).then(()=>toast('Copied'))).catch(()=>{})})};

// ---------- lesson ----------
let curL=null;
const ICON={read:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/></svg>',
 apply:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
 pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
 q:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'};
function openLesson(d){if(!unlocked(d)&&!isDone(d)){toast('Unlocks after the day before');return}
 curL=d;const l=byDay(d),j=S.journal[d]||'',ans=S.answers[d]||{},sv=S.saved.includes(d),done=isDone(d);
 $('lBarT').textContent=`Day ${d} · ${refFmt(l.ref)}`;$('lSave').classList.toggle('on',sv);
 const paras=l.explain.split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join('');
 $('lBody').innerHTML=`<div class="lgrid"><div class="lcol1">
  <div class="lhead"><div class="eyebrow">${esc(l.theme)} · Day ${d} of ${N}</div><h1>${esc(l.title)}</h1></div>
  <div class="passage"><blockquote id="pTxt">${esc(l.passage)}</blockquote><div class="cite">Meditations ${l.ref} · tr. George Long, 1862</div></div>
  <div class="tools"><button class="chip" data-say="all" data-label="Listen to lesson">${ICON.play}<span>Listen to lesson</span></button></div>
  <div class="plain"><span class="eyebrow">In plain words</span>${esc(l.plain)}</div>
  <div class="card vizcard">${Visual.render(l.visual)}<p>${esc(l.visual.caption||'')}</p></div>
 </div><div class="lcol2">
  <div class="block"><h3>${ICON.read}What it means</h3><div class="prose" id="eTxt">${paras}</div></div>
  <div class="keycard"><div class="eyebrow">Remember</div><p>${esc(l.key)}</p></div>
  <div class="block"><h3>${ICON.apply}Live it today</h3><div class="prose"><p>${esc(l.apply)}</p></div></div>
  <div class="block"><h3>${ICON.pen}Reflect</h3><div class="prose"><p style="font-style:italic">${esc(l.prompt)}</p></div><textarea id="jBox" placeholder="Write a few honest lines…">${esc(j)}</textarea><div class="small" id="jSaved" style="margin-top:6px">${j?'Saved on this phone':'Saves as you type, only on this phone'}</div></div>
  <div class="block"><h3>${ICON.q}Recall check</h3>${l.quiz.map((q,qi)=>{const a=ans[qi];return`<div class="q lq ${a!=null?'answered':''}"><p>${qi+1}. ${esc(q.q)}</p><div class="opts" data-qi="${qi}">${q.options.map((o,i)=>`<button data-i="${i}" class="${a!=null?(i===q.answer?'right':i===a?'wrong':''):''}">${esc(o)}</button>`).join('')}</div><div class="why">${esc(q.why)}</div></div>`}).join('')}</div>
  <div class="finish">${done?`<p class="small">Completed ${S.done[d].date.startsWith('0000')?'':S.done[d].date}</p><button class="btn ghost" id="lDone">Close</button>`:`<button class="btn gold" id="lDone">Complete Day ${d}</button><p class="small" style="margin-top:10px">Adds this teaching to your review deck</p>`}</div>
 </div></div>`;
 $('lesson').classList.add('show');$('lesson').scrollTop=0;history.pushState({l:d},'');
 const jb=$('jBox');jb.oninput=()=>{S.journal[d]=jb.value;save();$('jSaved').textContent='Saved on this phone'};
 document.querySelectorAll('.lq .opts button').forEach(b=>b.onclick=()=>{const box=b.closest('.q');if(box.classList.contains('answered'))return;const qi=+b.parentNode.dataset.qi,q=l.quiz[qi],i=+b.dataset.i;box.classList.add('answered');
  box.querySelectorAll('button').forEach(x=>{if(+x.dataset.i===q.answer)x.classList.add('right');else if(x===b)x.classList.add('wrong')});(S.answers[d]=S.answers[d]||{})[qi]=i;save();buzz(i===q.answer?20:[30,40,30])});
 document.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');stopSpeak();if(was)return;b.classList.add('on');b.querySelector('span').textContent='Stop';
  const fin=()=>stopSpeak();const passage=next=>S.settings.narrator?playNarration(d,$('pTxt'),next):sayText(l.passage,$('pTxt'),next);
  if(b.dataset.say==='passage')passage(fin);else passage(()=>S.settings.narrator?playNarration(d,document.querySelector('.plain'),fin,'l',lessonTTS):lessonTTS());function lessonTTS(){sayText('In plain words. '+l.plain,document.querySelector('.plain'),()=>sayText(l.explain.replace(/\n+/g,' '),$('eTxt'),()=>sayText('Remember. '+l.key,document.querySelector('.keycard'),fin)))}});
 $('lDone').onclick=()=>{if(done){closeLesson();return}complete(d)}}
function closeLesson(){stopSpeak();$('lesson').classList.remove('show');curL=null;render()}
$('lClose').onclick=()=>history.state&&history.state.l?history.back():closeLesson();
window.addEventListener('popstate',()=>{if(curL)closeLesson();closeSheet()});
$('lSave').onclick=()=>{const d=curL;if(!d)return;const i=S.saved.indexOf(d);if(i>=0)S.saved.splice(i,1);else S.saved.push(d);save();$('lSave').classList.toggle('on',i<0);toast(i<0?'Saved to your passages':'Removed');buzz(15)};
$('lesson').addEventListener('scroll',()=>{const e=$('lesson');$('lProg').style.width=Math.min(100,e.scrollTop/(e.scrollHeight-e.clientHeight)*100)+'%'});
function complete(d){const l=byDay(d);S.done[d]={date:ymd()};if(!S.start)S.start=ymd();S.srs[d]=S.srs[d]||{box:1,due:addDays(ymd(),1),reviews:0,qi:0};markActive();save();stopSpeak();
 if(S.settings.bell)bell();buzz([40,80,40]);
 const ov=$('doneOv');const nb=+l.ref.split('.')[0];const newC=l.concepts.filter(c=>!Object.keys(S.done).some(x=>+x!==d&&byDay(+x).concepts.includes(c)));
 ov.innerHTML=`<div class="laurel">${LAUREL}</div><div class="eyebrow" style="margin-top:8px">Day ${d} kept</div><h2>${streak()} day streak</h2><p>${esc(l.key)}</p>
 <p class="small">${newC.length?`New on your concept map: ${newC.join(', ')}. `:''}Book ${ROMAN[nb]} glows on your journey. First review: tomorrow.</p><button class="btn gold" id="ovOk" style="margin-top:18px">Continue</button>`;
 ov.classList.add('show');$('ovOk').onclick=()=>{ov.classList.remove('show');closeLesson()}}

// ---------- settings sheet ----------
function openSheet(html){$('sheet').innerHTML=html;$('sheet').classList.add('show');$('scrim').classList.add('show')}
function closeSheet(){$('sheet').classList.remove('show');$('scrim').classList.remove('show')}
$('scrim').onclick=closeSheet;
function seg(key,opts,labels){return`<div class="seg" data-key="${key}">${opts.map((o,i)=>`<button data-v="${o}" class="${String(S.settings[key])===String(o)?'on':''}">${labels[i]}</button>`).join('')}</div>`}
function sw(key){return`<button class="sw ${S.settings[key]?'on':''}" data-sw="${key}"></button>`}
$('setBtn').onclick=()=>{loadVoices();
 openSheet(`<h3>Settings</h3>
 <div class="opt"><label>Light</label>${seg('theme',['auto','dawn','night'],['Auto','Marble','Night'])}</div>
 <div class="opt"><label>Text size</label>${seg('fs',[.92,1,1.12],['S','M','L'])}</div>
 <div class="opt"><label>Studio narrator (British voice)<br><span class="small">Passages and lessons, works offline once played</span></label>${sw('narrator')}</div>
 <div class="opt"><label>Reading voice</label><select id="vSel"><option value="">Automatic (calm English)</option>${voices.map(v=>`<option ${v.name===S.settings.voice?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>
 <div class="opt"><label>Reading pace</label><input type="range" min=".7" max="1.15" step=".05" value="${S.settings.rate}" id="rate"></div>
 <div class="opt"><label></label><button class="btn ghost sm" id="vTest">Test voice</button></div>
 <div class="opt"><label>Ambient sound</label>${seg('ambient',['off','rain','sea','hearth','temple'],['Off','Rain','Sea','Hearth','Temple'])}</div>
 <div class="opt"><label>Ambient volume</label><input type="range" min=".05" max="1" step=".05" value="${S.settings.ambVol}" id="avol"></div>
 <div class="opt"><label>Bell when a lesson is finished</label>${sw('bell')}</div>
 <div class="opt"><label>Vibrate</label>${sw('vibrate')}</div>
 <div class="opt"><label>Study ahead<br><span class="small">Open the next day right after finishing</span></label>${sw('ahead')}</div>
 <div class="opt"><label>Save all narration for offline</label><button class="btn ghost sm" id="dlAudio">Download</button></div>
 <div class="opt"><label>Backup</label><span class="row"><button class="btn ghost sm" id="exp">Export</button><button class="btn ghost sm" id="imp">Import</button></span></div>
 <div class="opt"><label>Start over</label><button class="btn ghost sm" id="reset">Reset</button></div>
 <p class="small" style="margin-top:16px;line-height:1.5">Text: Marcus Aurelius, <i>Meditations</i>, translated by George Long (1862), public domain. Explanations and plain-word versions written for this app. Everything you write stays on this phone.</p>`);
 document.querySelectorAll('.sheet .seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=g.dataset.key;let v=b.dataset.v;if(k==='fs')v=+v;S.settings[k]=v;save();g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  if(k==='theme'||k==='fs')applyTheme();if(k==='ambient'){if(v==='off')setAmb(false);else setAmb(true)}}));
 document.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const k=b.dataset.sw;S.settings[k]=!S.settings[k];save();b.classList.toggle('on',S.settings[k]);if(k==='bell'&&S.settings.bell)bell(.4);if(k==='vibrate')buzz(30);if(k==='ahead')render()});
 $('vSel').onchange=e=>{S.settings.voice=e.target.value;save()};$('rate').oninput=e=>{S.settings.rate=+e.target.value;save()};
 $('avol').oninput=e=>{S.settings.ambVol=+e.target.value;save();if(amb)amb.master.gain.value=S.settings.ambVol*.6};
 $('vTest').onclick=()=>{stopSpeak();if(S.settings.narrator){playNarration(1,null,()=>stopSpeak());return}sayText('Begin the morning by saying to thyself: today I shall meet with the busybody, the ungrateful, and the arrogant.',null,()=>{})};
 $('dlAudio').onclick=async e=>{const b=e.target;b.disabled=true;try{const c=await caches.open('med-audio');for(let d=1;d<=N;d++){b.textContent=`${d}/${N}`;for(const k of['d','l']){const u=`audio/${k}${pad(d)}.mp3`;if(!(await c.match(u))){const r=await fetch(u);if(r.ok)await c.put(u,r)}}}b.textContent='Saved ✓'}catch(err){b.textContent='Try again';b.disabled=false}};
 $('exp').onclick=()=>{const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`meditations-backup-${ymd()}.json`;a.click()};
 $('imp').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='application/json';i.onchange=()=>{const f=i.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);if(!o.done)throw 0;S=Object.assign({},DEF,o);S.settings=Object.assign({},DEF.settings,o.settings||{});save();applyTheme();closeSheet();render();toast('Backup restored')}catch(e){toast('That file is not a Meditations backup')}})};i.click()};
 $('reset').onclick=()=>{if(confirm('Erase all progress, journal entries and saved passages on this phone?')){localStorage.removeItem(LS);location.reload()}}};

// ---------- boot ----------
render();
if(location.hash.startsWith('#day')){const d=+location.hash.slice(4);if(d)openLesson(d)}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){applyTheme();if(!curL)render()}});
})();
