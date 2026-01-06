import { describe, it, expect } from 'vitest'
import { getAllGradeBuckets, getDifficultyBucket, normalizeGrade } from './grades'

describe('normalizeGrade', () => {
  describe('Font grades', () => {
    it('normalizes lowest Font grade (3)', () => {
      const result = normalizeGrade('font', '3')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(10)
    })

    it('normalizes mid Font grade (6a)', () => {
      const result = normalizeGrade('font', '6a')
      expect(result).toBeGreaterThan(20)
      expect(result).toBeLessThan(50)
    })

    it('normalizes highest Font grade (9c)', () => {
      const result = normalizeGrade('font', '9c')
      expect(result).toBe(100)
    })
  })

  describe('V-Scale grades', () => {
    it('normalizes lowest V-Scale grade (VB)', () => {
      const result = normalizeGrade('v_scale', 'VB')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(10)
    })

    it('normalizes mid V-Scale grade (V5)', () => {
      const result = normalizeGrade('v_scale', 'V5')
      expect(result).toBeGreaterThan(25)
      expect(result).toBeLessThan(50)
    })

    it('normalizes highest V-Scale grade (V17)', () => {
      const result = normalizeGrade('v_scale', 'V17')
      expect(result).toBe(100)
    })
  })

  describe('Color Circuit grades', () => {
    it('normalizes lowest Color Circuit grade (Teal)', () => {
      const result = normalizeGrade('color_circuit', 'Teal')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(20)
    })

    it('normalizes mid Color Circuit grade (Blue)', () => {
      const result = normalizeGrade('color_circuit', 'Blue')
      expect(result).toBeGreaterThan(50)
      expect(result).toBeLessThan(65)
    })

    it('normalizes highest Color Circuit grade (Black)', () => {
      const result = normalizeGrade('color_circuit', 'Black')
      expect(result).toBe(100)
    })
  })

  describe('Invalid grades', () => {
    it('handles invalid Font grade', () => {
      const result = normalizeGrade('font', 'invalid')
      expect(result).toBe(0)
    })

    it('handles invalid V-Scale grade', () => {
      const result = normalizeGrade('v_scale', '')
      expect(result).toBe(0)
    })

    it('handles invalid Color Circuit grade', () => {
      const result = normalizeGrade('color_circuit', 'Invalid')
      expect(result).toBe(0)
    })
  })
})

describe('getDifficultyBucket', () => {
  it('returns Unknown for 0', () => {
    expect(getDifficultyBucket(0)).toBe('Unknown')
  })

  it('returns Beginner for grades <= 25', () => {
    expect(getDifficultyBucket(1)).toBe('Beginner')
    expect(getDifficultyBucket(10)).toBe('Beginner')
    expect(getDifficultyBucket(25)).toBe('Beginner')
  })

  it('returns Intermediate for grades 26-50', () => {
    expect(getDifficultyBucket(26)).toBe('Intermediate')
    expect(getDifficultyBucket(40)).toBe('Intermediate')
    expect(getDifficultyBucket(50)).toBe('Intermediate')
  })

  it('returns Advanced for grades 51-75', () => {
    expect(getDifficultyBucket(51)).toBe('Advanced')
    expect(getDifficultyBucket(60)).toBe('Advanced')
    expect(getDifficultyBucket(75)).toBe('Advanced')
  })

  it('returns Elite for grades > 75', () => {
    expect(getDifficultyBucket(76)).toBe('Elite')
    expect(getDifficultyBucket(90)).toBe('Elite')
    expect(getDifficultyBucket(100)).toBe('Elite')
  })
})

describe('getAllGradeBuckets', () => {
  it('returns all buckets in correct order', () => {
    const buckets = getAllGradeBuckets()
    expect(buckets).toEqual(['Beginner', 'Intermediate', 'Advanced', 'Elite'])
  })
})
