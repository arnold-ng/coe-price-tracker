// Renders the running dashboard headlessly and saves screenshots.
// Usage: node scripts/screenshot.mjs <baseUrl>
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

// Resolve playwright whether it's a local dep or only installed globally.
function loadChromium() {
  const require = createRequire(import.meta.url)
  try {
    return require('playwright').chromium
  } catch {
    const root = execSync('npm root -g').toString().trim()
    return createRequire(root + '/').call(null, 'playwright').chromium
  }
}
const chromium = loadChromium()
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:5174'
const outDir = '/tmp/coe-shots'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()

async function shot(name, query, { width = 1280, height = 900, action } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
  await page.goto(base + query, { waitUntil: 'networkidle' })
  // Wait for the recharts SVG to render.
  await page.waitForSelector('svg.recharts-surface', { timeout: 15000 }).catch(() => {})
  if (action) await action(page)
  await page.waitForTimeout(700)
  const path = `${outDir}/${name}.png`
  await page.screenshot({ path, fullPage: true })
  console.log('saved', path)
  await page.close()
}

// 1. Default desktop view (Cat A & B, last 6 years)
await shot('01-default', '')

// 2. All categories + oversubscription + 3-exercise MA overlays
await shot('02-overlays', '?cats=ABCDE&ys=2018&ye=2026&rounds=12&mode=timeline&ma=3&os=1&q=0')

// 3. Seasonal year-over-year view for Cat B
await shot('03-seasonal', '?cats=B&ys=2019&ye=2026&rounds=12&mode=seasonal&ma=0&os=0&q=0')

// 4. Mobile width (what it looks like on a phone)
await shot('04-mobile', '?cats=AB&ys=2020&ye=2026&rounds=12&mode=timeline&ma=0&os=1&q=0', {
  width: 390,
  height: 1400,
})

await browser.close()
console.log('done')
