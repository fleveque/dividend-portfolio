import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { holdingsApi } from '../lib/api'
import type { HoldingsResponse } from '../types'

export function useHoldings() {
  return useQuery({
    queryKey: ['holdings'],
    queryFn: holdingsApi.getAll,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ stockId, quantity, averagePrice }: { stockId: number; quantity: number; averagePrice: number }) =>
      holdingsApi.create(stockId, quantity, averagePrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
    },
  })
}

export function useUpdateHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, quantity, averagePrice }: { id: number; quantity: number; averagePrice: number }) =>
      holdingsApi.update(id, quantity, averagePrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
    },
  })
}

export function useDeleteHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => holdingsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['holdings'] })
      const previous = queryClient.getQueryData<HoldingsResponse>(['holdings'])
      if (previous) {
        const filtered = previous.holdings.filter((h) => h.id !== id)
        const totalValue = filtered.reduce((sum, h) => sum + h.marketValue, 0)
        const totalCost = filtered.reduce((sum, h) => sum + h.averagePrice * h.quantity, 0)
        queryClient.setQueryData<HoldingsResponse>(['holdings'], {
          ...previous,
          holdings: filtered,
          totalValue,
          totalCost,
          totalGainLoss: totalValue - totalCost,
          totalGainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
        })
      }
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['holdings'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
    },
  })
}

export function useImportFromCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: { stock_id: number; quantity: number }[]) =>
      holdingsApi.importFromCart(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
    },
  })
}
