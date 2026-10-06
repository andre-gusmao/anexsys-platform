export const WORKSPACE_STORAGE_KEY = "anexsys.frontend.workspace-manager.v2";

const LEGACY_WORKSPACE_STORAGE_KEYS = ["anexsys.frontend.workspace-manager.v1"];

export function clearLegacyWorkspaceStores() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of LEGACY_WORKSPACE_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

export function clearPersistedWorkspaceStore() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  clearLegacyWorkspaceStores();
}
