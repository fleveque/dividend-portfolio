import { useEffect, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'

interface Props {
  words: string[]
  intervalMs?: number
  className?: string
}

// Cycles a single word (e.g. "dividends" / "yield-on-cost") in place via
// a vertical slide + fade. With `prefers-reduced-motion`, the rotation
// stops on the first word.
export function AnimatedRotator({ words, intervalMs = 3000, className }: Props) {
  const [index, setIndex] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion || words.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % words.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, words.length, reducedMotion])

  return (
    <span className={`relative inline-block align-baseline ${className ?? ''}`}>
      {/* Reserve max-width via a hidden sizing span so the line above
          doesn't reflow as the visible word rotates. */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {words.reduce((longest, w) => (w.length > longest.length ? w : longest), '')}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={words[index]}
          initial={{ y: '0.6em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-0.6em', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 whitespace-nowrap"
        >
          {words[index]}
        </m.span>
      </AnimatePresence>
    </span>
  )
}

export default AnimatedRotator
