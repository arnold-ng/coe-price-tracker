import type { BiddingRound, CoeDataset, CoeRecord, RawCoeRecord } from '../types'
import { parseCategory } from '../lib/categories'
import { sampleRecords } from '../data/sampleData'

// data.gov.sg COE Bidding Results / Prices dataset (LTA).
// https://data.gov.sg/datasets/d_69b3380ad7e51aff3a7dcc84eba52b8a/view
const DATASET_ID = 'd_69b3380ad7e51aff3a7dcc84eba52b8a'
const API_BASE = 'https://api-open.data.gov.sg/v1/public/api/datasets'

// ---- CSV parser -----------------------------------------------------------
// data.gov.sg poll-download returns a signed URL to a CSV file.

function parseCsv(csv: string): RawCoeRecord[] {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const out: RawCoeRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    if (parts.length < headers.length) continue
    const row: Record<string, string> = {}
    headers.forEach((h, j) => { row[h] = (parts[j] ?? '').trim() })
    // Accommodate any header naming variations data.gov.sg might use.
    out.push({
      month: row['month'] ?? row['bidding_month'] ?? '',
      bidding_no: row['bidding_no'] ?? row['round'] ?? '1',
      vehicle_class: row['vehicle_class'] ?? row['category'] ?? '',
      quota: row['quota'] ?? '0',
      bids_success: row['bids_success'] ?? row['successful_bids'] ?? '0',
      bids_received: row['bids_received'] ?? row['total_bids'] ?? '0',
      premium: row['premium'] ?? row['coe_premium'] ?? '0',
    })
  }
  return out
}

// ---- New data.gov.sg API (v1 open) ----------------------------------------
// Flow: GET initiate-download → GET poll-download (retry until URL ready) →
//       fetch CSV from signed URL.

interface PollResponse {
  code: number
  errMsg?: string
  data?: { url?: string }
}

async function pollForUrl(signal?: AbortSignal): Promise<string> {
  const pollUrl = `${API_BASE}/${DATASET_ID}/poll-download`
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(pollUrl, { signal })
    if (!res.ok) throw new Error(`poll-download ${res.status}`)
    const json = (await res.json()) as PollResponse
    if (json.code === 0 && json.data?.url) return json.data.url
    // Not ready yet — wait before retrying.
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('poll-download timed out waiting for URL')
}

async function fetchViaNewApi(signal?: AbortSignal): Promise<RawCoeRecord[]> {
  // Kick off the async export job.
  await fetch(`${API_BASE}/${DATASET_ID}/initiate-download`, { signal })
  const downloadUrl = await pollForUrl(signal)
  const csvRes = await fetch(downloadUrl, { signal })
  if (!csvRes.ok) throw new Error(`CSV download ${csvRes.status}`)
  return parseCsv(await csvRes.text())
}

// ---- Record normalization --------------------------------------------------

function toNum(v: number | string | undefined): number {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

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
  out.sort((a, b) => {
    if (a.month !== b.month) return a.month < b.month ? -1 : 1
    if (a.round !== b.round) return a.round - b.round
    return a.category < b.category ? -1 : 1
  })
  return out
}

// ---- Primary entry point --------------------------------------------------

export async function loadCoeData(signal?: AbortSignal): Promise<CoeDataset> {
  try {
    const raw = await fetchViaNewApi(signal)
    const records = normalizeAll(raw)
    if (records.length === 0) throw new Error('No records parsed from API response')
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
