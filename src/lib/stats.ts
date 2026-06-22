// Pure statistical helpers used by the summary cards and overlays.

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = mean(values.map((v) => (v - m) ** 2))
  return Math.sqrt(variance)
}

export function min(values: number[]): number {
  return values.length ? Math.min(...values) : 0
}

export function max(values: number[]): number {
  return values.length ? Math.max(...values) : 0
}

// Percentile rank of `value` within `population`: % of values <= value.
// Returns 0-100. Useful for "current price is at the Nth percentile".
export function percentileRank(population: number[], value: number): number {
  if (population.length === 0) return 0
  const below = population.filter((v) => v <= value).length
  return (below / population.length) * 100
}

// Trailing moving average over an ordered numeric series.
// Each output[i] is the mean of the window ending at i; nulls until the window fills.
export function movingAverage(values: number[], window: number): (number | null)[] {
  if (window <= 1) return values.slice()
  return values.map((_, i) => {
    if (i + 1 < window) return null
    const slice = values.slice(i + 1 - window, i + 1)
    return mean(slice)
  })
}
