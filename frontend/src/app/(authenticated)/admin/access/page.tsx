"use client";

import { useWorkspaceRegistration } from "@/components/app-shell/workspace-manager";
import { AccessWorkspace } from "@/components/admin/access-workspace";

export default function AccessPage() {
  useWorkspaceRegistration({ label: "Usuários e Acessos" });
  return <AccessWorkspace />;
}
