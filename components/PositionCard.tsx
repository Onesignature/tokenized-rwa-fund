"use client";

import { useMemo } from "react";
import { useFund } from "@/hooks/useFund";
import { useTourSpotlight } from "@/hooks/useTourSpotlight";
import { fmtUsdc, fmtToken, fmtNav } from "@/lib/format";

export function PositionCard() {
  const { state, activity } = useFund();
  const spotlight = useTourSpotlight("position");
  const { address, isConnected, userTokens, userUsdc, positionUsd, nav } = state;

  const { costBasisUsdc, costBasisTokens, avgEntryNav } = useMemo(() => {
    if (!address) return { costBasisUsdc: 0n, costBasisTokens: 0n, avgEntryNav: 0n };
    let usdcIn = 0n;
    let tokensIn = 0n;
    for (const a of activity) {
      if (
        a.kind === "subscribe" &&
        a.subscriber.toLowerCase() === address.toLowerCase()
      ) {
        usdcIn += a.usdcIn;
        tokensIn += a.tokensOut;
      }
    }
    const avg = tokensIn > 0n ? (usdcIn * 10n ** 30n) / tokensIn : 0n;
    return { costBasisUsdc: usdcIn, costBasisTokens: tokensIn, avgEntryNav: avg };
  }, [activity, address]);

  if (!isConnected) {
    return (
      <div className={`card ${spotlight}`}>
        <div className="kbd-label">Your position</div>
        <div className="mt-3 text-sm text-fg-subtle">
          Connect a wallet to view your position.
        </div>
      </div>
    );
  }

  const hasPosition = userTokens > 0n;
  const positionValue = positionUsd;

  let pnl = 0n;
  let pnlPct = 0;
  if (hasPosition && costBasisTokens > 0n) {
    const proRataCost = (costBasisUsdc * userTokens) / costBasisTokens;
    pnl = positionValue - proRataCost;
    if (proRataCost > 0n) pnlPct = (Number(pnl) / Number(proRataCost)) * 100;
  }

  return (
    <div className={`relative overflow-hidden card ${spotlight}`}>
      {pnl > 0n && (
        <div
          className="pointer-events-none absolute inset-x-0 -top-16 h-32"
          style={{
            background:
              "radial-gradient(50% 100% at 50% 100%, rgba(52,211,153,0.14), transparent)",
          }}
        />
      )}
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="kbd-label">Your position</span>
          {hasPosition && pnl !== 0n && (
            <span
              className={`chip ${
                pnl > 0n
                  ? "border-gain/30 bg-gain-soft text-gain"
                  : "border-loss/30 bg-loss-soft text-loss"
              }`}
            >
              <span className="tabular">
                {pnl > 0n ? "↑" : "↓"} {Math.abs(pnlPct).toFixed(2)}%
              </span>
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="display text-5xl text-fg">
            <span className="text-fg-muted">$</span>
            {fmtUsdc(positionValue)}
          </span>
        </div>

        {hasPosition && pnl !== 0n && (
          <div
            className={`mt-1 text-sm tabular font-medium ${
              pnl > 0n ? "text-gain" : "text-loss"
            }`}
          >
            {pnl > 0n ? "+" : ""}${fmtUsdc(pnl)} ·{" "}
            <span className="text-fg-muted">cost basis ${fmtUsdc(costBasisUsdc)}</span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
          <Stat label="Tokens" value={fmtToken(userTokens, 2)} sub="FFT" />
          <Stat label="USDC wallet" value={`$${fmtUsdc(userUsdc)}`} sub="available" />
          <Stat
            label="NAV"
            value={`$${fmtNav(nav)}`}
            sub={avgEntryNav > 0n ? `entry $${fmtNav(avgEntryNav)}` : "current price"}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="kbd-label">{label}</div>
      <div className="mt-1 tabular text-base font-semibold text-fg">{value}</div>
      <div className="text-[10px] text-fg-faint">{sub}</div>
    </div>
  );
}
