import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import type { CoeRecord } from '../../types'
import { useFilterStore } from '../../store/filters'
import { buildTimelineRows } from '../../lib/transform'
import { CATEGORIES } from '../../lib/categories'
import { formatSGDCompact } from '../../lib/format'
import { ChartTooltip } from './ChartTooltip'
import { useMemo } from 'react'

// "2024-03 (1)" -> "Mar '24"
function tickLabel(label: string): string {
  const m = String(label).match(/^(\d{4})-(\d{2})/)
  if (!m) return String(label)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(m[2]) - 1]} '${m[1].slice(2)}`
}

export function TrendChart({ records }: { records: CoeRecord[] }) {
  const filters = useFilterStore()
  const rows = useMemo(() => buildTimelineRows(records, filters), [records, filters])
  const { categories, overlays } = filters

  const showRightAxis = overlays.oversubscription || overlays.quota

  if (rows.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center text-slate-400">
        No data for the current filters.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={440}>
      <LineChart data={rows} margin={{ top: 10, right: showRightAxis ? 20 : 10, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis
          dataKey="label"
          tickFormatter={tickLabel}
          tick={{ fontSize: 12, fill: '#64748b' }}
          minTickGap={28}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          yAxisId="premium"
          tickFormatter={formatSGDCompact}
          tick={{ fontSize: 12, fill: '#64748b' }}
          width={64}
        />
        {overlays.oversubscription && (
          <YAxis
            yAxisId="os"
            orientation="right"
            tickFormatter={(v) => `${v}x`}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            width={44}
          />
        )}
        {overlays.quota && (
          <YAxis yAxisId="quota" orientation="right" hide />
        )}
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

        {categories.map((cat) => {
          const meta = CATEGORIES[cat]
          return (
            <Line
              key={cat}
              yAxisId="premium"
              type="monotone"
              dataKey={cat}
              name={meta.label}
              stroke={meta.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )
        })}

        {overlays.movingAverage > 0 &&
          categories.map((cat) => {
            const meta = CATEGORIES[cat]
            return (
              <Line
                key={`${cat}_ma`}
                yAxisId="premium"
                type="monotone"
                dataKey={`${cat}_ma`}
                name={`${meta.label} ${overlays.movingAverage}-ex MA`}
                stroke={meta.color}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                strokeOpacity={0.6}
                dot={false}
                connectNulls
                legendType="none"
              />
            )
          })}

        {overlays.oversubscription &&
          categories.map((cat) => {
            const meta = CATEGORIES[cat]
            return (
              <Line
                key={`${cat}_os`}
                yAxisId="os"
                type="monotone"
                dataKey={`${cat}_os`}
                name={`${meta.label} oversub`}
                stroke={meta.color}
                strokeWidth={1}
                strokeDasharray="2 3"
                strokeOpacity={0.5}
                dot={false}
                connectNulls
                legendType="none"
              />
            )
          })}

        {overlays.quota &&
          categories.map((cat) => {
            const meta = CATEGORIES[cat]
            return (
              <Line
                key={`${cat}_q`}
                yAxisId="quota"
                type="stepAfter"
                dataKey={`${cat}_q`}
                name={`${meta.label} quota`}
                stroke={meta.color}
                strokeWidth={1}
                strokeDasharray="1 4"
                strokeOpacity={0.4}
                dot={false}
                connectNulls
                legendType="none"
              />
            )
          })}
      </LineChart>
    </ResponsiveContainer>
  )
}
