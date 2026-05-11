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
  kycRegistryAbi,
  mockUsdcAbi,
  navOracleAbi,
  subscriptionManagerAbi,
} from "@/lib/abis";
import { fmtNav, fmtToken, fmtUsdc, parseUsdc } from "@/lib/format";

export default function SubscribePage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const amountUsdc = parseUsdc(amount);

  const { data: nav } = useReadContract({
    address: contracts.NAVOracle,
    abi: navOracleAbi,
    functionName: "getNav",
  });
  const { data: minSubscription } = useReadContract({
    address: contracts.SubscriptionManager,
    abi: subscriptionManagerAbi,
    functionName: "minSubscription",
  });

  const { data: reads, refetch: refetchReads } = useReadContracts({
    contracts: address
      ? [
          {
            address: contracts.MockUSDC,
            abi: mockUsdcAbi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: contracts.MockUSDC,
            abi: mockUsdcAbi,
            functionName: "allowance",
            args: [address, contracts.SubscriptionManager],
          },
          {
            address: contracts.KYCRegistry,
            abi: kycRegistryAbi,
            functionName: "isKycd",
            args: [address],
          },
          {
            address: contracts.FeederFundToken,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          },
        ]
      : [],
    query: { enabled: !!address },
  });

  const usdcBalance = reads?.[0]?.result as bigint | undefined;
  const allowance = reads?.[1]?.result as bigint | undefined;
  const isKycd = reads?.[2]?.result as boolean | undefined;
  const tokenBalance = reads?.[3]?.result as bigint | undefined;

  const previewTokensOut = useMemo(() => {
    if (!nav || amountUsdc === 0n) return 0n;
    return (amountUsdc * 10n ** 30n) / nav;
  }, [nav, amountUsdc]);

  const needsApproval = allowance !== undefined && allowance < amountUsdc;
  const insufficientBalance =
    usdcBalance !== undefined && amountUsdc > usdcBalance;
  const belowMin =
    minSubscription !== undefined &&
    amountUsdc > 0n &&
    amountUsdc < minSubscription;

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      setAmount("");
      refetchReads();
      reset();
    }
  }, [isSuccess, refetchReads, reset]);

  const onApprove = () => {
    writeContract({
      address: contracts.MockUSDC,
      abi: mockUsdcAbi,
      functionName: "approve",
      args: [
        contracts.SubscriptionManager,
        BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
      ],
    });
  };

  const onSubscribe = () => {
    writeContract({
      address: contracts.SubscriptionManager,
      abi: subscriptionManagerAbi,
      functionName: "subscribe",
      args: [amountUsdc],
    });
  };

  return (
    <div className="pt-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
        Subscribe
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">
        Send USDC, receive fund tokens minted at the current NAV. Requires KYC
        approval. Minimum subscription:{" "}
        <span className="font-medium text-ink-700">
          ${fmtUsdc(minSubscription)} USDC
        </span>
        .
      </p>

      {!isConnected && (
        <div className="card mt-8 text-sm text-ink-500">
          Connect a wallet to subscribe.
        </div>
      )}

      {isConnected && !isKycd && (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-medium">KYC required</div>
          <p className="mt-1">
            Your address is not on the allowlist. Visit the{" "}
            <a href="/admin" className="underline">
              admin page
            </a>{" "}
            to self-KYC on the testnet.
          </p>
        </div>
      )}

      {isConnected && isKycd && (
        <div className="card mt-8 max-w-xl">
          <div className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <label className="label">USDC to subscribe</label>
                <button
                  onClick={() =>
                    usdcBalance &&
                    setAmount((Number(usdcBalance) / 1e6).toString())
                  }
                  className="text-xs font-medium text-ink-500 hover:text-ink-900"
                >
                  max: ${fmtUsdc(usdcBalance)}
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
                  {fmtToken(previewTokensOut)} FFT
                </div>
              </div>
            </div>

            {belowMin && (
              <div className="text-sm text-red-600">
                Below minimum: ${fmtUsdc(minSubscription)} required.
              </div>
            )}
            {insufficientBalance && (
              <div className="text-sm text-red-600">
                Insufficient USDC balance.
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 break-all">
                {(error as Error).message?.slice(0, 200) ?? "Transaction failed"}
              </div>
            )}

            <div className="flex gap-2">
              {needsApproval ? (
                <button
                  className="btn-primary flex-1"
                  onClick={onApprove}
                  disabled={
                    isPending ||
                    isConfirming ||
                    amountUsdc === 0n ||
                    insufficientBalance ||
                    belowMin
                  }
                >
                  {isPending || isConfirming ? "Approving…" : "1. Approve USDC"}
                </button>
              ) : (
                <button
                  className="btn-primary flex-1"
                  onClick={onSubscribe}
                  disabled={
                    isPending ||
                    isConfirming ||
                    amountUsdc === 0n ||
                    insufficientBalance ||
                    belowMin
                  }
                >
                  {isPending || isConfirming ? "Subscribing…" : "Subscribe"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-ink-100 pt-4 text-sm text-ink-500">
            <div className="flex justify-between">
              <span>Your USDC</span>
              <span className="tabular-nums">${fmtUsdc(usdcBalance)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Your FFT</span>
              <span className="tabular-nums">{fmtToken(tokenBalance)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
