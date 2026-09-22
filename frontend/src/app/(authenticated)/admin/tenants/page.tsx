"use client";

import { PlaceholderWorkspace } from "@/components/ui/placeholder-workspace";

export default function TenantsPage() {
  return (
    <PlaceholderWorkspace
      title="Company workspace placeholder"
      description="This route reserves the future company administration area without exposing technical platform details to end users."
      bullets={["Company context is visible in the top bar", "Navigation visibility depends on current access", "Detailed company management stays out of Sprint 1 scope"]}
      aside={
        <>
          <h3>Why it exists now</h3>
          <p>
            Sprint 1 needs navigable administrative landmarks so UX, context placement, and access-aware shell behavior can be
            validated before functional workspaces are implemented.
          </p>
        </>
      }
    />
  );
}
