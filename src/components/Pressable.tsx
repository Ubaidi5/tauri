import { motion, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'

/** A button with a gentle press-down, like native controls. */
export const Pressable = forwardRef<HTMLButtonElement, HTMLMotionProps<'button'> & { scale?: number }>(
  function Pressable({ scale = 0.96, type = 'button', ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={props.disabled ? undefined : { scale }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        {...props}
      />
    )
  },
)
