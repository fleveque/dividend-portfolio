// Pulse is the sibling sharing app (pulse.quantic.es). The base URL is
// overridable per environment via VITE_PULSE_URL — defaults to production
// so local dev "just works" without configuration.
const DEFAULT_PULSE_URL = 'https://pulse.quantic.es'

export const PULSE_URL: string =
  (import.meta.env.VITE_PULSE_URL as string | undefined) || DEFAULT_PULSE_URL

export function pulsePortfolioUrl(slug: string): string {
  return `${PULSE_URL}/p/${slug}`
}

// Host-only form for display in the UI (e.g. "pulse.quantic.es/p/foo").
export function pulsePortfolioDisplayUrl(slug: string): string {
  return `${PULSE_URL.replace(/^https?:\/\//, '')}/p/${slug}`
}
