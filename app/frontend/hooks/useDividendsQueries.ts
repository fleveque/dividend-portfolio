import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  dividendsApi,
  type DividendCreatePayload,
  type DividendUpdatePayload,
  type DividendImportRow,
} from '../lib/api'
import { useDemoGuardedMutation } from './useDemoGuardedMutation'

const KEY = ['dividends'] as const

export function useDividends() {
  return useQuery({
    queryKey: KEY,
    queryFn: dividendsApi.list,
    staleTime: 1000 * 30,
  })
}

export function useDividendChartData(range?: 'full') {
  return useQuery({
    queryKey: [ ...KEY, 'chart', range ?? 'default' ],
    queryFn: () => dividendsApi.chartData(range),
    staleTime: 1000 * 60,
  })
}

export function useCreateDividend() {
  const qc = useQueryClient()
  return useDemoGuardedMutation('addDividend', {
    mutationFn: (payload: DividendCreatePayload) => dividendsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateDividend() {
  const qc = useQueryClient()
  return useDemoGuardedMutation('editDividend', {
    mutationFn: ({ id, payload }: { id: number; payload: DividendUpdatePayload }) =>
      dividendsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteDividend() {
  const qc = useQueryClient()
  return useDemoGuardedMutation('deleteDividend', {
    mutationFn: (id: number) => dividendsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDividendImportPreview() {
  return useDemoGuardedMutation('importDividends', {
    mutationFn: (file: File) => dividendsApi.importPreview(file),
  })
}

export function useDividendImportApply() {
  const qc = useQueryClient()
  return useDemoGuardedMutation('importDividends', {
    mutationFn: ({ rows, mapping, source }: { rows: DividendImportRow[]; mapping: Record<string, number>; source?: string }) =>
      dividendsApi.importApply(rows, mapping, source),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
