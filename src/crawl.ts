/**
 * Depth-limited same-origin crawl — light advanced tool (not a full wigolo crawler).
 */
import { webFetch } from './fetch.ts';
import { assertSafeUrl } from './ssrf.ts';
import { decodeEntities } from './search.ts';

export type CrawlPage = {
  url: string;
  status?: number;
  ok: boolean;
  title?: string;
  links: string[];
  error?: string;
};

export type CrawlResult = {
  ok: boolean;
  seed: string;
  maxDepth: number;
  maxPages: number;
  pages: CrawlPage[];
  warnings: string[];
  route: string;
};

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]?.replace(/<[^>]+>/g, '').trim() ?? '') : undefined;
}

function extractLinks(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /href=["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const abs = new URL(m[1] ?? '', base).toString();
      out.push(abs.split('#')[0] ?? abs);
    } catch {
      // ignore
    }
  }
  return [...new Set(out)];
}

export async function webCrawl(
  seed: string,
  options: { maxDepth?: number; maxPages?: number } = {},
): Promise<CrawlResult> {
  const maxDepth = Math.min(options.maxDepth ?? 1, 3);
  const maxPages = Math.min(options.maxPages ?? 10, 25);
  const warnings: string[] = [];
  const seedCheck = assertSafeUrl(seed);
  if (!seedCheck.ok) {
    return {
      ok: false,
      seed,
      maxDepth,
      maxPages,
      pages: [],
      warnings: [seedCheck.message],
      route: 'crawl_light',
    };
  }
  const origin = seedCheck.url.origin;
  const queue: { url: string; depth: number }[] = [{ url: seedCheck.url.toString(), depth: 0 }];
  const seen = new Set<string>();
  const pages: CrawlPage[] = [];

  while (queue.length && pages.length < maxPages) {
    const { url, depth } = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const safety = assertSafeUrl(url);
    if (!safety.ok) {
      pages.push({ url, ok: false, links: [], error: safety.message });
      continue;
    }
    if (safety.url.origin !== origin) {
      warnings.push(`skipped off-origin ${url}`);
      continue;
    }
    const fetched = await webFetch(url, { timeoutMs: 12_000, maxBytes: 800_000 });
    const links = fetched.body ? extractLinks(fetched.body, fetched.finalUrl) : [];
    pages.push({
      url: fetched.finalUrl,
      status: fetched.status,
      ok: fetched.ok,
      title: fetched.body ? extractTitle(fetched.body) : undefined,
      links: links.slice(0, 50),
      error: fetched.ok ? undefined : fetched.message,
    });
    if (depth < maxDepth && fetched.ok) {
      for (const link of links) {
        if (pages.length + queue.length >= maxPages) break;
        try {
          const u = new URL(link);
          if (u.origin === origin && !seen.has(u.toString())) {
            queue.push({ url: u.toString(), depth: depth + 1 });
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return {
    ok: pages.some((p) => p.ok),
    seed,
    maxDepth,
    maxPages,
    pages,
    warnings,
    route: 'crawl_light',
  };
}
