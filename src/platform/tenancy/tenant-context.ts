import { AsyncLocalStorage } from 'node:async_hooks';

export type TenantContextState = {
  tenantId: string | null;
  bypass: boolean;
};

const storage = new AsyncLocalStorage<TenantContextState>();

export const TenantContext = {
  run<T>(state: TenantContextState, fn: () => T): T {
    return storage.run(state, fn);
  },

  get(): TenantContextState {
    return storage.getStore() ?? { tenantId: null, bypass: true };
  },
};
