import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getProfile, updateProfile, profileKeys } from '@/services/profiles'

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current,
    queryFn: getProfile,
    staleTime: 10 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.current })
    },
  })
}
