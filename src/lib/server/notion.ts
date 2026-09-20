import { getSecret } from 'astro:env/server';
import {
  Client,
  isFullDatabase,
  isFullPage,
  isFullBlock,
} from '@notionhq/client';
import type {
  PageObjectResponse,
  RichTextItemResponse,
  BlockObjectResponse,
} from '@notionhq/client';
import {
  newestFirst,
  safeUrl,
  type ResearchEntry,
  type ResearchBlock,
  type ResearchText,
} from '../../data/research';

type Library = {
  entries: ResearchEntry[];
  status: 'ready' | 'unavailable' | 'unconfigured';
  checkedAt: string;
};
// Only completed, sanitized values are cached. Never share request-bound promises across Worker requests.
let cache: { value: Library; expires: number } | undefined;
function client() {
  const token = getSecret('NOTION_API_KEY');
  return token
    ? new Client({ auth: token, timeoutMs: 12000, logger: () => {} })
    : undefined;
}
const plain = (text: RichTextItemResponse[] = []) =>
  text
    .map((t) => t.plain_text)
    .join('')
    .trim();
function propertyText(p: PageObjectResponse['properties'][string] | undefined) {
  if (!p) return '';
  return p.type === 'title'
    ? plain(p.title)
    : p.type === 'rich_text'
      ? plain(p.rich_text)
      : '';
}
function mapEntry(page: PageObjectResponse): ResearchEntry {
  const p = page.properties;
  const categories = Object.entries(p).flatMap(([key, value]) => {
    if (!/^(category|categories|topic|topics|tags)$/i.test(key)) return [];
    if (value.type === 'select') return value.select ? [value.select.name] : [];
    if (value.type === 'multi_select')
      return value.multi_select.map((v) => v.name);
    return [];
  });
  const company = propertyText(p.Stock);
  const thesis = propertyText(p.Thesis);
  const suppliedTicker = propertyText(p.Ticker).trim();
  const ticker = (
    suppliedTicker ||
    (/^[a-zA-Z]{1,6}(?:[.-][a-zA-Z]{1,2})?$/.test(company) ? company : '')
  ).toUpperCase();
  return {
    id: page.id,
    ticker,
    company,
    thesis,
    notes: propertyText(p.Notes),
    title: thesis || company || ticker || 'Research note',
    categories,
    sources: Object.values(p).flatMap((value) =>
      value.type === 'url' && safeUrl(value.url ?? undefined)
        ? [{ label: 'Source reference', url: safeUrl(value.url ?? undefined)! }]
        : [],
    ),
    conviction:
      p.Conviction?.type === 'select' ? p.Conviction.select?.name : undefined,
    publishedAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}
export async function getResearch(): Promise<Library> {
  if (cache && cache.expires > Date.now()) return cache.value;
  const notion = client();
  const databaseId = getSecret('NOTION_DATABASE_ID');
  const checkedAt = new Date().toISOString();
  if (!notion || !databaseId)
    return { entries: [], status: 'unconfigured', checkedAt };
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    if (!isFullDatabase(database) || !database.data_sources.length)
      throw new Error('Unavailable');
    const entries: ResearchEntry[] = [];
    for (const source of database.data_sources) {
      let cursor: string | undefined;
      do {
        const response = await notion.dataSources.query({
          data_source_id: source.id,
          start_cursor: cursor,
          page_size: 100,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        });
        entries.push(
          ...response.results
            .filter(isFullPage)
            .filter((p) => !p.in_trash)
            .map(mapEntry),
        );
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    }
    const value: Library = {
      entries: newestFirst([
        ...new Map(entries.map((e) => [e.id, e])).values(),
      ]),
      status: 'ready',
      checkedAt,
    };
    cache = { value, expires: Date.now() + 60000 };
    return value;
  } catch {
    // Do not log SDK errors: they can include request details and credentials.
    return { entries: [], status: 'unavailable', checkedAt };
  }
}
function text(items: RichTextItemResponse[] = []): ResearchText[] {
  return items.map((t) => ({
    text: t.plain_text,
    href: safeUrl(t.href ?? undefined),
    bold: t.annotations.bold,
    italic: t.annotations.italic,
    code: t.annotations.code,
    strike: t.annotations.strikethrough,
  }));
}
async function blocks(
  notion: Client,
  id: string,
  depth = 0,
): Promise<ResearchBlock[]> {
  if (depth > 12) throw new Error('Document nesting limit');
  const result: ResearchBlock[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: id,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const b of response.results.filter(isFullBlock)) {
      const content = b[b.type as keyof BlockObjectResponse] as unknown as {
        rich_text?: RichTextItemResponse[];
        caption?: RichTextItemResponse[];
        external?: { url: string };
        file?: { url: string };
        url?: string;
        checked?: boolean;
        cells?: RichTextItemResponse[][];
      };
      result.push({
        id: b.id,
        type: b.type,
        text: text(content?.rich_text),
        url: safeUrl(
          content?.external?.url ?? content?.file?.url ?? content?.url,
        ),
        caption: plain(content?.caption),
        checked: content?.checked,
        cells: content?.cells?.map(text),
        children: b.has_children ? await blocks(notion, b.id, depth + 1) : [],
      });
    }
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);
  return result;
}
export async function getResearchBody(
  id: string,
): Promise<{ blocks: ResearchBlock[]; available: boolean }> {
  // Membership check prevents arbitrary private Notion page retrieval via route IDs.
  const library = await getResearch();
  if (!library.entries.some((e) => e.id === id))
    return { blocks: [], available: false };
  try {
    const notion = client();
    if (!notion) throw new Error('Unavailable');
    return { blocks: await blocks(notion, id), available: true };
  } catch {
    return { blocks: [], available: false };
  }
}
