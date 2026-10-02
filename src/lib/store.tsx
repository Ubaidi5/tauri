import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { native } from '../native'
import type { BiometricStatus, ImpactStyle, NotifyStyle, Platform } from '../native/types'
import { hashPin, randomSalt, uid } from './crypto'
import { sampleEntries } from './samples'
import { DEFAULT_SETTINGS, type Entry, type Security, type Settings } from './types'

type Phase = 'loading' | 'onboarding' | 'locked' | 'unlocked'

const KEYS = { entries: 'entries', settings: 'settings', security: 'security' } as const

interface OnboardingInput {
  name: string
  pin: string
  biometrics: boolean
  reminder: Settings['reminder']
  withSamples: boolean
}

interface Toast {
  id: number
  message: string
}

interface AppState {
  phase: Phase
  platform: Platform
  entries: Entry[]
  settings: Settings
  biometry: BiometricStatus
  /** True while the app is in the background, so the app switcher shows a blurred cover. */
  obscured: boolean
  toast: Toast | null
  isDark: boolean

  completeOnboarding(input: OnboardingInput): Promise<void>
  unlockWithPin(pin: string): Promise<boolean>
  unlockWithBiometrics(): Promise<boolean>
  lock(): void
  verifyPin(pin: string): Promise<boolean>
  changePin(pin: string): Promise<void>

  saveEntry(entry: Entry): Promise<void>
  deleteEntry(id: string): Promise<void>
  toggleFavorite(id: string): Promise<void>

  updateSettings(patch: Partial<Settings>): Promise<void>
  setReminder(reminder: Settings['reminder']): Promise<boolean>
  eraseAll(): Promise<void>

  haptic: {
    impact(style?: ImpactStyle): void
    notify(type: NotifyStyle): void
    selection(): void
  }
  showToast(message: string): void
  /** Runs a call that shows a system prompt without tripping auto-lock. */
  withNativePrompt<T>(fn: () => Promise<T>): Promise<T>
}

const AppContext = createContext<AppState | null>(null)

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

const sortEntries = (list: Entry[]) => [...list].sort((a, b) => b.createdAt - a.createdAt)

