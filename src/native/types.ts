/**
 * The only contract between the UI and the native layer.
 * Both branches ship identical UI code; each implements this interface
 * once in `src/native/index.ts` using its own framework's plugins.
 */

export type Platform = 'ios' | 'android' | 'desktop' | 'web'

export type BiometryKind = 'face' | 'fingerprint' | 'iris' | 'none'

export interface BiometricStatus {
  available: boolean
  kind: BiometryKind
  /** Why biometrics can't be used right now (not enrolled, no hardware…). */
  reason?: string
}

export type AuthResult = 'success' | 'cancelled' | 'failed' | 'unavailable'

export type ImpactStyle = 'light' | 'medium' | 'heavy'
export type NotifyStyle = 'success' | 'warning' | 'error'

export type ShareResult = 'shared' | 'copied' | 'dismissed'

export interface NativeBridge {
  /** Framework name, shown in Settings → About. */
  readonly framework: 'Tauri' | 'Capacitor'

  platform(): Promise<Platform>

  storage: {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T): Promise<void>
    clear(): Promise<void>
  }

  biometric: {
    status(): Promise<BiometricStatus>
    authenticate(reason: string): Promise<AuthResult>
  }

  haptics: {
    impact(style?: ImpactStyle): void
    notify(type: NotifyStyle): void
    selection(): void
  }

  reminders: {
    /** Schedules a repeating daily local notification. Resolves false if permission was denied. */
    scheduleDaily(hour: number, minute: number): Promise<boolean>
    cancel(): Promise<void>
  }

  share(payload: { title: string; text: string }): Promise<ShareResult>
  copy(text: string): Promise<void>

  /** App moved to background / came back. Returns an unsubscribe function. */
  onAppStateChange(listener: (active: boolean) => void): () => void

  /** Matches the system status bar to the in-app theme where the platform allows it. */
  setStatusBar(theme: 'light' | 'dark'): void
}
