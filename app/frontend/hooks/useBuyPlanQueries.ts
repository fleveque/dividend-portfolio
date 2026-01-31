/**
 * useBuyPlanQueries - React Query hooks for buy plan data and mutations
 *
 * This file contains:
 * - useBuyPlan: Query hook to fetch the user's buy plan
 * - useSaveBuyPlan: Mutation hook to save cart items
 * - useResetBuyPlan: Mutation hook to reset/clear the cart
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { buyPlanApi } from '../lib/api'

/**
 * Fetch the user's buy plan
 *
 * Usage:
 *   const { data, isLoading, error } = useBuyPlan()
 */
export function useBuyPlan() {
  return useQuery({
    queryKey: ['buyPlan'],
    queryFn: buyPlanApi.get,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  })
}

/**
 * Save buy plan items (replaces all existing items)
 *
 * Usage:
 *   const saveBuyPlan = useSaveBuyPlan()
 *   saveBuyPlan.mutate([{ stockId: 1, quantity: 10 }])
 */
export function useSaveBuyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: { stockId: number; quantity: number }[]) =>
      buyPlanApi.save(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyPlan'] })
    },
  })
}

/**
 * Reset (clear) the buy plan
 *
 * Usage:
 *   const resetBuyPlan = useResetBuyPlan()
 *   resetBuyPlan.mutate()
 */
export function useResetBuyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => buyPlanApi.reset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyPlan'] })
    },
  })
}
