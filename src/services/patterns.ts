import { normalizeGrade } from '@/lib/grades'
import { supabase } from '@/lib/supabase'
import type { Climb, PatternAnalysis, AnonymizedClimb } from '@/types'
import { anonymizeClimbsForAI } from '@/lib/coachUtils'

export async function extractPatterns(userId: string): Promise<PatternAnalysis> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { data: climbs, error } = await supabase
    .from('climbs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100) // Last 100 climbs for analysis

  if (error) {
    throw error
  }

  if (!climbs || climbs.length === 0) {
    return getEmptyPatterns()
  }

  return {
    failure_patterns: extractFailurePatterns(climbs),
    style_weaknesses: extractStyleWeaknesses(climbs),
    climbing_frequency: extractClimbingFrequency(climbs),
    recent_successes: extractRecentSuccesses(climbs),
  }
}

export async function extractRecentClimbs(userId: string): Promise<AnonymizedClimb[]> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { data: climbs, error } = await supabase
    .from('climbs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    throw error
  }

  if (!climbs || climbs.length === 0) {
    return []
  }

  return anonymizeClimbsForAI(climbs)
}

function extractFailurePatterns(climbs: Climb[]) {
  const failedClimbs = climbs.filter((c) => c.outcome === 'Fail')
  const reasonCounts = new Map<string, number>()

  failedClimbs.forEach((climb) => {
    climb.failure_reasons.forEach((reason) => {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
    })
  })

  const sorted = Array.from(reasonCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Top 5

  return {
    most_common_failure_reasons: sorted.map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / failedClimbs.length) * 100),
    })),
  }
}

function extractStyleWeaknesses(climbs: Climb[]) {
  const styleStats = new Map<string, { fail_count: number; total_attempts: number }>()

  climbs.forEach((climb) => {
    climb.style.forEach((s) => {
      const current = styleStats.get(s) || { fail_count: 0, total_attempts: 0 }
      current.total_attempts++
      if (climb.outcome === 'Fail') {
        current.fail_count++
      }
      styleStats.set(s, current)
    })
  })

  const sorted = Array.from(styleStats.entries())
    .map(([style, stats]) => ({
      style,
      fail_rate: stats.total_attempts > 0 ? stats.fail_count / stats.total_attempts : 0,
      ...stats,
    }))
    .filter((s) => s.total_attempts >= 3) // Only analyze styles with 3+ attempts
    .sort((a, b) => b.fail_rate - a.fail_rate)
    .slice(0, 5) // Top 5 weaknesses

  return { struggling_styles: sorted }
}

function extractClimbingFrequency(climbs: Climb[]) {
  const weekCounts = new Map<string, number>()

  climbs.forEach((climb) => {
    const date = new Date(climb.created_at)
    const weekKey = getWeekKey(date)
    weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1)
  })

  const sortedWeeks = Array.from(weekCounts.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12) // Last 12 weeks

  const climbsPerWeek = sortedWeeks.map(([week, count]) => ({
    week: formatWeek(week),
    count,
  }))

  const totalClimbs = climbs.length

  // Get first and last climb for date span calculation
  const firstClimb = climbs.length > 0 ? climbs[climbs.length - 1] : null
  const lastClimb = climbs.length > 0 ? climbs[0] : null

  const daysSpanned =
    firstClimb && lastClimb
      ? getDaysSpanned(lastClimb.created_at, firstClimb.created_at)
      : 0
  const avgPerMonth = daysSpanned > 0 ? Math.round((totalClimbs / daysSpanned) * 30) : 0

  return {
    climbs_per_week: climbsPerWeek,
    climbs_per_month: avgPerMonth,
    avg_climbs_per_session: calculateAvgPerSession(climbs),
  }
}

function extractRecentSuccesses(climbs: Climb[]) {
  const recentSends = climbs.filter((c) => c.outcome === 'Sent').slice(0, 10)

  // Track highest grade sent
  const maxGradeSent = recentSends.reduce((max, climb) => {
    const normalized = normalizeGrade(climb.grade_scale as any, climb.grade_value)
    return normalized > max ? normalized : max
  }, 0)

  const gradeProgression = recentSends
    .filter((c) => {
      const normalized = normalizeGrade(c.grade_scale as any, c.grade_value)
      return normalized === maxGradeSent
    })
    .slice(0, 5)
    .map((climb) => ({
      grade: `${climb.grade_scale}:${climb.grade_value}`,
      date: new Date(climb.created_at).toLocaleDateString(),
    }))

  const redemptions = climbs.filter((c) => c.redemption_at !== null).length

  return {
    recent_sends: recentSends,
    grade_progression: gradeProgression,
    redemption_count: redemptions,
  }
}

function getEmptyPatterns(): PatternAnalysis {
  return {
    failure_patterns: { most_common_failure_reasons: [] },
    style_weaknesses: { struggling_styles: [] },
    climbing_frequency: {
      climbs_per_week: [],
      climbs_per_month: 0,
      avg_climbs_per_session: 0,
    },
    recent_successes: {
      recent_sends: [],
      grade_progression: [],
      redemption_count: 0,
    },
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatWeek(weekKey: string): string {
  const [year, week] = weekKey.split('-W')
  return `Week ${week}, ${year}`
}

function getDaysSpanned(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
}

function calculateAvgPerSession(climbs: Climb[]): number {
  if (climbs.length === 0) {return 0}

  // Group climbs by day (approximate session)
  const sessions = new Map<string, number>()

  climbs.forEach((climb) => {
    const day = new Date(climb.created_at).toDateString()
    sessions.set(day, (sessions.get(day) || 0) + 1)
  })

  const totalSessions = sessions.size
  return Math.round(climbs.length / totalSessions)
}
