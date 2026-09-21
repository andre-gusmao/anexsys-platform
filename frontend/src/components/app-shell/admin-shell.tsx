"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { RoleAwareNav } from "@/components/app-shell/role-aware-nav";
import { useSession } from "@/components/providers/session-provider";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { session, logout, errorMessage, clearError, selectCompany, selectBranch } = useSession();
  const [pendingCompanySwitch, setPendingCompanySwitch] = useState(false);
  const [pendingBranchSwitch, setPendingBranchSwitch] = useState(false);
  const activeCompany = session?.companies.find((company) => company.tenantId === session.tenantId) ?? null;
  const busy = pendingCompanySwitch || pendingBranchSwitch;

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
                  disabled={busy}
                  value={session.tenantId}
                  onChange={async (event) => {
                    setPendingCompanySwitch(true);
                    try {
                      const resolved = await selectCompany(event.target.value);
                      if (!resolved) {
                        router.push("/select-branch");
                      }
                    } finally {
                      setPendingCompanySwitch(false);
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
                  disabled={busy}
                  value={session.activeBranchId ?? ""}
                  onChange={async (event) => {
                    if (!event.target.value) {
                      router.push("/select-branch");
                      return;
                    }
                    setPendingBranchSwitch(true);
                    try {
                      await selectBranch(event.target.value);
                    } finally {
                      setPendingBranchSwitch(false);
                    }
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

            <button
              className="button-secondary"
              disabled={busy}
              onClick={() => router.push("/select-branch")}
              type="button"
            >
              Switch Context
            </button>
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
