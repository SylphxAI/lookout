import { describe, expect, test } from 'bun:test';
import { formatDoctorReport, runDoctor } from '../src/doctor.ts';

describe('lookout doctor', () => {
  test('passes baseline checks', () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.checks.some((c) => c.name === 'ssrf_blocks_loopback' && c.status === 'ok')).toBe(true);
    expect(formatDoctorReport(r)).toContain('Lookout doctor');
  });
});
