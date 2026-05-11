import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture, nav } from "./helpers";

describe("NAVOracle", () => {
  it("initializes with the given NAV", async () => {
    const { oracle } = await loadFixture(deployFixture);
    expect(await oracle.getNav()).to.equal(nav(1));
  });

  it("only the updater can call setNav", async () => {
    const { oracle, alice } = await loadFixture(deployFixture);
    await expect(oracle.connect(alice).setNav(nav("1.05")))
      .to.be.revertedWithCustomError(oracle, "NotUpdater");
  });

  it("accepts updates within the sanity bound", async () => {
    const { oracle, navUpdater } = await loadFixture(deployFixture);
    // +15% from 1.0 → 1.15 — well within ±50% bound
    await expect(oracle.connect(navUpdater).setNav(nav("1.15")))
      .to.emit(oracle, "NavUpdated");
    expect(await oracle.getNav()).to.equal(nav("1.15"));
  });

  it("rejects updates exceeding the sanity bound (up)", async () => {
    const { oracle, navUpdater } = await loadFixture(deployFixture);
    // +51% from 1.0 → 1.51
    await expect(oracle.connect(navUpdater).setNav(nav("1.51")))
      .to.be.revertedWithCustomError(oracle, "UpdateExceedsSanityBound");
  });

  it("rejects updates exceeding the sanity bound (down)", async () => {
    const { oracle, navUpdater } = await loadFixture(deployFixture);
    // -51% from 1.0 → 0.49
    await expect(oracle.connect(navUpdater).setNav(nav("0.49")))
      .to.be.revertedWithCustomError(oracle, "UpdateExceedsSanityBound");
  });

  it("rejects zero NAV", async () => {
    const { oracle, navUpdater } = await loadFixture(deployFixture);
    await expect(oracle.connect(navUpdater).setNav(0))
      .to.be.revertedWithCustomError(oracle, "InvalidNav");
  });

  it("compounded updates can grow past the per-update bound over time", async () => {
    const { oracle, navUpdater } = await loadFixture(deployFixture);
    // Four +15% quarterly updates → ~1.75
    await oracle.connect(navUpdater).setNav(nav("1.15"));
    await oracle.connect(navUpdater).setNav(nav("1.32"));
    await oracle.connect(navUpdater).setNav(nav("1.52"));
    await oracle.connect(navUpdater).setNav(nav("1.75"));
    expect(await oracle.getNav()).to.equal(nav("1.75"));
  });

  it("owner can rotate the updater", async () => {
    const { oracle, deployer, alice, navUpdater } = await loadFixture(deployFixture);
    await expect(oracle.setUpdater(alice.address))
      .to.emit(oracle, "UpdaterChanged")
      .withArgs(navUpdater.address, alice.address);
    await oracle.connect(alice).setNav(nav("1.1"));
    expect(await oracle.getNav()).to.equal(nav("1.1"));
  });
});
