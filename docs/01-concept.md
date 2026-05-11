# 01 — Concept

## Thesis

A new on-chain feeder fund subscribes to an off-chain hedge fund (the "Source Fund") that holds listed equities in markets where the fund operator has anchor capital and a defined exit path. The feeder fund tokenizes its position. Token value tracks the Source Fund's NAV.

The product gives global investors stablecoin-denominated, fractional exposure to listed equities they could not otherwise reach at the operator's entry price.

## The opportunity

There is a class of investor that wants exposure to specific listed companies but cannot easily reach them:

- A family office that does not want to open a direct foreign brokerage account for a small ticket.
- A private investor in an emerging market who wants a fractional position in a foreign-listed company.
- An investor in a jurisdiction that cannot legally invest into the underlying market.

All of them already hold stablecoins. None of them have a clean route into the underlying equity.

The proposal is to build that route. A new feeder fund, owned and run by the team, subscribes to the Source Fund as an institutional investor and receives units. The feeder fund then issues tokens to its own investors. Each token represents a fractional claim on the feeder fund's holding in the Source Fund. When NAV rises because the underlying equity rose, the token price rises. When investors want out, they redeem tokens for stablecoin.

## Why this works

Three things hold the thesis together.

**Anchor position in the underlying.** The feeder fund only tokenizes positions where the operator has anchor capital, control of entry pricing, and a pre-defined exit. That criterion is what makes the NAV peg credible and the cycle predictable. Without it, the NAV peg is an exercise in optimism.

**Latent demand.** Existing institutional clients have been requesting a crypto-linked product for years. The existing fundraising mechanic — institutional aggregators at the front, smaller tickets beneath — translates directly into the on-chain layer.

**Stablecoin is the medium, not the bet.** All subscriptions and redemptions happen in USDC or USDT, pegged 1:1 to USD. Idle stablecoin balances can earn yield on approved instruments. Nowhere in this structure does the operator or the investor take volatile-crypto exposure.

## Who this is for

The product is **institutional-first**. Target investors are private-bank clients, family offices, and external asset managers who already have a stablecoin allocation, want exposure to the underlying equity opportunity, and value clean compliance.

The product is **not** for retail speculators looking for the next 100x token. KYC, accredited-investor checks, and minimum hold periods are deliberate features of the design.

The product expands the investor universe beyond what direct Source Fund subscription can reach:

- Investors below the institutional minimum ($100K+)
- Investors in jurisdictions the Source Fund cannot accept directly
- Investors who only hold their wealth in stablecoins
- Investors who will not tolerate the multi-week wire/KYC cycle of a traditional fund subscription

For an institutional investor who already has a clean direct line into the Source Fund through their private bank, there is no compelling reason to use the feeder fund. They should continue to subscribe directly. The on-chain layer is built for everyone the direct path cannot reach.

## What the on-chain layer does

The blockchain layer is doing real, irreplaceable work:

1. **Fractional access.** Any investor anywhere can hold a token. Minimum ticket falls from $100K to whatever the operator chooses, realistically $1K–$10K.
2. **Atomic settlement.** Subscriptions and redemptions clear in seconds, not weeks.
3. **Continuous secondary liquidity.** Tokens trade on the open market even though the Source Fund's NAV is published only periodically.
4. **Global reach with single-point compliance.** KYC happens once at the fund level. Anyone in the world who passes the gate can hold tokens, subject to sanctions screening enforced at the protocol level.

The shares of the listed company never pass to the feeder fund. The on-chain layer only ever touches a fund position. Everything regulated about the underlying equity stays inside the regulated fund wrapper. This is a deliberate structural choice and the cleanest legal posture available.
