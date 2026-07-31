export type CiteSpan = {
  text: string;
  start: number;
  end: number;
  kind: string;
};

export type ExtractResult = {
  ok: boolean;
  url?: string;
  title?: string;
  description?: string;
  canonicalUrl?: string;
  author?: string;
  siteName?: string;
  textExcerpt?: string;
  headings: { level: number; text: string }[];
  links: { href: string; text: string }[];
  jsonLd: unknown[];
  tables: { rows: string[][] }[];
  spans: CiteSpan[];
  route: string;
  warnings: string[];
};

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Prefer <article>/<main>, else body, else full document for readable text. */
function pickContentHtml(html: string): { html: string; route: string } {
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (article?.[1] && stripTags(article[1]).length > 40) {
    return { html: article[1], route: 'html_article' };
  }
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main?.[1] && stripTags(main[1]).length > 40) {
    return { html: main[1], route: 'html_main' };
  }
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body?.[1]) {
    return { html: body[1], route: 'html_body' };
  }
  return { html, route: 'html_dom_light' };
}


function resolveHref(href: string, base?: string): string {
  try {
    if (!base) return href;
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function extractFromHtml(html: string, url?: string): ExtractResult {
  const warnings: string[] = [];
  const spans: CiteSpan[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let title = titleMatch ? decodeBasicEntities(stripTags(titleMatch[1] ?? '')) : undefined;
  if (title && titleMatch && titleMatch.index !== undefined) {
    const raw = titleMatch[1] ?? '';
    const start = titleMatch.index + titleMatch[0].indexOf(raw);
    spans.push({ text: title, start, end: start + raw.length, kind: 'title' });
  }

  let description: string | undefined;
  const metaDesc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
  if (metaDesc) {
    description = decodeBasicEntities(stripTags(metaDesc[1] ?? ''));
    if (metaDesc.index !== undefined) {
      spans.push({
        text: description,
        start: metaDesc.index,
        end: metaDesc.index + metaDesc[0].length,
        kind: 'meta_description',
      });
    }
  }

  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i);
  if (ogTitle?.[1] && !title) {
    title = decodeBasicEntities(stripTags(ogTitle[1]));
    spans.push({ text: title, start: ogTitle.index ?? 0, end: (ogTitle.index ?? 0) + ogTitle[0].length, kind: 'og_title' });
  } else if (ogTitle?.[1] && title && title !== decodeBasicEntities(stripTags(ogTitle[1]))) {
    spans.push({
      text: decodeBasicEntities(stripTags(ogTitle[1])),
      start: ogTitle.index ?? 0,
      end: (ogTitle.index ?? 0) + ogTitle[0].length,
      kind: 'og_title',
    });
  }

  let canonicalUrl: string | undefined;
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  if (canonical?.[1]) {
    canonicalUrl = resolveHref(decodeBasicEntities(canonical[1].trim()), url);
    spans.push({
      text: canonicalUrl,
      start: canonical.index ?? 0,
      end: (canonical.index ?? 0) + canonical[0].length,
      kind: 'canonical',
    });
  }

  let author: string | undefined;
  const authorMeta =
    html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']author["'][^>]*>/i);
  if (authorMeta?.[1]) {
    author = decodeBasicEntities(stripTags(authorMeta[1]));
    spans.push({
      text: author,
      start: authorMeta.index ?? 0,
      end: (authorMeta.index ?? 0) + authorMeta[0].length,
      kind: 'author',
    });
  }

  let siteName: string | undefined;
  const siteMeta =
    html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["'][^>]*>/i);
  if (siteMeta?.[1]) {
    siteName = decodeBasicEntities(stripTags(siteMeta[1]));
  }

  const jsonLd: unknown[] = [];
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRe.exec(html)) !== null) {
    try {
      jsonLd.push(JSON.parse(m[1] ?? ''));
    } catch {
      warnings.push('json_ld_parse_error');
    }
  }

  const tables: { rows: string[][] }[] = [];
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  while ((m = tableRe.exec(html)) !== null) {
    const rows: string[][] = [];
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let r: RegExpExecArray | null;
    const tableHtml = m[1] ?? '';
    while ((r = rowRe.exec(tableHtml)) !== null) {
      const cells: string[] = [];
      const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let c: RegExpExecArray | null;
      while ((c = cellRe.exec(r[1] ?? '')) !== null) {
        cells.push(decodeBasicEntities(stripTags(c[1] ?? '')));
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push({ rows });
    if (tables.length >= 8) break;
  }

  const headings: { level: number; text: string }[] = [];
  const hRe = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  while ((m = hRe.exec(html)) !== null) {
    const level = Number(m[1] ?? 1);
    const text = decodeBasicEntities(stripTags(m[2] ?? ''));
    if (!text) continue;
    headings.push({ level, text });
    if (m.index !== undefined) {
      spans.push({
        text,
        start: m.index,
        end: m.index + m[0].length,
        kind: `heading_h${level}`,
      });
    }
    if (headings.length >= 30) break;
  }

  const links: { href: string; text: string }[] = [];
  const aRe = /<a\b[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = aRe.exec(html)) !== null) {
    const rawHref = (m[1] ?? '').trim();
    const text = decodeBasicEntities(stripTags(m[2] ?? '')).slice(0, 200);
    if (!rawHref || rawHref.startsWith('javascript:')) continue;
    const href = resolveHref(rawHref, url);
    links.push({ href, text });
    if (links.length >= 40) break;
  }

  const content = pickContentHtml(html);
  const textExcerpt = decodeBasicEntities(stripTags(content.html)).slice(0, 4000);
  if (textExcerpt) {
    spans.push({
      text: textExcerpt.slice(0, 280),
      start: 0,
      end: Math.min(280, html.length),
      kind: 'excerpt',
    });
  } else {
    warnings.push('empty_text_excerpt');
  }


  const robots =
    html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i);
  if (robots?.[1] && /noindex/i.test(robots[1])) {
    warnings.push('robots_noindex');
  }
  if (!title) warnings.push('missing_title');
  if (!description) warnings.push('missing_description');

  return {
    ok: true,
    url,
    title,
    description,
    canonicalUrl,
    author,
    siteName,
    textExcerpt,
    headings,
    links,
    jsonLd,
    tables,
    spans,
    route: content.route,
    warnings,
  };
}
