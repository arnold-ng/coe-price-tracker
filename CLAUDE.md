# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

COE Price Tracker — a React + TypeScript + Vite dashboard for Singapore COE
premiums, pulling bidding results from the data.gov.sg API. See `README.md` for
the full feature list and architecture.

## Commands

```bash
npm install
npm run dev      # local dev server (http://localhost:5173)
npm run build    # type-check (tsc -b) + production build
npm run lint     # tsc -b --noEmit
npm run preview  # serve the production build
npm run gen:sample  # regenerate the bundled sample dataset
```

Run `npm run lint` (and `npm run build` for non-trivial changes) before
committing.

## Branching

- **Start work from `main`.** `main` is the default branch and is **production**.
- Create a **`feat/<short-desc>`** branch for features or **`fix/<short-desc>`**
  branch for fixes. Don't commit directly to `main`, and don't develop on the
  auto-generated `claude/*` session branch — branch off into a `feat/`|`fix/`
  branch first.
- Open a PR into `main`; merge to `main` only when the change is ready for prod.

## Deployment (GitHub Pages)

One Pages site, split by path, published to the `gh-pages` branch by
`.github/workflows/deploy.yml`:

| Branch pushed | Deploys to | URL |
| --- | --- | --- |
| `main` | site root | `https://arnold-ng.github.io/coe-price-tracker/` (**prod**) |
| any other branch | `/staging/` | `https://arnold-ng.github.io/coe-price-tracker/staging/` (**staging**) |

So a `feat/`|`fix/` (or `claude/*`) branch automatically previews at `/staging/`,
and merging to `main` ships to prod. All non-`main` branches share the one
`/staging/` folder — the most recent push wins there.
