"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type BranchOption = {
  id: string;
  label: string;
  hint?: string;
};

type CompanyOption = {
  tenantId: string;
  userId: string;
  code: string;
  displayName: string;
  defaultBranchId: string | null;
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
  communities: string[];
  branchIds: string[];
  activeBranchId: string | null;
  user: AuthenticatedUser | null;
  branches: BranchOption[];
  companies: CompanyOption[];
  companySelectionRequired: boolean;
};

type SessionStatus = "loading" | "anonymous" | "branch-selection" | "authenticated";

type LoginInput = {
  email: string;
  password: string;
};

type SessionContextValue = {
  status: SessionStatus;
  session: SessionRecord | null;
  errorMessage: string | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  selectCompany: (tenantId: string) => Promise<boolean>;
  selectBranch: (branchId: string) => Promise<boolean>;
  clearError: () => void;
  hasAnyPermission: (...permissions: string[]) => boolean;
  apiJson: <T>(path: string, init?: RequestInit, opts?: { allowRefresh?: boolean; branchId?: string | null }) => Promise<T>;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  tenantId: string;
  branchIds: string[];
  permissions: string[];
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  tenantId: string;
};

type MeResponse = {
  user: AuthenticatedUser;
  effectiveAccess: {
    branchIds: string[];
    permissions: string[];
    communities: string[];
  };
  context: {
    tenantId: string;
    branchId: string | null;
    companySelectionRequired: boolean;
    availableCompanies: CompanyOption[];
  };
};

type BranchResponse = {
  id?: string;
  code?: string;
  displayName?: string;
  legalName?: string;
  status?: string;
};

const STORAGE_KEY = "anexsys.frontend.session.v2";
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
    tenantId: refreshed.tenantId,
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
    return fallbackIds.map((branchId, index) => ({
      id: branchId,
      label: `Filial ${index + 1}`,
      hint: "Disponível no seu contexto de acesso.",
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
  const [status, setStatus] = useState<SessionStatus>(initialState.status);
  const [session, setSession] = useState<SessionRecord | null>(initialState.session);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sessionRef = useRef<SessionRecord | null>(null);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const hydrateSession = useCallback(async (candidate: SessionRecord, preferredBranchId?: string | null) => {
    const meResult = await authenticatedRequest<MeResponse>(candidate, "/auth/me", { method: "GET" });
    const me = meResult.data;
    let workingSession = {
      ...candidate,
      tenantId: me.context.tenantId,
      accessToken: meResult.session.accessToken,
      refreshToken: meResult.session.refreshToken,
      sessionId: meResult.session.sessionId,
      permissions: me.effectiveAccess.permissions,
      communities: me.effectiveAccess.communities,
      branchIds: me.effectiveAccess.branchIds,
      companies: me.context.availableCompanies,
      companySelectionRequired: me.context.companySelectionRequired,
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

    const activeBranchId = me.context.companySelectionRequired
      ? null
      : resolveActiveBranchId(
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
    setStatus(me.context.companySelectionRequired || (!activeBranchId && resolved.branchIds.length > 0) ? "branch-selection" : "authenticated");
    setErrorMessage(null);
    return resolved;
  }, []);

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
    async ({ email, password }: LoginInput) => {
      setErrorMessage(null);
      const loginEmail = email.trim().toLowerCase();
      const result = await requestJson<AuthResponse>("/auth/login/password", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password }),
      });

      const baseSession: SessionRecord = {
        tenantId: result.tenantId,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
        permissions: result.permissions,
        communities: [],
        branchIds: result.branchIds,
        activeBranchId: null,
        user: null,
        branches: [],
        companies: [],
        companySelectionRequired: false,
      };

      await hydrateSession(baseSession);
    },
    [hydrateSession],
  );

  const logout = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (currentSession) {
      try {
        await authenticatedRequest(currentSession, "/auth/logout", { method: "POST", body: JSON.stringify({}) }, { allowRefresh: false });
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

  const selectCompany = useCallback(async (tenantId: string) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return false;

    const result = await authenticatedRequest<AuthResponse>(
      currentSession,
      "/auth/context/company",
      { method: "POST", body: JSON.stringify({ tenantId }) },
      { branchId: null },
    );

    const baseSession: SessionRecord = {
      ...currentSession,
      tenantId: result.data.tenantId,
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      sessionId: result.data.sessionId,
      permissions: result.data.permissions,
      branchIds: result.data.branchIds,
      activeBranchId: null,
      branches: [],
      companySelectionRequired: false,
    };

    const resolved = await hydrateSession(baseSession);
    return resolved.companySelectionRequired === false && (resolved.activeBranchId !== null || resolved.branchIds.length === 0);
  }, [hydrateSession]);

  const selectBranch = useCallback(async (branchId: string) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return false;
    const allowedBranchIds = currentSession.branchIds.length > 0
      ? currentSession.branchIds
      : currentSession.branches.map((branch) => branch.id);
    if (allowedBranchIds.length > 0 && !allowedBranchIds.includes(branchId)) {
      setErrorMessage("A filial selecionada está fora do escopo de acesso autenticado.");
      return false;
    }

    await authenticatedRequest(
      currentSession,
      "/auth/context/branch",
      { method: "POST", body: JSON.stringify({ branchId }) },
      { branchId: null },
    );

    const nextSession = {
      ...currentSession,
      activeBranchId: branchId,
      companySelectionRequired: false,
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

  const apiJson = useCallback(
    async <T,>(path: string, init: RequestInit = {}, opts: { allowRefresh?: boolean; branchId?: string | null } = {}) => {
      const currentSession = sessionRef.current;
      if (!currentSession) {
        throw new HttpError(401, "Session expired. Please sign in again.");
      }

      const result = await authenticatedRequest<T>(currentSession, path, { method: "GET", ...init }, opts);
      if (
        result.session.accessToken !== currentSession.accessToken ||
        result.session.refreshToken !== currentSession.refreshToken ||
        result.session.sessionId !== currentSession.sessionId ||
        result.session.tenantId !== currentSession.tenantId
      ) {
        const nextSession = {
          ...currentSession,
          accessToken: result.session.accessToken,
          refreshToken: result.session.refreshToken,
          sessionId: result.session.sessionId,
          tenantId: result.session.tenantId,
        };
        sessionRef.current = nextSession;
        setSession(nextSession);
      }

      return result.data;
    },
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      errorMessage,
      login,
      logout,
      selectCompany,
      selectBranch,
      clearError,
      hasAnyPermission,
      apiJson,
    }),
    [apiJson, clearError, errorMessage, hasAnyPermission, login, logout, selectBranch, selectCompany, session, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider.");
  return context;
}
