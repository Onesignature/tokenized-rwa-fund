/**
 * demo-cycle.ts
 *
 * Walks through the full lifecycle on a local Hardhat node so you can see
 * subscriptions, NAV updates, and redemptions happen in real time.
 *
 * Usage:
 *   # Terminal 1: npm run node
 *   # Terminal 2: npm run deploy:local
 *   # Terminal 3: npx hardhat run scripts/demo-cycle.ts --network localhost
 */

import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ONE_USDC = 10n ** 6n;
const ONE_TOKEN = 10n ** 18n;

async function main() {
  const deployment = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "..", "deployments", `${network.name}.json`),
      "utf-8"
    )
  );

  const [deployer, alice, bob] = await ethers.getSigners();

  const usdc = await ethers.getContractAt("MockUSDC", deployment.contracts.MockUSDC);
  const kycRegistry = await ethers.getContractAt("KYCRegistry", deployment.contracts.KYCRegistry);
  const oracle = await ethers.getContractAt("NAVOracle", deployment.contracts.NAVOracle);
  const token = await ethers.getContractAt("FeederFundToken", deployment.contracts.FeederFundToken);
  const treasury = await ethers.getContractAt("Treasury", deployment.contracts.Treasury);
  const subscription = await ethers.getContractAt(
    "SubscriptionManager",
    deployment.contracts.SubscriptionManager
  );
  const redemption = await ethers.getContractAt(
    "RedemptionManager",
    deployment.contracts.RedemptionManager
  );

  console.log("\n=== DEMO CYCLE ===\n");

  console.log("Stage 0: KYC + faucet for two investors");
  await kycRegistry.setKycStatus(alice.address, true);
  await kycRegistry.setKycStatus(bob.address, true);
  await usdc.faucet(alice.address, 10_000n * ONE_USDC);
  await usdc.faucet(bob.address, 10_000n * ONE_USDC);
  await usdc.connect(alice).approve(await subscription.getAddress(), ethers.MaxUint256);
  await usdc.connect(bob).approve(await subscription.getAddress(), ethers.MaxUint256);

  console.log("\nStage 1: Alice subscribes $1,000 at NAV = $1.00");
  await subscription.connect(alice).subscribe(1_000n * ONE_USDC);
  console.log(`  alice has ${fmt(await token.balanceOf(alice.address), 18)} tokens`);

  console.log("\nStage 2: NAV rises quarterly to $1.75");
  for (const v of ["1.15", "1.32", "1.52", "1.75"]) {
    await oracle.setNav(parseUnits(v, 18));
    console.log(`  NAV updated to $${v} — alice position now $${(Number(v) * 1000).toFixed(2)}`);
  }

  console.log("\nStage 2b: Bob subscribes $1,750 at NAV = $1.75 (gets 1,000 tokens)");
  await subscription.connect(bob).subscribe(1_750n * ONE_USDC);
  console.log(`  bob has ${fmt(await token.balanceOf(bob.address), 18)} tokens`);

  console.log("\nStage 2c: NAV climbs to $4.00 (exit price)");
  for (const v of ["2.0", "2.5", "3.0", "3.5", "4.0"]) {
    await oracle.setNav(parseUnits(v, 18));
  }
  console.log(`  Final NAV: $4.00`);
  console.log(`  alice position: $${(Number(4) * 1000).toFixed(2)}  (started at $1,000)`);
  console.log(`  bob position:   $${(Number(4) * 1000).toFixed(2)}  (started at $1,750)`);

  console.log("\nStage 3 (Path A): Source Fund sells, treasury topped up, investors redeem at NAV");
  const totalSupply = await token.totalSupply();
  const needed = (totalSupply * parseUnits("4.0", 18)) / ONE_TOKEN / 10n ** 12n;
  const currentBalance = await treasury.usdcBalance();
  await usdc.faucet(await treasury.getAddress(), needed - currentBalance);
  console.log(`  treasury topped up to $${fmt(await treasury.usdcBalance(), 6)}`);

  const aliceBefore = await usdc.balanceOf(alice.address);
  await redemption.connect(alice).redeem(await token.balanceOf(alice.address));
  const aliceAfter = await usdc.balanceOf(alice.address);
  console.log(`  alice redeemed → +$${fmt(aliceAfter - aliceBefore, 6)} USDC`);

  const bobBefore = await usdc.balanceOf(bob.address);
  await redemption.connect(bob).redeem(await token.balanceOf(bob.address));
  const bobAfter = await usdc.balanceOf(bob.address);
  console.log(`  bob redeemed   → +$${fmt(bobAfter - bobBefore, 6)} USDC`);

  console.log("\n=== Cycle complete ===");
  console.log(`Total supply remaining: ${await token.totalSupply()}`);
  console.log(`Treasury balance remaining: $${fmt(await treasury.usdcBalance(), 6)}\n`);
}

function fmt(value: bigint, decimals: number): string {
  const div = 10n ** BigInt(decimals);
  const whole = value / div;
  const frac = (value % div).toString().padStart(decimals, "0").slice(0, 4);
  return `${whole.toString()}.${frac}`;
}

function parseUnits(value: string, decimals: number): bigint {
  const [whole, frac = ""] = value.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
