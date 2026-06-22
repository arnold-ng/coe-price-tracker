// Display formatters.

const sgd0 = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  maximumFractionDigits: 0,
})

export function formatSGD(value: number): string {
  return sgd0.format(value)
}

// Compact money for axis ticks: $95k, $1.2k.
export function formatSGDCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return `$${value}`
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

export function formatRatio(value: number): string {
  return `${value.toFixed(2)}x`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function monthLabel(monthNum: number): string {
  return MONTHS[monthNum - 1] ?? ''
}

// "2024-03" round 1 -> "Mar 2024 (1)"
export function exerciseLabel(month: string, round: number): string {
  const [year, mm] = month.split('-')
  return `${monthLabel(Number(mm))} ${year} (${round})`
}

export function ordinalSuffix(n: number): string {
  const v = Math.round(n)
  const s = ['th', 'st', 'nd', 'rd']
  const mod = v % 100
  return v + (s[(mod - 20) % 10] || s[mod] || s[0])
}
