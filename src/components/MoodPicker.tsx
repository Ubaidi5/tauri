import { motion } from 'motion/react'
import { MOODS } from '../lib/moods'
import { useApp } from '../lib/store'
import type { Mood } from '../lib/types'

export function MoodPicker({ value, onChange }: { value: Mood; onChange(mood: Mood): void }) {
  const { haptic } = useApp()
  return (
    <div role="radiogroup" aria-label="Mood" className="grid grid-cols-5 gap-2">
      {MOODS.map((m) => {
        const active = m.id === value
        const Icon = m.icon
        return (
          <motion.button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (!active) haptic.selection()
              onChange(m.id)
            }}
            className={`relative flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-colors duration-200 ${
              active ? m.soft : 'hover:bg-sunken'
            }`}
          >
            {active && (
              <motion.span
                layoutId="mood-ring"
                className={`absolute inset-0 rounded-2xl ring-[1.5px] ${m.ring}`}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}
            <Icon
              className={`size-6 transition-colors duration-200 ${active ? m.text : 'text-ink-faint'}`}
              strokeWidth={1.7}
            />
            <span className={`text-[11px] font-medium ${active ? 'text-ink' : 'text-ink-faint'}`}>{m.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

export function MoodPill({ mood }: { mood: Mood }) {
  const m = MOODS.find((x) => x.id === mood)!
  const Icon = m.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-2 text-xs font-medium text-ink ${m.soft}`}>
      <Icon className={`size-3.5 ${m.text}`} strokeWidth={2} />
      {m.label}
    </span>
  )
}
