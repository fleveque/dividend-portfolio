import { useQuery } from '@tanstack/react-query'
import { radarApi, stocksApi } from '../lib/api'

/**
 * Fetch AI-generated insights for the user's radar portfolio.
 * Only fetches when explicitly enabled (e.g., when the section is expanded).
 */
export function useRadarInsights(enabled: boolean) {
  return useQuery({
    queryKey: ['radar', 'insights'],
    queryFn: radarApi.getInsights,
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

/**
 * Fetch AI-generated summary for a single stock.
 * Only fetches when stockId is provided (lazy-loaded on demand).
 */
export function useStockAiSummary(stockId: number | null) {
  return useQuery({
    queryKey: ['stock', 'ai_summary', stockId],
    queryFn: () => stocksApi.getAiSummary(stockId!),
    enabled: stockId !== null,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
