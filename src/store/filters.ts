import { create } from 'zustand'
import type {
  BiddingRound,
  CategoryCode,
  ChartMode,
  ChartOverlays,
  FilterState,
} from '../types'
import { CATEGORY_ORDER } from '../lib/categories'

const CURRENT_YEAR = new Date().getFullYear()

const DEFAULT_STATE: FilterState = {
  categories: ['A', 'B'],
  yearStart: CURRENT_YEAR - 6,
  yearEnd: CURRENT_YEAR,
  rounds: [1, 2],
  mode: 'timeline',
  overlays: { movingAverage: 0, oversubscription: false, quota: false },
}

// ---- URL <-> state serialization (shareable links) ------------------------

export function encodeFiltersToParams(s: FilterState): URLSearchParams {
  const p = new URLSearchParams()
  p.set('cats', s.categories.join('') || '-')
  p.set('ys', String(s.yearStart))
  p.set('ye', String(s.yearEnd))
  p.set('rounds', s.rounds.join(''))
  p.set('mode', s.mode)
  p.set('ma', String(s.overlays.movingAverage))
  p.set('os', s.overlays.oversubscription ? '1' : '0')
  p.set('q', s.overlays.quota ? '1' : '0')
  return p
}

function parseCats(raw: string | null): CategoryCode[] {
  if (!raw) return DEFAULT_STATE.categories
  const valid = raw
    .toUpperCase()
    .split('')
    .filter((c): c is CategoryCode => CATEGORY_ORDER.includes(c as CategoryCode))
  return valid.length ? Array.from(new Set(valid)) : []
}

function parseRounds(raw: string | null): BiddingRound[] {
  if (!raw) return DEFAULT_STATE.rounds
  const valid = raw
    .split('')
    .map(Number)
    .filter((r): r is BiddingRound => r === 1 || r === 2)
  return valid.length ? Array.from(new Set(valid)) : DEFAULT_STATE.rounds
}

function parseYear(raw: string | null, fallback: number): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1990 && n <= 2100 ? n : fallback
}

export function decodeFiltersFromParams(p: URLSearchParams): FilterState {
  const ma = Number(p.get('ma'))
  const mode = p.get('mode')
  let ys = parseYear(p.get('ys'), DEFAULT_STATE.yearStart)
  let ye = parseYear(p.get('ye'), DEFAULT_STATE.yearEnd)
  if (ys > ye) [ys, ye] = [ye, ys]

  const overlays: ChartOverlays = {
    movingAverage: ma === 3 || ma === 6 ? ma : 0,
    oversubscription: p.get('os') === '1',
    quota: p.get('q') === '1',
  }
  return {
    categories: p.has('cats') ? parseCats(p.get('cats')) : DEFAULT_STATE.categories,
    yearStart: ys,
    yearEnd: ye,
    rounds: parseRounds(p.get('rounds')),
    mode: mode === 'seasonal' ? 'seasonal' : 'timeline',
    overlays,
  }
}

function initialState(): FilterState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  const p = new URLSearchParams(window.location.search)
  return [...p.keys()].length ? decodeFiltersFromParams(p) : DEFAULT_STATE
}

function syncUrl(s: FilterState) {
  if (typeof window === 'undefined') return
  const params = encodeFiltersToParams(s)
  const url = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState(null, '', url)
}

// ---- store ----------------------------------------------------------------

interface FilterStore extends FilterState {
  toggleCategory: (c: CategoryCode) => void
  setCategories: (c: CategoryCode[]) => void
  setYearRange: (start: number, end: number) => void
  toggleRound: (r: BiddingRound) => void
  setMode: (m: ChartMode) => void
  setMovingAverage: (w: 0 | 3 | 6) => void
  toggleOverlay: (key: 'oversubscription' | 'quota') => void
  reset: () => void
}

export const useFilterStore = create<FilterStore>((set, get) => {
  const commit = (partial: Partial<FilterState>) => {
    set(partial)
    syncUrl(get())
  }
  return {
    ...initialState(),

    toggleCategory: (c) => {
      const has = get().categories.includes(c)
      const next = has
        ? get().categories.filter((x) => x !== c)
        : [...get().categories, c].sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
      commit({ categories: next })
    },
    setCategories: (categories) => commit({ categories }),
    setYearRange: (start, end) => commit({ yearStart: Math.min(start, end), yearEnd: Math.max(start, end) }),
    toggleRound: (r) => {
      const has = get().rounds.includes(r)
      // Never allow zero rounds selected.
      const next = has ? get().rounds.filter((x) => x !== r) : [...get().rounds, r].sort()
      commit({ rounds: next.length ? (next as BiddingRound[]) : get().rounds })
    },
    setMode: (mode) => commit({ mode }),
    setMovingAverage: (movingAverage) =>
      commit({ overlays: { ...get().overlays, movingAverage } }),
    toggleOverlay: (key) =>
      commit({ overlays: { ...get().overlays, [key]: !get().overlays[key] } }),
    reset: () => commit({ ...DEFAULT_STATE }),
  }
})

export { DEFAULT_STATE }
