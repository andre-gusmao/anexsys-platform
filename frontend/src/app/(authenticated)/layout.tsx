import type { ReactNode } from "react";
import { AuthenticatedApp } from "@/components/app-shell/authenticated-app";

export default function AuthenticatedLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthenticatedApp>{children}</AuthenticatedApp>;
}
