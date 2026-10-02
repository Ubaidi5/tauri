import { AnimatePresence, motion } from 'motion/react'
import { Heart, Lock, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Pressable } from '../components/Pressable'
import { greeting, longDate, monthLabel, relativeDay, shortTime, streak } from '../lib/date'
import { MOODS, moodMeta } from '../lib/moods'
import { useNav } from '../lib/nav'
import { useApp } from '../lib/store'
import type { Entry, Mood } from '../lib/types'

type Filter = 'all' | 'favorites' | Mood

export function Journal() {
  const { entries, settings, lock, haptic } = useApp()
  const { open } = useNav()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    return {
      total: entries.length,
      streak: streak(entries.map((e) => e.createdAt)),
      month: entries.filter((e) => e.createdAt >= monthStart).length,
    }
  }, [entries])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const visible = entries.filter((e) => {
      if (filter === 'favorites' && !e.favorite) return false
      if (filter !== 'all' && filter !== 'favorites' && e.mood !== filter) return false
      return !q || e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)
    })
    const map = new Map<string, Entry[]>()
    for (const e of visible) {
      const key = monthLabel(e.createdAt)
      map.set(key, [...(map.get(key) ?? []), e])
    }
    return [...map.entries()]
  }, [entries, query, filter])

  const compose = () => {
    haptic.impact('medium')
    open({ kind: 'compose' })
  }

  const hasEntries = entries.length > 0

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-safe pb-36 md:px-10 md:pb-16">
      <header className="flex items-start justify-between pt-6 md:pt-14">
        <div>
          <p className="text-[13px] font-medium text-ink-soft">{longDate(Date.now())}</p>
          <h1 className="mt-1 font-serif text-[42px] leading-[1.05] tracking-[-0.01em] md:text-[52px]">
            {greeting()}
            {settings.name && (
              <>
                ,<br className="sm:hidden" /> <span className="text-ink-soft italic">{settings.name}</span>
              </>
            )}
          </h1>
        </div>
        <Pressable
          onClick={() => {
            haptic.impact('light')
            lock()
          }}
          aria-label="Lock journal"
          className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-soft md:hidden"
        >
          <Lock className="size-4.5" strokeWidth={1.8} />
        </Pressable>
      </header>

      <section className="mt-7 grid grid-cols-3 gap-2.5" aria-label="Summary">
        <Stat label="Entries" value={stats.total} />
        <Stat label="Day streak" value={stats.streak} accent />
        <Stat label="This month" value={stats.month} />
      </section>

      {hasEntries && (
        <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-5 mt-4 bg-canvas/85 px-5 pt-2 pb-3 backdrop-blur-xl md:-mx-10 md:px-10">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your journal"
              enterKeyHint="search"
              className="h-12 w-full rounded-2xl border border-line bg-surface pr-11 pl-11 text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-ink/30 focus:ring-4 focus:ring-ink/5 [&::-webkit-search-cancel-button]:hidden"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink-faint/25 text-ink-soft"
                >
                  <X className="size-3.5" strokeWidth={2.4} />
                </motion.button>
              )}
            </AnimatePresence>
          </label>

          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 md:-mx-10 md:px-10">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </Chip>
            <Chip active={filter === 'favorites'} onClick={() => setFilter('favorites')}>
              <Heart className="size-3.5" strokeWidth={2} />
              Favorites
            </Chip>
            {MOODS.map((m) => (
              <Chip key={m.id} active={filter === m.id} onClick={() => setFilter(m.id)}>
                <span className={`size-2 rounded-full ${m.dot}`} />
                {m.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {!hasEntries ? (
        <EmptyState onCompose={compose} />
      ) : groups.length === 0 ? (
        <p className="py-20 text-center text-[15px] text-ink-soft">Nothing matches that search.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-8">
          {groups.map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-3 px-1 text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">{month}</h2>
              <ul className="grid gap-3 lg:grid-cols-2">
                <AnimatePresence initial={false}>
                  {list.map((entry, i) => (
                    <motion.li
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.3) } }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    >
                      <EntryCard entry={entry} onOpen={() => open({ kind: 'entry', id: entry.id })} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Compose button on phones; the sidebar has its own on larger screens. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl justify-end px-5 pb-safe md:hidden">
        <Pressable
          onClick={compose}
          aria-label="New entry"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          scale={0.9}
          className="pointer-events-auto mb-23 flex size-15 items-center justify-center rounded-full bg-accent text-on-accent shadow-float"
        >
          <Plus className="size-7" strokeWidth={2} />
        </Pressable>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-3xl border border-line bg-surface px-4 py-3.5 shadow-soft">
      <motion.p
        key={value}
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`font-serif text-[34px] leading-none tabular-nums ${accent ? 'text-accent-ink' : ''}`}
      >
        {value}
      </motion.p>
      <p className="mt-1.5 truncate text-xs font-medium text-ink-soft">{label}</p>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick(): void; children: React.ReactNode }) {
  const { haptic } = useApp()
  return (
    <button
      type="button"
      onClick={() => {
        if (!active) haptic.selection()
        onClick()
      }}
      aria-pressed={active}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-200 ${
        active ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function EntryCard({ entry, onOpen }: { entry: Entry; onOpen(): void }) {
  const m = moodMeta(entry.mood)
  const Icon = m.icon
  return (
    <Pressable
      onClick={onOpen}
      scale={0.98}
      className="group flex h-full w-full gap-4 rounded-3xl border border-line bg-surface p-4.5 text-left shadow-soft transition-colors hover:border-ink/15"
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${m.soft}`}>
        <Icon className={`size-5.5 ${m.text}`} strokeWidth={1.8} aria-label={m.label} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[16px] font-semibold tracking-[-0.01em]">{entry.title || 'Untitled'}</span>
          {entry.favorite && <Heart className="size-3.5 shrink-0 fill-danger text-danger" aria-label="Favorite" />}
        </span>
        <span className="mt-1 line-clamp-2 text-[14px] leading-snug text-ink-soft">
          {entry.body || 'No words yet.'}
        </span>
        <span className="mt-2.5 block text-xs font-medium text-ink-faint">
          {relativeDay(entry.createdAt)} · {shortTime(entry.createdAt)}
        </span>
      </span>
    </Pressable>
  )
}

function EmptyState({ onCompose }: { onCompose(): void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 flex flex-col items-center rounded-4xl border border-dashed border-line px-6 py-14 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-3xl bg-accent/12">
        <Plus className="size-7 text-accent-ink" strokeWidth={1.8} />
      </div>
      <h2 className="mt-5 font-serif text-[30px] leading-tight">Your first page</h2>
      <p className="mt-2 max-w-64 text-[15px] leading-relaxed text-ink-soft">
        A sentence is enough. Write how today felt and Hush will keep it safe.
      </p>
      <Pressable
        onClick={onCompose}
        className="mt-6 h-11 rounded-full bg-ink px-6 text-sm font-semibold text-canvas shadow-soft"
      >
        Write something
      </Pressable>
    </motion.div>
  )
}
