// The Cave — Phase 1
// Stock TalkingHead avatar + pre-rendered ElevenLabs lines + keyword intents.
// No API keys live in this file. Phase 2 swaps LINES for a live LLM + TTS proxy.

const AVATAR = {
  // Stock male avatar from the TalkingHead repo (MIT), served by jsDelivr.
  url: 'https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.8.2/avatars/avatarsdk.glb',
  body: 'M',
  avatarMood: 'neutral',
  lipsyncLang: 'en',
  // Skeleton/blendshape tweaks for this model, from TalkingHead's siteconfig.js
  retarget: {
    Neck: { z: -0.01, rx: -0.15 }, Neck1: { z: -0.01, rx: -0.15 }, Neck2: { z: -0.01, rx: -0.15 },
    LeftShoulder: { rz: -0.3 }, RightShoulder: { rz: 0.3 },
    scaleToEyesLevel: 1.0, origin: { y: -0.1 }
  },
  baseline: { headRotateX: -0.04, eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 }
};

// Intents: keywords (checked in order) → pre-rendered line + a hand gesture.
const INTENTS = [
  { id: 'brief',    chip: 'Good morning',     keys: ['good morning', 'morning', 'brief', 'briefing', 'news'], gesture: 'index' },
  { id: 'time',     chip: 'What time is it?', keys: ['time', 'clock', 'what hour'], gesture: 'index', mirror: true },
  { id: 'who',      chip: 'Who are you?',     keys: ['who are you', 'your name', 'what are you', 'who is this'], gesture: 'index' },
  { id: 'can',      chip: 'What can you do?', keys: ['what can you do', 'can you do', 'help', 'abilities', 'capable'], gesture: 'side' },
  { id: 'joke',     chip: 'Tell me a joke',   keys: ['joke', 'funny', 'make me laugh'], gesture: 'shrug' },
  { id: 'thanks',   chip: 'Thank you',        keys: ['thank', 'thanks', 'appreciate', 'cheers'], gesture: 'thumbup' },
  { id: 'bye',      chip: 'Goodbye',          keys: ['goodbye', 'bye', 'good night', 'see you', 'later', 'signing off'], gesture: 'handup' },
  { id: 'greeting', chip: 'Hello',            keys: ['hello', 'hi', 'hey', 'greetings', "what's up", 'whats up', 'yo', 'evening', 'afternoon'], gesture: 'handup' },
];
const FALLBACK = { id: 'fallback', gesture: 'shrug' };

// ---------- DOM ----------
const $ = (s) => document.querySelector(s);
const el = {
  avatar: $('#avatar'), gate: $('#gate'), gateSub: $('#gateSub'), gateBar: $('#gateBar'), enter: $('#btnEnter'),
  fallback: $('#fallback'), fallbackMsg: $('#fallbackMsg'), status: $('#statusText'),
  caption: $('#captionLine'), you: $('#youLine'), chips: $('#chips'), ptt: $('#ptt'), hint: $('#hint'),
  meterL: $('#meter'), meterR: $('#meterR'), clock: $('#clock'), clockTime: $('#clockTime'), clockDate: $('#clockDate'),
  sheet: $('#sheet'), backdrop: $('#sheetBackdrop'), btnSettings: $('#btnSettings'), sheetClose: $('#sheetClose'),
  btnFrame: $('#btnFrame'), frameLabel: $('#frameLabel'), tglCaptions: $('#tglCaptions'), tglMute: $('#tglMute'),
};

// ---------- Settings (persisted) ----------
const prefs = Object.assign({ view: 'upper', mood: 'neutral', captions: true, mute: false },
  JSON.parse(localStorage.getItem('cave.prefs') || '{}'));
const savePrefs = () => localStorage.setItem('cave.prefs', JSON.stringify(prefs));

let head = null;          // TalkingHead instance
let THREE = null;
let state = 'idle';
const lines = {};         // id → { text, words, wtimes, wdurations, buffer }
let entered = false;
let speakToken = 0;

