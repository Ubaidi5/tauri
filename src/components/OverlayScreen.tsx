import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Full-screen layer that slides over the tabs: from the right for details, from below for compose. */
export function OverlayScreen({ from = 'right', children }: { from?: 'right' | 'bottom'; children: ReactNode }) {
  const hidden = from === 'right' ? { x: '100%' } : { y: '100%' }
  return (
    <motion.div
      initial={hidden}
      animate={{ x: 0, y: 0 }}
      exit={hidden}
      transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.9 }}
      className="fixed inset-0 z-35 flex flex-col overflow-hidden bg-canvas shadow-[-12px_0_40px_rgb(0_0_0/0.08)]"
    >
      {children}
    </motion.div>
  )
}

export function TopBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    <header className="shrink-0 border-b border-line/60 bg-canvas/85 pt-safe backdrop-blur-xl">
      <div className="mx-auto grid h-14 w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:px-6">
        <div className="flex items-center justify-start">{left}</div>
        <div className="truncate text-center text-[15px] font-semibold">{center}</div>
        <div className="flex items-center justify-end gap-1">{right}</div>
      </div>
    </header>
  )
}
