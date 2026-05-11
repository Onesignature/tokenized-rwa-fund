"use client";

import { useTourOptional } from "@/contexts/TourContext";

/**
 * Returns a className to apply to a component when it's the current tour target.
 * Components call this with their own id; if there's no TourProvider above (live app),
 * it returns an empty string and behaves as a no-op.
 */
export function useTourSpotlight(id: string): string {
  const tour = useTourOptional();
  return tour?.isTarget(id) ? "tour-spotlight" : "";
}
