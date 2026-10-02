import { AnimatePresence, motion } from 'motion/react'
import {
  BellRing,
  Check,
  ChevronRight,
  Clock,
  Hash,
  Info,
  KeyRound,
  Lock,
  Moon,
  Smartphone,
  Timer,
  Trash2,
  Upload,
  User,
  Vibrate,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { PinPad } from '../components/PinPad'
import { Sheet } from '../components/Sheet'
import { Toggle } from '../components/Toggle'
import { biometryIcon, biometryLabel } from '../lib/biometry'
import { formatClock } from '../lib/date'
import { useApp } from '../lib/store'
import type { AutoLock, ThemePreference } from '../lib/types'
import { native } from '../native'
import { entryAsText } from './EntryView'

const AUTO_LOCK: Array<{ value: AutoLock; label: string }> = [
  { value: 0, label: 'Immediately' },
  { value: 30, label: 'After 30 seconds' },
  { value: 60, label: 'After 1 minute' },
  { value: 300, label: 'After 5 minutes' },
  { value: -1, label: 'Never' },
]

const THEMES: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function Settings() {
  const app = useApp()
  const { settings, biometry, platform, entries, haptic, showToast, updateSettings, withNativePrompt } = app
  const [sheet, setSheet] = useState<null | 'autolock' | 'pin' | 'erase'>(null)

  const BioIcon = biometryIcon(biometry.kind)
  const bioLabel = biometryLabel(biometry.kind, platform)

  const toggleBiometrics = async (next: boolean) => {
    if (next) {
      const result = await withNativePrompt(() => native.biometric.authenticate(`Turn on ${bioLabel}`))
      if (result !== 'success') return
      haptic.notify('success')
    } else haptic.selection()
    await updateSettings({ biometrics: next })
  }

  const toggleReminder = async (enabled: boolean) => {
    haptic.selection()
    const ok = await app.setReminder({ ...settings.reminder, enabled })
    if (!ok) showToast('Allow notifications in system settings')
    else if (enabled) showToast(`Reminder set for ${formatClock(settings.reminder.hour, settings.reminder.minute)}`)
  }

  const changeReminderTime = async (value: string) => {
    const [hour, minute] = value.split(':').map(Number)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return
    await app.setReminder({ enabled: true, hour, minute })
  }

  const exportAll = async () => {
    haptic.impact('light')
    if (!entries.length) return showToast('Nothing to export yet')
    const text = entries.map(entryAsText).join('\n\n— — —\n\n')
    const result = await native.share({ title: 'My Hush journal', text })
    if (result === 'copied') showToast('Journal copied to clipboard')
  }

  const autoLockLabel = AUTO_LOCK.find((o) => o.value === settings.autoLock)?.label ?? ''
  const reminderTime = `${String(settings.reminder.hour).padStart(2, '0')}:${String(settings.reminder.minute).padStart(2, '0')}`

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-safe pb-36 md:px-10 md:pb-16">
      <header className="pt-6 md:pt-14">
        <p className="text-[13px] font-medium text-ink-soft">Built with {native.framework}</p>
        <h1 className="mt-1 font-serif text-[42px] leading-[1.05] tracking-[-0.01em] md:text-[52px]">Settings</h1>
      </header>

      <div className="mt-7 flex flex-col gap-7">
        <Group title="Profile">
          <Row icon={User} label="Name">
            <input
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              placeholder="Add name"
              maxLength={32}
              className="w-36 bg-transparent text-right text-[15px] text-ink-soft outline-none placeholder:text-ink-faint"
            />
          </Row>
        </Group>

        <Group
          title="Security"
          footer={
            biometry.available
              ? undefined
              : (biometry.reason ?? 'Biometric unlock is not available on this device.')
          }
        >
          <Row icon={BioIcon} label={`Unlock with ${bioLabel}`}>
            <Toggle
              checked={settings.biometrics && biometry.available}
              onChange={toggleBiometrics}
              label={`Unlock with ${bioLabel}`}
              disabled={!biometry.available}
            />
          </Row>
          <Row icon={KeyRound} label="Change passcode" onClick={() => setSheet('pin')} chevron />
          <Row icon={Timer} label="Auto-lock" onClick={() => setSheet('autolock')} chevron>
            <span className="text-[15px] text-ink-soft">{autoLockLabel}</span>
          </Row>
          <Row
            icon={Lock}
            label="Lock now"
            onClick={() => {
              haptic.impact('light')
              app.lock()
            }}
          />
        </Group>

        <Group title="Reminders">
          <Row icon={BellRing} label="Daily reminder">
            <Toggle checked={settings.reminder.enabled} onChange={toggleReminder} label="Daily reminder" />
          </Row>
          <AnimatePresence initial={false}>
            {settings.reminder.enabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <Row icon={Clock} label="Time">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => changeReminderTime(e.target.value)}
                    className="rounded-lg bg-sunken px-2.5 py-1 text-[15px] font-medium text-ink outline-none"
                  />
                </Row>
              </motion.div>
            )}
          </AnimatePresence>
        </Group>

        <Group title="Experience">
          <Row icon={Vibrate} label="Haptic feedback">
            <Toggle
              checked={settings.haptics}
              onChange={(v) => {
                updateSettings({ haptics: v })
                if (v) native.haptics.impact('medium')
              }}
              label="Haptic feedback"
            />
          </Row>
          <Row icon={Moon} label="Appearance">
            <Segmented
              value={settings.theme}
              options={THEMES}
              onChange={(theme) => {
                haptic.selection()
                updateSettings({ theme })
              }}
            />
          </Row>
        </Group>

        <Group title="Data" footer="Entries live only on this device. Uninstalling Hush deletes them.">
          <Row icon={Upload} label="Export journal" onClick={exportAll} chevron />
          <Row icon={Trash2} label="Erase everything" danger onClick={() => setSheet('erase')} />
        </Group>

        <Group title="About">
          <Row icon={Info} label="Framework">
            <span className="text-[15px] text-ink-soft">{native.framework}</span>
          </Row>
          <Row icon={Smartphone} label="Platform">
            <span className="text-[15px] text-ink-soft capitalize">{platform === 'ios' ? 'iOS' : platform}</span>
          </Row>
          <Row icon={Hash} label="Version">
            <span className="text-[15px] text-ink-soft">{__APP_VERSION__}</span>
          </Row>
        </Group>
      </div>

      <Sheet open={sheet === 'autolock'} onClose={() => setSheet(null)} title="Auto-lock">
        <div className="overflow-hidden rounded-3xl bg-sunken">
          {AUTO_LOCK.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                haptic.selection()
                updateSettings({ autoLock: o.value })
                setSheet(null)
              }}
              className="flex h-14 w-full items-center justify-between border-b border-line/70 px-5 text-[16px] font-medium last:border-b-0 active:bg-line/60"
            >
              {o.label}
              {o.value === settings.autoLock && <Check className="size-5 text-accent-ink" strokeWidth={2.2} />}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'pin'} onClose={() => setSheet(null)} title="Change passcode">
        {sheet === 'pin' && <ChangePin onDone={() => setSheet(null)} />}
      </Sheet>

      <Sheet open={sheet === 'erase'} onClose={() => setSheet(null)} title="Erase everything?">
        <p className="-mt-2 mb-5 text-center text-[15px] leading-relaxed text-ink-soft">
          All {entries.length} entries, your passcode and settings will be removed from this device.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={async () => {
              haptic.notify('warning')
              setSheet(null)
              await app.eraseAll()
            }}
          >
            Erase everything
          </Button>
          <Button variant="secondary" onClick={() => setSheet(null)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function ChangePin({ onDone }: { onDone(): void }) {
  const { verifyPin, changePin, haptic, showToast } = useApp()
  const [stage, setStage] = useState<'current' | 'new' | 'confirm'>('current')
  const [next, setNext] = useState('')

  const prompts = { current: 'Enter your current passcode', new: 'Choose a new passcode', confirm: 'Confirm new passcode' }

  return (
    <div className="pb-2">
      <p className="-mt-2 mb-7 text-center text-[15px] text-ink-soft">{prompts[stage]}</p>
      <PinPad
        key={stage}
        onComplete={async (pin) => {
          if (stage === 'current') {
            if (!(await verifyPin(pin))) return false
            setStage('new')
            return true
          }
          if (stage === 'new') {
            setNext(pin)
            setStage('confirm')
            return true
          }
          if (pin !== next) return false
          await changePin(pin)
          haptic.notify('success')
          showToast('Passcode updated')
          onDone()
          return true
        }}
      />
    </div>
  )
}

function Group({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">{title}</h2>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">{children}</div>
      {footer && <p className="mt-2 px-1 text-[13px] leading-relaxed text-ink-faint">{footer}</p>}
    </section>
  )
}

function Row({
  icon: Icon,
  label,
  children,
  onClick,
  chevron,
  danger,
}: {
  icon: LucideIcon
  label: string
  children?: ReactNode
  onClick?(): void
  chevron?: boolean
  danger?: boolean
}) {
  const content = (
    <>
      <span
        className={`flex size-8.5 shrink-0 items-center justify-center rounded-[10px] ${
          danger ? 'bg-danger/12 text-danger' : 'bg-sunken text-ink-soft'
        }`}
      >
        <Icon className="size-4.5" strokeWidth={1.9} />
      </span>
      <span className={`min-w-0 flex-1 truncate text-left text-[15px] font-medium ${danger ? 'text-danger' : ''}`}>
        {label}
      </span>
      {children}
      {chevron && <ChevronRight className="-mr-1 size-5 shrink-0 text-ink-faint" strokeWidth={1.8} />}
    </>
  )
  const cls =
    'flex min-h-14 w-full items-center gap-3.5 px-4 py-2.5 not-last:border-b not-last:border-line/70'
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition-colors active:bg-sunken`}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange(v: T): void
}) {
  return (
    <div className="flex rounded-full bg-sunken p-0.75">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`relative h-7.5 rounded-full px-3 text-[13px] font-semibold transition-colors ${
            o.value === value ? 'text-ink' : 'text-ink-faint'
          }`}
        >
          {o.value === value && (
            <motion.span
              layoutId="segmented"
              className="absolute inset-0 rounded-full bg-raised shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
