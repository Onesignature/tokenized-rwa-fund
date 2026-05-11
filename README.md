<div align="center">

# Tokenized RWA Fund

**Stablecoin-denominated tokens against off-chain hedge fund units. Token value tracks NAV.**

[![License: MIT](https://img.shields.io/badge/license-MIT-amber)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-42%20passing-emerald)](./contracts/test)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-grey)](./contracts/contracts)
[![Next.js](https://img.shields.io/badge/Next.js-14-grey)](./app)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOnesignature%2Ftokenized-rwa-fund&project-name=tokenized-rwa-fund&repository-name=tokenized-rwa-fund)

</div>

---

A working reference implementation of a **tokenized feeder fund**: investors send stablecoin and receive ERC-20 tokens whose value tracks an off-chain hedge fund's NAV. The on-chain layer never touches the regulated equity — only tokenizes claims on the fund's units.

The repository contains:

- **A documented design** for the structure, the peg mechanism, the compliance posture, and the path to launch
- **Audited-pattern smart contracts** (Solidity 0.8.24 + OpenZeppelin v5) with 42 passing tests including a full lifecycle integration
- **A production-quality demo frontend** (Next.js 14 + viem + RainbowKit) with both live and simulated modes
- **A guided 14-step tour** so non-technical viewers can run the full cycle in two minutes without a wallet

## The structure at a glance

```mermaid
flowchart TD
    Investors["💼 Investors<br/><sub>HNIs · family offices · EAMs</sub>"]
    Feeder["🪙 Feeder Fund <i>(on-chain)</i><br/><sub>holds Source Fund units<br/>issues fund tokens</sub>"]
    Source["🏛️ Source Fund <i>(off-chain)</i><br/><sub>regulated hedge fund<br/>reports NAV</sub>"]
    Equity["📈 Listed Equity<br/><sub>the underlying</sub>"]

    Investors -- "USDC" --> Feeder
    Feeder -- "fund-of-fund subscription" --> Source
    Source -- "buys at entry price" --> Equity
    Equity -. "price moves" .-> Source
    Source -. "NAV propagates" .-> Feeder
    Feeder -. "token price tracks NAV" .-> Investors

    classDef onchain fill:#D4B370,stroke:#A37D34,color:#1A1006
    classDef offchain fill:#F4F1EA,stroke:#B0AEA5,color:#141413
    class Feeder onchain
    class Source,Equity,Investors offchain
```

NAV propagates back up the chain to set the token price. Shares in the listed company never pass to the feeder fund.

## Try it

Two ways:

| Mode | URL | Setup | What it does |
|---|---|---|---|
| **Simulation** | `/simulate` | None — just visit | Full lifecycle in your browser, no wallet needed, guided tour included |
| **Live** | `/app` | Wallet + Sepolia (or local Hardhat node) | Real on-chain transactions against deployed contracts |

The simulation is the recommended path for first-time viewers. Hit **"Try the demo"** on the landing page and follow the gold-bordered tour card.

## Quickstart

Prerequisites: Node 20+, npm, git.

```bash
# 1. Install + test the contracts
cd contracts
npm install
npm test            # 42 passing

# 2. Spin up a local node and deploy
npm run node                                # terminal A
npm run deploy:local                        # terminal B

# 3. Run the frontend (from repo root)
cd ..
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

The deploy script writes contract addresses to `lib/deployment.json` automatically, so the frontend picks them up without manual wiring.

## Repository layout

```
.
├── docs/                        ← concept, architecture, peg, lifecycle, compliance, roadmap
├── contracts/                   ← Hardhat project (Solidity + tests + deploy)
│   ├── contracts/               ← MockUSDC, KYCRegistry, NAVOracle, FeederFundToken,
│   │                              Treasury, SubscriptionManager, RedemptionManager
│   ├── test/                    ← unit + Lifecycle integration tests
│   └── scripts/                 ← deploy.ts, demo-cycle.ts
├── app/                         ← Next.js 14 (App Router)
│   ├── page.tsx                 ← landing page
│   ├── app/                     ← live dashboard, subscribe, redeem
│   └── simulate/                ← simulation dashboard + guided tour
├── components/                  ← NavHero, PositionCard, ActivityFeed, AdminPanel, TourGuide, …
├── contexts/                    ← LiveFundProvider + SimulatedFundProvider (unified FundContext)
├── hooks/                       ← useFund, useTourSpotlight
├── lib/                         ← abis, format, deployment.json, wagmi config
├── package.json                 ← Next.js app dependencies
├── LIMITATIONS.md               ← honest audit of what the MVP does and does not handle
└── README.md                    ← you are here
```

## Architecture

```mermaid
flowchart LR
    Oracle["🔮 NAV Oracle<br/><sub>±50% sanity bound<br/>admin-attested</sub>"]
    Token["🪙 FeederFundToken<br/><sub>ERC-20, KYC-gated</sub>"]
    Sub["📥 SubscriptionManager<br/><sub>USDC → tokens at NAV</sub>"]
    Red["📤 RedemptionManager<br/><sub>tokens → USDC at NAV<br/>Path A / Path B</sub>"]
    Treasury["🏦 Treasury<br/><sub>USDC reserves</sub>"]
    KYC["✓ KYCRegistry<br/><sub>institutional allowlist</sub>"]
    USDC["💵 USDC<br/><sub>stablecoin</sub>"]

    Sub -- "reads NAV" --> Oracle
    Red -- "reads NAV" --> Oracle
    Sub -- "mints" --> Token
    Red -- "burns" --> Token
    Sub -- "pulls" --> USDC
    USDC --> Treasury
    Red -- "pays from" --> Treasury
    Token -- "checks" --> KYC

    classDef accent fill:#D4B370,stroke:#A37D34,color:#1A1006
    class Token accent
```

| Contract | Responsibility |
|---|---|
| `MockUSDC` | 6-decimal ERC-20 with open faucet (testnet only) |
| `KYCRegistry` | Owner-controlled allowlist of approved addresses |
| `NAVOracle` | Stores NAV; only `updater` writes; ±50% per-update sanity bound; full event log |
| `FeederFundToken` | ERC-20 fund token; transfer-gated by KYC; mint/burn restricted to managers |
| `Treasury` | Holds USDC reserves; only authorized payers move funds out |
| `SubscriptionManager` | Accepts USDC, mints tokens at the current NAV |
| `RedemptionManager` | Burns tokens, pays USDC at NAV (with optional Path B discount) |

Deeper detail in [`docs/02-architecture.md`](./docs/02-architecture.md).

## Token lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant I as Investor
    participant S as SubscriptionManager
    participant T as Token
    participant O as NAVOracle
    participant Tr as Treasury
    participant R as RedemptionManager

    Note over I,Tr: Stage 1 — Subscribe
    I->>S: subscribe(USDC)
    S->>O: getNav()
    O-->>S: nav
    S->>Tr: forward USDC
    S->>T: mint(investor, tokens)

    Note over O: Stage 2 — NAV updates over time
    O->>O: setNav(newNav)  · admin pushes quarterly mark

    Note over I,R: Stage 3 — Redeem (Path A or B)
    I->>R: redeem(tokens)
    R->>O: getNav()
    O-->>R: nav
    R->>T: burnFrom(investor, tokens)
    R->>Tr: pay(investor, usdcOut)
    Tr-->>I: USDC
```

Full numeric walk-through in [`docs/04-token-lifecycle.md`](./docs/04-token-lifecycle.md).

## Deploy to Vercel

The Next.js app lives at the repo root, so Vercel auto-detects it. No special configuration needed.

1. Click the **Deploy with Vercel** button at the top of this README (or fork + import manually)
2. No environment variables required for the simulation to work — `/simulate` runs entirely in the browser
3. After deploy, visit `https://your-app.vercel.app/simulate` to try the demo

To make `/app` work on the deployed site you need to:

1. Deploy the contracts to a public network (Sepolia is supported out of the box)
   ```bash
   cd contracts
   cp .env.example .env       # fill SEPOLIA_RPC_URL + PRIVATE_KEY
   npm run deploy:sepolia
   ```
2. Commit the regenerated `lib/deployment.json`
3. Push — Vercel will redeploy automatically

Until then, `/app` shows a banner pointing visitors to `/simulate`.

## Status

This is a **working MVP**, not production code. Contracts have unit + integration test coverage but have **not** been audited.

- **What's covered:** [`LIMITATIONS.md`](./LIMITATIONS.md) — the honest list of edge cases the MVP handles and the ones it doesn't
- **Path to production:** [`docs/07-roadmap.md`](./docs/07-roadmap.md) — Phase 0 (build-vs-partner conversations) → Phase 4 (multi-cycle scale)

## Docs

| Doc | What it covers |
|---|---|
| [01-concept.md](./docs/01-concept.md) | The thesis, the target investor, why a feeder fund |
| [02-architecture.md](./docs/02-architecture.md) | The four-layer stack, value flow, on-chain vs off-chain split |
| [03-peg-mechanism.md](./docs/03-peg-mechanism.md) | NAV oracle, mint/burn, market-maker arbitrage |
| [04-token-lifecycle.md](./docs/04-token-lifecycle.md) | Subscribe, NAV tracking, exit paths A and B |
| [05-compliance.md](./docs/05-compliance.md) | KYC/AML model, transfer gating, jurisdictional posture |
| [06-build-vs-partner.md](./docs/06-build-vs-partner.md) | Proprietary build vs KAIO / Securitize |
| [07-roadmap.md](./docs/07-roadmap.md) | Pilot → scale plan |
| [LIMITATIONS.md](./LIMITATIONS.md) | Honest audit of MVP gaps and their production fixes |

## Tech stack

**Contracts**
- Solidity 0.8.24
- OpenZeppelin Contracts v5
- Hardhat + TypeScript + viem-based tests (42 passing)

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS with custom dark fintech theme
- wagmi v2 + viem + RainbowKit
- React Context for unified Live/Simulated state

**Design**
- Inter (UI), Instrument Serif (display), JetBrains Mono (numbers)
- Single signature accent: warm institutional gold

## License

[MIT](./LICENSE)

---

<div align="center">

Built as a reference implementation, not financial advice. Not an offer to sell securities.

</div>
