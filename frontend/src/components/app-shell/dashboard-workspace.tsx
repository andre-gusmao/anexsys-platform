"use client";

import { useWorkspaceRegistration } from "@/components/app-shell/workspace-manager";
import { useSession } from "@/components/providers/session-provider";

export function DashboardWorkspace() {
  useWorkspaceRegistration({ label: "Dashboard" });
  const { session } = useSession();
  const activeCompany = session?.companies.find((company) => company.tenantId === session?.tenantId) ?? null;
  const activeBranch = session?.branches.find((branch) => branch.id === session?.activeBranchId) ?? null;

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">ANEXSYS</div>
        <h1 className="title">Dashboard placeholder</h1>
        <p>
          Frontend Sprint 1 delivers the first usable browser experience for ANEXSYS: login, company and filial selection,
          business-friendly context display, and the administrative shell.
        </p>
      </section>

      <section className="card-grid">
        <article className="mini-card">
          <h3>Authenticated session</h3>
          <ul className="placeholder-list">
            <li>User: {session?.user?.displayName ?? "-"}</li>
            <li>Email: {session?.user?.email ?? "-"}</li>
            <li>Company: {activeCompany?.displayName ?? "Not selected"}</li>
            <li>Filial ativa: {activeBranch?.label ?? "Não selecionada"}</li>
          </ul>
        </article>

        <article className="mini-card">
          <h3>Navigation and access</h3>
          <p>Navigation in the sidebar is adapted to the access available in the current company and filial.</p>
          <ul className="placeholder-list">
            <li>Company and filial reopen from the last valid context when possible</li>
            <li>Visible areas follow the current access context</li>
            <li>Protected routes reopen login or context selection when needed</li>
          </ul>
        </article>

        <article className="mini-card">
          <h3>Next Sprint hooks</h3>
          <ul className="placeholder-list">
            <li>Customer Directory will plug into this shell in Sprint 2</li>
            <li>Dashboard cards will evolve into KPI read models in later sprints</li>
            <li>Error handling and logout flow are already centralized</li>
          </ul>
        </article>
      </section>
    </>
  );
}
