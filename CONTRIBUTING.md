# Contributing to CircleChain ⭕

Thank you for your interest in contributing to CircleChain! CircleChain is a decentralized Rotating Savings and Credit Association (ROSCA) platform built on the Stellar blockchain with Soroban smart contracts, Fastify backend, and Next.js frontend.

---

## 🌿 Designated Contribution Branch

> [!IMPORTANT]
> **All active development and community pull requests must target the `contributions` branch.**
> 
> The `main` branch is reserved strictly for production-ready, stable releases. Any PR opened directly against `main` will be asked to rebase and retarget to `contributions`.

### Quick Setup with the `contributions` Branch

```bash
# 1. Clone the repository
git clone https://github.com/trustpay-escrow/circle-chain.git
cd circle-chain

# 2. Check out and pull the latest contributions branch
git checkout contributions
git pull origin contributions

# 3. Create your dedicated topic branch off contributions
git checkout -b feat/your-feature-name
# or for bug fixes:
git checkout -b fix/issue-description
```

---

## 🚀 Getting Started & Local Setup

CircleChain is a monorepo containing three core components:

### 1. Backend Engine (Fastify 5 + Prisma + PostgreSQL 16)
```bash
cd backend
npm install --legacy-peer-deps
npx prisma generate
npm run dev           # Watch mode on http://localhost:4000
npm test              # Run Vitest test suite
npm run typecheck     # Verify strict TypeScript types
```
*API documentation and Swagger UI will be available at `http://localhost:4000/docs`.*

### 2. Frontend Web Application (Next.js 14 App Router)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev           # Next.js dev server on http://localhost:3000
npm test              # Run component test suite
```

### 3. Smart Contracts (Soroban Rust Wasm)
```bash
cd contracts
cargo check
cargo test            # Run 100% Soroban contract test suite
```

---

## 🛠️ Development & PR Workflow

1. **Keep in Sync**: Before pushing your work, sync with the latest upstream `contributions` branch:
   ```bash
   git fetch origin
   git rebase origin/contributions
   ```

2. **Branch Naming Conventions**:
   - `feat/feature-name` (New features)
   - `fix/bug-description` (Bug fixes)
   - `docs/documentation-update` (Docs improvements)
   - `refactor/component-name` (Refactoring & code cleanup)
   - `test/test-suite-name` (Adding or fixing tests)

3. **Pre-PR Verification Checklist**:
   - [ ] Backend tests passing: `npm --prefix backend test`
   - [ ] Backend typecheck clean: `npm --prefix backend run typecheck`
   - [ ] Frontend tests passing: `npm --prefix frontend test`
   - [ ] Contract tests passing: `cd contracts && cargo test`
   - [ ] Conventional Commit messages formatted properly.

4. **Submit Your Pull Request**:
   - Go to GitHub and open a Pull Request.
   - **Base branch**: Select `contributions` (NOT `main`).
   - **Compare branch**: Select your feature branch (e.g. `feat/your-feature-name`).
   - Link any related issue from [`docs/drips-wave-issues.json`](docs/drips-wave-issues.json) in your PR description.

---

## 📝 Commit Conventions

We strictly follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(backend): implement circle status webhook listener`
- `feat(frontend): add wallet connection modal`
- `fix(contracts): enforce minimum cycle collateral constraint`
- `docs(readme): update API probe reference table`
- `test(backend): add route integration tests with app.inject`

---

## 🌊 Drips Wave Maintainer Program

CircleChain issues are classified according to Drips complexity points:
- **Trivial (100 Points)**: Minor documentation updates, typos, UI styling adjustments.
- **Medium (150 Points)**: Standard feature additions, input validators, unit test suites.
- **High (200 Points)**: Soroban contract logic, async indexer queues, core state machine refactors.

Browse the 42 scoped issues in [`docs/drips-wave-issues.json`](docs/drips-wave-issues.json). When picking up an issue, please comment on the GitHub issue to request assignment before submitting a PR.

---

Thank you for building decentralized ROSCA finance on Stellar! 🚀
