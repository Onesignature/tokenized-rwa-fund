# 07 — Roadmap

The plan from where this MVP is today to a production-grade deployment.

## Phase 0 — Pre-build (in flight)

Before any production code is written, three conversations to settle the build-vs-partner question (see [06-build-vs-partner.md](./06-build-vs-partner.md)). 2–4 weeks.

Outputs from this phase:
- Build-vs-partner decision, documented
- Selected jurisdiction (UAE / Singapore + GIFT City / Mauritius)
- Selected market maker (or shortlist of candidates)
- Selected stablecoin(s) for treasury (USDC, USDT, or both)
- Selected chain (Ethereum mainnet or Base — neither is in this MVP's testnet config, but the contracts are chain-agnostic EVM)

## Phase 1 — This MVP

What's already done in this repository:

- [x] Concept and architecture docs
- [x] Smart contracts: MockUSDC, KYCRegistry, NAVOracle, FeederFundToken, SubscriptionManager, RedemptionManager
- [x] Unit and integration tests covering the full subscribe → NAV update → redeem cycle (Path A and Path B)
- [x] Deploy script for local node and Sepolia
- [x] Next.js frontend with subscribe, redeem, dashboard, and admin pages
- [x] CI workflow that runs the contract test suite on push

What this MVP is **not**:

- Not audited. The contracts have test coverage but have not been reviewed by an external security firm.
- Not upgradeable. Core logic is immutable (deliberate — see Phase 3).
- Not multi-chain. Single deployment, Sepolia.
- Not market-maker-integrated. Mint/burn primitive exists but no MM contract.
- Not connected to a real KYC provider. Allowlist is owner-controlled.
- Not connected to a real off-chain NAV feed. Oracle is admin-updated.

## Phase 2 — Hardening (8–12 weeks)

Bring the MVP to a state where it can hold real capital.

### Security
- [ ] External audit (two firms, ideally — one for smart contracts, one for operational threat modeling)
- [ ] Bug bounty program (Immunefi or similar)
- [ ] Pause function across the whole protocol (subscriptions, redemptions, transfers) for emergency response
- [ ] Timelock on admin actions (24-hour minimum for NAV updates beyond sanity bound; 7-day for contract upgrades if any)
- [ ] Multisig over all admin roles (3-of-5 minimum, with hardware wallet signers)

### NAV oracle
- [ ] Multi-source oracle architecture (admin attestation + on-chain price feed for sanity check + circuit breaker on divergence)
- [ ] Cryptographic attestation from the fund administrator (signed NAV with administrator's key)
- [ ] Public audit trail of every NAV update and the source data

### KYC
- [ ] Integration with off-chain KYC provider (Sumsub, Onfido, Persona)
- [ ] Periodic re-screening cadence (quarterly)
- [ ] Travel rule compliance for large transfers
- [ ] ERC-1404 explicit support for exchange / custodian interop

### Market maker
- [ ] Selected market maker onboarded
- [ ] Mandate document signed (spread targets, inventory limits, response time during stress)
- [ ] On-chain market maker integration (designated address with elevated mint/burn capacity)

### Treasury
- [ ] Stablecoin diversification (USDC + USDT)
- [ ] Yield deployment on idle balances (approved instruments only)
- [ ] Insurance on custody (Nexus Mutual or traditional carrier)

### Compliance
- [ ] Subscription disclosure documents (economic spread explicit and prominent)
- [ ] Quarterly NAV reports published on-chain and via fund administrator
- [ ] Regulatory filings in selected jurisdiction
- [ ] Tax reporting infrastructure (1099 / equivalent for investor jurisdictions)

## Phase 3 — Pilot launch (4 weeks)

Small, controlled pilot. Goal is to prove the mechanics, not to raise capital.

- **Size:** ~$1M. Small enough to manage tightly, large enough to exercise the full machinery. Operator funds the pilot internally if external subscriptions are slower than expected.
- **Underlying:** A single position from the Source Fund's existing book where the operator has clear anchor capital, debt-free balance sheet, and a credible multi-year story.
- **Investors:** Onboarded through institutional channels (private banks, EAMs, family offices). Direct retail is not the launch target.
- **Cycle:** Run the position through one full lifecycle (subscribe → NAV tracking → exit via Path A or Path B). Estimated 6–24 months from launch to exit, depending on the underlying.

**Success criteria:**
- [ ] Token price tracks Source Fund NAV within an acceptable band throughout the cycle
- [ ] Subscription flow, custody, and fiat off-ramps work end to end
- [ ] The market maker maintains acceptable spread and liquidity
- [ ] Compliance review closes without findings
- [ ] One full exit cycle (Path A or Path B) demonstrated

## Phase 4 — Scale

After the first cycle completes cleanly:

- Scale target allocation per cycle to $5M–$10M
- Open subsequent cycles on new underlying positions
- Consider multi-chain deployment (Ethereum mainnet + Base for cost-sensitive investors)
- Add European investors via MiCA-compliant onboarding through institutional aggregators
- Build out the brand as a multi-cycle platform: "the place where global investors get fractional, stablecoin-denominated access to listed-equity work"

## Phase 5 — Optionality

Once the protocol has demonstrated multiple successful cycles, further options open up:

- **De-SPAC vehicles as future underlyings.** If the operator has a SPAC that completes a de-SPAC merger, the resulting NASDAQ-listed entity becomes a strong candidate underlying for the on-chain layer.
- **US investor access.** Under a more favorable regulatory environment, US investor onboarding via Reg D / Reg S exemptions becomes feasible.
- **Cross-pollination with other RWA primitives.** Tokenized fund interests can be used as collateral in DeFi lending markets (BUIDL has set the precedent). The feeder fund's tokens could enter that collateral universe at a sufficient AUM threshold.

## Critical dependencies (gating)

Each phase depends on the previous one. The gating items:

| Gate | What must be true |
|---|---|
| Phase 2 begins | Build-vs-partner decision made; jurisdiction selected |
| Phase 3 begins | External audit passed; multisig live; off-chain KYC integrated; market maker onboarded |
| Phase 4 begins | One full pilot cycle demonstrated cleanly (Path A or Path B) |
| Phase 5 begins | At least two cycles complete; AUM milestone reached |

The fastest path through Phase 2–3 is ~3–4 months if the build-vs-partner decision is "partner" (Securitize or KAIO handles most of Phase 2). Proprietary build extends Phase 2 to 6–9 months.

## What this MVP buys

The MVP exists primarily to:

1. **Make the architecture concrete.** It is much easier to negotiate with platform partners, regulators, and counterparties when the protocol exists in code, not just in prose.
2. **De-risk the proprietary build path.** If the team chooses to build, this is the skeleton. If they choose to partner, this is the contract: "this is what we want; can you do it?"
3. **Train the team's intuition.** Several decisions (chain, stablecoin, oracle, KYC posture) are easier to make after working code exists to test the assumptions.
