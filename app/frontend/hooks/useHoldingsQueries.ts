import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { holdingsApi } from '../lib/api'
import { useDemoGuardedMutation } from './useDemoGuardedMutation'
import type { CurrencyTotals, Holding, HoldingsResponse } from '../types'

// Recompute per-currency totals after an optimistic delete. The portfolio can
// hold multiple currencies, so totals live in a map keyed by ISO 4217 code.
function recomputeTotals(holdings: Holding[]): Record<string, CurrencyTotals> {
  const totals: Record<string, { value: number; cost: number }> = {}
  for (const h of holdings) {
    const code = h.stock.currency
    totals[code] ??= { value: 0, cost: 0 }
    totals[code].value += h.marketValue
    totals[code].cost += h.averagePrice * h.quantity
  }
  const result: Record<string, CurrencyTotals> = {}
  for (const [code, { value, cost }] of Object.entries(totals)) {
    const gainLoss = value - cost
    result[code] = {
      value,
      cost,
      gainLoss,
      gainLossPercent: cost > 0 ? (gainLoss / cost) * 100 : 0,
    }
  }
  return result
}

export function useHoldings() {
  return useQuery({
    queryKey: ['holdings'],
    queryFn: holdingsApi.getAll,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateHolding() {
  const queryClient = useQueryClient()

  return useDemoGuardedMutation('addHolding', {
    mutationFn: ({ stockId, quantity, averagePrice }: { stockId: number; quantity: number; averagePrice: number }) =>
      holdingsApi.create(stockId, quantity, averagePrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
    },
  })
}

export function useUpdateHolding() {
  const queryClient = useQueryClient()

  return useDemoGuardedMutation('updateHolding', {
    mutationFn: ({ id, quantity, averagePrice }: { id: number; quantity: number; averagePrice: number }) =>
      holdingsApi.update(id, quantity, averagePrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
    },
  })
}

export function useDeleteHolding() {
  const queryClient = useQueryClient()

  return useDemoGuardedMutation('deleteHolding', {
    mutationFn: (id: number) => holdingsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['holdings'] })
      const previous = queryClient.getQueryData<HoldingsResponse>(['holdings'])
      if (previous) {
        const filtered = previous.holdings.filter((h) => h.id !== id)
        queryClient.setQueryData<HoldingsResponse>(['holdings'], {
          ...previous,
          holdings: filtered,
          totalsByCurrency: recomputeTotals(filtered),
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
