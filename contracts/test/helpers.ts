import { ethers } from "hardhat";
import type { Signer } from "ethers";

export const ONE_USDC = 1_000_000n; // 1 USDC = 1e6 raw units
export const ONE_TOKEN = 10n ** 18n;
export const NAV_SCALE = 10n ** 18n;

export function usdc(amount: string | number): bigint {
  const [whole, frac = ""] = String(amount).split(".");
  const padded = (frac + "000000").slice(0, 6);
  return BigInt(whole) * ONE_USDC + BigInt(padded || "0");
}

export function tokens(amount: string | number): bigint {
  const [whole, frac = ""] = String(amount).split(".");
  const padded = (frac + "000000000000000000").slice(0, 18);
  return BigInt(whole) * ONE_TOKEN + BigInt(padded || "0");
}

/// NAV is scaled to 18 decimals. A NAV of 1.75 → 1.75e18.
export function nav(amount: string | number): bigint {
  return tokens(amount);
}

export async function deployFixture() {
  const [deployer, alice, bob, charlie, navUpdater, kycOperator] = await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();

  const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
  const kycRegistry = await KYCRegistry.deploy(deployer.address);
  await kycRegistry.waitForDeployment();

  const NAVOracle = await ethers.getContractFactory("NAVOracle");
  const oracle = await NAVOracle.deploy(deployer.address, navUpdater.address, nav(1));
  await oracle.waitForDeployment();

  const FeederFundToken = await ethers.getContractFactory("FeederFundToken");
  const token = await FeederFundToken.deploy(
    "Feeder Fund Token",
    "FFT",
    deployer.address,
    await kycRegistry.getAddress()
  );
  await token.waitForDeployment();

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(deployer.address, await mockUSDC.getAddress());
  await treasury.waitForDeployment();

  const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(
    deployer.address,
    await mockUSDC.getAddress(),
    await token.getAddress(),
    await oracle.getAddress(),
    await kycRegistry.getAddress(),
    await treasury.getAddress(),
    usdc(100) // minimum subscription: 100 USDC
  );
  await subscriptionManager.waitForDeployment();

  const RedemptionManager = await ethers.getContractFactory("RedemptionManager");
  const redemptionManager = await RedemptionManager.deploy(
    deployer.address,
    await mockUSDC.getAddress(),
    await token.getAddress(),
    await oracle.getAddress(),
    await treasury.getAddress(),
    0 // start with Path A (no discount)
  );
  await redemptionManager.waitForDeployment();

  // Wire authorizations
  await token.setMinter(await subscriptionManager.getAddress(), true);
  await token.setMinter(await redemptionManager.getAddress(), true);
  await treasury.setPayer(await redemptionManager.getAddress(), true);

  return {
    deployer,
    alice,
    bob,
    charlie,
    navUpdater,
    kycOperator,
    mockUSDC,
    kycRegistry,
    oracle,
    token,
    treasury,
    subscriptionManager,
    redemptionManager,
  };
}

export async function fundAndKyc(
  fixture: Awaited<ReturnType<typeof deployFixture>>,
  who: Signer,
  amount: bigint
) {
  const addr = await who.getAddress();
  await fixture.mockUSDC.faucet(addr, amount);
  await fixture.kycRegistry.setKycStatus(addr, true);
  await fixture.mockUSDC.connect(who).approve(
    await fixture.subscriptionManager.getAddress(),
    amount
  );
}
