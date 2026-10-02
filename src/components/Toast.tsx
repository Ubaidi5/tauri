import { AnimatePresence, motion } from 'motion/react'
import { useApp } from '../lib/store'

export function Toast() {
  const { toast } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-60 flex justify-center pt-safe">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            className="mt-3 rounded-full bg-ink px-4.5 py-2.5 text-sm font-medium text-canvas shadow-float"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
