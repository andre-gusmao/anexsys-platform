"use client";

import { useSession } from "@/components/providers/session-provider";
import { PlaceholderWorkspace } from "@/components/ui/placeholder-workspace";

export default function BranchesPage() {
  const { session } = useSession();
  const activeBranch = session?.branches.find((branch) => branch.id === session?.activeBranchId) ?? null;

  return (
    <PlaceholderWorkspace
      title="Branch workspace placeholder"
      description="This route anchors branch-aware shell behavior and complements the dedicated branch-selection flow already implemented in Sprint 1."
      bullets={[
        "Branch context stays explicit in the top bar",
        "Switch Branch action is always reachable",
        `Current active branch: ${activeBranch?.label ?? "not selected"}`,
      ]}
      aside={
        <>
          <h3>Branch-ready shell</h3>
          <p>
            Future lists, dashboards, and Service Orders can rely on this shared branch context instead of reimplementing scope
            selection in every screen.
          </p>
        </>
      }
    />
  );
}
