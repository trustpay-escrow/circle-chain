# CircleChain Roadmap ⭕

## Phase 1: Core Soroban Contracts & Off-Chain Metadata (Completed)
- [x] Soroban Rust Smart Contracts for Rotating Savings and Credit Association (ROSCA).
- [x] Fixed payout, bidding, and randomized turn allocation engines.
- [x] Collateral staking and automated grace period default slashing mechanics.
- [x] Supabase off-chain metadata tables (`circles_metadata`, `user_profiles`, `contributions`, `notifications`).

## Phase 2: Frontend & Multi-Wallet Integration (Completed)
- [x] Next.js App Router frontend with modern glassmorphism styling and micro-animations.
- [x] Multi-wallet connector modal supporting Stellar Freighter, xBull, Albedo, and Rango wallets.
- [x] Visual Proof Matrix dashboard (`/circles/[id]`) tracking cycle payments.
- [x] Editable user profile & `@username` handle management.
- [x] Sonner toast notification alert integration.

## Phase 3: Drips Wave & Ecosystem Modernization (In Progress)
- [x] Open-source maintainer governance files (`LICENSE`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`).
- [x] Automated GitHub Actions CI pipeline (`.github/workflows/ci.yml`).
- [x] Local containerization (`docker-compose.yml`).
- [ ] Drips Wave Maintainer 42-Issue Engineering Backlog publication.
- [ ] Soroban RPC real-time event indexing worker daemon (BullMQ event consumer).

## Phase 4: Mainnet & Governance Expansion (Q3 2026)
- [ ] Soroban Mainnet smart contract deployment & third-party security audit.
- [ ] Soulbound Token (SBT) reputation badge minting on Stellar.
- [ ] Cross-chain bridge integration (USDC / XLM collateral pools).
- [ ] Decentralized Dispute Governance DAO for defaulted collateral claims.
