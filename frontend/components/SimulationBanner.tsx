"use client";

import Link from "next/link";
import { useFund } from "@/hooks/useFund";
import { useTourOptional } from "@/contexts/TourContext";

export function SimulationBanner() {
  const { mode, actions } = useFund();
  const tour = useTourOptional();
  if (mode !== "simulate") return null;

  return (
    <div className="border-b border-gold/20 bg-gradient-to-r from-gold/[0.06] via-gold/[0.03] to-gold/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="chip border-gold/30 bg-gold/[0.12] text-gold">
            <span className="chip-dot bg-gold shadow-[0_0_8px_rgba(212,179,112,0.6)]" />
            Simulation
          </span>
          <span className="text-fg-muted">
            <span className="hidden sm:inline">No wallet, no real funds. </span>
            State is local to this browser tab.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {tour && !tour.active && (
            <button className="btn-quiet" onClick={() => tour.restart()}>
              Tour
            </button>
          )}
          {actions.quickStart && (
            <button className="btn-quiet" onClick={() => actions.quickStart!()}>
              Quick start
            </button>
          )}
          {actions.resetSimulation && (
            <button className="btn-quiet" onClick={() => actions.resetSimulation!()}>
              Reset
            </button>
          )}
          <Link href="/app" className="btn-quiet">
            <span className="hidden sm:inline">Switch to live →</span>
            <span className="sm:hidden">Live →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
