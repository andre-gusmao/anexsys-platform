"use client";

import { useSession } from "@/components/providers/session-provider";
import { PlaceholderWorkspace } from "@/components/ui/placeholder-workspace";

export default function AccessPage() {
  const { session } = useSession();

  return (
    <PlaceholderWorkspace
      title="Users and access placeholder"
      description="Sprint 1 already supports secure sign-in and context-aware access. This workspace reserves the future area for user and access administration."
      bullets={[
        `Available access rules loaded: ${session?.permissions.length ?? 0}`,
        "Login, refresh, logout, and context reopening are connected",
        "Navigation adapts when access is not available",
      ]}
      aside={
        <>
          <h3>Current experience</h3>
          <p>
            Sessions reopen automatically when possible, and protected areas redirect the user back to login or branch selection when
            context is missing.
          </p>
        </>
      }
    />
  );
}
