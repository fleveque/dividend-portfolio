import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

// Counts up from 0 to `target` over `duration` ms once the returned ref's
// element enters the viewport. Honors `prefers-reduced-motion` by jumping
// straight to the final value.
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLElement | null>(null)
  const startedRef = useRef(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setValue(target)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true
            const startedAt = performance.now()
            let raf = 0
            const tick = (now: number) => {
              const progress = Math.min(1, (now - startedAt) / duration)
              // Ease-out cubic for a natural deceleration.
              const eased = 1 - Math.pow(1 - progress, 3)
              setValue(Math.round(target * eased))
              if (progress < 1) raf = requestAnimationFrame(tick)
            }
            raf = requestAnimationFrame(tick)
            observer.disconnect()
            return () => cancelAnimationFrame(raf)
          }
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, reducedMotion])

  return [value, ref] as const
}
