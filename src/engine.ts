import { LookoutCache, cacheKey, defaultCacheDir } from './cache.ts';
import { extractFromHtml } from './extract.ts';
import { webFetch } from './fetch.ts';
import { checkRobotsAllowed } from './robots.ts';
import { webSearch, filterHitsByHosts } from './search.ts';
import { webCrawl } from './crawl.ts';
import { webResearch } from './research.ts';

export type ToolEnvelope = {
  status: 'ok' | 'error';
  tool: string;
  answer?: unknown;
  evidence?: unknown;
  warnings: string[];
  route?: string;
  code?: string;
  message?: string;
};

export type EngineOptions = {
  cacheDir?: string;
};

export class LookoutEngine {
  readonly cache: LookoutCache;

  constructor(options: EngineOptions = {}) {
    this.cache = new LookoutCache(options.cacheDir ?? defaultCacheDir());
  }

  
  private cacheMaxAgeMs(): number | undefined {
    const raw = process.env.LOOKOUT_CACHE_MAX_AGE_MS?.trim();
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  async handle(tool: string, input: Record<string, unknown> = {}): Promise<ToolEnvelope> {
    switch (tool) {
      case 'web_search':
        return this.search(input);
      case 'web_fetch':
        return this.fetch(input);
      case 'web_extract':
        return this.extract(input);
      case 'web_cache':
        return this.cacheTool(input);
      case 'web_research':
        return this.research(input);
      case 'web_crawl':
        return this.crawl(input);
      default:
        return {
          status: 'error',
          tool,
          warnings: [],
          code: 'UNKNOWN_TOOL',
          message: `Unknown tool: ${tool}`,
        };
    }
  }

  private async search(input: Record<string, unknown>): Promise<ToolEnvelope> {
    const queryRaw = input.query ?? input.q;
    const queries = Array.isArray(queryRaw)
      ? queryRaw.map(String)
      : queryRaw
        ? [String(queryRaw)]
        : [];
    if (!queries.length) {
      return {
        status: 'error',
        tool: 'web_search',
        warnings: [],
        code: 'INVALID_INPUT',
        message: 'web_search requires query (string or string[])',
      };
    }
    const useCache = input.useCache !== false;
    const allHits = [];
    const warnings: string[] = [];
    const engines = [];
    for (const q of queries) {
      const key = cacheKey(['search', q]);
      if (useCache) {
        const cached = this.cache.get(key, { maxAgeMs: this.cacheMaxAgeMs() });
        if (cached) {
          const parsed = JSON.parse(cached.body) as Awaited<ReturnType<typeof webSearch>>;
          allHits.push(...parsed.hits.map((h) => ({ ...h, fromCache: true })));
          warnings.push(...parsed.warnings.map((w) => `[cache] ${w}`));
          engines.push(...parsed.engines);
          continue;
        }
      }
      const result = await webSearch(q);
      this.cache.put({
        key,
        kind: 'search',
        query: q,
        body: JSON.stringify(result),
        meta: { engines: result.engines },
      });
      allHits.push(...result.hits);
      warnings.push(...result.warnings);
      engines.push(...result.engines);
    }
    const includeHosts = Array.isArray(input.hostsInclude)
      ? input.hostsInclude.map(String)
      : input.hostInclude
        ? [String(input.hostInclude)]
        : [];
    const excludeHosts = Array.isArray(input.hostsExclude)
      ? input.hostsExclude.map(String)
      : input.hostExclude
        ? [String(input.hostExclude)]
        : [];
    let hits = allHits;
    const filterWarnings: string[] = [];
    if (includeHosts.length || excludeHosts.length) {
      const before = hits.length;
      hits = filterHitsByHosts(hits, { include: includeHosts, exclude: excludeHosts });
      filterWarnings.push(
        `host_filter kept ${hits.length}/${before} (include=${includeHosts.join(',') || '*'}; exclude=${excludeHosts.join(',') || 'none'})`,
      );
    }
    return {
      status: hits.length ? 'ok' : 'error',
      tool: 'web_search',
      answer: {
        queries,
        hits,
        engines,
        hostsInclude: includeHosts.length ? includeHosts : undefined,
        hostsExclude: excludeHosts.length ? excludeHosts : undefined,
      },
      warnings: [...warnings, ...filterWarnings],
      route: 'local_adapters',
      code: hits.length ? undefined : 'NO_HITS',
      message: hits.length ? undefined : 'No search hits from local adapters',
    };
  }

  private async fetch(input: Record<string, unknown>): Promise<ToolEnvelope> {
    const url = String(input.url ?? '');
    if (!url) {
      return {
        status: 'error',
        tool: 'web_fetch',
        warnings: [],
        code: 'INVALID_INPUT',
        message: 'web_fetch requires url',
      };
    }
    const useCache = input.useCache !== false;
    const respectRobots = input.respectRobots === true; // default off for fetch (crawl defaults on)
    const key = cacheKey(['fetch', url, respectRobots ? 'robots' : 'norobots']);
    if (useCache) {
      const cached = this.cache.get(key, { maxAgeMs: this.cacheMaxAgeMs() });
      if (cached) {
        return {
          status: 'ok',
          tool: 'web_fetch',
          answer: { ...JSON.parse(cached.body), fromCache: true },
          warnings: ['served_from_cache'],
          route: 'cache',
        };
      }
    }
    if (respectRobots) {
      const robots = await checkRobotsAllowed(url, { respectRobots: true });
      if (!robots.allowed) {
        return {
          status: 'error',
          tool: 'web_fetch',
          warnings: [robots.warning ?? 'robots.txt disallow'],
          code: 'ROBOTS_DISALLOW',
          message: robots.warning ?? 'Blocked by robots.txt',
          route: 'robots.txt',
        };
      }
    }
    const result = await webFetch(url, {
      maxBytes: typeof input.maxBytes === 'number' ? input.maxBytes : undefined,
      timeoutMs: typeof input.timeoutMs === 'number' ? input.timeoutMs : undefined,
    });
    if (result.ok && result.body) {
      this.cache.put({
        key,
        kind: 'fetch',
        url: result.finalUrl,
        contentType: result.contentType,
        body: JSON.stringify(result),
      });
    }
    // cite span: first 240 chars of body
    const excerpt = result.body?.slice(0, 240) ?? '';
    const spans = excerpt
      ? [{ text: excerpt, start: 0, end: excerpt.length, kind: 'body_prefix' }]
      : [];
    return {
      status: result.ok ? 'ok' : 'error',
      tool: 'web_fetch',
      answer: { ...result, spans },
      warnings: result.warnings,
      route: result.route,
      code: result.code,
      message: result.message,
    };
  }

  private async extract(input: Record<string, unknown>): Promise<ToolEnvelope> {
    let html = typeof input.html === 'string' ? input.html : undefined;
    let url = typeof input.url === 'string' ? input.url : undefined;
    if (!html && url) {
      const fetched = await this.fetch({ url, useCache: input.useCache });
      if (fetched.status !== 'ok') return { ...fetched, tool: 'web_extract' };
      const body = (fetched.answer as { body?: string })?.body;
      html = body;
      url = (fetched.answer as { finalUrl?: string })?.finalUrl ?? url;
      if (!input.contentType) {
        const ct = (fetched.answer as { contentType?: string })?.contentType;
        if (ct) input = { ...input, contentType: ct };
      }
    }
    if (!html) {
      return {
        status: 'error',
        tool: 'web_extract',
        warnings: [],
        code: 'INVALID_INPUT',
        message: 'web_extract requires html or url',
      };
    }
    // JSON bodies: light local extract without HTML DOM
    const looksJson =
      (typeof input.contentType === 'string' && input.contentType.includes('application/json')) ||
      /^\s*[\[{]/.test(html);
    if (looksJson && !/<html[\s>]/i.test(html) && !/<body[\s>]/i.test(html)) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(html);
      } catch {
        // keep as text
      }
      const text = typeof parsed === 'string' ? parsed : JSON.stringify(parsed ?? html).slice(0, 4000);
      return {
        status: 'ok',
        tool: 'web_extract',
        answer: {
          ok: true,
          url,
          textExcerpt: text,
          headings: [],
          links: [],
          jsonLd: parsed && typeof parsed === 'object' ? [parsed] : [],
          tables: [],
          spans: text
            ? [{ text: text.slice(0, 240), start: 0, end: Math.min(240, text.length), kind: 'json_excerpt' }]
            : [],
          route: 'json_body',
          warnings: parsed ? [] : ['json_parse_failed_used_raw_text'],
        },
        warnings: parsed ? [] : ['json_parse_failed_used_raw_text'],
        route: 'json_body',
      };
    }
    const ct = typeof input.contentType === 'string' ? input.contentType : '';
    if ((ct.includes('text/plain') || ct.includes('text/markdown')) && !/<html[\s>]/i.test(html) && !/<body[\s>]/i.test(html)) {
      const text = html.slice(0, 4000);
      return {
        status: 'ok',
        tool: 'web_extract',
        answer: {
          ok: true,
          url,
          textExcerpt: text,
          headings: [],
          links: [],
          jsonLd: [],
          tables: [],
          spans: text
            ? [{ text: text.slice(0, 240), start: 0, end: Math.min(240, text.length), kind: 'text_excerpt' }]
            : [],
          route: ct.includes('markdown') ? 'text_markdown' : 'text_plain',
          warnings: [],
        },
        warnings: [],
        route: ct.includes('markdown') ? 'text_markdown' : 'text_plain',
      };
    }
    const extracted = extractFromHtml(html, url);
    return {
      status: 'ok',
      tool: 'web_extract',
      answer: extracted,
      warnings: extracted.warnings,
      route: extracted.route,
    };
  }


  
  private async research(input: Record<string, unknown>): Promise<ToolEnvelope> {
    const query = typeof input.query === 'string' ? input.query : Array.isArray(input.query) ? input.query.join(' ') : '';
    if (!query.trim()) {
      return {
        status: 'error',
        tool: 'web_research',
        code: 'INVALID_INPUT',
        message: 'web_research requires query',
        warnings: [],
      };
    }
    const maxPages = typeof input.maxPages === 'number' ? input.maxPages : undefined;
    const hostsInclude = Array.isArray(input.hostsInclude)
      ? input.hostsInclude.map(String)
      : input.hostInclude
        ? [String(input.hostInclude)]
        : [];
    const hostsExclude = Array.isArray(input.hostsExclude)
      ? input.hostsExclude.map(String)
      : input.hostExclude
        ? [String(input.hostExclude)]
        : [];
    const result = await webResearch(query, {
      maxPages,
      hostsInclude: hostsInclude.length ? hostsInclude : undefined,
      hostsExclude: hostsExclude.length ? hostsExclude : undefined,
    });
    return {
      status: 'ok',
      tool: 'web_research',
      answer: {
        ...result,
        hostsInclude: hostsInclude.length ? hostsInclude : undefined,
        hostsExclude: hostsExclude.length ? hostsExclude : undefined,
      },
      evidence: result.pages.flatMap((p) =>
        (p.spans ?? []).map((s) => ({ url: p.url, kind: s.kind, text: s.text })),
      ),
      warnings: result.warnings,
      route: result.route,
    };
  }

  private async crawl(input: Record<string, unknown>): Promise<ToolEnvelope> {
    const url = String(input.url ?? input.seed ?? '');
    if (!url) {
      return {
        status: 'error',
        tool: 'web_crawl',
        warnings: [],
        code: 'INVALID_INPUT',
        message: 'web_crawl requires url',
      };
    }
    const result = await webCrawl(url, {
      maxDepth: typeof input.maxDepth === 'number' ? input.maxDepth : undefined,
      maxPages: typeof input.maxPages === 'number' ? input.maxPages : undefined,
    });
    return {
      status: result.ok ? 'ok' : 'error',
      tool: 'web_crawl',
      answer: result,
      warnings: result.warnings,
      route: result.route,
      code: result.ok ? undefined : 'CRAWL_FAILED',
    };
  }

  private cacheTool(input: Record<string, unknown>): ToolEnvelope {
    const op = String(input.op ?? input.operation ?? 'query');
    if (op === 'stats') {
      return {
        status: 'ok',
        tool: 'web_cache',
        answer: this.cache.stats(),
        warnings: [],
        route: 'cache',
      };
    }
    if (op === 'clear') {
      return {
        status: 'ok',
        tool: 'web_cache',
        answer: this.cache.clear(),
        warnings: [],
        route: 'cache',
      };
    }
    if (op === 'prune') {
      const maxAgeMs =
        typeof input.maxAgeMs === 'number'
          ? input.maxAgeMs
          : this.cacheMaxAgeMs() ?? 86_400_000;
      return {
        status: 'ok',
        tool: 'web_cache',
        answer: { ...this.cache.pruneExpired(maxAgeMs), maxAgeMs },
        warnings: [],
        route: 'cache',
      };
    }
    const q = String(input.query ?? '');
    const limit = typeof input.limit === 'number' ? input.limit : 20;
    const results = this.cache.query(q, limit).map((r) => ({
      key: r.key,
      kind: r.kind,
      createdAt: r.createdAt,
      url: r.url,
      query: r.query,
      contentType: r.contentType,
      preview: r.body.slice(0, 200),
    }));
    return {
      status: 'ok',
      tool: 'web_cache',
      answer: { results, dir: this.cache.dir },
      warnings: [],
      route: 'cache',
    };
  }
}

export const CORE_TOOLS = ['web_search', 'web_fetch', 'web_extract'] as const;
export const ADVANCED_TOOLS = ['web_cache', 'web_crawl', 'web_research'] as const;
