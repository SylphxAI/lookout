/**
 * Lookout SDK — local-first web instrument (Sylphx Instruments).
 * Surfaces: SDK · CLI · MCP share LookoutEngine semantics.
 */
import { LookoutEngine, type EngineOptions, type ToolEnvelope, CORE_TOOLS, ADVANCED_TOOLS } from './engine.ts';

export type LookoutOptions = EngineOptions;
export type { ToolEnvelope };
export { CORE_TOOLS, ADVANCED_TOOLS, LookoutEngine };

export class Lookout {
  private readonly engine: LookoutEngine;

  constructor(options: LookoutOptions = {}) {
    this.engine = new LookoutEngine(options);
  }

  static create(options?: LookoutOptions): Lookout {
    return new Lookout(options);
  }

  search(query: string | string[], input: Record<string, unknown> = {}) {
    return this.engine.handle('web_search', { ...input, query });
  }

  fetch(url: string, input: Record<string, unknown> = {}) {
    return this.engine.handle('web_fetch', { ...input, url });
  }

  extract(input: { url?: string; html?: string } & Record<string, unknown>) {
    return this.engine.handle('web_extract', input);
  }

  cache(input: Record<string, unknown> = {}) {
    return this.engine.handle('web_cache', input);
  }

  /** Advanced: depth-limited same-origin crawl */
  crawl(url: string, input: Record<string, unknown> = {}) {
    return this.engine.handle('web_crawl', { ...input, url });
  }

  /** Escape hatch for MCP-identical tool names. */
  call(tool: (typeof CORE_TOOLS)[number], input: Record<string, unknown> = {}) {
    return this.engine.handle(tool, input);
  }
}

export default Lookout;
