/**
 * Capacitor 8 implementation of the NativeBridge.
 *
 * Plugins used:
 *   Official  @capacitor/app · clipboard · haptics · local-notifications · preferences · share · status-bar
 *   Community @aparajita/capacitor-biometric-auth (Capacitor has no official biometric plugin)
 *
 * On the web (`npm run dev` in a browser) every Capacitor plugin ships a web
 * fallback, so the same calls work there too.
 */
import { BiometricAuth, BiometryError, BiometryErrorType, BiometryType } from '@aparajita/capacitor-biometric-auth'
import { App } from '@capacitor/app'
import { Clipboard } from '@capacitor/clipboard'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { Share } from '@capacitor/share'
import { StatusBar, Style } from '@capacitor/status-bar'
import type { AuthResult, BiometryKind, NativeBridge, Platform } from './types'

const REMINDER_ID = 1001
const PREFIX = 'hush.'

const ignore = () => {}

function currentPlatform(): Platform {
  const p = Capacitor.getPlatform()
  return p === 'ios' || p === 'android' ? p : 'web'
}

const KIND: Record<BiometryType, BiometryKind> = {
  [BiometryType.none]: 'none',
  [BiometryType.touchId]: 'fingerprint',
  [BiometryType.faceId]: 'face',
  [BiometryType.fingerprintAuthentication]: 'fingerprint',
  [BiometryType.faceAuthentication]: 'face',
  [BiometryType.irisAuthentication]: 'iris',
}

const IMPACT = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy } as const
const NOTIFY = {
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error: NotificationType.Error,
} as const

export const native: NativeBridge = {
  framework: 'Capacitor',

  platform: async () => currentPlatform(),

  storage: {
    async get<T>(key: string) {
      const { value } = await Preferences.get({ key: PREFIX + key })
      return value === null ? null : (JSON.parse(value) as T)
    },
    async set<T>(key: string, value: T) {
      await Preferences.set({ key: PREFIX + key, value: JSON.stringify(value) })
    },
    async clear() {
      await Preferences.clear()
    },
  },

  biometric: {
    async status() {
      try {
        const s = await BiometricAuth.checkBiometry()
        return { available: s.isAvailable, kind: KIND[s.biometryType] ?? 'none', reason: s.reason || undefined }
      } catch {
        return { available: false, kind: 'none', reason: 'Biometric unlock is available on iOS and Android.' }
      }
    },
    async authenticate(reason): Promise<AuthResult> {
      try {
        await BiometricAuth.authenticate({
          reason,
          cancelTitle: 'Use passcode',
          allowDeviceCredential: false,
          iosFallbackTitle: 'Use passcode',
          androidTitle: 'Unlock Hush',
          androidSubtitle: reason,
          androidConfirmationRequired: false,
        })
        return 'success'
      } catch (err) {
        if (!(err instanceof BiometryError)) return 'failed'
        switch (err.code) {
          case BiometryErrorType.userCancel:
          case BiometryErrorType.appCancel:
          case BiometryErrorType.systemCancel:
          case BiometryErrorType.userFallback:
            return 'cancelled'
          case BiometryErrorType.biometryNotAvailable:
          case BiometryErrorType.biometryNotEnrolled:
          case BiometryErrorType.noDeviceCredential:
            return 'unavailable'
          default:
            return 'failed'
        }
      }
    },
  },

  haptics: {
    impact: (style = 'light') => void Haptics.impact({ style: IMPACT[style] }).catch(ignore),
    notify: (type) => void Haptics.notification({ type: NOTIFY[type] }).catch(ignore),
    selection: () => {
      // Selection feedback is a start/changed/end sequence in Capacitor.
      Haptics.selectionStart()
        .then(() => Haptics.selectionChanged())
        .then(() => Haptics.selectionEnd())
        .catch(ignore)
    },
  },

  reminders: {
    async scheduleDaily(hour, minute) {
      let { display } = await LocalNotifications.checkPermissions()
      if (display !== 'granted') display = (await LocalNotifications.requestPermissions()).display
      if (display !== 'granted') return false
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(ignore)
      await LocalNotifications.schedule({
        notifications: [
          {
            id: REMINDER_ID,
            title: 'A moment for yourself',
            body: 'How did today feel? Take a minute to write it down.',
            schedule: { on: { hour, minute }, allowWhileIdle: true },
          },
        ],
      })
      return true
    },
    async cancel() {
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(ignore)
    },
  },

  async share({ title, text }) {
    const { value: canShare } = await Share.canShare()
    if (canShare) {
      try {
        await Share.share({ title, text, dialogTitle: 'Share entry' })
        return 'shared'
      } catch {
        // Thrown when the user dismisses the share sheet.
        return 'dismissed'
      }
    }
    await Clipboard.write({ string: text })
    return 'copied'
  },

  copy: async (text) => {
    await Clipboard.write({ string: text })
  },

  onAppStateChange(listener) {
    if (!Capacitor.isNativePlatform()) {
      const handler = () => listener(document.visibilityState === 'visible')
      document.addEventListener('visibilitychange', handler)
      return () => document.removeEventListener('visibilitychange', handler)
    }
    const handle = App.addListener('appStateChange', ({ isActive }) => listener(isActive))
    return () => void handle.then((h) => h.remove())
  },

  setStatusBar(theme) {
    if (!Capacitor.isNativePlatform()) return
    // Style.Dark = light text for dark backgrounds.
    StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light }).catch(ignore)
  },
}
