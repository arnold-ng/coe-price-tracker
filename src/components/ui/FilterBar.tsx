import { useState } from 'react'
import { useFilterStore } from '../../store/filters'
import { CATEGORIES, CATEGORY_ORDER } from '../../lib/categories'
import type { BiddingRound } from '../../types'

interface Props {
  minYear: number
  maxYear: number
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

export function FilterBar({ minYear, maxYear }: Props) {
  const {
    categories,
    yearStart,
    yearEnd,
    rounds,
    mode,
    overlays,
    toggleCategory,
    setYearRange,
    toggleRound,
    setMode,
    setMovingAverage,
    toggleOverlay,
    reset,
  } = useFilterStore()
  const [copied, setCopied] = useState(false)

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — fall back to a prompt so the URL is still grabbable.
      window.prompt('Copy this shareable link:', window.location.href)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white/70 p-4">
      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Categories
        </span>
        {CATEGORY_ORDER.map((c) => {
          const meta = CATEGORIES[c]
          const on = categories.includes(c)
          return (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition ${
                on ? 'text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              style={on ? { backgroundColor: meta.color, borderColor: meta.color } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? 'white' : meta.color }}
              />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Years + rounds */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Years
          </span>
          <select
            value={yearStart}
            onChange={(e) => setYearRange(Number(e.target.value), yearEnd)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="text-slate-400">–</span>
          <select
            value={yearEnd}
            onChange={(e) => setYearRange(yearStart, Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Rounds
          </span>
          {([1, 2] as BiddingRound[]).map((r) => (
            <label key={r} className="flex items-center gap-1 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rounds.includes(r)}
                onChange={() => toggleRound(r)}
                className="accent-slate-700"
              />
              {r === 1 ? '1st' : '2nd'}
            </label>
          ))}
        </div>
      </div>

      {/* Mode + overlays */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <Segment active={mode === 'timeline'} onClick={() => setMode('timeline')}>
            Timeline
          </Segment>
          <Segment active={mode === 'seasonal'} onClick={() => setMode('seasonal')}>
            Seasonal
          </Segment>
        </div>

        {mode === 'timeline' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Avg
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {([0, 3, 6] as const).map((w) => (
                  <Segment
                    key={w}
                    active={overlays.movingAverage === w}
                    onClick={() => setMovingAverage(w)}
                  >
                    {w === 0 ? 'Off' : `${w}-ex`}
                  </Segment>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={overlays.oversubscription}
                onChange={() => toggleOverlay('oversubscription')}
                className="accent-slate-700"
              />
              Oversubscription
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={overlays.quota}
                onChange={() => toggleOverlay('quota')}
                className="accent-slate-700"
              />
              Quota
            </label>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={share}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {copied ? '✓ Copied' : '🔗 Share view'}
          </button>
          <button
            onClick={reset}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
