"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type KnownTenantOption = {
  id: string;
  label: string;
  hint?: string;
};

type BranchOption = {
  id: string;
  label: string;
  hint?: string;
};

type AuthenticatedUser = {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  defaultBranchId: string | null;
  status?: string;
};

type SessionRecord = {
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  permissions: string[];
  branchIds: string[];
  activeBranchId: string | null;
  user: AuthenticatedUser | null;
  branches: BranchOption[];
};

type SessionStatus = "loading" | "anonymous" | "branch-selection" | "authenticated";

type LoginInput = {
  tenantId: string;
  email: string;
  password: string;
};

type SessionContextValue = {
  status: SessionStatus;
  session: SessionRecord | null;
  knownTenants: KnownTenantOption[];
  errorMessage: string | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  selectBranch: (branchId: string) => boolean;
  clearError: () => void;
  hasAnyPermission: (...permissions: string[]) => boolean;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  branchIds: string[];
  permissions: string[];
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};

type MeResponse = {
  user: AuthenticatedUser;
  effectiveAccess: {
    branchIds: string[];
    permissions: string[];
  };
  context: {
    tenantId: string;
    branchId: string | null;
  };
};

type BranchResponse = {
  id?: string;
  code?: string;
  displayName?: string;
  legalName?: string;
  status?: string;
};

const STORAGE_KEY = "anexsys.frontend.session.v1";
const SESSION_EXPIRED_EVENT = "anexsys:session-expired";
const API_BASE = "/backend-api";

class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const SessionContext = createContext<SessionContextValue | null>(null);

function getInitialState(): { status: SessionStatus; session: SessionRecord | null } {
  const session = readStoredSession();
  return {
    status: session ? "loading" : "anonymous",
    session,
  };
}

function parseKnownTenants(): KnownTenantOption[] {
  const raw = process.env.NEXT_PUBLIC_TENANT_OPTIONS;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => typeof entry.id === "string" && entry.id.length > 0)
      .map((entry) => ({
        id: String(entry.id),
        label: typeof entry.label === "string" && entry.label.length > 0 ? entry.label : String(entry.id),
        hint: typeof entry.hint === "string" ? entry.hint : undefined,
      }));
  } catch {
    return [];
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.length > 0) return message;
  return fallback;
}

function parsePayload(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = parsePayload(text);

  if (!response.ok) {
    throw new HttpError(response.status, getErrorMessage(payload, "Request failed."));
  }

  return payload as T;
}

function readStoredSession(): SessionRecord | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionRecord;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session: SessionRecord | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

async function refreshSession(session: SessionRecord): Promise<SessionRecord> {
  const refreshed = await requestJson<RefreshResponse>("/auth/token/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  return {
    ...session,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    sessionId: refreshed.sessionId,
  };
}

function broadcastSessionExpired(message: string) {
  writeStoredSession(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
  }
}

function buildHeaders(session: SessionRecord, branchId?: string | null): HeadersInit {
  return {
    authorization: ["Bearer", session.accessToken].join(" "),
    "x-tenant-id": session.tenantId,
    ...(branchId ? { "x-branch-id": branchId } : {}),
  };
}

function mapBranches(input: BranchResponse[] | null, fallbackIds: string[]): BranchOption[] {
  if (!input || input.length === 0) {
    return fallbackIds.map((branchId) => ({
      id: branchId,
      label: branchId,
      hint: "Visible through effective access.",
    }));
  }

  return input
    .filter((branch): branch is Required<Pick<BranchResponse, "id">> & BranchResponse => typeof branch.id === "string")
    .map((branch) => ({
      id: branch.id,
      label: branch.displayName ?? branch.code ?? branch.legalName ?? branch.id,
      hint: [branch.code, branch.status].filter(Boolean).join(" · ") || undefined,
    }));
}

async function authenticatedRequest<T>(
  session: SessionRecord,
  path: string,
  init: RequestInit,
  opts: { allowRefresh?: boolean; branchId?: string | null } = {},
): Promise<{ data: T; session: SessionRecord }> {
  let workingSession = session;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...buildHeaders(workingSession, opts.branchId ?? workingSession.activeBranchId),
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    const payload = parsePayload(text);

    if (response.ok) {
      return { data: payload as T, session: workingSession };
    }

    if (response.status === 401 && opts.allowRefresh !== false && attempt === 0 && workingSession.refreshToken) {
      try {
        workingSession = await refreshSession(workingSession);
      } catch {
        broadcastSessionExpired("Session expired. Please sign in again.");
        throw new HttpError(401, "Session expired. Please sign in again.");
      }
      continue;
    }

    throw new HttpError(response.status, getErrorMessage(payload, "Authenticated request failed."));
  }

  throw new HttpError(401, "Session refresh failed.");
}

function resolveActiveBranchId(
  branchIds: string[],
  branches: BranchOption[],
  user: AuthenticatedUser,
  currentBranchId: string | null,
  preferredBranchId: string | null,
) {
  const allowed = new Set(branchIds);
  const branchCandidates = [preferredBranchId, currentBranchId, user.defaultBranchId].filter(
    (value): value is string => Boolean(value),
  );

  for (const branchId of branchCandidates) {
    if (allowed.has(branchId)) return branchId;
  }

  if (branchIds.length === 1) return branchIds[0];
  if (branches.length === 1 && allowed.has(branches[0].id)) return branches[0].id;
  return null;
}

