"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  activateWorkspaceTab,
  buildWorkspaceHref,
  clearWorkspaceScopedState,
  cloneWorkspaceTabState,
  createEmptyWorkspaceStore,
  createWorkspaceTab,
  getWorkspaceScopedState,
  isMeaningfulWorkspaceTab,
  normalizeWorkspacePathname,
  normalizeWorkspaceStore,
  removeWorkspaceTab,
  setActiveWorkspaceTab,
  setWorkspaceScopedState,
  upsertWorkspaceTab,
  type WorkspaceStore,
  type WorkspaceTab,
  WORKSPACE_QUERY_PARAM,
} from "@/components/app-shell/workspace-manager-store";
import { useWorkspacePane } from "@/components/app-shell/workspace-pane";

const STORAGE_KEY = "anexsys.frontend.workspace-manager.v1";
const DASHBOARD_PATH = "/dashboard";

function isSingletonWorkspacePath(pathname: string) {
  return !pathname.includes("?") && !pathname.includes("#");
}

function resolveComparableCurrentPath(pathname: string, searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete(WORKSPACE_QUERY_PARAM);
  const query = params.toString();
  return normalizeWorkspacePathname(query ? `${pathname}?${query}` : pathname);
}

type WorkspaceRegistrationInput = {
  label: string;
  subtitle?: string | null;
  pathname?: string;
  tabId?: string;
};

