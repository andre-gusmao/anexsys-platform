"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { RoleAwareNav } from "@/components/app-shell/role-aware-nav";
import { useSession } from "@/components/providers/session-provider";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const { session, logout, errorMessage, clearError } = useSession();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="eyebrow">ANEXSYS · Frontend Sprint 1</div>
          <h1>Administrative Portal</h1>
          <p>First usable frontend iteration with login, context selection, navigation shell, and dashboard placeholder.</p>
        </div>

        <RoleAwareNav />
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">Authenticated Context</div>
            <h2>{session?.user?.displayName ?? "Authenticated user"}</h2>
            <div className="topbar__meta">
              <span className="pill">
                Tenant <strong>{session?.tenantId ?? "-"}</strong>
              </span>
              <span className="pill">
                Branch <strong>{session?.activeBranchId ?? "Select branch"}</strong>
              </span>
              <span className="pill">
                Permissions <strong>{session?.permissions.length ?? 0}</strong>
              </span>
            </div>
          </div>

          <div className="button-row">
            <Link className="button-secondary" href="/select-branch">
              Switch Branch
            </Link>
            <button className="button-secondary" onClick={() => void logout()} type="button">
              Logout
            </button>
          </div>
        </header>

        <main className="workspace__content">
          {errorMessage ? (
            <div className="error-banner">
              <strong>Session notice</strong>
              <span>{errorMessage}</span>
              <button className="button-ghost" onClick={clearError} type="button">
                Dismiss
              </button>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
