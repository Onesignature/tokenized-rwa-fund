"use client";

import { useMemo, useState } from "react";
import { useFund } from "@/hooks/useFund";
import { fmtNav, fmtToken, fmtUsdc } from "@/lib/format";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/ConnectButton";
import { formatUnits, parseUnits } from "viem";

type Asset = "USDC" | "ETH" | "FFT";

const ASSET_META: Record<
  Asset,
  { symbol: string; name: string; decimals: number; color: string; glyph: string }
> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    color: "#2775CA",
    glyph: "$",
  },
  ETH: {
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    color: "#627EEA",
    glyph: "Ξ",
  },
  FFT: {
    symbol: "FFT",
    name: "Feeder Fund Token",
    decimals: 18,
    color: "#D4B370",
    glyph: "◆",
  },
};

export default function SwapPage() {
  const { mode, state, actions, busy, error } = useFund();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/simulate") ? "/simulate" : "/app";

  const [payAsset, setPayAsset] = useState<Asset>("USDC");
  const [payInput, setPayInput] = useState("");

  // Receive side: if pay is FFT, receive is USDC by default (toggleable);
  // otherwise receive is locked to FFT.
  const [exitAsset, setExitAsset] = useState<Asset>("USDC"); // only used when payAsset === FFT
  const receiveAsset: Asset = payAsset === "FFT" ? exitAsset : "FFT";

  const inSimulate = mode === "simulate";
  const ethSupported = !!actions.swapEthForTokens && !!actions.swapTokensForEth;

  const payDecimals = ASSET_META[payAsset].decimals;
  const payAmount = useMemo(() => {
    if (!payInput) return 0n;
    try {
      return parseUnits(payInput, payDecimals);
    } catch {
      return 0n;
    }
  }, [payInput, payDecimals]);

  // Preview: how much of the receive asset the user gets
  const receiveAmount = useMemo(() => {
    if (payAmount === 0n) return 0n;
    const nav = state.nav;
    if (nav === 0n) return 0n;

    if (payAsset === "USDC") {
      // USDC → FFT: tokens = usdc * 1e30 / nav
      return (payAmount * 10n ** 30n) / nav;
    }
    if (payAsset === "ETH") {
      // ETH → FFT: convert to USDC then to FFT
      const usdcEquiv =
        (payAmount * BigInt(state.ethPriceUsd) * 10n ** 6n) / 10n ** 18n;
      return (usdcEquiv * 10n ** 30n) / nav;
    }
    // FFT → USDC or ETH
    let usdc18 = (payAmount * nav) / 10n ** 18n;
    if (state.discountBps > 0n) {
      usdc18 = (usdc18 * (10000n - state.discountBps)) / 10000n;
    }
    const usdcOut = usdc18 / 10n ** 12n;
    if (receiveAsset === "USDC") return usdcOut;
    // FFT → ETH: convert USDC out to ETH at fixed price
    return (usdcOut * 10n ** 18n) / (BigInt(state.ethPriceUsd) * 10n ** 6n);
  }, [payAmount, payAsset, receiveAsset, state]);

  const payBalance =
    payAsset === "USDC"
      ? state.userUsdc
      : payAsset === "ETH"
      ? state.userEth
      : state.userTokens;

  const receiveBalance =
    receiveAsset === "USDC"
      ? state.userUsdc
      : receiveAsset === "ETH"
      ? state.userEth
      : state.userTokens;

  const insufficient = payAmount > payBalance;
  const needsApproval =
    payAsset === "USDC" && state.allowance < payAmount && payAmount > 0n;
  const isEthSwap = payAsset === "ETH" || receiveAsset === "ETH";
  const ethBlockedLive = isEthSwap && !ethSupported;
  const needsKyc =
    (payAsset === "USDC" || payAsset === "ETH") && !state.isKycd;
  const belowMin =
    payAsset === "USDC" &&
    payAmount > 0n &&
    payAmount < state.minSubscription;

  // Rate display string
  const rate = useMemo(() => {
    const nav = state.nav;
    const navNum = Number(formatUnits(nav, 18));
    if (payAsset === "USDC" && receiveAsset === "FFT") {
      return `1 USDC = ${(1 / navNum).toFixed(4)} FFT`;
    }
    if (payAsset === "FFT" && receiveAsset === "USDC") {
      return `1 FFT = $${navNum.toFixed(4)} USDC`;
    }
    if (payAsset === "ETH" && receiveAsset === "FFT") {
      return `1 ETH = ${(state.ethPriceUsd / navNum).toFixed(4)} FFT  (@ $${state.ethPriceUsd}/ETH)`;
    }
    if (payAsset === "FFT" && receiveAsset === "ETH") {
      return `1 FFT = ${(navNum / state.ethPriceUsd).toFixed(6)} ETH`;
    }
    return "—";
  }, [payAsset, receiveAsset, state]);

  const flipDirection = () => {
    if (payAsset === "FFT") {
      // Was FFT → X. Flip to X → FFT.
      setPayAsset(exitAsset);
      setPayInput("");
    } else {
      // Was X → FFT. Flip to FFT → X.
      setExitAsset(payAsset);
      setPayAsset("FFT");
      setPayInput("");
    }
  };

  const onSwap = async () => {
    if (payAsset === "USDC") {
      if (needsApproval) {
        await actions.approveUsdc();
        return;
      }
      await actions.subscribe(payAmount);
    } else if (payAsset === "ETH" && actions.swapEthForTokens) {
      actions.swapEthForTokens(payAmount);
    } else if (payAsset === "FFT" && receiveAsset === "USDC") {
      await actions.redeem(payAmount);
    } else if (payAsset === "FFT" && receiveAsset === "ETH" && actions.swapTokensForEth) {
      actions.swapTokensForEth(payAmount);
    }
    setPayInput("");
  };

  // Setup-required gates
  if (!state.isConnected) {
    return (
      <Gate title="Connect wallet to swap">
        <ConnectButton />
      </Gate>
    );
  }

  const canSubmit =
    payAmount > 0n &&
    !insufficient &&
    !ethBlockedLive &&
    !belowMin &&
    !busy &&
    (payAsset !== "USDC" || state.isKycd) &&
    (payAsset !== "ETH" || state.isKycd) &&
    !(payAsset === "FFT" && receiveAsset === "USDC" && receiveAmount > state.treasuryBalance) &&
    !(payAsset === "FFT" && receiveAsset === "ETH" && (receiveAmount === 0n));

  const submitLabel = (() => {
    if (busy) return "Pending…";
    if (payAmount === 0n) return "Enter an amount";
    if (insufficient) return `Insufficient ${payAsset} balance`;
    if (ethBlockedLive) return "ETH swaps require simulation";
    if (belowMin)
      return `Min ${fmtUsdc(state.minSubscription)} USDC`;
    if (needsKyc) return "KYC required";
    if (needsApproval) return "Approve USDC";
    return `Swap ${payAsset} for ${receiveAsset}`;
  })();

  return (
    <div className="mx-auto max-w-md pt-8 sm:pt-12">
      <div className="card !p-4 sm:!p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-fg">Swap</h1>
          <div className="flex items-center gap-1">
            <span className="chip text-[10px]">
              <span className="chip-dot bg-gain shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              NAV-based
            </span>
          </div>
        </div>

        {/* Pay panel */}
        <div className="mt-3">
          <TokenPanel
            label="You pay"
            asset={payAsset}
            assetOptions={payAsset === "FFT" ? ["FFT"] : ["USDC", "ETH"]}
            onAssetChange={(a) => {
              setPayAsset(a);
              setPayInput("");
            }}
            amount={payInput}
            onAmountChange={setPayInput}
            balance={payBalance}
            inSimulate={inSimulate}
            ethSupported={ethSupported}
          />
        </div>

        {/* Flip button */}
        <div className="relative -my-2 flex justify-center">
          <button
            onClick={flipDirection}
            className="z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-bg-surface text-fg-muted shadow-card hover:bg-bg-raised hover:text-fg"
            aria-label="Reverse direction"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3v9M5 12L2 9M5 12l3-3M11 13V4M11 4l-3 3M11 4l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Receive panel */}
        <TokenPanel
          label="You receive"
          asset={receiveAsset}
          assetOptions={payAsset === "FFT" ? ["USDC", "ETH"] : ["FFT"]}
          onAssetChange={(a) => setExitAsset(a)}
          amount={
            receiveAmount > 0n
              ? formatUnits(receiveAmount, ASSET_META[receiveAsset].decimals)
              : ""
          }
          onAmountChange={() => {}}
          balance={receiveBalance}
          readOnly
          inSimulate={inSimulate}
          ethSupported={ethSupported}
        />

        {/* Rate row */}
        {payAmount > 0n && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-xs text-fg-muted">
            <span>Rate</span>
            <span className="tabular text-fg">{rate}</span>
          </div>
        )}

        {/* Path B notice */}
        {payAsset === "FFT" && state.discountBps > 0n && (
          <div className="mt-2 rounded-lg border border-gold/30 bg-gold/[0.06] px-3 py-2 text-xs text-gold">
            Path B is active · {Number(state.discountBps) / 100}% discount applied
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="mt-3 rounded-lg border border-loss/30 bg-loss-soft px-3 py-2 text-xs text-loss break-all">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onSwap}
          disabled={!canSubmit && !needsApproval}
          className="btn-primary mt-4 w-full !py-3 text-base"
        >
          {submitLabel}
        </button>

        {/* Footnote */}
        <div className="mt-3 text-[11px] text-fg-faint">
          {payAsset === "USDC" && receiveAsset === "FFT" && (
            <>Routes through SubscriptionManager. Mints at the current NAV.</>
          )}
          {payAsset === "FFT" && receiveAsset === "USDC" && (
            <>Routes through RedemptionManager. Burns and pays USDC at NAV.</>
          )}
          {(payAsset === "ETH" || receiveAsset === "ETH") && inSimulate && (
            <>ETH is converted at a fixed $2,500/ETH for the demo, then routed through the fund.</>
          )}
          {(payAsset === "ETH" || receiveAsset === "ETH") && !inSimulate && (
            <>ETH swaps require a wrap layer not in this MVP. Try this in the <Link href="/simulate/swap" className="underline">simulation</Link>.</>
          )}
        </div>
      </div>

      {/* Side card: balances */}
      <div className="mt-4 card !p-4">
        <div className="kbd-label">Your balances</div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <BalanceBlock asset="USDC" amount={`$${fmtUsdc(state.userUsdc)}`} />
          <BalanceBlock
            asset="ETH"
            amount={
              ethSupported || state.userEth > 0n
                ? `${Number(formatUnits(state.userEth, 18)).toFixed(4)}`
                : "—"
            }
            muted={!ethSupported}
          />
          <BalanceBlock asset="FFT" amount={fmtToken(state.userTokens)} />
        </div>
        {state.userEth === 0n && ethSupported && (
          <button
            onClick={() => actions.faucetEth?.(5n * 10n ** 18n)}
            className="btn-quiet mt-3 w-full"
          >
            Get 5 test ETH
          </button>
        )}
      </div>
    </div>
  );
}

