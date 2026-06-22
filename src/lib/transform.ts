import type { CategoryCode, CoeRecord, FilterState } from '../types'
import { movingAverage, percentileRank, mean, median, min, max, stdDev } from './stats'

// Filter the full record set down to the active selection.
export function filterRecords(records: CoeRecord[], f: FilterState): CoeRecord[] {
  return records.filter(
    (r) =>
      f.categories.includes(r.category) &&
      r.year >= f.yearStart &&
      r.year <= f.yearEnd &&
      f.rounds.includes(r.round),
  )
}

export interface YearBounds {
  minYear: number
  maxYear: number
}

export function yearBounds(records: CoeRecord[]): YearBounds {
  if (records.length === 0) {
    const y = new Date().getFullYear()
    return { minYear: y - 10, maxYear: y }
  }
  let lo = Infinity
  let hi = -Infinity
  for (const r of records) {
    if (r.year < lo) lo = r.year
    if (r.year > hi) hi = r.year
  }
  return { minYear: lo, maxYear: hi }
}

// One row per bidding exercise (month + round) for the timeline chart.
export type TimelineRow = Record<string, number | string | null>

export function buildTimelineRows(records: CoeRecord[], f: FilterState): TimelineRow[] {
  const filtered = filterRecords(records, f)
  const byExercise = new Map<string, TimelineRow>()

  for (const r of filtered) {
    const key = `${r.month}#${r.round}`
    let row = byExercise.get(key)
    if (!row) {
      row = {
        key,
        sort: `${r.month}#${r.round}`,
        label: `${r.month} (${r.round})`,
        year: r.year,
        monthNum: r.monthNum,
        round: r.round,
      }
      byExercise.set(key, row)
    }
    row[r.category] = r.premium
    row[`${r.category}_os`] = Number(r.oversubscription.toFixed(2))
    row[`${r.category}_q`] = r.quota
  }

  const rows = [...byExercise.values()].sort((a, b) =>
    String(a.sort) < String(b.sort) ? -1 : 1,
  )

  // Moving average per category over the ordered exercise sequence.
  const window = f.overlays.movingAverage
  if (window) {
    for (const cat of f.categories) {
      const series = rows.map((row) => {
        const v = row[cat]
        return typeof v === 'number' ? v : NaN
      })
      const ma = movingAverage(
        series.map((v) => (Number.isNaN(v) ? 0 : v)),
        window,
      )
      rows.forEach((row, i) => {
        // Only emit MA where the underlying point exists.
        row[`${cat}_ma`] = Number.isNaN(series[i]) ? null : ma[i]
      })
    }
  }

  return rows
}

// Seasonal (Jan-Dec) overlay rows for a single category, one column per year.
export interface SeasonalRows {
  rows: TimelineRow[]
  years: number[]
}

export function buildSeasonalRows(
  records: CoeRecord[],
  category: CategoryCode,
  f: FilterState,
): SeasonalRows {
  const filtered = records.filter(
    (r) =>
      r.category === category &&
      r.year >= f.yearStart &&
      r.year <= f.yearEnd &&
      f.rounds.includes(r.round),
  )

  // monthNum -> year -> [premiums]
  const grid = new Map<number, Map<number, number[]>>()
  const years = new Set<number>()
  for (const r of filtered) {
    years.add(r.year)
    if (!grid.has(r.monthNum)) grid.set(r.monthNum, new Map())
    const yr = grid.get(r.monthNum)!
    if (!yr.has(r.year)) yr.set(r.year, [])
    yr.get(r.year)!.push(r.premium)
  }

  const rows: TimelineRow[] = []
  for (let m = 1; m <= 12; m++) {
    const row: TimelineRow = { monthNum: m }
    const yr = grid.get(m)
    for (const y of years) {
      const vals = yr?.get(y)
      row[`y${y}`] = vals && vals.length ? Math.round(mean(vals)) : null
    }
    rows.push(row)
  }
  return { rows, years: [...years].sort((a, b) => a - b) }
}

// Per-category summary for the cards. Percentile & extremes use the FULL
// history for that category, independent of the active filters.
export interface CategorySummary {
  category: CategoryCode
  latestPremium: number
  latestMonth: string
  latestRound: number
  latestOversub: number
  prevPremium: number | null
  delta: number | null
  deltaPct: number | null
  percentile: number
  allTimeMin: number
  allTimeMax: number
  allTimeMedian: number
  allTimeMean: number
  volatility: number
  hasData: boolean
}

export function buildCategorySummary(
  allRecords: CoeRecord[],
  category: CategoryCode,
): CategorySummary {
  const recs = allRecords
    .filter((r) => r.category === category)
    .sort((a, b) => (a.month === b.month ? a.round - b.round : a.month < b.month ? -1 : 1))

  if (recs.length === 0) {
    return {
      category,
      latestPremium: 0,
      latestMonth: '',
      latestRound: 1,
      latestOversub: 0,
      prevPremium: null,
      delta: null,
      deltaPct: null,
      percentile: 0,
      allTimeMin: 0,
      allTimeMax: 0,
      allTimeMedian: 0,
      allTimeMean: 0,
      volatility: 0,
      hasData: false,
    }
  }

  const premiums = recs.map((r) => r.premium)
  const latest = recs[recs.length - 1]
  const prev = recs.length > 1 ? recs[recs.length - 2] : null
  const delta = prev ? latest.premium - prev.premium : null

  return {
    category,
    latestPremium: latest.premium,
    latestMonth: latest.month,
    latestRound: latest.round,
    latestOversub: latest.oversubscription,
    prevPremium: prev?.premium ?? null,
    delta,
    deltaPct: prev && prev.premium ? (delta! / prev.premium) * 100 : null,
    percentile: percentileRank(premiums, latest.premium),
    allTimeMin: min(premiums),
    allTimeMax: max(premiums),
    allTimeMedian: median(premiums),
    allTimeMean: mean(premiums),
    volatility: stdDev(premiums.slice(-12)),
    hasData: true,
  }
}
