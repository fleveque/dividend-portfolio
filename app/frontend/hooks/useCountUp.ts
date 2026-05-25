import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

// Counts up to `target` over `duration` ms each time `target` changes,
// but only after the element first enters the viewport. Re-animates
// from the previous value to the new target — so when data loads
// (e.g. holdings.length transitions from 0 → N) the count animates
// to the real value instead of staying at the loading-state zero.
//
// Honors `prefers-reduced-motion` by jumping straight to the target.
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target)
  const ref = useRef<HTMLElement | null>(null)
  const visibleRef = useRef(false)
  const valueRef = useRef(target)
  const reducedMotion = useReducedMotion()

  // Keep a ref-mirror of the latest rendered value so the animation
  // effect can read the starting value without re-running on every tick.
  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Watch visibility once. We re-animate on subsequent target changes
  // even if the element scrolls off — counts staying in sync with data
  // is more important than guaranteeing every animation is witnessed.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (visibleRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleRef.current = true
            // Trigger a re-run of the animation effect by bumping value.
            setValue((v) => v)
            observer.disconnect()
            return
          }
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Animate to the latest target. Runs on every target change *and*
  // once visibility flips true (via the setValue(v=>v) bump above).
  useEffect(() => {
    if (reducedMotion || !visibleRef.current) {
      setValue(target)
      valueRef.current = target
      return
    }

    const startedAt = performance.now()
    const startValue = valueRef.current
    if (startValue === target) return

    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      // Ease-out cubic for natural deceleration.
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(startValue + (target - startValue) * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reducedMotion])

  return [value, ref] as const
}
