# The Cave — talking 3D avatar (Phase 1.2)

Live: https://1thomasalan.github.io/smartcardiofit/avatar/
Repo: `1thomasalan/smartcardiofit`, folder `avatar/` (on both `main` and `gh-pages`; Pages serves `gh-pages`).

Plain HTML/CSS/vanilla JS. No build step, no framework, no API keys in the client.

## Files
| File | What it does |
|---|---|
| `index.html` | Page shell, import map (three.js 0.186 + TalkingHead 1.8.2 from jsDelivr), gate, dock, settings sheet, fallback |
| `style.css` | Cave atmosphere (gradients, rock silhouettes, fog, floor glow, vignette), UI, state styling, responsive rules |
| `app.js` | Avatar boot, lighting, state machine, hold/tap-to-talk, speech recognition, intent matching, mic debug log, playback, captions, settings |
| `batman-epic-v2.glb` | **Default.** Sculpted classic-comic "statue" Batman (12.0 MB): image-to-3D body, cowl with tall ears, heavy cape, stock TalkingHead face/rig. Versioned filename: bump it (and `MODELS.epic.url`) whenever the model changes |
| `batman-classic-v1.glb` | v1 costume reskin of the stock avatar (12.8 MB). Still selectable: Settings → Model → Classic costume, or `?model=v1` |
| `lines/*.mp3` + `lines/*.json` | 9 pre-rendered ElevenLabs lines + word timings (`words`, `wtimes`, `wdurations` in ms) |
| `manifest.json`, `sw.js`, `icon-*.png`, `icon-mask.svg` | PWA, scoped to `/smartcardiofit/avatar/` |

