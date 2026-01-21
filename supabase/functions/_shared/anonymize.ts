// PII Anonymization Utilities for AI Tag Extraction
// Removes or masks personal identifiable information before sending to external AI services

/**
 * Anonymize user notes by removing PII and specific location names
 * @param notes - User's climb notes (optional, can be null or empty)
 * @returns Anonymized notes with PII removed
 */
export function anonymizeNotes(notes: string | null | undefined): string {
  if (!notes || notes.trim().length === 0) {
    return notes ?? ''
  }

  let anonymized = notes

  // Replace specific gym names with generic term "indoor_gym"
  const gymNames = [
    /Rock ?City/i,
    /Planet Granite/i,
    /Touchstone/i,
    /Ironworks/i,
    /Climb X/i,
    /The Cave/i,
    /Metro Rock/i,
    /Brooklyn Boulders/i,
    /Movement/i,
    /Earth Treks/i,
    /Sender One/i,
    /Stone Gardens/i,
    /The Circuit/i,
  ]

  for (const pattern of gymNames) {
    anonymized = anonymized.replace(pattern, 'indoor_gym')
  }

  // Replace specific crag names with generic term "outdoor_crags"
  const cragNames = [
    /Red Rocks/i,
    /Yosemite/i,
    /Joshua Tree/i,
    /Smith Rock/i,
    /Red River Gorge/i,
    /Frankenjura/i,
    /Fontainebleau/i,
    /Joe's Valley/i,
    /Bishop/i,
    /Hueco Tanks/i,
    /Squamish/i,
    /Rocklands/i,
  ]

  for (const pattern of cragNames) {
    anonymized = anonymized.replace(pattern, 'outdoor_crags')
  }

  // Remove email addresses and replace with placeholder
  anonymized = anonymized.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    '[EMAIL_REMOVED]'
  )

  // Remove phone numbers (various formats) and replace with placeholder
  anonymized = anonymized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REMOVED]')

  // Remove social security numbers (9-digit numbers with possible dashes)
  anonymized = anonymized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REMOVED]')

  // Remove URLs
  anonymized = anonymized.replace(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi, '[URL_REMOVED]')

  // Remove IP addresses
  anonymized = anonymized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_REMOVED]')

  return anonymized
}
