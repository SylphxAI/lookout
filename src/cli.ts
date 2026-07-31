#!/usr/bin/env bun
import { LookoutEngine, CORE_TOOLS, ADVANCED_TOOLS } from './engine.ts';

function usage(): never {
  console.log(`Lookout — local-first web instrument (Sylphx)

Usage:
  lookout search <query...>
  lookout fetch <url>
  lookout extract <url>
  lookout cache [query]
  lookout cache stats
  lookout cache clear
  lookout cache prune [maxAgeMs]
  lookout crawl <url> [--depth N] [--pages N]
  lookout research <query...> [--pages N]
  lookout mcp
  lookout tools
  lookout doctor
  lookout help

Env:
  LOOKOUT_CACHE_DIR          override cache directory (default: ~/.cache/lookout)
  LOOKOUT_CACHE_MAX_AGE_MS   optional max age for cache hits (milliseconds)
`);
  process.exit(0);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') usage();

  if (cmd === 'tools') {
    console.log(JSON.stringify({ core: CORE_TOOLS, advanced: ADVANCED_TOOLS }, null, 2));
    return;
  }

  if (cmd === 'doctor') {
    const { runDoctor, formatDoctorReport } = await import('./doctor.ts');
    const report = runDoctor();
    console.log(formatDoctorReport(report));
    process.exit(report.ok ? 0 : 1);
  }

  if (cmd === 'mcp') {
    await import('./mcp.ts');
    return;
  }

  const engine = new LookoutEngine();
  let envelope;
  switch (cmd) {
    case 'search':
      envelope = await engine.handle('web_search', { query: rest.join(' ') });
      break;
    case 'fetch':
      envelope = await engine.handle('web_fetch', { url: rest[0] });
      break;
    case 'extract':
      envelope = await engine.handle('web_extract', { url: rest[0] });
      break;
    case 'cache':
      if (rest[0] === 'stats') envelope = await engine.handle('web_cache', { op: 'stats' });
      else if (rest[0] === 'clear') envelope = await engine.handle('web_cache', { op: 'clear' });
      else if (rest[0] === 'prune') {
        const maxAgeMs = rest[1] ? Number(rest[1]) : undefined;
        envelope = await engine.handle('web_cache', { op: 'prune', maxAgeMs });
      } else envelope = await engine.handle('web_cache', { op: 'query', query: rest.join(' ') });
      break;
    case 'crawl': {
      let depth: number | undefined;
      let pages: number | undefined;
      const args = [...rest];
      const url = args.shift();
      while (args.length) {
        const a = args.shift()!;
        if (a === '--depth') depth = Number(args.shift());
        else if (a === '--pages') pages = Number(args.shift());
      }
      envelope = await engine.handle('web_crawl', { url, maxDepth: depth, maxPages: pages });
      break;
    }
    case 'research': {
      let pages: number | undefined;
      const args = [...rest];
      const qparts: string[] = [];
      while (args.length) {
        const a = args.shift()!;
        if (a === '--pages') pages = Number(args.shift());
        else qparts.push(a);
      }
      envelope = await engine.handle('web_research', { query: qparts.join(' '), maxPages: pages });
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      usage();
  }
  console.log(JSON.stringify(envelope, null, 2));
  process.exit(envelope?.status === 'ok' ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
