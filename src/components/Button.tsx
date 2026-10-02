import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { Pressable } from './Pressable'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-canvas shadow-soft',
  secondary: 'bg-sunken text-ink',
  ghost: 'text-ink-soft',
  danger: 'bg-danger text-white',
}

export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  ...props
}: HTMLMotionProps<'button'> & { variant?: Variant; icon?: ReactNode; children?: ReactNode }) {
  return (
    <Pressable
      className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold tracking-[-0.01em] transition-opacity disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </Pressable>
  )
}
