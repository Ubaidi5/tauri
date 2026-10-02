import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { DAY, startOfDay, streak } from '../lib/date'
import { MOODS, moodMeta } from '../lib/moods'
import { useApp } from '../lib/store'

const RANGE = 14

export function Insights() {
  const { entries, haptic } = useApp()
  const [active, setActive] = useState<number | null>(null)

  const days = useMemo(() => {
    const today = startOfDay(Date.now())
    return Array.from({ length: RANGE }, (_, i) => {
      const day = today - (RANGE - 1 - i) * DAY
      const list = entries.filter((e) => startOfDay(e.createdAt) === day)
      const avg = list.length ? list.reduce((s, e) => s + moodMeta(e.mood).score, 0) / list.length : 0
      const mood = avg ? MOODS.reduce((best, m) => (Math.abs(m.score - avg) < Math.abs(best.score - avg) ? m : best)) : null
      return { day, count: list.length, avg, mood }
    })
  }, [entries])

  const distribution = useMemo(() => {
    const total = entries.length || 1
    return MOODS.map((m) => {
      const count = entries.filter((e) => e.mood === m.id).length
      return { ...m, count, share: count / total }
    })
  }, [entries])

  const words = useMemo(
    () => entries.reduce((sum, e) => sum + (e.body.trim() ? e.body.trim().split(/\s+/).length : 0), 0),
    [entries],
  )

  const loggedDays = days.filter((d) => d.count > 0)
  const average = loggedDays.length ? loggedDays.reduce((s, d) => s + d.avg, 0) / loggedDays.length : 0
  const averageMood = average ? MOODS.reduce((b, m) => (Math.abs(m.score - average) < Math.abs(b.score - average) ? m : b)) : null
  const top = [...distribution].sort((a, b) => b.count - a.count)[0]
  const selected = active !== null ? days[active] : null

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-safe pb-36 md:px-10 md:pb-16">
      <header className="pt-6 md:pt-14">
        <p className="text-[13px] font-medium text-ink-soft">Last {RANGE} days</p>
        <h1 className="mt-1 font-serif text-[42px] leading-[1.05] tracking-[-0.01em] md:text-[52px]">Insights</h1>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-7 rounded-4xl border border-line bg-surface p-5 shadow-soft md:p-6"
        aria-label="Mood over the last 14 days"
      >
        <div className="flex min-h-14 items-start justify-between gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected ? selected.day : 'summary'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <p className="text-[13px] font-medium text-ink-soft">
                {selected
                  ? new Date(selected.day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
                  : 'Average mood'}
              </p>
              <p className="mt-0.5 font-serif text-[30px] leading-tight">
                {selected
                  ? selected.mood
                    ? `${selected.mood.label}${selected.count > 1 ? ` · ${selected.count} entries` : ''}`
                    : 'No entry'
                  : (averageMood?.label ?? 'Not enough data')}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mt-5 h-44" onPointerLeave={() => setActive(null)}>
          {/* Recessive guides at the top (radiant) and baseline. */}
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
          <div className="absolute inset-x-0 bottom-0 border-t border-line" />
          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2.5">
            {days.map((d, i) => {
              const height = d.avg ? (d.avg / 5) * 100 : 0
              const dim = active !== null && active !== i
              return (
                <button
                  key={d.day}
                  type="button"
                  aria-label={`${new Date(d.day).toDateString()}: ${d.mood?.label ?? 'no entry'}`}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                  onClick={() => {
                    haptic.selection()
                    setActive((cur) => (cur === i ? null : i))
                  }}
                  className="flex h-full flex-1 items-end justify-center"
                >
                  {d.mood ? (
                    <motion.span
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%`, opacity: dim ? 0.35 : 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 26, delay: i * 0.025 }}
                      className={`w-full max-w-7 rounded-t-[4px] ${d.mood.dot}`}
                    />
                  ) : (
                    <span className={`mb-1 size-1.5 rounded-full bg-line transition-opacity ${dim ? 'opacity-40' : ''}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-2 flex gap-1.5 sm:gap-2.5" aria-hidden="true">
          {days.map((d, i) => (
            <span
              key={d.day}
              className={`flex-1 text-center text-[10px] font-medium tabular-nums ${
                active === i ? 'text-ink' : 'text-ink-faint'
              }`}
            >
              {new Date(d.day).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </span>
          ))}
        </div>
      </motion.section>

      <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Day streak" value={streak(entries.map((e) => e.createdAt))} />
        <Tile label="Days logged" value={`${loggedDays.length}/${RANGE}`} />
        <Tile label="Words written" value={words.toLocaleString()} />
        <Tile label="Avg. per entry" value={entries.length ? Math.round(words / entries.length) : 0} />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="mt-4 rounded-4xl border border-line bg-surface p-5 shadow-soft md:p-6"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Mood mix</h2>
          {top && top.count > 0 && <p className="text-[13px] text-ink-soft">Mostly {top.label.toLowerCase()}</p>}
        </div>
        <ul className="mt-4 flex flex-col gap-3.5">
          {distribution.map((m, i) => {
            const Icon = m.icon
            return (
              <li key={m.id} className="flex items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${m.soft}`}>
                  <Icon className={`size-4.5 ${m.text}`} strokeWidth={1.9} />
                </span>
                <span className="w-16 shrink-0 text-[14px] font-medium">{m.label}</span>
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${m.share * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.15 + i * 0.05 }}
                    className={`absolute inset-y-0 left-0 rounded-full ${m.dot}`}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-[13px] font-medium text-ink-soft tabular-nums">
                  {Math.round(m.share * 100)}%
                </span>
              </li>
            )
          })}
        </ul>
      </motion.section>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-line bg-surface px-4 py-4 shadow-soft">
      <p className="font-serif text-[30px] leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-xs font-medium text-ink-soft">{label}</p>
    </div>
  )
}
