# 05 — Compliance

## Posture

This is an institutional-first product. The compliance bar is set by the standards tier-one private banks would require to onboard the feeder fund as a counterparty.

Two layers of compliance:

1. **Where the feeder fund is domiciled.** The wrapper-level regulatory framework.
2. **Which investors can subscribe.** Per-investor KYC, AML, accredited-investor verification, and sanctions screening — enforced both off-chain (institutional KYC) and on-chain (transfer gating via the KYC registry).

## Jurisdiction

Three candidate jurisdictions, each with trade-offs:

| Jurisdiction | Regulator | Strengths | Concerns |
|---|---|---|---|
| UAE (Dubai or Abu Dhabi) | VARA / FSRA / SCA | Deliberate positioning as a tokenized RWA hub; concentrated crypto-native infrastructure; institutional banking rails | Regulator still maturing on specific structural questions |
| Singapore + GIFT City (India) | MAS / IFSCA | Tier-one regulatory clarity, well-established institutional onboarding | More expensive setup; longer timelines |
| Mauritius | FSC | Cheapest and fastest setup; aligned with existing fund operations | Crypto framework less developed than the other two |

The MVP is regulator-agnostic. The smart contracts work the same regardless of where the wrapper is domiciled. The wrapper choice affects disclosures, investor eligibility rules, and which institutional counterparties will accept the feeder fund.

## Excluded investor classes (at launch)

**US persons are excluded at launch.** Onboarding US investors triggers SEC oversight of the entire structure, which would substantially complicate the build. Once the protocol is operating cleanly in non-US jurisdictions, US investor access can be reconsidered under appropriate exemptions (Reg D, Reg S, etc.).

**Sanctioned jurisdictions and addresses are blocked.** Sanctions screening happens at both the KYC onboarding stage (off-chain) and at the protocol level (on-chain — sanctioned addresses are never added to the KYC registry).

## How KYC is enforced on-chain

The `KYCRegistry` contract holds an allowlist of addresses that have passed off-chain KYC. The `FeederFundToken` contract overrides `_update` (the OpenZeppelin ERC-20 transfer hook) to revert any transfer where the sender or receiver is not on the allowlist — except for mints (sender is zero address) and burns (receiver is zero address), which go through the subscription and redemption managers anyway.

The result: tokens can only ever be held by KYC'd addresses. An investor who passes KYC, buys tokens, and then loses access to their wallet cannot transfer those tokens to a new address until the new address is also KYC'd. This is by design.

```solidity
// Pseudocode of the gate
function _update(address from, address to, uint256 value) internal override {
    bool isMint = from == address(0);
    bool isBurn = to == address(0);

    if (!isMint && !kycRegistry.isKycd(from)) revert SenderNotKycd();
    if (!isBurn && !kycRegistry.isKycd(to))   revert ReceiverNotKycd();

    super._update(from, to, value);
}
```

This pattern is structurally similar to ERC-1404 (a transfer-restriction standard) but implemented inline for simplicity. In production, supporting ERC-1404 explicitly improves interoperability with exchanges and custodians that already understand the standard.

## Onboarding flow

```
  1. Investor passes off-chain KYC
     - Identity, address, source of funds
     - Accredited-investor or qualified-purchaser verification
     - Sanctions and PEP screening
     - (Optional) institutional channel: KYC pre-cleared via private bank
       relationship; feeder fund verifies the bank's KYC attestation
       rather than re-running the process
       │
       ▼
  2. Investor's address is added to the KYC registry on-chain
     - Single transaction by the KYC operator (in production, a multisig)
     - Emits an event for audit trail
       │
       ▼
  3. Investor approves stablecoin spending and calls subscribe()
     - Tokens are minted to their address
     - Subsequent transfers are gated by the KYC registry
       │
       ▼
  4. If the investor later fails periodic re-screening:
     - Their address is removed from the KYC registry
     - They can no longer transfer tokens (but can still redeem,
       which is a burn — burns are not transfer-gated)
```

The redemption path is intentionally not transfer-gated for the redeeming address. A KYC'd investor whose KYC status lapses must be able to exit cleanly through redemption rather than being trapped.

## What this MVP does

- KYC registry contract with owner-controlled add/remove
- Transfer gating: token transfers revert if either side is not KYC'd
- Subscription requires the subscriber to be KYC'd
- Redemption does not require KYC (so investors can exit even if their status lapses)
- Event log for all KYC changes (auditable)

## What production adds

- Multisig over the KYC operator role
- Integration with off-chain KYC providers (Sumsub, Onfido, Persona)
- Periodic re-screening cadence
- Travel rule compliance for large transfers
- Regulator-specific disclosures embedded in the subscription flow
- ERC-1404 explicit compliance for exchange / custodian interop
- Pause function for the whole protocol in case of regulatory action

## Tensions to flag

**Compliance plus economic asymmetry.** The structure pairs full AML/KYC with a designed economic spread (premium on issue, discount on redeem) in favor of the fund layer. Defensible only if disclosed transparently to token holders. Disclosure framing is part of the structuring work, not an afterthought. Token holders must understand, at subscription, the economic spread the fund is taking and why.

**Control of the underlying.** Operator anchor positioning is a strength on the equity side. To a regulator or sophisticated LP it can read as concentrated exposure. Precision is needed about what "control" means at each layer (entry pricing, market-making in the underlying, exit timing) and how that is communicated externally.

**Centralized governance over decentralized distribution.** The Source Fund makes centralized decisions: when to mark NAV up, when to mark down, when to enter or exit a position. The feeder fund distributes those decisions through a decentralized mechanism. When the two layers disagree (a NAV mark that the market reads as too aggressive, a redemption window that some token holders want changed), the architecture has to handle the disagreement cleanly. This is a real governance design problem and deserves explicit attention before production launch.
