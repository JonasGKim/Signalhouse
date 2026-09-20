# Signal House audit — 7 September 2026

## Existing foundation

Astro 6 static output, eight route templates, no API routes or server adapter. Four canonical experiences: Hypocenter (macro, on hold), Not Financial Advice (empty research contract), Expectations (disabled reverse-valuation preview), Filings (disabled document comparison). Valuation overview and model page share the same shell. No live FRED, SEC, pricing feed or financial calculations are present.

Shared BaseLayout, Header, Footer, PageHeading, Metric, ProjectRow and tool-specific shells already provide useful boundaries. DM Sans Variable and Instrument Serif are bundled locally. CSS tokens define off-white surfaces, fine gray-green rules, dark ink, restrained green, two easing curves and a 1280px container. Preserve these and existing tables/controls rather than replace them with cards.

The homepage pins one WebGL canvas across four chapters. Three WebP material artworks are refracted and blended by a GPU shader; rendering occurs only on scroll/resize with capped resolution. Strong material quality, but chapters occupy a small footer while the hero copy never changes. Progress cannot rewind, which disconnects content from scroll position. Short viewports/reduced motion fall back to the first panel only; the project index provides remaining links. CSS includes desktop, tablet, mobile and short-height rules. Navigation already uses an accessible native details menu with Escape/outside-click dismissal.

## Research source

Inspected ../notfinancialadvice: Next 16 app, @notionhq/client v5, server-only src/lib/notion.ts. NOTION_API_KEY and NOTION_DATABASE_ID are configured in ignored .env.local. No source-embedded credentials found. Original mapping: Stock, Ticker, Thesis, Notes, created_time and page blocks. No required stance/category/status exists, so the Signal House bullish/bearish contract must not be imposed on the data. Original implementation queries only the first page of the first data source and first block page, displays paragraphs/images, and logs raw errors. Port the source boundary, add pagination, sanitize links, support rich block content, preserve timestamps, and distinguish unavailable from empty. Use runtime server rendering so expiring Notion image links remain fresh.

## Implementation direction

Maintain the established typography/material contrast, refocus pinned chapters around four research questions and tangible studio instruments, retain static/reduced-motion access to every chapter, and connect actual research after the sequence. Native Research Desk index, note reading routes and ticker chronology. Shared source/methodology disclosure across tools. Do not invent functionality or data for the three unfinished tools.
