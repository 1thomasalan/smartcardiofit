// The Cave — Phase 1
// Stock TalkingHead avatar + pre-rendered ElevenLabs lines + keyword intents.
// No API keys live in this file. Phase 2 swaps LINES for a live LLM + TTS proxy.

// Two Batman models. Default: the sculpted "Epic" statue-style avatar (v2). The v1 costume reskin stays selectable
// in Settings (Model) or with ?model=v1 in the URL.
const RETARGET = {
  Neck: { z: -0.01, rx: -0.15 }, Neck1: { z: -0.01, rx: -0.15 }, Neck2: { z: -0.01, rx: -0.15 },
  LeftShoulder: { rz: -0.3 }, RightShoulder: { rz: 0.3 },
  scaleToEyesLevel: 1.0, origin: { y: -0.1 }
};
const MODELS = {
  // Sculpted classic-comic Batman (image-to-3D statue body + cowl with tall ears + heavy cape), rigged to TalkingHead's
  // stock skeleton; the stock face (66 ARKit + Oculus viseme blend shapes, real eyes, teeth, tongue) shows through the cowl.
  // Built by work/epic/build.sh in the Hark project.
  epic: { url: 'batman-epic-v2.glb', cam: {} },
  // v1: TalkingHead's stock avatarsdk.glb with a painted cowl/suit, ears, cape (work/batsuit/build.py).
  v1: { url: 'batman-classic-v1.glb', cam: {} },
};
const urlModel = new URLSearchParams(location.search).get('model');
const MODEL_ID = (urlModel === 'v1' || urlModel === 'epic') ? urlModel
  : (JSON.parse(localStorage.getItem('cave.prefs') || '{}').model === 'v1' ? 'v1' : 'epic');
const AVATAR = {
  url: MODELS[MODEL_ID].url,
  body: 'M',
  avatarMood: 'neutral',
  lipsyncLang: 'en',
  // Skeleton/blendshape tweaks for this rig, from TalkingHead's siteconfig.js (both models share the stock rig)
  retarget: RETARGET,
  baseline: { headRotateX: -0.04, eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 }
};

// Intents: keywords (checked in order) → pre-rendered line + a hand gesture.
const INTENTS = [
  { id: 'brief',    chip: 'Good morning',     keys: ['good morning', 'morning', 'brief', 'briefing', 'brief me', 'news', 'whats new', 'update me', 'daily update'], gesture: 'index' },
  { id: 'time',     chip: 'What time is it?', keys: ['time', 'clock', 'oclock', 'what hour', 'whats the date', 'what day', 'todays date'], gesture: 'index', mirror: true },
  { id: 'who',      chip: 'Who are you?',     keys: ['who are you', 'what are you', 'your name', 'who is this', 'whos this', 'who am i talking to', 'introduce yourself'], gesture: 'index' },
  { id: 'can',      chip: 'What can you do?', keys: ['what can you do', 'can you do', 'what do you do', 'help', 'abilities', 'capable', 'features', 'how do you work', 'what can i ask'], gesture: 'side' },
  { id: 'joke',     chip: 'Tell me a joke',   keys: ['joke', 'jokes', 'funny', 'make me laugh', 'laugh', 'humor', 'humour'], gesture: 'shrug' },
  { id: 'thanks',   chip: 'Thank you',        keys: ['thank you', 'thanks', 'thank', 'thx', 'appreciate', 'cheers', 'good job', 'nice work', 'well done'], gesture: 'thumbup' },
  { id: 'bye',      chip: 'Goodbye',          keys: ['goodbye', 'good bye', 'bye', 'bye bye', 'see you', 'see ya', 'later', 'good night', 'goodnight', 'signing off', 'thats all', 'im out'], gesture: 'handup' },
  { id: 'greeting', chip: 'Hello',            keys: ['hello', 'hi', 'hey', 'yo', 'hiya', 'howdy', 'greetings', 'whats up', 'sup', 'good evening', 'good afternoon', 'evening', 'afternoon', 'hey there', 'hello there'], gesture: 'handup' },
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
  tglDebug: $('#tglDebug'), dbgPanel: $('#dbgPanel'), dbgLog: $('#dbgLog'), dbgCopy: $('#dbgCopy'),
};

