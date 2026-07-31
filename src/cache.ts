import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type CacheRecord = {
  key: string;
  kind: string;
  createdAt: string;
  url?: string;
  query?: string;
  contentType?: string;
  body: string;
  meta?: Record<string, unknown>;
};

export function defaultCacheDir(): string {
  if (process.env.LOOKOUT_CACHE_DIR?.trim()) return process.env.LOOKOUT_CACHE_DIR.trim();
  const xdg = process.env.XDG_CACHE_HOME?.trim();
  if (xdg) return join(xdg, 'lookout');
  return join(homedir(), '.cache', 'lookout');
}

export class LookoutCache {
  readonly dir: string;

  constructor(dir = defaultCacheDir()) {
    this.dir = dir;
    mkdirSync(this.dir, { recursive: true });
  }

  private pathFor(key: string): string {
    const safe = createHash('sha256').update(key).digest('hex');
    return join(this.dir, `${safe}.json`);
  }

  put(record: Omit<CacheRecord, 'createdAt'> & { createdAt?: string }): CacheRecord {
    const full: CacheRecord = {
      ...record,
      createdAt: record.createdAt ?? new Date().toISOString(),
    };
    writeFileSync(this.pathFor(full.key), JSON.stringify(full), 'utf8');
    return full;
  }

  get(key: string, options: { maxAgeMs?: number } = {}): CacheRecord | null {
    const p = this.pathFor(key);
    if (!existsSync(p)) return null;
    try {
      const rec = JSON.parse(readFileSync(p, 'utf8')) as CacheRecord;
      if (typeof options.maxAgeMs === 'number' && options.maxAgeMs >= 0) {
        const created = Date.parse(rec.createdAt);
        if (!Number.isFinite(created) || Date.now() - created > options.maxAgeMs) {
          return null;
        }
      }
      return rec;
    } catch {
      return null;
    }
  }

  query(q: string, limit = 20): CacheRecord[] {
    const needle = q.toLowerCase();
    const out: CacheRecord[] = [];
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith('.json')) continue;
      try {
        const rec = JSON.parse(readFileSync(join(this.dir, name), 'utf8')) as CacheRecord;
        const hay = `${rec.url ?? ''} ${rec.query ?? ''} ${rec.body.slice(0, 2000)}`.toLowerCase();
        if (!needle || hay.includes(needle)) out.push(rec);
      } catch {
        // skip corrupt
      }
    }
    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out.slice(0, limit);
  }

  stats(): { entries: number; dir: string; bytes: number } {
    let entries = 0;
    let bytes = 0;
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith('.json')) continue;
      entries += 1;
      try {
        bytes += statSync(join(this.dir, name)).size;
      } catch {
        // ignore
      }
    }
    return { entries, dir: this.dir, bytes };
  }

  clear(): { removed: number } {
    let removed = 0;
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith('.json')) continue;
      rmSync(join(this.dir, name), { force: true });
      removed += 1;
    }
    return { removed };
  }

  /** Remove entries older than maxAgeMs. */
  pruneExpired(maxAgeMs: number): { removed: number } {
    let removed = 0;
    const now = Date.now();
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith('.json')) continue;
      try {
        const rec = JSON.parse(readFileSync(join(this.dir, name), 'utf8')) as CacheRecord;
        const created = Date.parse(rec.createdAt);
        if (!Number.isFinite(created) || now - created > maxAgeMs) {
          rmSync(join(this.dir, name), { force: true });
          removed += 1;
        }
      } catch {
        rmSync(join(this.dir, name), { force: true });
        removed += 1;
      }
    }
    return { removed };
  }
}

export function cacheKey(parts: string[]): string {
  return parts.join('|');
}
