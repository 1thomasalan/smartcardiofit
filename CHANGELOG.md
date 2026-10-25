# Streak Workout — Changelog

Live: https://1thomasalan.github.io/smartcardiofit/streak/
Repo: 1thomasalan/smartcardiofit, folder `streak/` (push every change to BOTH `main` and `gh-pages` with push.py).
Times are JST. Newest first. Bump the `streak-vN` cache name in sw.js on every release so phones pick up the update.

## 2026-10-25 16:05 — Manga-style drawn coach (sw cache streak-v6)
- Requested by Alan: realistic-but-cartoon manga characters instead of blocky mannequins.
- New streak/manga.js overrides Demos with flipbook demos: AI-drawn silver-haired coach (orange tee, navy joggers), 61 poses in streak/art/*.webp (600x480, ~900 KB total, precached for offline). One-pose holds (wall sit, planks, stretches, dips) get a gentle breathing bob.
- demos.js mannequins kept as fallback (window.VDemos).
- Known compromises: chair dips is a single hold pose (generator would not draw the lowered dip); standing knee crunch reads as a knee lift; hip circles shift is subtle.
- Source art and plan in work/manga/ (plan.json, h_override.json, build_art.py normalizes scale to a shared floor line).

## 2026-10-25 15:40 — 3D-style mannequin figures (sw cache streak-v5)
- Requested by Alan: figures should look more 3D, not stick men.
- demos.js renderer rewritten: layered shaded capsules for limbs/torso (light from upper-left), sphere joints and head with radial gradients, soft floor shadow, gradient floor and props. Motion data unchanged.
- Preview renders now use resvg-py (pip install --user resvg-py) to rasterize the real SVG.

## 2026-10-25 07:50 — Animated how-to demos (sw cache streak-v4)
- Requested by Alan: he didn't know how to do some moves.
- New `streak/demos.js`: animated stick-figure demo for all 32 exercises (SVG, keyframes + 2-bone IK for hands/feet, props: wall, chair, box). Side view or front view per move.
- Workout player: demo loops above a smaller timer ring during each move; during rest it shows "Up next" with the next move's demo and cue; get-ready screen shows the first move.
- Exercises tab: each tile shows a still pose thumbnail plus a "▶ How" button that opens a looping demo with the cue.
- Tuning poses: edit the `D` table in demos.js (angles: 0 down, 90 right, 180 up). Preview sheets were rendered with node + PIL (no browser in sandbox).

## 2026-10-24 ~09:30 — Moved to /streak/ + Meditate tab (sw cache streak-v3)
- App moved to its own scope at /smartcardiofit/streak/ (manifest scope/start_url, service worker).
- New Meditate tab: opens the Stillness meditation app in an overlay.
- History calendar shows a gold dot on days he meditated.

## 2026-10-24 08:43 — v1
- Built as an Android (Galaxy Z Fold8) stand-in for the iPhone Streaks Workout app. Plain HTML/CSS/vanilla JS PWA, fullscreen manifest, offline service worker, icons.
- Pick exercises; workout length 5–30 min presets or custom 3–45 min; work/rest intervals.
- Random circuit with automatic warm-up and cool-down.
- Voice coach.
- Daily streak with rest days; history calendar.
- Heart-rate reminder (default 130 BPM) — heart-safe by design (Alan has heart disease).
- Data stored in phone localStorage, with export/import backup.
