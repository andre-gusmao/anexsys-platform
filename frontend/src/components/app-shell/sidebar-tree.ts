export const SIDEBAR_TREE_STORAGE_KEY = "anexsys.frontend.sidebar-tree.v1";
const SIDEBAR_TREE_EVENT = "anexsys-sidebar-tree";

export type SidebarTreeState = {
  collapsedSections: string[];
  collapsedItems: string[];
};

const emptyTree: SidebarTreeState = {
  collapsedSections: [],
  collapsedItems: [],
};

let cachedRaw: string | null = null;
let cachedTree: SidebarTreeState = emptyTree;

export function createEmptySidebarTree(): SidebarTreeState {
  return emptyTree;
}

export function toggleTreeId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function normalizeSidebarTree(state: SidebarTreeState): SidebarTreeState {
  return {
    collapsedSections: [...new Set(state.collapsedSections.filter((id) => id.trim()))],
    collapsedItems: [...new Set(state.collapsedItems.filter((id) => id.trim()))],
  };
}

export function readSidebarTree(): SidebarTreeState {
  if (typeof window === "undefined") {
    return emptyTree;
  }

  const raw = window.localStorage.getItem(SIDEBAR_TREE_STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedTree;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedTree = emptyTree;
    return cachedTree;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SidebarTreeState>;
    cachedTree = normalizeSidebarTree({
      collapsedSections: Array.isArray(parsed.collapsedSections) ? parsed.collapsedSections.map(String) : [],
      collapsedItems: Array.isArray(parsed.collapsedItems) ? parsed.collapsedItems.map(String) : [],
    });
  } catch {
    cachedTree = emptyTree;
  }

  return cachedTree;
}

export function writeSidebarTree(state: SidebarTreeState) {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = normalizeSidebarTree(state);
  const raw = JSON.stringify(normalized);
  window.localStorage.setItem(SIDEBAR_TREE_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedTree = normalized;
  window.dispatchEvent(new Event(SIDEBAR_TREE_EVENT));
}

export function subscribeSidebarTree(onChange: () => void) {
  window.addEventListener(SIDEBAR_TREE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SIDEBAR_TREE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
