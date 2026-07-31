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
  textExcerpt?: string;
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
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractFromHtml(html: string, url?: string): ExtractResult {
  const warnings: string[] = [];
  const spans: CiteSpan[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1] ?? '') : undefined;
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
    description = stripTags(metaDesc[1] ?? '');
    if (metaDesc.index !== undefined) {
      spans.push({
        text: description,
        start: metaDesc.index,
        end: metaDesc.index + metaDesc[0].length,
        kind: 'meta_description',
      });
    }
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
        cells.push(stripTags(c[1] ?? ''));
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push({ rows });
    if (tables.length >= 5) break;
  }

  const textExcerpt = stripTags(html).slice(0, 2000);
  if (textExcerpt) {
    spans.push({ text: textExcerpt.slice(0, 240), start: 0, end: Math.min(240, html.length), kind: 'excerpt' });
  }

  return {
    ok: true,
    url,
    title,
    description,
    textExcerpt,
    jsonLd,
    tables,
    spans,
    route: 'html_dom_light',
    warnings,
  };
}
