import { webFetch } from './fetch.ts';

export type RobotsDecision = {
  allowed: boolean;
  source: string;
  matchedRule?: string;
  warning?: string;
};

/** Minimal robots.txt parse: User-agent: * Disallow rules only (light, local-first). */
export function parseRobotsTxt(body: string, path: string): RobotsDecision {
  const lines = body.split(/\r?\n/).map((l) => l.trim());
  let inStar = false;
  const disallows: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const ua = line.match(/^user-agent:\s*(.+)$/i);
    if (ua) {
      inStar = ua[1].trim() === '*';
      continue;
    }
    if (!inStar) continue;
    const dis = line.match(/^disallow:\s*(.*)$/i);
    if (dis) {
      const rule = (dis[1] ?? '').trim();
      if (rule.length) disallows.push(rule);
    }
    // New UA group ends star section when another UA appears — handled above
  }
  // Empty Disallow means allow all for that rule; skip empties already
  for (const rule of disallows) {
    if (rule === '/') {
      return { allowed: false, source: 'robots.txt', matchedRule: '/', warning: 'robots Disallow: /' };
    }
    if (path.startsWith(rule)) {
      return {
        allowed: false,
        source: 'robots.txt',
        matchedRule: rule,
        warning: `robots Disallow: ${rule}`,
      };
    }
  }
  return { allowed: true, source: 'robots.txt' };
}

const robotsCache = new Map<string, { body: string; at: number }>();
const ROBOTS_TTL_MS = 10 * 60 * 1000;

export async function checkRobotsAllowed(
  url: string,
  options: { respectRobots?: boolean } = {},
): Promise<RobotsDecision> {
  if (options.respectRobots === false) {
    return { allowed: true, source: 'respect_robots_off' };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, source: 'invalid_url', warning: 'invalid url for robots check' };
  }
  const robotsUrl = `${parsed.origin}/robots.txt`;
  const now = Date.now();
  let body: string | undefined;
  const cached = robotsCache.get(robotsUrl);
  if (cached && now - cached.at < ROBOTS_TTL_MS) {
    body = cached.body;
  } else {
    const res = await webFetch(robotsUrl, { timeoutMs: 8_000, maxBytes: 100_000 });
    if (!res.ok || !res.body) {
      // Fail open when robots missing (common on sites) — honesty warning only.
      return {
        allowed: true,
        source: 'robots_missing',
        warning: `robots.txt unavailable (${res.message ?? res.code ?? res.status})`,
      };
    }
    body = res.body;
    robotsCache.set(robotsUrl, { body, at: now });
  }
  return parseRobotsTxt(body, parsed.pathname || '/');
}