// ---------- State ----------
const STATE_LABEL = { idle: 'Idle', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' };
function setState(s) {
  state = s;
  document.body.dataset.state = s;
  el.status.textContent = STATE_LABEL[s] || s;
}

// ---------- Fallback ----------
function showFallback(msg) {
  if (msg) el.fallbackMsg.textContent = msg;
  el.gate.hidden = true;
  el.fallback.hidden = false;
}
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

// ---------- Dust particles (2D canvas, cheap) ----------
function startDust() {
  const c = $('#dust'), ctx = c.getContext('2d');
  let w, h, motes = [], bats = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (w * h) / 14000));
    motes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .3,
      vx: (Math.random() - .5) * .12, vy: -Math.random() * .18 - .03, a: Math.random() * .5 + .15, t: Math.random() * 6 }));
  }
  function spawnBat() {
    const dir = Math.random() < .5 ? 1 : -1;
    bats.push({ x: dir > 0 ? -30 : w + 30, y: h * (.08 + Math.random() * .22), vx: dir * (1.3 + Math.random()), s: 5 + Math.random() * 5, t: 0 });
  }
  let last = 0, nextBat = 4000 + Math.random() * 6000;
  function frame(ts) {
    const dt = Math.min(50, ts - last); last = ts;
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.t += dt * .001; m.x += m.vx * dt * .06 + Math.sin(m.t) * .05; m.y += m.vy * dt * .06;
      if (m.y < -5) { m.y = h + 5; m.x = Math.random() * w; }
      if (m.x < -5) m.x = w + 5; if (m.x > w + 5) m.x = -5;
      ctx.beginPath(); ctx.fillStyle = `rgba(160,200,255,${m.a * (.6 + .4 * Math.sin(m.t * 2))})`;
      ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill();
    }
    nextBat -= dt;
    if (nextBat <= 0) { spawnBat(); if (Math.random() < .4) setTimeout(spawnBat, 300); nextBat = 9000 + Math.random() * 12000; }
    bats = bats.filter((b) => b.x > -60 && b.x < w + 60);
    ctx.fillStyle = 'rgba(2,4,8,.85)';
    for (const b of bats) {
      b.t += dt * .02; b.x += b.vx * dt * .06; b.y += Math.sin(b.t * .3) * .4;
      const f = Math.sin(b.t) * b.s * .8, s = b.s;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x - s, b.y - f, b.x - s * 2, b.y - f * .4);
      ctx.quadraticCurveTo(b.x - s, b.y + s * .2, b.x, b.y + s * .3);
      ctx.quadraticCurveTo(b.x + s, b.y + s * .2, b.x + s * 2, b.y - f * .4);
      ctx.quadraticCurveTo(b.x + s, b.y - f, b.x, b.y);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize); resize(); requestAnimationFrame(frame);
}

// ---------- Avatar ----------
async function initAvatar() {
  if (!hasWebGL()) { showFallback(); return false; }
  let TalkingHead;
  try {
    THREE = await import('three');
    ({ TalkingHead } = await import('talkinghead'));
  } catch (e) {
    console.error(e);
    showFallback("Couldn't reach the 3D engine. Check your connection and try again.");
    return false;
  }
  head = new TalkingHead(el.avatar, {
    lipsyncModules: ['en'],
    lipsyncLang: 'en',
    cameraView: prefs.view,
    cameraRotateEnable: true,
    cameraZoomEnable: false,
    modelFPS: 30,
    modelPixelRatio: 1,
    mixerGainSpeech: 2.2,
    avatarMood: prefs.mood,
    avatarIdleEyeContact: 0.25,
    avatarSpeakingEyeContact: 0.6,
    lightAmbientColor: 0x7b8fb8, lightAmbientIntensity: 1.2,
    lightDirectColor: 0x9fbbe6, lightDirectIntensity: 14, lightDirectPhi: 0.6, lightDirectTheta: 1.8,
    lightSpotColor: 0x3d9bff, lightSpotIntensity: 40, lightSpotPhi: 0.3, lightSpotTheta: 3.6, lightSpotDispersion: 0.6,
  });
  try {
    await head.showAvatar(AVATAR, (ev) => {
      if (ev.lengthComputable) {
        const p = Math.min(100, Math.round(ev.loaded / ev.total * 100));
        el.gateBar.style.width = p + '%';
        el.gateSub.textContent = `Bringing him online… ${p}%`;
      }
    });
  } catch (e) {
    console.error(e);
    showFallback("The avatar didn't load. The cave's lights are off for now — check your connection and try again.");
    return false;
  }
  addRimLights();
  // If the GPU drops the 3D context and doesn't get it back, show the friendly fallback.
  const cv = head.renderer.domElement;
  let lostTimer = 0;
  const guard = !new URLSearchParams(location.search).has('noguard'); // ?noguard = headless testing
  cv.addEventListener('webglcontextlost', () => {
    if (!guard) return;
    clearTimeout(lostTimer);
    lostTimer = setTimeout(() => showFallback('The graphics chip dropped the 3D view. Reload to bring the lights back on.'), 4000);
  });
  cv.addEventListener('webglcontextrestored', () => clearTimeout(lostTimer));
  head.setMood(prefs.mood);
  document.addEventListener('visibilitychange', () => document.hidden ? head.stop() : head.start());
  return true;
}

