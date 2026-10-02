import { motion } from 'motion/react'

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange(next: boolean): void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7.5 w-12.5 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 disabled:opacity-40 ${
        checked ? 'bg-accent' : 'bg-line'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        className={`size-6.5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.18)] ${checked ? 'ml-auto' : ''}`}
      />
    </button>
  )
}
