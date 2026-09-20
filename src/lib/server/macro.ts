import {
  parseObservations,
  yearOverYear,
  series,
  type Observation,
} from '../macro/series';
import { indicators, snapshot, composite, history } from '../macro/hypocenter';
export interface MacroResult {
  id: string;
  status: 'ready' | 'unavailable';
  observations: Observation[];
  checkedAt: string;
}
const cache = new Map<string, { expires: number; value: MacroResult }>();
const allowed = new Set<string>([
  ...series.map((s) => s.id),
  ...indicators.map((s) => s.id),
]);
export async function getFredSeries(id: string): Promise<MacroResult> {
  if (!allowed.has(id)) throw new Error('Unknown series');
  const stored = cache.get(id);
  if (stored && stored.expires > Date.now()) return stored.value;
  const checkedAt = new Date().toISOString();
  try {
    const start = `${new Date().getUTCFullYear() - 21}-01-01`;
    const response = await fetch(
      `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${start}`,
      { signal: AbortSignal.timeout(10000), redirect: 'error' },
    );
    if (!response.ok) throw new Error('Source unavailable');
    const csv = await response.text();
    if (csv.length > 500000 || !csv.startsWith('observation_date,'))
      throw new Error('Unexpected source');
    const observations = parseObservations(csv);
    if (!observations.length) throw new Error('No observations');
    const value: MacroResult = { id, status: 'ready', observations, checkedAt };
    cache.set(id, { expires: Date.now() + 900000, value });
    return value;
  } catch {
    const value: MacroResult = {
      id,
      status: 'unavailable',
      observations: [],
      checkedAt,
    };
    cache.set(id, { expires: Date.now() + 30000, value });
    return value;
  }
}
export async function getMacro(): Promise<MacroResult[]> {
  return Promise.all(
    series.map(async (item) => {
      const raw = await getFredSeries(item.id);
      return item.transform === 'yoy'
        ? { ...raw, observations: yearOverYear(raw.observations) }
        : raw;
    }),
  );
}
export async function getHypocenter() {
  const raw = await Promise.all(
    indicators.map((item) => getFredSeries(item.id)),
  );
  const map = new Map(raw.map((item) => [item.id, item.observations]));
  const cutoff = new Date().toISOString().slice(0, 10);
  const rows = indicators.map((def) => ({
    ...def,
    ...snapshot(def, map.get(def.id) ?? [], cutoff),
  }));
  return {
    rows,
    score: composite(rows.map((r) => r.points)),
    history: history(map),
    checkedAt: raw.map((r) => r.checkedAt).sort()[0],
  };
}
