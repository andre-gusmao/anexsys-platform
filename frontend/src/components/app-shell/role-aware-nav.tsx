"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  requiredPermissions?: string[];
  permissionMatch?: "all" | "any";
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Geral",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        hint: "Visão inicial",
      },
    ],
  },
  {
    title: "Cadastros",
    items: [
      {
        href: "/customers",
        label: "Clientes",
        hint: "Cadastro e medidas",
        requiredPermissions: ["customers.read"],
      },
      {
        href: "/body-parts",
        label: "Partes do Corpo",
        hint: "Master data de medidas",
        requiredPermissions: ["measurements.read"],
      },
      {
        href: "/measurement-units",
        label: "Unidades de Medida",
        hint: "Unidades padrão",
        requiredPermissions: ["measurements.read"],
      },
    ],
  },
  {
    title: "Administração",
    items: [
      {
        href: "/admin/tenants",
        label: "Empresas",
        hint: "Administração de empresas",
        requiredPermissions: ["tenants.read"],
      },
      {
        href: "/admin/branches",
        label: "Filiais",
        hint: "Administração de filiais",
        requiredPermissions: ["branches.read"],
      },
      {
        href: "/admin/access",
        label: "Usuários e Acessos",
        hint: "Perfis e permissões",
        requiredPermissions: ["users.read", "roles.read", "permissions.read"],
        permissionMatch: "all",
      },
    ],
  },
];

export function RoleAwareNav() {
  const pathname = usePathname();
  const { hasAnyPermission } = useSession();

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.requiredPermissions
          ? item.permissionMatch === "all"
            ? item.requiredPermissions.every((permission) => hasAnyPermission(permission))
            : hasAnyPermission(...item.requiredPermissions)
          : true,
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <nav>
      {visibleSections.map((section) => (
        <div key={section.title}>
          <div className="sidebar__section-title">{section.title}</div>
          <ul className="nav-list">
            {section.items.map((item) => {
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
        </div>
      ))}
    </nav>
  );
}
