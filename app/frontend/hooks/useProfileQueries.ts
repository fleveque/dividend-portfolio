import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../lib/api'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (portfolioSlug: string | null) => profileApi.update(portfolioSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })
}
