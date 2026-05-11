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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="chip border-gold/30 bg-gold/[0.12] text-gold">
            <span className="chip-dot bg-gold shadow-[0_0_8px_rgba(212,179,112,0.6)]" />
            Simulation
          </span>
          <span className="text-fg-muted">
            No wallet, no real funds. State is local to this browser tab.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tour && !tour.active && (
            <button
              className="btn-quiet"
              onClick={() => tour.restart()}
              title="Restart guided tour"
            >
              <svg viewBox="0 0 16 16" className="mr-1 h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M6 6.5c0-1.1.9-2 2-2s2 .9 2 2c0 .8-.5 1.3-1.2 1.6-.5.2-.8.4-.8 1V10" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
              </svg>
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
            Switch to live →
          </Link>
        </div>
      </div>
    </div>
  );
}
