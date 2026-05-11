"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contracts } from "@/lib/contracts";
import {
  erc20Abi,
  mockUsdcAbi,
  navOracleAbi,
  redemptionManagerAbi,
  treasuryAbi,
} from "@/lib/abis";
import { fmtNav, fmtToken, fmtUsdc, parseToken } from "@/lib/format";

export default function RedeemPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const amountTokens = parseToken(amount);

  const { data: nav } = useReadContract({
    address: contracts.NAVOracle,
    abi: navOracleAbi,
    functionName: "getNav",
  });
  const { data: discountBps } = useReadContract({
    address: contracts.RedemptionManager,
    abi: redemptionManagerAbi,
    functionName: "discountBps",
  });
  const { data: treasuryBalance } = useReadContract({
    address: contracts.Treasury,
    abi: treasuryAbi,
    functionName: "usdcBalance",
  });

  const { data: reads, refetch } = useReadContracts({
    contracts: address
      ? [
          {
            address: contracts.FeederFundToken,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: contracts.MockUSDC,
            abi: mockUsdcAbi,
            functionName: "balanceOf",
            args: [address],
          },
        ]
      : [],
    query: { enabled: !!address },
  });

  const tokenBalance = reads?.[0]?.result as bigint | undefined;
  const usdcBalance = reads?.[1]?.result as bigint | undefined;

  const previewUsdcOut = useMemo(() => {
    if (!nav || amountTokens === 0n) return 0n;
    let usdc18 = (amountTokens * nav) / 10n ** 18n;
    if (discountBps && discountBps > 0n) {
      usdc18 = (usdc18 * (10000n - discountBps)) / 10000n;
    }
    return usdc18 / 10n ** 12n;
  }, [nav, amountTokens, discountBps]);

  const insufficientTokens =
    tokenBalance !== undefined && amountTokens > tokenBalance;
  const insufficientTreasury =
    treasuryBalance !== undefined && previewUsdcOut > treasuryBalance;

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      setAmount("");
      refetch();
      reset();
    }
  }, [isSuccess, refetch, reset]);

  const onRedeem = () => {
    writeContract({
      address: contracts.RedemptionManager,
      abi: redemptionManagerAbi,
      functionName: "redeem",
      args: [amountTokens],
    });
  };

  const inPathB = (discountBps ?? 0n) > 0n;

  return (
    <div className="pt-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
        Redeem
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">
        Send tokens back to the fund and receive USDC at the current NAV.
        Redemption does <em>not</em> require KYC — even investors whose KYC has
        lapsed can exit.
      </p>

      {!isConnected && (
        <div className="card mt-8 text-sm text-ink-500">
          Connect a wallet to redeem.
        </div>
      )}

      {isConnected && (
        <div className="card mt-8 max-w-xl">
          <div
            className={`-mt-1 mb-5 rounded-md border px-3 py-2 text-sm ${
              inPathB
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <span className="font-medium">
              {inPathB
                ? `Path B — ${Number(discountBps) / 100}% discount to NAV`
                : "Path A — redemption at NAV"}
            </span>
            <span className="ml-2 text-xs opacity-80">
              {inPathB
                ? "Source Fund keeps the underlying; market maker funds buyback."
                : "Source Fund has sold the underlying."}
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <label className="label">Tokens to redeem</label>
                <button
                  onClick={() =>
                    tokenBalance &&
                    setAmount((Number(tokenBalance) / 1e18).toString())
                  }
                  className="text-xs font-medium text-ink-500 hover:text-ink-900"
                >
                  max: {fmtToken(tokenBalance)} FFT
                </button>
              </div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-ink-50 p-4 text-sm">
              <div>
                <div className="stat-label">NAV per token</div>
                <div className="mt-1 font-medium tabular-nums">
                  ${fmtNav(nav)}
                </div>
              </div>
              <div>
                <div className="stat-label">You receive</div>
                <div className="mt-1 font-medium tabular-nums">
                  ${fmtUsdc(previewUsdcOut)}
                </div>
              </div>
            </div>

            {insufficientTokens && (
              <div className="text-sm text-red-600">
                You only have {fmtToken(tokenBalance)} FFT.
              </div>
            )}
            {insufficientTreasury && (
              <div className="text-sm text-red-600">
                Treasury has only ${fmtUsdc(treasuryBalance)} USDC available.
                {!inPathB && (
                  <span className="block mt-1 text-xs">
                    In a real cycle, the Source Fund would settle the position
                    by topping up the treasury before opening redemption.
                  </span>
                )}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 break-all">
                {(error as Error).message?.slice(0, 200) ?? "Transaction failed"}
              </div>
            )}

            <button
              className="btn-primary w-full"
              onClick={onRedeem}
              disabled={
                isPending ||
                isConfirming ||
                amountTokens === 0n ||
                insufficientTokens ||
                insufficientTreasury
              }
            >
              {isPending || isConfirming ? "Redeeming…" : "Redeem"}
            </button>
          </div>

          <div className="mt-6 border-t border-ink-100 pt-4 text-sm text-ink-500">
            <div className="flex justify-between">
              <span>Your FFT</span>
              <span className="tabular-nums">{fmtToken(tokenBalance)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Your USDC</span>
              <span className="tabular-nums">${fmtUsdc(usdcBalance)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Treasury USDC</span>
              <span className="tabular-nums">${fmtUsdc(treasuryBalance)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
