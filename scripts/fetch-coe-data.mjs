// Runs at build time in CI. Fetches the full COE Bidding Results dataset from
// data.gov.sg and writes it to public/coe-data.json so the browser never has
// to hit the API directly (avoids CORS, rate limits, and sign-URL expiry).
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'coe-data.json')

const DATASET_ID = 'd_69b3380ad7e51aff3a7dcc84eba52b8a'
const BASE = `https://api-open.data.gov.sg/v1/public/api/datasets/${DATASET_ID}`

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`)
  return res.json()
}

async function pollForUrl() {
  // Kick off the async export job.
  await fetchJson(`${BASE}/initiate-download`)

  // Poll until the signed URL is ready.
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const json = await fetchJson(`${BASE}/poll-download`)
    if (json.code === 0 && json.data?.url) return json.data.url
    console.log(`  poll attempt ${i + 1}: code=${json.code} ${json.errMsg ?? ''}`)
  }
  throw new Error('poll-download timed out after 60s')
}

// Split a single CSV line, honouring double-quoted fields that contain commas
// (e.g. bids_received is exported as "1,233" once the count passes 999).
function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur); cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV has no data rows')
  const headers = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  console.log('  CSV headers:', headers.join(', '))
  const records = []
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i])
    if (parts.length < headers.length) continue
    const row = {}
    headers.forEach((h, j) => { row[h] = (parts[j] ?? '').trim() })
    const premium = row.premium ?? row.coe_premium ?? '0'
    // Skip upcoming/placeholder rounds that data.gov.sg pre-publishes before
    // actual bidding with stub premiums like $1–$2.
    if (Number(premium.replace(/[^0-9.-]/g, '')) < 100) continue
    records.push({
      month: row.month ?? row.bidding_month ?? '',
      bidding_no: row.bidding_no ?? row.round ?? '1',
      vehicle_class: row.vehicle_class ?? row.category ?? '',
      quota: row.quota ?? '0',
      bids_success: row.bids_success ?? row.successful_bids ?? '0',
      bids_received: row.bids_received ?? row.total_bids ?? '0',
      premium,
    })
  }
  return records
}

console.log('Fetching COE data from data.gov.sg...')
try {
  const downloadUrl = await pollForUrl()
  console.log('  download URL obtained')

  const csvRes = await fetch(downloadUrl)
  if (!csvRes.ok) throw new Error(`CSV download → ${csvRes.status}`)
  const csv = await csvRes.text()
  console.log(`  downloaded ${csv.length} bytes`)

  const records = parseCsv(csv)
  console.log(`  parsed ${records.length} records`)
  if (records.length === 0) throw new Error('No records parsed — check CSV headers above')

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({ records, fetchedAt: new Date().toISOString() }))
  console.log(`Wrote ${OUT}`)
} catch (err) {
  console.error('Failed to fetch COE data:', err.message)
  console.error('The app will fall back to the bundled sample dataset.')
  process.exit(0) // non-fatal: the build continues and the app uses sample data
}