## How it works
1. **Avatar (default, v2 "Epic")**: `TalkingHead` loads `batman-epic-v2.glb` (model chosen by `?model=epic|v1`, else Settings → Model, saved as
   `prefs.model`; switching reloads the page). How it was made (all free, no accounts):
   - Front-view A-pose input image generated from Alan's statue photo + the approved mockup (`work/epic/epic-input-front.png`).
   - Image-to-3D on the free Hugging Face Space `trellis-community/TRELLIS` (textured GLB, 35k tris, 2048 texture). Hunyuan3D-2 has
     texturing disabled, Hunyuan3D-2.1 exceeds the free ZeroGPU cap, TRELLIS.2/TripoSR/SF3D were down or out of anonymous quota.
   - Rig (`work/epic/stage2.py`, Blender): joints of the stock skeleton moved to the sculpt's shoulders/elbows/wrists/hips/knees/ankles
     (bone *rotations* untouched so TalkingHead's poses still mean the same thing), heat weights in the sculpt's A-pose, legs/cape/arm
     leaks fixed geometrically (cape → Hips/Spine1/Spine2 by height), then the mesh is un-posed into the stock T-pose rest.
   - Face (`work/epic/stage3.py`): the cowl's face area is cut open and the stock head (66 ARKit + Oculus viseme blend shapes, real eyeballs,
     eyelashes, teeth, tongue) sits inside it, slightly scaled/flattened to fit, its back/scalp/ears trimmed. The upper-face paint is
     recolored to the sculpt's slate blue so cowl and mask read as one piece; lips, chin and jaw are skin, so lip sync shows.
   - Cleanup: TRELLIS's claw-like "fins" on the forearms removed, texture tinted to a richer comic blue, specks removed.
   - Rebuild: `bash work/epic/build.sh out.glb` (params in `work/epic/params.json`); renders `work/screens/epic-*.png`.
   Same rig, retarget and lighting as v1, so all gestures, moods and lip sync work unchanged.
   **v1 (Classic costume)**: TalkingHead's stock `avatarsdk.glb` from this folder.
   v1 is TalkingHead's stock `avatarsdk.glb` (same Mixamo-style rig, same 66 ARKit + Oculus viseme blend shapes, untouched bone transforms)
   dressed as classic comic Batman: dark-blue cowl painted on the head texture (eyes, mouth, lips and jaw left as skin, so lip sync shows),
   scalp smoothed so the hair is gone, two tall pointed ears and a scowling brow line, gray suit with a black bat emblem, golden belt,
   blue trunks, gauntlets with fins, boots, a shoulder mantle and a full scalloped cape. Every added piece is skinned to the existing skeleton
   (ears → Head; mantle and fins copy the shirt's weights; cape → Spine2/Spine1/Hips), so idle, gestures and poses move it.
   Rebuild: `python3 work/batsuit/build.py <out.glb>` in the Hark project (paint.py = textures, geometry.py = ears/mantle/cape/fins/scalp,
   render.py = Blender preview renders). Previews: `work/screens/batsuit-*.png`.
   The renderer is transparent, so the CSS cave shows behind it. `addRimLights()` adds two cool-blue back lights plus a soft under-light.
2. **Gate**: browsers block audio until you tap. "Enter the cave" resumes the AudioContext, then the greeting plays.
3. **States** (`body[data-state]`): `idle` (TalkingHead's own breathing and glances) → `listening` (hold the button or Space, or tap once for
   hands-free and tap again to send; eye contact + a slight head tilt, cyan ring, side meters) →
   `thinking` (~0.65 s, glance up, purple spinner) → `speaking` (`head.speakAudio` lip sync + `speakWithHands()` + one named gesture per intent).
4. **Speech in**: `webkitSpeechRecognition`, `lang = en-US`, interim results on. The recognizer starts synchronously inside the tap
   (no awaited getUserMedia first). Desktop uses `continuous = true` and opens a real level meter only after recognition has the mic;
   Android uses one-shot sessions that auto-restart while you hold (and auto-send in tap mode when the phrase ends) with an animated meter,
   so nothing competes for the mic. While you talk the caption shows "Hearing: …"; on release it waits for the final result (3 s safety
   net, interim text as fallback) and shows "You said: …" before he answers. Errors show a plain message (mic blocked, no mic, network,
   nothing heard) instead of the fallback line. Intents: `INTENTS` + `INTENT_PRIORITY` in `app.js`, matched on lowercased text with
   punctuation stripped, whole words/phrases, content intents (time, who, can, joke, brief) before social ones (thanks, bye, greeting).
   Anything heard but unmatched plays `fallback`. The chips trigger the same intents with no mic.
   **Mic debug**: Settings → Mic debug shows a live log of recognition events/errors with a Copy button for bug reports.
5. **Captions**: each word lights up at its `wtimes` offset, started by a TalkingHead marker at audio time 0.
6. **Time**: speaks a generic line and shows the real local time in a panel (times are never pre-rendered).
7. **Settings** (saved in localStorage): framing (head/upper/waist/full; top-bar button toggles upper ↔ full), mood (calm/warm/stern/brooding),
   captions on/off, mute, mic debug.
8. **Fallbacks**: no WebGL, the 3D engine or GLB failing to load, or a lost GPU context that doesn't come back each show a friendly message
   with a "Try again" button. Add `?noguard` to the URL to skip the lost-context guard (used for headless tests only).

## Re-recording lines
Voice: ElevenLabs **Zeus Epic** (`jB108zg64sTcu1kCbN9L`, "deep, confident, authoritative, slight raspy"), model `eleven_multilingual_v2`,
stability 0.6, similarity 0.8, style 0.1. Generator script: `work/gen_lines.py` in the Hark project (uses `/v1/text-to-speech/{voice}/with-timestamps`,
turns the character alignment into word timings). The key stays server-side; it's never in this folder.

## What Phase 2 needs (real conversation)
- **An LLM key** (OpenAI, Anthropic or Gemini) for free-form answers in the same dry, loyal voice.
- **A tiny proxy** so no key ever ships to the browser. A Cloudflare Worker is the easy pick (free tier, about 40 lines):
  - `POST /chat` → forwards to the LLM with the system prompt, returns text.
  - `POST /tts` → forwards to ElevenLabs `with-timestamps` (or the streaming WebSocket), returns audio + word timings.
  - Lock it with an allowed-origin check plus a shared secret or Cloudflare Access so only Alan's devices can call it.
  - The client change is small: when `matchIntent` returns `fallback`, call `/chat`, then `/tts`, then the same `speak()` path
    (`speakAudio` takes the decoded buffer + words/wtimes/wdurations exactly like the pre-rendered lines).
- **Free voice option**: [HeadTTS](https://github.com/met4citizen/HeadTTS) (same author, Kokoro voices) runs in the browser on WebGPU/WASM
  and returns visemes/word timings for TalkingHead with no key and no credits. Quality is below ElevenLabs, but it costs nothing.
- **Morning brief**: the `brief` intent is a placeholder; Phase 2 or later wires it to calendar, weather and news through the same proxy.
- **Phase 3 (done in 1.1 as a first pass)**: the classic Batman GLB above. A sculpted cowl/cape from a 3D artist would look better; any replacement needs a Mixamo-compatible rig
  plus ARKit + Oculus viseme blend shapes (TalkingHead README, Appendix A). Personal use only, because the character is DC IP.

## Known limits
- Hold-to-talk speech recognition needs Chrome (Mac and Android). On Safari use the chips. Firefox has no SpeechRecognition.
- Speech recognition in Chrome sends audio to Google's servers. Nothing is stored by this app.
- First load pulls about 14 MB (avatar + engine). Later loads come from the service worker cache (`cave-models` cache for the GLB).
- Service worker cache version: `cave-v3` (bump `VERSION` in `sw.js` on every deploy so installed copies refresh).
- The cape is rigid-skinned (no cloth physics): it sways with the torso and hips, not on its own.
- Epic model: gloves are mittens to the rig (fingers don't curl in gestures); the back of the forearms and the ear tips show some
  image-to-3D texture noise; when the jaw opens wide the chin drops below the cowl edge. Big arm-raise gestures can make the cape
  collar crease. The face is the stock TalkingHead face under the cowl, not a sculpted Batman jaw.

## Changelog
- **1.2 (2026-10-31)**: Epic sculpted Batman (`batman-epic-v2.glb`) is the default; v1 kept as "Classic costume" (Settings → Model or `?model=v1`).
  SW `cave-v3`.
- **1.1 (2026-10-31)**: Batman avatar (`batman-classic-v1.glb`). Mic fix: the old flow created the recognizer only after an awaited
  getUserMedia, so a quick tap or the permission prompt released the button before recognition existed and an empty transcript went
  straight to "I didn't catch that"; on Android the meter's getUserMedia also competed with recognition for the mic. Now: synchronous start,
  tap-to-toggle + hold + Space, live caption, "You said", clear error messages, looser intents, mic debug log, SW `cave-v2`.
  Tests: `work/test_mic.py` (mocked SpeechRecognition, desktop + Android UA, 28 checks).
