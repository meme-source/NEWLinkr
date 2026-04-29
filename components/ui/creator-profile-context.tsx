"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  CreatorProfileDrawer,
  type CreatorProfileInput,
} from "@/components/ui/creator-profile-drawer";

interface Ctx {
  openCreatorProfile: (input: CreatorProfileInput) => void;
  closeCreatorProfile: () => void;
}

const CreatorProfileContext = createContext<Ctx | null>(null);

export function CreatorProfileProvider({ children }: { children: React.ReactNode }) {
  const [creator, setCreator] = useState<CreatorProfileInput | null>(null);

  const openCreatorProfile = useCallback((input: CreatorProfileInput) => {
    setCreator(input);
  }, []);
  const closeCreatorProfile = useCallback(() => setCreator(null), []);

  const value = useMemo(
    () => ({ openCreatorProfile, closeCreatorProfile }),
    [openCreatorProfile, closeCreatorProfile]
  );

  return (
    <CreatorProfileContext.Provider value={value}>
      {children}
      <CreatorProfileDrawer creator={creator} onClose={closeCreatorProfile} />
    </CreatorProfileContext.Provider>
  );
}

export function useCreatorProfile(): Ctx {
  const ctx = useContext(CreatorProfileContext);
  if (!ctx) {
    // Silently noop outside the provider — avoids breaking isolated demos.
    return {
      openCreatorProfile: () => {},
      closeCreatorProfile: () => {},
    };
  }
  return ctx;
}
