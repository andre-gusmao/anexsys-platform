"use client";

import { useSession } from "@/components/providers/session-provider";

export default function DashboardPage() {
  const { session } = useSession();

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Administrative Shell</div>
        <h1 className="title">Dashboard placeholder</h1>
        <p>
          Frontend Sprint 1 delivers the first usable browser experience for ANEXSYS: login, session context, tenant and branch
          selection, role-aware navigation, and the administrative shell.
        </p>
      </section>

      <section className="card-grid">
        <article className="mini-card">
          <h3>Authenticated session</h3>
          <ul className="placeholder-list">
            <li>User: {session?.user?.displayName ?? "-"}</li>
            <li>Email: {session?.user?.email ?? "-"}</li>
            <li>Tenant: {session?.tenantId ?? "-"}</li>
            <li>Active branch: {session?.activeBranchId ?? "-"}</li>
          </ul>
        </article>

        <article className="mini-card">
          <h3>Role-aware navigation</h3>
          <p>
            Navigation items in the sidebar are filtered by the effective permissions returned by the authenticated backend session.
          </p>
          <ul className="placeholder-list">
            <li>Permissions loaded from `/auth/me`</li>
            <li>Branch scope persisted in session context</li>
            <li>Protected routes redirect to login or branch selection</li>
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
