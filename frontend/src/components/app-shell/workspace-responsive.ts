"use client";

import { useEffect, useState } from "react";

export type WorkspaceViewportMode = "desktop" | "tablet" | "mobile";

export const DESKTOP_MIN_WIDTH = 1200;
export const TABLET_MIN_WIDTH = 768;

function resolveWorkspaceViewportMode(width: number): WorkspaceViewportMode {
  if (width >= DESKTOP_MIN_WIDTH) {
    return "desktop";
  }

  if (width >= TABLET_MIN_WIDTH) {
    return "tablet";
  }

  return "mobile";
}

export function useWorkspaceViewportMode() {
  const [mode, setMode] = useState<WorkspaceViewportMode>("desktop");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateMode = () => {
      setMode(resolveWorkspaceViewportMode(window.innerWidth));
    };

    updateMode();
    window.addEventListener("resize", updateMode);
    return () => window.removeEventListener("resize", updateMode);
  }, []);

  return {
    mode,
    isDesktop: mode === "desktop",
    isTablet: mode === "tablet",
    isMobile: mode === "mobile",
  };
}
