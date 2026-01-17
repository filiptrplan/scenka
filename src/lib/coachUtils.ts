import type { Climb, AnonymizedClimb } from '@/types'

/**
 * Anonymizes climb data before sending to external LLM API.
 * Removes PII, specific locations, and user identifiers.
 */
export function anonymizeClimbsForAI(climbs: Climb[]): AnonymizedClimb[] {
  return climbs.map((climb): AnonymizedClimb => ({
    location: sanitizeLocation(climb.location),
    grade_scale: climb.grade_scale,
    grade_value: climb.grade_value,
    climb_type: climb.climb_type,
    style: climb.style,
    outcome: climb.outcome,
    awkwardness: climb.awkwardness,
    failure_reasons: climb.failure_reasons,
  }))
}

/**
 * Converts specific location names to generic location types.
 * Example: "Metro Rock Gym" -> "indoor_gym"
 * Example: "Red River Gorge" -> "outdoor_crags"
 */
function sanitizeLocation(location: string): string {
  const lowerLocation = location.toLowerCase()

  if (
    lowerLocation.includes('gym') ||
    lowerLocation.includes('climbing wall') ||
    lowerLocation.includes('studio') ||
    lowerLocation.includes('center') ||
    lowerLocation.includes('facility')
  ) {
    return 'indoor_gym'
  }

  if (
    lowerLocation.includes('crag') ||
    lowerLocation.includes('boulder') ||
    lowerLocation.includes('cliff') ||
    lowerLocation.includes('wall') ||
    lowerLocation.includes('gorge')
  ) {
    return 'outdoor_crags'
  }

  return 'climbing_location'
}

/**
 * Validates that anonymized data contains no PII.
 * Returns list of detected PII fields if any found.
 *
 * Checks for:
 * - Long name-like fields (> 20 chars)
 * - Email addresses
 * - Phone numbers (10+ consecutive digits)
 * - Specific place names (capitalized multi-word locations)
 */
export function validateAnonymizedData(data: unknown): string[] {
  const piiFields: string[] = []

  const checkForPII = (obj: unknown, path = ''): void => {
    if (typeof obj !== 'object' || obj === null) {
      return
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key

      // Check for common PII indicators
      if (typeof value === 'string') {
        // Long name-like field
        if (key.toLowerCase().includes('name') && value.length > 20) {
          piiFields.push(currentPath)
        }

        // Email addresses
        if (key.toLowerCase().includes('email') && value.includes('@')) {
          piiFields.push(currentPath)
        }

        // Phone numbers (10+ consecutive digits)
        if (key.toLowerCase().includes('phone') && /\d{10}/.test(value)) {
          piiFields.push(currentPath)
        }

        // Specific place names (capitalized multi-word locations)
        if (
          currentPath.includes('location') &&
          /^[A-Z][a-z]+(?: [A-Z][a-z]+){2,}$/.test(value)
        ) {
          piiFields.push(currentPath) // Likely a specific place name like "Red River Gorge"
        }

        // User IDs (UUID patterns)
        if (
          key.toLowerCase().includes('user') &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
        ) {
          piiFields.push(currentPath)
        }
      }

      if (typeof value === 'object' && value !== null) {
        checkForPII(value, currentPath)
      }
    }
  }

  checkForPII(data)
  return piiFields
}
