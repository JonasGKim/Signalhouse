# Integration boundaries

- Shared Astro layouts, semantic color/type tokens, header, tool navigation and footer remain the product foundation. `src/styles/tools.css` adds working-tool density and accessible form states without changing the homepage narrative.
- Research: `src/lib/server/notion.ts` owns server-only SDK access. `src/data/research.ts` is the sanitized presentation contract. Arbitrary page IDs cannot retrieve private Notion content.
- Macro: `src/lib/server/macro.ts` owns allowlisted FRED requests, timeouts and bounded caching. `src/lib/macro/series.ts` owns parsing and transformations. Dates are source observation dates; checked time is shown separately. `src/lib/macro/hypocenter.ts` preserves the original model weights and thresholds with explicit missing/stale-input handling. `/api/market-history/` allowlists the original 12 ETFs and labels adjusted/unadjusted Yahoo prices. Provider failures never supply sample values.
- Valuation: pure calculations live in `src/lib/valuation/model.ts`; `src/scripts/valuation.ts` handles form/output state and CSV. Every result is invalidated after inputs change. No market-data API is implied.
- Filings: pure normalized line comparison lives in `src/lib/filings/compare.ts`; a browser worker performs bounded diff computation. DOM output is plain text. Documents never leave the browser. SEC EDGAR opens as a separate original-source search, not an integrated filing feed.
- Methodology: `src/data/methodology.ts` owns disclosures. Change source definitions, formulas, provenance and limitations together with the relevant feature.
- Hosting: Vercel is the default; `DEPLOY_TARGET=cloudflare` preserves the existing Sites path. Server secrets are configured through the hosting provider and excluded from source/deployment archives.
- Accounts: no authentication or personal database feature is part of the current public product, so there are no Supabase schema changes or migrations to apply.

## Recovered source provenance

The original Hypocenter implementation was recovered through the authenticated Vercel owner API from project `hypocenter-terminal`, deployment `dpl_Bf9oAL5X8h5c9BvQ4jWCxz9DnSzc`: the root page, market-context API and methodology. The seven indicator weights, linear thresholds and 12-ETF universe are preserved. The new native Astro integration corrects missing-input totals and date alignment, adds bounded requests, and discloses revised historical data. No credentials were copied from deployment source.
