# CircleChain ⭕ (Ajo / Esusu on Stellar)

CircleChain is a decentralized rotating savings and credit association (ROSCA) platform built on the **Stellar blockchain** using **Soroban smart contracts**, **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase** for off-chain metadata.

---

## 🏗 Repository Structure

```
Ajo/
├── ARCHITECTURE.md               # Detailed architectural specification & state machine design
├── README.md                     # Project overview and setup instructions
├── contracts/                    # Soroban smart contract source code (Rust)
│   ├── Cargo.toml                # Rust dependencies & Soroban SDK configuration
│   └── src/
│       ├── lib.rs                # Public contract entrypoints & interface
│       ├── types.rs              # Circle, Member, Status, and Payout data types
│       ├── circle.rs             # Circle creation & status query handlers
│       ├── member.rs             # Member registration & collateral deposit logic
│       ├── payout.rs             # Contribution collection & automated payout release logic
│       ├── default_logic.rs      # Grace period check, default handling & slashing
│       └── test.rs               # Comprehensive Rust test suite
├── frontend/                     # Next.js App Router frontend
│   ├── app/                      # Page routes (Dashboard, Circle Create/Discover, Profile)
│   ├── components/               # React components (Visual payment grid, payout timeline, wallet button)
│   └── lib/                      # Stellar SDK & Supabase client integration helpers
├── backend/                      # Node.js / Express API service scaffold
│   └── src/                      # Server entrypoint & notification endpoints
└── supabase/                     # Supabase database schemas & Row Level Security (RLS)
    ├── schema.sql                # SQL tables for off-chain metadata (circles, members, notifications)
    └── rls.sql                   # Supabase policies
```

---

## ⚡ Quickstart Guide

### 1. Smart Contracts (Soroban / Rust)

Ensure you have Rust and the Soroban CLI installed:
```bash
cargo install --locked soroban-cli
```

Build contracts:
```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

Run test suite:
```bash
cargo test
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Architectural Principle

- **Soroban Smart Contract:** Source of truth for all money movement, collateral staking, slashing, and cycle state transitions.
- **Supabase:** Read-only / descriptive off-chain metadata (names, descriptions, notifications, user profiles). **Never touches funds.**
