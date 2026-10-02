# Hush · Capacitor build

Hush is a private journal that opens with Face ID, Touch ID or a fingerprint. It is built twice with the exact same React 19 + Tailwind CSS v4 UI so Tauri and Capacitor can be compared side by side:

| Branch | Native layer |
| --- | --- |
| [`tauri`](../../tree/tauri) | Tauri v2 + official `tauri-apps/plugins-workspace` plugins |
| [`capacitor`](../../tree/capacitor) (this one) | Capacitor 8 + official `@capacitor/*` plugins |

Everything under `src/` is identical on both branches **except `src/native/index.ts`**, the one file that implements the [`NativeBridge`](src/native/types.ts) contract. To see exactly what differs:

```sh
git diff tauri capacitor -- src
```

## Features

| Feature | How it works here |
| --- | --- |
| Biometric unlock | `@aparajita/capacitor-biometric-auth` (community; Capacitor has no official one): Face ID / Touch ID on iOS, BiometricPrompt on Android. Prompts automatically on the lock screen. |
| Passcode fallback | 4-digit PIN, stored only as a salted SHA-256 hash. 5 wrong tries trigger a 30 s cooldown. |
| Auto-lock | Locks when the app is backgrounded (immediately, 30 s, 1 min, 5 min or never), via `@capacitor/app`'s `appStateChange`. |
| Privacy cover | Covers your entries with a blur while the app is in the background. |
| Haptics | `@capacitor/haptics`: impact, selection and success/warning/error feedback. Can be turned off. |
| Daily reminder | `@capacitor/local-notifications` with a repeating `schedule.on({ hour, minute })`. |
| Share & copy | `@capacitor/share` opens the native share sheet on both iOS and Android; `@capacitor/clipboard` for copy. |
| Local storage | `@capacitor/preferences` (UserDefaults on iOS, SharedPreferences on Android). No database, no network. |
| Theme | Auto / light / dark; `@capacitor/status-bar` flips the status bar text to match. |
| Responsive | Floating tab bar on phones, sidebar on tablets and desktop, safe-area aware for notches and gesture bars. |
| Back navigation | Detail screens sit on the history stack, so Android's back button and gesture close them. |

## Run it

Prerequisites: Node 20+, plus Xcode 16+ for iOS or Android Studio for Android. The native projects (`ios/`, `android/`) are already generated and committed; iOS uses Swift Package Manager, so no CocoaPods.

```sh
npm install

# Build the web app and copy it into the native projects
npm run build
npx cap sync

# Run on a simulator / emulator or a connected device
npm run ios:dev
npm run android:dev

# Or open the native IDEs
npx cap open ios
npx cap open android
```

During UI work you can also run `npm run dev` in a browser: every plugin has a web fallback (biometrics report "unavailable" there).

Icons and splash screens come from `assets/` and are regenerated with `npm run assets`.

## Project layout

```
src/
  native/types.ts      NativeBridge contract (shared)
  native/index.ts      Capacitor implementation  ← the only UI-side difference
  lib/                 state, navigation, dates, moods (shared)
  components/          PinPad, Sheet, Toggle, Navigation… (shared)
  screens/             Onboarding, Lock, Journal, Editor, EntryView, Insights, Settings (shared)
capacitor.config.ts    app id, splash, keyboard and notification settings
ios/                   Xcode project (Info.plist has NSFaceIDUsageDescription)
android/               Gradle project (AndroidManifest has USE_BIOMETRIC)
assets/                icon and splash sources for @capacitor/assets
```

## Things worth noticing in the comparison

- **Plugins are just npm packages.** `npm install` plus `npx cap sync` wires the native side; there is no permission manifest to keep in sync.
- **No official biometric plugin.** It is the one community dependency here, while Tauri ships an official one.
- **Native projects live in the repo.** You edit `Info.plist` and `AndroidManifest.xml` directly and own them like any native app.
- **Web fallbacks** let the same build run in a desktop browser, which makes UI iteration fast.
- **Data is not encrypted at rest.** The PIN and biometrics gate the UI; entries are plain JSON in Preferences, the same as on the Tauri branch.
