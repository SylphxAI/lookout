import { webSearch, filterHitsByHosts, type SearchHit, type SearchResult } from './search.ts';
import { webFetch, type FetchResult } from './fetch.ts';
import { extractFromHtml, type CiteSpan } from './extract.ts';

export type ResearchPageStatus = 'ok' | 'partial' | 'error';

export type ResearchPage = {
  url: string;
  finalUrl?: string;
  title?: string;
  score?: number;
  engine?: string;
  status: ResearchPageStatus;
  fetchOk: boolean;
  httpStatus?: number;
  contentType?: string;
  truncated?: boolean;
  redirects?: string[];
  fetchCode?: string;
  extractOk?: boolean;
  extractRoute?: string;
  textExcerpt?: string;
  headings?: { level: number; text: string }[];
  warnings: string[];
  spans?: CiteSpan[];
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
  options: {
    maxPages?: number;
    maxBytes?: number;
    hostsInclude?: string[];
    hostsExclude?: string[];
  } & ResearchDeps = {},
): Promise<ResearchResult> {
  const normalizedQuery = query.trim();
  const maxPages = Math.min(Math.max(options.maxPages ?? 3, 1), 6);
  const maxBytes = options.maxBytes ?? 512_000;
  const searchFn = options.searchFn ?? webSearch;
  const fetchFn = options.fetchFn ?? webFetch;
  let search: SearchResult;
  try {
    search = await searchFn(normalizedQuery);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'search_failed';
    return {
      query: normalizedQuery,
      hits: [],
      pages: [],
      warnings: [`search_failed: ${message}`],
      route: 'search_then_extract',
    };
  }
  const warnings = [...(search.warnings ?? [])];
  let hits = search.hits;
  if ((options.hostsInclude?.length ?? 0) > 0 || (options.hostsExclude?.length ?? 0) > 0) {
    const before = hits.length;
    hits = filterHitsByHosts(hits, {
      include: options.hostsInclude,
      exclude: options.hostsExclude,
    });
    warnings.push(
      `host_filter kept ${hits.length}/${before} for research (include=${(options.hostsInclude ?? []).join(',') || '*'}; exclude=${(options.hostsExclude ?? []).join(',') || 'none'})`,
    );
  }
  const pages: ResearchPage[] = [];

  for (const hit of hits.slice(0, maxPages)) {
    const page: ResearchPage = {
      url: hit.url,
      title: hit.title,
      score: hit.score,
      engine: hit.engine,
      status: 'error',
      fetchOk: false,
      warnings: [],
    };
    try {
      const fetched = await fetchFn(hit.url, { maxBytes });
      page.finalUrl = fetched.finalUrl;
      page.httpStatus = fetched.status;
      page.contentType = fetched.contentType;
      page.truncated = fetched.truncated;
      page.redirects = fetched.redirects;
      page.fetchCode = fetched.code;
      page.warnings.push(...(fetched.warnings ?? []));
      if (!fetched.ok || typeof fetched.body !== 'string') {
        const failure = fetched.message ?? fetched.code ?? 'fetch_failed';
        if (!page.warnings.includes(failure)) page.warnings.push(failure);
        pages.push(page);
        continue;
      }
      page.fetchOk = true;
      const extracted = extractFromHtml(fetched.body, fetched.finalUrl || hit.url);
      page.extractOk = extracted.ok;
      page.extractRoute = extracted.route;
      page.textExcerpt = extracted.textExcerpt?.slice(0, 1200);
      page.headings = extracted.headings.slice(0, 8);
      page.spans = extracted.spans.slice(0, 8).map((s) => ({
        ...s,
        text: s.text.slice(0, 280),
      }));
      page.warnings.push(...extracted.warnings);
      if (!page.title && extracted.title) page.title = extracted.title;
      page.status = page.spans.length > 0 && !page.truncated && extracted.warnings.length === 0
        ? 'ok'
        : 'partial';
    } catch (e) {
      page.status = 'error';
      page.extractOk = false;
      page.warnings.push(e instanceof Error ? e.message : 'research_page_error');
    }
    pages.push(page);
  }

  if (pages.length === 0) warnings.push('no_research_pages');

  return {
    query: normalizedQuery,
    hits,
    pages,
    warnings,
    route: 'search_then_extract',
  };
}
