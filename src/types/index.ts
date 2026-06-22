// Raw record shape as returned by the data.gov.sg "COE Bidding Results" datastore.
// API returns all fields as strings; we keep the raw shape loose and normalize.
export interface RawCoeRecord {
  month: string // "YYYY-MM"
  bidding_no: number | string // 1 or 2
  vehicle_class: string // "Category A".."Category E"
  quota: number | string
  bids_success?: number | string
  bids_received: number | string
  premium: number | string
}

export type CategoryCode = 'A' | 'B' | 'C' | 'D' | 'E'
export type BiddingRound = 1 | 2

// Normalized record used throughout the app.
export interface CoeRecord {
  month: string // "YYYY-MM"
  year: number
  monthNum: number // 1-12
  date: Date // first day of the bidding month
  round: BiddingRound
  category: CategoryCode
  quota: number
  bidsReceived: number
  bidsSuccess: number
  premium: number
  oversubscription: number // bidsReceived / quota
}

export type DataSource = 'live' | 'sample'

export interface CoeDataset {
  records: CoeRecord[]
  source: DataSource
  fetchedAt: Date
  liveError?: string // set when live fetch failed and sample fallback was used
}

// What overlays can be layered onto the trend chart.
export interface ChartOverlays {
  movingAverage: 0 | 3 | 6 // window length in exercises; 0 = off
  oversubscription: boolean
  quota: boolean
}

export type ChartMode = 'timeline' | 'seasonal'

export interface FilterState {
  categories: CategoryCode[]
  yearStart: number
  yearEnd: number
  rounds: BiddingRound[]
  mode: ChartMode
  overlays: ChartOverlays
}
