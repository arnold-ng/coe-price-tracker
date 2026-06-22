import type { CategorySummary } from '../../lib/transform'
import { CATEGORIES } from '../../lib/categories'
import {
  formatSGD,
  formatPercent,
  formatRatio,
  ordinalSuffix,
  exerciseLabel,
} from '../../lib/format'

interface Props {
  summary: CategorySummary
  selected: boolean
  onToggle: () => void
}

export function CategoryCard({ summary, selected, onToggle }: Props) {
  const meta = CATEGORIES[summary.category]
  const up = (summary.delta ?? 0) > 0
  const down = (summary.delta ?? 0) < 0
  // Rising COE = more expensive = bad for buyers -> red; falling -> green.
  const deltaColor = up ? 'text-red-600' : down ? 'text-green-600' : 'text-slate-400'
  const deltaArrow = up ? '▲' : down ? '▼' : '—'

  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex flex-col rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        selected
          ? 'border-transparent bg-white shadow-md ring-1'
          : 'border-slate-200 bg-white/60 hover:bg-white hover:shadow-sm'
      }`}
      style={selected ? ({ '--tw-ring-color': meta.color } as React.CSSProperties) : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="font-semibold text-slate-800">{meta.label}</span>
        {!selected && <span className="ml-auto text-xs text-slate-400">hidden</span>}
      </div>
      <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{meta.description}</p>

      {summary.hasData ? (
        <>
          <div className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
            {formatSGD(summary.latestPremium)}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className={`font-medium tabular-nums ${deltaColor}`}>
              {deltaArrow}{' '}
              {summary.delta != null ? formatSGD(Math.abs(summary.delta)) : '—'}
              {summary.deltaPct != null && (
                <span className="ml-1 text-xs">({formatPercent(Math.abs(summary.deltaPct), 1)})</span>
              )}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {exerciseLabel(summary.latestMonth, summary.latestRound)}
          </div>

          {/* Percentile bar: how the latest price sits vs all-time history. */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{ordinalSuffix(summary.percentile)} pctile</span>
              <span>{formatRatio(summary.latestOversub)} bids</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${summary.percentile}%`, backgroundColor: meta.color }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400 tabular-nums">
              <span>lo {formatSGD(summary.allTimeMin)}</span>
              <span>hi {formatSGD(summary.allTimeMax)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 text-sm text-slate-400">No data</div>
      )}
    </button>
  )
}
