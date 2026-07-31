/**
 * Lightweight multi-adapter search without API keys.
 * Primary: DuckDuckGo HTML. Fallback: Wikipedia opensearch (no key).
 */
import { webFetch } from './fetch.ts';

export type SearchHit = {
  title: string;
  url: string;
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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<\/?b>/gi, '');
}

function parseDuckDuckGoHtml(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  // classic HTML result blocks
  const re =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|td|div)>|)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = decodeEntities(m[1] ?? '');
    const title = decodeEntities((m[2] ?? '').replace(/<[^>]+>/g, '')).trim();
    const snippet = decodeEntities((m[3] ?? '').replace(/<[^>]+>/g, '')).trim();
    if (!url.startsWith('http') || !title) continue;
    hits.push({
      title,
      url,
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
      const url = decodeEntities(m[1] ?? '');
      const title = decodeEntities((m[2] ?? '').replace(/<[^>]+>/g, '')).trim();
      if (!title || title.length < 2) continue;
      if (url.includes('duckduckgo.com')) continue;
      hits.push({
        title,
        url,
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

async function searchWikipedia(query: string): Promise<{ hits: SearchHit[]; warning?: string }> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
  const res = await webFetch(url, { timeoutMs: 12_000 });
  if (!res.ok || !res.body) {
    return { hits: [], warning: res.message ?? 'wikipedia_failed' };
  }
  try {
    const data = JSON.parse(res.body) as [string, string[], string[], string[]];
    const titles = data[1] ?? [];
    const snippets = data[2] ?? [];
    const urls = data[3] ?? [];
    const hits: SearchHit[] = titles.map((title, i) => ({
      title,
      url: urls[i] ?? '',
      snippet: snippets[i] ?? '',
      engine: 'wikipedia_opensearch',
      score: Math.max(0.05, 0.7 - i * 0.08),
      scoreExplain: ['engine=wikipedia_opensearch', `rank=${i}`],
    })).filter((h) => h.url.startsWith('http'));
    return { hits };
  } catch {
    return { hits: [], warning: 'wikipedia_parse_error' };
  }
}

function fuse(hitLists: SearchHit[][]): SearchHit[] {
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
  return [...byUrl.values()].sort((a, b) => b.score - a.score).slice(0, 12);
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

  const hits = fuse(lists);
  return {
    ok: hits.length > 0,
    query,
    hits,
    route: 'local_adapters',
    warnings,
    engines,
  };
}
