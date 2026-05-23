import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { telegramLinkApi } from '../lib/api'

export function useTelegramLink() {
  return useQuery({
    queryKey: ['telegramLink'],
    queryFn: telegramLinkApi.get,
    staleTime: 1000 * 30,
  })
}

export function useStartTelegramLinking() {
  return useMutation({
    mutationFn: telegramLinkApi.create,
  })
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: telegramLinkApi.destroy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['telegramLink'] }),
  })
}