function addRimLights() {
  // Cool blue rim from behind, both sides — the Batcave edge glow.
  const mk = (x, y, z, i) => { const l = new THREE.DirectionalLight(0x4aa8ff, i); l.position.set(x, y, z); head.scene.add(l); return l; };
  mk(-2.5, 2.2, -2.5, 9);
  mk(2.5, 2.0, -2.5, 7);
  const under = new THREE.PointLight(0x1f5fae, 3, 4); under.position.set(0, 0.2, 1.2); head.scene.add(under);
}

// ---------- Lines ----------
const LINE_IDS = ['greeting', 'who', 'can', 'time', 'brief', 'joke', 'thanks', 'bye', 'fallback'];
async function loadLines() {
  await Promise.all(LINE_IDS.map(async (id) => {
    const [meta, mp3] = await Promise.all([
      fetch(`lines/${id}.json`).then((r) => r.json()),
      fetch(`lines/${id}.mp3`).then((r) => r.arrayBuffer()),
    ]);
    lines[id] = { ...meta, mp3 };
  }));
}
async function bufferFor(id) {
  const L = lines[id];
  if (!L.buffer) L.buffer = await head.audioCtx.decodeAudioData(L.mp3.slice(0));
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
  if (!head) return;
  const id = intent.id;
  const L = lines[id];
  if (!L) return;
  const token = ++speakToken;
  head.stopSpeaking();
  cancelAnimationFrame(captionRaf);
  setState('thinking');
  head.lookAt(window.innerWidth * 0.35, window.innerHeight * 0.1, 700); // glance up-left while "thinking"
  const [buffer] = await Promise.all([bufferFor(id), new Promise((r) => setTimeout(r, 650))]);
  if (token !== speakToken) return;

  if (id === 'time') showClock();
  renderCaption(L);
  setState('speaking');
  const onStart = () => {
    if (token !== speakToken) return;
    runCaption(L);
    head.lookAtCamera(600);
    head.speakWithHands();
    if (intent.gesture) setTimeout(() => token === speakToken && head.playGesture(intent.gesture, 2.6, !!intent.mirror, 700), 350);
  };
  head.speakAudio({
    audio: buffer,
    words: L.words, wtimes: L.wtimes, wdurations: L.wdurations,
    markers: [onStart], mtimes: [0],
  });
  head.speakMarker(() => {
    if (token !== speakToken) return;
    setState('idle');
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
function matchIntent(text) {
  const t = ' ' + (text || '').toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  for (const it of INTENTS) {
    for (const k of it.keys) {
      if (t.includes(' ' + k + ' ') || (k.length > 4 && t.includes(k))) return it;
    }
  }
  return FALLBACK;
}

// ---------- Listening (push-to-talk) ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, finalText = '', interimText = '', micStream = null, meterRaf = 0, listening = false, releaseTimer = 0;
const barsL = [...el.meterL.children], barsR = [...el.meterR.children];

async function startListening() {
  if (!entered || listening) return;
  listening = true;
  speakToken++; head?.stopSpeaking(); cancelAnimationFrame(captionRaf);
  finalText = ''; interimText = '';
  el.you.hidden = false; el.you.textContent = '…';
  el.caption.textContent = '';
  setState('listening');
  head?.makeEyeContact(10000);
  head?.setBaselineValue?.('headRotateZ', 0.09); // slight attentive head tilt
  head?.setBaselineValue?.('headRotateX', 0.02);

  // Mic level meter + TalkingHead listening mode
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    if (!listening) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; return; }
    const ctx = head.audioCtx;
    const src = ctx.createMediaStreamSource(micStream);
    const an = ctx.createAnalyser();
    src.connect(an);
    head.startListening(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const tick = () => {
      an.getByteFrequencyData(data);
      let sum = 0; for (let i = 2; i < 40; i++) sum += data[i];
      const lvl = Math.min(1, sum / (38 * 170));
      document.body.style.setProperty('--lvl', lvl.toFixed(3));
      barsL.forEach((b, i) => { const v = Math.max(0, lvl * 1.4 - i * 0.09 + Math.random() * .08); b.style.height = (6 + v * 38) + 'px'; });
      barsR.forEach((b, i) => { const v = Math.max(0, lvl * 1.4 - i * 0.09 + Math.random() * .08); b.style.height = (6 + v * 38) + 'px'; });
      meterRaf = requestAnimationFrame(tick);
    };
    tick();
  } catch (e) {
    console.warn('Mic unavailable', e);
  }

  if (SR) {
    try {
      rec = new SR();
      rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
      rec.onresult = (ev) => {
        interimText = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) finalText += r[0].transcript + ' ';
          else interimText += r[0].transcript;
        }
        el.you.textContent = (finalText + interimText).trim() || '…';
      };
      rec.onerror = (e) => console.warn('SpeechRecognition', e.error);
      rec.onend = () => { if (!listening) resolveTranscript(); };
      rec.start();
    } catch (e) { console.warn(e); rec = null; }
  }
}

