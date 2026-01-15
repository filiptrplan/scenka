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

  const failureReasonsData = useMemo(() => {
    const reasonCount = new Map<string, number>()

    climbs.forEach((climb) => {
      if (climb.outcome === 'Fail') {
        climb.failure_reasons.forEach((reason) => {
          const currentValue = reasonCount.get(reason) ?? 0
          reasonCount.set(reason, currentValue + 1)
        })
      }
    })

    return Array.from(reasonCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [climbs])

  const allStylesData = useMemo(() => {
    const styleCount = new Map<string, number>()

    climbs.forEach((climb) => {
      climb.style.forEach((s) => {
        const currentValue = styleCount.get(s) ?? 0
        styleCount.set(s, currentValue + 1)
      })
    })

    return Array.from(styleCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
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
            <div className="h-1 flex-1 bg-rose-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Anti-Style</h2>
            <div className="h-1 flex-1 bg-rose-500" />
          </div>

          <div className="bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200">
            <p className="text-xs font-mono text-[#666] uppercase tracking-wider mb-6">
              Failure rate by wall angle / hold type
            </p>

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
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-amber-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Failure Radar</h2>
            <div className="h-1 flex-1 bg-amber-500" />
          </div>

          <div className="bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200">
            <p className="text-xs font-mono text-[#666] uppercase tracking-wider mb-6">
              Physical vs Technical vs Mental breakdown
            </p>

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
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-emerald-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Sends by Grade</h2>
            <div className="h-1 flex-1 bg-emerald-500" />
          </div>

          <div className="bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200">
            <p className="text-xs font-mono text-[#666] uppercase tracking-wider mb-6">
              Success rate by difficulty bucket
            </p>

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
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-rose-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Failure Reasons</h2>
            <div className="h-1 flex-1 bg-rose-500" />
          </div>

          <div className="bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200">
            <p className="text-xs font-mono text-[#666] uppercase tracking-wider mb-6">
              Frequency of individual failure causes
            </p>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={failureReasonsData}
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
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-purple-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">STYLE DISTRIBUTION</h2>
            <div className="h-1 flex-1 bg-purple-500" />
          </div>

          <div className="bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200">
            <p className="text-xs font-mono text-[#666] uppercase tracking-wider mb-6">
              Total climbs by climbing style
            </p>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={allStylesData}
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
                    fill="rgba(168, 85, 247, 0.8)"
                    activeBar={{ fill: 'rgba(168, 85, 247, 0.5)' }}
                    radius={[0, 0, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className="text-center pt-8 border-t-2 border-white/10">
          <p className="text-xs font-mono text-[#666] uppercase tracking-widest">
            Data based on logged failures
          </p>
        </div>
      </div>
    </div>
  )
}
