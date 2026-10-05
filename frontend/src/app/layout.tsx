import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANEXSYS Frontend",
  description: "ANEXSYS administrative frontend sprint 1 shell",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
