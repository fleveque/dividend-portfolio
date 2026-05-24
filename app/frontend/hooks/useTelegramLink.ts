import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { telegramLinkApi } from '../lib/api'
import { useDemoGuardedMutation } from './useDemoGuardedMutation'

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

// Toggle the daily-digest notifications flag. Demo-guarded because in demo
// mode the link is fake and we don't want to attempt a write.
export function useUpdateTelegramNotifications() {
  const queryClient = useQueryClient()
  return useDemoGuardedMutation('updateProfile', {
    mutationFn: (notificationsEnabled: boolean) =>
      telegramLinkApi.update({ notificationsEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['telegramLink'] }),
  })
}
