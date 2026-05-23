import { useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi, type ProfileUpdate } from '../lib/api'
import { useDemoGuardedMutation } from './useDemoGuardedMutation'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useDemoGuardedMutation('updateProfile', {
    mutationFn: (update: ProfileUpdate) => profileApi.update(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['session'] })
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
      queryClient.invalidateQueries({ queryKey: ['buyPlan'] })
    },
  })
}
