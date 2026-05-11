"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import { useFund } from "@/hooks/useFund";
import { useTourSpotlight } from "@/hooks/useTourSpotlight";

export function NextStepCard() {
  const { mode, state, actions } = useFund();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/simulate") ? "/simulate" : "/app";

  const TOTAL = 5;

  if (!state.isConnected) {
    return (
      <Frame
        step={1}
        total={TOTAL}
        title="Connect a wallet"
        sub="Use MetaMask, WalletConnect, or any supported wallet."
      >
        <RKConnectButton.Custom>
          {({ openConnectModal }) => (
            <button onClick={openConnectModal} className="btn-primary w-full">
              Connect wallet
            </button>
          )}
        </RKConnectButton.Custom>
      </Frame>
    );
  }

  if (state.userUsdc === 0n) {
    return (
      <Frame
        step={2}
        total={TOTAL}
        title="Get test USDC"
        sub={
          mode === "simulate"
            ? "Simulated USDC for the demo. One click."
            : "The MVP uses a mock USDC with an open faucet."
        }
      >
        <button
          onClick={() =>
            actions.faucet(state.address!, 10_000n * 10n ** 6n)
          }
          className="btn-primary w-full"
        >
          Mint $10,000 mUSDC
        </button>
      </Frame>
    );
  }

  if (!state.isKycd) {
    return (
      <Frame
        step={3}
        total={TOTAL}
        title="Verify KYC"
        sub="In production this happens through a KYC provider. For the demo, the deployer can self-add."
      >
        {state.isAdmin ? (
          <button
            onClick={() => actions.setKyc(state.address!, true)}
            className="btn-primary w-full"
          >
            Add my address to KYC
          </button>
        ) : (
          <div className="rounded-lg border border-loss/20 bg-loss-soft p-3 text-xs text-loss">
            Your wallet isn't the KYC owner. Connect with the deployer wallet or ask the
            deployer to KYC your address.
          </div>
        )}
      </Frame>
    );
  }

  if (state.userTokens === 0n) {
    return (
      <Frame
        step={4}
        total={TOTAL}
        title="Subscribe to the fund"
        sub="Send USDC, receive fund tokens at the current NAV."
      >
        <Link
          href={`${basePath}/subscribe`}
          className="btn-primary block w-full text-center"
        >
          Subscribe →
        </Link>
      </Frame>
    );
  }

  return (
    <Frame
      step={5}
      total={TOTAL}
      title="You're in"
      sub="Update NAV to see your position move, or redeem when ready."
      done
    >
      <div className="grid grid-cols-2 gap-2">
        <Link href={`${basePath}/subscribe`} className="btn-secondary text-center">
          Subscribe more
        </Link>
        <Link href={`${basePath}/redeem`} className="btn-primary text-center">
          Redeem
        </Link>
      </div>
    </Frame>
  );
}

function Frame({
  step,
  total,
  title,
  sub,
  children,
  done,
}: {
  step: number;
  total: number;
  title: string;
  sub: string;
  children: React.ReactNode;
  done?: boolean;
}) {
  const spotlight = useTourSpotlight("next-step");
  return (
    <div className={`relative overflow-hidden card ${spotlight}`}>
      <div
        className="pointer-events-none absolute inset-x-0 -top-12 h-24"
        style={{
          background:
            "radial-gradient(50% 100% at 50% 100%, rgba(212,179,112,0.18), transparent)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="chip border-gold/30 bg-gold/[0.08] text-gold">
            <span className="chip-dot bg-gold" />
            {done ? "Ready" : "Next step"}
          </span>
          <span className="kbd-label text-fg-faint">
            Step {step} of {total}
          </span>
        </div>
        <div className="mt-4">
          <div className="text-xl font-semibold text-fg">{title}</div>
          <p className="mt-1.5 text-sm text-fg-muted">{sub}</p>
        </div>
        <div className="mt-5">{children}</div>
        <div className="mt-5 flex gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? "bg-gold" : "bg-white/[0.06]"
              } ${i === step - 1 ? "shadow-[0_0_8px_rgba(212,179,112,0.5)]" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
