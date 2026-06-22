import type { TooltipProps } from 'recharts'
import { formatSGD, formatRatio } from '../../lib/format'

// Custom tooltip that formats premiums as SGD, oversubscription as a ratio,
// and quota as a plain count, while hiding null series.
export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
      <div className="mb-1 font-medium text-slate-700">{label}</div>
      <ul className="space-y-0.5">
        {payload
          .filter((p) => p.value != null)
          .map((p) => {
            const key = String(p.dataKey ?? '')
            let value: string
            if (key.endsWith('_os')) value = formatRatio(Number(p.value))
            else if (key.endsWith('_q')) value = `${Number(p.value).toLocaleString()} quota`
            else value = formatSGD(Number(p.value))
            return (
              <li key={key} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-slate-500">{p.name}</span>
                <span className="ml-auto font-medium text-slate-800">{value}</span>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
