import type { APIRoute } from 'astro';
import { assets, parseMarketHistory } from '../../lib/macro/market';
const cache = new Map<
  string,
  { until: number; data: ReturnType<typeof parseMarketHistory> | null }
>();
export const GET: APIRoute = async ({ url }) => {
  const ticker = url.searchParams.get('ticker') ?? '';
  if (!assets.some((a) => a[0] === ticker))
    return Response.json(
      { error: 'Choose a supported asset.' },
      { status: 400 },
    );
  const stored = cache.get(ticker);
  const unavailable = () =>
    Response.json(
      {
        error:
          'The market-data source is temporarily unavailable. Try again in a few minutes. Macro observations remain available.',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' },
      },
    );
  if (stored && stored.until > Date.now())
    return stored.data
      ? Response.json(
          { ...stored.data, ticker, source: 'Yahoo Finance' },
          { headers: { 'Cache-Control': 'public, max-age=300' } },
        )
      : unavailable();
  try {
    // Original Hypocenter provider, fixed asset allowlist; no arbitrary proxy URLs.
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=20y&interval=1mo&includePrePost=false&events=div%2Csplits`,
      {
        signal: AbortSignal.timeout(12000),
        redirect: 'error',
        headers: { Accept: 'application/json' },
      },
    );
    if (!response.ok) throw new Error('Unavailable');
    const text = await response.text();
    if (text.length > 2000000) throw new Error('Source limit');
    const data = parseMarketHistory(JSON.parse(text));
    cache.set(ticker, { until: Date.now() + 300000, data });
    return Response.json(
      { ...data, ticker, source: 'Yahoo Finance' },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    );
  } catch {
    cache.set(ticker, { until: Date.now() + 300000, data: null });
    return unavailable();
  }
};
