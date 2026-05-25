// Centralized motion variants so every animated section in the app
// speaks the same language. Import `fadeUp`, `staggerChildren`, `liftOnHover`
// rather than redefining inline — keeps the motion coherent without a
// design system.
//
// Use with `motion`'s `<LazyMotion features={domAnimation}>` wrapper
// (mounted in HomeMotion) so we only pay ~18kb gz for the dom-animation
// feature set.

import type { Variants, Transition } from 'motion/react'

const EASE_OUT: Transition['ease'] = [0.25, 0.1, 0.25, 1]

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT }
  }
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } }
}

// Parent variant for staggering children — set `transition.staggerChildren`
// to control how fast the cascade runs.
export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
}

// Subtle hover lift used on cards and CTAs.
export const liftOnHover = {
  whileHover: { y: -2, transition: { duration: 0.2, ease: EASE_OUT } }
}

// Shared viewport options for `whileInView` triggers — only animate once,
// trigger when the element is ~15% on screen.
export const onceInView = {
  once: true,
  amount: 0.15
} as const
