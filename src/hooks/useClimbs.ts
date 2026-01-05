import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateClimbInput } from '@/lib/validation'
import { createClimb, deleteClimb, getClimbs, updateClimb, climbsKeys } from '@/services/climbs'

export function useClimbs() {
  return useQuery({
    queryKey: climbsKeys.list(),
    queryFn: getClimbs,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateClimb() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClimb,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
  })
}

export function useUpdateClimb() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateClimbInput> }) =>
      updateClimb(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
  })
}

export function useDeleteClimb() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClimb,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
  })
}
