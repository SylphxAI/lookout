import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version?: unknown };

if (typeof manifest.version !== 'string' || manifest.version.length === 0) {
  throw new Error('Lookout package.json is missing a version');
}

/** The published package version. Doctor, serverInfo, and the User-Agent read this. */
export const LOOKOUT_PRODUCT_VERSION: string = manifest.version;

export function lookoutUserAgent(): string {
  return `Lookout/${LOOKOUT_PRODUCT_VERSION} (+https://github.com/SylphxAI/lookout; local-first agent web instrument)`;
}
