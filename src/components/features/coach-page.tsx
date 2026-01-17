import { MessageCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form-label'
import { FormSection } from '@/components/ui/form-section'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useClimbs } from '@/hooks/useClimbs'
import { useCoachRecommendations, useGenerateRecommendations, usePatternAnalysis } from '@/hooks/useCoach'
import { useProfile } from '@/hooks/useProfile'
import { Badge } from '@/components/ui/badge'

export function CoachPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'recommendations' | 'patterns'>('recommendations')

  const { data: recommendations, isLoading, error } = useCoachRecommendations()
  const { data: climbs } = useClimbs()
  const { data: profile } = useProfile()
  const generateRecommendations = useGenerateRecommendations()
  const { data: patterns, isLoading: patternsLoading } = usePatternAnalysis()

  const handleRegenerate = () => {
    generateRecommendations.mutate(
      {
        climbs: climbs || [],
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
              disabled={generateRecommendations.isPending}
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
            {/* Weekly Focus Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 flex-1 bg-blue-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Weekly Focus</h2>
                <div className="h-1 flex-1 bg-blue-500" />
              </div>
              <FormSection>
                <FormLabel className="mb-4 block">This week's focus</FormLabel>
                <p className="text-lg text-[#f5f5f5] leading-relaxed">{(recommendations.content as any).weekly_focus || 'No weekly focus available'}</p>
              </FormSection>
            </section>

            {/* Drills Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 flex-1 bg-green-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Training Drills</h2>
                <div className="h-1 flex-1 bg-green-500" />
              </div>

              {((recommendations.content as any)?.drills || []).map((drill: any, index: number) => (
                <FormSection key={index} className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-black uppercase">{drill.name || 'Drill'}</h3>
                    <Badge variant="outline" className="text-xs font-mono border-white/20 text-[#ccc]">
                      {drill.sets || 0} × {drill.reps || 'N/A'}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#bbb] leading-relaxed mb-3">{drill.description || 'No description available'}</p>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#666]">
                    <span>Rest: {drill.rest || 'N/A'}</span>
                  </div>
                </FormSection>
              ))}
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => void handleRegenerate()}
                disabled={generateRecommendations.isPending}
                className="w-full h-12 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {generateRecommendations.isPending ? 'Generating...' : 'Regenerate Recommendations'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/coach/chat')}
                className="w-full h-12 border-white/20 hover:border-white/40 bg-white/[0.02] text-white font-black uppercase tracking-wider"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Coach a Question
              </Button>
            </div>

            {/* Last Updated */}
            <div className="text-center pt-4">
              <FormLabel>
                Last updated: {formatDistanceToNow(new Date(recommendations.generation_date), { addSuffix: true })}
              </FormLabel>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="mt-6 space-y-8">
            {patternsLoading ? (
              <div className="text-center py-12 text-[#888]">Loading patterns...</div>
            ) : patterns ? (
              <>
                {/* Failure Patterns */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-orange-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Failure Patterns</h2>
                    <div className="h-1 flex-1 bg-orange-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-3">
                      {patterns.failure_patterns.most_common_failure_reasons.map((item) => (
                        <div key={item.reason} className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs font-mono border-white/20 text-[#ccc]">
                            {item.reason}
                          </Badge>
                          <span className="text-sm text-[#888]">
                            {item.count} times ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </FormSection>
                </section>

                {/* Style Weaknesses */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-rose-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Style Weaknesses</h2>
                    <div className="h-1 flex-1 bg-rose-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-3">
                      {patterns.style_weaknesses.struggling_styles.map((item) => (
                        <div key={item.style} className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs font-mono border-white/20 text-[#ccc]">
                            {item.style}
                          </Badge>
                          <span className="text-sm text-[#888]">
                            {Math.round(item.fail_rate * 100)}% fail rate ({item.fail_count}/{item.total_attempts})
                          </span>
                        </div>
                      ))}
                    </div>
                  </FormSection>
                </section>

                {/* Climbing Frequency */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-teal-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Climbing Frequency</h2>
                    <div className="h-1 flex-1 bg-teal-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-[#888] mb-1">Average per session</p>
                        <p className="text-4xl font-black">{patterns.climbing_frequency.avg_climbs_per_session}</p>
                      </div>
                      <div className="text-center pt-4 border-t border-white/10">
                        <p className="text-sm text-[#888] mb-1">Per month</p>
                        <p className="text-4xl font-black">{patterns.climbing_frequency.climbs_per_month}</p>
                      </div>
                    </div>
                  </FormSection>
                </section>

                {/* Recent Successes */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-purple-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Recent Successes</h2>
                    <div className="h-1 flex-1 bg-purple-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-[#888] mb-1">Redemptions</p>
                        <p className="text-4xl font-black">{patterns.recent_successes.redemption_count}</p>
                      </div>
                      {patterns.recent_successes.grade_progression.length > 0 && (
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-sm text-[#888] mb-3 text-center">Grade Progression</p>
                          <div className="space-y-2">
                            {patterns.recent_successes.grade_progression.map((gp, i) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
