"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface SidebarCollapseValue {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggle: () => void;
}

const SidebarCollapseContext = createContext<SidebarCollapseValue | null>(null);

export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((v) => !v), []);
  return (
    <SidebarCollapseContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse(): SidebarCollapseValue {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) {
    // Permissive fallback so the sidebar still works outside the workspace layout.
    return { collapsed: false, setCollapsed: () => {}, toggle: () => {} };
  }
  return ctx;
}
