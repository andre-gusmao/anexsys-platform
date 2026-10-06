export type WorkspaceTab = {
  id: string;
  pathname: string;
  label: string;
  subtitle?: string | null;
};

export type WorkspaceTabState = Record<string, unknown>;

export type WorkspaceStore = {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  stateByTabId: Record<string, WorkspaceTabState>;
};

export const WORKSPACE_QUERY_PARAM = "workspaceTab";

export function normalizeWorkspacePathname(pathname: string): string {
  const [pathWithQuery, hashFragment = ""] = pathname.trim().split("#");
  const [basePath, rawQuery = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(rawQuery);
  params.delete(WORKSPACE_QUERY_PARAM);
  const query = params.toString();
  const hash = hashFragment ? `#${hashFragment}` : "";
  return `${query ? `${basePath}?${query}` : basePath}${hash}`;
}

export function createEmptyWorkspaceStore(): WorkspaceStore {
  return {
    tabs: [],
    activeTabId: null,
    stateByTabId: {},
  };
}

export function resolveActiveWorkspaceTabId(tabs: WorkspaceTab[], activeTabId?: string | null): string | null {
  if (activeTabId && tabs.some((tab) => tab.id === activeTabId)) {
    return activeTabId;
  }

  return tabs[0]?.id ?? null;
}

export function createWorkspaceTab(input: {
  id: string;
  pathname: string;
  label: string;
  subtitle?: string | null;
}): WorkspaceTab {
  return {
    id: input.id.trim(),
    pathname: normalizeWorkspacePathname(input.pathname),
    label: input.label.trim(),
    subtitle: input.subtitle?.trim() || null,
  };
}

export function isMeaningfulWorkspaceTab(tab: WorkspaceTab): boolean {
  return Boolean(tab.id.trim() && tab.pathname.trim() && tab.label.trim());
}

export function normalizeWorkspaceStore(store: WorkspaceStore): WorkspaceStore {
  const collapsed = collapseDuplicateDashboardTabs({
    tabs: store.tabs.map((tab) => createWorkspaceTab(tab)).filter(isMeaningfulWorkspaceTab),
    activeTabId: store.activeTabId,
    stateByTabId: store.stateByTabId ?? {},
  });
  const tabs = collapsed.tabs;
  const validTabIds = new Set(tabs.map((tab) => tab.id));
  const stateByTabId = Object.fromEntries(
    Object.entries(collapsed.stateByTabId).filter(([tabId]) => validTabIds.has(tabId)),
  );

  return {
    tabs,
    activeTabId: resolveActiveWorkspaceTabId(tabs, collapsed.activeTabId),
    stateByTabId,
  };
}

export function upsertWorkspaceTab(store: WorkspaceStore, tab: WorkspaceTab): WorkspaceStore {
  if (!isMeaningfulWorkspaceTab(tab)) {
    return normalizeWorkspaceStore(store);
  }

  const index = store.tabs.findIndex((candidate) => candidate.id === tab.id);
  if (index >= 0) {
    const nextTabs = [...store.tabs];
    nextTabs[index] = tab;
    return normalizeWorkspaceStore({ ...store, tabs: nextTabs });
  }

  return normalizeWorkspaceStore({
    ...store,
    tabs: [...store.tabs, tab],
  });
}

export function setActiveWorkspaceTab(store: WorkspaceStore, tabId: string | null): WorkspaceStore {
  return normalizeWorkspaceStore({
    ...store,
    activeTabId: tabId,
  });
}

export function activateWorkspaceTab(store: WorkspaceStore, tab: WorkspaceTab): WorkspaceStore {
  return setActiveWorkspaceTab(upsertWorkspaceTab(store, tab), tab.id);
}

export function removeWorkspaceTab(store: WorkspaceStore, tabId: string): WorkspaceStore {
  const remainingState = { ...store.stateByTabId };
  delete remainingState[tabId];
  return normalizeWorkspaceStore({
    tabs: store.tabs.filter((tab) => tab.id !== tabId),
    activeTabId: store.activeTabId === tabId ? null : store.activeTabId,
    stateByTabId: remainingState,
  });
}

export function cloneWorkspaceTabState(store: WorkspaceStore, sourceTabId: string, targetTabId: string): WorkspaceStore {
  const sourceState = store.stateByTabId[sourceTabId];
  if (!sourceState) {
    return store;
  }

  return {
    ...store,
    stateByTabId: {
      ...store.stateByTabId,
      [targetTabId]: structuredClone(sourceState),
    },
  };
}

export function setWorkspaceScopedState<T>(store: WorkspaceStore, tabId: string, scope: string, value: T): WorkspaceStore {
  return {
    ...store,
    stateByTabId: {
      ...store.stateByTabId,
      [tabId]: {
        ...(store.stateByTabId[tabId] ?? {}),
        [scope]: value,
      },
    },
  };
}

export function getWorkspaceScopedState<T>(store: WorkspaceStore, tabId: string, scope: string): T | null {
  const state = store.stateByTabId[tabId];
  if (!state || !(scope in state)) {
    return null;
  }

  return state[scope] as T;
}

export function clearWorkspaceScopedState(store: WorkspaceStore, tabId: string, scope: string): WorkspaceStore {
  const tabState = store.stateByTabId[tabId];
  if (!tabState || !(scope in tabState)) {
    return store;
  }

  const remainingScopeState = { ...tabState };
  delete remainingScopeState[scope];
  return {
    ...store,
    stateByTabId: {
      ...store.stateByTabId,
      [tabId]: remainingScopeState,
    },
  };
}

export function getWorkspaceBasePath(pathname: string): string {
  return normalizeWorkspacePathname(pathname).split("?")[0] || "/";
}

export function isDashboardWorkspacePath(pathname: string): boolean {
  return getWorkspaceBasePath(pathname) === "/dashboard";
}

export function findWorkspaceTabByBasePath(tabs: WorkspaceTab[], pathname: string): WorkspaceTab | undefined {
  const basePath = getWorkspaceBasePath(pathname);
  return [...tabs].reverse().find((tab) => getWorkspaceBasePath(tab.pathname) === basePath);
}

export function collapseDuplicateDashboardTabs(store: WorkspaceStore): WorkspaceStore {
  const dashboardTabs = store.tabs.filter(
    (tab) => isDashboardWorkspacePath(tab.pathname) && !tab.pathname.includes("?"),
  );
  if (dashboardTabs.length <= 1) {
    return store;
  }

  const keepId = dashboardTabs.some((tab) => tab.id === store.activeTabId)
    ? store.activeTabId
    : dashboardTabs[0]?.id;
  if (!keepId) {
    return store;
  }

  const dropIds = new Set(dashboardTabs.filter((tab) => tab.id !== keepId).map((tab) => tab.id));
  const remainingState = { ...store.stateByTabId };
  for (const tabId of dropIds) {
    delete remainingState[tabId];
  }

  return {
    ...store,
    tabs: store.tabs.filter((tab) => !dropIds.has(tab.id)),
    stateByTabId: remainingState,
  };
}

export function getWorkspaceSearchParams(pathname: string): URLSearchParams {
  const normalized = normalizeWorkspacePathname(pathname);
  const queryIndex = normalized.indexOf("?");
  return new URLSearchParams(queryIndex >= 0 ? normalized.slice(queryIndex + 1) : "");
}

export function buildWorkspaceHref(pathname: string, tabId: string): string {
  const [pathWithQuery, hashFragment = ""] = pathname.split("#");
  const [basePath, rawQuery = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(rawQuery);
  params.set(WORKSPACE_QUERY_PARAM, tabId);
  const query = params.toString();
  const hash = hashFragment ? `#${hashFragment}` : "";
  return `${query ? `${basePath}?${query}` : basePath}${hash}`;
}
