"use client";

import { useWorkspaceRegistration } from "@/components/app-shell/workspace-manager";
import { MeasurementMasterDataWorkspace } from "@/components/measurements/measurement-master-data-workspace";

export default function BodyPartsPage() {
  useWorkspaceRegistration({ label: "Partes do Corpo" });
  return <MeasurementMasterDataWorkspace mode="body-parts" />;
}
