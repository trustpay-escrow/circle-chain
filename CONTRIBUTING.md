# Contributing to CircleChain ⭕

Thank you for your interest in contributing to CircleChain! CircleChain is a decentralized rotating savings and credit association (ROSCA) platform built on Stellar and Soroban.

---

## 🚀 Getting Started

1. **Fork & Clone**: Fork the repository on GitHub and clone your fork locally.
2. **Monorepo Setup**:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install

   # Soroban Smart Contracts (Rust)
   cd ../contracts
   cargo check
   ```

---

## 🛠️ Development Workflow

- **Branch Naming**: Use descriptive branch names:
  - `feat/feature-name`
  - `fix/bug-name`
  - `docs/documentation-update`
- **Code Verification**:
  - Run TypeScript type checks: `npx tsc --noEmit` in both `frontend` and `backend`.
  - Run Soroban smart contract tests: `cargo test` in `contracts`.
- **Commit Messages**: Follow Conventional Commits format:
  - `feat(frontend): add wallet connection modal`
  - `fix(backend): resolve Supabase connection retry logic`
  - `test(contracts): add slash collateral test case`

---

## 🌊 Drips Wave Maintainer Program

CircleChain issues are classified according to Drips complexity points:
- **Trivial (100 Points)**: Minor documentation updates, typos, UI styling adjustments.
- **Medium (150 Points)**: Standard feature additions, input validators, unit test suites.
- **High (200 Points)**: Soroban contract logic, async indexer queues, core state machine refactors.

When picking up an issue, please comment on the issue to request assignment before submitting a Pull Request.

Thank you for building decentralized ROSCA finance on Stellar! 🚀
