/**
 * SSRF policy — deny private/link-local/metadata targets. Local-first safety for Lookout.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
]);

function parseIpv4(host: string): number[] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map((x) => Number(x));
  if (parts.some((n) => n > 255)) return null;
  return parts;
}

function isPrivateIpv4(parts: number[]): boolean {
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === '::1') return true;
  if (h.startsWith('fc') || h.startsWith('fd')) return true; // ULA
  if (h.startsWith('fe80')) return true; // link-local
  return false;
}

export type SsrfCheck =
  | { ok: true; url: URL }
  | { ok: false; code: 'BLOCKED_SCHEME' | 'BLOCKED_HOST' | 'BLOCKED_IP' | 'INVALID_URL'; message: string };

export function assertSafeUrl(raw: string): SsrfCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, code: 'INVALID_URL', message: `Invalid URL: ${raw}` };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return {
      ok: false,
      code: 'BLOCKED_SCHEME',
      message: `Only http/https allowed (got ${url.protocol})`,
    };
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    return { ok: false, code: 'BLOCKED_HOST', message: `Blocked hostname: ${host}` };
  }
  const v4 = parseIpv4(host);
  if (v4 && isPrivateIpv4(v4)) {
    return { ok: false, code: 'BLOCKED_IP', message: `Blocked private IPv4: ${host}` };
  }
  if (host.includes(':') && isPrivateIpv6(host)) {
    return { ok: false, code: 'BLOCKED_IP', message: `Blocked private IPv6: ${host}` };
  }
  return { ok: true, url };
}
