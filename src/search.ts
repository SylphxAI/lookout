/**
 * Lightweight multi-adapter search without API keys.
 * Primary: DuckDuckGo HTML. Fallbacks: Wikipedia, npm registry, HN Algolia (no key).
 */
import { webFetch } from './fetch.ts';

export type SearchHit = {
  title: string;
  url: string;
  host?: string;
  snippet: string;
  engine: string;
  score: number;
  scoreExplain: string[];
};

export type SearchResult = {
  ok: boolean;
  query: string;
  hits: SearchHit[];
  route: string;
  warnings: string[];
  engines: { name: string; ok: boolean; message?: string }[];
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<\/?b>/gi, '');
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}


/** Unwrap DuckDuckGo redirect wrappers to the destination URL when present. */
export function normalizeResultUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // ddg redirect: https://duckduckgo.com/l/?uddg=<encoded>
    const uddg = u.searchParams.get('uddg');
    if (uddg) {
      try {
        return decodeURIComponent(uddg);
      } catch {
        return uddg;
      }
    }
    // some lite results use //duckduckgo.com/l/?kh=-1&uddg=
    if (u.hostname.includes('duckduckgo.com') && u.pathname.startsWith('/l/')) {
      const q = u.searchParams.get('uddg');
      if (q) {
        try {
          return decodeURIComponent(q);
        } catch {
          return q;
        }
      }
    }
    return raw;
  } catch {
    return raw;
  }
}

export function parseDuckDuckGoHtml(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  // classic HTML result blocks
  const re =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|td|div)>|)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = normalizeResultUrl(decodeEntities(m[1] ?? ''));
    const title = decodeEntities((m[2] ?? '').replace(/<[^>]+>/g, '')).trim();
    const snippet = decodeEntities((m[3] ?? '').replace(/<[^>]+>/g, '')).trim();
    if (!url.startsWith('http') || !title) continue;
    hits.push({
      title,
      url,
      host: hostnameOf(url),
      snippet,
      engine: 'duckduckgo_html',
      score: Math.max(0.1, 1 - hits.length * 0.05),
      scoreExplain: ['rank_position', `engine=duckduckgo_html`],
    });
    if (hits.length >= 10) break;
  }
  // lite.duckduckgo.com sometimes uses different markup
  if (hits.length === 0) {
    const liteRe = /<a[^>]+rel="nofollow"[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = liteRe.exec(html)) !== null) {
      const url = normalizeResultUrl(decodeEntities(m[1] ?? ''));
      const title = decodeEntities((m[2] ?? '').replace(/<[^>]+>/g, '')).trim();
      if (!title || title.length < 2) continue;
      if (url.includes('duckduckgo.com')) continue;
      hits.push({
        title,
        url,
        host: hostnameOf(url),
        snippet: '',
        engine: 'duckduckgo_lite',
        score: Math.max(0.1, 1 - hits.length * 0.05),
        scoreExplain: ['rank_position', 'engine=duckduckgo_lite'],
      });
      if (hits.length >= 10) break;
    }
  }
  return hits;
}

async function searchDuckDuckGo(query: string): Promise<{ hits: SearchHit[]; warning?: string }> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await webFetch(url, { timeoutMs: 15_000 });
  if (!res.ok || !res.body) {
    return { hits: [], warning: res.message ?? res.code ?? 'duckduckgo_failed' };
  }
  const hits = parseDuckDuckGoHtml(res.body);
  if (hits.length === 0) {
    return { hits: [], warning: 'duckduckgo_parse_empty' };
  }
  return { hits };
}

export function parseWikipediaOpensearch(body: string): SearchHit[] {
  const data = JSON.parse(body) as [string, string[], string[], string[]];
  const titles = data[1] ?? [];
  const snippets = data[2] ?? [];
  const urls = data[3] ?? [];
  return titles
    .map((title, i) => ({
      title,
      url: urls[i] ?? '',
      host: hostnameOf(urls[i] ?? ''),
      snippet: snippets[i] ?? '',
      engine: 'wikipedia_opensearch',
      score: Math.max(0.05, 0.7 - i * 0.08),
      scoreExplain: ['engine=wikipedia_opensearch', `rank=${i}`],
    }))
    .filter((h) => h.url.startsWith('http'));
}

