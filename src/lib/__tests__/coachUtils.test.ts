import { describe, it, expect } from 'vitest'

import { anonymizeClimbsForAI, validateAnonymizedData } from '../coachUtils'

import type { Climb } from '@/types'

describe('coachUtils', () => {
  describe('anonymizeClimbsForAI', () => {
    it('should sanitize gym locations to indoor_gym', () => {
      const mockClimbs: Climb[] = [
        {
          id: 'abc-123',
          user_id: 'user-456',
          location: 'Metro Rock Gym',
          grade_scale: 'v_scale',
          grade_value: 'V4',
          climb_type: 'boulder',
          style: ['Overhang', 'Crimp'],
          outcome: 'Fail',
          awkwardness: 3,
          failure_reasons: ['Pumped', 'Bad Feet'],
          created_at: '2024-01-01',
          notes: 'My project',
          hold_color: 'red',
          redemption_at: null,
        },
      ]

      const result = anonymizeClimbsForAI(mockClimbs)

      expect(result[0]?.location).toBe('indoor_gym')
    })

    it('should sanitize outdoor crags to outdoor_crags', () => {
      const mockClimbs: Climb[] = [
        {
          id: 'abc-123',
          user_id: 'user-456',
          location: 'Red River Gorge',
          grade_scale: 'v_scale',
          grade_value: 'V4',
          climb_type: 'boulder',
          style: ['Overhang', 'Crimp'],
          outcome: 'Fail',
          awkwardness: 3,
          failure_reasons: ['Pumped', 'Bad Feet'],
          created_at: '2024-01-01',
          notes: 'My project',
          hold_color: 'red',
          redemption_at: null,
        },
      ]

      const result = anonymizeClimbsForAI(mockClimbs)

      expect(result[0]?.location).toBe('outdoor_crags')
    })

    it('should remove PII fields from output', () => {
      const mockClimbs: Climb[] = [
        {
          id: 'abc-123',
          user_id: 'user-456',
          location: 'Local Gym',
          grade_scale: 'v_scale',
          grade_value: 'V4',
          climb_type: 'boulder',
          style: ['Overhang'],
          outcome: 'Fail',
          awkwardness: 3,
          failure_reasons: ['Pumped'],
          created_at: '2024-01-01',
          notes: 'My project',
          hold_color: 'red',
          redemption_at: null,
        },
      ]

      const result = anonymizeClimbsForAI(mockClimbs)

      expect(result[0]).not.toHaveProperty('id')
      expect(result[0]).not.toHaveProperty('user_id')
      expect(result[0]).not.toHaveProperty('notes')
      expect(result[0]).not.toHaveProperty('created_at')
    })
  })

  describe('validateAnonymizedData', () => {
    it('should detect email addresses', () => {
      const data = {
        email: 'test@example.com',
        location: 'Gym',
      }

      const result = validateAnonymizedData(data)

      expect(result).toContain('email')
    })

    it('should detect phone numbers', () => {
      const data = {
        phone: '1234567890',
        location: 'Gym',
      }

      const result = validateAnonymizedData(data)

      expect(result).toContain('phone')
    })

    it('should detect user IDs with UUID pattern', () => {
      const data = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        location: 'Gym',
      }

      const result = validateAnonymizedData(data)

      expect(result).toContain('user_id')
    })

    it('should detect long name-like strings', () => {
      const data = {
        name: 'This Is A Very Long Name That Exceeds Twenty Characters',
        location: 'Gym',
      }

      const result = validateAnonymizedData(data)

      expect(result).toContain('name')
    })

    it('should detect specific place names', () => {
      const data = {
        location: 'Red River Gorge',
      }

      const result = validateAnonymizedData(data)

      expect(result).toContain('location')
    })

    it('should return empty array for clean data', () => {
      const cleanData = {
        location: 'indoor_gym',
        grade_scale: 'v_scale',
        grade_value: 'V4',
        outcome: 'Fail',
      }

      const result = validateAnonymizedData(cleanData)

      expect(result).toEqual([])
    })
  })
})
