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
    id: input.id,
    pathname: input.pathname,
    label: input.label,
    subtitle: input.subtitle ?? null,
  };
}

export function upsertWorkspaceTab(store: WorkspaceStore, tab: WorkspaceTab): WorkspaceStore {
  const index = store.tabs.findIndex((candidate) => candidate.id === tab.id);
  if (index >= 0) {
    const nextTabs = [...store.tabs];
    nextTabs[index] = tab;
    return { ...store, tabs: nextTabs };
  }

  return {
    ...store,
    tabs: [...store.tabs, tab],
  };
}

export function removeWorkspaceTab(store: WorkspaceStore, tabId: string): WorkspaceStore {
  const remainingState = { ...store.stateByTabId };
  delete remainingState[tabId];
  return {
    tabs: store.tabs.filter((tab) => tab.id !== tabId),
    stateByTabId: remainingState,
  };
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
  const [basePath, rawQuery = ""] = pathname.split("?");
  const params = new URLSearchParams(rawQuery);
  params.set(WORKSPACE_QUERY_PARAM, tabId);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
