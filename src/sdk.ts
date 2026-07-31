/**
 * Lookout SDK stub — isomorphic surface reserved for web_search/fetch/extract/cache.
 * Implementation lands in Phase 1 per product spec.
 */
export type LookoutOptions = {
  /** Optional cache directory override */
  cacheDir?: string;
};

export class Lookout {
  constructor(private readonly options: LookoutOptions = {}) {}

  static create(options?: LookoutOptions): Lookout {
    return new Lookout(options);
  }

  search(_query: string | string[]): Promise<never> {
    return Promise.reject(new Error('Lookout Phase 1 not implemented — scaffold only'));
  }

  fetch(_url: string): Promise<never> {
    return Promise.reject(new Error('Lookout Phase 1 not implemented — scaffold only'));
  }

  extract(_input: Record<string, unknown>): Promise<never> {
    return Promise.reject(new Error('Lookout Phase 1 not implemented — scaffold only'));
  }

  cache(_input: Record<string, unknown>): Promise<never> {
    return Promise.reject(new Error('Lookout Phase 1 not implemented — scaffold only'));
  }
}

export default Lookout;
