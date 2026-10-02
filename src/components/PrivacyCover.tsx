import { AnimatePresence, motion } from 'motion/react'
import { useApp } from '../lib/store'
import { Logo } from './Logo'

/** Hides entries from the app switcher snapshot while the app is in the background. */
export function PrivacyCover() {
  const { obscured, phase } = useApp()
  return (
    <AnimatePresence>
      {obscured && phase === 'unlocked' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-70 flex items-center justify-center bg-canvas/70 backdrop-blur-2xl"
        >
          <Logo className="size-20 rounded-[22px] shadow-float" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
