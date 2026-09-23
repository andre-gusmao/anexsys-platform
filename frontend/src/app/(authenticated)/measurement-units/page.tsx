"use client";

import { useWorkspaceRegistration } from "@/components/app-shell/workspace-manager";
import { MeasurementMasterDataWorkspace } from "@/components/measurements/measurement-master-data-workspace";

export default function MeasurementUnitsPage() {
  useWorkspaceRegistration({ label: "Unidades de Medida" });
  return <MeasurementMasterDataWorkspace mode="units" />;
}