export function SessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const initialState = useMemo(() => getInitialState(), []);
  const knownTenants = useMemo(() => parseKnownTenants(), []);
  const [status, setStatus] = useState<SessionStatus>(initialState.status);
  const [session, setSession] = useState<SessionRecord | null>(initialState.session);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sessionRef = useRef<SessionRecord | null>(null);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const hydrateSession = useCallback(
    async (candidate: SessionRecord, preferredBranchId?: string | null) => {
      const meResult = await authenticatedRequest<MeResponse>(candidate, "/auth/me", { method: "GET" });
      const me = meResult.data;
      let workingSession = {
        ...candidate,
        accessToken: meResult.session.accessToken,
        refreshToken: meResult.session.refreshToken,
        sessionId: meResult.session.sessionId,
        permissions: me.effectiveAccess.permissions,
        branchIds: me.effectiveAccess.branchIds,
        user: me.user,
      };

      let branches: BranchOption[] = [];
      try {
        const branchResult = await authenticatedRequest<BranchResponse[]>(
          workingSession,
          "/branches",
          { method: "GET" },
          { branchId: null },
        );
        workingSession = {
          ...workingSession,
          accessToken: branchResult.session.accessToken,
          refreshToken: branchResult.session.refreshToken,
          sessionId: branchResult.session.sessionId,
        };
        branches = mapBranches(branchResult.data, me.effectiveAccess.branchIds);
      } catch {
        branches = mapBranches(null, me.effectiveAccess.branchIds);
      }

      const activeBranchId = resolveActiveBranchId(
        me.effectiveAccess.branchIds,
        branches,
        me.user,
        me.context.branchId,
        preferredBranchId ?? candidate.activeBranchId,
      );

      const resolved = {
        ...workingSession,
        activeBranchId,
        branches,
      };

      setSession(resolved);
      setStatus(activeBranchId || resolved.branchIds.length === 0 ? "authenticated" : "branch-selection");
      setErrorMessage(null);
      return resolved;
    },
    [],
  );

  useEffect(() => {
    sessionRef.current = session;
    writeStoredSession(session);
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSessionExpired = (event: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as { message?: string } | undefined) : undefined;
      sessionRef.current = null;
      setSession(null);
      setStatus("anonymous");
      setErrorMessage(detail?.message ?? "Session expired. Please sign in again.");
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
  }, []);

  useEffect(() => {
    const existing = initialState.session;
    if (!existing) {
      return;
    }

    // Session restoration intentionally rehydrates client state from persisted local storage on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrateSession(existing).catch((error: unknown) => {
      writeStoredSession(null);
      sessionRef.current = null;
      setSession(null);
      setStatus("anonymous");
      setErrorMessage(error instanceof Error ? error.message : "Session could not be restored.");
    });
  }, [hydrateSession, initialState.session]);

  const login = useCallback(
    async ({ tenantId, email, password }: LoginInput) => {
      const normalizedTenantId = tenantId.trim();
      if (!normalizedTenantId) {
        setErrorMessage("Tenant selection is required.");
        return;
      }

      setErrorMessage(null);
      const result = await requestJson<LoginResponse>("/auth/login/password", {
        method: "POST",
        body: JSON.stringify({
          tenantId: normalizedTenantId,
          email: email.trim(),
          password,
        }),
      });

      const baseSession: SessionRecord = {
        tenantId: normalizedTenantId,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
        permissions: result.permissions,
        branchIds: result.branchIds,
        activeBranchId: null,
        user: null,
        branches: [],
      };

      await hydrateSession(baseSession);
    },
    [hydrateSession],
  );

  const logout = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (currentSession) {
      try {
        await authenticatedRequest(currentSession, "/auth/logout", { method: "POST", body: JSON.stringify({}) });
      } catch {
        // ignore logout network errors during local session clearing
      }
    }

    writeStoredSession(null);
    sessionRef.current = null;
    setSession(null);
    setStatus("anonymous");
    setErrorMessage(null);
  }, []);

  const selectBranch = useCallback((branchId: string) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return false;
    if (!currentSession.branchIds.includes(branchId)) {
      setErrorMessage("Selected branch is outside the authenticated access scope.");
      return false;
    }

    const nextSession = {
      ...currentSession,
      activeBranchId: branchId,
    };

    sessionRef.current = nextSession;
    setSession(nextSession);
    setStatus("authenticated");
    setErrorMessage(null);
    return true;
  }, []);

  const hasAnyPermission = useCallback(
    (...permissions: string[]) => {
      const effectivePermissions = session?.permissions ?? [];
      return permissions.length === 0 || permissions.some((permission) => effectivePermissions.includes(permission));
    },
    [session?.permissions],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      knownTenants,
      errorMessage,
      login,
      logout,
      selectBranch,
      clearError,
      hasAnyPermission,
    }),
    [clearError, errorMessage, hasAnyPermission, knownTenants, login, logout, selectBranch, session, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider.");
  return context;
}
