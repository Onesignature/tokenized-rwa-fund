"use client";

import Link from "next/link";
import { contracts } from "@/lib/contracts";

const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * Shown on /app when the contracts in deployment.json are zero addresses
 * (i.e. the user is on a Vercel deploy with no live contracts wired up).
 * Points them to the simulation instead.
 */
export function NotDeployedBanner() {
  const notDeployed = Object.values(contracts).every(
    (addr) => addr.toLowerCase() === ZERO
  );
  if (!notDeployed) return null;

  return (
    <div className="border-b border-gold/20 bg-gradient-to-r from-gold/[0.06] via-gold/[0.03] to-gold/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="chip border-gold/30 bg-gold/[0.12] text-gold">
            <span className="chip-dot bg-gold" />
            Live contracts not deployed
          </span>
          <span className="text-fg-muted">
            This deploy hasn't been wired to a testnet yet. Use the simulation to see
            the full flow.
          </span>
        </div>
        <Link href="/simulate" className="btn-primary !py-1.5 !px-3 text-xs">
          Open simulation →
        </Link>
      </div>
    </div>
  );
}
