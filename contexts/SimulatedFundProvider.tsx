"use client";

import { ReactNode, useCallback, useMemo, useReducer } from "react";
import { FundContext } from "./FundContext";
import type {
  Activity,
  FundActions,
  FundContextValue,
  FundState,
} from "@/lib/fund-types";
import { SIM_ADDRESS } from "@/lib/fund-types";

const ONE_USDC = 10n ** 6n;
const ONE_TOKEN = 10n ** 18n;
const ONE_NAV = 10n ** 18n;
const ONE_ETH = 10n ** 18n;
const USDC_TO_18 = 10n ** 12n;
const MAX_NAV_UPDATE_BPS = 5000n;
const BPS_DENOM = 10000n;
const SIM_ETH_PRICE_USD = 2500; // fixed for the demo

type SimState = Omit<FundState, "positionUsd"> & {
  activity: Activity[];
  nextBlock: bigint;
};

type SimAction =
  | { type: "faucet"; recipient: `0x${string}`; amount: bigint }
  | { type: "faucetEth"; amount: bigint }
  | { type: "setKyc"; account: `0x${string}`; kycd: boolean }
  | { type: "approve" }
  | { type: "subscribe"; amount: bigint }
  | { type: "redeem"; amount: bigint }
  | { type: "swapEthForTokens"; ethAmount: bigint }
  | { type: "swapTokensForEth"; tokenAmount: bigint }
  | { type: "setNav"; nav: bigint }
  | { type: "setDiscountBps"; bps: bigint }
  | { type: "topUp"; amount: bigint }
  | { type: "reset" }
  | { type: "quickStart" };

function initialState(): SimState {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return {
    address: SIM_ADDRESS,
    isConnected: true,
    isAdmin: true,
    nav: ONE_NAV,
    lastUpdatedAt: now,
    totalSupply: 0n,
    treasuryBalance: 0n,
    discountBps: 0n,
    minSubscription: 100n * ONE_USDC,
    userUsdc: 0n,
    userTokens: 0n,
    userEth: 0n,
    ethPriceUsd: SIM_ETH_PRICE_USD,
    isKycd: false,
    allowance: 0n,
    nextBlock: 2n,
    activity: [
      {
        kind: "nav",
        blockNumber: 1n,
        timestamp: now,
        oldNav: 0n,
        newNav: ONE_NAV,
        txHash: synthHash(1),
      },
    ],
  };
}

