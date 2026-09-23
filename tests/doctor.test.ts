import { describe, expect, test } from 'bun:test';
import { formatDoctorReport, runDoctor } from '../src/doctor.ts';
import { LOOKOUT_PRODUCT_VERSION, lookoutUserAgent } from '../src/version.ts';

describe('lookout doctor', () => {
  test('passes baseline checks', () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.version).toBe(LOOKOUT_PRODUCT_VERSION);
    expect(lookoutUserAgent()).toContain(`Lookout/${LOOKOUT_PRODUCT_VERSION}`);
    expect(lookoutUserAgent()).not.toContain('0.2.1');
    expect(r.checks.some((c) => c.name === 'ssrf_blocks_loopback' && c.status === 'ok')).toBe(true);
    expect(formatDoctorReport(r)).toContain('Lookout doctor');
  });
});
