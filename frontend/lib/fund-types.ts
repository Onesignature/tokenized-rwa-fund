export type Activity =
  | {
      kind: "nav";
      blockNumber: bigint;
      timestamp: bigint;
      oldNav: bigint;
      newNav: bigint;
      txHash: `0x${string}`;
    }
  | {
      kind: "subscribe";
      blockNumber: bigint;
      timestamp: bigint;
      subscriber: `0x${string}`;
      usdcIn: bigint;
      tokensOut: bigint;
      navAtSubscription: bigint;
      txHash: `0x${string}`;
    }
  | {
      kind: "redeem";
      blockNumber: bigint;
      timestamp: bigint;
      redeemer: `0x${string}`;
      tokensIn: bigint;
      usdcOut: bigint;
      navAtRedemption: bigint;
      discountBps: bigint;
      txHash: `0x${string}`;
    }
  | {
      kind: "kyc";
      blockNumber: bigint;
      timestamp: bigint;
      account: `0x${string}`;
      kycd: boolean;
      txHash: `0x${string}`;
    };

export type FundState = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isAdmin: boolean;
  nav: bigint;
  lastUpdatedAt: bigint;
  totalSupply: bigint;
  treasuryBalance: bigint;
  discountBps: bigint;
  minSubscription: bigint;
  userUsdc: bigint;
  userTokens: bigint;
  isKycd: boolean;
  allowance: bigint;
  positionUsd: bigint;
};

export type FundActions = {
  faucet: (recipient: `0x${string}`, amount: bigint) => void | Promise<void>;
  setKyc: (account: `0x${string}`, kycd: boolean) => void | Promise<void>;
  approveUsdc: () => void | Promise<void>;
  subscribe: (amount: bigint) => void | Promise<void>;
  redeem: (amount: bigint) => void | Promise<void>;
  setNav: (nav: bigint) => void | Promise<void>;
  setDiscountBps: (bps: bigint) => void | Promise<void>;
  topUpTreasury: (amount: bigint) => void | Promise<void>;
  // simulation-only conveniences
  resetSimulation?: () => void;
  quickStart?: () => void;
  openConnectModal?: () => void;
};

export type FundContextValue = {
  mode: "live" | "simulate";
  state: FundState;
  activity: Activity[];
  busy: boolean;
  error: string | null;
  actions: FundActions;
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
export const SIM_ADDRESS = "0x51Mu1a710000000000000000000000000000B11A" as `0x${string}`;
