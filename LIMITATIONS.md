# Limitations

This MVP demonstrates the structural mechanics of a tokenized feeder fund end-to-end. It is **not** production-ready. This document is the honest list of what is and isn't handled, so prospective operators, investors, and counterparties see the gaps upfront rather than as a surprise.

The framing: every component below has a well-understood production solution. None of these limitations require inventing new technology; they require operational and engineering work that intentionally sits outside the scope of an MVP.

---

## 1. Price-mismatch handling — what's covered

The protocol enforces correctness at three layers where the token price could diverge from the underlying fund's NAV:

### Source Fund NAV vs implied mark-to-market
**Handled by design, not a bug.** The fund administrator marks NAV conservatively. The token tracks **published** NAV, not MTM. The gap between published NAV and MTM is reserved upside that propagates to all unit-holders over the cycle. See `docs/04-token-lifecycle.md` for the worked example.

### On-chain oracle NAV vs off-chain published NAV
- ✅ `±50%` sanity bound per update (`NAVOracle.MAX_UPDATE_BPS`)
- ✅ Only the authorized `updater` can write (`NotUpdater` revert)
- ✅ NAV cannot be set to zero (`InvalidNav` revert)
- ✅ Every update emits `NavUpdated(oldNav, newNav, updater, timestamp)` for auditability

### Token market price vs on-chain NAV
- ✅ `SubscriptionManager.subscribe()` mints at the current oracle NAV
- ✅ `RedemptionManager.redeem()` burns and pays at the current oracle NAV (minus discount in Path B)
- ✅ This creates the arbitrage incentive that closes any market vs NAV gap — the standard mint/burn peg engine modelled on DAI

### Other on-chain edge cases handled

| Scenario | Behavior |
|---|---|
| NAV = 0 | Reverts (`InvalidNav`) |
| NAV jump > ±50% in one update | Reverts (`UpdateExceedsSanityBound`) |
| Path B discount > 20% | Reverts (`DiscountTooHigh`) |
| Subscribe below minimum | Reverts (`BelowMinSubscription`) |
| Subscribe from non-KYC'd address | Reverts (`NotKycd`) |
| Transfer to/from non-KYC'd address | Reverts (`SenderNotKycd` / `ReceiverNotKycd`) |
| Burn from lapsed-KYC holder | **Allowed by design** — investors must be able to exit regardless of KYC status |
| Redemption when treasury short | Reverts via `SafeERC20` transfer failure; UI shows clear warning + admin top-up path |
| Integer overflow | Solidity 0.8.x checks built-in |
| Reentrancy on USDC | `SafeERC20` used throughout; no external callbacks in critical paths |
| Per-manager pause | Each manager has its own `paused` flag |
| Dust-mint exploits | `minSubscription` floor prevents zero-token mints |

---

## 2. Edge cases the MVP does **not** handle

These are real gaps. Each has a well-known production solution; none is in this codebase.

### Oracle compromise
**Risk:** If the updater key is stolen, the attacker can move NAV ±50% per transaction. Compounded, this is unbounded.
**Production fix:** Multisig over the updater role. Cryptographic NAV attestation signed by the fund administrator's key, verified on-chain. A secondary cross-check against Chainlink or another independent feed. Circuit breaker that pauses subscribe/redeem if the divergence exceeds a tolerance.

### Oracle staleness
**Risk:** No `maxStaleness` check. If the fund admin doesn't push a NAV for weeks, subscribe and redeem still execute against the stale value.
**Production fix:** `require(block.timestamp - lastUpdatedAt < maxAge)` in `SubscriptionManager` and `RedemptionManager`. Typical `maxAge`: tighter than the published NAV cadence (e.g. 30 days for a quarterly mark).

### MEV / front-running around NAV updates
**Risk:** A pending `setNav` transaction in the public mempool is visible. An adversary can subscribe ahead of a markup or redeem ahead of a markdown, capturing the NAV change.
**Production fix:** One of —
- Pause subscribe and redeem for N blocks around any NAV update.
- Use a commit-reveal pattern for NAV updates (admin commits a hash, reveals the value later).
- Restrict subscribe/redeem to defined daily/weekly windows (the model used by most regulated feeder funds today).
- Use a private mempool or Flashbots Protect for the `setNav` transaction.