function TokenPanel({
  label,
  asset,
  assetOptions,
  onAssetChange,
  amount,
  onAmountChange,
  balance,
  readOnly,
  inSimulate,
  ethSupported,
}: {
  label: string;
  asset: Asset;
  assetOptions: Asset[];
  onAssetChange: (a: Asset) => void;
  amount: string;
  onAmountChange: (s: string) => void;
  balance: bigint;
  readOnly?: boolean;
  inSimulate: boolean;
  ethSupported: boolean;
}) {
  const meta = ASSET_META[asset];
  const balanceFmt =
    asset === "USDC"
      ? `$${fmtUsdc(balance)}`
      : asset === "ETH"
      ? `${Number(formatUnits(balance, 18)).toFixed(4)} ETH`
      : `${fmtToken(balance)} FFT`;

  return (
    <div className="rounded-xl border border-line bg-bg-input p-4">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="kbd-label">{label}</span>
        {!readOnly && (
          <button
            onClick={() => {
              const display = formatUnits(balance, meta.decimals);
              onAmountChange(display);
            }}
            className="text-fg-subtle hover:text-fg"
          >
            Bal: <span className="tabular">{balanceFmt}</span>
            {balance > 0n && <span className="ml-1 text-gold">· Max</span>}
          </button>
        )}
        {readOnly && (
          <span className="text-fg-subtle">
            Bal: <span className="tabular">{balanceFmt}</span>
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          readOnly={readOnly}
          className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular text-fg outline-none placeholder:text-fg-faint"
        />
        <AssetSelector
          asset={asset}
          options={assetOptions}
          onChange={onAssetChange}
          inSimulate={inSimulate}
          ethSupported={ethSupported}
        />
      </div>
    </div>
  );
}

function AssetSelector({
  asset,
  options,
  onChange,
  inSimulate,
  ethSupported,
}: {
  asset: Asset;
  options: Asset[];
  onChange: (a: Asset) => void;
  inSimulate: boolean;
  ethSupported: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = ASSET_META[asset];

  const single = options.length === 1;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => !single && setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-fg ${
          single ? "" : "hover:bg-white/[0.08] cursor-pointer"
        }`}
        disabled={single}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: meta.color }}
        >
          {meta.glyph}
        </span>
        {meta.symbol}
        {!single && (
          <svg viewBox="0 0 16 16" className="h-3 w-3 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {!single && open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-line-strong bg-bg-raised shadow-2xl">
            {options.map((opt) => {
              const m = ASSET_META[opt];
              const ethDisabled = opt === "ETH" && !ethSupported;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (ethDisabled) return;
                    onChange(opt);
                    setOpen(false);
                  }}
                  disabled={ethDisabled}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition ${
                    ethDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-white/[0.04]"
                  } ${opt === asset ? "bg-white/[0.04]" : ""}`}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.glyph}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{m.symbol}</div>
                    <div className="text-[11px] text-fg-subtle">
                      {m.name}
                      {ethDisabled && " · simulation only"}
                    </div>
                  </div>
                  {opt === asset && (
                    <svg viewBox="0 0 16 16" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function BalanceBlock({
  asset,
  amount,
  muted,
}: {
  asset: Asset;
  amount: string;
  muted?: boolean;
}) {
  const meta = ASSET_META[asset];
  return (
    <div className={muted ? "opacity-50" : ""}>
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ background: meta.color }}
        >
          {meta.glyph}
        </span>
        <span className="kbd-label">{asset}</span>
      </div>
      <div className="mt-1 tabular text-sm font-medium text-fg">{amount}</div>
    </div>
  );
}

function Gate({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="card text-center">
        <h1 className="display text-3xl text-fg">{title}</h1>
        <div className="mt-6 inline-flex">{children}</div>
      </div>
    </div>
  );
}
