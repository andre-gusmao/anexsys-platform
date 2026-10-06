"use client";

import { useSyncExternalStore } from "react";
import { useWorkspaceViewportMode } from "@/components/app-shell/workspace-responsive";
import { useWorkspaceManager } from "@/components/app-shell/workspace-manager";
import {
  getWorkspaceBasePath,
  listWorkspaceTabsForNavItem,
  shouldShowWorkspaceNavSubmenu,
} from "@/components/app-shell/workspace-manager-store";
import {
  createEmptySidebarTree,
  readSidebarTree,
  subscribeSidebarTree,
  toggleTreeId,
  writeSidebarTree,
} from "@/components/app-shell/sidebar-tree";
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

function TreeChevron({ expanded }: Readonly<{ expanded: boolean }>) {
  return (
    <span aria-hidden="true" className={`nav-tree-chevron${expanded ? " nav-tree-chevron--expanded" : ""}`}>
      ▸
    </span>
  );
}

export function RoleAwareNav({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const { hasAnyPermission } = useSession();
  const { currentTab, tabs, activateWorkspace, closeWorkspace, openWorkspaceFromMenu, openWorkspaceInNewTab } =
    useWorkspaceManager();
  const { isMobile } = useWorkspaceViewportMode();
  const tree = useSyncExternalStore(subscribeSidebarTree, readSidebarTree, createEmptySidebarTree);
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

  const toggleSection = (title: string) => {
    writeSidebarTree({
      ...tree,
      collapsedSections: toggleTreeId(tree.collapsedSections, title),
    });
  };

  const toggleItem = (href: string) => {
    writeSidebarTree({
      ...tree,
      collapsedItems: toggleTreeId(tree.collapsedItems, href),
    });
  };

  return (
    <nav className="nav-tree">
      {visibleSections.map((section) => {
        const sectionExpanded = !tree.collapsedSections.includes(section.title);
        return (
          <div className="nav-tree__section" key={section.title}>
            <button
              aria-expanded={sectionExpanded}
              className="sidebar__section-title"
              onClick={() => toggleSection(section.title)}
              type="button"
            >
              <TreeChevron expanded={sectionExpanded} />
              <span>{section.title}</span>
            </button>
            {sectionExpanded ? (
              <ul className="nav-list">
                {section.items.map((item) => {
                  const relatedTabs = listWorkspaceTabsForNavItem(tabs, item.href);
                  const hasSubmenu = !isMobile && shouldShowWorkspaceNavSubmenu(tabs, item.href);
                  const itemExpanded = hasSubmenu && !tree.collapsedItems.includes(item.href);
                  const active = currentTab ? getWorkspaceBasePath(currentTab.pathname) === item.href : false;
                  return (
                    <li key={item.href}>
                      <div className={`nav-link${active ? " nav-link--active" : ""}`}>
                        {hasSubmenu ? (
                          <button
                            aria-expanded={itemExpanded}
                            aria-label={itemExpanded ? `Recolher ${item.label}` : `Expandir ${item.label}`}
                            className="nav-tree-toggle"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleItem(item.href);
                            }}
                            type="button"
                          >
                            <TreeChevron expanded={itemExpanded} />
                          </button>
                        ) : (
                          <span className="nav-tree-toggle nav-tree-toggle--spacer" />
                        )}
                        <button
                          className="nav-link__main"
                          onClick={() => {
                            openWorkspaceFromMenu(item.href, item.label);
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
                              openWorkspaceInNewTab(item.href, item.label, { cloneCurrent: false, reuse: "none" });
                            }}
                            type="button"
                          >
                            +
                          </button>
                        ) : null}
                      </div>
                      {itemExpanded ? (
                        <ul aria-label={`Abas abertas de ${item.label}`} className="nav-sublist">
                          {relatedTabs.map((tab) => {
                            const subActive = tab.id === currentTab?.id;
                            return (
                              <li
                                className={`nav-subitem${subActive ? " nav-subitem--active" : ""}`}
                                key={tab.id}
                              >
                                <button
                                  className="nav-sublink"
                                  onClick={() => {
                                    activateWorkspace(tab.id);
                                    onNavigate?.();
                                  }}
                                  title={tab.subtitle ? `${tab.label} · ${tab.subtitle}` : tab.label}
                                  type="button"
                                >
                                  <span>{tab.label}</span>
                                  {tab.subtitle ? <small>{tab.subtitle}</small> : null}
                                </button>
                                <button
                                  aria-label={`Fechar ${tab.label}`}
                                  className="nav-sublink__close"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    closeWorkspace(tab.id);
                                  }}
                                  type="button"
                                >
                                  ×
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
