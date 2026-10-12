# Arrows! 🎯

An addictive, tactile arrow maze puzzle game inspired by classic untangle games, built with modern web technologies and wrapped with Capacitor for native Android APK builds.

![Arrows Logo](/public/logo.svg)

---

## 🌟 Key Features

1. **Official Reference Logo & Animated Splash Screen**:
   - High-fidelity rounded tube arrow icon matching reference specifications.
   - Smooth loading line indicator filling from 0% to 100% on launch before transitioning to Home screen.
   - Updated Android launcher icons (`ic_launcher`, `ic_launcher_round`, `ic_launcher_foreground`) across all densities (mdpi through xxxhdpi).

2. **5,000 Procedurally Generated & Crafted Levels**:
   - **Guaranteed 100% Solvability** via reverse topological construction.
   - **Every 5th level is a Hard level** with recognizable custom shapes:
     - **Level 5**: Glasses 👓
     - **Level 10**: Heart ❤️
     - **Level 15**: Star ⭐
     - **Level 20**: Watch ⌚
     - Subsequent hard levels feature Crown 👑, Diamond 💎, Butterfly 🦋, Rocket 🚀, and intricate mazes.
   - Interactive Level Jump selector allowing instant navigation across all 5,000 levels.

3. **Juicy In-Game Mechanics & Visuals (Logo Aesthetic)**:
   - **Chunky Rounded Tube Arrows**: Chunky 3D tube geometry with crisp dark borders, candy fills, and glossy highlight sheen reflections directly matching the reference logo.
   - **Sparkle Star Particle Effects**: Escaping arrows burst with 4-pointed sparkle stars (✦) and sparkle dots.
   - **3 Red Droplets (Mistouches / Lives)**: Player starts with 3 red liquid droplets. Tapping a blocked arrow triggers haptic recoil, collision shake, red splash splatter, and depletes 1 red droplet.
   - **Raycasting Collision Testing**: Arrows test line-of-sight escape trajectories before launching.
   - **Hints**: `💡 Hint` button detects free moves and illuminates them in glowing neon green.
   - **Pinch-to-Zoom & Pan**: Drag to pan around large mazes and pinch (or mouse wheel) to zoom.
   - **Color Theme Changer**: Top bar palette button allows switching between 6 themes:
     - 🍦 Warm Cream (Flagship Logo Theme)
     - 🌿 Mint Green
     - 🏖️ Warm Sand / Peach
     - 🌌 Midnight Slate
     - ☁️ Sky Blue
     - ⚪ Pure Minimalist White

4. **Home Screen & Unlocks**:
   - **Streak Counter**: Track daily play streaks with the flame counter (`🔥`).
   - **Collection Unlocked at Level 8**: View Records (Longest Streak, Win Streak, Most Wins), Awards (Level Legend, Perfect Play, League badges), and 12 monthly challenge trophies.
   - **Daily Challenge Unlocked at Level 20**: October 2026 calendar with 31 days, green dot rewards for completions, monthly trophy progression, and 2-slide tutorial carousel.

5. **Settings Screen**:
   - Clean pure white background with sharp black typography.
   - Sound, Vibration, Music (ambient Web Audio synthesizer), Voice, and Grid Guideline toggles.
   - Rate Us (interactive 5-star rating dialog), Feedback, Privacy Policy, and Terms of Service.
   - No "Save your progress" button as requested.

---

## 🚀 Getting Started

### Local Development
```bash
npm install
npm run dev
```

### Run Automated End-to-End Tests (Playwright)
```bash
npm test
```

### Build Web Bundle
```bash
npm run build
```

### Build Android APK (Capacitor)
```bash
npx cap sync android
```
Open `./android` in Android Studio or build with Gradle:
```bash
cd android
./gradlew assembleDebug
```
The output APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🤖 GitHub Actions Automated APK Builder & Releases
Every push to `main` triggers `.github/workflows/build-apk.yml`, automatically compiling the Android APK and:
- Publishing the installable APK (`Arrows-v1.0.0.apk`) directly to **[GitHub Releases](https://github.com/asitech5info-prog/arrows-game/releases)**.
- Uploading the debug APK artifact to GitHub Actions artifacts.
