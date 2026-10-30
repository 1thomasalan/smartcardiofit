# The Cave — talking 3D avatar (Phase 1)

Live: https://1thomasalan.github.io/smartcardiofit/avatar/
Repo: `1thomasalan/smartcardiofit`, folder `avatar/` (on both `main` and `gh-pages`; Pages serves `gh-pages`).

Plain HTML/CSS/vanilla JS. No build step, no framework, no API keys in the client.

## Files
| File | What it does |
|---|---|
| `index.html` | Page shell, import map (three.js 0.186 + TalkingHead 1.8.2 from jsDelivr), gate, dock, settings sheet, fallback |
| `style.css` | Cave atmosphere (gradients, rock silhouettes, fog, floor glow, vignette), UI, state styling, responsive rules |
| `app.js` | Avatar boot, lighting, state machine, push-to-talk, speech recognition, intent matching, playback, captions, settings |
| `lines/*.mp3` + `lines/*.json` | 9 pre-rendered ElevenLabs lines + word timings (`words`, `wtimes`, `wdurations` in ms) |
| `manifest.json`, `sw.js`, `icon-*.png`, `icon-mask.svg` | PWA, scoped to `/smartcardiofit/avatar/` |

## How it works
1. **Avatar**: `TalkingHead` (MIT, met4citizen) loads the stock male `avatarsdk.glb` straight from jsDelivr
   (`cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.8.2/avatars/avatarsdk.glb`, about 12 MB, cached by the service worker after the first visit).
   The renderer is transparent, so the CSS cave shows behind it. `addRimLights()` adds two cool-blue back lights plus a soft under-light.
2. **Gate**: browsers block audio until you tap. "Enter the cave" resumes the AudioContext, then the greeting plays.
3. **States** (`body[data-state]`): `idle` (TalkingHead's own breathing and glances) → `listening` (hold button/Space: mic opens,
   `head.startListening(analyser)` + eye contact + a slight head tilt, cyan ring that grows with mic level, side meters) →
   `thinking` (~0.65 s, glance up, purple spinner) → `speaking` (`head.speakAudio` lip sync + `speakWithHands()` + one named gesture per intent).
4. **Speech in**: `webkitSpeechRecognition` (Chrome on Mac and Android; Safari partly). Transcript shows as "You: …".
   Keyword intents live in `INTENTS` in `app.js`; anything unmatched plays `fallback`. The chips trigger the same intents with no mic.
5. **Captions**: each word lights up at its `wtimes` offset, started by a TalkingHead marker at audio time 0.
6. **Time**: speaks a generic line and shows the real local time in a panel (times are never pre-rendered).
7. **Settings** (saved in localStorage): framing (head/upper/waist/full; top-bar button toggles upper ↔ full), mood (calm/warm/stern/brooding),
   captions on/off, mute.
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
- **Phase 3**: swap `AVATAR.url` for the custom comic blue-gray caped figure GLB (cowl and tall ears, eyes and mouth visible). It needs a Mixamo-compatible rig
  plus ARKit + Oculus viseme blend shapes (TalkingHead README, Appendix A). Personal use only, because the character is DC IP.

## Known limits
- Hold-to-talk speech recognition needs Chrome (Mac and Android). On Safari use the chips. Firefox has no SpeechRecognition.
- Speech recognition in Chrome sends audio to Google's servers. Nothing is stored by this app.
- First load pulls about 13 MB (avatar + engine). Later loads come from the service worker cache.
