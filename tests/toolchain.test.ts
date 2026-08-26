import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');

describe('TypeScript toolchain', () => {
  test('pins exact Bun 1.4.0 with frozen bun.lock as install authority', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      packageManager?: string;
      engines?: { bun?: string; node?: string };
    };
    const bunVersion = readFileSync(join(root, '.bun-version'), 'utf8').trim();
    expect(Bun.version).toBe('1.4.0');
    expect(bunVersion).toBe('1.4.0');
    expect(pkg.packageManager).toBe('bun@1.4.0');
    expect(pkg.engines?.bun).toBe('>=1.4.0');
    expect(pkg.engines && 'node' in pkg.engines).toBe(false);
    expect(existsSync(join(root, 'bun.lock'))).toBe(true);
    expect(existsSync(join(root, 'package-lock.json'))).toBe(false);
    expect(existsSync(join(root, 'yarn.lock'))).toBe(false);
    expect(existsSync(join(root, 'pnpm-lock.yaml'))).toBe(false);
  });
});
