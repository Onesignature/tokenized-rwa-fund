/**
 * Minimal ABIs for the contracts the frontend interacts with.
 * Only includes the functions / events actually used in the UI.
 */

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export const mockUsdcAbi = [
  ...erc20Abi,
  { type: "function", name: "faucet", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
] as const;

export const kycRegistryAbi = [
  { type: "function", name: "isKycd", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "setKycStatus", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }, { name: "kycd", type: "bool" }], outputs: [] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "event",
    name: "KycStatusChanged",
    inputs: [
      { name: "account", type: "address", indexed: true },
      { name: "kycd", type: "bool", indexed: false },
    ],
  },
] as const;

export const navOracleAbi = [
  { type: "function", name: "getNav", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "setNav", stateMutability: "nonpayable", inputs: [{ name: "newNav", type: "uint256" }], outputs: [] },
  { type: "function", name: "updater", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "lastUpdatedAt", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "event",
    name: "NavUpdated",
    inputs: [
      { name: "oldNav", type: "uint256", indexed: false },
      { name: "newNav", type: "uint256", indexed: false },
      { name: "updater", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export const subscriptionManagerAbi = [
  { type: "function", name: "subscribe", stateMutability: "nonpayable", inputs: [{ name: "usdcAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "previewSubscribe", stateMutability: "view", inputs: [{ name: "usdcAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "minSubscription", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  {
    type: "event",
    name: "Subscribed",
    inputs: [
      { name: "subscriber", type: "address", indexed: true },
      { name: "usdcIn", type: "uint256", indexed: false },
      { name: "tokensOut", type: "uint256", indexed: false },
      { name: "navAtSubscription", type: "uint256", indexed: false },
    ],
  },
] as const;

export const redemptionManagerAbi = [
  { type: "function", name: "redeem", stateMutability: "nonpayable", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "previewRedeem", stateMutability: "view", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "discountBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "setDiscountBps", stateMutability: "nonpayable", inputs: [{ name: "newBps", type: "uint256" }], outputs: [] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "event",
    name: "Redeemed",
    inputs: [
      { name: "redeemer", type: "address", indexed: true },
      { name: "tokensIn", type: "uint256", indexed: false },
      { name: "usdcOut", type: "uint256", indexed: false },
      { name: "navAtRedemption", type: "uint256", indexed: false },
      { name: "discountBpsAtRedemption", type: "uint256", indexed: false },
    ],
  },
] as const;

export const treasuryAbi = [
  { type: "function", name: "usdcBalance", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;
