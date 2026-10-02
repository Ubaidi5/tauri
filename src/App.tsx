import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { SideNav, TabBar } from './components/Navigation'
import { PrivacyCover } from './components/PrivacyCover'
import { Toast } from './components/Toast'
import { NavProvider, useNav } from './lib/nav'
import { AppProvider, useApp } from './lib/store'
import { Editor } from './screens/Editor'
import { EntryView } from './screens/EntryView'
import { Insights } from './screens/Insights'
import { Journal } from './screens/Journal'
import { Lock } from './screens/Lock'
import { Onboarding } from './screens/Onboarding'
import { Settings } from './screens/Settings'

export function App() {
  return (
    <AppProvider>
      <NavProvider>
        <Shell />
        <Toast />
        <PrivacyCover />
      </NavProvider>
    </AppProvider>
  )
}

function Shell() {
  const { phase } = useApp()
  const { reset } = useNav()

  // Close any open entry when the journal locks, so it isn't visible after unlocking elsewhere.
  useEffect(() => {
    if (phase !== 'unlocked') reset()
  }, [phase, reset])

  if (phase === 'loading') return <div className="min-h-dvh bg-canvas" />
  if (phase === 'onboarding') return <Onboarding />

  return (
    <>
      {/* The app stays mounted underneath the lock screen so unlocking feels instant. */}
      <div aria-hidden={phase === 'locked'} className={phase === 'locked' ? 'invisible' : ''}>
        <Main />
      </div>
      <AnimatePresence>{phase === 'locked' && <Lock key="lock" />}</AnimatePresence>
    </>
  )
}

function Main() {
  const { tab, overlays } = useNav()

  useEffect(() => {
    document.body.style.overflow = overlays.length ? 'hidden' : ''
  }, [overlays.length])

  return (
    <div className="flex min-h-dvh pl-safe pr-safe">
      <SideNav />
      <main className="min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'journal' && <Journal />}
            {tab === 'insights' && <Insights />}
            {tab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>
      <TabBar />

      {/* Tints the status bar area so scrolled content never collides with the clock. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-25 h-[env(safe-area-inset-top)] bg-canvas/85 backdrop-blur-xl" />

      <AnimatePresence>
        {overlays.map((o, i) =>
          o.kind === 'entry' ? (
            <EntryView key={`entry-${o.id}-${i}`} id={o.id} />
          ) : (
            <Editor key={`compose-${o.id ?? 'new'}-${i}`} id={o.id} />
          ),
        )}
      </AnimatePresence>
    </div>
  )
}
