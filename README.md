# 🚗 COE Price Tracker

A dashboard for Singapore **Certificate of Entitlement (COE)** premiums. Pulls
bidding results from the public [data.gov.sg](https://data.gov.sg) API and turns
them into intuitive, toggleable visualisations.

## Features (Phase 1)

- **Summary cards** per category (A–E): latest premium, change vs last exercise,
  **all-time percentile rank** (instantly tells you if today is cheap or
  expensive), oversubscription ratio, and the all-time low/high range. Click a
  card to show/hide that category.
- **Premium trend chart** with toggles for:
  - Categories (multi-select, fixed colours across all charts)
  - Year range (single or multi-year)
  - Bidding round (1st / 2nd / both)
  - Overlays: **3- or 6-exercise moving average**, **oversubscription ratio**
    (leading demand indicator), and **quota** line
- **Seasonal (year-over-year) view** — every year overlaid on a Jan–Dec axis to
  reveal seasonal patterns.
- **Shareable URLs** — the full filter state is encoded in the URL, so any view
  can be copied and shared with one click.
- **Resilient data layer** — fetches live from data.gov.sg, and automatically
  falls back to a bundled sample dataset if the API is unreachable (a badge
  shows which source is live).

## Tech stack

React + TypeScript + Vite · Recharts · Tailwind CSS v4 · TanStack Query · Zustand

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build        # type-check + production build
npm run preview      # serve the production build
npm run gen:sample   # regenerate the bundled sample dataset
```

## Data source

[COE Bidding Results](https://data.gov.sg) (resource
`d_22094bf608253d36c0c63b52d852dd6e`). Categories: **A** (small cars), **B**
(large cars), **C** (goods vehicles & buses), **D** (motorcycles), **E** (open).

> The live API requires outbound network access to `data.gov.sg`. In sandboxed
> environments where that host is blocked, the dashboard transparently shows the
> bundled sample dataset.

## Project structure

```
src/
  api/         data.gov.sg fetch + normalization (with sample fallback)
  components/
    charts/    TrendChart, YoYChart, shared tooltip
    ui/        FilterBar, CategoryCard
  hooks/       useCoeData (TanStack Query)
  store/       Zustand filter state + URL sync
  lib/         categories, stats, transforms, formatters
  data/        generated sample dataset
  types/
scripts/       sample-data generator
```

## Roadmap (next phases)

- **Phase 2:** calendar heatmap, transparent bid-price estimator, all-time stats
  panel & volatility deep-dive.
- **Phase 3:** sortable data table + CSV export, policy/event annotation layer,
  next-exercise countdown.