function reducer(s: SimState, a: SimAction): SimState {
  const block = s.nextBlock;
  const now = BigInt(Math.floor(Date.now() / 1000));
  switch (a.type) {
    case "faucet": {
      const isSelf =
        a.recipient.toLowerCase() === (s.address ?? "").toLowerCase();
      return {
        ...s,
        userUsdc: isSelf ? s.userUsdc + a.amount : s.userUsdc,
        // faucet to treasury simulated separately via topUp
        nextBlock: block + 1n,
      };
    }
    case "faucetEth": {
      return { ...s, userEth: s.userEth + a.amount, nextBlock: block + 1n };
    }
    case "swapEthForTokens": {
      if (a.ethAmount === 0n || !s.isKycd || s.userEth < a.ethAmount) return s;
      // ethAmount (18-dec wei) * priceUsd → USDC raw (6-dec)
      const usdcEquiv =
        (a.ethAmount * BigInt(s.ethPriceUsd) * ONE_USDC) / ONE_ETH;
      if (usdcEquiv < s.minSubscription) return s;
      const tokensOut = (usdcEquiv * USDC_TO_18 * 10n ** 18n) / s.nav;
      return {
        ...s,
        userEth: s.userEth - a.ethAmount,
        userTokens: s.userTokens + tokensOut,
        totalSupply: s.totalSupply + tokensOut,
        treasuryBalance: s.treasuryBalance + usdcEquiv,
        nextBlock: block + 1n,
        activity: [
          {
            kind: "subscribe",
            blockNumber: block,
            timestamp: now,
            subscriber: s.address!,
            usdcIn: usdcEquiv,
            tokensOut,
            navAtSubscription: s.nav,
            txHash: synthHash(Number(block)),
          },
          ...s.activity,
        ],
      };
    }
    case "swapTokensForEth": {
      if (a.tokenAmount === 0n || s.userTokens < a.tokenAmount) return s;
      let usdc18 = (a.tokenAmount * s.nav) / 10n ** 18n;
      if (s.discountBps > 0n) {
        usdc18 = (usdc18 * (BPS_DENOM - s.discountBps)) / BPS_DENOM;
      }
      const usdcOut = usdc18 / USDC_TO_18;
      if (s.treasuryBalance < usdcOut) return s;
      // Convert USDC → ETH at fixed price
      const ethOut = (usdcOut * ONE_ETH) / (BigInt(s.ethPriceUsd) * ONE_USDC);
      return {
        ...s,
        userTokens: s.userTokens - a.tokenAmount,
        totalSupply: s.totalSupply - a.tokenAmount,
        userEth: s.userEth + ethOut,
        treasuryBalance: s.treasuryBalance - usdcOut,
        nextBlock: block + 1n,
        activity: [
          {
            kind: "redeem",
            blockNumber: block,
            timestamp: now,
            redeemer: s.address!,
            tokensIn: a.tokenAmount,
            usdcOut,
            navAtRedemption: s.nav,
            discountBps: s.discountBps,
            txHash: synthHash(Number(block)),
          },
          ...s.activity,
        ],
      };
    }
    case "topUp": {
      return {
        ...s,
        treasuryBalance: s.treasuryBalance + a.amount,
        nextBlock: block + 1n,
      };
    }
    case "setKyc": {
      const isSelf =
        a.account.toLowerCase() === (s.address ?? "").toLowerCase();
      return {
        ...s,
        isKycd: isSelf ? a.kycd : s.isKycd,
        nextBlock: block + 1n,
        activity: [
          {
            kind: "kyc",
            blockNumber: block,
            timestamp: now,
            account: a.account,
            kycd: a.kycd,
            txHash: synthHash(Number(block)),
          },
          ...s.activity,
        ],
      };
    }
    case "approve": {
      return {
        ...s,
        allowance:
          BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          ),
        nextBlock: block + 1n,
      };
    }
    case "subscribe": {
      if (a.amount === 0n) return s;
      if (!s.isKycd) return s;
      if (a.amount < s.minSubscription) return s;
      if (s.userUsdc < a.amount) return s;
      const tokensOut = (a.amount * USDC_TO_18 * 10n ** 18n) / s.nav;
      return {
        ...s,
        userUsdc: s.userUsdc - a.amount,
        userTokens: s.userTokens + tokensOut,
        totalSupply: s.totalSupply + tokensOut,
        treasuryBalance: s.treasuryBalance + a.amount,
        allowance: s.allowance >= a.amount ? s.allowance - a.amount : 0n,
        nextBlock: block + 1n,
        activity: [
          {
            kind: "subscribe",
            blockNumber: block,
            timestamp: now,
            subscriber: s.address!,
            usdcIn: a.amount,
            tokensOut,
            navAtSubscription: s.nav,
            txHash: synthHash(Number(block)),
          },
          ...s.activity,
        ],
      };
    }
    case "redeem": {
      if (a.amount === 0n) return s;
      if (s.userTokens < a.amount) return s;
      let usdc18 = (a.amount * s.nav) / 10n ** 18n;
      if (s.discountBps > 0n) {
        usdc18 = (usdc18 * (BPS_DENOM - s.discountBps)) / BPS_DENOM;
      }
      const usdcOut = usdc18 / USDC_TO_18;
      if (s.treasuryBalance < usdcOut) return s;
      return {
        ...s,
        userTokens: s.userTokens - a.amount,
        totalSupply: s.totalSupply - a.amount,
        userUsdc: s.userUsdc + usdcOut,
        treasuryBalance: s.treasuryBalance - usdcOut,
        nextBlock: block + 1n,
        activity: [
          {
            kind: "redeem",
            blockNumber: block,
            timestamp: now,
            redeemer: s.address!,
            tokensIn: a.amount,
            usdcOut,
            navAtRedemption: s.nav,
            discountBps: s.discountBps,
            txHash: synthHash(Number(block)),
          },
          ...s.activity,
        ],
      };
    }
    case "setNav": {
      if (a.nav === 0n) return s;
      // sanity bound check (same as on-chain)
      const diff = a.nav > s.nav ? a.nav - s.nav : s.nav - a.nav;
      const maxDiff = (s.nav * MAX_NAV_UPDATE_BPS) / BPS_DENOM;
      if (diff > maxDiff) return s;
      return {
        ...s,
        nav: a.nav,
        lastUpdatedAt: now,
        nextBlock: block + 1n,
        activity: [
          {
            kind: "nav",
            blockNumber: block,
            timestamp: now,
            oldNav: s.nav,
            newNav: a.nav,
            txHash: synthHash(Number(block)),
          },
          ...s.activity,
        ],
      };
    }
    case "setDiscountBps": {
      if (a.bps > 2000n) return s;
      return { ...s, discountBps: a.bps, nextBlock: block + 1n };
    }
    case "quickStart": {
      const tenK = 10_000n * ONE_USDC;
      const fiveEth = 5n * ONE_ETH;
      return {
        ...s,
        userUsdc: s.userUsdc + tenK,
        userEth: s.userEth + fiveEth,
        isKycd: true,
        allowance: BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ),
        nextBlock: block + 1n,
        activity: [
          {
            kind: "kyc",
            blockNumber: block,
            timestamp: now,
            account: s.address!,
            kycd: true,
            txHash: synthHash(Number(block)),
          },
          ...s.activity,
        ],
      };
    }
    case "reset":
      return initialState();
  }
}

