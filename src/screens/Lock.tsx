import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Logo } from '../components/Logo'
import { PinPad } from '../components/PinPad'
import { Pressable } from '../components/Pressable'
import { biometryIcon, biometryLabel } from '../lib/biometry'
import { greeting } from '../lib/date'
import { useApp } from '../lib/store'
import { Glow } from './Onboarding'

const MAX_ATTEMPTS = 5
const COOLDOWN_S = 30

export function Lock() {
  const { settings, biometry, platform, unlockWithPin, unlockWithBiometrics, haptic } = useApp()
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState('')
  const autoPrompted = useRef(false)

  const canUseBiometrics = settings.biometrics && biometry.available
  const BioIcon = biometryIcon(biometry.kind)
  const bioLabel = biometryLabel(biometry.kind, platform)

  const tryBiometrics = useCallback(async () => {
    const ok = await unlockWithBiometrics()
    if (ok) haptic.notify('success')
  }, [unlockWithBiometrics, haptic])

  // Prompt for Face ID / fingerprint as soon as the lock screen appears.
  useEffect(() => {
    if (!canUseBiometrics || autoPrompted.current) return
    const t = window.setTimeout(() => {
      autoPrompted.current = true
      tryBiometrics()
    }, 350)
    return () => window.clearTimeout(t)
  }, [canUseBiometrics, tryBiometrics])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  const onPin = async (pin: string) => {
    const ok = await unlockWithPin(pin)
    if (ok) {
      haptic.notify('success')
      return true
    }
    const n = attempts + 1
    setAttempts(n)
    if (n >= MAX_ATTEMPTS) {
      setAttempts(0)
      setCooldown(COOLDOWN_S)
      setMessage('')
    } else {
      setMessage(`Wrong passcode · ${MAX_ATTEMPTS - n} ${MAX_ATTEMPTS - n === 1 ? 'try' : 'tries'} left`)
    }
    return false
  }

  const name = settings.name ? `, ${settings.name}` : ''

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-canvas pt-safe pb-safe"
    >
      <Glow />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 pt-[max(2rem,8dvh)] pb-6">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          <Logo className="size-16 rounded-[18px] shadow-float" />
          <h1 className="mt-6 font-serif text-[34px] leading-tight">
            {greeting()}
            {name}
          </h1>
          <p className="mt-1.5 h-5 text-sm text-ink-soft" aria-live="polite">
            {cooldown > 0 ? (
              <span className="text-danger">Too many attempts · try again in {cooldown}s</span>
            ) : message ? (
              <span className="text-danger">{message}</span>
            ) : (
              'Enter your passcode'
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-auto w-full pt-10"
        >
          <PinPad
            onComplete={onPin}
            disabled={cooldown > 0}
            leftKey={
              canUseBiometrics ? (
                <Pressable
                  onClick={tryBiometrics}
                  aria-label={`Unlock with ${bioLabel}`}
                  className="flex aspect-square w-full items-center justify-center rounded-full text-accent-ink"
                >
                  <BioIcon className="size-8" strokeWidth={1.5} />
                </Pressable>
              ) : null
            }
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
