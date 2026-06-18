# OPN Swap

**The first constant-product AMM DEX on OPN Chain.** Swap tokens, provide liquidity, and earn fees — fully on-chain, no backend, no intermediaries.

---

## Overview

OPN Swap is a fully functional Automated Market Maker (AMM) decentralized exchange deployed on OPN Chain Testnet. It implements the constant-product formula (`x · y = k`) — the same mathematical foundation behind Uniswap V1/V2 — purpose-built for the OPN ecosystem.

### Core Capabilities

- **Token Swapping** — 0.3% LP fee, configurable slippage protection (0.5% / 1% / 3%), real-time price impact display
- **Liquidity Pools** — Deposit token pairs, receive LP tokens representing your proportional share
- **Built-in Faucet** — Claim free test tokens instantly, no external faucet needed
- **Factory Pattern** — Supports creating unlimited token pairs, making the protocol extensible

Every transaction (swaps, liquidity additions, removals) is confirmed on-chain. No off-chain computation, no oracles, no trusted intermediaries.

---

## How It Works

1. **Liquidity Providers** deposit equal-value amounts of two tokens into a pool and receive LP tokens proportional to their share.
2. **Traders** swap one token for another. The contract calculates output using:
   ```
   amountOut = (reserveOut × amountIn × 997) / (reserveIn × 1000 + amountIn × 997)
   ```
   This enforces the constant-product invariant while collecting a 0.3% fee.
3. **LP Token Holders** can burn their LP tokens at any time to withdraw their proportional share of both reserves, including accumulated fees.

The 0.3% swap fee stays in the pool and is distributed pro-rata to all liquidity providers.

---

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| `OPNToken.sol` | ERC-20 token with public faucet (max 10,000 per call) |
| `OPNSwapPair.sol` | Constant-product AMM pool (`x · y = k`), 0.3% fee, LP token minting/burning |
| `OPNSwapFactory.sol` | Creates and indexes token pair pools |

**Security:** ReentrancyGuard + Checks-Effects-Interactions pattern. Solidity 0.8.20 with built-in overflow protection.

---

## Project Structure

```
opn-swap/
├── contracts/
│   ├── OPNToken.sol          # ERC-20 token + faucet
│   ├── OPNSwapPair.sol       # AMM pool
│   └── OPNSwapFactory.sol    # Pair factory
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js            # UI logic
│       └── contracts.js      # Contract addresses & ABIs
├── scripts/
│   └── deploy.js             # Automated deployment script
├── hardhat.config.js
└── package.json
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MetaMask](https://metamask.io/) browser extension

### 1. Install Dependencies

```bash
git clone https://github.com/hhuy780/opn-swap.git
cd opn-swap
npm install
```

### 2. Configure Network

Add OPN Chain Testnet to MetaMask:

| Field            | Value                              |
|------------------|------------------------------------|
| Network Name     | OPN Chain Testnet                  |
| RPC URL          | `https://testnet-rpc.iopn.tech`    |
| Chain ID         | `984`                              |
| Currency Symbol  | `IOPN`                             |
| Block Explorer   | `https://testnet.iopn.tech`        |

### 3. Get Test Tokens

Request IOPN testnet tokens from the **#faucet** channel on the IOPn Discord server.

### 4. Deploy Contracts

```bash
# Set your MetaMask private key
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Compile and deploy
npm run compile
npm run deploy
```

After deployment, copy the printed contract addresses into `frontend/js/contracts.js`:

```javascript
const ADDRESSES = {
  factory: "0x...",
  tokenA:  "0x...",
  tokenB:  "0x...",
  pair:    "0x...",
};
```

### 5. Run Locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser, connect MetaMask, and start swapping.

---

## Deployment

### Frontend (Vercel)

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Import the `opn-swap` repository
4. Set **Root Directory** to `frontend`
5. Set **Framework Preset** to `Other`
6. Click **Deploy**

### Submission

After deploying, submit your project at [builders.iopn.tech/dashboard/submit](https://builders.iopn.tech/dashboard/submit) with:
- Live demo URL (Vercel)
- Source code URL (GitHub)

---

## Tech Stack

- **Solidity** 0.8.20
- **Hardhat** — compilation, testing, deployment
- **ethers.js** v6 — frontend contract interaction
- **HTML / CSS / JavaScript** — zero-framework frontend, no build step required
- **OPN Chain Testnet** (Chain ID: 984)

---

## Roadmap

### Q2 2026 — MVP (Current)
- Core AMM contracts on OPN Chain Testnet
- Swap interface with real-time quotes
- Liquidity pool management UI
- Built-in faucet for test tokens

### Q3 2026 — Multi-pair & Analytics
- Router contract for multi-hop swaps (A → B → C)
- Token list registry for community-curated metadata
- Analytics dashboard: TVL, volume, fees per pool
- Subgraph indexer for historical trade data

### Q4 2026 — Yield & Governance
- Liquidity mining with governance token
- Fee-sharing mechanism
- Governance voting for fee parameters and token listings
- Mobile-optimized PWA

### 2027 — Advanced AMM
- Concentrated liquidity (Uniswap V3-style)
- Limit orders via on-chain order book hybrid
- Cross-chain bridge integration
- Mainnet deployment

---

## License

MIT
