import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture, fundAndKyc, usdc, tokens, nav } from "./helpers";

/**
 * Full lifecycle integration tests.
 *
 * Walks through the four stages described in docs/04-token-lifecycle.md:
 *   Stage 1: Launch — investors subscribe at NAV = $1.00
 *   Stage 2: NAV rises quarterly to $1.75 (year 1)
 *   Stage 3: Exit at $4.00 NAV via Path A or Path B
 */
describe("Full lifecycle", () => {
  it("Path A: subscribe at $1, NAV rises, exit at NAV (4x return)", async () => {
    const fix = await loadFixture(deployFixture);

    // ── Stage 1: Launch ──
    // Three investors subscribe with $1000 each at NAV = $1.00
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fundAndKyc(fix, fix.bob, usdc(1000));
    await fundAndKyc(fix, fix.charlie, usdc(1000));

    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));
    await fix.subscriptionManager.connect(fix.bob).subscribe(usdc(1000));
    await fix.subscriptionManager.connect(fix.charlie).subscribe(usdc(1000));

    expect(await fix.token.totalSupply()).to.equal(tokens(3000));
    expect(await fix.mockUSDC.balanceOf(await fix.treasury.getAddress())).to.equal(usdc(3000));

    // ── Stage 2: NAV rises over time ──
    // Year 1: +15% per quarter → $1.75
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.15"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.32"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.52"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("1.75"));
    // Year 2: continue upward toward $4.00 (step-wise within sanity bound)
    await fix.oracle.connect(fix.navUpdater).setNav(nav("2.0"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("2.5"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("3.0"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("3.5"));
    await fix.oracle.connect(fix.navUpdater).setNav(nav("4.0"));

    // ── Stage 3 Path A: Source Fund sells, treasury settles at realized value ──
    // Treasury currently has $3000. Position should settle at $4000 (3000 tokens × $4 - $3000 initial = $9000 more needed... wait)
    // Actually: 3000 tokens × $4 = $12,000 needed total. Treasury has $3,000. Add $9,000.
    await fix.mockUSDC.faucet(await fix.treasury.getAddress(), usdc(9000));

    // All three investors redeem
    const aliceBefore = await fix.mockUSDC.balanceOf(fix.alice.address);
    await fix.redemptionManager.connect(fix.alice).redeem(tokens(1000));
    const aliceAfter = await fix.mockUSDC.balanceOf(fix.alice.address);
    expect(aliceAfter - aliceBefore).to.equal(usdc(4000)); // 4x

    await fix.redemptionManager.connect(fix.bob).redeem(tokens(1000));
    await fix.redemptionManager.connect(fix.charlie).redeem(tokens(1000));

    // All tokens burned, treasury drained to zero
    expect(await fix.token.totalSupply()).to.equal(0);
    expect(await fix.treasury.usdcBalance()).to.equal(0);
  });

  it("Path B: fresh raise funds the treasury, tokens redeem at 5% discount to NAV", async () => {
    const fix = await loadFixture(deployFixture);

    // ── Stage 1 ── Three investors at NAV = $1.00
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fundAndKyc(fix, fix.bob, usdc(1000));
    await fundAndKyc(fix, fix.charlie, usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));
    await fix.subscriptionManager.connect(fix.bob).subscribe(usdc(1000));
    await fix.subscriptionManager.connect(fix.charlie).subscribe(usdc(1000));

    // ── Stage 2 ── NAV climbs to $4.00
    for (const v of ["1.15", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0"]) {
      await fix.oracle.connect(fix.navUpdater).setNav(nav(v));
    }

    // ── Stage 3 Path B ── Source Fund keeps the underlying; fresh institutional
    // capital flows into the Source Fund and a share of it funds the buyback.
    // The buyback funds appear in the treasury as new USDC.
    // 3000 tokens × $4 × 0.95 = $11,400 needed total. Treasury has $3,000. Add $8,400.
    await fix.mockUSDC.faucet(await fix.treasury.getAddress(), usdc(8400));

    // Switch to Path B with 5% discount
    await fix.redemptionManager.setDiscountBps(500);

    const aliceBefore = await fix.mockUSDC.balanceOf(fix.alice.address);
    await fix.redemptionManager.connect(fix.alice).redeem(tokens(1000));
    const aliceAfter = await fix.mockUSDC.balanceOf(fix.alice.address);
    expect(aliceAfter - aliceBefore).to.equal(usdc(3800)); // 4 * 0.95 = 3.80 per token

    await fix.redemptionManager.connect(fix.bob).redeem(tokens(1000));
    await fix.redemptionManager.connect(fix.charlie).redeem(tokens(1000));

    expect(await fix.token.totalSupply()).to.equal(0);
  });

  it("Mid-cycle entry: investor buying at higher NAV gets fewer tokens but same per-token returns", async () => {
    const fix = await loadFixture(deployFixture);

    // Early investor subscribes at $1.00
    await fundAndKyc(fix, fix.alice, usdc(1000));
    await fix.subscriptionManager.connect(fix.alice).subscribe(usdc(1000));
    // Alice has 1000 tokens

    // NAV rises to $1.75
    for (const v of ["1.15", "1.32", "1.52", "1.75"]) {
      await fix.oracle.connect(fix.navUpdater).setNav(nav(v));
    }

    // Late investor subscribes at $1.75 with the same $1000
    await fundAndKyc(fix, fix.bob, usdc(1000));
    await fix.subscriptionManager.connect(fix.bob).subscribe(usdc(1000));
    // Bob has 1000/1.75 ≈ 571.428... tokens
    const bobTokens = await fix.token.balanceOf(fix.bob.address);
    // 1000 USDC * 1e30 / 1.75e18 = 571428571428571428571 (≈ 571.428 tokens)
    expect(bobTokens).to.equal((usdc(1000) * 10n ** 30n) / nav("1.75"));

    // NAV reaches exit at $4.00
    for (const v of ["2.0", "2.5", "3.0", "3.5", "4.0"]) {
      await fix.oracle.connect(fix.navUpdater).setNav(nav(v));
    }

    // Treasury settled by Source Fund: tokens outstanding × $4
    const totalSupply = await fix.token.totalSupply();
    const totalNeeded = (totalSupply * nav("4.0")) / 10n ** 18n / 10n ** 12n;
    const currentTreasury = await fix.treasury.usdcBalance();
    await fix.mockUSDC.faucet(await fix.treasury.getAddress(), totalNeeded - currentTreasury);

    // Both redeem
    const aliceUsdcBefore = await fix.mockUSDC.balanceOf(fix.alice.address);
    const bobUsdcBefore = await fix.mockUSDC.balanceOf(fix.bob.address);
    await fix.redemptionManager.connect(fix.alice).redeem(tokens(1000));
    await fix.redemptionManager.connect(fix.bob).redeem(bobTokens);

    const aliceGain = (await fix.mockUSDC.balanceOf(fix.alice.address)) - aliceUsdcBefore;
    const bobGain = (await fix.mockUSDC.balanceOf(fix.bob.address)) - bobUsdcBefore;

    // Alice: 1000 tokens × $4 = $4000 (4x on $1000)
    expect(aliceGain).to.equal(usdc(4000));
    // Bob: 571.428 tokens × $4 ≈ $2285.71 (2.29x on $1000)
    // Approximate due to integer division at mint time
    expect(bobGain).to.be.closeTo(usdc(2285.71), usdc("0.01"));
  });
});
