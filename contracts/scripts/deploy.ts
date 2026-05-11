import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ONE_USDC = 10n ** 6n;
const ONE_TOKEN = 10n ** 18n;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeploying to network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ─── 1. MockUSDC ───────────────────────────────────────────────────────────
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log(`  MockUSDC:           ${await usdc.getAddress()}`);

  // ─── 2. KYCRegistry ────────────────────────────────────────────────────────
  console.log("Deploying KYCRegistry...");
  const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
  const kycRegistry = await KYCRegistry.deploy(deployer.address);
  await kycRegistry.waitForDeployment();
  console.log(`  KYCRegistry:        ${await kycRegistry.getAddress()}`);

  // ─── 3. NAVOracle ──────────────────────────────────────────────────────────
  // Initial NAV = $1.00 with 18 decimals.
  console.log("Deploying NAVOracle (initial NAV = $1.00)...");
  const NAVOracle = await ethers.getContractFactory("NAVOracle");
  const oracle = await NAVOracle.deploy(deployer.address, deployer.address, ONE_TOKEN);
  await oracle.waitForDeployment();
  console.log(`  NAVOracle:          ${await oracle.getAddress()}`);

  // ─── 4. FeederFundToken ────────────────────────────────────────────────────
  console.log("Deploying FeederFundToken...");
  const FeederFundToken = await ethers.getContractFactory("FeederFundToken");
  const token = await FeederFundToken.deploy(
    "Tokenized Feeder Fund",
    "TFF",
    deployer.address,
    await kycRegistry.getAddress()
  );
  await token.waitForDeployment();
  console.log(`  FeederFundToken:    ${await token.getAddress()}`);

  // ─── 5. Treasury ───────────────────────────────────────────────────────────
  console.log("Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(deployer.address, await usdc.getAddress());
  await treasury.waitForDeployment();
  console.log(`  Treasury:           ${await treasury.getAddress()}`);

  // ─── 6. SubscriptionManager ────────────────────────────────────────────────
  console.log("Deploying SubscriptionManager (min subscription = $100)...");
  const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(
    deployer.address,
    await usdc.getAddress(),
    await token.getAddress(),
    await oracle.getAddress(),
    await kycRegistry.getAddress(),
    await treasury.getAddress(),
    100n * ONE_USDC
  );
  await subscriptionManager.waitForDeployment();
  console.log(`  SubscriptionManager: ${await subscriptionManager.getAddress()}`);

  // ─── 7. RedemptionManager ──────────────────────────────────────────────────
  console.log("Deploying RedemptionManager (initial discount = 0 / Path A)...");
  const RedemptionManager = await ethers.getContractFactory("RedemptionManager");
  const redemptionManager = await RedemptionManager.deploy(
    deployer.address,
    await usdc.getAddress(),
    await token.getAddress(),
    await oracle.getAddress(),
    await treasury.getAddress(),
    0
  );
  await redemptionManager.waitForDeployment();
  console.log(`  RedemptionManager:  ${await redemptionManager.getAddress()}`);

  // ─── Wire authorizations ───────────────────────────────────────────────────
  console.log("\nWiring authorizations...");
  await (await token.setMinter(await subscriptionManager.getAddress(), true)).wait();
  console.log("  ✓ SubscriptionManager authorized as token minter");
  await (await token.setMinter(await redemptionManager.getAddress(), true)).wait();
  console.log("  ✓ RedemptionManager authorized as token minter (for burnFrom)");
  await (await treasury.setPayer(await redemptionManager.getAddress(), true)).wait();
  console.log("  ✓ RedemptionManager authorized as treasury payer");

  // ─── Persist addresses for the frontend ────────────────────────────────────
  const deployment = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      MockUSDC: await usdc.getAddress(),
      KYCRegistry: await kycRegistry.getAddress(),
      NAVOracle: await oracle.getAddress(),
      FeederFundToken: await token.getAddress(),
      Treasury: await treasury.getAddress(),
      SubscriptionManager: await subscriptionManager.getAddress(),
      RedemptionManager: await redemptionManager.getAddress(),
    },
  };

  const outDir = path.resolve(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log(`\nAddresses written to: ${outFile}`);

  // Also write a copy into the Next.js app's lib/ so the UI picks it up without a manual step.
  const frontendLibDir = path.resolve(__dirname, "..", "..", "lib");
  if (fs.existsSync(frontendLibDir)) {
    fs.writeFileSync(path.join(frontendLibDir, "deployment.json"), JSON.stringify(deployment, null, 2));
    console.log(`Addresses written to: ${path.join(frontendLibDir, "deployment.json")}`);
  }

  console.log("\n✓ Deployment complete.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
