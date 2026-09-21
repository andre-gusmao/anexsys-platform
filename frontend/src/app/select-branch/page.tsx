"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

export default function SelectBranchPage() {
  const router = useRouter();
  const { status, session, selectBranch } = useSession();

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
    return <div className="loading-state">Loading branch access…</div>;
  }

  return (
    <div className="screen-shell">
      <section className="content-card" style={{ maxWidth: 920 }}>
        <div className="content-card__header">
          <div className="eyebrow">ANEXSYS · Branch selection</div>
          <h1 className="title">Select active branch</h1>
          <p className="subtitle">
            Sprint 1 keeps branch context explicit. Choose one branch before entering the Administrative Portal shell.
          </p>
        </div>

        <div className="content-card__body">
          <div className="branch-grid">
            {session.branches.map((branch) => (
              <button
                className="branch-card"
                key={branch.id}
                onClick={() => {
                  if (selectBranch(branch.id)) {
                    router.push("/dashboard");
                  }
                }}
                type="button"
              >
                <div className="eyebrow">Branch</div>
                <h2 style={{ marginTop: 12 }}>{branch.label}</h2>
                <p className="branch-card__meta">{branch.hint ?? branch.id}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
