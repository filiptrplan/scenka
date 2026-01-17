import { RefreshCw } from 'lucide-react'
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
import { useCoachRecommendations, useGenerateRecommendations } from '@/hooks/useCoach'
import { useClimbs } from '@/hooks/useClimbs'
import { useProfile } from '@/hooks/useProfile'

export function CoachPage() {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'patterns'>('recommendations')

  const { data: recommendations, isLoading, error } = useCoachRecommendations()
  const { data: climbs } = useClimbs()
  const { data: profile } = useProfile()
  const generateRecommendations = useGenerateRecommendations()

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

          <TabsContent value="recommendations" className="mt-6">
            <FormSection>
              <FormLabel className="mb-6 block">Recommendations content placeholder</FormLabel>
            </FormSection>
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <FormSection>
              <FormLabel className="mb-6 block">Pattern analysis content placeholder</FormLabel>
            </FormSection>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
