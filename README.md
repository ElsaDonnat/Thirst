# Thirst — Mobile App (Android & iOS)

Native mobile app for [https://group-gamble-go.lovable.app](https://group-gamble-go.lovable.app), built with [Capacitor](https://capacitorjs.com/).

## How it works

The app is a native shell (real Android/iOS app) whose main screen loads the live site. This is the setup Lovable itself recommends for going mobile, and it has one big advantage:

> **Every update you publish in Lovable appears in the app instantly.** You only need to resubmit to the stores when you change something native (app name, icon, plugins).

If the device is offline, a friendly "You're offline" screen (`www/index.html`) is shown instead.

## Project layout

| Path | What it is |
|---|---|
| `capacitor.config.json` | App identity (`app.thirst.mobile`, "Thirst") and the site URL it loads |
| `android/` | Complete Android Studio project |
| `ios/` | Complete Xcode project |
| `www/` | Offline fallback page |

## Prerequisites

- Node.js 20+ — run `npm install` once after cloning
- **Android:** [Android Studio](https://developer.android.com/studio) + a [Google Play Console account](https://play.google.com/console) ($25 one-time)
- **iOS:** a Mac with [Xcode](https://developer.apple.com/xcode/) + an [Apple Developer account](https://developer.apple.com/programs/) ($99/year)

## 1. App icon & splash screen (do this first)

Put two images in an `assets/` folder at the repo root:

- `assets/icon.png` — 1024×1024, your logo
- `assets/splash.png` — 2732×2732, logo centered on a solid background

Then run:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

This generates every required icon/splash size for both platforms automatically.

## 2. Android — build & submit to Google Play

```bash
npm install
npx cap sync android
npx cap open android   # opens Android Studio
```

In Android Studio:

1. **Create a signing key** (one time): *Build → Generate Signed App Bundle → Create new keystore*. **Back the keystore file and passwords up somewhere safe** — losing it means you can never update the app again.
2. Build a **signed App Bundle (.aab)** with *Build → Generate Signed App Bundle*.
3. In [Play Console](https://play.google.com/console): create the app "Thirst", fill in the store listing (description, screenshots, privacy policy URL), upload the `.aab` to a release, complete the content-rating and data-safety questionnaires, and submit for review.

## 3. iOS — build & submit to the App Store

On a Mac:

```bash
npm install
npx cap sync ios
npx cap open ios   # opens Xcode
```

In Xcode:

1. Select the **App** target → *Signing & Capabilities* → choose your Apple Developer team (Xcode manages certificates automatically).
2. Select *Any iOS Device* as the target, then *Product → Archive*.
3. In the Organizer window, click **Distribute App → App Store Connect**.
4. In [App Store Connect](https://appstoreconnect.apple.com/): create the app "Thirst" (bundle ID `app.thirst.mobile`), fill in the listing, attach the uploaded build, and submit for review.

## Important notes before submitting

### ⚠️ If the app involves real-money gambling or betting

Both stores have strict gambling policies: you'd need gambling licenses for every country you publish in, geo-restrictions, and an adult age rating — and Apple additionally requires the developer account to belong to a licensed entity. **If Thirst is social/fun only (no real money changes hands through the app), you're fine** — but make that unambiguous in the app itself and in the store descriptions to avoid rejection.

### Apple and "web wrapper" apps

Apple sometimes rejects apps that are only a website in a shell (guideline 4.2 "minimum functionality"). Google Play is far more lenient. Two ways to strengthen the iOS submission if needed:

1. Add a native touch or two — e.g. push notifications (`@capacitor/push-notifications`) or haptics — and mention them in the review notes.
2. **Bundle the app code inside the binary** instead of loading the URL: connect your Lovable project to this GitHub repo (Lovable → GitHub → *Connect*, pointing at this repo), then build the web app into `www/` and remove the `server.url` line from `capacitor.config.json`. This makes the app fully self-contained and is the most review-proof setup.

### Privacy policy

Both stores require a privacy policy URL. You can generate the page in Lovable (e.g. `/privacy`) and link to it.

## Updating the app later

- **Site content/features changed in Lovable:** nothing to do — the app shows them immediately.
- **Native changes** (name, icon, plugins, the URL itself): bump `versionCode`/`versionName` in `android/app/build.gradle` and the version in Xcode, rebuild, and upload a new release to each store.
