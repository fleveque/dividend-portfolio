import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { radarApi, stocksApi, holdingsApi } from '../lib/api'

/**
 * Fetch AI-generated insights for the user's radar portfolio.
 * Only fetches when explicitly enabled (e.g., when the section is expanded).
 */
export function useRadarInsights(enabled: boolean) {
  const { i18n } = useTranslation()
  const locale = i18n.language?.startsWith('es') ? 'es' : 'en'

  return useQuery({
    queryKey: ['radar', 'insights', locale],
    queryFn: () => radarApi.getInsights(locale),
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

/**
 * Fetch AI-generated insights for the user's portfolio.
 * Only fetches when explicitly enabled (e.g., when the section is expanded).
 */
export function usePortfolioInsights(enabled: boolean) {
  const { i18n } = useTranslation()
  const locale = i18n.language?.startsWith('es') ? 'es' : 'en'

  return useQuery({
    queryKey: ['portfolio', 'insights', locale],
    queryFn: () => holdingsApi.getInsights(locale),
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}

/**
 * Fetch AI-generated summary for a single stock.
 * Only fetches when stockId is provided (lazy-loaded on demand).
 */
export function useStockAiSummary(stockId: number | null) {
  const { i18n } = useTranslation()
  const locale = i18n.language?.startsWith('es') ? 'es' : 'en'

  return useQuery({
    queryKey: ['stock', 'ai_summary', stockId, locale],
    queryFn: () => stocksApi.getAiSummary(stockId!, locale),
    enabled: stockId !== null,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
