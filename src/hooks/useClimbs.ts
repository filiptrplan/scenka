import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import type { CreateClimbInput } from '@/lib/validation'
import { createClimb, deleteClimb, getClimbs, updateClimb, climbsKeys } from '@/services/climbs'
import type { TagExtractionErrorType, TagExtractionResult } from '@/services/tagExtraction'
import type { Climb } from '@/types'

export function useClimbs() {
  return useQuery({
    queryKey: climbsKeys.list(),
    queryFn: getClimbs,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateClimb() {
  const queryClient = useQueryClient()
  const [extractionError, setExtractionError] = useState<TagExtractionErrorType | undefined>(
    undefined
  )
  const lastCreatedClimbIdRef = useRef<string | null>(null)

  const mutation = useMutation({
    mutationFn: (data: CreateClimbInput) => createClimb(data, handleExtractionResult),
    onSuccess: (climb: Climb) => {
      // Store the created climb ID for cache update when tags arrive
      lastCreatedClimbIdRef.current = climb.id

      // Optimistically update cache without invalidating queries
      // This avoids flicker from full refetch
      queryClient.setQueryData(climbsKeys.list(), (oldData: Climb[] | undefined) => {
        return oldData ? [climb, ...oldData] : [climb]
      })
    },
    onMutate: () => {
      // Clear stale extraction error when mutation starts
      setExtractionError(undefined)
      lastCreatedClimbIdRef.current = null
    },
  })

  // Handle tag extraction result and update cache optimistically
  const handleExtractionResult = (result: TagExtractionResult) => {
    // Handle error types via the extraction error state
    if (result.errorType && result.errorType !== 'quota_exceeded') {
      setExtractionError(result.errorType)
    }

    // If tags were extracted, update the cache with new tags
    if (result.success && (result.style || result.failure_reasons)) {
      const climbId = lastCreatedClimbIdRef.current
      if (!climbId) return

      queryClient.setQueryData(climbsKeys.list(), (oldData: Climb[] | undefined) => {
        console.log('Setting...')
        if (!oldData) return oldData

        return oldData.map((climb) => {
          if (climb.id === climbId) {
            // Merge AI tags with existing tags (deduplicate)
            const mergedStyles = result.style
              ? [...new Set([...(climb.style || []), ...result.style])]
              : climb.style

            const mergedFailureReasons = result.failure_reasons
              ? [...new Set([...(climb.failure_reasons || []), ...result.failure_reasons])]
              : climb.failure_reasons

            return {
              ...climb,
              style: mergedStyles,
              failure_reasons: mergedFailureReasons,
              tags_extracted_at: new Date().toISOString(),
            }
          }
          return climb
        })
      })
    }
  }

  return {
    ...mutation,
    extractionError,
    handleExtractionResult, // Expose for createClimb to call
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
