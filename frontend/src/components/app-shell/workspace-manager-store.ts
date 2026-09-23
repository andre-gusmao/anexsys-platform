export type WorkspaceTab = {
  id: string;
  pathname: string;
  label: string;
  subtitle?: string | null;
};

export type WorkspaceTabState = Record<string, unknown>;

export type WorkspaceStore = {
  tabs: WorkspaceTab[];
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
    stateByTabId: {},
  };
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
  const tabs = store.tabs.map((tab) => createWorkspaceTab(tab)).filter(isMeaningfulWorkspaceTab);
  const validTabIds = new Set(tabs.map((tab) => tab.id));
  const stateByTabId = Object.fromEntries(
    Object.entries(store.stateByTabId).filter(([tabId]) => validTabIds.has(tabId)),
  );

  return {
    tabs,
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

export function removeWorkspaceTab(store: WorkspaceStore, tabId: string): WorkspaceStore {
  const remainingState = { ...store.stateByTabId };
  delete remainingState[tabId];
  return normalizeWorkspaceStore({
    tabs: store.tabs.filter((tab) => tab.id !== tabId),
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

export function buildWorkspaceHref(pathname: string, tabId: string): string {
  const [pathWithQuery, hashFragment = ""] = pathname.split("#");
  const [basePath, rawQuery = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(rawQuery);
  params.set(WORKSPACE_QUERY_PARAM, tabId);
  const query = params.toString();
  const hash = hashFragment ? `#${hashFragment}` : "";
  return `${query ? `${basePath}?${query}` : basePath}${hash}`;
}