// ---------- Settings (persisted) ----------
const prefs = Object.assign({ view: 'upper', mood: 'neutral', captions: true, mute: false, debug: false, model: 'epic' },
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
    ...MODELS[MODEL_ID].cam,
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
// Lowercase, straighten apostrophes, drop punctuation, pad with spaces so keys match whole words/phrases.
function normalize(text) {
  return ' ' + String(text || '').toLowerCase()
    .replace(/[\u2018\u2019\u02bc`]/g, "'")
    .replace(/'/g, '')                 // what's → whats, o'clock → oclock
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ').trim() + ' ';
}
// Content intents win over social ones ("hey, what time is it?" → time).
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
  head?.makeEyeContact(10000);
  head?.setBaselineValue?.('headRotateZ', 0.09);   // slight attentive head tilt
  head?.setBaselineValue?.('headRotateX', 0.02);
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
  head?.setBaselineValue?.('headRotateZ', 0);
  head?.setBaselineValue?.('headRotateX', AVATAR.baseline.headRotateX);
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

// ---------- UI wiring ----------
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

function applyView(v) {
  prefs.view = v; savePrefs();
  head?.setView(v);
  el.frameLabel.textContent = v === 'full' ? 'Close' : 'Full';
  el.btnFrame.setAttribute('aria-label', v === 'full' ? 'Close-up view' : 'Full body view');
  syncSeg('view', v);
}
function applyModel(m) {
  // Switching models reloads the page (TalkingHead builds the scene around one avatar). Drops any ?model= override.
  if (m === MODEL_ID) return;
  prefs.model = m; savePrefs(); syncSeg('model', m);
  const u = new URL(location.href); u.searchParams.delete('model'); location.replace(u.toString());
}
function applyMood(m) { prefs.mood = m; savePrefs(); try { head?.setMood(m); } catch {} syncSeg('mood', m); }
function applyCaptions(on) { prefs.captions = on; savePrefs(); document.body.classList.toggle('no-captions', !on); el.tglCaptions.checked = on; }
function applyMute(on) { prefs.mute = on; savePrefs(); head?.setMixerGain(on ? 0 : 2.2); el.tglMute.checked = on; }
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
    if (seg.dataset.setting === 'view') applyView(b.dataset.v);
    else if (seg.dataset.setting === 'model') applyModel(b.dataset.v);
    else applyMood(b.dataset.v);
  }));
  el.tglCaptions.addEventListener('change', () => applyCaptions(el.tglCaptions.checked));
  el.tglMute.addEventListener('change', () => applyMute(el.tglMute.checked));
  el.tglDebug.addEventListener('change', () => applyDebug(el.tglDebug.checked));
  el.dbgCopy.addEventListener('click', async () => {
    const txt = `The Cave mic log · ${navigator.userAgent}\n` + dbgLines.join('\n');
    try { await navigator.clipboard.writeText(txt); el.dbgCopy.textContent = 'Copied'; } catch { el.dbgCopy.textContent = 'Copy failed'; }
    setTimeout(() => (el.dbgCopy.textContent = 'Copy log'), 1500);
  });
  el.btnFrame.addEventListener('click', () => applyView(prefs.view === 'full' ? 'upper' : 'full'));
  syncSeg('view', prefs.view); syncSeg('mood', prefs.mood); syncSeg('model', MODEL_ID);
  el.frameLabel.textContent = prefs.view === 'full' ? 'Close' : 'Full';
  applyCaptions(prefs.captions);
  el.tglMute.checked = prefs.mute;
  applyDebug(prefs.debug);
}

// ---------- Boot ----------
async function boot() {
  startDust();
  buildChips();
  wirePTT();
  wireSettings();
  logPermission();
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
window.__cave = { get head() { return head; }, get state() { return state; }, speak: (id) => speak(INTENTS.find((x) => x.id === id) || FALLBACK),
  matchIntent, normalize, mic, dbgLines, enter: () => { entered = true; } };

boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js', { scope: './' }).catch((e) => console.warn('SW', e));
}