function synthHash(n: number): `0x${string}` {
  return `0x${n.toString(16).padStart(64, "0")}` as `0x${string}`;
}

export function SimulatedFundProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, undefined, initialState);

  const actions: FundActions = useMemo(
    () => ({
      faucet: (recipient, amount) =>
        dispatch({ type: "faucet", recipient, amount }),
      faucetEth: (amount) => dispatch({ type: "faucetEth", amount }),
      setKyc: (account, kycd) => dispatch({ type: "setKyc", account, kycd }),
      approveUsdc: () => dispatch({ type: "approve" }),
      subscribe: (amount) => dispatch({ type: "subscribe", amount }),
      redeem: (amount) => dispatch({ type: "redeem", amount }),
      swapEthForTokens: (ethAmount) =>
        dispatch({ type: "swapEthForTokens", ethAmount }),
      swapTokensForEth: (tokenAmount) =>
        dispatch({ type: "swapTokensForEth", tokenAmount }),
      setNav: (nav) => dispatch({ type: "setNav", nav }),
      setDiscountBps: (bps) => dispatch({ type: "setDiscountBps", bps }),
      topUpTreasury: (amount) => dispatch({ type: "topUp", amount }),
      resetSimulation: () => dispatch({ type: "reset" }),
      quickStart: () => dispatch({ type: "quickStart" }),
    }),
    []
  );

  const positionUsd = (s.userTokens * s.nav) / 10n ** 30n;

  const value: FundContextValue = useMemo(
    () => ({
      mode: "simulate",
      state: {
        address: s.address,
        isConnected: s.isConnected,
        isAdmin: s.isAdmin,
        nav: s.nav,
        lastUpdatedAt: s.lastUpdatedAt,
        totalSupply: s.totalSupply,
        treasuryBalance: s.treasuryBalance,
        discountBps: s.discountBps,
        minSubscription: s.minSubscription,
        userUsdc: s.userUsdc,
        userTokens: s.userTokens,
        userEth: s.userEth,
        ethPriceUsd: s.ethPriceUsd,
        isKycd: s.isKycd,
        allowance: s.allowance,
        positionUsd,
      },
      activity: s.activity,
      busy: false,
      error: null,
      actions,
    }),
    [s, positionUsd, actions]
  );

  return <FundContext.Provider value={value}>{children}</FundContext.Provider>;
}
