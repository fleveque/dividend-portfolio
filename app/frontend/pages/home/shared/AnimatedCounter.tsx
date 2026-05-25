import { useCountUp } from '../../../hooks/useCountUp'

interface Props {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
}

// Counts up from 0 → value when scrolled into view. Honors
// `prefers-reduced-motion` (jumps straight to the value).
export function AnimatedCounter({ value, duration, format, className }: Props) {
  const [current, ref] = useCountUp(value, duration)
  const display = format ? format(current) : current.toLocaleString()

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {display}
    </span>
  )
}

export default AnimatedCounter
