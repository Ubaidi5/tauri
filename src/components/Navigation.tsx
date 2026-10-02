import { motion } from 'motion/react'
import { BookOpen, ChartNoAxesColumn, Lock, PenLine, Settings2, type LucideIcon } from 'lucide-react'
import { useNav, type Tab } from '../lib/nav'
import { useApp } from '../lib/store'
import { Logo } from './Logo'
import { Pressable } from './Pressable'

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'insights', label: 'Insights', icon: ChartNoAxesColumn },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

/** Floating tab bar on phones. */
export function TabBar() {
  const { tab, setTab } = useNav()
  const { haptic } = useApp()
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-safe md:hidden">
      <div className="pointer-events-auto mb-3 flex w-full max-w-sm items-center gap-1 rounded-full border border-line/70 bg-surface/80 p-1.5 shadow-float backdrop-blur-xl backdrop-saturate-150">
        {TABS.map((t) => {
          const active = t.id === tab
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (!active) haptic.selection()
                setTab(t.id)
              }}
              aria-current={active ? 'page' : undefined}
              className="relative flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <Icon
                className={`relative size-5 transition-colors ${active ? 'text-canvas' : 'text-ink-soft'}`}
                strokeWidth={1.8}
              />
              <span className={`relative transition-colors ${active ? 'text-canvas' : 'sr-only'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** Sidebar on tablets and desktop. */
export function SideNav() {
  const { tab, setTab, open } = useNav()
  const { lock, haptic } = useApp()
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-4 pt-safe pb-6 md:flex lg:w-72">
      <div className="flex items-center gap-3 px-2 pt-8 pb-8">
        <Logo className="size-9 rounded-[10px]" />
        <span className="font-serif text-[28px] leading-none">Hush</span>
      </div>

      <Pressable
        onClick={() => {
          haptic.impact('light')
          open({ kind: 'compose' })
        }}
        className="mb-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-canvas shadow-soft"
      >
        <PenLine className="size-4.5" strokeWidth={2} />
        New entry
      </Pressable>

      <nav className="flex flex-col gap-1">
        {TABS.map((t) => {
          const active = t.id === tab
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
                active ? 'text-ink' : 'text-ink-soft hover:bg-sunken'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="side-pill"
                  className="absolute inset-0 rounded-xl bg-sunken"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className="relative size-5" strokeWidth={1.8} />
              <span className="relative">{t.label}</span>
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={lock}
        className="mt-auto flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink-soft transition-colors hover:bg-sunken"
      >
        <Lock className="size-5" strokeWidth={1.8} />
        Lock now
      </button>
    </aside>
  )
}
