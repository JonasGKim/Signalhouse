# Signal House

An independent research platform built with Astro 7, TypeScript, custom CSS and locally bundled DM Sans / Instrument Serif. Public tools share the original visual identity and use no React runtime.

## Run and verify

Node 24 is required. Run `npm ci`, then `npm run dev`. The dev command binds to localhost and loads the ignored `.dev.vars` file when present. Astro 7 may start a managed background server; use `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` to manage it.

Server-only configuration:

```
NOTION_API_KEY=your-existing-integration-token
NOTION_DATABASE_ID=your-existing-database-id
SITE_URL=https://your-production-origin
```

The first two names match the original Not Financial Advice project. Never prefix these with `PUBLIC_`, commit the values, or include local environment files in deployment archives. Vercel uses encrypted environment variables. `.env.example` documents the names without values. FRED needs no API key for the public CSV export used here.

- `npm test`: model math, comparison correctness and limits, macro parsing, source sanitization and scroll-state tests.
- `npm run check` / `npm run lint`: Astro and TypeScript checks (no separate ESLint configuration).
- `npm run build` / `npm run build:vercel`: production Vercel output.
- `npm run test:routes`: live Notion integration and route checks against localhost; set `SIGNALHOUSE_URL` for a deployed origin.
- `npm run build:sites`: retained Cloudflare/Sites build. The existing `.openai/hosting.json` identity is preserved. Vercel is the primary deployment target.

## Routes

- `/`: retained material hero, four research perspectives, recent Notion research and tool index.
- `/research/`: chronological live Notion Research Desk.
- `/research/[ticker]/`: company history using supplied tickers.
- `/research/notes/[id]/`: full note, attachments and references.
- `/macro/`: recovered seven-indicator Hypocenter stress model and historical explorer, four additional FRED observation panels, and optional ETF market context.
- `/valuation/`, `/valuation/expectations/`: working reverse DCF with explicit assumptions, margin/WACC sensitivity, annual cash flows and CSV export.
- `/filings/`: local plain-text comparison with a browser worker, changes-only view and SEC EDGAR search link.
- `/methodology/`: source provenance, formulas, update behavior and limitations.
- `/about/`, `/404`: project context and missing-page state.
- `/api/health/`: returns 200 when Notion is available, otherwise 503. Does not expose secret values or note content.

## Financial data boundaries

Valuation defaults are a fictional example. Enterprise value and revenue must use the same currency/unit; rates are percentages in the interface and decimals internally. The pure model in `src/lib/valuation/model.ts` discounts year-end free cash flow and a perpetual terminal value. Operating margin, tax and reinvestment remain constant. The solver finds revenue growth conditional on those assumptions; it does not claim to infer both growth and margin from one price. This is a simplified scenario tool, unsuitable for banks or negative cash flows. The methodology page contains the formula and limitations.

Macro data comes from FRED public CSV exports: BEA real GDP growth, BLS unemployment and CPI, and the 10-year minus 2-year Treasury spread. CPI inflation is calculated using the same month one year earlier, not the twelfth available observation. Successful source results are cached for 15 minutes; failures for 30 seconds. Source failures show no replacement data. Observations can lag, differ in frequency and be revised. The original Hypocenter weights and linear thresholds are preserved in `src/lib/macro/hypocenter.ts`. Missing or stale inputs withhold the combined score. The historical index uses revised observations rather than point-in-time vintages; it is a heuristic, not a recession probability or validated backtest. The original 12-ETF universe is retained with on-demand Yahoo Finance history. The endpoint is allowlisted, bounded and cached for five minutes; rate limits produce an explicit unavailable state without synthetic prices.

Filing documents remain in the browser and are not persisted or sent to a server. The tool accepts pasted text and UTF-8 `.txt` files, up to 500,000 characters each. It normalizes whitespace and compares lines. A dedicated worker has bounded computation and a termination timeout. Results render with `textContent`, never HTML. It does not fetch SEC filings automatically, extract PDFs, identify sections or judge economic materiality. The user chooses matching sections from the original documents.

## Research and security

The original Not Financial Advice integration in `../notfinancialadvice` is already ported to the native Astro research components; no iframe or duplicated app is used. Notion access is server-only. Database/block pagination, sanitized links and membership checks prevent arbitrary private-page retrieval. Only sanitized completed index values are cached for 60 seconds. Upstream SDK errors and credentials are not logged. Detail requests refresh signed attachment links.

The site is public and has no account-specific storage, so Supabase/auth tables are not required. No unrelated Supabase project is reused or modified. A future account feature must introduce verified sessions and own-row RLS rather than storing private data in this public publishing source.

Vercel security headers prevent framing, MIME sniffing and unnecessary camera/microphone/geolocation access. Deployment excludes local configuration, `.git`, `.openai`, build caches and development output. The lockfile pins dependencies. Overrides keep the Vercel routing utility on patched `path-to-regexp` and Cloudflare's image dependency on patched `sharp`; re-evaluate when their upstream constraints are updated.

## Deployment

Production: https://signalhouse-two.vercel.app, Vercel project `signalhouse` in `jonasgkims-projects`. Configure `NOTION_API_KEY` and `NOTION_DATABASE_ID` as encrypted production variables. The Astro Vercel adapter reads them at request time. `SITE_URL` should be the final production origin; the adapter configuration also accepts Vercel's production hostname. Deploy only after the production build and checks pass. Verify `/api/health/`, research note routes, `/macro/`, valuation calculations and the comparison worker on the deployed origin.

No custom domain is required. This checkout originally had no GitHub remote. Connect/push to the intended repository when GitHub account access is available; never replace history or infer an unrelated repository.
