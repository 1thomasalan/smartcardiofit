# Alan's wellness apps (Smart CardioFit)
Two installable web apps (PWAs) hosted on GitHub Pages from the gh-pages branch:
- streak/ : Streak Workout. Streaks-style interval workouts, streak, history, 130 BPM reminder. Shows Stillness sessions too.
- stillness/ : Stillness. Minimal meditation timer, bowl/gong/chime, daily quote, themes, breathing guide, ambient sound.
Stack: plain HTML, CSS and vanilla JavaScript in one index.html per app, no framework or build step. Web Audio API for all sounds (synthesized, no audio files), Wake Lock API, service worker for offline, localStorage for data (on the phone only).
Built with Hark, Oct 2026.
