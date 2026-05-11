# Contracts

Smart contracts for the Tokenized RWA Fund. Hardhat + TypeScript + OpenZeppelin v5.

## Contracts

| Contract | Purpose |
|---|---|
| `MockUSDC.sol` | 6-decimal ERC-20 used as the testnet stablecoin |
| `KYCRegistry.sol` | Owner-controlled allowlist of KYC-approved addresses |
| `NAVOracle.sol` | Stores NAV per token (18 decimals); only the updater can write; ±50% per-update sanity bound |
| `FeederFundToken.sol` | ERC-20 fund token; mint/burn restricted to minters; transfers gated by KYC |
| `SubscriptionManager.sol` | Accepts USDC, mints tokens at current NAV |
| `RedemptionManager.sol` | Burns tokens, pays USDC at current NAV (with optional Path B discount) |

## Quickstart

```bash
npm install
npm run compile
npm test
```

## Deploy to local Hardhat node

```bash
# Terminal 1
npm run node

# Terminal 2
npm run deploy:local
```

Addresses are written to `deployments/localhost.json` and consumed by the frontend.

## Deploy to Sepolia

```bash
cp .env.example .env
# Fill in SEPOLIA_RPC_URL and PRIVATE_KEY
npm run deploy:sepolia
```

Addresses are written to `deployments/sepolia.json`.

## Architecture

```
                  ┌─────────────────┐
                  │   NAVOracle     │ ◄── admin updates NAV
                  └────────┬────────┘
                           │ reads NAV
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌────────────────────┐    ┌────────────────────┐
   │ SubscriptionManager│    │  RedemptionManager │
   │  USDC → tokens     │    │  tokens → USDC     │
   └─────────┬──────────┘    └─────────┬──────────┘
             │ mints                    │ burns
             ▼                          ▼
        ┌──────────────────────────────────┐
        │       FeederFundToken (ERC-20)   │
        │       transfer-gated by KYC      │
        └──────────────┬───────────────────┘
                       │ checks
                       ▼
                  ┌─────────────────┐
                  │   KYCRegistry   │ ◄── owner adds/removes addresses
                  └─────────────────┘
```

## Security notes

This is an MVP. The contracts have unit + integration test coverage but have **not** been audited. Production deployment requires:

- External audit by a recognized firm
- Multisig over all admin roles (Ownable currently)
- Timelock on NAV updates above the sanity bound
- A pause function across the protocol (not present in MVP for simplicity)
- ERC-1404 explicit support for exchange / custodian interop

See `../docs/07-roadmap.md` for the full hardening checklist.
