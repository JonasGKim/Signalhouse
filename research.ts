/** Sanitized public presentation contract; no Notion SDK objects reach the client. */
export interface ResearchEntry {
  id: string;
  ticker: string;
  company: string;
  title: string;
  thesis: string;
  notes: string;
  publishedAt: string;
  updatedAt: string;
  categories: string[];
  conviction?: string;
  sources: { label: string; url: string }[];
}
export interface ResearchText {
  text: string;
  href?: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  strike: boolean;
}
export interface ResearchBlock {
  id: string;
  type: string;
  text: ResearchText[];
  url?: string;
  caption?: string;
  checked?: boolean;
  cells?: ResearchText[][];
  children: ResearchBlock[];
}
export function safeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function tickerSlug(ticker: string): string {
  return encodeURIComponent(ticker.trim().toLowerCase());
}
export function newestFirst(
  entries: readonly ResearchEntry[],
): ResearchEntry[] {
  return [...entries].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}
export function researchStats(entries: readonly ResearchEntry[]) {
  const dates = entries.map((e) => e.publishedAt).sort();
  return {
    count: entries.length,
    companies: new Set(
      entries.map((e) => e.ticker || e.company).filter(Boolean),
    ).size,
    categories: new Set(entries.flatMap((e) => e.categories)).size,
    first: dates[0],
    last: dates.at(-1),
  };
}
