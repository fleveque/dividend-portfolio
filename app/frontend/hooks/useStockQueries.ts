/**
 * useStockQueries - React Query hooks for stock data
 *
 * Phase 10: React Query Integration
 * =================================
 *
 * These hooks replace the manual fetch + useState + useEffect pattern
 * with React Query's useQuery, which provides:
 *
 * - Automatic caching (navigate away and back = instant data)
 * - Background refetching when data becomes stale
 * - Deduplication (multiple components share the same query)
 * - Retry on failure
 * - Loading and error states built-in
 *
 * Query Keys:
 * Each query has a unique key that identifies the cached data.
 * ['stocks', 'lastAdded'] - cache key for last added stocks
 * ['stocks', 'search', query] - cache key for search results (per query)
 */

import { useQuery } from '@tanstack/react-query'
import { stocksApi } from '../lib/api'

/**
 * Fetch the most recently added stocks
 *
 * Usage:
 *   const { data, isLoading, error } = useLastAddedStocks()
 */
export function useLastAddedStocks() {
  return useQuery({
    queryKey: ['stocks', 'lastAdded'],
    queryFn: stocksApi.getLastAdded,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  })
}

/**
 * Fetch the most popular stocks (most added to radars)
 *
 * Usage:
 *   const { data, isLoading, error } = useMostAddedStocks()
 */
export function useMostAddedStocks() {
  return useQuery({
    queryKey: ['stocks', 'mostAdded'],
    queryFn: stocksApi.getMostAdded,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  })
}

/**
 * Fetch the top-scored dividend stocks
 *
 * Usage:
 *   const { data, isLoading, error } = useTopScoredStocks()
 */
export function useTopScoredStocks() {
  return useQuery({
    queryKey: ['stocks', 'topScored'],
    queryFn: stocksApi.getTopScored,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  })
}

/**
 * Search for stocks by symbol
 *
 * The `enabled` option prevents the query from running when query is empty.
 * This is a common pattern for search inputs.
 *
 * Usage:
 *   const { data, isLoading, error } = useStockSearch('AAPL')
 */
export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ['stocks', 'search', query],
    queryFn: () => stocksApi.search(query),
    enabled: query.length > 0, // Only run when query is not empty
    staleTime: 1000 * 60 * 2, // Search results fresh for 2 minutes
  })
}
