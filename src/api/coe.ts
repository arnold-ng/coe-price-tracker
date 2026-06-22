import type { BiddingRound, CoeDataset, CoeRecord, RawCoeRecord } from '../types'
import { parseCategory } from '../lib/categories'
import { sampleRecords } from '../data/sampleData'

// data.gov.sg "COE Bidding Results" datastore resource.
const RESOURCE_ID = 'd_22094bf608253d36c0c63b52d852dd6e'
const DATASTORE_URL = 'https://data.gov.sg/api/action/datastore_search'
const PAGE_LIMIT = 5000

interface DatastoreResponse {
  success: boolean
  result?: {
    records: RawCoeRecord[]
    total: number
  }
}

function toNum(v: number | string | undefined): number {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Convert a raw datastore record into our normalized shape. Returns null when
// the row can't be mapped (unknown category, missing month, etc.).
export function normalizeRecord(raw: RawCoeRecord): CoeRecord | null {
  const category = parseCategory(raw.vehicle_class ?? '')
  if (!category) return null

  const month = String(raw.month ?? '').trim()
  const m = month.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const monthNum = Number(m[2])

  const roundNum = toNum(raw.bidding_no)
  const round: BiddingRound = roundNum === 2 ? 2 : 1

  const quota = toNum(raw.quota)
  const bidsReceived = toNum(raw.bids_received)
  const premium = toNum(raw.premium)

  return {
    month,
    year,
    monthNum,
    date: new Date(year, monthNum - 1, 1),
    round,
    category,
    quota,
    bidsReceived,
    bidsSuccess: toNum(raw.bids_success),
    premium,
    oversubscription: quota > 0 ? bidsReceived / quota : 0,
  }
}

function normalizeAll(raw: RawCoeRecord[]): CoeRecord[] {
  const out: CoeRecord[] = []
  for (const r of raw) {
    const n = normalizeRecord(r)
    if (n && n.premium > 0) out.push(n)
  }
  // Sort chronologically, then by round, then category.
  out.sort((a, b) => {
    if (a.month !== b.month) return a.month < b.month ? -1 : 1
    if (a.round !== b.round) return a.round - b.round
    return a.category < b.category ? -1 : 1
  })
  return out
}

async function fetchPage(offset: number, signal?: AbortSignal): Promise<DatastoreResponse> {
  const url = `${DATASTORE_URL}?resource_id=${RESOURCE_ID}&limit=${PAGE_LIMIT}&offset=${offset}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`data.gov.sg responded ${res.status}`)
  return (await res.json()) as DatastoreResponse
}

// Fetch the full COE history from data.gov.sg, paging until exhausted.
async function fetchLive(signal?: AbortSignal): Promise<RawCoeRecord[]> {
  const all: RawCoeRecord[] = []
  let offset = 0
  // Guard against runaway paging.
  for (let page = 0; page < 50; page++) {
    const data = await fetchPage(offset, signal)
    if (!data.success || !data.result) throw new Error('Unexpected API response')
    all.push(...data.result.records)
    offset += data.result.records.length
    if (data.result.records.length < PAGE_LIMIT || offset >= data.result.total) break
  }
  return all
}

// Primary entry point: try the live API, fall back to the bundled sample set.
export async function loadCoeData(signal?: AbortSignal): Promise<CoeDataset> {
  try {
    const raw = await fetchLive(signal)
    const records = normalizeAll(raw)
    if (records.length === 0) throw new Error('No records returned')
    return { records, source: 'live', fetchedAt: new Date() }
  } catch (err) {
    if (signal?.aborted) throw err
    console.warn('COE live fetch failed, using bundled sample data:', err)
    return {
      records: normalizeAll(sampleRecords),
      source: 'sample',
      fetchedAt: new Date(),
    }
  }
}
