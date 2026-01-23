import { format, formatDistanceToNow } from 'date-fns'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form-label'
import { FormSection } from '@/components/ui/form-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClimbs } from '@/hooks/useClimbs'
import {
  useCoachRecommendations,
  useGenerateRecommendations,
  usePatternAnalysis,
} from '@/hooks/useCoach'
import { useProfile } from '@/hooks/useProfile'
import { getTimeUntilNextReset, useUserLimits } from '@/hooks/useUserLimits'
import { type ProjectingFocus } from '@/services/coach'

const safeDate = (dateString: string | undefined | null): Date => {
  if (!dateString) {
    return new Date()
  }
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? new Date() : date
}

export function CoachPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'recommendations' | 'patterns'>('recommendations')

  const { data: recommendations, isLoading, error } = useCoachRecommendations()
  const { data: climbs } = useClimbs()
  const { data: profile } = useProfile()
  const { data: limits } = useUserLimits()
  const generateRecommendations = useGenerateRecommendations()
  const { data: patterns, isLoading: patternsLoading, error: patternsError } = usePatternAnalysis()

  const dailyRecLimit = 2
  const recCount = limits?.rec_count ?? 0
  const recRemaining = Math.max(0, dailyRecLimit - recCount)
  const isRecAtLimit = recRemaining <= 0

  const handleRegenerate = () => {
    generateRecommendations.mutate(
      {
        climbs: climbs ?? [],
        user_preferences: {
          preferred_discipline: 'boulder',
          preferred_grade_scale: 'font',
        },
      },
      {
        onSuccess: () => toast.success('Recommendations regenerated successfully'),
        onError: (err) => toast.error(`Failed to regenerate: ${err.message}`),
      }
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-[#888]">Loading recommendations...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-red-400">
            Failed to load recommendations: {error.message}
          </div>
        </div>
      </div>
    )
  }

  // Empty state - no recommendations yet
  if (!recommendations) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl space-y-8">
          <header className="border-b-2 border-white/20 pb-6">
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Coach</h1>
            <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
              AI-powered training recommendations
            </p>
          </header>

          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <p className="text-[#888] text-center">No recommendations yet</p>
            <Button
              onClick={() => {
                if (!climbs || climbs.length === 0) {
                  toast.error('Log some climbs first to generate recommendations')
                  return
                }
                generateRecommendations.mutate({
                  climbs,
                  user_preferences: {
                    preferred_discipline: profile?.preferred_discipline ?? 'boulder',
                    preferred_grade_scale: profile?.preferred_grade_scale ?? 'font',
                  },
                })
              }}
              disabled={generateRecommendations.isPending || isRecAtLimit}
              className="h-12 px-8 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider disabled:opacity-50"
            >
              {generateRecommendations.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Recommendations'
              )}
            </Button>
            <span className="text-xs text-[#888]">
              {recCount}/{dailyRecLimit} used today
            </span>
            {isRecAtLimit ? <p className="text-xs text-red-400">{getTimeUntilNextReset()}</p> : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="border-b-2 border-white/20 pb-6">
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Coach</h1>
          <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
            AI-powered training recommendations
          </p>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'recommendations' | 'patterns')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full border-2 border-white/10 bg-white/[0.02]">
            <TabsTrigger
              value="recommendations"
              className="text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Recommendations
            </TabsTrigger>
            <TabsTrigger
              value="patterns"
              className="text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Pattern Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="mt-6 space-y-8">
            {/* Generation Date - Subtle indicator above Weekly Focus */}
            <div className="text-center text-xs text-[#666] font-mono uppercase tracking-wide">
              Generated{' '}
              {formatDistanceToNow(safeDate(recommendations.created_at), {
                addSuffix: true,
              })}{' '}
              (at {format(safeDate(recommendations.created_at), 'HH:mm')})
            </div>

            {/* Weekly Focus Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 flex-1 bg-blue-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Weekly Focus</h2>
                <div className="h-1 flex-1 bg-blue-500" />
              </div>
              <FormSection>
                <FormLabel className="mb-4 block">This week&apos;s focus</FormLabel>
                <p className="text-lg text-[#f5f5f5] leading-relaxed">
                  {recommendations.content?.weekly_focus ?? 'No weekly focus available'}
                </p>
              </FormSection>
            </section>

            {/* Drills Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 flex-1 bg-green-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Training Drills</h2>
                <div className="h-1 flex-1 bg-green-500" />
              </div>

              {(recommendations.content?.drills ?? []).length === 0 ? (
                <FormSection>
                  <p className="text-center text-[#888]">No drills available</p>
                </FormSection>
              ) : (
                (recommendations.content?.drills ?? []).map(
                  (
                    drill: {
                      name: string
                      description: string
                      sets: number
                      reps: string
                      rest: string
                      measurable_outcome: string
                    },
                    index: number,
                  ) => (
                    <FormSection key={`drill-${index}`} className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-black uppercase">{drill.name ?? 'Drill'}</h3>
                        <Badge
                          variant="outline"
                          className="text-xs font-mono border-white/20 text-[#ccc] flex flex-col items-start py-2"
                        >
                          <span>
                            Sets: {drill.sets ?? 0} × {drill.reps ?? 'N/A'}
                          </span>
                          <span>Rest: {drill.rest ?? 'N/A'}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                        {drill.description ?? 'No description available'}
                      </p>
                      {drill.measurable_outcome ? <p className="text-xs text-green-400/80 leading-relaxed font-mono">
                          Goal: {drill.measurable_outcome}
                        </p> : null}
                    </FormSection>
                  )
                )
              )}
            </section>

            {/* Projecting Focus Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 flex-1 bg-purple-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Projecting Focus</h2>
                <div className="h-1 flex-1 bg-purple-500" />
              </div>

              {(recommendations.content?.projecting_focus ?? []).length === 0 ? (
                <FormSection>
                  <p className="text-center text-[#888]">No projecting focus available</p>
                </FormSection>
              ) : (
                (recommendations.content?.projecting_focus ?? []).map(
                  (focus: ProjectingFocus, index: number) => (
                    <FormSection key={`focus-${index}`} className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-black uppercase">
                          {focus.focus_area ?? 'Focus Area'}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs font-mono border-white/20 text-[#ccc] py-2"
                        >
                          {focus.grade_guidance ?? 'No grade guidance'}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                        {focus.description ?? 'No description available'}
                      </p>
                      <p className="text-xs text-purple-400/80 leading-relaxed font-mono">
                        Why: {focus.rationale ?? 'No rationale provided'}
                      </p>
                    </FormSection>
                  )
                )
              )}
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => void handleRegenerate()}
                disabled={generateRecommendations.isPending || isRecAtLimit}
                className="w-full h-12 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {generateRecommendations.isPending ? 'Generating...' : 'Regenerate Recommendations'}
              </Button>
              <span className="text-xs text-[#888] text-center">
                {recCount}/{dailyRecLimit} used today
              </span>
              {isRecAtLimit ? <p className="text-xs text-red-400 text-center">{getTimeUntilNextReset()}</p> : null}
              <Button
                variant="outline"
                onClick={() => void navigate('/coach/chat')}
                className="w-full h-12 border-white/20 hover:border-white/40 bg-white/[0.02] text-white font-black uppercase tracking-wider"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Coach a Question
              </Button>
            </div>

            {/* Last Updated */}
            <div className="text-center pt-4">
              <FormLabel>
                Last updated:{' '}
                {formatDistanceToNow(safeDate(recommendations.created_at), {
                  addSuffix: true,
                })}
              </FormLabel>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="mt-6 space-y-8">
            {patternsLoading ? (
              <div className="text-center py-12 text-[#888]">Loading patterns...</div>
            ) : patternsError ? (
              <div className="text-center py-12 text-red-400">
                Failed to load patterns: {patternsError.message}
              </div>
            ) : patterns ? (
              <>
                {/* Failure Patterns */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-orange-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                      Failure Patterns
                    </h2>
                    <div className="h-1 flex-1 bg-orange-500" />
                  </div>
                  <FormSection>
                    {patterns.failure_patterns.most_common_failure_reasons.length === 0 ? (
                      <p className="text-center text-[#888]">No failure data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {patterns.failure_patterns.most_common_failure_reasons.map((item: { reason: string; count: number; percentage: number }) => (
                          <div key={item.reason} className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono border-white/20 text-[#ccc]"
                            >
                              {item.reason}
                            </Badge>
                            <span className="text-sm text-[#888]">
                              {item.count} times ({item.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormSection>
                </section>

                {/* Style Weaknesses */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-rose-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                      Style Weaknesses
                    </h2>
                    <div className="h-1 flex-1 bg-rose-500" />
                  </div>
                  <FormSection>
                    {patterns.style_weaknesses.struggling_styles.length === 0 ? (
                      <p className="text-center text-[#888]">No style data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {patterns.style_weaknesses.struggling_styles.map((item: { style: string; fail_rate: number; fail_count: number; total_attempts: number }) => (
                          <div key={item.style} className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono border-white/20 text-[#ccc]"
                            >
                              {item.style}
                            </Badge>
                            <span className="text-sm text-[#888]">
                              {Math.round(item.fail_rate * 100)}% fail rate ({item.fail_count}/
                              {item.total_attempts})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormSection>
                </section>

                {/* Climbing Frequency */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-teal-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                      Climbing Frequency
                    </h2>
                    <div className="h-1 flex-1 bg-teal-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-[#888] mb-1">Average per session</p>
                        <p className="text-4xl font-black">
                          {patterns.climbing_frequency.avg_climbs_per_session}
                        </p>
                      </div>
                      <div className="text-center pt-4 border-t border-white/10">
                        <p className="text-sm text-[#888] mb-1">Per month</p>
                        <p className="text-4xl font-black">
                          {patterns.climbing_frequency.climbs_per_month}
                        </p>
                      </div>
                    </div>
                  </FormSection>
                </section>

                {/* Recent Successes */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-purple-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                      Recent Successes
                    </h2>
                    <div className="h-1 flex-1 bg-purple-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-[#888] mb-1">Redemptions</p>
                        <p className="text-4xl font-black">
                          {patterns.recent_successes.redemption_count}
                        </p>
                      </div>
                      {patterns.recent_successes.grade_progression.length > 0 && (
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-sm text-[#888] mb-3 text-center">Grade Progression</p>
                          <div className="space-y-2">
                            {patterns.recent_successes.grade_progression.map((gp: { grade: string; date: string }, i: number) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-[#888]">{gp.date}</span>
                                <span className="font-mono">{gp.grade}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </FormSection>
                </section>
              </>
            ) : (
              <div className="text-center py-12 text-[#888]">
                No climbing data available for pattern analysis
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => void navigate('/coach/chat')}
                className="w-full h-12 border-white/20 hover:border-white/40 bg-white/[0.02] text-white font-black uppercase tracking-wider"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Coach a Question
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
