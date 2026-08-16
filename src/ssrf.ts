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
  const h = host.toLowerCase().replace(/^\[|\]$/g, '').split('%')[0] ?? '';
  if (!h.includes(':')) return false;

  // URL normalisation turns IPv4-mapped forms such as
  // [::ffff:127.0.0.1] into [::ffff:7f00:1]. Parse the address rather than
  // relying on a textual prefix so those targets cannot bypass the IPv4
  // policy. IPv4-compatible forms (::7f00:1) and the unspecified address (::)
  // are local/non-routable too.
  const halves = h.split('::');
  if (halves.length > 2) return false;
  const parseGroups = (part: string): number[] | null => {
    if (!part) return [];
    const tokens = part.split(':');
    const groups: number[] = [];
    for (const token of tokens) {
      if (!token) return null;
      if (token.includes('.')) {
        const ipv4 = parseIpv4(token);
        if (!ipv4) return null;
        groups.push((ipv4[0]! << 8) | ipv4[1]!, (ipv4[2]! << 8) | ipv4[3]!);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/i.test(token)) return null;
      groups.push(Number.parseInt(token, 16));
    }
    return groups;
  };

  const left = parseGroups(halves[0] ?? '');
  const right = parseGroups(halves[1] ?? '');
  if (!left || !right) return false;
  const missing = 8 - left.length - right.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return false;
  const groups = halves.length === 1
    ? left
    : [...left, ...Array.from({ length: missing }, () => 0), ...right];
  if (groups.length !== 8) return false;

  if (groups.every((group) => group === 0)) return true; // unspecified ::
  if (groups[0] === 0 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0) {
    if (groups[4] === 0 && groups[5] === 0xffff) {
      return isPrivateIpv4([
        groups[6]! >> 8,
        groups[6]! & 0xff,
        groups[7]! >> 8,
        groups[7]! & 0xff,
      ]);
    }
    if (groups[4] === 0 && groups[5] === 0) {
      return isPrivateIpv4([
        groups[6]! >> 8,
        groups[6]! & 0xff,
        groups[7]! >> 8,
        groups[7]! & 0xff,
      ]);
    }
  }

  const first = groups[0]!;
  if ((first & 0xfe00) === 0xfc00) return true; // ULA fc00::/7
  if ((first & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if (h === '::1') return true;
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
