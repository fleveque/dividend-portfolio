/**
 * StockLogo - Component to display stock logos from Brandfetch API
 *
 * Uses Brandfetch Logo API to fetch real company logos based on stock ticker.
 * Falls back to colored initials when:
 * - VITE_BRANDFETCH_CLIENT_ID is not configured
 * - Image fails to load (unknown ticker, network error)
 */

import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface StockLogoProps {
  symbol: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const imageSizes = {
  sm: 32,
  md: 40,
  lg: 48,
}

/**
 * Generate a consistent color based on the stock symbol
 * Uses a simple hash to pick from a set of colors
 */
function getSymbolColor(symbol: string): string {
  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-amber-500',
  ]

  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Get initials from symbol (first 2 characters)
 */
function getInitials(symbol: string): string {
  return symbol.slice(0, 2).toUpperCase()
}

/**
 * Build Brandfetch logo URL for a stock ticker
 */
function getBrandfetchUrl(symbol: string, clientId: string, theme: 'light' | 'dark', size: number): string {
  const params = new URLSearchParams({
    c: clientId,
    theme: theme,
    fallback: 'lettermark',
  })
  // Request 2x size for retina displays
  params.set('w', String(size * 2))
  params.set('h', String(size * 2))

  return `https://cdn.brandfetch.io/ticker/${symbol.toUpperCase()}?${params.toString()}`
}

/**
 * Colored initials fallback component
 */
function InitialsFallback({ symbol, colorClass }: { symbol: string; colorClass: string }) {
  const initials = getInitials(symbol)
  return (
    <div
      className={`w-full h-full ${colorClass} flex items-center justify-center text-white font-bold rounded-lg shadow-sm`}
    >
      {initials}
    </div>
  )
}

/**
 * Loading skeleton while image loads
 */
function LoadingSkeleton() {
  return (
    <div className="w-full h-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
  )
}

export function StockLogo({ symbol, name, size = 'md', className = '' }: StockLogoProps) {
  const { resolvedTheme } = useTheme()
  const colorClass = getSymbolColor(symbol)
  const clientId = import.meta.env.VITE_BRANDFETCH_CLIENT_ID

  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // If no client ID configured, show initials immediately
  const useFallback = !clientId || clientId === 'your_brandfetch_client_id_here' || clientId === 'your_brandfetch_client_id'

  const handleLoad = () => {
    setImageStatus('loaded')
  }

  const handleError = () => {
    setImageStatus('error')
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0 ${className}`}
      title={name || symbol}
    >
      {useFallback ? (
        <InitialsFallback symbol={symbol} colorClass={colorClass} />
      ) : (
        <>
          {imageStatus === 'loading' && <LoadingSkeleton />}
          {imageStatus === 'error' && <InitialsFallback symbol={symbol} colorClass={colorClass} />}
          <img
            src={getBrandfetchUrl(symbol, clientId, resolvedTheme, imageSizes[size])}
            alt={`${name || symbol} logo`}
            className={`w-full h-full object-contain rounded-lg ${imageStatus === 'loaded' ? '' : 'hidden'}`}
            onLoad={handleLoad}
            onError={handleError}
          />
        </>
      )}
    </div>
  )
}

export default StockLogo
