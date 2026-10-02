import { uid } from './crypto'
import { DAY } from './date'
import type { Entry, Mood } from './types'

const SAMPLES: Array<{ daysAgo: number; hour: number; mood: Mood; title: string; body: string; favorite?: boolean }> = [
  {
    daysAgo: 0,
    hour: 8,
    mood: 'radiant',
    title: 'Welcome to Hush',
    body: 'This is your private space. Everything you write stays on this device, behind your face, fingerprint or PIN.\n\nTap the + button to write your first entry, pick how the day felt, and come back to Insights to see your weeks take shape.\n\nYou can delete these sample entries any time.',
    favorite: true,
  },
  {
    daysAgo: 1,
    hour: 21,
    mood: 'good',
    title: 'Slow Sunday',
    body: 'Long walk by the water, coffee that was actually hot, and a chapter of the book I keep putting down. Small, quiet, enough.',
  },
  {
    daysAgo: 2,
    hour: 19,
    mood: 'okay',
    title: 'Middle of the week',
    body: 'Nothing went wrong, nothing went especially right. Sometimes a plain day is its own kind of rest.',
  },
  {
    daysAgo: 3,
    hour: 22,
    mood: 'low',
    title: 'Tired',
    body: 'Slept badly and felt it all day. Note to self: phone out of the bedroom.',
  },
  {
    daysAgo: 5,
    hour: 18,
    mood: 'good',
    title: 'Finished the draft',
    body: 'Sent it off before lunch. The relief arrived about an hour later, all at once.',
  },
  {
    daysAgo: 6,
    hour: 23,
    mood: 'rough',
    title: 'Hard conversation',
    body: 'Said the thing I had been avoiding. It did not go well, but it is said. Tomorrow will be easier for it.',
  },
  {
    daysAgo: 8,
    hour: 9,
    mood: 'radiant',
    title: 'First cold morning',
    body: 'Crisp air, bright sky, and the whole street smelled like bread. Autumn is here.',
  },
]

export function sampleEntries(now = Date.now()): Entry[] {
  return SAMPLES.map((s) => {
    const d = new Date(now - s.daysAgo * DAY)
    if (s.daysAgo > 0) d.setHours(s.hour, 12, 0, 0)
    const t = Math.min(d.getTime(), now)
    return { id: uid(), title: s.title, body: s.body, mood: s.mood, favorite: !!s.favorite, createdAt: t, updatedAt: t }
  })
}
