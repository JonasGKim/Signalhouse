export interface Observation {
  date: string;
  value: number;
}
export const series = [
  {
    id: 'A191RL1Q225SBEA',
    label: 'Real GDP growth',
    category: 'Activity',
    unit: '% annualized',
    frequency: 'Quarterly',
    source: 'Bureau of Economic Analysis',
    transform: 'level',
    description:
      'Quarter-over-quarter real GDP growth, seasonally adjusted at an annual rate.',
  },
  {
    id: 'UNRATE',
    label: 'Unemployment',
    category: 'Labor',
    unit: '%',
    frequency: 'Monthly',
    source: 'Bureau of Labor Statistics',
    transform: 'level',
    description: 'U-3 unemployment rate, seasonally adjusted.',
  },
  {
    id: 'CPIAUCSL',
    label: 'Consumer inflation',
    category: 'Prices',
    unit: '% year over year',
    frequency: 'Monthly',
    source: 'Bureau of Labor Statistics',
    transform: 'yoy',
    description:
      'Calculated 12-month change in the seasonally adjusted all-items CPI.',
  },
  {
    id: 'T10Y2Y',
    label: '10Y − 2Y Treasury spread',
    category: 'Rates',
    unit: 'percentage points',
    frequency: 'Daily',
    source: 'Federal Reserve Bank of St. Louis',
    transform: 'level',
    description:
      '10-year Treasury constant maturity yield minus the 2-year yield. Negative values indicate inversion.',
  },
] as const;
export function parseObservations(csv: string): Observation[] {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .flatMap((line) => {
      const [date, raw] = line.split(',');
      const value = Number(raw);
      return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        raw?.trim() &&
        raw !== '.' &&
        Number.isFinite(value)
        ? [{ date, value }]
        : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function yearOverYear(points: Observation[]): Observation[] {
  const byMonth = new Map(points.map((p) => [p.date.slice(0, 7), p.value]));
  return points.flatMap((point) => {
    const previous = byMonth.get(
      `${Number(point.date.slice(0, 4)) - 1}${point.date.slice(4, 7)}`,
    );
    return previous === undefined || previous === 0
      ? []
      : [{ date: point.date, value: (point.value / previous - 1) * 100 }];
  });
}
export function sparkline(points: Observation[]): string {
  if (!points.length) return '';
  const values = points.map((p) => p.value),
    min = Math.min(...values),
    max = Math.max(...values),
    span = max - min || 1;
  return points
    .map(
      (p, i) =>
        `${((i / Math.max(1, points.length - 1)) * 300).toFixed(2)},${(70 - ((p.value - min) / span) * 60).toFixed(2)}`,
    )
    .join(' ');
}
