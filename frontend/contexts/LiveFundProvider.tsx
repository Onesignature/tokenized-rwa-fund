"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBlockNumber,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FundContext } from "./FundContext";
import { contracts } from "@/lib/contracts";
import {
  erc20Abi,
  kycRegistryAbi,
  mockUsdcAbi,
  navOracleAbi,
  redemptionManagerAbi,
  subscriptionManagerAbi,
  treasuryAbi,
} from "@/lib/abis";
import type { Activity, FundActions, FundContextValue } from "@/lib/fund-types";

const MAX_UINT256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

export function LiveFundProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();

  // ── Reads ──────────────────────────────────────────────────────
  const { data: nav } = useReadContract({
    address: contracts.NAVOracle,
    abi: navOracleAbi,
    functionName: "getNav",
  });
  const { data: lastUpdatedAt } = useReadContract({
    address: contracts.NAVOracle,
    abi: navOracleAbi,
    functionName: "lastUpdatedAt",
  });
  const { data: totalSupply } = useReadContract({
    address: contracts.FeederFundToken,
    abi: erc20Abi,
    functionName: "totalSupply",
  });
  const { data: treasuryBalance } = useReadContract({
    address: contracts.Treasury,
    abi: treasuryAbi,
    functionName: "usdcBalance",
  });
  const { data: discountBps } = useReadContract({
    address: contracts.RedemptionManager,
    abi: redemptionManagerAbi,
    functionName: "discountBps",
  });
  const { data: minSubscription } = useReadContract({
    address: contracts.SubscriptionManager,
    abi: subscriptionManagerAbi,
    functionName: "minSubscription",
  });
  const { data: kycOwner } = useReadContract({
    address: contracts.KYCRegistry,
    abi: kycRegistryAbi,
    functionName: "owner",
  });

  const { data: userReads } = useReadContracts({
    contracts: address
      ? [
          {
            address: contracts.MockUSDC,
            abi: mockUsdcAbi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: contracts.FeederFundToken,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: contracts.KYCRegistry,
            abi: kycRegistryAbi,
            functionName: "isKycd",
            args: [address],
          },
          {
            address: contracts.MockUSDC,
            abi: mockUsdcAbi,
            functionName: "allowance",
            args: [address, contracts.SubscriptionManager],
          },
        ]
      : [],
    query: { enabled: !!address },
  });

  const userUsdc = (userReads?.[0]?.result as bigint | undefined) ?? 0n;
  const userTokens = (userReads?.[1]?.result as bigint | undefined) ?? 0n;
  const isKycd = (userReads?.[2]?.result as boolean | undefined) ?? false;
  const allowance = (userReads?.[3]?.result as bigint | undefined) ?? 0n;
  const navVal = nav ?? 10n ** 18n;
  const positionUsd =
    userTokens !== undefined && nav !== undefined
      ? (userTokens * nav) / 10n ** 30n
      : 0n;
  const isAdmin =
    !!address && !!kycOwner && address.toLowerCase() === kycOwner.toLowerCase();

  // ── Activity (event logs) ──────────────────────────────────────
  const client = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    (async () => {
      try {
        const [navLogs, subLogs, redLogs, kycLogs] = await Promise.all([
          client.getLogs({
            address: contracts.NAVOracle,
            event: navOracleAbi.find(
              (x) => x.type === "event" && x.name === "NavUpdated"
            ) as any,
            fromBlock: 0n,
            toBlock: "latest",
          }),
          client.getLogs({
            address: contracts.SubscriptionManager,
            event: subscriptionManagerAbi.find(
              (x) => x.type === "event" && x.name === "Subscribed"
            ) as any,
            fromBlock: 0n,
            toBlock: "latest",
          }),
          client.getLogs({
            address: contracts.RedemptionManager,
            event: redemptionManagerAbi.find(
              (x) => x.type === "event" && x.name === "Redeemed"
            ) as any,
            fromBlock: 0n,
            toBlock: "latest",
          }),
          client.getLogs({
            address: contracts.KYCRegistry,
            event: kycRegistryAbi.find(
              (x) => x.type === "event" && x.name === "KycStatusChanged"
            ) as any,
            fromBlock: 0n,
            toBlock: "latest",
          }),
        ]);

        const blockNumbers = new Set<bigint>();
        for (const l of [...navLogs, ...subLogs, ...redLogs, ...kycLogs]) {
          blockNumbers.add(l.blockNumber);
        }
        const blocks = await Promise.all(
          Array.from(blockNumbers).map((bn) => client.getBlock({ blockNumber: bn }))
        );
        const ts = new Map<bigint, bigint>();
        for (const b of blocks) ts.set(b.number!, b.timestamp);

        const combined: Activity[] = [
          ...navLogs.map((l: any) => ({
            kind: "nav" as const,
            blockNumber: l.blockNumber,
            timestamp: ts.get(l.blockNumber) ?? 0n,
            oldNav: l.args.oldNav,
            newNav: l.args.newNav,
            txHash: l.transactionHash,
          })),
          ...subLogs.map((l: any) => ({
            kind: "subscribe" as const,
            blockNumber: l.blockNumber,
            timestamp: ts.get(l.blockNumber) ?? 0n,
            subscriber: l.args.subscriber,
            usdcIn: l.args.usdcIn,
            tokensOut: l.args.tokensOut,
            navAtSubscription: l.args.navAtSubscription,
            txHash: l.transactionHash,
          })),
          ...redLogs.map((l: any) => ({
            kind: "redeem" as const,
            blockNumber: l.blockNumber,
            timestamp: ts.get(l.blockNumber) ?? 0n,
            redeemer: l.args.redeemer,
            tokensIn: l.args.tokensIn,
            usdcOut: l.args.usdcOut,
            navAtRedemption: l.args.navAtRedemption,
            discountBps: l.args.discountBpsAtRedemption,
            txHash: l.transactionHash,
          })),
          ...kycLogs.map((l: any) => ({
            kind: "kyc" as const,
            blockNumber: l.blockNumber,
            timestamp: ts.get(l.blockNumber) ?? 0n,
            account: l.args.account,
            kycd: l.args.kycd,
            txHash: l.transactionHash,
          })),
        ];

        combined.sort((a, b) =>
          a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1
        );

        if (!cancelled) setActivity(combined);
      } catch (err) {
        console.error("Activity fetch failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, blockNumber]);

  // ── Writes ─────────────────────────────────────────────────────
  const { writeContractAsync, data: hash, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || isConfirming;

  const actions: FundActions = useMemo(
    () => ({
      faucet: async (recipient, amount) => {
        await writeContractAsync({
          address: contracts.MockUSDC,
          abi: mockUsdcAbi,
          functionName: "faucet",
          args: [recipient, amount],
        });
      },
      setKyc: async (account, kycd) => {
        await writeContractAsync({
          address: contracts.KYCRegistry,
          abi: kycRegistryAbi,
          functionName: "setKycStatus",
          args: [account, kycd],
        });
      },
      approveUsdc: async () => {
        await writeContractAsync({
          address: contracts.MockUSDC,
          abi: mockUsdcAbi,
          functionName: "approve",
          args: [contracts.SubscriptionManager, MAX_UINT256],
        });
      },
      subscribe: async (amount) => {
        await writeContractAsync({
          address: contracts.SubscriptionManager,
          abi: subscriptionManagerAbi,
          functionName: "subscribe",
          args: [amount],
        });
      },
      redeem: async (amount) => {
        await writeContractAsync({
          address: contracts.RedemptionManager,
          abi: redemptionManagerAbi,
          functionName: "redeem",
          args: [amount],
        });
      },
      setNav: async (newNav) => {
        await writeContractAsync({
          address: contracts.NAVOracle,
          abi: navOracleAbi,
          functionName: "setNav",
          args: [newNav],
        });
      },
      setDiscountBps: async (bps) => {
        await writeContractAsync({
          address: contracts.RedemptionManager,
          abi: redemptionManagerAbi,
          functionName: "setDiscountBps",
          args: [bps],
        });
      },
      topUpTreasury: async (amount) => {
        await writeContractAsync({
          address: contracts.MockUSDC,
          abi: mockUsdcAbi,
          functionName: "faucet",
          args: [contracts.Treasury, amount],
        });
      },
    }),
    [writeContractAsync]
  );

  const value: FundContextValue = useMemo(
    () => ({
      mode: "live",
      state: {
        address,
        isConnected,
        isAdmin,
        nav: navVal,
        lastUpdatedAt: lastUpdatedAt ?? 0n,
        totalSupply: totalSupply ?? 0n,
        treasuryBalance: treasuryBalance ?? 0n,
        discountBps: discountBps ?? 0n,
        minSubscription: minSubscription ?? 100n * 10n ** 6n,
        userUsdc,
        userTokens,
        isKycd,
        allowance,
        positionUsd,
      },
      activity,
      busy,
      error: error ? (error as Error).message?.slice(0, 200) ?? null : null,
      actions,
    }),
    [
      address,
      isConnected,
      isAdmin,
      navVal,
      lastUpdatedAt,
      totalSupply,
      treasuryBalance,
      discountBps,
      minSubscription,
      userUsdc,
      userTokens,
      isKycd,
      allowance,
      positionUsd,
      activity,
      busy,
      error,
      actions,
    ]
  );

  // Reset write state on success — handled per-component now via context.
  useEffect(() => {
    if (!busy && hash) {
      // Reset after a tick so consumers can read final state.
      const t = setTimeout(() => reset(), 500);
      return () => clearTimeout(t);
    }
  }, [busy, hash, reset]);

  return <FundContext.Provider value={value}>{children}</FundContext.Provider>;
}
