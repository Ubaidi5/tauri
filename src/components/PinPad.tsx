import { motion } from 'motion/react'
import { Delete } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from '../lib/store'
import { Pressable } from './Pressable'

export const PIN_LENGTH = 4

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * A 4-digit PIN pad. Calls onComplete once all digits are entered; resolve
 * `false` to shake and clear, `true` to keep the dots filled.
 */
export function PinPad({
  onComplete,
  leftKey,
  disabled,
}: {
  onComplete(pin: string): Promise<boolean> | boolean
  leftKey?: ReactNode
  disabled?: boolean
}) {
  const { haptic } = useApp()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(0)

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return
    let alive = true
    Promise.resolve(onComplete(pin)).then((ok) => {
      if (!alive) return
      if (!ok) {
        haptic.notify('error')
        setError((n) => n + 1)
        window.setTimeout(() => alive && setPin(''), 380)
      }
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const press = (digit: string) => {
    if (disabled || pin.length >= PIN_LENGTH) return
    haptic.selection()
    setPin((p) => p + digit)
  }

  const erase = () => {
    if (!pin.length) return
    haptic.selection()
    setPin((p) => p.slice(0, -1))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') erase()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex w-full flex-col items-center">
      <div key={error} className={`mb-10 flex gap-4.5 ${error ? 'animate-shake' : ''}`} aria-live="polite">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <motion.span
            key={i}
            animate={{ scale: i < pin.length ? 1 : 0.82 }}
            transition={{ type: 'spring', stiffness: 700, damping: 22 }}
            className={`size-3.5 rounded-full border-[1.5px] transition-colors duration-150 ${
              i < pin.length ? 'border-ink bg-ink' : 'border-ink-faint bg-transparent'
            }`}
          />
        ))}
        <span className="sr-only">
          {pin.length} of {PIN_LENGTH} digits entered
        </span>
      </div>

      <div className="grid w-full max-w-72 grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map((k) => (
          <Key key={k} onClick={() => press(k)} disabled={disabled}>
            {k}
          </Key>
        ))}
        <div className="flex items-center justify-center">{leftKey}</div>
        <Key onClick={() => press('0')} disabled={disabled}>
          0
        </Key>
        <Pressable
          onClick={erase}
          aria-label="Delete digit"
          className={`flex aspect-square items-center justify-center rounded-full text-ink-soft transition-opacity ${
            pin.length ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <Delete className="size-6" strokeWidth={1.6} />
        </Pressable>
      </div>
    </div>
  )
}

function Key({ children, onClick, disabled }: { children: ReactNode; onClick(): void; disabled?: boolean }) {
  return (
    <Pressable
      onClick={onClick}
      disabled={disabled}
      scale={0.9}
      className="flex aspect-square items-center justify-center rounded-full bg-sunken text-[28px] font-light tabular-nums text-ink transition-colors active:bg-line disabled:opacity-40"
    >
      {children}
    </Pressable>
  )
}
