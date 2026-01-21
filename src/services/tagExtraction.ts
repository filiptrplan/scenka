import { DAILY_TAG_LIMIT, TAG_EXTRACTION_TIMEOUT_MS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { Climb } from '@/types'

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
 * @returns Promise<void> - Resolves immediately (fire-and-forget pattern)
 */
export async function triggerTagExtraction(climb: Climb, userId: string): Promise<void> {
  if (!supabase) {
    console.error('Cannot trigger tag extraction: Supabase client not configured')
    return
  }

  // Validate climb has required fields
  if (!climb.id) {
    console.error('Cannot trigger tag extraction: climb.id is missing')
    return
  }

  if (!climb.notes || climb.notes.trim().length === 0) {
    // Skip extraction for climbs without notes
    return
  }

  try {
    console.log(`Triggering tag extraction for climb: ${climb.id}`)

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
      } else if (errorMessage.includes('429')) {
        console.error(`Quota exceeded for user ${userId} (limit: ${DAILY_TAG_LIMIT}/day)`)
        // Plan 04 will add toast notification for quota exceeded
      } else if (errorMessage.includes('timeout')) {
        console.error(`Tag extraction timeout for climb ${climb.id}: ${errorMessage}`)
      } else if (errorMessage.includes('Network')) {
        console.error(`Network error triggering extraction for climb ${climb.id}: ${errorMessage}`)
      } else {
        console.error(`Tag extraction error for climb ${climb.id}:`, error)
      }
    } else if (data !== null && data !== undefined) {
      console.log(`Tag extraction triggered successfully for climb ${climb.id}:`, data)
    }
  } catch (err) {
    // Catch-all error handler - extraction failure should never break climb save
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Failed to trigger tag extraction for climb ${climb.id}:`, errorMessage)
  }
}
