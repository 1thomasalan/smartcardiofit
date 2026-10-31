// Alfie — Phase 1.4 (space)
// A 2.5D armoured mini-bot: painted body + head layers, a live-drawn screen face on the visor, Web Audio lip sync,
// pre-rendered ElevenLabs lines (James, eleven_v3) + keyword intents. No API keys live in this file.
// The old Batman cave is still reachable at cave.html (or ?model=v3b / v2 / v1 on this page).
'use strict';

// Intents: keywords → pre-rendered line + how Alfie carries it (face while talking, flourish at the end).
const INTENTS = [
  { id: 'brief',    chip: 'Good morning',     keys: ['good morning', 'morning', 'brief', 'briefing', 'brief me', 'news', 'whats new', 'update me', 'daily update'], face: 'neutral', after: 'smug' },
  { id: 'time',     chip: 'What time is it?', keys: ['time', 'clock', 'oclock', 'what hour', 'whats the date', 'what day', 'todays date'], face: 'neutral', after: 'smug' },
  { id: 'who',      chip: 'Who are you?',     keys: ['who are you', 'what are you', 'your name', 'who is this', 'whos this', 'who am i talking to', 'introduce yourself'], face: 'smug', after: 'smug', move: 'hop' },
  { id: 'can',      chip: 'What can you do?', keys: ['what can you do', 'can you do', 'what do you do', 'help', 'abilities', 'capable', 'features', 'how do you work', 'what can i ask'], face: 'smug', after: 'happy' },
  { id: 'joke',     chip: 'Tell me a joke',   keys: ['joke', 'jokes', 'funny', 'make me laugh', 'laugh', 'humor', 'humour'], face: 'smug', after: 'happy', move: 'spin' },
  { id: 'thanks',   chip: 'Thank you',        keys: ['thank you', 'thanks', 'thank', 'thx', 'appreciate', 'cheers', 'good job', 'nice work', 'well done'], face: 'happy', after: 'happy', move: 'hop' },
  { id: 'bye',      chip: 'Goodbye',          keys: ['goodbye', 'good bye', 'bye', 'bye bye', 'see you', 'see ya', 'later', 'good night', 'goodnight', 'signing off', 'thats all', 'im out'], face: 'happy', after: 'happy', move: 'hop' },
  { id: 'greeting', chip: 'Hello',            keys: ['hello', 'hi', 'hey', 'yo', 'hiya', 'howdy', 'greetings', 'whats up', 'sup', 'good evening', 'good afternoon', 'evening', 'afternoon', 'hey there', 'hello there'], face: 'happy', after: 'smug', move: 'hop' },
];
const FALLBACK = { id: 'fallback', face: 'sheepish', after: 'sheepish' };

// ---------- DOM ----------
const $ = (s) => document.querySelector(s);
const el = {
  gate: $('#gate'), gateSub: $('#gateSub'), gateBar: $('#gateBar'), enter: $('#btnEnter'), status: $('#statusText'),
  caption: $('#captionLine'), you: $('#youLine'), chips: $('#chips'), ptt: $('#ptt'), hint: $('#hint'), dock: $('#dock'),
  meterL: $('#meter'), meterR: $('#meterR'), clock: $('#clock'), clockTime: $('#clockTime'), clockDate: $('#clockDate'),
  sheet: $('#sheet'), backdrop: $('#sheetBackdrop'), btnSettings: $('#btnSettings'), sheetClose: $('#sheetClose'),
  btnFrame: $('#btnFrame'), frameLabel: $('#frameLabel'), tglCaptions: $('#tglCaptions'), tglMute: $('#tglMute'),
  tglDebug: $('#tglDebug'), dbgPanel: $('#dbgPanel'), dbgLog: $('#dbgLog'), dbgCopy: $('#dbgCopy'),
  stage: $('#stage'), bot: $('#bot'), botFloat: $('#botFloat'), botHead: $('#botHead'), face: $('#face'),
  thrust: $('#thrust'), stars: $('#stars'), spaceImg: $('#spaceImg'), topbar: $('.topbar'),
};

// ---------- Settings (persisted) ----------
const prefs = Object.assign({ view: 'full', mood: 'smug', captions: true, mute: false, debug: false },
  JSON.parse(localStorage.getItem('alfie.prefs') || '{}'));
const savePrefs = () => localStorage.setItem('alfie.prefs', JSON.stringify(prefs));

