import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWorkspaceHref,
  clearWorkspaceScopedState,
  cloneWorkspaceTabState,
  createEmptyWorkspaceStore,
  createWorkspaceTab,
  getWorkspaceScopedState,
  normalizeWorkspacePathname,
  normalizeWorkspaceStore,
  removeWorkspaceTab,
  setWorkspaceScopedState,
  upsertWorkspaceTab,
} from '../../frontend/src/components/app-shell/workspace-manager-store';

test('creates, updates, clones, and removes workspace tabs', () => {
  let store = createEmptyWorkspaceStore();
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-1', pathname: '/customers', label: 'Clientes' }));
  store = setWorkspaceScopedState(store, 'tab-1', 'customers.searchQuery', 'maria');
  store = cloneWorkspaceTabState(store, 'tab-1', 'tab-2');
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-2', pathname: '/customers', label: 'Cliente · Maria' }));

  assert.equal(store.tabs.length, 2);
  assert.equal(getWorkspaceScopedState<string>(store, 'tab-2', 'customers.searchQuery'), 'maria');

  store = clearWorkspaceScopedState(store, 'tab-2', 'customers.searchQuery');
  assert.equal(getWorkspaceScopedState<string>(store, 'tab-2', 'customers.searchQuery'), null);

  store = removeWorkspaceTab(store, 'tab-1');
  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['tab-2'],
  );
});

test('builds href with workspace query param', () => {
  assert.equal(buildWorkspaceHref('/service-orders', 'tab-10'), '/service-orders?workspaceTab=tab-10');
  assert.equal(buildWorkspaceHref('/customers?mode=detail', 'tab-11'), '/customers?mode=detail&workspaceTab=tab-11');
});

test('normalizes workspace pathnames and strips workspace query state', () => {
  assert.equal(normalizeWorkspacePathname('/dashboard?workspaceTab=tab-1'), '/dashboard');
  assert.equal(
    normalizeWorkspacePathname('/customers?workspaceMode=new&workspaceTab=tab-2'),
    '/customers?workspaceMode=new',
  );
  assert.equal(
    createWorkspaceTab({ id: 'tab-3', pathname: '/service-orders?focusServiceOrderId=15&workspaceTab=tab-9', label: 'OS #15' }).pathname,
    '/service-orders?focusServiceOrderId=15',
  );
});

test('ignores unnamed or empty workspace tabs', () => {
  let store = createEmptyWorkspaceStore();

  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-1', pathname: '/customers', label: 'Customers' }));
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-2', pathname: '/customers', label: '   ' }));
  store = normalizeWorkspaceStore({
    tabs: [...store.tabs, { id: 'tab-3', pathname: '', label: 'Dashboard', subtitle: null }],
    stateByTabId: {
      'tab-1': { valid: true },
      'tab-2': { invalid: true },
      'tab-3': { invalid: true },
    },
  });

  assert.deepEqual(store.tabs.map((tab) => tab.id), ['tab-1']);
  assert.deepEqual(Object.keys(store.stateByTabId), ['tab-1']);
});
