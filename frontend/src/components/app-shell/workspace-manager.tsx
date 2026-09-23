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
  setWorkspaceScopedState,
  upsertWorkspaceTab,
  type WorkspaceStore,
  type WorkspaceTab,
  WORKSPACE_QUERY_PARAM,
} from "@/components/app-shell/workspace-manager-store";

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

type WorkspaceManagerContextValue = {
  currentTabId: string | null;
  currentTab: WorkspaceTab | null;
  tabs: WorkspaceTab[];
  registerCurrentWorkspace: (input: { label: string; subtitle?: string | null }) => string | null;
  closeWorkspace: (tabId: string) => void;
  activateWorkspace: (tabId: string) => void;
  openWorkspaceInNewTab: (pathname: string, label: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
  openWorkspaceInBrowserTab: (pathname?: string, label?: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
  openWorkspaceInBrowserWindow: (pathname?: string, label?: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
  getWorkspaceHref: (pathname: string, opts?: { preserveCurrent?: boolean }) => string;
  navigateWithinWorkspace: (pathname: string) => void;
  buildWorkspaceHref: (pathname: string, tabId: string) => string;
  readScopedState: <T,>(scope: string) => T | null;
  writeScopedState: <T,>(scope: string, value: T) => void;
  clearScopedState: (scope: string) => void;
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
  const currentTabId = searchParams.get(WORKSPACE_QUERY_PARAM);
  const [store, setStore] = useState<WorkspaceStore>(() => readStore());
  const storeRef = useRef(store);
  const currentTab = currentTabId ? store.tabs.find((candidate) => candidate.id === currentTabId) ?? null : null;
  const currentComparablePath = resolveComparableCurrentPath(pathname, searchParams);

  useEffect(() => {
    storeRef.current = store;
    writeStore(store);
  }, [store]);

  const findSingletonTabByPath = useCallback((targetPathname: string) => {
    const normalizedPath = normalizeWorkspacePathname(targetPathname);
    if (!isSingletonWorkspacePath(normalizedPath)) {
      return null;
    }

    return storeRef.current.tabs.find((candidate) => candidate.pathname === normalizedPath) ?? null;
  }, []);

  useEffect(() => {
    if (!currentTabId || !currentTab) {
      return;
    }

    if (currentComparablePath === currentTab.pathname) {
      return;
    }

    router.replace(buildWorkspaceHref(currentTab.pathname, currentTab.id));
  }, [currentComparablePath, currentTab, currentTabId, router]);

  const activateWorkspace = useCallback(
    (tabId: string) => {
      const target = storeRef.current.tabs.find((candidate) => candidate.id === tabId);
      if (!target) {
        return;
      }

      router.push(buildWorkspaceHref(target.pathname, tabId));
    },
    [router],
  );

  const ensureWorkspaceTab = useCallback(
    (input: { pathname: string; label: string; subtitle?: string | null }) => {
      const existingTab = currentTabId ? storeRef.current.tabs.find((candidate) => candidate.id === currentTabId) : null;
      const nextTabDefinition = createWorkspaceTab({
        id: currentTabId ?? createTabId(),
        pathname: input.pathname,
        label: input.label,
        subtitle: input.subtitle,
      });
      if (!isMeaningfulWorkspaceTab(nextTabDefinition)) {
        return null;
      }

      if (!currentTabId) {
        const singletonTab = findSingletonTabByPath(nextTabDefinition.pathname);
        if (singletonTab) {
          router.replace(buildWorkspaceHref(singletonTab.pathname, singletonTab.id));
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

      const resolvedTabId = nextTabDefinition.id;
      setStore((current) => upsertWorkspaceTab(current, nextTabDefinition));
      if (!currentTabId) {
        router.replace(buildWorkspaceHref(nextTabDefinition.pathname, resolvedTabId));
      }
      return resolvedTabId;
    },
    [currentTabId, findSingletonTabByPath, router],
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
        setStore(upsertWorkspaceTab(nextStore, dashboardTab));
        router.push(buildWorkspaceHref(DASHBOARD_PATH, dashboardTab.id));
        return;
      }

      const fallbackTab = remainingTabs[Math.max(Math.min(closingTabIndex, remainingTabs.length - 1), 0)] ?? remainingTabs[0];
      router.push(buildWorkspaceHref(fallbackTab.pathname, fallbackTab.id));
    },
    [currentTabId, router],
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
        router.push(buildWorkspaceHref(singletonTab.pathname, singletonTab.id));
        return;
      }

      let nextStore = upsertWorkspaceTab(storeRef.current, nextTab);
      if (opts.cloneCurrent !== false && currentTabId) {
        nextStore = cloneWorkspaceTabState(nextStore, currentTabId, nextTabId);
      }

      setStore(nextStore);
      router.push(buildWorkspaceHref(nextTab.pathname, nextTabId));
    },
    [currentTabId, findSingletonTabByPath, router],
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
      router.push(getWorkspaceHref(nextPathname));
    },
    [getWorkspaceHref, router],
  );

  const readScopedState = useCallback(
    <T,>(scope: string): T | null => {
      if (!currentTabId) {
        return null;
      }

      return getWorkspaceScopedState<T>(storeRef.current, currentTabId, scope);
    },
    [currentTabId],
  );

  const writeScopedState = useCallback(
    <T,>(scope: string, value: T) => {
      if (!currentTabId) {
        return;
      }

      setStore((current) => setWorkspaceScopedState(current, currentTabId, scope, value));
    },
    [currentTabId],
  );

  const clearScopedState = useCallback(
    (scope: string) => {
      if (!currentTabId) {
        return;
      }

      setStore((current) => clearWorkspaceScopedState(current, currentTabId, scope));
    },
    [currentTabId],
  );

  const value = useMemo<WorkspaceManagerContextValue>(
    () => ({
      currentTabId,
      currentTab,
      tabs: store.tabs,
      registerCurrentWorkspace: (input) => ensureWorkspaceTab({ pathname, ...input }),
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
      pathname,
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
  const { label, subtitle = null } = input;

  useEffect(() => {
    registerCurrentWorkspace({ label, subtitle });
  }, [label, registerCurrentWorkspace, subtitle]);

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
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() => initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue, scope]);

  useEffect(() => {
    if (!currentTabId) {
      setValue(initialValueRef.current);
      setHydrated(false);
      return;
    }

    const stored = readScopedState<T>(scope);
    setValue(stored ?? initialValueRef.current);
    setHydrated(true);
  }, [currentTabId, readScopedState, scope]);

  const setPersistedValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = next instanceof Function ? next(current) : next;
        writeScopedState(scope, resolved);
        return resolved;
      });
    },
    [scope, writeScopedState],
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
