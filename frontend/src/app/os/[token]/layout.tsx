import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Ordem de serviço",
  robots: { index: false, follow: false },
};

export default function PublicOsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
