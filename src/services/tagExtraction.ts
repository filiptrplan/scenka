import { DAILY_TAG_LIMIT, TAG_EXTRACTION_TIMEOUT_MS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { Climb } from '@/types'

/**
 * Error type for tag extraction failures.
 * Used by UI to display appropriate user feedback messages.
 */
export type TagExtractionErrorType = 'quota_exceeded' | 'api_error' | 'network_error' | 'unknown'

/**
 * Result from tag extraction trigger.
 * Service layer returns error type, UI handles toast display.
 */
export interface TagExtractionResult {
  success: boolean
  errorType?: TagExtractionErrorType
}

/**
 * Triggers asynchronous AI tag extraction for a newly saved climb.
 *
 * This function calls the Edge Function which:
 * 1. Validates the user's daily quota (50 climbs/day)
 * 2. Anonymizes the notes (removes PII, gym/crag names)
 * 3. Calls OpenRouter API to extract style tags and failure reasons
 * 4. Updates the climb with extracted tags in the background
 *
 * IMPORTANT: This function is non-blocking and fire-and-forget.
 * - It does NOT await the Edge Function response
 * - Errors are caught and logged but never thrown
 * - Climb save flow continues regardless of extraction success/failure
 *
 * @param climb - The climb object (must have id and notes)
 * @param userId - The authenticated user ID
 *
 * @returns Promise<TagExtractionResult> - Result object with success flag and optional error type
 */
export async function triggerTagExtraction(climb: Climb, userId: string): Promise<TagExtractionResult> {
  if (!supabase) {
    console.error('Cannot trigger tag extraction: Supabase client not configured')
    return { success: false, errorType: 'unknown' }
  }

  // Validate climb has required fields
  if (!climb.id) {
    console.error('Cannot trigger tag extraction: climb.id is missing')
    return { success: false, errorType: 'unknown' }
  }

  if (climb.notes === null || climb.notes.trim().length === 0) {
    // Skip extraction for climbs without notes
    return { success: true }
  }

  try {
    // Call Edge Function with timeout
    const { data, error } = await Promise.race([
      supabase.functions.invoke('openrouter-tag-extract', {
        body: {
          climb_id: climb.id,
          notes: climb.notes,
          user_id: userId,
        },
      }),
      new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Tag extraction timeout after ${TAG_EXTRACTION_TIMEOUT_MS}ms`)),
          TAG_EXTRACTION_TIMEOUT_MS,
        ),
      ),
    ])

    if (error !== null && error !== undefined) {
      // Handle specific error cases
      const errorMessage = String(error)
      if (errorMessage.includes('403')) {
        console.error(`Unauthorized tag extraction request for climb ${climb.id}`)
        return { success: false, errorType: 'api_error' }
      }
      if (errorMessage.includes('429')) {
        console.error(`Quota exceeded for user ${userId} (limit: ${DAILY_TAG_LIMIT}/day)`)
        return { success: false, errorType: 'quota_exceeded' }
      }
      if (errorMessage.includes('timeout')) {
        console.error(`Tag extraction timeout for climb ${climb.id}: ${errorMessage}`)
        return { success: false, errorType: 'network_error' }
      }
      if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        console.error(`Network error triggering extraction for climb ${climb.id}: ${errorMessage}`)
        return { success: false, errorType: 'network_error' }
      }

      console.error(`Tag extraction error for climb ${climb.id}:`, error)
      return { success: false, errorType: 'api_error' }
    }

    if (data !== null && data !== undefined) {
      console.warn(`Tag extraction triggered successfully for climb ${climb.id}:`, data)
      return { success: true }
    }

    return { success: true }
  } catch (err) {
    // Catch-all error handler - extraction failure should never break climb save
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Failed to trigger tag extraction for climb ${climb.id}:`, errorMessage)

    // Determine error type based on message
    if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
      return { success: false, errorType: 'network_error' }
    }

    return { success: false, errorType: 'unknown' }
  }
}
