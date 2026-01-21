import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { CreateClimbInput } from '@/lib/validation'
import { createClimb, deleteClimb, getClimbs, updateClimb, climbsKeys } from '@/services/climbs'
import type { TagExtractionErrorType } from '@/services/tagExtraction'

export function useClimbs() {
  return useQuery({
    queryKey: climbsKeys.list(),
    queryFn: getClimbs,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateClimb() {
  const queryClient = useQueryClient()
  const [extractionError, setExtractionError] = useState<TagExtractionErrorType | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: (data: CreateClimbInput) => createClimb(data, setExtractionError),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
    onMutate: () => {
      // Clear stale extraction error when mutation starts
      setExtractionError(undefined)
    },
  })

  return {
    ...mutation,
    extractionError,
  }
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
