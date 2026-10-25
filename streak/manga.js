// Manga-style flipbook demos. Drawn poses in art/<pose>.webp, flipped on a shared clock.
// Overrides window.Demos from demos.js (kept as the vector fallback).
(function(G){
const ST='stand',FS='front';
// sequence: [pose, ms] pairs; one-pose moves get a gentle breathing bob instead
const Q={
 march:[[ST,450],['march_1',550],[ST,450],['march_2',550]],
 armcirc:[['armcirc_1',380],['armcirc_2',380],['armcirc_1',380],['armcirc_3',380]],
 hipcirc:[['hipcirc_1',600],['hipcirc_2',600],['hipcirc_3',600],['hipcirc_2',600]],
 stepjack:[[FS,600],['stepjack_1',650],[FS,600],['stepjack_2',650]],
 jacks:[[FS,420],['jacks_1',420]],
 highknee:[[ST,300],['march_1',380],[ST,300],['march_2',380]],
 shadow:[['shadow_1',380],['shadow_2',330],['shadow_1',380],['shadow_3',330]],
 skaters:[['skaters_1',800],['skaters_2',800]],
 squat:[[ST,900],['squat_mid',220],['squat_low',1000],['squat_mid',220]],
 chairsq:[['chairsq_1',1000],['chairsq_2',1000]],
 lunge:[[ST,800],['lunge_1',1100],[ST,800],['lunge_2',1100]],
 glute:[['glute_1',1000],['glute_2',1300]],
 calf:[['calf_1',900],['calf_2',1100]],
 wallsit:[['wallsit_1',0]],
 sideleg:[['sideleg_1',800],['sideleg_2',1000]],
 wallpush:[['wallpush_1',900],['wallpush_2',1000]],
 inclpush:[['inclpush_1',900],['inclpush_2',1000]],
 pushup:[['pushup_1',900],['pushup_2',1000]],
 dips:[['dips',0]],
 ytw:[['ytw_1',900],['ytw_2',900],['ytw_3',900]],
 punchup:[['punchup_1',800],['punchup_2',800]],
 deadbug:[['deadbug_1',700],['deadbug_2',1100],['deadbug_1',700],['deadbug_3',1100]],
 birddog:[['birddog_1',700],['birddog_2',1300],['birddog_1',700],['birddog_3',1300]],
 standcrunch:[['standcrunch_1',500],['standcrunch_2',700],['standcrunch_1',500],['standcrunch_3',700]],
 kneeplank:[['kneeplank_1',0]],
 plank:[['plank_1',0]],
 sidebend:[[FS,800],['sidebend_1',1400],[FS,800],['sidebend_2',1400]],
 hamstr:[[ST,1400],['hamstr_1',3000]],
 quad:[['quad_1',0]],
 chest:[['chest_1',0]],
 childpose:[['childpose_1',0]],
 breathe:[[FS,4000],['breathe_1',4000]],
};
const now=()=>typeof performance!=='undefined'?performance.now():0;
function idx(seq,t){
  const tot=seq.reduce((a,b)=>a+b[1],0);if(!tot)return 0;
  let m=t%tot;for(let i=0;i<seq.length;i++){if(m<seq[i][1])return i;m-=seq[i][1]}return 0;
}
function html(id,cls='',still){
  const seq=Q[id];if(!seq)return G.VDemos?G.VDemos.html(id,cls,still):'';
  const poses=[...new Set(seq.map(s=>s[0]))];
  // still thumbnail: show the most telling pose (the second one when there is one)
  const showPose=still?(poses[1]||poses[0]):seq[idx(seq,now())][0];
  const one=seq.length===1;
  return `<div class="mdemo ${cls}${still?' still':''}${one&&!still?' bob':''}" data-ex="${id}">`+
    poses.map(p=>`<img src="art/${p}.webp" data-p="${p}" alt="" draggable="false"${p===showPose?' class="on"':''}>`).join('')+`</div>`;
}
let timer=null;
function tick(){
  const t=now();
  document.querySelectorAll('.mdemo:not(.still)').forEach(el=>{
    const seq=Q[el.dataset.ex];if(!seq||seq.length<2)return;
    const p=seq[idx(seq,t)][0];
    if(el.dataset.cur!==p){el.dataset.cur=p;el.querySelectorAll('img').forEach(i=>i.classList.toggle('on',i.dataset.p===p))}
  });
}
function start(){if(!timer)timer=setInterval(tick,50)}
// warm the cache so the first flip never flashes
function preload(id){(Q[id]||[]).forEach(s=>{const i=new Image();i.src='art/'+s[0]+'.webp'})}
G.VDemos=G.Demos;
G.Demos={has:id=>!!Q[id],html,start,preload,_Q:Q};
})(typeof window!=='undefined'?window:globalThis);
