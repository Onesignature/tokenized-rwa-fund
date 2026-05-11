"use client";

import { useState, useMemo } from "react";
import { useFund } from "@/hooks/useFund";
import { useTourSpotlight } from "@/hooks/useTourSpotlight";
import { fmtNav, fmtToken, fmtUsdc, parseUsdc } from "@/lib/format";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/ConnectButton";

export default function SubscribePage() {
  const { state, actions, busy, error } = useFund();
  const spotlight = useTourSpotlight("subscribe-form");
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/simulate") ? "/simulate" : "/app";

  const { isConnected, isKycd, nav, userUsdc, userTokens, allowance, minSubscription } =
    state;

  const [amount, setAmount] = useState("");
  const amountUsdc = parseUsdc(amount);

  const previewTokensOut = useMemo(() => {
    if (amountUsdc === 0n) return 0n;
    return (amountUsdc * 10n ** 30n) / nav;
  }, [nav, amountUsdc]);

  const needsApproval = allowance < amountUsdc;
  const insufficientBalance = amountUsdc > userUsdc;
  const belowMin = amountUsdc > 0n && amountUsdc < minSubscription;

  const onAction = async () => {
    if (needsApproval) {
      await actions.approveUsdc();
    } else {
      await actions.subscribe(amountUsdc);
      setAmount("");
    }
  };

  if (!isConnected) {
    return (
      <Gate title="Connect wallet to subscribe">
        <ConnectButton />
      </Gate>
    );
  }

  if (!isKycd) {
    return (
      <Gate title="KYC required" sub="Your address is not on the institutional allowlist.">
        <Link href={basePath} className="btn-primary">
          Go to dashboard
        </Link>
      </Gate>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[1fr_1fr]">
      <div className={`card ${spotlight}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="display text-3xl text-fg">Subscribe</h1>
          <span className="chip text-[10px]">
            min ${fmtUsdc(minSubscription)} · wallet ${fmtUsdc(userUsdc)}
          </span>
        </div>

        <p className="mt-2 text-sm text-fg-muted">
          Send USDC, receive fund tokens at the current NAV.
        </p>

        <div className="mt-8">
          <label className="kbd-label">You pay</label>
          <div className="relative mt-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input display !text-3xl sm:!text-4xl !py-4 sm:!py-5 pr-20 tabular"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-fg-muted">
              USDC
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {[100, 1000, 10000, 100000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v.toString())}
                className="btn-quiet"
              >
                ${v >= 1000 ? `${v / 1000}k` : v}
              </button>
            ))}
            <button
              onClick={() => setAmount((Number(userUsdc) / 1e6).toString())}
              className="btn-quiet col-span-3 sm:col-span-1"
            >
              Max
            </button>
          </div>
        </div>

        {(insufficientBalance || belowMin) && (
          <div className="mt-4 rounded-lg border border-loss/30 bg-loss-soft px-3 py-2.5 text-xs text-loss">
            {insufficientBalance && "Insufficient USDC. "}
            {belowMin && `Minimum subscription is $${fmtUsdc(minSubscription)}.`}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-loss/30 bg-loss-soft px-3 py-2.5 text-xs text-loss break-all">
            {error}
          </div>
        )}

        <div className="mt-8">
          {needsApproval ? (
            <>
              <div className="mb-3 flex gap-1.5">
                <StepPill active>1 · Approve</StepPill>
                <StepPill>2 · Subscribe</StepPill>
              </div>
              <button
                className="btn-primary w-full !py-3 text-base"
                onClick={onAction}
                disabled={busy || amountUsdc === 0n || insufficientBalance || belowMin}
              >
                {busy ? "Approving…" : "Approve USDC"}
              </button>
              <div className="mt-2 text-[11px] text-fg-faint">
                One-time approval — required before first subscription.
              </div>
            </>
          ) : (
            <button
              className="btn-primary w-full !py-3 text-base"
              onClick={onAction}
              disabled={busy || amountUsdc === 0n || insufficientBalance || belowMin}
            >
              {busy
                ? "Subscribing…"
                : amountUsdc > 0n
                ? `Subscribe $${formatAmount(amount)}`
                : "Enter an amount"}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative overflow-hidden card">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(212,179,112,0.10), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="kbd-label text-gold">You receive</div>
            <div className="mt-3">
              <div className="display text-5xl text-fg">
                {fmtToken(previewTokensOut, 4)}
              </div>
              <div className="mt-1 text-sm text-fg-muted">FFT — fund tokens</div>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-line pt-5">
              <Row label="Current NAV" value={`$${fmtNav(nav)}`} />
              <Row label="Tokens out" value={`${fmtToken(previewTokensOut)} FFT`} />
              <Row label="USDC in" value={`$${formatAmount(amount || "0")}`} />
              <Row
                label="Position value"
                value={`$${formatAmount(amount || "0")}`}
                sub="equal to USDC in — gain accrues as NAV rises"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kbd-label">What happens next</div>
          <ol className="mt-3 space-y-2 text-xs text-fg-muted">
            <Numbered n={1}>USDC moves into the fund treasury.</Numbered>
            <Numbered n={2}>Fund tokens are minted directly to your wallet.</Numbered>
            <Numbered n={3}>As NAV updates, position value tracks the underlying.</Numbered>
            <Numbered n={4}>Redeem at NAV (Path A) or NAV − discount (Path B).</Numbered>
          </ol>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="kbd-label">Current holdings</span>
            <span className="tabular text-sm font-medium text-fg">
              {fmtToken(userTokens)} FFT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPill({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`flex-1 rounded-md px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] ${
        active
          ? "bg-gold/[0.12] text-gold border border-gold/30"
          : "border border-line text-fg-faint"
      }`}
    >
      {children}
    </span>
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

function formatAmount(amount: string): string {
  if (!amount) return "0";
  const n = Number(amount);
  if (isNaN(n)) return amount;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
