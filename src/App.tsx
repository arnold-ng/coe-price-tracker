import { useMemo } from 'react'
import { useCoeData } from './hooks/useCoeData'
import { useFilterStore } from './store/filters'
import { CATEGORY_ORDER } from './lib/categories'
import { buildCategorySummary, yearBounds } from './lib/transform'
import { CategoryCard } from './components/ui/CategoryCard'
import { FilterBar } from './components/ui/FilterBar'
import { TrendChart } from './components/charts/TrendChart'
import { YoYChart } from './components/charts/YoYChart'

export default function App() {
  const { data, isLoading, isError } = useCoeData()
  const { categories, mode, toggleCategory } = useFilterStore()

  const records = data?.records ?? []
  const bounds = useMemo(() => yearBounds(records), [records])
  const summaries = useMemo(
    () => CATEGORY_ORDER.map((c) => buildCategorySummary(records, c)),
    [records],
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🚗 COE Price Tracker</h1>
            <p className="text-sm text-slate-500">
              Singapore Certificate of Entitlement premiums — trends, seasonality & demand.
            </p>
          </div>
          {data && (
            <div className="text-right text-xs text-slate-400">
              <DataSourceBadge source={data.source} liveError={data.liveError} />
              <div className="mt-1">
                Updated {data.fetchedAt.toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          )}
        </header>

        {isLoading && <Skeleton />}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            Failed to load COE data.
          </div>
        )}

        {data && (
          <>
            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {summaries.map((s) => (
                <CategoryCard
                  key={s.category}
                  summary={s}
                  selected={categories.includes(s.category)}
                  onToggle={() => toggleCategory(s.category)}
                />
              ))}
            </section>

            <section className="mb-6">
              <FilterBar minYear={bounds.minYear} maxYear={bounds.maxYear} />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {mode === 'timeline' ? 'Premium trend' : 'Year-over-year seasonality'}
              </h2>
              {categories.length === 0 ? (
                <div className="flex h-[420px] items-center justify-center text-slate-400">
                  Select at least one category above.
                </div>
              ) : mode === 'timeline' ? (
                <TrendChart records={records} />
              ) : (
                <YoYChart records={records} />
              )}
            </section>

            <footer className="mt-8 text-center text-xs text-slate-400">
              Data: data.gov.sg COE Bidding Results.{' '}
              {data.source === 'sample' && 'Showing bundled sample data (live API unreachable).'}
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

function DataSourceBadge({ source, liveError }: { source: 'live' | 'sample'; liveError?: string }) {
  const live = source === 'live'
  return (
    <span
      title={liveError ? `Live fetch failed: ${liveError}` : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        live ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-green-500' : 'bg-amber-500'}`} />
      {live ? 'Live data.gov.sg' : liveError ? `Sample (${liveError.slice(0, 60)})` : 'Sample data'}
    </span>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-slate-200/60" />
        ))}
      </div>
      <div className="h-24 rounded-xl bg-slate-200/60" />
      <div className="h-[440px] rounded-xl bg-slate-200/60" />
    </div>
  )
}
