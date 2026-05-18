import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type GenerateContentDraftParams } from '../lib/api'

const KEY = ['admin', 'contentDrafts'] as const

export function useAdminContentDrafts() {
  return useQuery({
    queryKey: KEY,
    queryFn: adminApi.contentDrafts.list,
    staleTime: 1000 * 30,
  })
}

export function useGenerateContentDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: GenerateContentDraftParams) => adminApi.contentDrafts.generate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useMarkContentDraftCopied() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, copied }: { id: number; copied: boolean }) =>
      adminApi.contentDrafts.markCopied(id, copied),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useDiscardContentDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.contentDrafts.discard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}
