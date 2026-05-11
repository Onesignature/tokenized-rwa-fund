# Tokenized RWA Fund

A working reference implementation of a **tokenized feeder fund** that issues stablecoin-denominated tokens against units in an off-chain hedge fund (the "Source Fund"). Token price tracks the Source Fund's NAV.

This repository contains:

1. **Concept and architecture docs** — the structural design of a tokenized fund that solves cross-border equity access for global investors. See [`docs/`](./docs).
2. **Smart contracts** — a complete on-chain implementation of the subscription, NAV tracking, and redemption flow. See [`contracts/`](./contracts).
3. **Demo frontend** — a Next.js app that exercises the full subscribe → NAV update → redeem cycle on Ethereum Sepolia. See [`frontend/`](./frontend).

## What this is

The structure is a **fund-of-fund tokenization**:

```
INVESTORS  ──stablecoin──►  FEEDER FUND  ──subscribes──►  SOURCE FUND  ──holds──►  LISTED EQUITY
                            (this protocol)               (off-chain)
                                  │
                                  └── issues tokens  ◄── NAV propagates back up
```

The on-chain layer never touches the underlying equity. It only tokenizes claims on fund units. That keeps the regulated equity inside the regulated wrapper and limits the blockchain layer to what it does best: fractional ownership, global access, and atomic settlement.

## The MVP demonstrates

- **Subscribe**: investor sends stablecoin, receives tokens at the current NAV
- **NAV tracking**: an admin (in production, a multisig fed by the fund administrator) publishes NAV updates; token value follows
- **Redeem (Path A)**: investor sends tokens back, receives stablecoin at NAV
- **Redeem (Path B)**: investor receives stablecoin at NAV minus a configurable discount, simulating a market-maker-funded buyback at exit
- **KYC gating**: tokens can only move between addresses on an institutional allowlist (transfer-restricted ERC-20)

## Quickstart

Prerequisites: Node 20+, npm.

```bash
# 1. Install and compile contracts
cd contracts
npm install
npx hardhat compile
npx hardhat test

# 2. Run a local node and deploy
npx hardhat node                            # in one terminal
npx hardhat run scripts/deploy.ts --network localhost   # in another

# 3. Run the frontend
cd ../frontend
npm install
npm run dev
# open http://localhost:3000
```

Sepolia deployment instructions are in [`contracts/README.md`](./contracts/README.md).

## Docs

| Doc | What it covers |
|---|---|
| [01-concept.md](./docs/01-concept.md) | The thesis, the target investor, why a feeder fund |
| [02-architecture.md](./docs/02-architecture.md) | The four-layer stack, value flow, on-chain vs off-chain split |
| [03-peg-mechanism.md](./docs/03-peg-mechanism.md) | NAV oracle, mint/burn, market-maker arbitrage |
| [04-token-lifecycle.md](./docs/04-token-lifecycle.md) | Subscribe, NAV tracking, exit paths A and B |
| [05-compliance.md](./docs/05-compliance.md) | KYC/AML model, transfer gating, jurisdictional posture |
| [06-build-vs-partner.md](./docs/06-build-vs-partner.md) | Proprietary build vs platform partnership (KAIO, Securitize) |
| [07-roadmap.md](./docs/07-roadmap.md) | Pilot → scale plan |

## Status

This is a **working MVP**, not production code. Smart contracts have unit and integration test coverage but have not been audited. See [`docs/07-roadmap.md`](./docs/07-roadmap.md) for the path from this MVP to a production-grade deployment.

## License

MIT
