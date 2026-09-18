import type { Observation } from './series.ts';
/** Recovered from the user's hypocenter-terminal deployment (dpl_Bf9oAL5X8h5c9BvQ4jWCxz9DnSzc).
 * Original linear scoring functions, thresholds and weights; this is not a calibrated probability.
 */
export const indicators = [
  {
    id: 'T10Y2Y',
    label: 'Yield curve',
    weight: 20,
    mode: 'lower',
    safe: 1.5,
    danger: 0,
    unit: 'pp',
    maxAge: 15,
  },
  {
    id: 'SAHMCURRENT',
    label: 'Sahm rule',
    weight: 20,
    mode: 'higher',
    safe: 0,
    danger: 0.5,
    unit: 'pp',
    maxAge: 75,
  },
  {
    id: 'BAMLH0A0HYM2',
    label: 'High-yield credit spread',
    weight: 15,
    mode: 'higher',
    safe: 2,
    danger: 4,
    unit: '%',
    maxAge: 15,
  },
  {
    id: 'ICSA',
    label: 'Initial jobless claims',
    weight: 15,
    mode: 'higher',
    safe: 200000,
    danger: 300000,
    unit: 'claims',
    maxAge: 21,
  },
  {
    id: 'INDPRO',
    label: 'Industrial production',
    weight: 10,
    mode: 'growth',
    safe: 2,
    danger: 0,
    unit: '% YoY',
    maxAge: 75,
  },
  {
    id: 'PCEC96',
    label: 'Real personal consumption',
    weight: 10,
    mode: 'growth',
    safe: 2.5,
    danger: 0,
    unit: '% YoY',
    maxAge: 75,
  },
  {
    id: 'GDPC1',
    label: 'Real GDP',
    weight: 10,
    mode: 'growth',
    safe: 2.5,
    danger: 0,
    unit: '% YoY',
    maxAge: 200,
  },
] as const;
export type Indicator = (typeof indicators)[number];
export function scoreIndicator(
  def: Indicator,
  value: number | null,
): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const fraction =
    def.mode === 'higher'
      ? (value - def.safe) / (def.danger - def.safe)
      : (def.safe - value) / (def.safe - def.danger);
  return Math.min(Math.max(fraction * def.weight, 0), def.weight);
}
export function snapshot(
  def: Indicator,
  points: Observation[],
  cutoff: string,
) {
  const eligible = points.filter((point) => point.date <= cutoff);
  const latest = eligible.at(-1);
  if (
    !latest ||
    Date.parse(cutoff) - Date.parse(latest.date) > def.maxAge * 86400000
  )
    return { date: latest?.date, value: null, points: null };
  let value: number | null = latest.value;
  if (def.mode === 'growth') {
    const month = `${Number(latest.date.slice(0, 4)) - 1}${latest.date.slice(4, 7)}`;
    const previous = eligible.find((p) => p.date.startsWith(month));
    value =
      previous && previous.value > 0
        ? (latest.value / previous.value - 1) * 100
        : null;
  }
  return { date: latest.date, value, points: scoreIndicator(def, value) };
}
export function composite(points: (number | null)[]): number | null {
  // Never present a deceptively low or reweighted index when a source is missing.
  return points.length === indicators.length &&
    points.every((p) => p !== null && Number.isFinite(p))
    ? points.reduce<number>((sum, p) => sum + p!, 0)
    : null;
}
export interface IndexPoint {
  date: string;
  value: number;
  smoothed: number | null;
}
export function history(
  series: Map<string, Observation[]>,
  now = new Date(),
): IndexPoint[] {
  const rows: IndexPoint[] = [];
  let previousMonth = '',
    previousValues: number[] = [];
  for (let offset = 240; offset >= 1; offset--) {
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset + 1, 0),
    );
    const cutoff = end.toISOString().slice(0, 10),
      date = cutoff.slice(0, 7);
    const value = composite(
      indicators.map(
        (def) => snapshot(def, series.get(def.id) ?? [], cutoff).points,
      ),
    );
    if (value === null) {
      previousValues = [];
      previousMonth = '';
      continue;
    }
    const lastMonth = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1),
    )
      .toISOString()
      .slice(0, 7);
    if (previousMonth !== lastMonth) previousValues = [];
    previousValues.push(value);
    previousValues = previousValues.slice(-3);
    rows.push({
      date,
      value,
      smoothed:
        previousValues.length === 3
          ? previousValues.reduce((sum, v) => sum + v, 0) / 3
          : null,
    });
    previousMonth = date;
  }
  return rows;
}
