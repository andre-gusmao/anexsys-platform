import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activateWorkspaceTab,
  buildWorkspaceHref,
  clearWorkspaceScopedState,
  cloneWorkspaceTabState,
  collapseDuplicateDashboardTabs,
  createEmptyWorkspaceStore,
  createWorkspaceTab,
  findWorkspaceTabByBasePath,
  getWorkspaceBasePath,
  getWorkspaceScopedState,
  getWorkspaceSearchParams,
  isDashboardWorkspacePath,
  normalizeWorkspacePathname,
  normalizeWorkspaceStore,
  removeWorkspaceTab,
  resolveLandingWorkspaceTab,
  setActiveWorkspaceTab,
  setWorkspaceScopedState,
  upsertWorkspaceTab,
} from '../../frontend/src/components/app-shell/workspace-manager-store';

test('activates a workspace tab independently of the current route', () => {
  let store = createEmptyWorkspaceStore();
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-dashboard', pathname: '/dashboard', label: 'Dashboard' }));
  store = activateWorkspaceTab(store, createWorkspaceTab({ id: 'tab-contas', pathname: '/admin/tenants', label: 'Contas' }));

  assert.equal(store.activeTabId, 'tab-contas');
  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['tab-dashboard', 'tab-contas'],
  );

  store = setActiveWorkspaceTab(store, 'tab-dashboard');
  assert.equal(store.activeTabId, 'tab-dashboard');

  store = normalizeWorkspaceStore({
    tabs: store.tabs,
    activeTabId: null,
    stateByTabId: store.stateByTabId,
  });
  assert.equal(store.activeTabId, 'tab-dashboard');
});

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

test('reads workspace base path and tab-owned search params', () => {
  assert.equal(getWorkspaceBasePath('/admin/tenants?workspaceTab=tab-1'), '/admin/tenants');
  assert.equal(getWorkspaceBasePath('/customers?workspaceMode=new&focusCustomerId=9'), '/customers');
  assert.equal(getWorkspaceSearchParams('/customers?workspaceMode=new&workspaceTab=tab-2').get('workspaceMode'), 'new');
  assert.equal(getWorkspaceSearchParams('/admin/companies').get('workspaceMode'), null);
});

test('ignores unnamed or empty workspace tabs', () => {
  let store = createEmptyWorkspaceStore();

  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-1', pathname: '/customers', label: 'Customers' }));
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-2', pathname: '/customers', label: '   ' }));
  store = normalizeWorkspaceStore({
    tabs: [...store.tabs, { id: 'tab-3', pathname: '', label: 'Dashboard', subtitle: null }],
    activeTabId: 'tab-1',
    stateByTabId: {
      'tab-1': { valid: true },
      'tab-2': { invalid: true },
      'tab-3': { invalid: true },
    },
  });

  assert.deepEqual(store.tabs.map((tab) => tab.id), ['tab-1']);
  assert.deepEqual(Object.keys(store.stateByTabId), ['tab-1']);
});

test('finds the latest workspace tab by menu base path', () => {
  const dashboard = createWorkspaceTab({ id: 'tab-dashboard', pathname: '/dashboard', label: 'Dashboard' });
  const clientes = createWorkspaceTab({ id: 'tab-clientes', pathname: '/customers', label: 'Clientes' });
  const clienteNovo = createWorkspaceTab({
    id: 'tab-cliente-novo',
    pathname: '/customers?workspaceMode=new',
    label: 'Customer: New',
  });

  assert.equal(isDashboardWorkspacePath('/dashboard?workspaceTab=abc'), true);
  assert.equal(findWorkspaceTabByBasePath([dashboard, clientes, clienteNovo], '/customers')?.id, 'tab-cliente-novo');
  assert.equal(findWorkspaceTabByBasePath([dashboard, clientes, clienteNovo], '/dashboard')?.id, 'tab-dashboard');
});

test('collapses duplicate Dashboard tabs and keeps the active one', () => {
  const store = collapseDuplicateDashboardTabs({
    tabs: [
      createWorkspaceTab({ id: 'dash-1', pathname: '/dashboard', label: 'Dashboard' }),
      createWorkspaceTab({ id: 'dash-2', pathname: '/dashboard', label: 'Dashboard' }),
      createWorkspaceTab({ id: 'clientes', pathname: '/customers', label: 'Clientes' }),
    ],
    activeTabId: 'dash-2',
    stateByTabId: {
      'dash-1': { leftover: true },
      'dash-2': { keep: true },
      clientes: { form: true },
    },
  });

  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['dash-2', 'clientes'],
  );
  assert.equal(store.activeTabId, 'dash-2');
  assert.deepEqual(Object.keys(store.stateByTabId).sort(), ['clientes', 'dash-2']);
});

test('normalizing the store removes extra Dashboard tabs from localStorage', () => {
  const store = normalizeWorkspaceStore({
    tabs: [
      createWorkspaceTab({ id: 'dash-1', pathname: '/dashboard', label: 'Dashboard' }),
      createWorkspaceTab({ id: 'dash-2', pathname: '/dashboard', label: 'Dashboard' }),
      createWorkspaceTab({ id: 'dash-3', pathname: '/dashboard', label: 'Dashboard' }),
    ],
    activeTabId: 'dash-1',
    stateByTabId: {},
  });

  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['dash-1'],
  );
  assert.equal(store.activeTabId, 'dash-1');
});

test('post-login landing on /dashboard activates Dashboard instead of a persisted cadastro tab', () => {
  const store = {
    tabs: [
      createWorkspaceTab({ id: 'tab-dashboard', pathname: '/dashboard', label: 'Dashboard' }),
      createWorkspaceTab({ id: 'tab-empresas', pathname: '/admin/companies', label: 'Empresas' }),
    ],
    activeTabId: 'tab-empresas',
    stateByTabId: {},
  };

  assert.deepEqual(resolveLandingWorkspaceTab(store, '/dashboard', null), {
    activeTabId: 'tab-dashboard',
    createDashboard: false,
  });
  assert.deepEqual(resolveLandingWorkspaceTab(store, '/dashboard', 'tab-empresas'), {
    activeTabId: 'tab-empresas',
    createDashboard: false,
  });
  assert.deepEqual(resolveLandingWorkspaceTab(store, '/admin/companies', null), {
    activeTabId: 'tab-empresas',
    createDashboard: false,
  });
});

test('post-login landing on /dashboard creates Dashboard when it is missing', () => {
  const store = {
    tabs: [createWorkspaceTab({ id: 'tab-empresas', pathname: '/admin/companies', label: 'Empresas' })],
    activeTabId: 'tab-empresas',
    stateByTabId: {},
  };

  assert.deepEqual(resolveLandingWorkspaceTab(store, '/dashboard', null), {
    activeTabId: 'tab-empresas',
    createDashboard: true,
  });
});