async function searchWikipedia(query: string): Promise<{ hits: SearchHit[]; warning?: string }> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
  const res = await webFetch(url, { timeoutMs: 12_000 });
  if (!res.ok || !res.body) {
    return { hits: [], warning: res.message ?? 'wikipedia_failed' };
  }
  try {
    const hits = parseWikipediaOpensearch(res.body);
    return { hits };
  } catch {
    return { hits: [], warning: 'wikipedia_parse_error' };
  }
}



/** Free HN Algolia search — tech discussion without API keys. */
export function parseHnAlgoliaJson(body: string): SearchHit[] {
  try {
    const data = JSON.parse(body) as {
      hits?: Array<{ title?: string; url?: string; story_url?: string; objectID?: string; points?: number; author?: string }>;
    };
    const hits: SearchHit[] = [];
    for (const h of data.hits ?? []) {
      const title = h.title?.trim();
      if (!title) continue;
      const url =
        h.url ||
        h.story_url ||
        (h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : '');
      if (!url.startsWith('http')) continue;
      const points = typeof h.points === 'number' ? h.points : 0;
      hits.push({
        title,
        url,
        snippet: h.author ? `by ${h.author}${points ? ` · ${points} points` : ''}` : '',
        engine: 'hn_algolia',
        score: Math.min(1.2, 0.35 + Math.log10(points + 1) * 0.25),
        scoreExplain: ['engine=hn_algolia', `points=${points}`],
        host: hostnameOf(url),
      });
    }
    return hits;
  } catch {
    return [];
  }
}

async function searchHackerNews(query: string): Promise<{ hits: SearchHit[]; warning?: string }> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=6`;
  const res = await webFetch(url, { timeoutMs: 12_000 });
  if (!res.ok || !res.body) {
    return { hits: [], warning: res.message ?? res.code ?? 'hn_algolia_failed' };
  }
  const hits = parseHnAlgoliaJson(res.body);
  if (!hits.length) return { hits: [], warning: 'hn_algolia_parse_empty' };
  return { hits };
}

/** Free npm registry search — useful for agents resolving packages without API keys. */
export function parseNpmSearchJson(body: string): SearchHit[] {
  try {
    const data = JSON.parse(body) as {
      objects?: Array<{ package?: { name?: string; description?: string; links?: { npm?: string } }; score?: { final?: number } }>;
    };
    const hits: SearchHit[] = [];
    for (const obj of data.objects ?? []) {
      const pkg = obj.package;
      if (!pkg?.name) continue;
      const url = pkg.links?.npm ?? `https://www.npmjs.com/package/${pkg.name}`;
      const score = typeof obj.score?.final === 'number' ? obj.score.final : 0.5;
      hits.push({
        title: pkg.name,
        url,
        snippet: pkg.description ?? '',
        engine: 'npm_registry',
        score: Math.min(1.2, 0.4 + score),
        scoreExplain: ['engine=npm_registry', `pkg=${pkg.name}`],
        host: hostnameOf(url),
      });
    }
    return hits;
  } catch {
    return [];
  }
}