function stopListening() {
  if (!listening) return;
  listening = false;
  cancelAnimationFrame(meterRaf);
  document.body.style.setProperty('--lvl', 0);
  [...barsL, ...barsR].forEach((b) => (b.style.height = '6px'));
  head?.stopListening();
  head?.setBaselineValue?.('headRotateZ', 0);
  head?.setBaselineValue?.('headRotateX', AVATAR.baseline.headRotateX);
  if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
  setState('thinking');
  pending = true;
  if (rec) {
    try { rec.stop(); } catch {}
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(resolveTranscript, 2500); // safety net if onend never fires
  } else {
    resolveTranscript(true);
  }
}

let pending = false;
function resolveTranscript(noSR) {
  clearTimeout(releaseTimer);
  if (!pending || listening) return;
  pending = false;
  rec = null;
  const text = (finalText + ' ' + interimText).trim();
  if (noSR && !text) {
    el.you.textContent = SR ? '(no speech heard)' : '(voice input isn’t supported in this browser — tap a prompt below)';
  } else {
    el.you.textContent = text || '(no speech heard)';
  }
  speak(text ? matchIntent(text) : FALLBACK);
}

// ---------- UI wiring ----------
function buildChips() {
  const order = ['greeting', 'who', 'can', 'time', 'brief', 'joke', 'thanks', 'bye'];
  for (const id of order) {
    const it = INTENTS.find((x) => x.id === id);
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = it.chip;
    b.addEventListener('click', () => {
      if (!entered) return;
      el.you.hidden = false; el.you.textContent = it.chip;
      speak(it);
    });
    el.chips.appendChild(b);
  }
}

function wirePTT() {
  const p = el.ptt;
  p.addEventListener('pointerdown', (e) => { e.preventDefault(); p.setPointerCapture?.(e.pointerId); startListening(); });
  const up = () => stopListening();
  p.addEventListener('pointerup', up);
  p.addEventListener('pointercancel', up);
  p.addEventListener('lostpointercapture', up);
  p.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat || el.sheet.classList.contains('open')) return;
    e.preventDefault(); startListening();
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') { e.preventDefault(); stopListening(); } });
  if (!SR) el.hint.textContent = 'Voice input isn’t available here — tap a prompt';
}

function applyView(v) {
  prefs.view = v; savePrefs();
  head?.setView(v);
  el.frameLabel.textContent = v === 'full' ? 'Close' : 'Full';
  el.btnFrame.setAttribute('aria-label', v === 'full' ? 'Close-up view' : 'Full body view');
  syncSeg('view', v);
}
function applyMood(m) { prefs.mood = m; savePrefs(); try { head?.setMood(m); } catch {} syncSeg('mood', m); }
function applyCaptions(on) { prefs.captions = on; savePrefs(); document.body.classList.toggle('no-captions', !on); el.tglCaptions.checked = on; }
function applyMute(on) { prefs.mute = on; savePrefs(); head?.setMixerGain(on ? 0 : 2.2); el.tglMute.checked = on; }
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
  el.btnFrame.addEventListener('click', () => applyView(prefs.view === 'full' ? 'upper' : 'full'));
  syncSeg('view', prefs.view); syncSeg('mood', prefs.mood);
  el.frameLabel.textContent = prefs.view === 'full' ? 'Close' : 'Full';
  applyCaptions(prefs.captions);
  el.tglMute.checked = prefs.mute;
}

// ---------- Boot ----------
async function boot() {
  startDust();
  buildChips();
  wirePTT();
  wireSettings();
  const linesP = loadLines().catch((e) => { console.error('lines', e); });
  const ok = await initAvatar();
  if (!ok) return;
  await linesP;
  applyMute(prefs.mute);
  el.gateBar.style.width = '100%';
  el.gateSub.textContent = 'Systems green. He’s waiting for you, Alan.';
  el.enter.disabled = false;
  el.enter.focus();
  el.enter.addEventListener('click', async () => {
    try { await head.audioCtx.resume(); } catch {}
    entered = true;
    el.gate.classList.add('gone');
    setTimeout(() => (el.gate.hidden = true), 700);
    setTimeout(() => speak(INTENTS.find((x) => x.id === 'greeting')), 500);
  }, { once: true });
}

// Debug/test hook
window.__cave = { get head() { return head; }, get state() { return state; }, speak: (id) => speak(INTENTS.find((x) => x.id === id) || FALLBACK), matchIntent };

boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js', { scope: './' }).catch((e) => console.warn('SW', e));
}
