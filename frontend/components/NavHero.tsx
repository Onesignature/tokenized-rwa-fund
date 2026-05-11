"use client";

import { useMemo } from "react";
import { useFund } from "@/hooks/useFund";
import { fmtNav, fmtToken, fmtUsdc } from "@/lib/format";
import { NavChart } from "./NavChart";

export function NavHero() {
  const { state, activity } = useFund();
  const { nav, totalSupply, treasuryBalance, lastUpdatedAt, discountBps } = state;

  const { navDelta, navPct } = useMemo(() => {
    const navs = activity
      .filter((a): a is Extract<typeof activity[number], { kind: "nav" }> => a.kind === "nav")
      .sort((a, b) => Number(a.timestamp - b.timestamp));
    if (navs.length === 0) return { navDelta: 0n, navPct: 0 };
    const first = navs[0].newNav === 0n ? navs[0].newNav : navs[0].newNav; // use first non-zero
    const initial = navs.find((n) => n.newNav > 0n)?.newNav ?? nav;
    const delta = nav - initial;
    const pct = initial === 0n ? 0 : (Number(delta) / Number(initial)) * 100;
    return { navDelta: delta, navPct: pct };
  }, [activity, nav]);

  const aum = (totalSupply * nav) / 10n ** 30n;
  const lastUpdate = lastUpdatedAt ? formatTimeAgo(Number(lastUpdatedAt)) : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade opacity-100" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
        <div className="p-8 lg:p-10">
          <div className="flex items-center gap-2">
            <span className="kbd-label text-gold">Live NAV</span>
            <span className="kbd-label text-fg-faint">· updated {lastUpdate}</span>
          </div>

          <div className="mt-4 flex items-baseline gap-4">
            <div className="display text-[88px] leading-none text-fg">
              <span className="text-fg-muted">$</span>
              <span>{fmtNav(nav)}</span>
            </div>
          </div>

          {navDelta !== 0n && (
            <div className="mt-3 inline-flex items-center gap-2">
              <span
                className={`chip ${
                  navDelta > 0n
                    ? "border-gain/30 bg-gain-soft text-gain"
                    : "border-loss/30 bg-loss-soft text-loss"
                }`}
              >
                <span className="chip-dot bg-current" />
                <span className="tabular">
                  {navDelta > 0n ? "+" : ""}
                  {navPct.toFixed(2)}%
                </span>
              </span>
              <span className="text-xs text-fg-subtle">since launch</span>
            </div>
          )}

          <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <Stat label="Fund AUM" value={`$${fmtUsdc(aum)}`} sub="supply × NAV" />
            <Stat
              label="Token supply"
              value={fmtToken(totalSupply, 2)}
              sub="FFT outstanding"
            />
            <Stat
              label="Treasury"
              value={`$${fmtUsdc(treasuryBalance)}`}
              sub={
                discountBps > 0n
                  ? `Path B · ${Number(discountBps) / 100}%`
                  : "Path A · at NAV"
              }
              subAccent={discountBps > 0n ? "gold" : "gain"}
            />
          </div>
        </div>

        <div className="relative border-t border-line lg:border-l lg:border-t-0">
          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <span className="kbd-label text-fg-subtle">NAV history</span>
              <span className="text-xs text-fg-faint">All updates since launch</span>
            </div>
            <div className="mt-6">
              <NavChart activity={activity} currentNav={nav} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  subAccent,
}: {
  label: string;
  value: string;
  sub: string;
  subAccent?: "gold" | "gain";
}) {
  return (
    <div className="bg-bg-surface p-4">
      <div className="kbd-label">{label}</div>
      <div className="mt-1.5 tabular text-lg font-semibold text-fg">{value}</div>
      <div
        className={`mt-0.5 text-[11px] ${
          subAccent === "gold"
            ? "text-gold"
            : subAccent === "gain"
            ? "text-gain"
            : "text-fg-subtle"
        }`}
      >
        {sub}
      </div>
    </div>
  );
}

function formatTimeAgo(unixSec: number): string {
  if (!unixSec) return "—";
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
