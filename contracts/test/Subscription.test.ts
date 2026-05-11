import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture, fundAndKyc, usdc, tokens, nav } from "./helpers";

describe("SubscriptionManager", () => {
  it("mints tokens at NAV = 1.0 (1 USDC -> 1 token)", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));

    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));

    expect(await fix.token.balanceOf(fix.alice.address)).to.equal(tokens(1000));
    expect(await fix.mockUSDC.balanceOf(await fix.treasury.getAddress())).to.equal(usdc(1000));
  });

  it("mints proportionally fewer tokens at higher NAV", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1750));

    // Bump NAV to 1.75
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.15"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.32"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.52"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.75"));

    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1750));

    // $1750 / $1.75 = 1000 tokens
    expect(await fix.token.balanceOf(fix.alice.address)).to.equal(tokens(1000));
  });

  it("reverts if subscriber is not KYC'd", async () => {
    const fix = await loadFixture(deployFixture);
    await fix.mockUSDC.faucet(fix.alice.address, usdc(1000));
    await fix.mockUSDC
      .connect(fix.alice)
      .approve(await fix.subscriptionManager.getAddress(), usdc(1000));

    await expect(fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000)))
      .to.be.revertedWithCustomError(fix.subscriptionManager, "NotKycd");
  });

  it("reverts if below minimum subscription", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    // min is 100 USDC
    await expect(fix.subscriptionManager.connect(fix.alice).subscribe(usdc(50)))
      .to.be.revertedWithCustomError(fix.subscriptionManager, "BelowMinSubscription");
  });

  it("reverts when paused", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fix.subscriptionManager.setPaused(true);
    await expect(fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000)))
      .to.be.revertedWithCustomError(fix.subscriptionManager, "Paused");
  });

  it("emits Subscribed event with the NAV captured at subscription", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await expect(fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000)))
      .to.emit(fix.subscriptionManager, "Subscribed")
      .withArgs(fix.alice.address, usdc(1000), tokens(1000), nav(1));
  });

  it("preview matches actual mint", async () => {
    const fix = await loadFixture(deployFixture);
    await fundAndKyc(fix, fix.alice, usdc(1000));
    const preview = await fix.subscriptionManager.previewSubscribe(usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));
    expect(await fix.token.balanceOf(fix.alice.address)).to.equal(preview);
  });
});
