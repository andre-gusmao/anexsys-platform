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
  removeWorkspaceTab,
  setWorkspaceScopedState,
  upsertWorkspaceTab,
  type WorkspaceStore,
  type WorkspaceTab,
  WORKSPACE_QUERY_PARAM,
} from "@/components/app-shell/workspace-manager-store";

const STORAGE_KEY = "anexsys.frontend.workspace-manager.v1";

type WorkspaceManagerContextValue = {
  currentTabId: string | null;
  tabs: WorkspaceTab[];
  registerCurrentWorkspace: (input: { label: string; subtitle?: string | null }) => string | null;
  closeWorkspace: (tabId: string) => void;
  activateWorkspace: (tabId: string) => void;
  duplicateCurrentWorkspace: () => void;
  openWorkspaceInNewTab: (pathname: string, label: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
  openWorkspaceInBrowserTab: (pathname?: string, label?: string, opts?: { subtitle?: string | null; cloneCurrent?: boolean }) => void;
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
    return {
      tabs: parsed.tabs ?? [],
      stateByTabId: parsed.stateByTabId ?? {},
    };
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

  useEffect(() => {
    storeRef.current = store;
    writeStore(store);
  }, [store]);

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
      if (existingTab && existingTab.pathname === input.pathname) {
        const nextTab = {
          ...existingTab,
          label: input.label,
          subtitle: input.subtitle ?? null,
        };
        setStore((current) => upsertWorkspaceTab(current, nextTab));
        return existingTab.id;
      }

      const resolvedTabId = currentTabId ?? createTabId();
      const nextTab = createWorkspaceTab({
        id: resolvedTabId,
        pathname: input.pathname,
        label: input.label,
        subtitle: input.subtitle,
      });
      setStore((current) => upsertWorkspaceTab(current, nextTab));
      if (!currentTabId) {
        router.replace(buildWorkspaceHref(input.pathname, resolvedTabId));
      }
      return resolvedTabId;
    },
    [currentTabId, router],
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
        const dashboardTabId = createTabId();
        const dashboardTab = createWorkspaceTab({ id: dashboardTabId, pathname: "/dashboard", label: "Dashboard" });
        setStore(upsertWorkspaceTab(nextStore, dashboardTab));
        router.push(buildWorkspaceHref("/dashboard", dashboardTabId));
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
      let nextStore = upsertWorkspaceTab(
        storeRef.current,
        createWorkspaceTab({
          id: nextTabId,
          pathname: nextPathname,
          label,
          subtitle: opts.subtitle,
        }),
      );
      if (opts.cloneCurrent !== false && currentTabId) {
        nextStore = cloneWorkspaceTabState(nextStore, currentTabId, nextTabId);
      }

      setStore(nextStore);
      router.push(buildWorkspaceHref(nextPathname, nextTabId));
    },
    [currentTabId, router],
  );

  const openWorkspaceInBrowserTab = useCallback(
    (nextPathname?: string, label?: string, opts: { subtitle?: string | null; cloneCurrent?: boolean } = {}) => {
      const pathnameToOpen = nextPathname ?? pathname;
      const labelToOpen = label ?? storeRef.current.tabs.find((candidate) => candidate.id === currentTabId)?.label ?? "Workspace";
      const nextTabId = createTabId();
      let nextStore = upsertWorkspaceTab(
        storeRef.current,
        createWorkspaceTab({
          id: nextTabId,
          pathname: pathnameToOpen,
          label: labelToOpen,
          subtitle: opts.subtitle,
        }),
      );
      if (opts.cloneCurrent !== false && currentTabId) {
        nextStore = cloneWorkspaceTabState(nextStore, currentTabId, nextTabId);
      }
      setStore(nextStore);
      if (typeof window !== "undefined") {
        window.open(buildWorkspaceHref(pathnameToOpen, nextTabId), "_blank", "noopener,noreferrer");
      }
    },
    [currentTabId, pathname],
  );

  const duplicateCurrentWorkspace = useCallback(() => {
    const currentTab = currentTabId ? storeRef.current.tabs.find((candidate) => candidate.id === currentTabId) : null;
    if (!currentTab) {
      return;
    }

    openWorkspaceInNewTab(currentTab.pathname, currentTab.label, {
      subtitle: currentTab.subtitle,
      cloneCurrent: true,
    });
  }, [currentTabId, openWorkspaceInNewTab]);

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
      tabs: store.tabs,
      registerCurrentWorkspace: (input) => ensureWorkspaceTab({ pathname, ...input }),
      closeWorkspace,
      activateWorkspace,
      duplicateCurrentWorkspace,
      openWorkspaceInNewTab,
      openWorkspaceInBrowserTab,
      buildWorkspaceHref,
      readScopedState,
      writeScopedState,
      clearScopedState,
    }),
    [
      activateWorkspace,
      clearScopedState,
      closeWorkspace,
      currentTabId,
      duplicateCurrentWorkspace,
      ensureWorkspaceTab,
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
  const { currentTabId, openWorkspaceInBrowserTab, openWorkspaceInNewTab, registerCurrentWorkspace } = useWorkspaceManager();
  const { label, subtitle = null } = input;

  useEffect(() => {
    registerCurrentWorkspace({ label, subtitle });
  }, [label, registerCurrentWorkspace, subtitle]);

  return {
    currentTabId,
    openWorkspaceInBrowserTab,
    openWorkspaceInNewTab,
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
              type="button"
            >
              <span>{tab.label}</span>
              {tab.subtitle ? <small>{tab.subtitle}</small> : null}
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