let state = 'idle';
const lines = {};
let entered = false;
let speakToken = 0;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const STATE_LABEL = { idle: 'Idle', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' };
function setState(s) {
  state = s;
  document.body.dataset.state = s;
  el.status.textContent = STATE_LABEL[s] || s;
}

// =====================================================================================================
// Alfie engine: layout, float motion, thrusters, stars, face, audio.
// =====================================================================================================
const lerpK = (rate, dt) => 1 - Math.exp(-rate * dt);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Face parameters (design space = 286 x 213, the visor box).
const BASE = { eo: 1, es: 1, ex: 0, ey: 0, lid: 0.1, bl: 0, br: 0, bt: 0, smile: 0.35, skew: 0, mo: 0, mw: 1, happy: 0, dots: 0 };
const EXPR = {
  neutral:   { lid: 0.12, smile: 0.35 },
  smug:      { lid: 0.42, smile: 0.5, skew: 0.65, bl: -0.15, br: 0.75, ex: 0.12 },
  happy:     { happy: 1, smile: 1, bl: 0.35, br: 0.35, lid: 0 },
  listening: { eo: 1.1, es: 1.12, bl: 0.6, br: 0.6, smile: 0.25, lid: 0, mw: 0.8 },
  thinking:  { ex: 0.6, ey: -0.75, lid: 0.18, bl: 0.15, br: 0.7, smile: 0, mw: 0.5, dots: 1 },
  surprised: { eo: 1.22, es: 1.2, bl: 1, br: 1, mo: 0.55, smile: 0, mw: 0.5, lid: 0 },
  sheepish:  { bt: 0.7, smile: 0.25, skew: -0.35, lid: 0.15, ex: -0.25, ey: 0.35, bl: 0.2, br: 0.2 },
};

const head = {
  audioCtx: null, analyser: null, src: null, gain: null, data: null,
  expr: 'smug', hold: 0, P: { ...BASE, ...EXPR.smug }, T: { ...BASE },
  blink: 0, nextBlink: 2, glance: { x: 0, y: 0 }, nextGlance: 3, level: 0, lvlQ: 0, micLevel: 0, micAn: null,
  tilt: 0, lean: 1, boost: 0, hopV: 0, hopY: 0, spin: -1, view: 'full', W: 0, H: 0,
  ensureAudio() {
    if (this.audioCtx) return this.audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AC();
    this.analyser = this.audioCtx.createAnalyser(); this.analyser.fftSize = 1024;
    this.gain = this.audioCtx.createGain();
    this.analyser.connect(this.gain); this.gain.connect(this.audioCtx.destination);
    this.data = new Float32Array(this.analyser.fftSize);
    return this.audioCtx;
  },
  setMute(on) { if (this.gain) this.gain.gain.value = on ? 0 : 1; },
  setExpression(name, holdSec) { this.expr = name; this.hold = holdSec || 0; },
  play(buffer, onEnd) {
    this.stopSpeaking();
    const s = this.audioCtx.createBufferSource();
    s.buffer = buffer; s.connect(this.analyser);
    s.onended = () => { if (this.src === s) { this.src = null; onEnd && onEnd(); } };
    this.src = s; s.start();
  },
  stopSpeaking() { if (this.src) { const s = this.src; this.src = null; try { s.stop(); } catch {} } },
  startListening(an) { this.micAn = an; },
  stopListening() { this.micAn = null; this.micLevel = 0; },
  hop() { this.hopV = -2.4; this.boost = 1; },
  doSpin() { this.spin = 0; this.boost = 1; },
};

// ---------- Layout ----------
function layout() {
  const top = el.topbar.getBoundingClientRect().bottom + 2;
  const dockTop = el.dock.getBoundingClientRect().top;
  const W = innerWidth, stageH = Math.max(160, dockTop - top);
  document.documentElement.style.setProperty('--stageT', top + 'px');
  document.documentElement.style.setProperty('--stageB', (innerHeight - dockTop) + 'px');
  let h = Math.min(stageH * 0.94, (W * 0.86) * 1085 / 514);
  let shift = 0;
  if (head.view === 'close') {
    h = Math.min(stageH * 1.9, W * 1.25 * 1085 / 514);
    shift = (0.5 - 0.215) * h - (0.5 - 0.44) * stageH;   // put the visor ~44% down the stage
  }
  el.bot.style.setProperty('--botH', h + 'px');
  el.bot.style.marginTop = (shift * 2) + 'px';
  head.W = h * 514 / 1085; head.H = h;
  sizeCanvas(el.face); sizeCanvas(el.thrust); sizeCanvas(el.stars);
  initStars();
}
const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
function sizeCanvas(c) {
  const r = c.getBoundingClientRect(), d = DPR();
  c.width = Math.max(1, Math.round(r.width * d)); c.height = Math.max(1, Math.round(r.height * d));
}

// ---------- Stars (3 parallax layers + the odd shooting star) ----------
let stars = [], shooter = null, nextShoot = 6;
function initStars() {
  const c = el.stars, n = Math.round(clamp(c.width * c.height / (9000 * DPR() * DPR()), 60, 170));
  stars = Array.from({ length: n }, () => {
    const z = Math.random();
    return { x: Math.random(), y: Math.random(), z, r: (0.4 + z * 1.3) * DPR(), a: 0.35 + Math.random() * 0.6,
      tw: Math.random() * 6.28, ts: 0.6 + Math.random() * 2.2, warm: Math.random() < 0.18 };
  });
}
function drawStars(dt, t) {
  const c = el.stars, ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  for (const s of stars) {
    s.x -= dt * (0.002 + s.z * 0.008); s.y += dt * (0.0008 + s.z * 0.002);
    if (s.x < -0.01) s.x += 1.02; if (s.y > 1.01) s.y -= 1.02;
    const a = s.a * (0.65 + 0.35 * Math.sin(t * s.ts + s.tw));
    ctx.fillStyle = s.warm ? `rgba(255,200,150,${a})` : `rgba(200,240,255,${a})`;
    ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
  }
  nextShoot -= dt;
  if (!shooter && nextShoot < 0) { shooter = { x: Math.random() * 0.7 + 0.3, y: Math.random() * 0.35, life: 0 }; nextShoot = 9 + Math.random() * 14; }
  if (shooter) {
    shooter.life += dt; const k = shooter.life / 0.9;
    const x = (shooter.x - k * 0.35) * w, y = (shooter.y + k * 0.18) * h, L = 70 * DPR();
    const g = ctx.createLinearGradient(x, y, x + L, y - L * 0.5);
    g.addColorStop(0, `rgba(220,250,255,${0.8 * (1 - k)})`); g.addColorStop(1, 'rgba(220,250,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1.4 * DPR(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y - L * 0.5); ctx.stroke();
    if (k >= 1) shooter = null;
  }
}

// ---------- Thrusters (particles from the two foot nozzles) ----------
const parts = [];
function drawThrust(dt, t) {
  const c = el.thrust, ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  // canvas spans x -30%..130% and y 70%..130% of the bot box (source px 514 x 1085)
  const sx = w / (514 * 1.6), sy = h / (1085 * 0.6);
  const noz = [[175 + 154, 1035 - 760], [342 + 154, 1035 - 760]];
  const power = 0.55 + head.boost * 0.9 + Math.sin(t * 23) * 0.06;
  ctx.globalCompositeOperation = 'lighter';
  for (const [nx, ny] of noz) {
    const x = nx * sx, y = ny * sy, R = (34 + power * 26) * sx;
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(170,250,255,${0.55 * power})`); g.addColorStop(0.4, `rgba(40,210,255,${0.22 * power})`); g.addColorStop(1, 'rgba(0,120,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    const n = REDUCED ? 0 : Math.round(dt * (26 + head.boost * 70));
    for (let i = 0; i < n; i++) parts.push({ x: nx + (Math.random() - 0.5) * 14, y: ny + Math.random() * 10, vx: (Math.random() - 0.5) * 30,
      vy: 120 + Math.random() * 140 + head.boost * 160, life: 0, max: 0.5 + Math.random() * 0.5, warm: Math.random() < 0.22, r: 2 + Math.random() * 3 });
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += dt;
    if (p.life > p.max) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    const k = 1 - p.life / p.max;
    ctx.fillStyle = p.warm ? `rgba(255,170,90,${0.7 * k})` : `rgba(120,240,255,${0.75 * k})`;
    ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, p.r * k * sx * 1.4 + 0.5, 0, 6.283); ctx.fill();
  }
  if (parts.length > 400) parts.splice(0, parts.length - 400);
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- Face ----------
function faceTargets(dt, t) {
  const h = head;
  let name = h.expr;
  if (state === 'listening') name = 'listening';
  else if (state === 'thinking') name = 'thinking';
  const T = { ...BASE, ...EXPR[name] };
  // idle glances + blinks
  h.nextGlance -= dt;
  if (h.nextGlance < 0) {
    h.glance = Math.random() < 0.45 ? { x: 0, y: 0 } : { x: (Math.random() - 0.5) * 1.1, y: (Math.random() - 0.5) * 0.6 };
    h.nextGlance = 1.8 + Math.random() * 3;
  }
  if (state === 'idle') { T.ex += h.glance.x * 0.7; T.ey += h.glance.y * 0.7; }
  if (state === 'speaking') { T.ex += h.glance.x * 0.25; T.ey += h.glance.y * 0.2; }
  h.nextBlink -= dt;
  if (h.nextBlink < 0) { h.blink = 0.0001; h.nextBlink = 2.2 + Math.random() * 4 + (Math.random() < 0.2 ? -1.8 : 0); }
  if (h.blink > 0) { h.blink += dt / 0.16; if (h.blink >= 1) h.blink = 0; }
  // mouth from audio level, quantised to 5 screen "frames"
  if (state === 'speaking') {
    T.mo = h.lvlQ * 0.95; T.mw = 0.85 + h.lvlQ * 0.25; T.lid = Math.min(T.lid, 0.3);
    if (T.happy) T.happy = 0.55;
  } else if (state === 'listening') {
    T.eo += h.micLevel * 0.1;
  }
  const P = h.P, k = lerpK(state === 'speaking' ? 22 : 9, dt), km = lerpK(30, dt);
  for (const key in T) P[key] += (T[key] - P[key]) * (key === 'mo' ? km : k);
}

const CY = 'rgb(140,248,255)', GLOW = 'rgba(30,220,255,0.95)';
function drawFace(t) {
  const c = el.face, ctx = c.getContext('2d'), P = head.P;
  const s = c.width / 286;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.shadowColor = GLOW; ctx.shadowBlur = 12 * s;
  ctx.fillStyle = CY; ctx.strokeStyle = CY; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bl = head.blink > 0 ? Math.sin(head.blink * Math.PI) : 0;
  const ex = P.ex * 13, ey = P.ey * 11;
  const eyes = [-1, 1].map((sd) => ({ sd, cx: 143 + sd * 57 + ex, cy: 96 + ey }));
  // eyes (rounded screen pills), half-lidded via a cut, blended with ^ ^ happy arcs
  const ry = 25 * P.es * clamp(P.eo, 0, 1.4) * (1 - bl * 0.92), rx = 18 * P.es;
  const solid = clamp(1 - P.happy, 0, 1);
  if (solid > 0.02) {
    ctx.globalAlpha = solid;
    for (const e of eyes) { ctx.beginPath(); ctx.ellipse(e.cx, e.cy, rx, Math.max(2.5, ry), 0, 0, 6.283); ctx.fill(); }
    // lid cut (smug = flat heavy lid; left lid a touch lower for the asymmetric smirk)
    const lid = clamp(P.lid + bl * 0.1, 0, 0.9);
    if (lid > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      for (const e of eyes) {
        const extra = e.sd < 0 ? P.skew * 0.12 : -P.skew * 0.05;
        const yc = e.cy - ry + 2 * ry * clamp(lid + extra, 0, 0.95);
        ctx.save(); ctx.translate(e.cx, yc); ctx.rotate(e.sd * P.bt * -0.25);
        ctx.fillRect(-rx - 6, -60, rx * 2 + 12, 60); ctx.restore();
      }
      ctx.restore();
      // lid edge line so the cut reads as an eyelid
      ctx.lineWidth = 4.5;
      for (const e of eyes) {
        const extra = e.sd < 0 ? P.skew * 0.12 : -P.skew * 0.05;
        const yc = e.cy - ry + 2 * ry * clamp(lid + extra, 0, 0.95);
        if (lid + extra > 0.08) { ctx.beginPath(); ctx.moveTo(e.cx - rx - 3, yc + e.sd * P.bt * 3); ctx.lineTo(e.cx + rx + 3, yc - e.sd * P.bt * 3); ctx.stroke(); }
      }
    }
  }
  if (P.happy > 0.02) {
    ctx.globalAlpha = clamp(P.happy, 0, 1); ctx.lineWidth = 8;
    for (const e of eyes) { ctx.beginPath(); ctx.arc(e.cx, e.cy + 8, 17, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  // brows
  ctx.lineWidth = 6;
  for (const e of eyes) {
    const raise = e.sd < 0 ? P.bl : P.br;
    const by = e.cy - 42 - raise * 11 + (P.happy * 2);
    const inner = e.cx - e.sd * 17, outer = e.cx + e.sd * 17;
    const iy = by - P.bt * 7, oy = by + P.bt * 3 + (e.sd > 0 ? -P.skew * 3 : 0);
    ctx.beginPath(); ctx.moveTo(inner, iy); ctx.quadraticCurveTo(e.cx, Math.min(iy, oy) - 4 - raise * 2, outer, oy); ctx.stroke();
  }
  // mouth
  const mAlpha = clamp(1 - P.dots, 0, 1);
  if (mAlpha > 0.02) {
    ctx.globalAlpha = mAlpha;
    const cx = 143 + P.skew * 7 + ex * 0.4, cy = 160 + ey * 0.5, w = 30 * P.mw + P.smile * 6;
    const lx = cx - w, rx2 = cx + w;
    const ly = cy - P.smile * 7 + P.skew * 5, ry2 = cy - P.smile * 7 - P.skew * 7;
    const up = cy + P.smile * 9 - P.mo * 4, dn = cy + P.smile * 9 + P.mo * 34 + 1;
    ctx.lineWidth = 6;
    if (P.mo < 0.06) {
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(cx, up + 2, rx2, ry2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(cx, up, rx2, ry2); ctx.quadraticCurveTo(cx, dn, lx, ly); ctx.closePath();
      ctx.save(); ctx.globalAlpha = mAlpha * 0.32; ctx.fill(); ctx.restore();
      ctx.lineWidth = 5; ctx.stroke();
    }
  }
  // thinking dots
  if (P.dots > 0.02) {
    for (let i = 0; i < 3; i++) {
      const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * 6 - i * 0.9));
      ctx.globalAlpha = P.dots * a; ctx.beginPath(); ctx.arc(127 + i * 16, 162, 4.5, 0, 6.283); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- Audio level ----------
function sampleLevel(dt) {
  const h = head;
  let target = 0;
  if (h.src && h.analyser) {
    h.analyser.getFloatTimeDomainData(h.data);
    let sum = 0; for (let i = 0; i < h.data.length; i++) sum += h.data[i] * h.data[i];
    const rms = Math.sqrt(sum / h.data.length);
    target = clamp((rms - 0.012) * 7.5, 0, 1);
  }
  h.level += (target - h.level) * lerpK(target > h.level ? 40 : 14, dt);
  h.lvlQ = Math.round(h.level * 4) / 4;
  if (h.micAn) {
    const d = new Uint8Array(h.micAn.frequencyBinCount); h.micAn.getByteFrequencyData(d);
    let s = 0; for (let i = 2; i < 40; i++) s += d[i];
    h.micLevel = Math.min(1, s / (38 * 170));
  }
  document.body.style.setProperty('--glow', (h.level * 0.9 + (state === 'listening' ? 0.3 : 0)).toFixed(3));
}

// ---------- Motion (zero-g float, tilt, lean, hop, spin) ----------
function moveBot(dt, t) {
  const h = head, H = h.H || 500;
  const amp = REDUCED ? 0.2 : 1;
  // hop: spring back to rest
  h.hopV += (-h.hopY * 9 - h.hopV * 3.2) * dt; h.hopY += h.hopV * dt;
  h.boost += (0 - h.boost) * lerpK(1.6, dt);
  let spinDeg = 0;
  if (h.spin >= 0) { h.spin += dt / 1.25; const k = Math.min(1, h.spin); spinDeg = 360 * (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2); if (h.spin >= 1) h.spin = -1; }
  const y = (Math.sin(t * 0.95) * 0.012 + Math.sin(t * 0.43) * 0.006) * H * amp + h.hopY * 0.05 * H;
  const x = Math.sin(t * 0.37) * 0.01 * H * amp;
  const r = (Math.sin(t * 0.61) * 1.8 + Math.sin(t * 0.23) * 0.8) * amp + spinDeg;
  el.botFloat.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${r.toFixed(2)}deg)`;
  // lean in when listening
  const leanT = state === 'listening' ? 1.045 : 1;
  h.lean += (leanT - h.lean) * lerpK(5, dt);
  el.bot.style.transform = `scale(${h.lean.toFixed(4)})`;
  // head tilt
  let tiltT = Math.sin(t * 0.8) * 1.2;
  if (state === 'listening') tiltT = 7 + Math.sin(t * 1.3) * 1;
  else if (state === 'thinking') tiltT = -5;
  else if (state === 'speaking') tiltT = Math.sin(t * 2.2) * 2.2 + (h.P.skew > 0.3 ? 2.5 : 0);
  else if (h.expr === 'smug') tiltT += 2.5;
  h.tilt += (tiltT - h.tilt) * lerpK(4, dt);
  const nod = state === 'speaking' ? -h.level * 0.003 * H : 0;
  el.botHead.style.transform = `translate3d(0,${nod.toFixed(2)}px,0) rotate(${h.tilt.toFixed(2)}deg)`;
  // space parallax
  el.spaceImg.style.transform = `translate3d(${(Math.sin(t * 0.05) * 1.6).toFixed(2)}%,${(Math.cos(t * 0.04) * 1.2).toFixed(2)}%,0) scale(1.04)`;
}

let lastT = 0, running = true;
function frame(ts) {
  const t = ts / 1000, dt = Math.min(0.05, lastT ? t - lastT : 0.016); lastT = t;
  if (head.hold > 0) { head.hold -= dt; if (head.hold <= 0 && state === 'idle') head.expr = prefs.mood; }
  sampleLevel(dt);
  faceTargets(dt, t);
  moveBot(dt, t);
  drawFace(t);
  drawThrust(dt, t);
  drawStars(dt, t);
  if (running) requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) running = false; else if (!running) { running = true; lastT = 0; requestAnimationFrame(frame); }
});

// ---------- Lines ----------
const LINE_IDS = ['greeting', 'who', 'can', 'time', 'brief', 'joke', 'thanks', 'bye', 'fallback'];
async function loadLines(onProgress) {
  let done = 0;
  await Promise.all(LINE_IDS.map(async (id) => {
    const [meta, mp3] = await Promise.all([
      fetch(`lines/${id}.json`).then((r) => r.json()),
      fetch(`lines/${id}.mp3`).then((r) => r.arrayBuffer()),
    ]);
    lines[id] = { ...meta, mp3 };
    onProgress && onProgress(++done / LINE_IDS.length);
  }));
}
function decode(ctx, ab) {
  return new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
}
async function bufferFor(id) {
  const L = lines[id];
  if (!L.buffer) L.buffer = await decode(head.audioCtx, L.mp3.slice(0));
  return L.buffer;
}

// ---------- Captions ----------
let captionRaf = 0;
function renderCaption(L) {
  el.caption.innerHTML = L.words.map((w, i) => `<span class="w" data-i="${i}">${w.replace(/</g, '&lt;')}</span>`).join(' ');
}
function runCaption(L) {
  cancelAnimationFrame(captionRaf);
  const spans = el.caption.querySelectorAll('.w');
  const t0 = performance.now();
  let k = 0;
  const step = () => {
    const t = performance.now() - t0;
    while (k < L.wtimes.length && L.wtimes[k] <= t) spans[k++].classList.add('on');
    if (k < L.wtimes.length) captionRaf = requestAnimationFrame(step);
  };
  step();
}

// ---------- Speak ----------
async function speak(intent) {
  const id = intent.id, L = lines[id];
  if (!L || !head.audioCtx) return;
  const token = ++speakToken;
  head.stopSpeaking();
  cancelAnimationFrame(captionRaf);
  setState('thinking');
  const [buffer] = await Promise.all([bufferFor(id), new Promise((r) => setTimeout(r, 650))]);
  if (token !== speakToken) return;
  if (id === 'time') showClock();
  renderCaption(L);
  head.setExpression(intent.face || 'neutral');
  setState('speaking');
  runCaption(L);
  head.play(buffer, () => {
    if (token !== speakToken) return;
    setState('idle');
    head.setExpression(intent.after || prefs.mood, 4);
    if (intent.move === 'hop') head.hop(); else if (intent.move === 'spin') head.doSpin();
  });
}

function showClock() {
  const d = new Date();
  el.clockTime.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  el.clockDate.textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  el.clock.hidden = false;
  clearTimeout(showClock.t);
  showClock.t = setTimeout(() => { el.clock.hidden = true; }, 9000);
}

// ---------- Intent matching ----------
function normalize(text) {
  return ' ' + String(text || '').toLowerCase()
    .replace(/[\u2018\u2019\u02bc`]/g, "'")
    .replace(/'/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ').trim() + ' ';
}
const INTENT_PRIORITY = ['time', 'who', 'can', 'joke', 'brief', 'thanks', 'bye', 'greeting'];
function matchIntent(text) {
  const t = normalize(text);
  if (t.trim() === '') return FALLBACK;
  for (const id of INTENT_PRIORITY) {
    const it = INTENTS.find((x) => x.id === id);
    if (it && it.keys.some((k) => t.includes(normalize(k)))) return it;
  }
  return FALLBACK;
}

// ---------- Mic debug readout (Settings → Mic debug) ----------
const dbgLines = [];
function dbg(msg) {
  const ts = new Date().toLocaleTimeString([], { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0');
  dbgLines.push(`${ts}  ${msg}`);
  if (dbgLines.length > 60) dbgLines.shift();
  if (el.dbgLog) el.dbgLog.textContent = dbgLines.slice(-16).join('\n');
  console.debug('[mic]', msg);
}

// ---------- Listening: hold-to-talk OR tap-to-toggle ----------
// Root cause of the old "I didn't catch that" bug: the recognizer was only created after an awaited getUserMedia()
// (the level meter). A quick tap, or the first-time permission prompt, released the button before the recognizer
// existed, so an empty transcript went straight to the fallback line. On Android, the getUserMedia meter also holds
// the mic while SpeechRecognition wants it. Now the recognizer starts synchronously inside the tap, the real meter
// only runs on desktop (after recognition has the mic), and we wait for the final result before deciding.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const IS_ANDROID = /Android/i.test(navigator.userAgent);
const TAP_MS = 350;          // shorter press = tap → toggle mode (tap again to stop)
const MAX_LISTEN_MS = 20000; // safety auto-stop in toggle mode
const ERR_MSG = {
  'not-allowed': 'Mic blocked — allow microphone for this site (lock icon in the address bar → Microphone → Allow), then try again.',
  'service-not-allowed': 'Mic blocked — allow microphone for this site (lock icon in the address bar → Microphone → Allow), then try again.',
  'audio-capture': 'No microphone available — another app may be using it. Close it and try again.',
  'network': 'Speech service unreachable — check your connection (Chrome sends speech to Google to transcribe).',
  'language-not-supported': 'English speech recognition isn’t available on this device.',
  'start-failed': 'The microphone didn’t start. Reload the page and try again.',
  'unsupported': 'Voice input isn’t available in this browser — use Chrome, or tap a prompt below.',
};
const FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported', 'start-failed']);

const mic = {
  active: false, mode: null, downAt: 0, rec: null, ended: true, resolved: true,
  committed: '', sessFinal: '', interim: '', error: null, restarts: 0, stopTimer: 0, maxTimer: 0,
  ignoreUp: false, stream: null, meterRaf: 0, fakeRaf: 0, activity: 0,
};
const barsL = [...el.meterL.children], barsR = [...el.meterR.children];

function setYou(kind, text) {
  el.you.hidden = !text;
  el.you.className = 'captions__you is-' + kind;   // is-live | is-said | is-error | is-chip
  el.you.textContent = text || '';
}
function heardText() { return (mic.committed + ' ' + mic.sessFinal + ' ' + mic.interim).replace(/\s+/g, ' ').trim(); }

function drawMeter(lvl) {
  document.body.style.setProperty('--lvl', lvl.toFixed(3));
  const set = (b, i) => { const v = Math.max(0, lvl * 1.4 - i * 0.09 + Math.random() * .08); b.style.height = (6 + v * 38) + 'px'; };
  barsL.forEach(set); barsR.forEach(set);
}
function resetMeter() {
  cancelAnimationFrame(mic.meterRaf); cancelAnimationFrame(mic.fakeRaf);
  document.body.style.setProperty('--lvl', 0);
  [...barsL, ...barsR].forEach((b) => (b.style.height = '6px'));
  if (mic.stream) { mic.stream.getTracks().forEach((t) => t.stop()); mic.stream = null; }
}
// Desktop: real level meter, opened only after recognition has the mic. Android: animated meter, no second mic.
async function startRealMeter() {
  if (IS_ANDROID || !navigator.mediaDevices?.getUserMedia || mic.stream || !mic.active) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    if (!mic.active) { stream.getTracks().forEach((t) => t.stop()); return; }
    mic.stream = stream;
    cancelAnimationFrame(mic.fakeRaf);
    const ctx = head.audioCtx, src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
    src.connect(an);
    try { head.startListening(an); } catch {}
    const data = new Uint8Array(an.frequencyBinCount);
    const tick = () => {
      an.getByteFrequencyData(data);
      let sum = 0; for (let i = 2; i < 40; i++) sum += data[i];
      drawMeter(Math.min(1, sum / (38 * 170)));
      mic.meterRaf = requestAnimationFrame(tick);
    };
    tick();
    dbg('meter: real (getUserMedia)');
  } catch (e) { dbg('meter: unavailable (' + (e.name || e) + ')'); }
}
function startFakeMeter() {
  const tick = () => {
    mic.activity *= 0.94;
    drawMeter(Math.min(1, 0.12 + mic.activity * 0.8 + Math.random() * 0.08));
    mic.fakeRaf = requestAnimationFrame(tick);
  };
  tick();
}

function newRecognizer() {
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = !IS_ANDROID;      // Android Chrome's continuous mode repeats/duplicates results; restart instead
  rec.maxAlternatives = 1;
  rec.onstart = () => { mic.ended = false; dbg('onstart'); };
  rec.onaudiostart = () => { dbg('onaudiostart'); startRealMeter(); };
  rec.onspeechstart = () => { mic.activity = 1; dbg('onspeechstart'); };
  rec.onspeechend = () => dbg('onspeechend');
  rec.onnomatch = () => dbg('onnomatch');
  rec.onresult = (ev) => {
    // Rebuild this session's text from index 0 (avoids Android's duplicated finals).
    let fin = '', inter = '';
    for (let i = 0; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) fin += r[0].transcript + ' '; else inter += r[0].transcript + ' ';
    }
    mic.sessFinal = fin.trim(); mic.interim = inter.trim(); mic.activity = 1;
    dbg(`onresult final="${mic.sessFinal}" interim="${mic.interim}"`);
    if (mic.active || !mic.resolved) setYou('live', heardText() || 'Listening…');
  };
  rec.onerror = (e) => {
    dbg('onerror: ' + e.error + (e.message ? ' (' + e.message + ')' : ''));
    if (e.error === 'no-speech' || e.error === 'aborted') { if (!mic.error) mic.error = e.error; return; }
    mic.error = e.error;
    if (FATAL.has(e.error) && mic.active) stopListening(true);
  };
  rec.onend = () => {
    dbg('onend');
    mic.ended = true;
    mic.committed = (mic.committed + ' ' + mic.sessFinal).trim();
    // An unfinished interim from an auto-ended session is still what he said.
    if (mic.active && mic.interim) mic.committed = (mic.committed + ' ' + mic.interim).trim();
    if (mic.active) mic.interim = '';
    mic.sessFinal = '';
    if (mic.active && IS_ANDROID && mic.mode === 'toggle' && heardText()) { dbg('android: phrase done → send'); stopListening(); return; }
    if (mic.active && !FATAL.has(mic.error) && mic.restarts < 12) {
      // Still holding / toggle still on: Chrome ended the session on its own (silence, Android one-shot). Restart.
      mic.restarts++;
      try { rec.start(); dbg('restart #' + mic.restarts); return; } catch (err) { dbg('restart failed: ' + err.message); }
    }
    if (!mic.active) finishListening('onend');
    else stopListening();
  };
  return rec;
}

function startListening(mode) {
  if (!entered || mic.active) return;
  if (!SR) { setYou('error', ERR_MSG.unsupported); dbg('no SpeechRecognition in this browser'); return; }
  speakToken++; head?.stopSpeaking(); cancelAnimationFrame(captionRaf);
  clearTimeout(mic.stopTimer);
  try { mic.rec?.abort(); } catch {}
  Object.assign(mic, { active: true, mode, downAt: performance.now(), committed: '', sessFinal: '', interim: '',
    error: null, restarts: 0, resolved: false, ended: true, activity: 0 });
  el.caption.textContent = '';
  setYou('live', 'Listening…');
  setState('listening');
  el.hint.textContent = 'Listening… release to send · or tap once to talk hands-free';
  dbg(`start (${mode}) android=${IS_ANDROID} continuous=${!IS_ANDROID}`);
  startFakeMeter();
  mic.rec = newRecognizer();
  try { mic.rec.start(); }      // synchronous, inside the user gesture
  catch (e) { dbg('start threw: ' + e.message); mic.error = 'start-failed'; stopListening(true); return; }
  clearTimeout(mic.maxTimer);
  mic.maxTimer = setTimeout(() => { if (mic.active) { dbg('auto-stop after ' + MAX_LISTEN_MS / 1000 + 's'); stopListening(); } }, MAX_LISTEN_MS);
}

function stopListening(cancel) {
  if (!mic.active) return;
  mic.active = false;
  clearTimeout(mic.maxTimer);
  resetMeter();
  try { head?.stopListening(); } catch {}
  setHint();
  dbg('stop' + (cancel ? ' (error)' : '') + ' — waiting for final result');
  setState('thinking');
  if (mic.ended) { finishListening('already-ended'); return; }
  try { mic.rec.stop(); } catch (e) { dbg('stop threw: ' + e.message); }
  // Safety net: if onend never arrives, decide with whatever we have (interim included).
  clearTimeout(mic.stopTimer);
  mic.stopTimer = setTimeout(() => { dbg('no onend after 3s — using what was heard'); try { mic.rec.abort(); } catch {} finishListening('timeout'); }, 3000);
}

function finishListening(why) {
  if (mic.resolved) return;
  mic.resolved = true;
  clearTimeout(mic.stopTimer);
  const text = heardText();
  dbg(`finish (${why}) text="${text}" error=${mic.error || 'none'}`);
  if (!text) {
    setState('idle');
    if (FATAL.has(mic.error)) setYou('error', ERR_MSG[mic.error]);
    else setYou('error', 'I didn’t hear anything. Hold the mic (or tap once), speak, then release or tap again.');
    return;
  }
  setYou('said', text);
  const it = matchIntent(text);
  dbg('intent: ' + it.id);
  speak(it);
}

function setHint() {
  if (!SR) { el.hint.textContent = 'Voice input isn’t available here — tap a prompt'; return; }
  el.hint.innerHTML = 'Hold to talk · or tap, then tap to send<span class="hint__key"> · or hold Space</span>';
}

function buildChips() {
  const order = ['greeting', 'who', 'can', 'time', 'brief', 'joke', 'thanks', 'bye'];
  for (const id of order) {
    const it = INTENTS.find((x) => x.id === id);
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = it.chip;
    b.addEventListener('click', () => {
      if (!entered) return;
      if (mic.active) { mic.resolved = true; stopListening(true); }
      setYou('chip', it.chip);
      speak(it);
    });
    el.chips.appendChild(b);
  }
}

function pressStart(src) {
  if (mic.active && mic.mode === 'toggle') { mic.ignoreUp = true; dbg(src + ': second tap → send'); stopListening(); return; }
  mic.ignoreUp = false;
  startListening('hold');
}
function pressEnd(src) {
  if (mic.ignoreUp) { mic.ignoreUp = false; return; }
  if (!mic.active || mic.mode !== 'hold') return;
  if (performance.now() - mic.downAt < TAP_MS) {
    mic.mode = 'toggle';
    el.hint.textContent = 'Listening… tap the mic again to send';
    dbg(src + ': quick tap → hands-free (tap again to send)');
  } else {
    stopListening();
  }
}
function wirePTT() {
  const p = el.ptt;
  p.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault(); try { p.setPointerCapture(e.pointerId); } catch {}
    pressStart('pointer');
  });
  p.addEventListener('pointerup', () => pressEnd('pointer'));
  p.addEventListener('pointercancel', () => { dbg('pointercancel'); pressEnd('pointer'); });
  p.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && mic.active) { mic.resolved = true; stopListening(true); setYou('error', 'Cancelled.'); setState('idle'); return; }
    if (e.code !== 'Space' || e.repeat || el.sheet.classList.contains('open')) return;
    if (/^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(document.activeElement?.tagName) && document.activeElement !== el.ptt) document.activeElement.blur();
    e.preventDefault(); pressStart('space');
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') { e.preventDefault(); pressEnd('space'); } });
  setHint();
}

async function logPermission() {
  try {
    const st = await navigator.permissions.query({ name: 'microphone' });
    dbg('mic permission: ' + st.state);
    st.onchange = () => dbg('mic permission → ' + st.state);
  } catch { dbg('mic permission: (query not supported)'); }
}

// ---------- Settings ----------
function applyView(v) {
  prefs.view = v; savePrefs(); head.view = v; layout();
  el.frameLabel.textContent = v === 'full' ? 'Close' : 'Full';
  el.btnFrame.setAttribute('aria-label', v === 'full' ? 'Close-up view' : 'Full body view');
  syncSeg('view', v);
}
function applyMood(m) { prefs.mood = m; savePrefs(); if (state === 'idle') head.setExpression(m); syncSeg('mood', m); }
function applyCaptions(on) { prefs.captions = on; savePrefs(); document.body.classList.toggle('no-captions', !on); el.tglCaptions.checked = on; }
function applyMute(on) { prefs.mute = on; savePrefs(); head.setMute(on); el.tglMute.checked = on; }
function applyDebug(on) {
  prefs.debug = on; savePrefs(); el.tglDebug.checked = on; el.dbgPanel.hidden = !on;
  if (on) el.dbgLog.textContent = dbgLines.slice(-16).join('\n') || '(no mic events yet — press the mic)';
}
function syncSeg(name, v) {
  document.querySelectorAll(`.seg[data-setting="${name}"] button`).forEach((b) => b.classList.toggle('on', b.dataset.v === v));
}
function wireSettings() {
  const open = () => { el.sheet.classList.add('open'); el.sheet.setAttribute('aria-hidden', 'false'); el.backdrop.hidden = false; };
  const close = () => { el.sheet.classList.remove('open'); el.sheet.setAttribute('aria-hidden', 'true'); el.backdrop.hidden = true; };
  el.btnSettings.addEventListener('click', open);
  el.sheetClose.addEventListener('click', close);
  el.backdrop.addEventListener('click', close);
  document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (seg.dataset.setting === 'view') applyView(b.dataset.v); else applyMood(b.dataset.v);
  }));
  el.tglCaptions.addEventListener('change', () => applyCaptions(el.tglCaptions.checked));
  el.tglMute.addEventListener('change', () => applyMute(el.tglMute.checked));
  el.tglDebug.addEventListener('change', () => applyDebug(el.tglDebug.checked));
  el.dbgCopy.addEventListener('click', async () => {
    const txt = `Alfie mic log · ${navigator.userAgent}\n` + dbgLines.join('\n');
    try { await navigator.clipboard.writeText(txt); el.dbgCopy.textContent = 'Copied'; } catch { el.dbgCopy.textContent = 'Copy failed'; }
    setTimeout(() => (el.dbgCopy.textContent = 'Copy log'), 1500);
  });
  el.btnFrame.addEventListener('click', () => applyView(prefs.view === 'full' ? 'close' : 'full'));
  if (prefs.view !== 'close') prefs.view = 'full';
  if (!EXPR[prefs.mood]) prefs.mood = 'smug';
  head.view = prefs.view; head.expr = prefs.mood;
  syncSeg('view', prefs.view); syncSeg('mood', prefs.mood);
  el.frameLabel.textContent = prefs.view === 'full' ? 'Close' : 'Full';
  applyCaptions(prefs.captions);
  el.tglMute.checked = prefs.mute;
  applyDebug(prefs.debug);
}

// ---------- Boot ----------
async function boot() {
  buildChips();
  wirePTT();
  wireSettings();
  logPermission();
  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 80); });
  new ResizeObserver(() => layout()).observe(el.dock);
  requestAnimationFrame(frame);
  try {
    await loadLines((p) => { el.gateBar.style.width = Math.round(p * 100) + '%'; el.gateSub.textContent = `Warming up the thrusters… ${Math.round(p * 100)}%`; });
  } catch (e) { console.error('lines', e); el.gateSub.textContent = 'His voice files didn’t load. Check your connection and reload.'; return; }
  el.gateBar.style.width = '100%';
  el.gateSub.textContent = 'Systems green. He’s floating about, pretending not to wait for you.';
  el.enter.disabled = false;
  el.enter.focus();
  el.enter.addEventListener('click', async () => {
    head.ensureAudio(); head.setMute(prefs.mute);
    try { await head.audioCtx.resume(); } catch {}
    entered = true;
    el.gate.classList.add('gone');
    setTimeout(() => (el.gate.hidden = true), 700);
    head.hop();
    setTimeout(() => speak(INTENTS.find((x) => x.id === 'greeting')), 500);
  }, { once: true });
}

// Debug/test hook
window.__alfie = window.__cave = { head, get state() { return state; }, setState, speak: (id) => speak(INTENTS.find((x) => x.id === id) || FALLBACK),
  matchIntent, normalize, mic, dbgLines, enter: () => { head.ensureAudio(); entered = true; } };

boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js', { scope: './' }).catch((e) => console.warn('SW', e));
}
