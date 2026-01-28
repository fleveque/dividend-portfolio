/**
 * useRadarQueries - React Query hooks for radar data and mutations
 *
 * Phase 10: React Query Integration
 * =================================
 *
 * This file contains:
 * - useRadar: Query hook to fetch the user's radar
 * - useAddStock: Mutation hook to add a stock to radar
 * - useRemoveStock: Mutation hook to remove a stock from radar
 * - useUpdateTargetPrice: Mutation hook to update target price
 *
 * Mutations vs Queries:
 * - useQuery: For reading data (GET requests)
 * - useMutation: For modifying data (POST, PATCH, DELETE)
 *
 * After a mutation succeeds, we invalidate the radar query
 * so it refetches fresh data. This keeps the UI in sync.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { radarApi } from '../lib/api'

/**
 * Fetch the user's radar (watchlist)
 *
 * Usage:
 *   const { data, isLoading, error } = useRadar()
 */
export function useRadar() {
  return useQuery({
    queryKey: ['radar'],
    queryFn: radarApi.get,
    staleTime: 1000 * 60 * 2, // Consider fresh for 2 minutes
  })
}

/**
 * Add a stock to the user's radar
 *
 * After success, invalidates the radar query to refetch.
 *
 * Usage:
 *   const addStock = useAddStock()
 *   addStock.mutate(stockId)
 *   // or with callbacks:
 *   addStock.mutate(stockId, {
 *     onSuccess: () => console.log('Added!'),
 *     onError: (err) => console.error(err)
 *   })
 */
export function useAddStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (stockId: number) => radarApi.addStock(stockId),
    onSuccess: () => {
      // Invalidate radar query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['radar'] })
    },
  })
}

/**
 * Remove a stock from the user's radar
 *
 * Usage:
 *   const removeStock = useRemoveStock()
 *   removeStock.mutate(stockId)
 */
export function useRemoveStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (stockId: number) => radarApi.removeStock(stockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radar'] })
    },
  })
}

/**
 * Update the target price for a stock on the radar
 *
 * Usage:
 *   const updatePrice = useUpdateTargetPrice()
 *   updatePrice.mutate({ stockId: 123, price: 150.00 })
 */
export function useUpdateTargetPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ stockId, price }: { stockId: number; price: number }) =>
      radarApi.updateTargetPrice(stockId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radar'] })
    },
  })
}
