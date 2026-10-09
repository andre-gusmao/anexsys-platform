"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { branchesOfEmpresa, empresaLabel } from "@/components/providers/session-context";
import { useSession } from "@/components/providers/session-provider";

export function ActiveContextCombos() {
  const router = useRouter();
  const { session, selectCompany, selectEmpresa, selectBranch } = useSession();
  const [pendingCompanySwitch, setPendingCompanySwitch] = useState(false);
  const [pendingEmpresaSwitch, setPendingEmpresaSwitch] = useState(false);
  const [pendingBranchSwitch, setPendingBranchSwitch] = useState(false);

  if (!session) {
    return null;
  }

  const visibleBranches = branchesOfEmpresa(session.branches ?? [], session.activeEmpresaId ?? null);
  const busy = pendingCompanySwitch || pendingEmpresaSwitch || pendingBranchSwitch;

  return (
    <section aria-label="Contexto ativo" className="sidebar-combos">
      <div className="sidebar-combos__title">Contexto ativo</div>

      <label className="sidebar-combo">
        <span>Conta</span>
        <select
          aria-label="Conta ativa"
          disabled={busy || session.companies.length < 2}
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

      <label className="sidebar-combo">
        <span>Empresa</span>
        <select
          aria-label="Empresa ativa"
          disabled={busy || (session.empresas?.length ?? 0) === 0}
          value={session.activeEmpresaId ?? ""}
          onChange={async (event) => {
            if (!event.target.value) return;
            setPendingEmpresaSwitch(true);
            try {
              await selectEmpresa(event.target.value);
            } finally {
              setPendingEmpresaSwitch(false);
            }
          }}
        >
          {!session.activeEmpresaId ? <option value="">Selecione a Empresa</option> : null}
          {(session.empresas ?? []).map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresaLabel(empresa)}
            </option>
          ))}
        </select>
      </label>

      <label className="sidebar-combo">
        <span>Filial</span>
        <select
          aria-label="Filial ativa"
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
          {visibleBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
