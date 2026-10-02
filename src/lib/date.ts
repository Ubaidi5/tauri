const DAY = 86_400_000

export const startOfDay = (t: number | Date) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const daysBetween = (a: number, b: number) => Math.round((startOfDay(a) - startOfDay(b)) / DAY)

export const longDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

export const fullDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const shortTime = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export const monthLabel = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export function relativeDay(t: number, now = Date.now()): string {
  const diff = daysBetween(now, t)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return new Date(t).toLocaleDateString(undefined, { weekday: 'long' })
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Consecutive days with at least one entry, ending today or yesterday. */
export function streak(timestamps: number[], now = Date.now()): number {
  const days = new Set(timestamps.map(startOfDay))
  let cursor = startOfDay(now)
  if (!days.has(cursor)) cursor -= DAY
  let count = 0
  while (days.has(cursor)) {
    count++
    cursor -= DAY
  }
  return count
}

export const formatClock = (hour: number, minute: number) => {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return shortTime(d.getTime())
}

export { DAY }
