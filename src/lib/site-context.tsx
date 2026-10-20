import { createContext, useContext } from "react";
import type { SitePayload } from "../../shared/types";

const SiteContext = createContext<SitePayload | null>(null);

export const SiteProvider = SiteContext.Provider;

export function useSite(): SitePayload {
  const site = useContext(SiteContext);
  if (!site) {
    throw new Error("useSite must be used inside a SiteProvider");
  }
  return site;
}
