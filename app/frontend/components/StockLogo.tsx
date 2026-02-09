/**
 * StockLogo - Component to display stock logos from the self-hosted logo service
 *
 * Uses our logo-service (logos.quantic.es) to fetch company logos by ticker symbol.
 * Falls back to colored initials when:
 * - VITE_LOGO_SERVICE_URL or VITE_LOGO_SERVICE_API_KEY is not configured
 * - Image fails to load (unknown ticker, network error)
 */

import { useState } from 'react'

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

// Map component sizes to logo-service size params
const logoServiceSizes: Record<string, string> = {
  sm: 's',  // 32px
  md: 'm',  // 64px
  lg: 'l',  // 128px
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
 * Build logo-service URL for a stock ticker.
 * The API key is passed as a query param so it works in <img src> tags.
 */
function getLogoServiceUrl(symbol: string, serviceUrl: string, apiKey: string, size: string): string {
  return `${serviceUrl}/api/v1/logos/${symbol.toUpperCase()}?size=${size}&api_key=${apiKey}`
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
  const colorClass = getSymbolColor(symbol)
  const serviceUrl = import.meta.env.VITE_LOGO_SERVICE_URL
  const apiKey = import.meta.env.VITE_LOGO_SERVICE_API_KEY

  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // If no service URL or API key configured, show initials immediately
  const useFallback = !serviceUrl || !apiKey

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
            src={getLogoServiceUrl(symbol, serviceUrl, apiKey, logoServiceSizes[size])}
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
