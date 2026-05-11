# Frontend

Next.js 14 + wagmi + viem + RainbowKit. Connects to the deployed contracts via the addresses in `lib/deployment.json` (which is overwritten automatically by the contracts deploy script).

## Pages

- `/` — Dashboard. NAV, total supply, treasury, your position.
- `/subscribe` — Send USDC, receive tokens at NAV.
- `/redeem` — Send tokens, receive USDC at NAV (with optional Path B discount).
- `/admin` — USDC faucet, KYC management, NAV update, redemption mode toggle.

## Run locally

```bash
# In the contracts folder, in one terminal:
cd ../contracts
npm run node                # starts local Hardhat node at http://127.0.0.1:8545

# In a second terminal, deploy:
npm run deploy:local

# In a third terminal, run the frontend:
cd ../frontend
cp .env.example .env.local
npm install                 # if not already
npm run dev
```

Open http://localhost:3000.

## Connecting

In MetaMask, add a custom network:
- Network name: Hardhat localhost
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency symbol: ETH

Import one of the default Hardhat accounts using its private key (printed when `npm run node` starts). The first account is the deployer — it owns all admin roles by default.

## Demo flow

1. **Admin tab** → click "Mint USDC" to give yourself 10,000 mock USDC, then "Add my address" to self-KYC.
2. **Subscribe tab** → enter $1,000, approve, subscribe. You receive 1,000 FFT at NAV $1.00.
3. **Admin tab** → update NAV to 1.15, 1.32, 1.52, 1.75 (one at a time — the per-update sanity bound caps at +50%).
4. **Dashboard** → watch your position value climb.
5. **Admin tab** → either continue ramping NAV toward $4 (Path A) or set discount to 500 (Path B).
6. **Admin tab** → for Path A: use the faucet to top up the treasury with realized proceeds.
7. **Redeem tab** → redeem your tokens. See USDC paid out at NAV (Path A) or NAV minus discount (Path B).

## Building for Sepolia

```bash
cd ../contracts
# Set SEPOLIA_RPC_URL and PRIVATE_KEY in contracts/.env
npm run deploy:sepolia      # writes lib/deployment.json with Sepolia addresses

cd ../frontend
# Set NEXT_PUBLIC_NETWORK=sepolia in .env.local
npm run build
npm start
```
