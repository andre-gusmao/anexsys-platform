"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

export default function SelectBranchPage() {
  const router = useRouter();
  const { status, session, selectCompany, selectBranch } = useSession();
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && session?.activeBranchId) {
      router.replace("/dashboard");
    }
  }, [router, session?.activeBranchId, status]);

  if (!session) {
    return <div className="loading-state">Loading your company and filial…</div>;
  }

  const activeCompany = session.companies.find((company) => company.tenantId === session.tenantId) ?? null;
  const needsCompanySelection = session.companySelectionRequired;
  const branchTitle = activeCompany ? `Selecione a filial ativa de ${activeCompany.displayName}` : "Selecione a filial ativa";
  const busy = pendingCompanyId !== null || pendingBranchId !== null;

  return (
    <div className="screen-shell">
      <section className="content-card" style={{ maxWidth: 920 }}>
        <div className="content-card__header">
          <div className="eyebrow">ANEXSYS</div>
          <h1 className="title">Choose company and filial</h1>
          <p className="subtitle">We open your last valid context automatically when possible. If needed, confirm your company and filial.</p>
        </div>

        <div className="content-card__body" style={{ display: "grid", gap: 32 }}>
          {session.companies.length > 1 ? (
            <section>
              <div className="eyebrow">Company</div>
              <h2 style={{ marginTop: 12 }}>{needsCompanySelection ? "Select active company" : activeCompany?.displayName ?? "Switch company"}</h2>
              <div className="branch-grid" style={{ marginTop: 20 }}>
                {session.companies.map((company) => (
                  <button
                    className="branch-card"
                    disabled={busy}
                    key={company.tenantId}
                    onClick={async () => {
                      setPendingCompanyId(company.tenantId);
                      try {
                        const resolved = await selectCompany(company.tenantId);
                        if (resolved) {
                          router.push("/dashboard");
                        }
                      } finally {
                        setPendingCompanyId(null);
                      }
                    }}
                    type="button"
                  >
                    <div className="eyebrow">Company</div>
                    <h2 style={{ marginTop: 12 }}>{company.displayName}</h2>
                    <p className="branch-card__meta">{pendingCompanyId === company.tenantId ? "Switching…" : "Open company"}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {!needsCompanySelection ? (
            <section>
              <div className="eyebrow">Filial</div>
              <h2 style={{ marginTop: 12 }}>{branchTitle}</h2>
              <div className="branch-grid" style={{ marginTop: 20 }}>
                {session.branches.map((branch) => (
                  <button
                    className="branch-card"
                    disabled={busy}
                    key={branch.id}
                    onClick={async () => {
                      setPendingBranchId(branch.id);
                      try {
                        if (await selectBranch(branch.id)) {
                          router.push("/dashboard");
                        }
                      } finally {
                        setPendingBranchId(null);
                      }
                    }}
                    type="button"
                  >
                    <div className="eyebrow">Filial</div>
                    <h2 style={{ marginTop: 12 }}>{branch.label}</h2>
                    <p className="branch-card__meta">{pendingBranchId === branch.id ? "Applying context…" : branch.hint ?? "Abrir filial"}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
