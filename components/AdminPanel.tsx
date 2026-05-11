"use client";

import { useState } from "react";
import { useFund } from "@/hooks/useFund";
import { useTourSpotlight } from "@/hooks/useTourSpotlight";
import { fmtNav, fmtUsdc, parseNav, parseUsdc } from "@/lib/format";

export function AdminPanel() {
  const { mode, state, actions, busy } = useFund();
  const spotlight = useTourSpotlight("admin");
  const { isAdmin, nav, discountBps, treasuryBalance } = state;
  const [open, setOpen] = useState(true);
  const [customNav, setCustomNav] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [kycAddress, setKycAddress] = useState("");

  if (!isAdmin) return null;

  const bumpPct = (pct: number) => {
    const factor = BigInt(Math.round((1 + pct / 100) * 10000));
    actions.setNav((nav * factor) / 10000n);
  };

  const topUp = () => {
    const amount = parseUsdc(topUpAmount || "0");
    if (amount === 0n) return;
    actions.topUpTreasury(amount);
    setTopUpAmount("");
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/[0.04] to-transparent ${spotlight}`}
    >
      <div className="flex w-full items-center justify-between gap-3 px-6 py-4">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="chip border-gold/30 bg-gold/[0.08] text-gold">
            <span className="chip-dot bg-gold shadow-[0_0_8px_rgba(212,179,112,0.6)]" />
            Operator
          </span>
          <span className="text-sm font-medium text-fg">Admin controls</span>
          {mode === "simulate" && (
            <span className="text-xs text-fg-subtle">simulated</span>
          )}
        </button>
        <div className="flex items-center gap-3">
          {mode === "simulate" && actions.resetSimulation && (
            <button
              type="button"
              className="btn-quiet"
              onClick={() => actions.resetSimulation!()}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Collapse" : "Expand"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle hover:bg-white/[0.04] hover:text-fg"
          >
            <svg
              viewBox="0 0 16 16"
              className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="grid grid-cols-1 gap-px border-t border-line bg-line md:grid-cols-2">
          <Panel label="NAV update" value={`$${fmtNav(nav)}`} sub="±50% bound per call">
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <button disabled={busy} className="btn-quiet" onClick={() => bumpPct(15)}>
                +15%
              </button>
              <button disabled={busy} className="btn-quiet" onClick={() => bumpPct(30)}>
                +30%
              </button>
              <button disabled={busy} className="btn-quiet" onClick={() => bumpPct(-15)}>
                −15%
              </button>
              <button
                disabled={busy}
                className="btn-quiet"
                onClick={() => actions.setNav(10n ** 18n)}
              >
                Reset
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              <input
                className="input flex-1 py-2 text-sm"
                placeholder="custom (e.g. 1.75)"
                value={customNav}
                onChange={(e) => setCustomNav(e.target.value)}
              />
              <button
                disabled={busy || !customNav}
                className="btn-primary text-sm"
                onClick={() => {
                  actions.setNav(parseNav(customNav));
                  setCustomNav("");
                }}
              >
                Set
              </button>
            </div>
          </Panel>

          <Panel
            label="Redemption mode"
            value={
              discountBps > 0n
                ? `Path B · ${Number(discountBps) / 100}%`
                : "Path A · at NAV"
            }
            sub={
              discountBps > 0n
                ? "Buyback funded by market maker"
                : "Source Fund settles at exit"
            }
            valueAccent={discountBps > 0n ? "gold" : "gain"}
          >
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <button
                disabled={busy || discountBps === 0n}
                className="btn-quiet"
                onClick={() => actions.setDiscountBps(0n)}
              >
                Path A
              </button>
              <button
                disabled={busy || discountBps === 500n}
                className="btn-quiet"
                onClick={() => actions.setDiscountBps(500n)}
              >
                B · 5%
              </button>
              <button
                disabled={busy || discountBps === 1000n}
                className="btn-quiet"
                onClick={() => actions.setDiscountBps(1000n)}
              >
                B · 10%
              </button>
            </div>
          </Panel>

          <Panel
            label="Treasury top-up"
            value={`$${fmtUsdc(treasuryBalance)}`}
            sub="simulates Source Fund settlement"
          >
            <div className="mt-3 flex gap-1.5">
              <input
                className="input flex-1 py-2 text-sm"
                placeholder="USDC amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
              <button
                disabled={busy || !topUpAmount}
                className="btn-primary text-sm"
                onClick={topUp}
              >
                Top up
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button
                disabled={busy}
                className="btn-quiet"
                onClick={() => setTopUpAmount("1000")}
              >
                $1k
              </button>
              <button
                disabled={busy}
                className="btn-quiet"
                onClick={() => setTopUpAmount("10000")}
              >
                $10k
              </button>
              <button
                disabled={busy}
                className="btn-quiet"
                onClick={() => setTopUpAmount("100000")}
              >
                $100k
              </button>
            </div>
          </Panel>

          <Panel label="KYC allowlist" value="Add address" sub="institutional onboarding">
            <div className="mt-3 flex gap-1.5">
              <input
                className="input flex-1 py-2 font-mono text-xs"
                placeholder="0x..."
                value={kycAddress}
                onChange={(e) => setKycAddress(e.target.value)}
              />
              <button
                disabled={busy || !kycAddress}
                className="btn-primary text-sm"
                onClick={() => {
                  actions.setKyc(kycAddress as `0x${string}`, true);
                  setKycAddress("");
                }}
              >
                Add
              </button>
            </div>
            <div className="mt-2 text-[11px] text-fg-faint">
              Production: this role lives on a compliance multisig.
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Panel({
  label,
  value,
  sub,
  valueAccent,
  children,
}: {
  label: string;
  value: string;
  sub: string;
  valueAccent?: "gold" | "gain";
  children: React.ReactNode;
}) {
  const accent =
    valueAccent === "gold" ? "text-gold" : valueAccent === "gain" ? "text-gain" : "text-fg";
  return (
    <div className="bg-bg-surface p-5">
      <div className="kbd-label">{label}</div>
      <div className={`mt-1 tabular text-lg font-semibold ${accent}`}>{value}</div>
      <div className="text-[11px] text-fg-faint">{sub}</div>
      {children}
    </div>
  );
}
