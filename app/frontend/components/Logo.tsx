import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle cx="256" cy="256" r="240" fill="url(#logoGradient)" />
        <rect x="120" y="280" width="60" height="100" rx="8" fill="white" opacity="0.9" />
        <rect x="200" y="220" width="60" height="160" rx="8" fill="white" opacity="0.9" />
        <rect x="280" y="160" width="60" height="220" rx="8" fill="white" opacity="0.9" />
        <path
          d="M380 140 L380 260 M380 140 L340 180 M380 140 L420 180"
          stroke="white"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />
      </svg>

      {showText && (
        <span className={`font-bold text-foreground ${textSizeClasses[size]}`}>
          Quantic
        </span>
      )}
    </div>
  )
}

export default Logo
