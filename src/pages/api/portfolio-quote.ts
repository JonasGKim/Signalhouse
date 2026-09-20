import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { holdings } from '../../data/portfolio';
const cache = new Map<string, { until: number; price: number; date: string }>();
let retryAfter = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000;
const DAILY_REQUEST_LIMIT = 16;
let requestBudget = { day: '', count: 0 };

const canRequest = () => {
  const day = new Date().toISOString().slice(0, 10);
  if (requestBudget.day !== day) requestBudget = { day, count: 0 };
  if (requestBudget.count >= DAILY_REQUEST_LIMIT) return false;
  requestBudget.count += 1;
  return true;
};
export const GET: APIRoute = async ({ url }) => {
  const ticker = url.searchParams.get('ticker') ?? '';
  if (!holdings.some((h) => h.ticker === ticker))
    return Response.json(
      { error: 'Choose a listed holding.' },
      { status: 400 },
    );
  const key = getSecret('ALPHA_VANTAGE_API_KEY');
  if (!key)
    return Response.json(
      {
        error:
          'Market quotes are not connected yet. The displayed snapshot remains available.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  const stored = cache.get(ticker);
  const success = (data: { price: number; date: string }) =>
    Response.json(
      {
        ticker,
        price: data.price,
        date: data.date,
        source: 'Alpha Vantage',
        frequency: 'end-of-day',
      },
      { headers: { 'Cache-Control': 'public, max-age=43200' } },
    );
  if (stored && stored.until > Date.now()) return success(stored);
  const unavailable = () =>
    Response.json(
      {
        error:
          'Market quotes are temporarily unavailable. Please try again later.',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' },
      },
    );
  if (retryAfter > Date.now()) return unavailable();
  if (!canRequest())
    return Response.json(
      {
        error:
          'The daily market-data refresh budget has been reached. Quotes will refresh again tomorrow.',
      },
      { status: 429, headers: { 'Cache-Control': 'no-store' } },
    );
  try {
    const query = new URLSearchParams({
      function: 'GLOBAL_QUOTE',
      symbol: ticker,
      apikey: key,
    });
    const response = await fetch(`https://www.alphavantage.co/query?${query}`, {
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error('Unavailable');
    const body = await response.json();
    const quote = body['Global Quote'];
    const price = Number(quote?.['05. price']);
    const date = quote?.['07. latest trading day'];
    if (
      quote?.['01. symbol'] !== ticker ||
      !Number.isFinite(price) ||
      price <= 0 ||
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    )
      throw new Error('Invalid quote');
    const value = { until: Date.now() + CACHE_TTL, price, date };
    cache.set(ticker, value);
    return success(value);
  } catch {
    retryAfter = Date.now() + 300000;
    return unavailable();
  }
};