### Stablecoin depeg
**Risk:** USDC or USDT could lose its peg. The treasury's "$1M USDC" is no longer worth $1M.
**Production fix:** Diversify the treasury across multiple stablecoins. Add a depeg detection circuit breaker that pauses the protocol when a feed price diverges from $1 beyond a tolerance. Document an explicit depeg response policy in the offering documents.

### No global protocol pause
**Risk:** Each manager has its own `paused` flag, but no single transaction kills the entire protocol during an incident.
**Production fix:** A `Pausable` registry that all managers and the token consult before any state-changing operation, gated by an emergency-response multisig.

### No queued redemption
**Risk:** If the treasury is short, `redeem` reverts. Investors trying to exit in a Path A window before settlement get blocked.
**Production fix:** A queue contract that records pending redemption claims, locks the corresponding tokens, and pays out FIFO as the treasury is funded.

### No emergency recovery for lost wallets
**Risk:** If an investor loses access to their KYC'd wallet, their tokens are stuck. The transfer gate by design prevents moving them to a new (un-KYC'd) address.
**Production fix:** A `forceMigrate(oldAddress, newAddress)` function gated by the KYC owner, callable only after off-chain identity verification. Documented in the offering documents.

### NAV moves that legitimately exceed the per-update bound
**Note:** This isn't a vulnerability — it's a design tradeoff. A position that realizes at 10× over a cycle requires the admin to publish multiple sub-50% NAV steps rather than one jump. For PE-style conservative marking this is the desired behavior. For Path A realized exits where the NAV legitimately jumps to the realized value, the admin must step it up over several transactions, or production needs an emergency override path with multisig and timelock.

### No on-chain market maker
**Status:** The mint/burn primitive is the peg's long-run anchor and is fully implemented. A dedicated market maker for short-run smoothing is an external counterparty in this design, not a smart contract in this repo. For a $1M pilot with the token transfer-gated to a small KYC'd group and no secondary venue, the "market price" doesn't exist as a separate thing — every entry/exit goes through the protocol, always at NAV. The market maker matters at scale once a secondary venue is live.

### No KYC provider integration
**Status:** `KYCRegistry` is an owner-controlled allowlist. Production requires integration with a KYC provider (Sumsub, Onfido, Persona, or equivalent), periodic re-screening, sanctions/PEP screening, and travel-rule compliance for large transfers.

### Contracts are not audited
**Status:** 42 tests passing including a full subscribe → NAV update → redeem lifecycle integration. The contracts have not been reviewed by an external security firm. Production deployment requires external audit (recommended: two firms — one smart-contract, one operational threat-modeling) and a bug bounty (Immunefi or equivalent).

### Single-chain, single-deployment
**Status:** Single deployment, no upgrade path, no cross-chain. For a single-cycle pilot this is correct. For a multi-cycle multi-chain platform, plan for a clean migration path (or use a minimal proxy pattern with strict timelock from day one).

---

## 3. What this implies for the pilot

For a controlled $1M pilot with institutional investors and a single underlying:

- All entries and exits route through the protocol contracts — always at NAV — so by construction there is no drift to manage.
- KYC gating + the absence of a public secondary venue means there is no "market price" diverging from NAV.
- Oracle staleness is bounded by operational discipline (the admin commits to a NAV update cadence) rather than enforced on-chain.
- The protocol is functional and demonstrably correct for this scope.

For scale (multiple cycles, secondary trading, $5M–$50M AUM):

- Items 2.1 through 2.10 above need to be addressed before launch.
- See `docs/07-roadmap.md` Phase 2 ("Hardening") for the full checklist and sequencing.

---

## 4. Bottom line for investors

The **structural** peg mechanism is correct: mint and burn at NAV, with KYC gating, sanity bounds, and proper event logging. This is the same pattern used by BlackRock BUIDL, KKR's tokenized feeders, and the Hamilton Lane vehicles.

The **operational hardening** around the structure — multisig, audit, staleness checks, MEV defense, treasury queueing, depeg response, KYC provider, market maker — is partially present and the rest is well-defined work, not research. Treat this MVP as the engineering spec, not the production deployment.

Pilot launch is a 3–6 month operational build from here. Mainnet with real capital should not happen before the items in Section 2 are closed.
