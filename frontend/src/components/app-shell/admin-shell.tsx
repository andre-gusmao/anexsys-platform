"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { RoleAwareNav } from "@/components/app-shell/role-aware-nav";
import { WorkspaceTabsBar, useWorkspaceManager } from "@/components/app-shell/workspace-manager";
import { useSession } from "@/components/providers/session-provider";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { session, logout, errorMessage, clearError, selectCompany, selectBranch } = useSession();
  const { duplicateCurrentWorkspace, openWorkspaceInBrowserTab } = useWorkspaceManager();
  const [pendingCompanySwitch, setPendingCompanySwitch] = useState(false);
  const [pendingBranchSwitch, setPendingBranchSwitch] = useState(false);
  const activeCompany = session?.companies.find((company) => company.tenantId === session.tenantId) ?? null;
  const activeBranch = session?.branches.find((branch) => branch.id === session?.activeBranchId) ?? null;
  const busy = pendingCompanySwitch || pendingBranchSwitch;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="eyebrow">ANEXSYS</div>
          <h1>Administrative Portal</h1>
          <p>Fast access to your company, filial, and daily administrative work.</p>
        </div>

        <section className="sidebar__context">
          <div className="eyebrow">Active context</div>
          <div className="sidebar__context-summary">
            <div className="sidebar__context-field">
              <span>Company</span>
              <strong>{activeCompany?.displayName ?? "Select company"}</strong>
            </div>
            <div className="sidebar__context-field">
              <span>Filial</span>
              <strong>{activeBranch?.label ?? "Selecione a filial"}</strong>
            </div>
          </div>

          {session && session.companies.length > 1 ? (
            <label className="field sidebar__context-select">
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
            <label className="field sidebar__context-select">
              <span>Filial</span>
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
                {!session.activeBranchId ? <option value="">Selecione a filial</option> : null}
                {session.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>

        <RoleAwareNav />
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">Authenticated session</div>
            <h2>{session?.user?.displayName ?? "Authenticated user"}</h2>
            <div className="topbar__meta">
              <span className="pill">
                Permissions <strong>{session?.permissions.length ?? 0}</strong>
              </span>
            </div>
          </div>

          <div className="button-row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <button className="button-secondary" onClick={duplicateCurrentWorkspace} type="button">
              Duplicar workspace
            </button>
            <button className="button-secondary" onClick={() => openWorkspaceInBrowserTab()} type="button">
              Abrir no navegador
            </button>
            <button className="button-secondary" onClick={() => void logout()} type="button">
              Logout
            </button>
          </div>
        </header>

        <WorkspaceTabsBar />

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
