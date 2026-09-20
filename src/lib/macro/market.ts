import type { Observation } from './series.ts';
/** Asset universe retained from Hypocenter's original market-context tool. */
export const assets = [
  ['SPY', 'S&P 500'],
  ['XLK', 'Information technology'],
  ['XLF', 'Financials'],
  ['XLV', 'Health care'],
  ['XLY', 'Consumer discretionary'],
  ['XLP', 'Consumer staples'],
  ['XLC', 'Communication services'],
  ['XLE', 'Energy'],
  ['XLI', 'Industrials'],
  ['XLB', 'Materials'],
  ['XLU', 'Utilities'],
  ['XLRE', 'Real estate'],
] as const;
export function parseMarketHistory(data: unknown): {
  points: Observation[];
  basis: string;
} {
  const result = (
    data as {
      chart?: {
        result?: {
          timestamp?: number[];
          indicators?: {
            adjclose?: { adjclose?: unknown[] }[];
            quote?: { close?: unknown[] }[];
          };
        }[];
      };
    }
  )?.chart?.result?.[0];
  const timestamps = result?.timestamp,
    adjusted = result?.indicators?.adjclose?.[0]?.adjclose;
  const values = adjusted ?? result?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(timestamps) || !Array.isArray(values))
    throw new Error('No price history');
  const points = timestamps
    .flatMap((timestamp, i) => {
      const value = values[i];
      if (
        typeof timestamp !== 'number' ||
        !Number.isFinite(timestamp) ||
        timestamp < 0 ||
        timestamp > 1e11 ||
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value <= 0
      )
        return [];
      return [
        { date: new Date(timestamp * 1000).toISOString().slice(0, 10), value },
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!points.length) throw new Error('No price history');
  return { points, basis: adjusted ? 'Adjusted close' : 'Unadjusted close' };
}
export function rebase(points: Observation[]): Observation[] {
  const base = points[0]?.value;
  return base && base > 0
    ? points.map((p) => ({ ...p, value: (p.value / base) * 100 }))
    : [];
}
