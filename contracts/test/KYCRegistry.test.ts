import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture } from "./helpers";

describe("KYCRegistry", () => {
  it("starts with all addresses unKYC'd", async () => {
    const { kycRegistry, alice } = await loadFixture(deployFixture);
    expect(await kycRegistry.isKycd(alice.address)).to.equal(false);
  });

  it("owner can add and remove addresses", async () => {
    const { kycRegistry, alice } = await loadFixture(deployFixture);

    await expect(kycRegistry.setKycStatus(alice.address, true))
      .to.emit(kycRegistry, "KycStatusChanged")
      .withArgs(alice.address, true);
    expect(await kycRegistry.isKycd(alice.address)).to.equal(true);

    await expect(kycRegistry.setKycStatus(alice.address, false))
      .to.emit(kycRegistry, "KycStatusChanged")
      .withArgs(alice.address, false);
    expect(await kycRegistry.isKycd(alice.address)).to.equal(false);
  });

  it("does not emit event when status is unchanged", async () => {
    const { kycRegistry, alice } = await loadFixture(deployFixture);
    await kycRegistry.setKycStatus(alice.address, true);
    await expect(kycRegistry.setKycStatus(alice.address, true)).to.not.emit(
      kycRegistry,
      "KycStatusChanged"
    );
  });

  it("non-owner cannot set KYC status", async () => {
    const { kycRegistry, alice, bob } = await loadFixture(deployFixture);
    await expect(
      kycRegistry.connect(alice).setKycStatus(bob.address, true)
    ).to.be.revertedWithCustomError(kycRegistry, "OwnableUnauthorizedAccount");
  });

  it("supports batch set", async () => {
    const { kycRegistry, alice, bob, charlie } = await loadFixture(deployFixture);
    await kycRegistry.setKycStatusBatch(
      [alice.address, bob.address, charlie.address],
      [true, true, false]
    );
    expect(await kycRegistry.isKycd(alice.address)).to.equal(true);
    expect(await kycRegistry.isKycd(bob.address)).to.equal(true);
    expect(await kycRegistry.isKycd(charlie.address)).to.equal(false);
  });

  it("reverts batch on length mismatch", async () => {
    const { kycRegistry, alice, bob } = await loadFixture(deployFixture);
    await expect(
      kycRegistry.setKycStatusBatch([alice.address, bob.address], [true])
    ).to.be.revertedWithCustomError(kycRegistry, "ArrayLengthMismatch");
  });
});
