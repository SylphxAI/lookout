import { webSearch, type SearchHit, type SearchResult } from './search.ts';
import { webFetch, type FetchResult } from './fetch.ts';
import { extractFromHtml } from './extract.ts';

export type ResearchPage = {
  url: string;
  title?: string;
  score?: number;
  engine?: string;
  fetchOk: boolean;
  extractRoute?: string;
  textExcerpt?: string;
  headings?: { level: number; text: string }[];
  warnings: string[];
  spans?: { text: string; kind: string }[];
};

export type ResearchResult = {
  query: string;
  hits: SearchHit[];
  pages: ResearchPage[];
  warnings: string[];
  route: string;
};

export type ResearchDeps = {
  searchFn?: (query: string) => Promise<SearchResult>;
  fetchFn?: (url: string, options?: { maxBytes?: number }) => Promise<FetchResult>;
};

export async function webResearch(
  query: string,
  options: { maxPages?: number; maxBytes?: number } & ResearchDeps = {},
): Promise<ResearchResult> {
  const maxPages = Math.min(Math.max(options.maxPages ?? 3, 1), 6);
  const maxBytes = options.maxBytes ?? 512_000;
  const searchFn = options.searchFn ?? webSearch;
  const fetchFn = options.fetchFn ?? webFetch;
  const search = await searchFn(query);
  const warnings = [...(search.warnings ?? [])];
  const pages: ResearchPage[] = [];

  for (const hit of search.hits.slice(0, maxPages)) {
    const page: ResearchPage = {
      url: hit.url,
      title: hit.title,
      score: hit.score,
      engine: hit.engine,
      fetchOk: false,
      warnings: [],
    };
    try {
      const fetched = await fetchFn(hit.url, { maxBytes });
      if (!fetched.ok || !fetched.body) {
        page.warnings.push(fetched.message ?? fetched.code ?? 'fetch_failed');
        pages.push(page);
        continue;
      }
      page.fetchOk = true;
      const extracted = extractFromHtml(fetched.body, hit.url);
      page.extractRoute = extracted.route;
      page.textExcerpt = extracted.textExcerpt?.slice(0, 1200);
      page.headings = extracted.headings.slice(0, 8);
      page.spans = extracted.spans.slice(0, 6).map((s) => ({ text: s.text.slice(0, 200), kind: s.kind }));
      page.warnings.push(...extracted.warnings);
      if (!page.title && extracted.title) page.title = extracted.title;
    } catch (e) {
      page.warnings.push(e instanceof Error ? e.message : 'research_page_error');
    }
    pages.push(page);
  }

  if (pages.length === 0) warnings.push('no_research_pages');

  return {
    query,
    hits: search.hits,
    pages,
    warnings,
    route: 'search_then_extract',
  };
}
