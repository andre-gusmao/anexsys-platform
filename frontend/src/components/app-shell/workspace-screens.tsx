"use client";

import type { ComponentType, ReactNode } from "react";
import { AccessWorkspace } from "@/components/admin/access-workspace";
import { BranchesWorkspace } from "@/components/admin/branches-workspace";
import { CompaniesWorkspace } from "@/components/admin/companies-workspace";
import { EmpresasWorkspace } from "@/components/admin/empresas-workspace";
import { DashboardWorkspace } from "@/components/app-shell/dashboard-workspace";
import { useWorkspaceManager, useWorkspaceRegistration } from "@/components/app-shell/workspace-manager";
import { getWorkspaceBasePath } from "@/components/app-shell/workspace-manager-store";
import { WorkspacePaneProvider } from "@/components/app-shell/workspace-pane";
import { CustomerWorkspace } from "@/components/customers/customer-workspace";
import { MeasurementMasterDataWorkspace } from "@/components/measurements/measurement-master-data-workspace";
import { ServiceOrdersWorkspace } from "@/components/service-orders/service-orders-workspace";

function AccessWorkspaceScreen() {
  useWorkspaceRegistration({ label: "Usuários e Acessos" });
  return <AccessWorkspace />;
}

function BodyPartsWorkspaceScreen() {
  return <MeasurementMasterDataWorkspace mode="body-parts" />;
}

function MeasurementUnitsWorkspaceScreen() {
  return <MeasurementMasterDataWorkspace mode="units" />;
}

const workspaceScreens: Record<string, ComponentType> = {
  "/dashboard": DashboardWorkspace,
  "/admin/tenants": CompaniesWorkspace,
  "/admin/companies": EmpresasWorkspace,
  "/admin/branches": BranchesWorkspace,
  "/admin/access": AccessWorkspaceScreen,
  "/customers": CustomerWorkspace,
  "/body-parts": BodyPartsWorkspaceScreen,
  "/measurement-units": MeasurementUnitsWorkspaceScreen,
  "/service-orders": ServiceOrdersWorkspace,
};

export function resolveWorkspaceScreen(pathname: string): ComponentType | null {
  return workspaceScreens[getWorkspaceBasePath(pathname)] ?? null;
}

export function WorkspaceKeepAlive({ children }: Readonly<{ children: ReactNode }>) {
  const { currentTab, currentTabId, tabs } = useWorkspaceManager();
  const activeScreen = currentTab ? resolveWorkspaceScreen(currentTab.pathname) : null;

  return (
    <>
      {tabs.map((tab) => {
        const Screen = resolveWorkspaceScreen(tab.pathname);
        if (!Screen) {
          return null;
        }

        const active = tab.id === currentTabId;
        return (
          <div
            aria-hidden={!active}
            className="workspace-pane"
            hidden={!active}
            inert={!active ? true : undefined}
            key={tab.id}
          >
            <WorkspacePaneProvider tab={tab}>
              <Screen />
            </WorkspacePaneProvider>
          </div>
        );
      })}
      {activeScreen ? null : children}
    </>
  );
}