async function searchNpmRegistry(query: string): Promise<{ hits: SearchHit[]; warning?: string }> {
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=6`;
  const res = await webFetch(url, { timeoutMs: 12_000 });
  if (!res.ok || !res.body) {
    return { hits: [], warning: res.message ?? res.code ?? 'npm_registry_failed' };
  }
  const hits = parseNpmSearchJson(res.body);
  if (!hits.length) return { hits: [], warning: 'npm_registry_parse_empty' };
  return { hits };
}

/** Fuse multi-engine hits: URL dedupe, multi-engine boost, host diversity soft penalty. */
export function fuse(hitLists: SearchHit[][], query?: string): SearchHit[] {
  const byUrl = new Map<string, SearchHit>();
  for (const list of hitLists) {
    for (const hit of list) {
      const prev = byUrl.get(hit.url);
      if (!prev || hit.score > prev.score) {
        byUrl.set(hit.url, {
          ...hit,
          scoreExplain: [...hit.scoreExplain, prev ? 'replaced_lower_score' : 'first_seen'],
        });
      } else {
        prev.score = Math.min(1, prev.score + 0.05);
        prev.scoreExplain.push(`boost_from_${hit.engine}`);
      }
    }
  }
  const terms = (query ?? '')
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (terms.length) {
    for (const hit of byUrl.values()) {
      const hay = `${hit.title} ${hit.snippet}`.toLowerCase();
      let hits = 0;
      for (const term of terms) {
        if (hay.includes(term)) hits += 1;
      }
      if (hits > 0) {
        const boost = Math.min(0.25, 0.08 * hits);
        hit.score = Math.min(1.5, hit.score + boost);
        hit.scoreExplain.push(`query_term_boost=${boost.toFixed(2)}`);
      }
    }
  }
  const ranked = [...byUrl.values()].sort((a, b) => b.score - a.score);
  const hostCount = new Map<string, number>();
  for (const hit of ranked) {
    const host = hostnameOf(hit.url);
    const n = hostCount.get(host) ?? 0;
    if (n > 0) {
      // Soft demote repeated hosts so top-N is less mono-site.
      const penalty = Math.min(0.25, 0.08 * n);
      hit.score = Math.max(0.01, hit.score - penalty);
      hit.scoreExplain.push(`host_diversity_penalty=${penalty.toFixed(2)}`);
    }
    hostCount.set(host, n + 1);
  }
  const finalRanked = ranked.sort((a, b) => b.score - a.score).slice(0, 12);
  return finalRanked.map((hit, i) => ({
    ...hit,
    scoreExplain: [...hit.scoreExplain, `rank=${i + 1}`],
  }));
}

/** Filter ranked hits by include/exclude host substrings (case-insensitive). */
export function filterHitsByHosts(
  hits: SearchHit[],
  opts: { include?: string[]; exclude?: string[] } = {},
): SearchHit[] {
  const include = (opts.include ?? []).map((h) => h.toLowerCase()).filter(Boolean);
  const exclude = (opts.exclude ?? []).map((h) => h.toLowerCase()).filter(Boolean);
  return hits.filter((hit) => {
    const host = (hit.host ?? hostnameOf(hit.url)).toLowerCase();
    if (exclude.some((e) => host === e || host.endsWith(`.${e}`) || host.includes(e))) {
      return false;
    }
    if (!include.length) return true;
    return include.some((e) => host === e || host.endsWith(`.${e}`) || host.includes(e));
  });
}

export async function webSearch(query: string): Promise<SearchResult> {
  const warnings: string[] = [];
  const engines: SearchResult['engines'] = [];
  const lists: SearchHit[][] = [];

  const ddg = await searchDuckDuckGo(query);
  engines.push({ name: 'duckduckgo_html', ok: ddg.hits.length > 0, message: ddg.warning });
  if (ddg.warning) warnings.push(`duckduckgo: ${ddg.warning}`);
  if (ddg.hits.length) lists.push(ddg.hits);

  const wiki = await searchWikipedia(query);
  engines.push({ name: 'wikipedia_opensearch', ok: wiki.hits.length > 0, message: wiki.warning });
  if (wiki.warning) warnings.push(`wikipedia: ${wiki.warning}`);
  if (wiki.hits.length) lists.push(wiki.hits);

  const npm = await searchNpmRegistry(query);
  engines.push({ name: 'npm_registry', ok: npm.hits.length > 0, message: npm.warning });
  if (npm.warning) warnings.push(`npm: ${npm.warning}`);
  if (npm.hits.length) lists.push(npm.hits);

  const hn = await searchHackerNews(query);
  engines.push({ name: 'hn_algolia', ok: hn.hits.length > 0, message: hn.warning });
  if (hn.warning) warnings.push(`hn: ${hn.warning}`);
  if (hn.hits.length) lists.push(hn.hits);

  const hits = fuse(lists, query);
  return {
    ok: hits.length > 0,
    query,
    hits,
    route: 'local_adapters',
    warnings,
    engines,
  };
}