type WorkspaceManagerContextValue = {
  currentTabId: string | null;
  currentTab: WorkspaceTab | null;
  tabs: WorkspaceTab[];
  registerCurrentWorkspace: (input: WorkspaceRegistrationInput) => string | null;
  closeWorkspace: (tabId: string) => void;
  activateWorkspace: (tabId: string) => void;
  openWorkspaceInNewTab: (pathname: string, label: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
  openWorkspaceInBrowserTab: (pathname?: string, label?: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
  openWorkspaceInBrowserWindow: (pathname?: string, label?: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
  getWorkspaceHref: (pathname: string, opts?: { preserveCurrent?: boolean }) => string;
  navigateWithinWorkspace: (pathname: string) => void;
  buildWorkspaceHref: (pathname: string, tabId: string) => string;
  readScopedState: <T,>(scope: string, tabId?: string | null) => T | null;
  writeScopedState: <T,>(scope: string, value: T, tabId?: string | null) => void;
  clearScopedState: (scope: string, tabId?: string | null) => void;
};

const WorkspaceManagerContext = createContext<WorkspaceManagerContextValue | null>(null);

function createTabId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return ["tab", Date.now().toString(36), Math.random().toString(36).slice(2, 10)].join("-");
}

function readStore(): WorkspaceStore {
  if (typeof window === "undefined") {
    return createEmptyWorkspaceStore();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyWorkspaceStore();
  }

  try {
    const parsed = JSON.parse(raw) as WorkspaceStore;
    return normalizeWorkspaceStore({
      tabs: parsed.tabs ?? [],
      activeTabId: parsed.activeTabId ?? null,
      stateByTabId: parsed.stateByTabId ?? {},
    });
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return createEmptyWorkspaceStore();
  }
}

function writeStore(store: WorkspaceStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function WorkspaceManagerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTabId = searchParams.get(WORKSPACE_QUERY_PARAM);
  const [store, setStore] = useState<WorkspaceStore>(() => readStore());
  const storeRef = useRef(store);
  const hydratedFromUrlRef = useRef(false);
  const lastSyncedHrefRef = useRef<string | null>(null);
  const currentTabId = store.activeTabId;
  const currentTab = currentTabId ? store.tabs.find((candidate) => candidate.id === currentTabId) ?? null : null;
  const currentComparablePath = resolveComparableCurrentPath(pathname, searchParams);

  useEffect(() => {
    storeRef.current = store;
    writeStore(store);
  }, [store]);

  useEffect(() => {
    if (hydratedFromUrlRef.current) {
      return;
    }

    hydratedFromUrlRef.current = true;
    if (urlTabId && storeRef.current.tabs.some((tab) => tab.id === urlTabId)) {
      setStore((current) => setActiveWorkspaceTab(current, urlTabId));
    }
  }, [urlTabId]);

  const findSingletonTabByPath = useCallback((targetPathname: string) => {
    const normalizedPath = normalizeWorkspacePathname(targetPathname);
    if (!isSingletonWorkspacePath(normalizedPath)) {
      return null;
    }

    return storeRef.current.tabs.find((candidate) => candidate.pathname === normalizedPath) ?? null;
  }, []);

  const syncWorkspaceUrl = useCallback(
    (targetPathname: string, tabId: string) => {
      const href = buildWorkspaceHref(targetPathname, tabId);
      if (lastSyncedHrefRef.current === href) {
        return;
      }
      if (currentComparablePath === normalizeWorkspacePathname(targetPathname) && urlTabId === tabId) {
        lastSyncedHrefRef.current = href;
        return;
      }
      lastSyncedHrefRef.current = href;
      router.replace(href);
    },
    [currentComparablePath, router, urlTabId],
  );

  const activateWorkspace = useCallback(
    (tabId: string) => {
      const target = storeRef.current.tabs.find((candidate) => candidate.id === tabId);
      if (!target) {
        return;
      }

      setStore((current) => setActiveWorkspaceTab(current, tabId));
      syncWorkspaceUrl(target.pathname, tabId);
    },
    [syncWorkspaceUrl],
  );

  const ensureWorkspaceTab = useCallback(
    (input: WorkspaceRegistrationInput) => {
      const resolvedPathname = input.pathname ?? currentComparablePath;
      const effectiveTabId = storeRef.current.activeTabId;

      if (input.tabId && input.tabId !== effectiveTabId) {
        const paneTab = storeRef.current.tabs.find((candidate) => candidate.id === input.tabId);
        if (!paneTab) {
          return null;
        }

        const hydratedPaneTab = {
          ...paneTab,
          label: input.label.trim(),
          subtitle: input.subtitle?.trim() || null,
        };
        if (hydratedPaneTab.label !== paneTab.label || hydratedPaneTab.subtitle !== paneTab.subtitle) {
          setStore((current) => upsertWorkspaceTab(current, hydratedPaneTab));
        }
        return paneTab.id;
      }

      const existingTab = (input.tabId ?? effectiveTabId)
        ? storeRef.current.tabs.find((candidate) => candidate.id === (input.tabId ?? effectiveTabId))
        : null;
      const nextTabDefinition = createWorkspaceTab({
        id: existingTab?.id ?? createTabId(),
        pathname: resolvedPathname,
        label: input.label,
        subtitle: input.subtitle,
      });
      if (!isMeaningfulWorkspaceTab(nextTabDefinition)) {
        return null;
      }

      if (!effectiveTabId) {
        const singletonTab = findSingletonTabByPath(nextTabDefinition.pathname);
        if (singletonTab) {
          setStore((current) => setActiveWorkspaceTab(current, singletonTab.id));
          syncWorkspaceUrl(singletonTab.pathname, singletonTab.id);
          return singletonTab.id;
        }
      }

      if (existingTab && existingTab.pathname === nextTabDefinition.pathname) {
        const hydratedTab = {
          ...existingTab,
          label: nextTabDefinition.label,
          subtitle: nextTabDefinition.subtitle ?? null,
        };
        setStore((current) => upsertWorkspaceTab(current, hydratedTab));
        return existingTab.id;
      }

      if (existingTab && isSingletonWorkspacePath(existingTab.pathname) && existingTab.pathname !== nextTabDefinition.pathname) {
        const singletonTab = findSingletonTabByPath(nextTabDefinition.pathname);
        if (singletonTab) {
          setStore((current) => setActiveWorkspaceTab(current, singletonTab.id));
          syncWorkspaceUrl(singletonTab.pathname, singletonTab.id);
          return singletonTab.id;
        }

        const createdTab = createWorkspaceTab({
          id: createTabId(),
          pathname: nextTabDefinition.pathname,
          label: nextTabDefinition.label,
          subtitle: nextTabDefinition.subtitle,
        });
        setStore((current) => activateWorkspaceTab(current, createdTab));
        syncWorkspaceUrl(createdTab.pathname, createdTab.id);
        return createdTab.id;
      }

      setStore((current) => {
        const next = upsertWorkspaceTab(current, nextTabDefinition);
        return next.activeTabId ? next : setActiveWorkspaceTab(next, nextTabDefinition.id);
      });
      if (!effectiveTabId) {
        syncWorkspaceUrl(nextTabDefinition.pathname, nextTabDefinition.id);
      }
      return nextTabDefinition.id;
    },
    [currentComparablePath, findSingletonTabByPath, syncWorkspaceUrl],
  );

  const closeWorkspace = useCallback(
    (tabId: string) => {
      const closingTabIndex = storeRef.current.tabs.findIndex((candidate) => candidate.id === tabId);
      const nextStore = removeWorkspaceTab(storeRef.current, tabId);
      setStore(nextStore);

      if (tabId !== currentTabId) {
        return;
      }

      const remainingTabs = nextStore.tabs;
      if (remainingTabs.length === 0) {
        const dashboardTab = createWorkspaceTab({ id: createTabId(), pathname: DASHBOARD_PATH, label: "Dashboard" });
        setStore(activateWorkspaceTab(nextStore, dashboardTab));
        syncWorkspaceUrl(DASHBOARD_PATH, dashboardTab.id);
        return;
      }

      const fallbackTab = remainingTabs[Math.max(Math.min(closingTabIndex, remainingTabs.length - 1), 0)] ?? remainingTabs[0];
      setStore(setActiveWorkspaceTab(nextStore, fallbackTab.id));
      syncWorkspaceUrl(fallbackTab.pathname, fallbackTab.id);
    },
    [currentTabId, syncWorkspaceUrl],
  );

  const openWorkspaceInNewTab = useCallback(
    (nextPathname: string, label: string, opts: { subtitle?: string | null; cloneCurrent?: boolean } = {}) => {
      const nextTabId = createTabId();
      const nextTab = createWorkspaceTab({
        id: nextTabId,
        pathname: nextPathname,
        label,
        subtitle: opts.subtitle,
      });
      if (!isMeaningfulWorkspaceTab(nextTab)) {
        return;
      }

      const singletonTab = findSingletonTabByPath(nextTab.pathname);
      if (singletonTab) {
        setStore((current) => setActiveWorkspaceTab(current, singletonTab.id));
        syncWorkspaceUrl(singletonTab.pathname, singletonTab.id);
        return;
      }

      let nextStore = activateWorkspaceTab(storeRef.current, nextTab);
      if (opts.cloneCurrent !== false && currentTabId) {
        nextStore = cloneWorkspaceTabState(nextStore, currentTabId, nextTabId);
        nextStore = setActiveWorkspaceTab(nextStore, nextTabId);
      }

      setStore(nextStore);
      syncWorkspaceUrl(nextTab.pathname, nextTabId);
    },
    [currentTabId, findSingletonTabByPath, syncWorkspaceUrl],
  );

  const openWorkspaceInBrowserTab = useCallback(
    (nextPathname?: string, label?: string, opts: { subtitle?: string | null; cloneCurrent?: boolean } = {}) => {
      const pathnameToOpen = nextPathname ?? currentTab?.pathname;
      const labelToOpen = label ?? currentTab?.label;
      if (!pathnameToOpen || !labelToOpen) {
        return;
      }

      const nextTabId = createTabId();
      const nextTab = createWorkspaceTab({
        id: nextTabId,
        pathname: pathnameToOpen,
        label: labelToOpen,
        subtitle: opts.subtitle,
      });
      if (!isMeaningfulWorkspaceTab(nextTab)) {
        return;
      }

      let nextStore = upsertWorkspaceTab(storeRef.current, nextTab);
      if (opts.cloneCurrent !== false && currentTabId) {
        nextStore = cloneWorkspaceTabState(nextStore, currentTabId, nextTabId);
      }
      setStore(nextStore);
      if (typeof window !== "undefined") {
        window.open(buildWorkspaceHref(nextTab.pathname, nextTabId), "_blank", "noopener,noreferrer");
      }
    },
    [currentTab, currentTabId],
  );

  const openWorkspaceInBrowserWindow = useCallback(
    (nextPathname?: string, label?: string, opts: { subtitle?: string | null; cloneCurrent?: boolean } = {}) => {
      const pathnameToOpen = nextPathname ?? currentTab?.pathname;
      const labelToOpen = label ?? currentTab?.label;
      if (!pathnameToOpen || !labelToOpen) {
        return;
      }

      const nextTabId = createTabId();
      const nextTab = createWorkspaceTab({
        id: nextTabId,
        pathname: pathnameToOpen,
        label: labelToOpen,
        subtitle: opts.subtitle,
      });
      if (!isMeaningfulWorkspaceTab(nextTab)) {
        return;
      }

      let nextStore = upsertWorkspaceTab(storeRef.current, nextTab);
      if (opts.cloneCurrent !== false && currentTabId) {
        nextStore = cloneWorkspaceTabState(nextStore, currentTabId, nextTabId);
      }
      setStore(nextStore);
      if (typeof window !== "undefined") {
        window.open(buildWorkspaceHref(nextTab.pathname, nextTabId), "_blank", "popup=yes,width=1440,height=900,noopener");
      }
    },
    [currentTab, currentTabId],
  );

  const getWorkspaceHref = useCallback(
    (nextPathname: string, opts: { preserveCurrent?: boolean } = {}) => {
      if (opts.preserveCurrent !== false && currentTabId) {
       return buildWorkspaceHref(nextPathname, currentTabId);
      }

      return nextPathname;
    },
    [currentTabId],
  );

  const navigateWithinWorkspace = useCallback(
    (nextPathname: string) => {
      const tabId = storeRef.current.activeTabId;
      if (!tabId) {
        if (lastSyncedHrefRef.current === nextPathname) {
          return;
        }
        lastSyncedHrefRef.current = nextPathname;
        router.replace(nextPathname);
        return;
      }

      const existingTab = storeRef.current.tabs.find((candidate) => candidate.id === tabId);
      if (existingTab) {
        setStore((current) =>
          setActiveWorkspaceTab(
            upsertWorkspaceTab(current, {
              ...existingTab,
              pathname: normalizeWorkspacePathname(nextPathname),
            }),
            tabId,
          ),
        );
      }

      syncWorkspaceUrl(nextPathname, tabId);
    },
    [router, syncWorkspaceUrl],
  );

  const readScopedState = useCallback(<T,>(scope: string, tabId?: string | null): T | null => {
    const resolvedTabId = tabId ?? storeRef.current.activeTabId;
    if (!resolvedTabId) {
      return null;
    }

    return getWorkspaceScopedState<T>(storeRef.current, resolvedTabId, scope);
  }, []);

  const writeScopedState = useCallback((scope: string, value: unknown, tabId?: string | null) => {
    const resolvedTabId = tabId ?? storeRef.current.activeTabId;
    if (!resolvedTabId) {
      return;
    }

    setStore((current) => setWorkspaceScopedState(current, resolvedTabId, scope, value));
  }, []);

  const clearScopedState = useCallback((scope: string, tabId?: string | null) => {
    const resolvedTabId = tabId ?? storeRef.current.activeTabId;
    if (!resolvedTabId) {
      return;
    }

    setStore((current) => clearWorkspaceScopedState(current, resolvedTabId, scope));
  }, []);

  const value = useMemo<WorkspaceManagerContextValue>(
    () => ({
      currentTabId,
      currentTab,
      tabs: store.tabs,
      registerCurrentWorkspace: (input) =>
        ensureWorkspaceTab({
          pathname: input.pathname ?? currentComparablePath,
          label: input.label,
          subtitle: input.subtitle,
          tabId: input.tabId,
        }),
      closeWorkspace,
      activateWorkspace,
      openWorkspaceInNewTab,
      openWorkspaceInBrowserTab,
      openWorkspaceInBrowserWindow,
      getWorkspaceHref,
      navigateWithinWorkspace,
      buildWorkspaceHref,
      readScopedState,
      writeScopedState,
      clearScopedState,
    }),
    [
      activateWorkspace,
      clearScopedState,
      closeWorkspace,
      currentTab,
      currentTabId,
      getWorkspaceHref,
      navigateWithinWorkspace,
      ensureWorkspaceTab,
      openWorkspaceInBrowserWindow,
      openWorkspaceInBrowserTab,
      openWorkspaceInNewTab,
      currentComparablePath,
      readScopedState,
      store.tabs,
      writeScopedState,
    ],
  );

  return <WorkspaceManagerContext.Provider value={value}>{children}</WorkspaceManagerContext.Provider>;
}

export function useWorkspaceManager() {
  const context = useContext(WorkspaceManagerContext);
  if (!context) {
    throw new Error("useWorkspaceManager must be used inside WorkspaceManagerProvider.");
  }

  return context;
}

export function useWorkspaceRegistration(input: { label: string; subtitle?: string | null }) {
  const {
    currentTab,
    currentTabId,
    openWorkspaceInBrowserTab,
    openWorkspaceInBrowserWindow,
    openWorkspaceInNewTab,
    navigateWithinWorkspace,
    registerCurrentWorkspace,
  } = useWorkspaceManager();
  const pane = useWorkspacePane();
  const { label, subtitle = null } = input;

  useEffect(() => {
    registerCurrentWorkspace({
      label,
      subtitle,
      pathname: pane?.pathname,
      tabId: pane?.tabId,
    });
  }, [label, pane?.pathname, pane?.tabId, registerCurrentWorkspace, subtitle]);

  return {
    currentTab,
    currentTabId,
    openWorkspaceInBrowserTab,
    openWorkspaceInBrowserWindow,
    openWorkspaceInNewTab,
    navigateWithinWorkspace,
  };
}

export function useWorkspaceScopedState<T>(scope: string, initialValue: T): [T, (value: T | ((current: T) => T)) => void, boolean] {
  const { currentTabId, readScopedState, writeScopedState } = useWorkspaceManager();
  const pane = useWorkspacePane();
  const scopedTabId = pane?.tabId ?? currentTabId;
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() => initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue, scope]);

  useEffect(() => {
    if (!scopedTabId) {
      setValue(initialValueRef.current);
      setHydrated(false);
      return;
    }

    const stored = readScopedState<T>(scope, scopedTabId);
    setValue(stored ?? initialValueRef.current);
    setHydrated(true);
  }, [readScopedState, scope, scopedTabId]);

  const setPersistedValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = next instanceof Function ? next(current) : next;
        writeScopedState(scope, resolved, scopedTabId);
        return resolved;
      });
    },
    [scope, scopedTabId, writeScopedState],
  );

  return [value, setPersistedValue, hydrated];
}

export function WorkspaceTabsBar() {
  const { currentTabId, tabs, activateWorkspace, closeWorkspace } = useWorkspaceManager();

  return (
    <div className="workspace-tabs" role="tablist" aria-label="Internal workspaces">
      {tabs.map((tab) => {
        const active = tab.id === currentTabId;
        return (
          <div className={`workspace-tab${active ? " workspace-tab--active" : ""}`} key={tab.id} role="presentation">
            <button
              aria-selected={active}
              className="workspace-tab__trigger"
              onClick={() => activateWorkspace(tab.id)}
              role="tab"
              title={tab.subtitle ? `${tab.label} · ${tab.subtitle}` : tab.label}
              type="button"
            >
              <span className="workspace-tab__title">{tab.label}</span>
              {tab.subtitle ? <small className="workspace-tab__subtitle">{tab.subtitle}</small> : null}
            </button>
            <button
              aria-label={`Close ${tab.label}`}
              className="workspace-tab__close"
              onClick={() => closeWorkspace(tab.id)}
              type="button"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
