"use client";

import { useSession } from "@/components/providers/session-provider";
import { PlaceholderWorkspace } from "@/components/ui/placeholder-workspace";

export default function AccessPage() {
  const { session } = useSession();

  return (
    <PlaceholderWorkspace
      title="Users and access placeholder"
      description="Sprint 1 already consumes the backend identity and authorization model. This workspace exists to validate role-aware navigation and permission-aware UX framing."
      bullets={[
        `Effective permissions loaded: ${session?.permissions.length ?? 0}`,
        "Login, refresh, logout, and /auth/me are integrated",
        "Navigation items disappear when related permissions are missing",
      ]}
      aside={
        <>
          <h3>Authentication flow delivered</h3>
          <p>
            Sessions are restored from local storage, refresh tokens are rotated through the backend, and protected routes redirect
            when the user is anonymous or missing branch context.
          </p>
        </>
      }
    />
  );
}
