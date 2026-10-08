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
  listWorkspaceTabsForNavItem,
  moveWorkspaceTabToFront,
  normalizeWorkspacePathname,
  normalizeWorkspaceStore,
  removeWorkspaceTab,
  resolveLandingWorkspaceTab,
  revealWorkspaceTab,
  setActiveWorkspaceTab,
  setWorkspaceScopedState,
  shouldShowWorkspaceNavSubmenu,
  upsertWorkspaceTab,
} from '../../frontend/src/components/app-shell/workspace-manager-store';
import { WORKSPACE_STORAGE_KEY } from '../../frontend/src/components/app-shell/workspace-storage';

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

  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['tab-2', 'tab-1'],
  );
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
  assert.equal(findWorkspaceTabByBasePath([clienteNovo, clientes, dashboard], '/customers')?.id, 'tab-cliente-novo');
  assert.equal(findWorkspaceTabByBasePath([clienteNovo, clientes, dashboard], '/dashboard')?.id, 'tab-dashboard');
});

test('opens the newest workspace tab on the left and can bring an older tab to the front', () => {
  let store = createEmptyWorkspaceStore();
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-lista', pathname: '/service-orders', label: 'OS' }));
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-nova', pathname: '/service-orders?workspaceMode=new', label: 'OS: Nova' }));

  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['tab-nova', 'tab-lista'],
  );

  store = revealWorkspaceTab(store, 'tab-lista');
  assert.equal(store.activeTabId, 'tab-lista');
  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['tab-lista', 'tab-nova'],
  );

  store = moveWorkspaceTabToFront(store, 'tab-lista');
  assert.equal(store.tabs[0]?.id, 'tab-lista');
});

test('keeps Dashboard pinned on the left and refuses to close it', () => {
  let store = createEmptyWorkspaceStore();
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-dashboard', pathname: '/dashboard', label: 'Dashboard' }));
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-os', pathname: '/service-orders', label: 'OS' }));
  store = upsertWorkspaceTab(store, createWorkspaceTab({ id: 'tab-os-nova', pathname: '/service-orders?workspaceMode=new', label: 'OS: Nova' }));

  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['tab-dashboard', 'tab-os-nova', 'tab-os'],
  );

  store = revealWorkspaceTab(store, 'tab-os');
  assert.deepEqual(
    store.tabs.map((tab) => tab.id),
    ['tab-dashboard', 'tab-os', 'tab-os-nova'],
  );

  store = removeWorkspaceTab(store, 'tab-dashboard');
  assert.equal(store.tabs[0]?.id, 'tab-dashboard');
  assert.equal(store.tabs.length, 3);
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

test('workspace tabs use a new storage key so stale v1 tabs are ignored', () => {
  assert.equal(WORKSPACE_STORAGE_KEY, 'anexsys.frontend.workspace-manager.v2');
});

test('groups open workspace tabs under the matching sidebar item', () => {
  const dashboard = createWorkspaceTab({ id: 'tab-dashboard', pathname: '/dashboard', label: 'Dashboard' });
  const clientes = createWorkspaceTab({ id: 'tab-clientes', pathname: '/customers', label: 'Clientes' });
  const clienteNovo = createWorkspaceTab({
    id: 'tab-cliente-novo',
    pathname: '/customers?workspaceMode=new',
    label: 'Cliente: Novo',
  });
  const clienteMaria = createWorkspaceTab({
    id: 'tab-cliente-maria',
    pathname: '/customers?focusCustomerId=9',
    label: 'Cliente: Maria Silva',
    subtitle: '123.456.789-00',
  });
  const empresas = createWorkspaceTab({ id: 'tab-empresas', pathname: '/admin/companies', label: 'Empresas' });
  const tabs = [dashboard, clientes, clienteNovo, clienteMaria, empresas];

  assert.deepEqual(
    listWorkspaceTabsForNavItem(tabs, '/customers').map((tab) => tab.id),
    ['tab-clientes', 'tab-cliente-novo', 'tab-cliente-maria'],
  );
  assert.equal(shouldShowWorkspaceNavSubmenu(tabs, '/customers'), true);
  assert.equal(shouldShowWorkspaceNavSubmenu([dashboard, clientes], '/customers'), false);
  assert.equal(shouldShowWorkspaceNavSubmenu(tabs, '/admin/companies'), false);
  assert.equal(shouldShowWorkspaceNavSubmenu(tabs, '/dashboard'), false);
});
