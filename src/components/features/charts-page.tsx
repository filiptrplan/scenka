import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { FormLabel } from '@/components/ui/form-label'
import { FormSection } from '@/components/ui/form-section'
import { useClimbs } from '@/hooks/useClimbs'
import { getAllGradeBuckets, getDifficultyBucket, normalizeGrade } from '@/lib/grades'

export function ChartsPage() {
  const { data: climbs = [], isLoading, error } = useClimbs()

  const antiStyleData = useMemo(() => {
    const styleCount = new Map<string, number>()

    climbs.forEach((climb) => {
      if (climb.outcome === 'Fail') {
        climb.style.forEach((s) => {
          const currentValue = styleCount.get(s) ?? 0
          styleCount.set(s, currentValue + 1)
        })
      }
    })

    return Array.from(styleCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [climbs])

  const radarData = useMemo(() => {
    const physical = climbs.filter(
      (c) =>
        c.outcome === 'Fail' &&
        c.failure_reasons.some((r) => ['Pumped', 'Finger Strength', 'Core', 'Power'].includes(r))
    ).length
    const technical = climbs.filter(
      (c) =>
        c.outcome === 'Fail' &&
        c.failure_reasons.some((r) =>
          ['Bad Feet', 'Body Position', 'Beta Error', 'Precision'].includes(r)
        )
    ).length
    const mental = climbs.filter(
      (c) =>
        c.outcome === 'Fail' &&
        c.failure_reasons.some((r) => ['Fear', 'Commitment', 'Focus'].includes(r))
    ).length

    return [
      { category: 'Physical', value: physical },
      { category: 'Technical', value: technical },
      { category: 'Mental', value: mental },
    ]
  }, [climbs])

  const trainingPrioritiesData = useMemo(() => {
    const reasonCount = new Map<string, number>()

    climbs.forEach((climb) => {
      if (climb.outcome === 'Fail') {
        climb.failure_reasons.forEach((reason) => {
          const currentValue = reasonCount.get(reason) ?? 0
          reasonCount.set(reason, currentValue + 1)
        })
      }
    })

    const totalFailures = Array.from(reasonCount.values()).reduce((sum, count) => sum + count, 0)

    return Array.from(reasonCount.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalFailures > 0 ? (value / totalFailures) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [climbs])

  const sendsByGradeData = useMemo(() => {
    const buckets = getAllGradeBuckets()
    const gradeBuckets: Record<string, { sent: number; fail: number }> = {}

    // Initialize buckets
    buckets.forEach((bucket) => {
      gradeBuckets[bucket] = { sent: 0, fail: 0 }
    })

    // Process climbs
    climbs.forEach((climb) => {
      const normalized = normalizeGrade(climb.grade_scale as any, climb.grade_value)
      const bucket = getDifficultyBucket(normalized)

      if (gradeBuckets[bucket]) {
        gradeBuckets[bucket].sent += climb.outcome === 'Sent' ? 1 : 0
        gradeBuckets[bucket].fail += climb.outcome === 'Fail' ? 1 : 0
      }
    })

    return Object.entries(gradeBuckets)
      .map(([name, data]) => ({ name, sent: data.sent, fail: data.fail }))
      .filter((item) => item.name !== 'Unknown')
  }, [climbs])

  const redemptionRateData = useMemo(() => {
    const buckets = getAllGradeBuckets()
    const gradeBuckets: Record<string, { total_sent: number; redeems_sent: number }> = {}

    // Initialize buckets
    buckets.forEach((bucket) => {
      gradeBuckets[bucket] = { total_sent: 0, redeems_sent: 0 }
    })

    // Process climbs
    climbs.forEach((climb) => {
      if (climb.outcome === 'Sent') {
        const normalized = normalizeGrade(climb.grade_scale as any, climb.grade_value)
        const bucket = getDifficultyBucket(normalized)

        if (gradeBuckets[bucket]) {
          gradeBuckets[bucket].total_sent += 1
          // Check if redemption_at is not null/undefined
          if (climb.redemption_at !== null && climb.redemption_at !== undefined) {
            gradeBuckets[bucket].redeems_sent += 1
          }
        }
      }
    })

    return Object.entries(gradeBuckets)
      .map(([name, data]) => ({
        name,
        total_sent: data.total_sent,
        redeems_sent: data.redeems_sent,
        non_redeemed: data.total_sent - data.redeems_sent,
        redemption_rate: data.total_sent > 0 ? (data.redeems_sent / data.total_sent) * 100 : 0,
      }))
      .filter((item) => item.name !== 'Unknown')
  }, [climbs])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-[#888]">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-red-400">
            Failed to load analytics: {error.message}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="border-b-2 border-white/20 pb-6">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2">
            Analytics
          </h1>
          <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
            Technique failure breakdown
          </p>
        </header>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-orange-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">TRAINING PRIORITIES</h2>
            <div className="h-1 flex-1 bg-orange-500" />
          </div>

          <FormSection>
            <FormLabel className="mb-6 block">
              Work on these first
            </FormLabel>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trainingPrioritiesData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(value) => value.toUpperCase()}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: 0,
                      fontFamily: 'monospace',
                    }}
                    itemStyle={{ color: '#f5f5f5' }}
                    labelStyle={{ color: '#888', textTransform: 'uppercase' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const percentage = (payload[0].payload as any).percentage?.toFixed(0)
                        return `${label} (${percentage}% of total)`
                      }
                      return label
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="rgba(249, 115, 22, 0.8)"
                    activeBar={{ fill: 'rgba(249, 115, 22, 0.5)' }}
                    radius={[0, 0, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FormSection>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-rose-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Anti-Style</h2>
            <div className="h-1 flex-1 bg-rose-500" />
          </div>

          <FormSection>
            <FormLabel className="mb-6 block">
              Failure rate by wall angle / hold type
            </FormLabel>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={antiStyleData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(value) => value.toUpperCase()}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: 0,
                      fontFamily: 'monospace',
                    }}
                    itemStyle={{ color: '#f5f5f5' }}
                    labelStyle={{ color: '#888', textTransform: 'uppercase' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="rgba(244, 63, 94, 0.8)"
                    activeBar={{ fill: 'rgba(244, 63, 94, 0.5)' }}
                    radius={[0, 0, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FormSection>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-amber-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Failure Radar</h2>
            <div className="h-1 flex-1 bg-amber-500" />
          </div>

          <FormSection>
            <FormLabel className="mb-6 block">
              Physical vs Technical vs Mental breakdown
            </FormLabel>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 'dataMax + 1']}
                    tick={{ fill: '#666', fontSize: 10 }}
                  />
                  <Radar
                    name="Failures"
                    dataKey="value"
                    fill="rgba(245, 158, 11, 0.5)"
                    fillOpacity={0.5}
                    activeDot={{ fill: 'rgb(245, 158, 11)', stroke: 'none', r: 6 }}
                    stroke="rgb(245, 158, 11)"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </FormSection>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-emerald-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Sends by Grade</h2>
            <div className="h-1 flex-1 bg-emerald-500" />
          </div>

          <FormSection>
            <FormLabel className="mb-6 block">
              Success rate by difficulty bucket
            </FormLabel>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sendsByGradeData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: 0,
                      fontFamily: 'monospace',
                    }}
                    itemStyle={{ color: '#f5f5f5' }}
                    labelStyle={{ color: '#888', textTransform: 'uppercase' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar
                    dataKey="sent"
                    fill="rgba(16, 185, 129, 0.8)"
                    activeBar={{ fill: 'rgba(16, 185, 129, 0.5)' }}
                    radius={[0, 0, 0, 0]}
                    name="Sent"
                  />
                  <Bar
                    dataKey="fail"
                    fill="rgba(244, 63, 94, 0.8)"
                    activeBar={{ fill: 'rgba(244, 63, 94, 0.5)' }}
                    radius={[0, 0, 0, 0]}
                    name="Fail"
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="rect"
                    wrapperStyle={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      textTransform: 'uppercase',
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FormSection>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-teal-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">REDEMPTION RATE</h2>
            <div className="h-1 flex-1 bg-teal-500" />
          </div>

          <FormSection>
            <FormLabel className="mb-6 block">
              Redemption rate by difficulty bucket
            </FormLabel>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={redemptionRateData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: 0,
                      fontFamily: 'monospace',
                    }}
                    itemStyle={{ color: '#f5f5f5' }}
                    labelStyle={{ color: '#888', textTransform: 'uppercase' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar
                    dataKey="non_redeemed"
                    fill="rgba(107, 114, 128, 0.8)"
                    activeBar={{ fill: 'rgba(107, 114, 128, 0.5)' }}
                    radius={[0, 0, 0, 0]}
                    name="Sent (non-redeemed)"
                  />
                  <Bar
                    dataKey="redeems_sent"
                    fill="rgba(20, 184, 166, 0.8)"
                    activeBar={{ fill: 'rgba(20, 184, 166, 0.5)' }}
                    radius={[0, 0, 0, 0]}
                    name="Redeemed"
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="rect"
                    wrapperStyle={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      textTransform: 'uppercase',
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FormSection>
        </section>

        <div className="text-center pt-8 border-t-2 border-white/10">
          <FormLabel>Data based on logged failures</FormLabel>
        </div>
      </div>
    </div>
  )
}
