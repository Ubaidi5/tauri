/**
 * Tauri v2 implementation of the NativeBridge.
 *
 * Plugins used (all official, from tauri-apps/plugins-workspace):
 *   biometric · haptics · notification · store · clipboard-manager · os
 *
 * Biometric and haptics plugins only exist on iOS/Android, so the Rust side
 * registers them behind #[cfg(mobile)] and every call here degrades gracefully
 * on desktop.
 */
import { authenticate, BiometryType, checkStatus } from '@tauri-apps/plugin-biometric'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { impactFeedback, notificationFeedback, selectionFeedback } from '@tauri-apps/plugin-haptics'
import {
  cancel as cancelNotifications,
  isPermissionGranted,
  requestPermission,
  Schedule,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { platform as osPlatform } from '@tauri-apps/plugin-os'
import { load, type Store } from '@tauri-apps/plugin-store'
import type { AuthResult, BiometryKind, NativeBridge, Platform } from './types'

const REMINDER_ID = 1001

let storePromise: Promise<Store> | null = null
const store = () => (storePromise ??= load('hush.json', { autoSave: false, defaults: {} }))

const ignore = () => {}

function currentPlatform(): Platform {
  try {
    const p = osPlatform()
    if (p === 'ios' || p === 'android') return p
    return 'desktop'
  } catch {
    return 'web'
  }
}

const KIND: Record<BiometryType, BiometryKind> = {
  [BiometryType.None]: 'none',
  [BiometryType.TouchID]: 'fingerprint',
  [BiometryType.FaceID]: 'face',
  [BiometryType.Iris]: 'iris',
}

export const native: NativeBridge = {
  framework: 'Tauri',

  platform: async () => currentPlatform(),

  storage: {
    async get<T>(key: string) {
      return ((await (await store()).get<T>(key)) ?? null) as T | null
    },
    async set<T>(key: string, value: T) {
      const s = await store()
      await s.set(key, value)
      await s.save()
    },
    async clear() {
      const s = await store()
      await s.clear()
      await s.save()
    },
  },

  biometric: {
    async status() {
      try {
        const s = await checkStatus()
        return { available: s.isAvailable, kind: KIND[s.biometryType] ?? 'none', reason: s.error }
      } catch {
        return { available: false, kind: 'none', reason: 'Biometric unlock is available on iOS and Android.' }
      }
    },
    async authenticate(reason): Promise<AuthResult> {
      try {
        await authenticate(reason, {
          allowDeviceCredential: false,
          cancelTitle: 'Use passcode',
          fallbackTitle: 'Use passcode',
          title: 'Unlock Hush',
          subtitle: reason,
        })
        return 'success'
      } catch (err) {
        const message = String(err).toLowerCase()
        if (message.includes('cancel') || message.includes('fallback')) return 'cancelled'
        if (message.includes('not available') || message.includes('not enrolled')) return 'unavailable'
        return 'failed'
      }
    },
  },

  haptics: {
    impact: (style = 'light') => void impactFeedback(style).catch(ignore),
    notify: (type) => void notificationFeedback(type).catch(ignore),
    selection: () => void selectionFeedback().catch(ignore),
  },

  reminders: {
    async scheduleDaily(hour, minute) {
      let granted = await isPermissionGranted()
      if (!granted) granted = (await requestPermission()) === 'granted'
      if (!granted) return false
      await cancelNotifications([REMINDER_ID]).catch(ignore)
      sendNotification({
        id: REMINDER_ID,
        title: 'A moment for yourself',
        body: 'How did today feel? Take a minute to write it down.',
        schedule: Schedule.interval({ hour, minute }, true),
      })
      return true
    },
    async cancel() {
      await cancelNotifications([REMINDER_ID]).catch(ignore)
    },
  },

  // Tauri has no official share-sheet plugin yet. iOS WKWebView supports the
  // Web Share API; Android WebView does not, so we fall back to the clipboard.
  async share({ title, text }) {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text })
        return 'shared'
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return 'dismissed'
      }
    }
    await writeText(text)
    return 'copied'
  },

  copy: (text) => writeText(text),

  onAppStateChange(listener) {
    const handler = () => listener(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  },

  // No official status-bar plugin: the native status bar follows the system appearance.
  setStatusBar: ignore,
}
