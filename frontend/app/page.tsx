"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { contracts, networkInfo } from "@/lib/contracts";
import {
  navOracleAbi,
  erc20Abi,
  mockUsdcAbi,
  treasuryAbi,
  redemptionManagerAbi,
} from "@/lib/abis";
import { StatCard } from "@/components/StatCard";
import { Section } from "@/components/Section";
import { KycBanner } from "@/components/KycBanner";
import { fmtNav, fmtToken, fmtUsdc } from "@/lib/format";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

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

  const { data: userBalances } = useReadContracts({
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
        ]
      : [],
    query: { enabled: !!address },
  });

  const userUsdc = userBalances?.[0]?.result as bigint | undefined;
  const userTokens = userBalances?.[1]?.result as bigint | undefined;

  // position value = balance * nav / 1e18 (in USDC 18-dec, then scale to 6)
  const userPositionUsd =
    userTokens !== undefined && nav !== undefined
      ? (userTokens * nav) / 10n ** 30n
      : undefined;

  const lastUpdateAgo = lastUpdatedAt
    ? formatTimeAgo(Number(lastUpdatedAt))
    : "—";

  return (
    <div className="pt-8">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
            Fund dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Real-time view of the tokenized feeder fund — NAV, supply,
            treasury, and your position. Network:{" "}
            <span className="font-medium text-ink-700">
              {networkInfo.network}
            </span>{" "}
            (chain {networkInfo.chainId}).
          </p>
        </div>
      </div>

      <KycBanner />

      <Section
        title="Fund state"
        description="The on-chain view of the feeder fund. NAV is published by the authorized updater; the token follows."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="NAV per token"
            value={`$${fmtNav(nav)}`}
            sublabel={`updated ${lastUpdateAgo}`}
          />
          <StatCard
            label="Token supply"
            value={fmtToken(totalSupply)}
            sublabel="FFT outstanding"
          />
          <StatCard
            label="Treasury"
            value={`$${fmtUsdc(treasuryBalance)}`}
            sublabel="USDC reserves"
          />
          <StatCard
            label="Redemption mode"
            value={
              discountBps !== undefined
                ? discountBps > 0n
                  ? `Path B — ${Number(discountBps) / 100}% discount`
                  : "Path A — at NAV"
                : "—"
            }
            sublabel="set by admin"
          />
        </div>
      </Section>

      <Section
        title="Your position"
        description={
          isConnected
            ? "Connected. Your address holdings on this fund."
            : "Connect a wallet to see your position."
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="USDC balance"
            value={`$${fmtUsdc(userUsdc)}`}
            sublabel="mock USDC for the demo"
          />
          <StatCard
            label="Tokens held"
            value={fmtToken(userTokens)}
            sublabel="FFT"
          />
          <StatCard
            label="Position value"
            value={`$${fmtUsdc(userPositionUsd)}`}
            sublabel="tokens × NAV"
          />
        </div>
      </Section>

      <Section title="What this demo does">
        <div className="card text-sm leading-relaxed text-ink-700">
          <p>
            This is a working reference implementation of a tokenized feeder
            fund. The on-chain layer issues tokens against units in an
            off-chain hedge fund (the &ldquo;Source Fund&rdquo;). Token value
            tracks the Source Fund&apos;s NAV.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-600">
            <li>
              <strong>Subscribe</strong> — send USDC, receive tokens minted at
              the current NAV. Requires KYC.
            </li>
            <li>
              <strong>NAV updates</strong> — the admin updates the NAV from the
              admin page (in production, a multisig fed by the fund
              administrator).
            </li>
            <li>
              <strong>Redeem (Path A)</strong> — send tokens back, receive USDC
              at NAV. Simulates the Source Fund selling the underlying.
            </li>
            <li>
              <strong>Redeem (Path B)</strong> — admin sets a discount; tokens
              redeem at NAV minus the discount. Simulates a market-maker-funded
              buyback while the Source Fund keeps the underlying.
            </li>
          </ul>
          <p className="mt-4 text-ink-500">
            See <code>docs/04-token-lifecycle.md</code> for the full lifecycle
            walkthrough.
          </p>
        </div>
      </Section>
    </div>
  );
}

function formatTimeAgo(unixSec: number): string {
  if (!unixSec) return "—";
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