export function AppProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [platform, setPlatform] = useState<Platform>('web')
  const [entries, setEntries] = useState<Entry[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [security, setSecurity] = useState<Security | null>(null)
  const [biometry, setBiometry] = useState<BiometricStatus>({ available: false, kind: 'none' })
  const [obscured, setObscured] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const promptDepth = useRef(0)
  const promptEndedAt = useRef(0)
  const backgroundedAt = useRef<number | null>(null)

  // ── Boot ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [storedSettings, storedSecurity, storedEntries, plat, bio] = await Promise.all([
        native.storage.get<Settings>(KEYS.settings),
        native.storage.get<Security>(KEYS.security),
        native.storage.get<Entry[]>(KEYS.entries),
        native.platform(),
        native.biometric.status(),
      ])
      if (cancelled) return
      setPlatform(plat)
      setBiometry(bio)
      setSettings({ ...DEFAULT_SETTINGS, ...storedSettings })
      setSecurity(storedSecurity)
      setEntries(sortEntries(storedEntries ?? []))
      setPhase(storedSecurity ? 'locked' : 'onboarding')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Theme ───────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', isDark ? '#151413' : '#f6f4ef')
    })
    native.setStatusBar(isDark ? 'dark' : 'light')
  }, [isDark])

  // ── Auto-lock & privacy cover ───────────────────────────────────────
  useEffect(() => {
    return native.onAppStateChange((active) => {
      // System sheets (Face ID, permission prompts) briefly make the app inactive.
      const inPrompt = promptDepth.current > 0 || Date.now() - promptEndedAt.current < 800
      if (inPrompt) return

      if (!active) {
        backgroundedAt.current = Date.now()
        setObscured(true)
        return
      }

      setObscured(false)
      const since = backgroundedAt.current
      backgroundedAt.current = null
      const { autoLock } = settingsRef.current
      if (since === null || phaseRef.current !== 'unlocked' || autoLock < 0) return
      if ((Date.now() - since) / 1000 >= autoLock) setPhase('locked')
    })
  }, [])

  const withNativePrompt = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    promptDepth.current++
    try {
      return await fn()
    } finally {
      promptDepth.current--
      promptEndedAt.current = Date.now()
    }
  }, [])

  // ── Helpers ─────────────────────────────────────────────────────────
  const haptic = useMemo(
    () => ({
      impact: (style?: ImpactStyle) => settingsRef.current.haptics && native.haptics.impact(style),
      notify: (type: NotifyStyle) => settingsRef.current.haptics && native.haptics.notify(type),
      selection: () => settingsRef.current.haptics && native.haptics.selection(),
    }),
    [],
  )

  const toastTimer = useRef<number | undefined>(undefined)
  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message })
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  const persistEntries = useCallback((next: Entry[]) => {
    const sorted = sortEntries(next)
    setEntries(sorted)
    return native.storage.set(KEYS.entries, sorted)
  }, [])

  const persistSettings = useCallback(async (next: Settings) => {
    setSettings(next)
    await native.storage.set(KEYS.settings, next)
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(
    async ({ name, pin, biometrics, reminder, withSamples }: OnboardingInput) => {
      const salt = randomSalt()
      const sec: Security = { salt, pinHash: await hashPin(pin, salt) }
      await native.storage.set(KEYS.security, sec)
      setSecurity(sec)
      await persistSettings({ ...settingsRef.current, name: name.trim(), biometrics, reminder })
      await persistEntries(withSamples ? sampleEntries() : [])
      setPhase('unlocked')
    },
    [persistEntries, persistSettings],
  )

  const verifyPin = useCallback(
    async (pin: string) => !!security && (await hashPin(pin, security.salt)) === security.pinHash,
    [security],
  )

  const unlockWithPin = useCallback(
    async (pin: string) => {
      const ok = await verifyPin(pin)
      if (ok) setPhase('unlocked')
      return ok
    },
    [verifyPin],
  )

  const unlockWithBiometrics = useCallback(async () => {
    const result = await withNativePrompt(() => native.biometric.authenticate('Unlock your journal'))
    if (result === 'success') {
      setPhase('unlocked')
      return true
    }
    return false
  }, [withNativePrompt])

  const lock = useCallback(() => setPhase('locked'), [])

  const changePin = useCallback(async (pin: string) => {
    const salt = randomSalt()
    const sec: Security = { salt, pinHash: await hashPin(pin, salt) }
    await native.storage.set(KEYS.security, sec)
    setSecurity(sec)
  }, [])

  const saveEntry = useCallback(
    async (entry: Entry) => {
      const exists = entries.some((e) => e.id === entry.id)
      await persistEntries(exists ? entries.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...entries])
    },
    [entries, persistEntries],
  )

  const deleteEntry = useCallback(
    (id: string) => persistEntries(entries.filter((e) => e.id !== id)),
    [entries, persistEntries],
  )

  const toggleFavorite = useCallback(
    (id: string) => persistEntries(entries.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e))),
    [entries, persistEntries],
  )

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => persistSettings({ ...settingsRef.current, ...patch }),
    [persistSettings],
  )

  const setReminder = useCallback(
    async (reminder: Settings['reminder']) => {
      if (reminder.enabled) {
        const granted = await withNativePrompt(() => native.reminders.scheduleDaily(reminder.hour, reminder.minute))
        if (!granted) {
          await persistSettings({ ...settingsRef.current, reminder: { ...reminder, enabled: false } })
          return false
        }
      } else {
        await native.reminders.cancel()
      }
      await persistSettings({ ...settingsRef.current, reminder })
      return true
    },
    [persistSettings, withNativePrompt],
  )

  const eraseAll = useCallback(async () => {
    await native.reminders.cancel()
    await native.storage.clear()
    setEntries([])
    setSecurity(null)
    setSettings(DEFAULT_SETTINGS)
    setPhase('onboarding')
  }, [])

  const value: AppState = {
    phase,
    platform,
    entries,
    settings,
    biometry,
    obscured,
    toast,
    isDark,
    completeOnboarding,
    unlockWithPin,
    unlockWithBiometrics,
    lock,
    verifyPin,
    changePin,
    saveEntry,
    deleteEntry,
    toggleFavorite,
    updateSettings,
    setReminder,
    eraseAll,
    haptic,
    showToast,
    withNativePrompt,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const newEntry = (): Entry => {
  const now = Date.now()
  return { id: uid(), title: '', body: '', mood: 'good', favorite: false, createdAt: now, updatedAt: now }
}
