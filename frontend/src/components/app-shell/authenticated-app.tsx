"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/app-shell/admin-shell";
import { useSession } from "@/components/providers/session-provider";

export function AuthenticatedApp({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { status, session } = useSession();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
      return;
    }
    if (status === "company-selection" || status === "branch-selection") {
      router.replace("/select-branch");
    }
  }, [router, status]);

  if (status === "loading") {
    return <div className="loading-state">Restoring session context…</div>;
  }

  if (status === "anonymous" || status === "company-selection" || status === "branch-selection" || !session) {
    return <div className="loading-state">Redirecting…</div>;
  }

  return <AdminShell>{children}</AdminShell>;
}
