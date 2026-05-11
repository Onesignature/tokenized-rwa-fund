"use client";

import { useAccount, useReadContract } from "wagmi";
import { contracts } from "@/lib/contracts";
import { kycRegistryAbi } from "@/lib/abis";

export function KycBanner() {
  const { address, isConnected } = useAccount();
  const { data: isKycd, isLoading } = useReadContract({
    address: contracts.KYCRegistry,
    abi: kycRegistryAbi,
    functionName: "isKycd",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected) return null;
  if (isLoading) return null;

  if (!isKycd) {
    return (
      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-medium">Your address is not KYC'd</div>
        <p className="mt-1 text-amber-800">
          On the testnet, the admin page lets you self-KYC for demo purposes.{" "}
          <a href="/admin" className="underline">
            Go to admin →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <div className="font-medium">KYC verified</div>
      <p className="mt-1 text-emerald-800">
        Your address is on the institutional allowlist. You can subscribe and
        transfer tokens.
      </p>
    </div>
  );
}
