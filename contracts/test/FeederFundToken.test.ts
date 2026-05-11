import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture, tokens } from "./helpers";

describe("FeederFundToken", () => {
  it("has 18 decimals and the expected name/symbol", async () => {
    const { token } = await loadFixture(deployFixture);
    expect(await token.decimals()).to.equal(18);
    expect(await token.name()).to.equal("Feeder Fund Token");
    expect(await token.symbol()).to.equal("FFT");
  });

  it("only authorized minters can mint", async () => {
    const { token, alice } = await loadFixture(deployFixture);
    await expect(token.mint(alice.address, tokens(1)))
      .to.be.revertedWithCustomError(token, "NotMinter");
  });

  it("only authorized minters can burn", async () => {
    const { token, alice } = await loadFixture(deployFixture);
    await expect(token.burnFrom(alice.address, tokens(1)))
      .to.be.revertedWithCustomError(token, "NotMinter");
  });

  it("blocks transfers to non-KYC'd addresses", async () => {
    const { token, kycRegistry, subscriptionManager, alice, bob, deployer } = await loadFixture(
      deployFixture
    );
    // Give deployer mint rights for this test
    await token.setMinter(deployer.address, true);
    await kycRegistry.setKycStatus(alice.address, true);
    await token.mint(alice.address, tokens(10));

    // bob is not KYC'd → transfer to bob should revert
    await expect(token.connect(alice).transfer(bob.address, tokens(1)))
      .to.be.revertedWithCustomError(token, "ReceiverNotKycd")
      .withArgs(bob.address);
  });

  it("allows transfers between KYC'd addresses", async () => {
    const { token, kycRegistry, alice, bob, deployer } = await loadFixture(deployFixture);
    await token.setMinter(deployer.address, true);
    await kycRegistry.setKycStatusBatch([alice.address, bob.address], [true, true]);
    await token.mint(alice.address, tokens(10));

    await token.connect(alice).transfer(bob.address, tokens(3));
    expect(await token.balanceOf(bob.address)).to.equal(tokens(3));
    expect(await token.balanceOf(alice.address)).to.equal(tokens(7));
  });

  it("blocks transfers from sender whose KYC was revoked", async () => {
    const { token, kycRegistry, alice, bob, deployer } = await loadFixture(deployFixture);
    await token.setMinter(deployer.address, true);
    await kycRegistry.setKycStatusBatch([alice.address, bob.address], [true, true]);
    await token.mint(alice.address, tokens(10));

    // Revoke alice's KYC
    await kycRegistry.setKycStatus(alice.address, false);

    await expect(token.connect(alice).transfer(bob.address, tokens(1)))
      .to.be.revertedWithCustomError(token, "SenderNotKycd")
      .withArgs(alice.address);
  });

  it("allows burning even when KYC has lapsed (exit path)", async () => {
    const { token, kycRegistry, alice, deployer } = await loadFixture(deployFixture);
    await token.setMinter(deployer.address, true);
    await kycRegistry.setKycStatus(alice.address, true);
    await token.mint(alice.address, tokens(10));

    // Revoke alice's KYC after issuance
    await kycRegistry.setKycStatus(alice.address, false);

    // Burn should still succeed (lapsed-KYC investor can still exit)
    await expect(token.burnFrom(alice.address, tokens(10))).to.not.be.reverted;
    expect(await token.balanceOf(alice.address)).to.equal(0);
  });

  it("blocks minting to non-KYC'd receiver", async () => {
    const { token, alice, deployer } = await loadFixture(deployFixture);
    await token.setMinter(deployer.address, true);
    await expect(token.mint(alice.address, tokens(1)))
      .to.be.revertedWithCustomError(token, "ReceiverNotKycd")
      .withArgs(alice.address);
  });
});
