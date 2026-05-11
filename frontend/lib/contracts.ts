import deployment from "./deployment.json";

export const contracts = deployment.contracts as {
  MockUSDC: `0x${string}`;
  KYCRegistry: `0x${string}`;
  NAVOracle: `0x${string}`;
  FeederFundToken: `0x${string}`;
  Treasury: `0x${string}`;
  SubscriptionManager: `0x${string}`;
  RedemptionManager: `0x${string}`;
};

export const networkInfo = {
  network: deployment.network,
  chainId: deployment.chainId,
};
