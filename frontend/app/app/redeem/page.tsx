"use client";

import { useState, useMemo } from "react";
import { useFund } from "@/hooks/useFund";
import { fmtNav, fmtToken, fmtUsdc, parseToken } from "@/lib/format";
import { formatUnits } from "viem";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/ConnectButton";

export default function RedeemPage() {
  const { state, activity, actions, busy, error } = useFund();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/simulate") ? "/simulate" : "/app";

  const { isConnected, address, nav, discountBps, userTokens, userUsdc, treasuryBalance } =
    state;

  const [amount, setAmount] = useState("");
  const amountTokens = parseToken(amount);

  const avgEntryNav = useMemo(() => {
    if (!address) return 0n;
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
    if (tokensIn === 0n) return 0n;
    return (usdcIn * 10n ** 30n) / tokensIn;
  }, [activity, address]);

  const previewUsdcOut = useMemo(() => {
    if (amountTokens === 0n) return 0n;
    let usdc18 = (amountTokens * nav) / 10n ** 18n;
    if (discountBps > 0n) {
      usdc18 = (usdc18 * (10000n - discountBps)) / 10000n;
    }
    return usdc18 / 10n ** 12n;
  }, [nav, amountTokens, discountBps]);

  const costBasisOfRedemption = useMemo(() => {
    if (avgEntryNav === 0n || amountTokens === 0n) return 0n;
    const usdc18 = (amountTokens * avgEntryNav) / 10n ** 18n;
    return usdc18 / 10n ** 12n;
  }, [amountTokens, avgEntryNav]);

  const pnl = previewUsdcOut - costBasisOfRedemption;
  const pnlPct =
    costBasisOfRedemption > 0n
      ? (Number(pnl) / Number(costBasisOfRedemption)) * 100
      : 0;

  const insufficientTokens = amountTokens > userTokens;
  const insufficientTreasury = previewUsdcOut > treasuryBalance;
  const inPathB = discountBps > 0n;

  const setPct = (pct: number) => {
    if (userTokens === 0n) return;
    const amt = (userTokens * BigInt(pct)) / 100n;
    setAmount(formatUnits(amt, 18));
  };

  const onRedeem = async () => {
    await actions.redeem(amountTokens);
    setAmount("");
  };

  if (!isConnected) {
    return (
      <Gate title="Connect wallet to redeem">
        <ConnectButton />
      </Gate>
    );
  }

  if (userTokens === 0n) {
    return (
      <Gate title="No tokens to redeem" sub="Subscribe first, then come back.">
        <Link href={`${basePath}/subscribe`} className="btn-primary">
          Subscribe →
        </Link>
      </Gate>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[1fr_1fr]">
      <div className="card">
        <div className="flex items-baseline justify-between">
          <h1 className="display text-3xl text-fg">Redeem</h1>
          <span className="chip">holdings {fmtToken(userTokens)} FFT</span>
        </div>

        <p className="mt-2 text-sm text-fg-muted">
          Send tokens back to the fund, receive USDC.
        </p>

        <div
          className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${
            inPathB
              ? "border-gold/30 bg-gold/[0.06] text-gold"
              : "border-gain/30 bg-gain-soft text-gain"
          }`}
        >
          <span className="chip-dot bg-current" />
          <span className="font-semibold">
            {inPathB
              ? `Path B · ${Number(discountBps) / 100}% discount`
              : "Path A · redeem at NAV"}
          </span>
          <span className="text-fg-subtle">·</span>
          <span className="text-fg-muted">
            {inPathB
              ? "Market-maker-funded buyback"
              : "Source Fund has sold the underlying"}
          </span>
        </div>

        <div className="mt-8">
          <label className="kbd-label">You return</label>
          <div className="relative mt-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input display !text-4xl !py-5 pr-20 tabular"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-fg-muted">
              FFT
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} onClick={() => setPct(p)} className="btn-quiet">
                {p}%
              </button>
            ))}
          </div>
        </div>

        {insufficientTokens && (
          <div className="mt-4 rounded-lg border border-loss/30 bg-loss-soft px-3 py-2.5 text-xs text-loss">
            You only have {fmtToken(userTokens)} FFT.
          </div>
        )}
        {insufficientTreasury && (
          <div className="mt-4 rounded-lg border border-loss/30 bg-loss-soft px-3 py-2.5 text-xs text-loss">
            <div className="font-semibold">Treasury insufficient</div>
            <p className="mt-1 text-loss/80">
              Treasury holds ${fmtUsdc(treasuryBalance)}; this redemption needs $
              {fmtUsdc(previewUsdcOut)}. Use the operator panel on the dashboard to top
              up (simulates Source Fund settlement).
            </p>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-loss/30 bg-loss-soft px-3 py-2.5 text-xs text-loss break-all">
            {error}
          </div>
        )}

        <div className="mt-8">
          <button
            className="btn-primary w-full !py-3 text-base"
            onClick={onRedeem}
            disabled={
              busy || amountTokens === 0n || insufficientTokens || insufficientTreasury
            }
          >
            {busy
              ? "Redeeming…"
              : amountTokens > 0n
              ? `Redeem ${fmtToken(amountTokens)} FFT`
              : "Enter an amount"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative overflow-hidden card">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                pnl >= 0n
                  ? "radial-gradient(circle at 50% 0%, rgba(52,211,153,0.10), transparent 60%)"
                  : "radial-gradient(circle at 50% 0%, rgba(248,113,113,0.10), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="kbd-label text-gold">You receive</div>
            <div className="mt-3">
              <div className="display text-5xl text-fg">
                <span className="text-fg-muted">$</span>
                {fmtUsdc(previewUsdcOut)}
              </div>
              {avgEntryNav > 0n && amountTokens > 0n && (
                <div
                  className={`mt-1 tabular text-sm font-medium ${
                    pnl >= 0n ? "text-gain" : "text-loss"
                  }`}
                >
                  {pnl >= 0n ? "+" : ""}${fmtUsdc(pnl)} ({pnlPct >= 0 ? "+" : ""}
                  {pnlPct.toFixed(2)}%) vs cost basis
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2.5 border-t border-line pt-5">
              <Row label="NAV per token" value={`$${fmtNav(nav)}`} />
              {avgEntryNav > 0n && (
                <Row label="Your avg entry NAV" value={`$${fmtNav(avgEntryNav)}`} />
              )}
              {inPathB && (
                <Row
                  label="Discount applied"
                  value={`−${Number(discountBps) / 100}%`}
                  sub="Path B"
                />
              )}
              <Row label="Tokens in" value={`${fmtToken(amountTokens)} FFT`} />
              <Row label="USDC out" value={`$${fmtUsdc(previewUsdcOut)}`} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kbd-label">What happens next</div>
          <ol className="mt-3 space-y-2 text-xs text-fg-muted">
            <Numbered n={1}>Your tokens are burned permanently.</Numbered>
            <Numbered n={2}>USDC moves from the fund treasury to your wallet.</Numbered>
            <Numbered n={3}>
              Redemption does <em>not</em> require KYC — investors with lapsed KYC can
              still exit.
            </Numbered>
          </ol>
        </div>

        <div className="card">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="kbd-label">Your FFT</div>
              <div className="tabular mt-1 font-medium text-fg">
                {fmtToken(userTokens)}
              </div>
            </div>
            <div>
              <div className="kbd-label">Your USDC</div>
              <div className="tabular mt-1 font-medium text-fg">${fmtUsdc(userUsdc)}</div>
            </div>
            <div>
              <div className="kbd-label">Treasury</div>
              <div className="tabular mt-1 font-medium text-fg">
                ${fmtUsdc(treasuryBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs text-fg-muted">{label}</div>
        {sub && <div className="text-[10px] text-fg-faint">{sub}</div>}
      </div>
      <div className="tabular text-sm font-medium text-fg">{value}</div>
    </div>
  );
}

function Numbered({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-bg-input text-[10px] font-semibold text-fg-muted tabular">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Gate({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="card text-center">
        <h1 className="display text-3xl text-fg">{title}</h1>
        {sub && <p className="mt-2 text-sm text-fg-muted">{sub}</p>}
        <div className="mt-6 inline-flex">{children}</div>
      </div>
    </div>
  );
}
