/** Light sitemap.xml URL extraction. Not a full sitemap client. */

export function parseSitemapXml(body: string, limit = 50): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const u = (m[1] ?? '').trim();
    if (u.startsWith('http')) urls.push(u);
    if (urls.length >= limit) break;
  }
  return [...new Set(urls)];
}
