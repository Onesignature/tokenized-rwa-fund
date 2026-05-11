import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture, fundAndKyc, usdc, tokens, nav } from "./helpers";

describe("RedemptionManager", () => {
  it("Path A: redeems at NAV after Source Fund tops up the treasury", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));

    // NAV rises to 1.4
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.4"));

    // Source Fund sells underlying → treasury gets the realized proceeds
    await fix.mockUSDC.faucet(await fix.treasury.getAddress(), usdc(400));

    const before = await fix.mockUSDC.balanceOf(fix.alice.address);
    await fix.redemptionManager.connect(fix.alice).redeem(tokens(1000));
    const after = await fix.mockUSDC.balanceOf(fix.alice.address);

    expect(after - before).to.equal(usdc(1400));
    expect(await fix.token.balanceOf(fix.alice.address)).to.equal(0);
  });

  it("Path B: redeems at NAV minus discount", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));

    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.4"));
    await fix.mockUSDC.faucet(await fix.treasury.getAddress(), usdc(400));

    // Switch to Path B: 5% discount
    await fix.redemptionManager.setDiscountBps(500);

    const before = await fix.mockUSDC.balanceOf(fix.alice.address);
    await fix.redemptionManager.connect(fix.alice).redeem(tokens(1000));
    const after = await fix.mockUSDC.balanceOf(fix.alice.address);

    // 1000 * 1.4 * (1 - 0.05) = 1330
    expect(after - before).to.equal(usdc(1330));
  });

  it("preview matches actual redemption", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));
    await fix.redemptionManager.setDiscountBps(500);

    const preview = await fix.redemptionManager.previewRedeem(tokens(500));
    const before = await fix.mockUSDC.balanceOf(fix.alice.address);
    await fix.redemptionManager.connect(fix.alice).redeem(tokens(500));
    const after = await fix.mockUSDC.balanceOf(fix.alice.address);

    expect(after - before).to.equal(preview);
  });

  it("does not require KYC to redeem (lapsed-KYC exit)", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));

    // Lapse Alice's KYC
    await fix.kycRegistry.setKycStatus(fix.alice.address, false);

    // Redeem should still work
    await expect(fix.redemptionManager.connect(fix.alice).redeem(tokens(1000)))
      .to.not.be.reverted;
  });

  it("reverts when paused", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));
    await fix.redemptionManager.setPaused(true);
    await expect(fix.redemptionManager.connect(fix.alice).redeem(tokens(1000)))
      .to.be.revertedWithCustomError(fix.redemptionManager, "Paused");
  });

  it("rejects discount above the safety cap", async () => {
    const fix = await loadFixture(deployFixture);
    await expect(fix.redemptionManager.setDiscountBps(2001))
      .to.be.revertedWithCustomError(fix.redemptionManager, "DiscountTooHigh");
  });
});
