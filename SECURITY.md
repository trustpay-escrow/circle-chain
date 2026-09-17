# Security Policy 🔒

## Core Security Invariants

CircleChain operates under strict security and architectural invariants to safeguard user assets and decentralized rotating savings and credit association (ROSCA) pools:

1. **Non-Custodial Architecture**: Neither the frontend, Express backend, nor Supabase off-chain database ever has access to private keys or user fund balances. All money movement, collateral deposits, and pot payouts are executed exclusively via Soroban smart contracts on the Stellar blockchain.
2. **Soroban Contract Isolation**: Smart contract logic enforces strict state machine invariants (collateral staking before circle activation, grace periods, non-reentrant pot releases, and automated default slashing).
3. **Off-Chain Metadata Boundary**: Supabase off-chain tables store purely descriptive metadata (circle names, member avatars, UI history, and notifications). Off-chain data can never alter on-chain state or authorize fund movement.
4. **Environment Isolation**: Service role keys and administrative API credentials must never be committed to public source control or client-side bundles.

---

## Reporting a Vulnerability

We take the security of CircleChain smart contracts and backend infrastructure seriously. If you discover a security vulnerability, please report it privately:

- **Email**: `security@circlechain.network` or `maintainers@circlechain.network`
- **Response SLA**: We acknowledge receipt of vulnerability reports within **24 hours** and provide periodic updates on remediation progress.
- **Public Disclosure**: We request that you do not publicly disclose the issue until our maintainer team has patched and verified the vulnerability.

Thank you for helping keep CircleChain secure for all ROSCA participants!
