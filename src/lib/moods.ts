import { CloudDrizzle, CloudLightning, Meh, Smile, Sun, type LucideIcon } from 'lucide-react'
import type { Mood } from './types'

export interface MoodMeta {
  id: Mood
  label: string
  icon: LucideIcon
  /** 5 = brightest day, 1 = heaviest. Used by Insights. */
  score: number
  /** Tailwind classes, written out in full so the compiler can see them. */
  dot: string
  text: string
  soft: string
  ring: string
}

export const MOODS: MoodMeta[] = [
  {
    id: 'radiant',
    label: 'Radiant',
    icon: Sun,
    score: 5,
    dot: 'bg-mood-radiant',
    text: 'text-mood-radiant',
    soft: 'bg-mood-radiant/12',
    ring: 'ring-mood-radiant',
  },
  {
    id: 'good',
    label: 'Good',
    icon: Smile,
    score: 4,
    dot: 'bg-mood-good',
    text: 'text-mood-good',
    soft: 'bg-mood-good/14',
    ring: 'ring-mood-good',
  },
  {
    id: 'okay',
    label: 'Okay',
    icon: Meh,
    score: 3,
    dot: 'bg-mood-okay',
    text: 'text-mood-okay',
    soft: 'bg-mood-okay/14',
    ring: 'ring-mood-okay',
  },
  {
    id: 'low',
    label: 'Low',
    icon: CloudDrizzle,
    score: 2,
    dot: 'bg-mood-low',
    text: 'text-mood-low',
    soft: 'bg-mood-low/14',
    ring: 'ring-mood-low',
  },
  {
    id: 'rough',
    label: 'Rough',
    icon: CloudLightning,
    score: 1,
    dot: 'bg-mood-rough',
    text: 'text-mood-rough',
    soft: 'bg-mood-rough/12',
    ring: 'ring-mood-rough',
  },
]

const BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m])) as Record<Mood, MoodMeta>

export const moodMeta = (mood: Mood): MoodMeta => BY_ID[mood]
