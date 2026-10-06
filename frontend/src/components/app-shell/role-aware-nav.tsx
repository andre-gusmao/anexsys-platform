"use client";

import { useWorkspaceViewportMode } from "@/components/app-shell/workspace-responsive";
import { useWorkspaceManager } from "@/components/app-shell/workspace-manager";
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
        label: "Contas",
        hint: "Quem assina o ANEXSYS",
        requiredPermissions: ["tenants.read"],
      },
      {
        href: "/admin/companies",
        label: "Empresas",
        hint: "CNPJ da Conta; troque no contexto",
        requiredPermissions: ["companies.read"],
      },
      {
        href: "/admin/branches",
        label: "Filiais",
        hint: "Ligadas à Empresa ativa",
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
  {
    title: "Operações",
    items: [
      {
        href: "/service-orders",
        label: "Service Orders",
        hint: "Gestão operacional de ordens",
        requiredPermissions: ["service_orders.read"],
      },
    ],
  },
];

export function RoleAwareNav({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const { hasAnyPermission } = useSession();
  const { currentTab, openWorkspaceInNewTab } = useWorkspaceManager();
  const { isMobile } = useWorkspaceViewportMode();
  const hasAllPermissions = (permissions: string[]) => permissions.every((permission) => hasAnyPermission(permission));

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.requiredPermissions
          ? item.permissionMatch === "all"
            ? hasAllPermissions(item.requiredPermissions)
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
              const active = currentTab?.pathname === item.href || Boolean(currentTab?.pathname.startsWith(`${item.href}?`));
              return (
                <li key={item.href}>
                   <div className={`nav-link${active ? " nav-link--active" : ""}`}>
                     <button
                       className="nav-link__main"
                       onClick={() => {
                         openWorkspaceInNewTab(item.href, item.label, { cloneCurrent: false });
                         onNavigate?.();
                       }}
                       type="button"
                     >
                       <span>{item.label}</span>
                       <span className="nav-hint">{item.hint}</span>
                     </button>
                     {!isMobile ? (
                       <button
                         aria-label={`Abrir ${item.label} em novo workspace`}
                         className="nav-link__quick-action"
                         onClick={(event) => {
                           event.preventDefault();
                           event.stopPropagation();
                           openWorkspaceInNewTab(item.href, item.label, { cloneCurrent: false });
                         }}
                         type="button"
                       >
                         +
                       </button>
                     ) : null}
                   </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
