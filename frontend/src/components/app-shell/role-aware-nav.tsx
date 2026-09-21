"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  requiredPermissions?: string[];
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    hint: "Sprint 1 shell",
  },
  {
    href: "/admin/tenants",
    label: "Tenants",
    hint: "Governance placeholder",
    requiredPermissions: ["tenants.read"],
  },
  {
    href: "/admin/branches",
    label: "Branches",
    hint: "Branch selector placeholder",
    requiredPermissions: ["branches.read"],
  },
  {
    href: "/admin/access",
    label: "Users & Access",
    hint: "Role-aware navigation",
    requiredPermissions: ["users.read", "roles.read", "permissions.read"],
  },
];

export function RoleAwareNav() {
  const pathname = usePathname();
  const { hasAnyPermission } = useSession();

  const visibleItems = navItems.filter((item) =>
    item.requiredPermissions ? hasAnyPermission(...item.requiredPermissions) : true,
  );

  return (
    <nav>
      <div className="sidebar__section-title">Navigation</div>
      <ul className="nav-list">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link className={`nav-link${active ? " nav-link--active" : ""}`} href={item.href}>
                <span>{item.label}</span>
                <span className="nav-hint">{item.hint}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
