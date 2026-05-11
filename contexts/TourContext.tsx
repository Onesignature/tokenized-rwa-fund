"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useFund } from "@/hooks/useFund";
import type { FundState } from "@/lib/fund-types";

export type TourStep = {
  id: string;
  title: string;
  body: ReactNode;
  targetId?: string;
  // user must be on this path for the step to be valid (we don't auto-redirect; we just wait)
  requiredPath?: (basePath: string) => string;
  // returns true → step is complete, auto-advance
  autoAdvanceWhen?: (state: FundState, pathname: string) => boolean;
  // shown CTA hint (e.g. "Click '+15%' on the admin panel")
  hint?: string;
};

const steps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the simulation",
    body: (
      <>
        This walks through the full lifecycle of a tokenized fund position. No wallet,
        no real funds — all state lives in this browser tab.
      </>
    ),
    hint: "Click Next to start.",
  },
  {
    id: "faucet",
    title: "1. Get test USDC",
    body: (
      <>
        Investors enter the fund with stablecoin. On the right, click{" "}
        <strong>Mint $10,000 mUSDC</strong> to fund your simulated wallet.
      </>
    ),
    targetId: "next-step",
    autoAdvanceWhen: (s) => s.userUsdc > 0n,
  },
  {
    id: "kyc",
    title: "2. Pass KYC",
    body: (
      <>
        Tokens only move between approved addresses. Click{" "}
        <strong>Add my address to KYC</strong>. In production this is handled by a real
        KYC provider (Sumsub, Onfido, etc.).
      </>
    ),
    targetId: "next-step",
    autoAdvanceWhen: (s) => s.isKycd,
  },
  {
    id: "subscribe-go",
    title: "3. Open the subscribe page",
    body: (
      <>
        You're eligible to subscribe. Click <strong>Subscribe →</strong> on the
        next-step card.
      </>
    ),
    targetId: "next-step",
    autoAdvanceWhen: (_, p) => p.endsWith("/subscribe"),
  },
  {
    id: "subscribe-form",
    title: "4. Enter an amount",
    body: (
      <>
        Pick any amount (try $1,000). You'll receive fund tokens minted at the current
        NAV. Approve once, then subscribe.
      </>
    ),
    requiredPath: (b) => `${b}/subscribe`,
    targetId: "subscribe-form",
    autoAdvanceWhen: (s) => s.userTokens > 0n,
  },
  {
    id: "back-to-dashboard",
    title: "5. Back to the dashboard",
    body: (
      <>
        Click <strong>Dashboard</strong> in the top nav. Your position is now in the
        right column.
      </>
    ),
    requiredPath: (b) => b,
    autoAdvanceWhen: (_, p) => p === "/simulate",
  },
  {
    id: "position",
    title: "Your position",
    body: (
      <>
        At launch, your position value equals what you paid — gain accrues as the NAV
        moves. Cost basis is computed from your subscription history.
      </>
    ),
    requiredPath: (b) => b,
    targetId: "position",
  },
  {
    id: "nav-update",
    title: "6. Bump the NAV",
    body: (
      <>
        In the operator panel, click <strong>+15%</strong>. This simulates a quarterly
        mark-up by the Source Fund's administrator. The chart updates in real time.
      </>
    ),
    requiredPath: (b) => b,
    targetId: "admin",
    autoAdvanceWhen: (s) => s.nav > 10n ** 18n,
  },
  {
    id: "watch-pnl",
    title: "Your position grew",
    body: (
      <>
        Position value is now above cost basis. Bump NAV a few more times — try +30% or
        a custom value — to see the chart and your P&L move.
      </>
    ),
    requiredPath: (b) => b,
    targetId: "position",
    hint: "Click Next when you're ready to exit.",
  },
  {
    id: "path-toggle",
    title: "Path A vs Path B",
    body: (
      <>
        In <strong>Redemption mode</strong>, you can switch between Path A (redeem at
        NAV, after the Source Fund sells) and Path B (a market-maker buyback at NAV
        minus a discount). Try toggling.
      </>
    ),
    requiredPath: (b) => b,
    targetId: "admin",
    hint: "Optional. Click Next to continue.",
  },
  {
    id: "treasury-prep",
    title: "Pre-fund the treasury",
    body: (
      <>
        At a higher NAV the treasury needs more USDC to settle redemptions. Click{" "}
        <strong>$10k</strong> (or more) under <strong>Treasury top-up</strong> — this
        simulates the Source Fund settling realized proceeds.
      </>
    ),
    requiredPath: (b) => b,
    targetId: "admin",
    hint: "When you've topped up enough, click Next.",
  },
  {
    id: "redeem-go",
    title: "7. Redeem your tokens",
    body: (
      <>
        Click <strong>Redeem</strong> on the next-step card to exit the position.
      </>
    ),
    requiredPath: (b) => b,
    targetId: "next-step",
    autoAdvanceWhen: (_, p) => p.endsWith("/redeem"),
  },
  {
    id: "redeem-form",
    title: "8. Confirm the redemption",
    body: (
      <>
        Pick how much to redeem (try 100%). You'll receive USDC at the current NAV. The
        preview shows your P&L versus your cost basis.
      </>
    ),
    requiredPath: (b) => `${b}/redeem`,
    autoAdvanceWhen: (s) => s.userTokens === 0n,
  },
  {
    id: "done",
    title: "Cycle complete ✓",
    body: (
      <>
        You've run the full lifecycle: onboarding → subscription → NAV tracking →
        redemption. The live app behaves identically with a real wallet on Sepolia.
        Click <strong>Done</strong> to close, or <strong>Reset</strong> in the banner
        to replay.
      </>
    ),
  },
];

type TourValue = {
  active: boolean;
  step: TourStep | null;
  index: number;
  total: number;
  next: () => void;
  prev: () => void;
  skip: () => void;
  restart: () => void;
  isTarget: (id: string) => boolean;
};

const TourContext = createContext<TourValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}

/** Optional helper for components that don't want to crash if no TourProvider. */
export function useTourOptional() {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const { state } = useFund();
  const pathname = usePathname() ?? "/simulate";

  const step = !dismissed && index < steps.length ? steps[index] : null;

  // Auto-advance when the current step's condition is satisfied.
  useEffect(() => {
    if (!step) return;
    if (!step.autoAdvanceWhen) return;
    if (step.autoAdvanceWhen(state, pathname)) {
      const t = setTimeout(() => setIndex((i) => i + 1), 400); // small pause for UX
      return () => clearTimeout(t);
    }
  }, [state, pathname, step]);

  const value: TourValue = useMemo(
    () => ({
      active: !!step,
      step,
      index,
      total: steps.length,
      next: () => setIndex((i) => Math.min(steps.length, i + 1)),
      prev: () => setIndex((i) => Math.max(0, i - 1)),
      skip: () => setDismissed(true),
      restart: () => {
        setIndex(0);
        setDismissed(false);
      },
      isTarget: (id: string) => step?.targetId === id,
    }),
    [step, index]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
