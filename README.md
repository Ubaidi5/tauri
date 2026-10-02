# Hush · Tauri build

Hush is a private journal that opens with Face ID, Touch ID or a fingerprint. It is built twice with the exact same React 19 + Tailwind CSS v4 UI so Tauri and Capacitor can be compared side by side:

| Branch | Native layer |
| --- | --- |
| [`tauri`](../../tree/tauri) (this one) | Tauri v2 + official `tauri-apps/plugins-workspace` plugins |
| [`capacitor`](../../tree/capacitor) | Capacitor 8 + official `@capacitor/*` plugins |

Everything under `src/` is identical on both branches **except `src/native/index.ts`**, the one file that implements the [`NativeBridge`](src/native/types.ts) contract. To see exactly what differs:

```sh
git diff capacitor tauri -- src
```

## Features

| Feature | How it works here |
| --- | --- |
| Biometric unlock | `@tauri-apps/plugin-biometric`: Face ID / Touch ID on iOS, BiometricPrompt on Android. Prompts automatically on the lock screen. |
| Passcode fallback | 4-digit PIN, stored only as a salted SHA-256 hash. 5 wrong tries trigger a 30 s cooldown. |
| Auto-lock | Locks when the app is backgrounded (immediately, 30 s, 1 min, 5 min or never), via `visibilitychange`. |
| Privacy cover | Covers your entries with a blur while the app is in the background. |
| Haptics | `@tauri-apps/plugin-haptics`: impact, selection and success/warning/error feedback. Can be turned off. |
| Daily reminder | `@tauri-apps/plugin-notification` with a repeating `Schedule.interval({ hour, minute })`. |
| Share & copy | Web Share API where the webview supports it (iOS), otherwise `@tauri-apps/plugin-clipboard-manager`. |
| Local storage | `@tauri-apps/plugin-store` writes `hush.json` in the app's sandbox. No database, no network. |
| Theme | Auto / light / dark, with a matching `theme-color`. |
| Responsive | Floating tab bar on phones, sidebar on tablets and desktop, safe-area aware for notches and gesture bars. |
| Back navigation | Detail screens sit on the history stack, so Android's back button and gesture close them. |

## Run it

Prerequisites: Node 20+, Rust (stable), plus [Xcode](https://v2.tauri.app/start/prerequisites/#ios) for iOS or [Android Studio + NDK](https://v2.tauri.app/start/prerequisites/#android) for Android.

```sh
npm install

# Generate the native projects once (creates src-tauri/gen/apple and src-tauri/gen/android)
npx tauri ios init
npx tauri android init

# Run on a simulator / emulator or a connected device
npm run ios:dev
npm run android:dev

# Desktop window (biometrics and haptics are mobile-only and degrade gracefully)
npm run tauri dev
```

The Face ID usage string lives in `src-tauri/Info.ios.plist` and is merged into the generated Xcode project.

## Project layout

```
src/
  native/types.ts      NativeBridge contract (shared)
  native/index.ts      Tauri implementation  ← the only UI-side difference
  lib/                 state, navigation, dates, moods (shared)
  components/          PinPad, Sheet, Toggle, Navigation… (shared)
  screens/             Onboarding, Lock, Journal, Editor, EntryView, Insights, Settings (shared)
src-tauri/
  src/lib.rs           plugin registration (biometric + haptics behind #[cfg(mobile)])
  capabilities/        permission sets: default.json (all platforms), mobile.json (iOS/Android)
  tauri.conf.json
  Info.ios.plist       NSFaceIDUsageDescription
  icons/               generated with `npx tauri icon assets/app-icon.svg`
```

## Things worth noticing in the comparison

- **Plugins need Rust and JS halves.** Each plugin is a Cargo crate plus an npm package, registered in `lib.rs` and allowed in `capabilities/*.json`. Forgetting a permission makes the call fail at runtime.
- **Mobile-only plugins** (biometric, haptics) must be gated with `#[cfg(mobile)]` and a target-specific Cargo dependency.
- **No official share sheet or status-bar plugin.** Sharing uses the Web Share API, which Android's WebView lacks, so Android falls back to copying. The status bar follows the system theme.
- **App lifecycle** comes from the web `visibilitychange` event; there is no JS app-state plugin.
- **Data is not encrypted at rest.** The PIN and biometrics gate the UI; entries are plain JSON in the app sandbox, the same as on the Capacitor branch.
