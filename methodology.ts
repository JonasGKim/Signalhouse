export const methodology = [
  {
    id: 'hypocenter',
    name: 'Hypocenter',
    href: '/macro/',
    status: 'Original stress model · Published observations',
    source:
      'FRED at the Federal Reserve Bank of St. Louis: A191RL1Q225SBEA (BEA real GDP growth), UNRATE and CPIAUCSL (BLS), and T10Y2Y (Federal Reserve). The original seven-input Hypocenter model also uses SAHMCURRENT, BAMLH0A0HYM2, ICSA, INDPRO, PCEC96 and GDPC1. Each indicator links to its original series. Optional monthly ETF prices come from Yahoo Finance, with adjusted or unadjusted basis explicitly labeled.',
    measure:
      'GDP is quarter-over-quarter real growth at a seasonally adjusted annual rate. Unemployment is seasonally adjusted U-3. Inflation is calculated as 100 × (CPI this month / CPI the same month last year − 1). The Treasury spread is the 10-year yield minus the 2-year yield, in percentage points. Changes compare adjacent available observations. Hypocenter retains the original linear thresholds and weights: yield curve 20, Sahm rule 20, credit spreads 15, claims 15, production 10, real consumption 10 and real GDP 10. Contributions are clamped to zero through their weight; thresholds appear beside each input. Growth inputs use the same calendar period a year earlier. ETF history is rebased to 100 at the first available price in the selected period.',
    limitations:
      'Observations are published at different frequencies, can lag current conditions and may be revised. Charts use independent vertical scales and observations are evenly spaced, omitting missing dates. Daily history covers up to 252 observations; monthly history up to 60; quarterly history up to 20. The composite is a heuristic stress index, not a calibrated recession probability or trading signal. Any missing or stale input withholds the total. Freshness limits are 15 days for daily data, 21 for weekly, 75 for monthly and 200 for quarterly observations. Historical scores use current revised data and observation dates, not publication vintages; they are not a point-in-time backtest. Only complete months are included, and the three-month mean requires consecutive months. Market charts use an independent scale and do not establish causation. Failed sources are marked unavailable, never replaced with fabricated values.',
    updated:
      'Fetched on request; cached for up to 15 minutes. Observation dates and retrieval time are shown separately. Optional market prices are requested on demand and cached for five minutes, including failures.',
  },
  {
    id: 'nfa',
    name: 'Not Financial Advice',
    href: '/research/',
    status: 'Research Desk',
    source:
      'The existing Not Financial Advice research database in Notion. External references are shown when supplied in a note.',
    measure:
      'Original Stock, Ticker, Thesis, Notes, tags and page content, with recorded and last-edited timestamps. Company history groups entries by their supplied ticker or stock label.',
    limitations:
      'Independent observations may be incomplete or become outdated. Created time is the recorded date, not a verified publication date. No bullish/bearish label or recommendation is inferred. Notion is the publishing source, not a market-data provider.',
    updated: 'Source checked on request; cached for up to 60 seconds',
  },
  {
    id: 'expectations',
    name: 'Expectations',
    href: '/valuation/',
    status: 'Calculated scenarios · User inputs',
    source:
      'User-entered enterprise value, annual revenue and assumptions. The initial values are explicitly fictional illustrations. No company fundamentals or market prices are fetched.',
    measure:
      'A simplified enterprise DCF: free cash flow equals revenue × operating margin × (1 − tax rate) × (1 − reinvestment rate). Cash flows are discounted at year end; terminal value uses a constant-growth perpetuity. Bisection solves constant revenue growth from −99% to 500% annually. The sensitivity table varies margin and WACC; CSV export includes inputs, annual cash flows and terminal present value.',
    limitations:
      'The user chooses the currency and amount unit, consistent for both amounts. Margin, tax and reinvestment remain constant, including in perpetuity. Terminal reinvestment must support the assumed perpetual growth. WACC must exceed terminal growth. No independent capital expenditure, working capital, capital structure or dilution schedule is modeled. Unsuitable for financial firms or negative cash flows. Results are conditional scenarios, not investment recommendations or unique fair values.',
    updated:
      'Calculated locally when the form is submitted. Results are hidden whenever inputs change.',
  },
  {
    id: 'filings',
    name: 'Filings',
    href: '/filings/',
    status: 'Local text comparison',
    source:
      'Text pasted by the user or read from local UTF-8 .txt files. SEC EDGAR search opens separately to locate original disclosures. Automated SEC document retrieval is not connected.',
    measure:
      'A line-based comparison labels added, removed and unchanged passages. Leading/trailing whitespace, repeated spaces and empty lines are normalized. Comparison runs in a browser worker; documents are not uploaded or persisted.',
    limitations:
      'Compare the same section from two filing periods. File formatting, reordering and line wrapping can create apparent changes. The tool does not verify authorship, extract PDF/HTML, align SEC sections or assess economic materiality. Up to 500,000 characters per document; exceptionally large edits stop with an explicit error. Read the original filings before drawing conclusions.',
    updated: 'Calculated on demand from the supplied documents',
  },
] as const;
