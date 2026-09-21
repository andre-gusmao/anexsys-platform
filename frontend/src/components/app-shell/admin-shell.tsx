"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RoleAwareNav } from "@/components/app-shell/role-aware-nav";
import { useSession } from "@/components/providers/session-provider";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { session, logout, errorMessage, clearError, selectCompany, selectBranch } = useSession();
  const activeCompany = session?.companies.find((company) => company.tenantId === session.tenantId) ?? null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="eyebrow">ANEXSYS · SaaS Identity</div>
          <h1>Administrative Portal</h1>
          <p>Email-only login, company-aware context selection, branch memory, and role-aware navigation shell.</p>
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
                Company <strong>{activeCompany?.displayName ?? session?.tenantId ?? "-"}</strong>
              </span>
              <span className="pill">
                Branch <strong>{session?.branches.find((branch) => branch.id === session?.activeBranchId)?.label ?? session?.activeBranchId ?? "Select branch"}</strong>
              </span>
              <span className="pill">
                Permissions <strong>{session?.permissions.length ?? 0}</strong>
              </span>
            </div>
          </div>

          <div className="button-row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            {session && session.companies.length > 1 ? (
              <label className="field" style={{ minWidth: 220, marginBottom: 0 }}>
                <span>Company</span>
                <select
                  value={session.tenantId}
                  onChange={async (event) => {
                    const resolved = await selectCompany(event.target.value);
                    if (!resolved) {
                      router.push("/select-branch");
                    }
                  }}
                >
                  {session.companies.map((company) => (
                    <option key={company.tenantId} value={company.tenantId}>
                      {company.displayName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {session ? (
              <label className="field" style={{ minWidth: 220, marginBottom: 0 }}>
                <span>Branch</span>
                <select
                  value={session.activeBranchId ?? ""}
                  onChange={async (event) => {
                    if (!event.target.value) {
                      router.push("/select-branch");
                      return;
                    }
                    await selectBranch(event.target.value);
                  }}
                >
                  {!session.activeBranchId ? <option value="">Select branch</option> : null}
                  {session.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <Link className="button-secondary" href="/select-branch">
              Switch Context
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
