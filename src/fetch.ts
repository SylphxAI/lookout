import { assertSafeUrl } from './ssrf.ts';

export type FetchResult = {
  ok: boolean;
  url: string;
  finalUrl: string;
  status?: number;
  contentType?: string;
  body?: string;
  route: string;
  warnings: string[];
  code?: string;
  message?: string;
  redirects?: string[];
  truncated?: boolean;
};

const DEFAULT_MAX_BYTES = 1_500_000;
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;

export async function webFetch(
  rawUrl: string,
  options: { maxBytes?: number; timeoutMs?: number; userAgent?: string } = {},
): Promise<FetchResult> {
  const warnings: string[] = [];
  const redirects: string[] = [];
  let current = rawUrl;
  const envMax = process.env.LOOKOUT_FETCH_MAX_BYTES?.trim();
  const envTimeout = process.env.LOOKOUT_FETCH_TIMEOUT_MS?.trim();
  const maxBytes =
    options.maxBytes ??
    (envMax && Number.isFinite(Number(envMax)) ? Number(envMax) : DEFAULT_MAX_BYTES);
  const timeoutMs =
    options.timeoutMs ??
    (envTimeout && Number.isFinite(Number(envTimeout)) ? Number(envTimeout) : DEFAULT_TIMEOUT_MS);
  const ua =
    options.userAgent ??
    process.env.LOOKOUT_USER_AGENT?.trim() ??
    'Lookout/0.1 (+https://github.com/SylphxAI/lookout; local-first agent web instrument)';

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const safety = assertSafeUrl(current);
    if (!safety.ok) {
      return {
        ok: false,
        url: rawUrl,
        finalUrl: current,
        route: 'http',
        warnings,
        code: safety.code,
        message: safety.message,
        redirects,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(safety.url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': ua,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
        },
      });

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get('location');
        if (!loc) {
          return {
            ok: false,
            url: rawUrl,
            finalUrl: current,
            status: res.status,
            route: 'http',
            warnings,
            code: 'REDIRECT_MISSING_LOCATION',
            message: 'Redirect without Location header',
            redirects,
          };
        }
        const next = new URL(loc, safety.url).toString();
        redirects.push(next);
        current = next;
        continue;
      }

      const contentType = res.headers.get('content-type') ?? undefined;
      const buf = new Uint8Array(await res.arrayBuffer());
      let truncated = false;
      let slice = buf;
      if (buf.byteLength > maxBytes) {
        slice = buf.slice(0, maxBytes);
        truncated = true;
        warnings.push(`Response truncated to ${maxBytes} bytes`);
      }
      const body = new TextDecoder('utf-8', { fatal: false }).decode(slice);
      if (!res.ok) {
        warnings.push(`HTTP ${res.status}`);
      }
      return {
        ok: res.ok,
        url: rawUrl,
        finalUrl: current,
        status: res.status,
        contentType,
        body,
        route: 'http',
        warnings,
        redirects,
        truncated,
        code: res.ok ? undefined : 'HTTP_ERROR',
        message: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        url: rawUrl,
        finalUrl: current,
        route: 'http',
        warnings,
        code: message.includes('abort') ? 'TIMEOUT' : 'FETCH_FAILED',
        message,
        redirects,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    url: rawUrl,
    finalUrl: current,
    route: 'http',
    warnings,
    code: 'TOO_MANY_REDIRECTS',
    message: `Exceeded ${MAX_REDIRECTS} redirects`,
    redirects,
  };
}
