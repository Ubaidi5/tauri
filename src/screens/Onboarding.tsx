import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, BellRing, Check, NotebookPen } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { Logo } from '../components/Logo'
import { PinPad } from '../components/PinPad'
import { Pressable } from '../components/Pressable'
import { Toggle } from '../components/Toggle'
import { biometryIcon, biometryLabel } from '../lib/biometry'
import { formatClock } from '../lib/date'
import { useApp } from '../lib/store'
import { native } from '../native'

type Step = 'welcome' | 'name' | 'pin' | 'confirm' | 'biometrics' | 'finish'

export function Onboarding() {
  const { biometry, platform, haptic, completeOnboarding, withNativePrompt } = useApp()
  const steps = useMemo<Step[]>(
    () => ['welcome', 'name', 'pin', 'confirm', ...(biometry.available ? (['biometrics'] as Step[]) : []), 'finish'],
    [biometry.available],
  )
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [biometrics, setBiometrics] = useState(false)
  const [reminder, setReminder] = useState(true)
  const [samples, setSamples] = useState(true)
  const [saving, setSaving] = useState(false)

  const step = steps[index]
  const bioLabel = biometryLabel(biometry.kind, platform)
  const BioIcon = biometryIcon(biometry.kind)

  const go = (delta: number) => {
    setDirection(delta)
    setIndex((i) => Math.min(Math.max(i + delta, 0), steps.length - 1))
  }

  const next = () => {
    haptic.impact('light')
    go(1)
  }

  const enableBiometrics = async () => {
    const result = await withNativePrompt(() => native.biometric.authenticate(`Turn on ${bioLabel} for Hush`))
    if (result === 'success') {
      haptic.notify('success')
      setBiometrics(true)
      go(1)
    }
  }

  const finish = async () => {
    setSaving(true)
    haptic.notify('success')
    let reminderOn = false
    if (reminder) {
      reminderOn = await withNativePrompt(() => native.reminders.scheduleDaily(21, 0))
    }
    await completeOnboarding({
      name,
      pin,
      biometrics,
      reminder: { enabled: reminderOn, hour: 21, minute: 0 },
      withSamples: samples,
    })
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas pt-safe pb-safe pl-safe pr-safe">
      <Glow />

      <header className="relative flex h-14 items-center justify-between px-4">
        <Pressable
          onClick={() => go(-1)}
          aria-label="Back"
          className={`flex size-10 items-center justify-center rounded-full text-ink-soft transition-opacity ${
            index > 0 ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ArrowLeft className="size-5.5" strokeWidth={1.8} />
        </Pressable>
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <motion.span
              key={s}
              animate={{ width: i === index ? 20 : 6 }}
              className={`h-1.5 rounded-full transition-colors ${i <= index ? 'bg-ink' : 'bg-line'}`}
            />
          ))}
        </div>
        <span className="size-10" />
      </header>

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={step}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -40, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {step === 'welcome' && (
              <>
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
                  >
                    <Logo className="size-24 rounded-[26px] shadow-float" />
                  </motion.div>
                  <h1 className="mt-9 font-serif text-[52px] leading-[0.95] tracking-[-0.01em]">
                    A quiet place
                    <br />
                    <span className="text-ink-soft italic">for your thoughts</span>
                  </h1>
                  <p className="mt-5 max-w-72 text-[15px] leading-relaxed text-ink-soft">
                    Write, reflect and track how your days feel. Everything stays on this phone.
                  </p>
                </div>
                <Button onClick={next} className="mb-4">
                  Get started
                </Button>
              </>
            )}

            {step === 'name' && (
              <form
                className="flex flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault()
                  next()
                }}
              >
                <StepTitle eyebrow="Step 1" title="What should we call you?">
                  Only used to greet you. You can skip this.
                </StepTitle>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="given-name"
                  enterKeyHint="next"
                  maxLength={32}
                  className="mt-10 h-15 w-full rounded-2xl border border-line bg-surface px-5 text-lg outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
                />
                <div className="flex-1" />
                <Button type="submit" className="mb-4">
                  {name.trim() ? 'Continue' : 'Skip for now'}
                </Button>
              </form>
            )}

            {(step === 'pin' || step === 'confirm') && (
              <>
                <StepTitle eyebrow="Step 2" title={step === 'pin' ? 'Create a passcode' : 'Confirm passcode'}>
                  {step === 'pin'
                    ? 'Your fallback when biometrics are unavailable.'
                    : 'Enter the same four digits once more.'}
                </StepTitle>
                <div className="flex flex-1 items-end justify-center pb-6">
                  <PinPad
                    key={step}
                    onComplete={(value) => {
                      if (step === 'pin') {
                        setPin(value)
                        window.setTimeout(next, 180)
                        return true
                      }
                      if (value === pin) {
                        window.setTimeout(next, 180)
                        return true
                      }
                      return false
                    }}
                  />
                </div>
              </>
            )}

            {step === 'biometrics' && (
              <>
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="relative flex size-28 items-center justify-center">
                    <span className="absolute inset-0 animate-breathe rounded-full bg-accent/30" />
                    <span className="relative flex size-24 items-center justify-center rounded-full bg-surface shadow-soft">
                      <BioIcon className="size-11 text-accent-ink" strokeWidth={1.4} />
                    </span>
                  </div>
                  <h1 className="mt-9 font-serif text-[40px] leading-none">Unlock with {bioLabel}</h1>
                  <p className="mt-4 max-w-72 text-[15px] leading-relaxed text-ink-soft">
                    Open your journal with a glance or a touch. Your passcode still works as a backup.
                  </p>
                </div>
                <div className="mb-4 flex flex-col gap-2">
                  <Button onClick={enableBiometrics} icon={<BioIcon className="size-5" strokeWidth={1.8} />}>
                    Enable {bioLabel}
                  </Button>
                  <Button variant="ghost" onClick={() => go(1)}>
                    Not now
                  </Button>
                </div>
              </>
            )}

            {step === 'finish' && (
              <>
                <StepTitle eyebrow="Last step" title="Make it yours">
                  A gentle nudge helps the habit stick.
                </StepTitle>
                <div className="mt-8 flex flex-col gap-3">
                  <OptionRow
                    icon={<BellRing className="size-5" strokeWidth={1.8} />}
                    title="Evening reminder"
                    detail={`Every day at ${formatClock(21, 0)}`}
                    checked={reminder}
                    onChange={(v) => {
                      haptic.selection()
                      setReminder(v)
                    }}
                  />
                  <OptionRow
                    icon={<NotebookPen className="size-5" strokeWidth={1.8} />}
                    title="Sample entries"
                    detail="See how Hush looks with a week of writing"
                    checked={samples}
                    onChange={(v) => {
                      haptic.selection()
                      setSamples(v)
                    }}
                  />
                </div>
                <div className="flex-1" />
                <Button
                  onClick={finish}
                  disabled={saving}
                  className="mb-4"
                  icon={<Check className="size-5" strokeWidth={2.2} />}
                >
                  Open my journal
                </Button>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  )
}

function StepTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="pt-8">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent-ink uppercase">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-[40px] leading-[1.02] tracking-[-0.01em]">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  )
}

function OptionRow({
  icon,
  title,
  detail,
  checked,
  onChange,
}: {
  icon: ReactNode
  title: string
  detail: string
  checked: boolean
  onChange(v: boolean): void
}) {
  return (
    <label className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-soft">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sunken text-ink-soft">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block truncate text-[13px] text-ink-soft">{detail}</span>
      </span>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </label>
  )
}

export function Glow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55dvh] overflow-hidden">
      <div className="absolute -top-40 left-1/2 size-144 -translate-x-1/2 rounded-full bg-accent/14 blur-3xl dark:bg-accent/8" />
    </div>
  )
}
