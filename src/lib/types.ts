export type Mood = 'radiant' | 'good' | 'okay' | 'low' | 'rough'

export interface Entry {
  id: string
  title: string
  body: string
  mood: Mood
  favorite: boolean
  createdAt: number
  updatedAt: number
}

export type ThemePreference = 'system' | 'light' | 'dark'

/** Seconds in the background before the vault locks again. 0 = immediately, -1 = never. */
export type AutoLock = 0 | 30 | 60 | 300 | -1

export interface Settings {
  name: string
  biometrics: boolean
  haptics: boolean
  theme: ThemePreference
  autoLock: AutoLock
  reminder: { enabled: boolean; hour: number; minute: number }
}

export interface Security {
  salt: string
  pinHash: string
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  biometrics: false,
  haptics: true,
  theme: 'system',
  autoLock: 0,
  reminder: { enabled: false, hour: 21, minute: 0 },
}
