/**
 * Currency formatting helpers.
 *
 * The backend (StockDecorator) emits pre-formatted strings for individual stock
 * fields (e.g. `formattedPrice = "$150.00"`), so most cards already render the
 * right symbol. This module covers the cases where the frontend has to format
 * a raw number itself — portfolio totals, cart subtotals, dividend calendar
 * monthly sums — where the value's currency comes from the surrounding stock.
 *
 * Falls back to a code + space prefix for currencies not in CURRENCY_SYMBOLS,
 * mirroring the Ruby Stock#currency_symbol behaviour so a missing entry never
 * crashes the UI.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF ',
  CAD: 'C$',
  AUD: 'A$',
}

export function currencySymbol(code: string | null | undefined): string {
  if (!code) return '$'
  return CURRENCY_SYMBOLS[code] ?? `${code} `
}

const formatterCache = new Map<string, Intl.NumberFormat>()

/**
 * Format a number with the given currency. Uses Intl.NumberFormat when the
 * currency is a known ISO 4217 code (USD/EUR/GBP/JPY/...); otherwise falls
 * back to a manual "CODE 1,234.56" rendering so unknown codes still display.
 */
export function formatCurrency(
  value: number,
  code: string | null | undefined,
  locale: string = 'en-US',
): string {
  const currency = code || 'USD'
  const cacheKey = `${locale}|${currency}`
  let formatter = formatterCache.get(cacheKey)
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, { style: 'currency', currency })
    } catch {
      // Unknown ISO code → manual fallback
      return `${currencySymbol(code)}${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    formatterCache.set(cacheKey, formatter)
  }
  return formatter.format(value)
}

export type CurrencyOption = { value: string; label: string }

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — Pound Sterling' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
]

export function formatFxRate(rate: number, locale: string = 'en-US'): string {
  return rate.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}
