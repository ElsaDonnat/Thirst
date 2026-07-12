# Thirst — Mobile App (Android & iOS)

**Thirst** is a social drinking card game: on your turn, pick one of the challenge cards — or take 15 sips. Built with Vite + React + TypeScript + Tailwind + shadcn/ui, packaged as native Android & iOS apps with [Capacitor](https://capacitorjs.com/).

The full web app is **bundled inside the app binary** (no server, no network needed — the game is 100 % offline). This repo is the single source of truth; the old Lovable remote-URL setup is gone.

## Project layout

| Path | What it is |
|---|---|
| `src/` | The app itself (React + TypeScript) |
| `public/` | Static assets (favicon etc.) |
| `capacitor.config.json` | App identity (`app.thirst.mobile`, "Thirst") + native plugin config |
| `android/` | Complete Android Studio project |
| `ios/` | Complete Xcode project (SPM, no CocoaPods) |
| `dist/` | Vite build output — what Capacitor copies into the apps (generated, not committed) |

## Everyday development

```bash
npm install          # once
npm run dev          # dev server at http://localhost:8080
npm test             # vitest
npm run lint         # eslint
```

## Building the mobile apps

```bash
npm run build        # web bundle → dist/
npx cap sync         # copy dist/ + plugins into android/ and ios/
```

Any time you change web code, re-run those two (or `npm run sync`, which does both).

- **Run on a connected Android phone:** `npm run android` (or open in Android Studio: `npm run open:android`)
- **iOS (needs a Mac):** `npm run open:ios`, then run from Xcode

> Android builds need a JDK. If `gradlew` can't find one, Android Studio's works fine:
> `JAVA_HOME = C:\Program Files\Android\Android Studio\jbr` (Windows) — and `android/local.properties` must point at your SDK (Android Studio creates it automatically).

## App shell

- **Bottom tab navigation** — Play (setup + game), Cards (browse every pack, create/delete custom cards), Info (rules, card-type legend, settings, about)
- **Animated transitions** (framer-motion) — tab switches, setup ↔ game, turn-to-turn card dealing, and a quick "Chosen!" flash when a card is picked
- **Confirmations** — ending a game and clearing data both ask first
- **Settings** — haptics toggle, clear-all-data; stored on device

## Native behaviors (already wired in)

- **Bundled fonts** (`@fontsource`) — identical rendering offline
- **Safe-area insets** for notches/home indicator (`viewport-fit=cover` + `env(safe-area-inset-*)` padding)
- **No pinch-zoom, text selection, long-press callouts, overscroll bounce** — feels like an app, not a page
- **Android back button:** returns to the Play tab from other tabs; minimizes the app on the setup screen; during a game, press twice within 2 s to end it
- **Game survives restarts** — state is persisted to localStorage, so a phone call or app kill doesn't lose the round
- **Splash screen + status bar** styled to the theme (`capacitor.config.json` → `plugins`)
- **Haptic feedback** on card picks
- **Error boundary** with a friendly restart screen

## 1. App icon & splash screen (do this before store submission)

Put two images in an `assets/` folder at the repo root:

- `assets/icon.png` — 1024×1024, your logo
- `assets/splash.png` — 2732×2732, logo centered on a solid background

Then run:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

This generates every required icon/splash size for both platforms automatically.

## 2. Versioning

Bump on every store release:

- **Android:** `android/app/build.gradle` → `versionCode` (integer, +1 each release) and `versionName` (e.g. "1.1")
- **iOS:** Xcode → App target → General → Version / Build
- Keep `package.json` `version` in step for sanity

## 3. Android — build & submit to Google Play

```bash
npm run build && npx cap sync android
npx cap open android   # opens Android Studio
```

In Android Studio:

1. **Create a signing key** (one time): *Build → Generate Signed App Bundle → Create new keystore*. **Back the keystore file and both passwords up somewhere safe** (password manager + offline copy) — losing it means you can never update the app again.
2. Build a **signed App Bundle (.aab)** with *Build → Generate Signed App Bundle*.
3. In [Play Console](https://play.google.com/console) ($25 one-time): create the app "Thirst", fill in the store listing (description, screenshots, privacy policy URL), upload the `.aab` to a release, complete the content-rating questionnaire (**declare alcohol references — expect an 18+ rating**) and the data-safety form (**the app collects no data**), and submit for review.

## 4. iOS — build & submit to the App Store

On a Mac with Xcode and an [Apple Developer account](https://developer.apple.com/programs/) ($99/year):

```bash
npm install && npm run build && npx cap sync ios
npx cap open ios
```

In Xcode:

1. Select the **App** target → *Signing & Capabilities* → choose your team (Xcode manages certificates automatically).
2. Select *Any iOS Device*, then *Product → Archive*.
3. In the Organizer, **Distribute App → App Store Connect**.
4. In [App Store Connect](https://appstoreconnect.apple.com/): create the app "Thirst" (bundle ID `app.thirst.mobile`), set the age rating (**17+, alcohol references**), fill in the listing, attach the build, and submit for review.

## Store-review notes (read before submitting)

- **No real-money gambling:** Thirst is a social party game — no money, no wagers, no prizes. Say so explicitly in both store descriptions so reviewers don't misread "drinking card game". The strict gambling policies (licenses, geo-restrictions) don't apply.
- **Alcohol content:** both stores allow it with the right age rating (Google: content questionnaire; Apple: 17+ with "Alcohol, Tobacco, or Drug Use" flag). Consider a "drink responsibly" line in the description.
- **Apple "minimum functionality" (guideline 4.2):** the app is fully self-contained with native behaviors (offline play, haptics, state persistence) — this is the review-proof setup. Mention it in the review notes if asked.
- **Privacy policy:** both stores require a URL even though the app collects **zero** data (no accounts, no analytics, no network calls). A one-page "this app stores game state on your device only" policy hosted anywhere (e.g. GitHub Pages) is enough.

## Updating the app later

1. Change the web code in `src/`
2. `npm run build && npx cap sync`
3. Bump versions (see §2), rebuild the signed .aab / archive, upload a new release to each store.
