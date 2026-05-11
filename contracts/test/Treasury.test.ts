import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture, usdc } from "./helpers";

describe("Treasury", () => {
  it("can receive USDC by direct transfer", async () => {
    const fix = await loadFixture(deployFixture);
    await fix.mockUSDC.faucet(fix.alice.address, usdc(100));
    await fix.mockUSDC.connect(fix.alice).transfer(await fix.treasury.getAddress(), usdc(100));
    expect(await fix.treasury.usdcBalance()).to.equal(usdc(100));
  });

  it("only authorized payers can pay out", async () => {
    const fix = await loadFixture(deployFixture);
    await fix.mockUSDC.faucet(await fix.treasury.getAddress(), usdc(100));

    await expect(fix.treasury.connect(fix.alice).pay(fix.alice.address, usdc(10)))
      .to.be.revertedWithCustomError(fix.treasury, "NotPayer");
  });

  it("owner can sweep tokens", async () => {
    const fix = await loadFixture(deployFixture);
    await fix.mockUSDC.faucet(await fix.treasury.getAddress(), usdc(100));

    await fix.treasury.sweep(
      await fix.mockUSDC.getAddress(),
      fix.alice.address,
      usdc(30)
    );

    expect(await fix.mockUSDC.balanceOf(fix.alice.address)).to.equal(usdc(30));
    expect(await fix.treasury.usdcBalance()).to.equal(usdc(70));
  });

  it("non-owner cannot sweep", async () => {
    const fix = await loadFixture(deployFixture);
    await expect(
      fix.treasury.connect(fix.alice).sweep(
        await fix.mockUSDC.getAddress(),
        fix.alice.address,
        usdc(1)
      )
    ).to.be.revertedWithCustomError(fix.treasury, "OwnableUnauthorizedAccount");
  });
});
