# OPN Swap – Submission Content

> Copy nội dung bên dưới khi điền vào submission wizard trên builders.iopn.tech

---

## Project Name

OPN Swap

## Tagline

The first AMM DEX on OPN Chain — swap tokens, provide liquidity, earn fees.

---

## What we built

OPN Swap is a fully functional Automated Market Maker (AMM) decentralized exchange deployed natively on OPN Chain Testnet. It implements the constant-product formula (x · y = k) — the same mathematical foundation behind Uniswap — purpose-built for the OPN ecosystem.

Unlike most submissions that deploy a basic ERC-20 or counter contract, OPN Swap is a complete DeFi primitive with real utility:

- **Token swapping** with a 0.3% LP fee, slippage protection, and real-time price impact display
- **Liquidity pools** where users deposit token pairs and receive LP tokens representing their share
- **Built-in token faucet** so anyone can test the DEX in under 60 seconds — no external faucet needed
- **Factory pattern** that supports creating unlimited token pairs, making the protocol extensible

Every transaction — swaps, liquidity additions, removals — happens on OPN Chain. The contracts use no off-chain computation, no oracles, and no trusted intermediaries. The chain confirms every trade.

## Why

Every DeFi ecosystem starts with a DEX. OPN Chain needs permissionless trading infrastructure where users can swap tokens without a centralized intermediary. OPN Swap demonstrates that OPN Chain is ready for real DeFi by providing the foundational liquidity layer that other protocols (lending, derivatives, yield) will eventually build on top of.

We chose the constant-product AMM model because it is battle-tested (Uniswap V1/V2 have secured billions), mathematically elegant, and perfectly suited for a hackathon MVP that still demonstrates production-grade thinking.

## How it works

1. **Liquidity providers** deposit equal-value amounts of two tokens into the pool. They receive LP tokens proportional to their share.
2. **Traders** swap one token for another. The contract calculates the output using `amountOut = (reserveOut × amountIn × 997) / (reserveIn × 1000 + amountIn × 997)`, which enforces the constant product invariant while collecting a 0.3% fee.
3. **LP token holders** can burn their LP tokens at any time to withdraw their proportional share of both reserves — including accumulated fees.

The swap fee (0.3%) stays in the pool and is distributed pro-rata to all liquidity providers, creating a yield incentive for providing liquidity.

## Key Features

- Constant-product AMM (x · y = k) with 0.3% swap fee
- LP token minting/burning for liquidity management
- Slippage protection (configurable: 0.5%, 1%, 3%)
- Real-time price impact warnings
- Factory pattern for creating unlimited token pairs
- Built-in ERC-20 token faucet for instant testing
- One-click "Add OPN Testnet" to MetaMask
- Fully on-chain — no backend, no oracle, no off-chain dependency
- ReentrancyGuard + Checks-Effects-Interactions pattern
- Solidity 0.8.20 with built-in overflow protection

---

## Roadmap

### Q2 2026 — MVP (Current)
- Deploy core AMM contracts on OPN Chain Testnet
- Launch swap interface with real-time quotes
- Implement liquidity pool management UI
- Built-in faucet for test tokens
- Open-source codebase

### Q3 2026 — Multi-pair & Analytics
- Deploy router contract for multi-hop swaps (A → B → C)
- Token list registry for community-curated token metadata
- Analytics dashboard: TVL, volume, fees earned per pool
- Subgraph indexer for historical trade data

### Q4 2026 — Yield & Governance
- Liquidity mining program with OPN Swap governance token
- Fee-sharing mechanism for protocol sustainability
- Governance voting for fee parameters and token listings
- Mobile-optimized progressive web app

### 2027 — Advanced AMM
- Concentrated liquidity (Uniswap V3-style) for capital efficiency
- Limit orders via on-chain order book hybrid
- Cross-chain bridge integration for multi-chain liquidity
- Mainnet deployment on OPN Chain

---

## Built With

- Solidity 0.8.20
- Hardhat
- ethers.js v6
- HTML / CSS / JavaScript (no framework, zero build step)
- Deployed on OPN Chain Testnet (Chain ID: 984)
