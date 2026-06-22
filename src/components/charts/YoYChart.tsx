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
import { useMemo } from 'react'
import type { CoeRecord } from '../../types'
import { useFilterStore } from '../../store/filters'
import { buildSeasonalRows } from '../../lib/transform'
import { CATEGORIES } from '../../lib/categories'
import { formatSGD, formatSGDCompact, monthLabel } from '../../lib/format'

// Distinct shades for year lines (older = lighter, recent = darker/saturated).
function yearColor(index: number, total: number): string {
  const hue = 215 // blue family
  const light = 75 - (index / Math.max(1, total - 1)) * 45
  return `hsl(${hue} 70% ${light}%)`
}

export function YoYChart({ records }: { records: CoeRecord[] }) {
  const filters = useFilterStore()
  // Seasonal overlay focuses on one category at a time for readability.
  const category = filters.categories[0] ?? 'A'
  const { rows, years } = useMemo(
    () => buildSeasonalRows(records, category, filters),
    [records, category, filters],
  )

  if (years.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center text-slate-400">
        No data for the current filters.
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        Seasonal overlay for{' '}
        <span className="font-medium" style={{ color: CATEGORIES[category].color }}>
          {CATEGORIES[category].label}
        </span>{' '}
        — each line is a year, plotted Jan–Dec. Use the category chips to switch; the first
        selected category is shown.
      </p>
      <ResponsiveContainer width="100%" height={440}>
        <LineChart data={rows} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis
            dataKey="monthNum"
            tickFormatter={(m) => monthLabel(Number(m))}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis
            tickFormatter={formatSGDCompact}
            tick={{ fontSize: 12, fill: '#64748b' }}
            width={64}
          />
          <Tooltip
            labelFormatter={(m) => monthLabel(Number(m))}
            formatter={(value: number, name: string) => [formatSGD(value), name]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {years.map((y, i) => (
            <Line
              key={y}
              type="monotone"
              dataKey={`y${y}`}
              name={String(y)}
              stroke={yearColor(i, years.length)}
              strokeWidth={y === years[years.length - 1] ? 2.5 : 1.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
