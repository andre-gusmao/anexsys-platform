"use client";

import { PlaceholderWorkspace } from "@/components/ui/placeholder-workspace";

export default function TenantsPage() {
  return (
    <PlaceholderWorkspace
      title="Tenant workspace placeholder"
      description="This route validates the administrative shell and role-aware navigation for tenant-governance capabilities without starting domain implementation yet."
      bullets={["Tenant context is visible in the top bar", "Navigation visibility depends on permissions", "Deep tenant CRUD stays out of Sprint 1 scope"]}
      aside={
        <>
          <h3>Why it exists now</h3>
          <p>
            Sprint 1 needs navigable administrative landmarks so UX, context placement, and permission-aware shell behavior can be
            validated before functional workspaces are implemented.
          </p>
        </>
      }
    />
  );
}
