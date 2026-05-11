"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contracts } from "@/lib/contracts";
import {
  kycRegistryAbi,
  mockUsdcAbi,
  navOracleAbi,
  redemptionManagerAbi,
} from "@/lib/abis";
import { fmtNav, fmtUsdc, parseNav, parseUsdc } from "@/lib/format";

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  const { data: oracleOwner } = useReadContract({
    address: contracts.NAVOracle,
    abi: navOracleAbi,
    functionName: "owner",
  });
  const { data: oracleUpdater } = useReadContract({
    address: contracts.NAVOracle,
    abi: navOracleAbi,
    functionName: "updater",
  });
  const { data: kycOwner } = useReadContract({
    address: contracts.KYCRegistry,
    abi: kycRegistryAbi,
    functionName: "owner",
  });
  const { data: redemptionOwner } = useReadContract({
    address: contracts.RedemptionManager,
    abi: redemptionManagerAbi,
    functionName: "owner",
  });

  const isOracleUpdater =
    !!address && !!oracleUpdater && address.toLowerCase() === oracleUpdater.toLowerCase();
  const isKycOwner =
    !!address && !!kycOwner && address.toLowerCase() === kycOwner.toLowerCase();
  const isRedemptionOwner =
    !!address && !!redemptionOwner && address.toLowerCase() === redemptionOwner.toLowerCase();

  return (
    <div className="pt-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
        Admin
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">
        Testnet admin controls. In production, every action below is taken by a
        multisig governed by the fund administrator.
      </p>

      {!isConnected && (
        <div className="card mt-8 text-sm text-ink-500">
          Connect a wallet to access admin functions.
        </div>
      )}

      {isConnected && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FaucetCard />
          <KycCard isAdmin={isKycOwner} />
          <NavCard isUpdater={isOracleUpdater} />
          <RedemptionModeCard isAdmin={isRedemptionOwner} />
        </div>
      )}

      <div className="card mt-8 text-xs text-ink-500">
        <div className="font-medium text-ink-700">Roles for this connection</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            KYC owner:{" "}
            <span className={isKycOwner ? "text-emerald-700" : "text-ink-400"}>
              {isKycOwner ? "you" : kycOwner ?? "—"}
            </span>
          </div>
          <div>
            Oracle updater:{" "}
            <span
              className={isOracleUpdater ? "text-emerald-700" : "text-ink-400"}
            >
              {isOracleUpdater ? "you" : oracleUpdater ?? "—"}
            </span>
          </div>
          <div>
            Oracle owner:{" "}
            <span className="text-ink-400">{oracleOwner ?? "—"}</span>
          </div>
          <div>
            Redemption owner:{" "}
            <span
              className={isRedemptionOwner ? "text-emerald-700" : "text-ink-400"}
            >
              {isRedemptionOwner ? "you" : redemptionOwner ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaucetCard() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("10000");
  const { data: balance, refetch } = useReadContract({
    address: contracts.MockUSDC,
    abi: mockUsdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  return (
    <div className="card">
      <div className="text-base font-semibold text-ink-900">USDC Faucet</div>
      <p className="mt-1 text-sm text-ink-500">
        Mint test USDC to your address. Demo only.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          className="input flex-1"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="btn-primary"
          disabled={!address || isPending || isLoading}
          onClick={() =>
            writeContract({
              address: contracts.MockUSDC,
              abi: mockUsdcAbi,
              functionName: "faucet",
              args: [address!, parseUsdc(amount)],
            })
          }
        >
          {isPending || isLoading ? "Minting…" : "Mint USDC"}
        </button>
      </div>
      <div className="mt-3 text-xs text-ink-500">
        Your USDC: ${fmtUsdc(balance)}
      </div>
    </div>
  );
}

function KycCard({ isAdmin }: { isAdmin: boolean }) {
  const { address } = useAccount();
  const [target, setTarget] = useState("");

  const { data: selfKycd, refetch: refetchSelf } = useReadContract({
    address: contracts.KYCRegistry,
    abi: kycRegistryAbi,
    functionName: "isKycd",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  useEffect(() => {
    if (isSuccess) refetchSelf();
  }, [isSuccess, refetchSelf]);

  return (
    <div className="card">
      <div className="text-base font-semibold text-ink-900">KYC Registry</div>
      <p className="mt-1 text-sm text-ink-500">
        Owner-controlled allowlist. In production, this role belongs to the
        compliance team's multisig.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <div className="label">Self-KYC</div>
          <div className="mt-1 flex items-center justify-between rounded-lg bg-ink-50 p-3 text-sm">
            <span className="break-all text-ink-700">{address}</span>
            <span
              className={
                selfKycd ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"
              }
            >
              {selfKycd ? "KYC'd" : "not KYC'd"}
            </span>
          </div>
          {!selfKycd && isAdmin && (
            <button
              className="btn-primary mt-2 w-full"
              disabled={isPending || isLoading}
              onClick={() =>
                writeContract({
                  address: contracts.KYCRegistry,
                  abi: kycRegistryAbi,
                  functionName: "setKycStatus",
                  args: [address!, true],
                })
              }
            >
              {isPending || isLoading ? "Adding…" : "Add my address"}
            </button>
          )}
          {!selfKycd && !isAdmin && (
            <p className="mt-2 text-xs text-ink-500">
              You're not the KYC owner; ask whoever deployed the contracts to
              KYC your address.
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="border-t border-ink-100 pt-3">
            <div className="label">Add another address</div>
            <div className="mt-1 flex gap-2">
              <input
                className="input flex-1 font-mono text-xs"
                placeholder="0x..."
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              <button
                className="btn-secondary"
                disabled={!target || isPending || isLoading}
                onClick={() =>
                  writeContract({
                    address: contracts.KYCRegistry,
                    abi: kycRegistryAbi,
                    functionName: "setKycStatus",
                    args: [target as `0x${string}`, true],
                  })
                }
              >
                Add
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 break-all">
            {(error as Error).message?.slice(0, 200)}
          </div>
        )}
      </div>
    </div>
  );
}

function NavCard({ isUpdater }: { isUpdater: boolean }) {
  const [newNav, setNewNav] = useState("");
  const { data: nav } = useReadContract({
    address: contracts.NAVOracle,
    abi: navOracleAbi,
    functionName: "getNav",
  });

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading } = useWaitForTransactionReceipt({ hash: txHash });

  return (
    <div className="card">
      <div className="text-base font-semibold text-ink-900">NAV Oracle</div>
      <p className="mt-1 text-sm text-ink-500">
        Publish a new NAV. Updates are bounded to ±50% per call.
      </p>

      <div className="mt-4 rounded-lg bg-ink-50 p-3 text-sm">
        <div className="stat-label">Current NAV</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">
          ${fmtNav(nav)}
        </div>
      </div>

      {isUpdater ? (
        <div className="mt-4 flex gap-2">
          <input
            className="input flex-1"
            type="number"
            step="0.01"
            placeholder="e.g. 1.15"
            value={newNav}
            onChange={(e) => setNewNav(e.target.value)}
          />
          <button
            className="btn-primary"
            disabled={!newNav || isPending || isLoading}
            onClick={() =>
              writeContract({
                address: contracts.NAVOracle,
                abi: navOracleAbi,
                functionName: "setNav",
                args: [parseNav(newNav)],
              })
            }
          >
            {isPending || isLoading ? "Updating…" : "Update NAV"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-ink-500">
          You're not the oracle updater. Connect with the deployer wallet to
          update NAV.
        </p>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-600 break-all">
          {(error as Error).message?.slice(0, 200)}
        </div>
      )}
    </div>
  );
}

function RedemptionModeCard({ isAdmin }: { isAdmin: boolean }) {
  const [bps, setBps] = useState("");
  const { data: currentBps } = useReadContract({
    address: contracts.RedemptionManager,
    abi: redemptionManagerAbi,
    functionName: "discountBps",
  });

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading } = useWaitForTransactionReceipt({ hash: txHash });

  return (
    <div className="card">
      <div className="text-base font-semibold text-ink-900">
        Redemption Mode (Path A / Path B)
      </div>
      <p className="mt-1 text-sm text-ink-500">
        Set the redemption discount in basis points. 0 = Path A (redeem at NAV).
        500 = Path B with 5% discount. Max 2000 (20%).
      </p>

      <div className="mt-4 rounded-lg bg-ink-50 p-3 text-sm">
        <div className="stat-label">Current discount</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">
          {currentBps !== undefined
            ? `${Number(currentBps) / 100}% (${currentBps.toString()} bps)`
            : "—"}
        </div>
      </div>

      {isAdmin ? (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="number"
              step="1"
              max="2000"
              placeholder="bps (0 = Path A, 500 = Path B 5%)"
              value={bps}
              onChange={(e) => setBps(e.target.value)}
            />
            <button
              className="btn-primary"
              disabled={bps === "" || isPending || isLoading}
              onClick={() =>
                writeContract({
                  address: contracts.RedemptionManager,
                  abi: redemptionManagerAbi,
                  functionName: "setDiscountBps",
                  args: [BigInt(bps || "0")],
                })
              }
            >
              {isPending || isLoading ? "Setting…" : "Set"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary flex-1 text-xs"
              onClick={() =>
                writeContract({
                  address: contracts.RedemptionManager,
                  abi: redemptionManagerAbi,
                  functionName: "setDiscountBps",
                  args: [0n],
                })
              }
            >
              → Path A (0%)
            </button>
            <button
              className="btn-secondary flex-1 text-xs"
              onClick={() =>
                writeContract({
                  address: contracts.RedemptionManager,
                  abi: redemptionManagerAbi,
                  functionName: "setDiscountBps",
                  args: [500n],
                })
              }
            >
              → Path B (5%)
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-ink-500">
          You're not the redemption owner. Connect with the deployer wallet to
          switch modes.
        </p>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-600 break-all">
          {(error as Error).message?.slice(0, 200)}
        </div>
      )}
    </div>
  );
}
